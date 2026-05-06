'use strict'

require('dotenv').config()

const required = ['BOT_TOKEN', 'OPENROUTER_API_KEY', 'WEATHER_API_KEY']
const missing = required.filter((k) => !process.env[k])
if (missing.length) {
    console.error(`Не хватает переменных окружения: ${missing.join(', ')}`)
    console.error('Скопируй .env.example в .env и заполни значения')
    process.exit(1)
}

function parseIds(value) {
    if (!value) return []
    return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
}

const myId = process.env.MY_TELEGRAM_ID ? String(process.env.MY_TELEGRAM_ID).trim() : null
const allowedIds = new Set(parseIds(process.env.ALLOWED_USER_IDS))
if (myId) allowedIds.add(myId)

module.exports = {
    botToken: process.env.BOT_TOKEN,
    openRouterKey: process.env.OPENROUTER_API_KEY,
    weatherKey: process.env.WEATHER_API_KEY,
    myTelegramId: myId,
    // Если allowedIds пустой — бот разрешает всех (обратная совместимость).
    // Если в .env задан хотя бы один ID — работает только whitelist.
    allowedUserIds: allowedIds,
    timezone: process.env.TZ || 'Europe/Minsk',
    morningCity: process.env.MORNING_CITY || 'Minsk',
    morningCron: process.env.MORNING_CRON || '30 6 * * *',
    historyLimit: Number(process.env.HISTORY_LIMIT || 20),
    aiModel: process.env.AI_MODEL || 'openrouter/auto',
    visionModel: process.env.VISION_MODEL || 'google/gemini-2.0-flash-exp:free',
    // Голос: OpenAI ключ для Whisper STT (опционально). Если пусто — voice отключены.
    openAIKey: process.env.OPENAI_API_KEY || null,
    sttModel: process.env.STT_MODEL || 'whisper-1',
    // Лимит размера файла голосовухи в байтах (Telegram отдаёт обычно <1MB, но защитимся).
    voiceMaxBytes: Number(process.env.VOICE_MAX_BYTES || 5 * 1024 * 1024),
    // Веб-панель: если adminToken не задан, веб-сервер не запускается.
    adminToken: process.env.ADMIN_TOKEN || null,
}
