'use strict'

const { Markup } = require('telegraf')
const { mainMenu } = require('../keyboards')
const state = require('../state')
const { fetchWeather, formatWeather } = require('../services/weather')

const WAIT_KEY = 'weather'

function register(bot) {
    bot.hears('🌤 Погода', (ctx) => {
        state.set(ctx.from.id, { kind: WAIT_KEY })
        ctx.reply('Напиши название города:', Markup.forceReply())
    })
}

/**
 * Возвращает true если сообщение было обработано как ввод города.
 * Регистрируется не через bot.hears, а в общем text-роутере.
 */
async function handleTextIfWaiting(ctx) {
    const s = state.get(ctx.from.id)
    if (!s || s.kind !== WAIT_KEY) return false
    state.clear(ctx.from.id)
    try {
        const w = await fetchWeather(ctx.message.text)
        ctx.reply(formatWeather(w), mainMenu)
    } catch (e) {
        ctx.reply('Город не найден, попробуй ещё раз 🌍', mainMenu)
    }
    return true
}

module.exports = { register, handleTextIfWaiting }
