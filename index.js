'use strict'

const { buildBot, startBackgroundJobs, stopBackgroundJobs } = require('./src/bot')

const bot = buildBot()
startBackgroundJobs(bot)

bot.launch().then(() => {
    console.log('Бот запущен!')
})

// Graceful shutdown — Telegraf отписывается от updates, таймеры чистятся.
function shutdown(signal) {
    console.log(`Получен ${signal}, останавливаюсь...`)
    stopBackgroundJobs()
    bot.stop(signal)
}

process.once('SIGINT', () => shutdown('SIGINT'))
process.once('SIGTERM', () => shutdown('SIGTERM'))
