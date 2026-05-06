'use strict'

/**
 * Общий text-роутер. Проверяет stateful-обработчики (погода, заметки,
 * напоминания), и если ни один не сработал — пускает в AI-чат.
 */

const weather = require('./weather')
const notes = require('./notes')
const reminders = require('./reminders')
const aiHandler = require('./ai')

function register(bot) {
    bot.on('text', async (ctx) => {
        if (await weather.handleTextIfWaiting(ctx)) return
        if (notes.handleTextIfWaiting(ctx)) return
        if (reminders.handleTextIfWaiting(ctx, bot)) return
        await aiHandler.handle(ctx)
    })
}

module.exports = { register }
