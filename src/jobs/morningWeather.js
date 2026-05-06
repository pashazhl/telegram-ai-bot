'use strict'

const cron = require('node-cron')
const config = require('../config')
const { fetchWeather, formatWeather } = require('../services/weather')

function schedule(bot) {
    if (!config.myTelegramId) {
        console.warn('MY_TELEGRAM_ID не задан — утренняя погода отключена.')
        return null
    }

    return cron.schedule(
        config.morningCron,
        async () => {
            try {
                const w = await fetchWeather(config.morningCity)
                const msg = formatWeather(w, {
                    greeting: `🌅 Доброе утро! Погода в ${w.name}:`,
                })
                await bot.telegram.sendMessage(config.myTelegramId, msg)
            } catch (e) {
                console.error('Ошибка при отправке утренней погоды:', e?.message || e)
            }
        },
        { timezone: config.timezone },
    )
}

module.exports = { schedule }
