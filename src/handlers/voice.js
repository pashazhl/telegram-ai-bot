'use strict'

const { mainMenu } = require('../keyboards')
const voiceService = require('../services/voice')
const aiHandler = require('./ai')

function register(bot) {
    bot.on(['voice', 'audio'], async (ctx) => {
        if (!voiceService.isAvailable()) {
            return ctx.reply(
                '🎤 Голосовые сообщения отключены.\nДобавь OPENAI_API_KEY в .env, чтобы включить.',
                mainMenu,
            )
        }

        try {
            await ctx.sendChatAction('typing')

            const audio = ctx.message.voice || ctx.message.audio
            if (!audio?.file_id) return

            const fileLink = await ctx.telegram.getFileLink(audio.file_id)
            const text = await voiceService.transcribe(fileLink.href)

            if (!text || !text.trim()) {
                return ctx.reply('Не удалось распознать речь 🤷', mainMenu)
            }

            // Подменяем text в апдейте, чтобы переиспользовать общий AI-флоу.
            ctx.message.text = text

            // Отправим распознанный текст в превью + ответ от AI.
            await ctx.reply(`📝 Распознал:\n«${text}»`)
            await aiHandler.handle(ctx)
        } catch (e) {
            console.error('Voice error:', e?.message || e)
            ctx.reply('Не удалось обработать голосовое 😕', mainMenu)
        }
    })
}

module.exports = { register }
