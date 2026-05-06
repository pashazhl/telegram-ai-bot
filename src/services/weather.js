'use strict'

const axios = require('axios')
const config = require('../config')

const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather'

async function fetchWeather(city) {
    const res = await axios.get(BASE_URL, {
        params: {
            q: city,
            appid: config.weatherKey,
            units: 'metric',
            lang: 'ru',
        },
        timeout: 10000,
    })
    return res.data
}

function formatWeather(w, { greeting = null } = {}) {
    const head = greeting ? `${greeting}\n\n` : `🌤 Погода в ${w.name}:\n\n`
    return (
        head +
        `🌡 Температура: ${Math.round(w.main.temp)}°C\n` +
        `🤔 Ощущается как: ${Math.round(w.main.feels_like)}°C\n` +
        `💧 Влажность: ${w.main.humidity}%\n` +
        `💨 Ветер: ${w.wind.speed} м/с\n` +
        `☁️ ${w.weather[0].description}`
    )
}

module.exports = { fetchWeather, formatWeather }
