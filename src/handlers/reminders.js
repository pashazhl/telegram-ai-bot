'use strict'

const { Markup } = require('telegraf')
const { mainMenu } = require('../keyboards')
const state = require('../state')
const { parseDuration } = require('../utils/time')
const reminderQueue = require('../services/reminderQueue')

const STEP_TEXT = 'reminder_text'
const STEP_TIME = 'reminder_time'

function register(bot) {
    bot.hears('⏰ Напоминание', (ctx) => {
        state.set(ctx.from.id, { kind: STEP_TEXT })
        ctx.reply('О чём напомнить?', Markup.forceReply())
    })
}

function handleTextIfWaiting(ctx, bot) {
    const s = state.get(ctx.from.id)
    if (!s) return false

    if (s.kind === STEP_TEXT) {
        const text = String(ctx.message.text).slice(0, 1000) // защита от мегатекста
        state.set(ctx.from.id, { kind: STEP_TIME, text })
        ctx.reply(
            'Через сколько времени напомнить?\n\nМожешь написать любое время:\n— 30 минут\n— 2 часа\n— 3 дня\n— 1 неделю\n— 2 месяца\n— 1 год',
            mainMenu,
        )
        return true
    }

    if (s.kind === STEP_TIME) {
        const reminderText = s.text
        state.clear(ctx.from.id)

        const parsed = parseDuration(ctx.message.text)
        if (!parsed) {
            ctx.reply(
                'Не понял время 😕\n\nПиши так:\n— 30 минут\n— 2 часа\n— 3 дня\n— 1 неделю\n— 2 месяца\n— 1 год',
                mainMenu,
            )
            return true
        }

        try {
            reminderQueue.create(bot, ctx.from.id, reminderText, parsed.ms)
            ctx.reply(
                `⏰ Напомню через ${parsed.value} ${parsed.unit}: "${reminderText}"`,
                mainMenu,
            )
        } catch (e) {
            console.error('Reminder create error:', e.message)
            ctx.reply('Не удалось создать напоминание, попробуй ещё раз.', mainMenu)
        }

        return true
    }

    return false
}

module.exports = { register, handleTextIfWaiting }
