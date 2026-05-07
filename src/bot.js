'use strict'

const { Telegraf } = require('telegraf')
const config = require('./config')

const start = require('./handlers/start')
const menu = require('./handlers/menu')
const roles = require('./handlers/roles')
const weather = require('./handlers/weather')
const notes = require('./handlers/notes')
const reminders = require('./handlers/reminders')
const photo = require('./handlers/photo')
const voice = require('./handlers/voice')
const flashcards = require('./handlers/flashcards')
const textRouter = require('./handlers/text')

const morningWeather = require('./jobs/morningWeather')
const cardsReminder = require('./jobs/cardsReminder')
const reminderQueue = require('./services/reminderQueue')
const store = require('./storage')
const { buildWhitelistMiddleware } = require('./middleware/whitelist')
const webServer = require('./web/server')

let webHandle = null

function buildBot() {
    const bot = new Telegraf(config.botToken)

    // Глобальный обработчик ошибок — чтобы один баг не валил процесс.
    bot.catch((err, ctx) => {
        console.error(`Telegraf error for ${ctx.updateType}:`, err?.message || err)
    })

    // 1) Whitelist — отбрасываем чужих ещё до touchUser и хендлеров.
    bot.use(buildWhitelistMiddleware())

    // 2) touchUser — фиксируем юзера в БД (для статистики и веб-панели).
    bot.use((ctx, next) => {
        if (ctx.from) {
            try {
                store.touchUser(ctx.from.id, {
                    username: ctx.from.username || null,
                    firstName: ctx.from.first_name || null,
                })
            } catch (e) {
                console.error('touchUser error:', e.message)
            }
        }
        return next()
    })

    // Регистрация всех хендлеров.
    start.register(bot)
    menu.register(bot)
    roles.register(bot)
    weather.register(bot)
    notes.register(bot)
    reminders.register(bot)
    photo.register(bot)
    voice.register(bot)
    flashcards.register(bot)

    // text-роутер ставится последним — он ловит всё, что не матчится по hears.
    textRouter.register(bot)

    return bot
}

function startBackgroundJobs(bot) {
    morningWeather.schedule(bot)
    cardsReminder.schedule(bot)
    reminderQueue.restoreAll(bot)
    webHandle = webServer.start()
}

function stopBackgroundJobs() {
    reminderQueue.cancelAll()
    if (webHandle) {
        webHandle.close()
        webHandle = null
    }
}

module.exports = { buildBot, startBackgroundJobs, stopBackgroundJobs }
