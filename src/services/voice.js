'use strict'

const fs = require('fs')
const os = require('os')
const path = require('path')
const crypto = require('crypto')
const axios = require('axios')
const OpenAI = require('openai')
const config = require('../config')

let _client = null
function client() {
    if (!config.openAIKey) return null
    if (!_client) _client = new OpenAI({ apiKey: config.openAIKey })
    return _client
}

function isAvailable() {
    return Boolean(config.openAIKey)
}

/**
 * Скачивает файл с Telegram-серверов во временный файл и возвращает путь.
 * Защищается от слишком больших файлов.
 */
async function downloadToTmp(url, ext = '.ogg') {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 30_000 })
    const buf = Buffer.from(res.data)
    if (buf.length > config.voiceMaxBytes) {
        throw new Error(`Файл слишком большой (${buf.length} байт)`)
    }
    const name = `voice-${crypto.randomBytes(8).toString('hex')}${ext}`
    const tmp = path.join(os.tmpdir(), name)
    fs.writeFileSync(tmp, buf)
    return tmp
}

/**
 * Распознаёт голосовое сообщение через OpenAI Whisper.
 * Возвращает текст или бросает исключение.
 */
async function transcribe(fileUrl, { language = 'ru' } = {}) {
    const c = client()
    if (!c) throw new Error('OPENAI_API_KEY не задан — STT отключён')

    const tmpPath = await downloadToTmp(fileUrl, '.ogg')
    try {
        const result = await c.audio.transcriptions.create({
            file: fs.createReadStream(tmpPath),
            model: config.sttModel,
            language,
        })
        return result.text
    } finally {
        fs.unlink(tmpPath, () => {}) // best-effort cleanup
    }
}

module.exports = { isAvailable, transcribe }
