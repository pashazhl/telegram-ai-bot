require('dotenv').config()
const { Telegraf, Markup } = require('telegraf')
const OpenAI = require('openai')
const fs = require('fs')
const axios = require('axios')

const bot = new Telegraf(process.env.BOT_TOKEN)
const client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
})

const HISTORY_FILE = 'histories.json'
const NOTES_FILE = 'notes.json'

const SYSTEM_PROMPT = {
    role: 'system',
    content: `Ты полезный AI-ассистент. 
    ВАЖНО: Всегда отвечай ТОЛЬКО на русском языке, даже если пользователь пишет на другом языке.
    Никогда не переходи на английский или другой язык.
    Будь дружелюбным и лаконичным. Если не знаешь ответа — честно скажи об этом.`
}

function loadJSON(file) {
    if (fs.existsSync(file)) {
        return JSON.parse(fs.readFileSync(file, 'utf-8'))
    }
    return {}
}

function saveJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

const histories = loadJSON(HISTORY_FILE)
const notes = loadJSON(NOTES_FILE)
const roles = {}
const waitingFor = {}

const mainMenu = Markup.keyboard([
    ['🧹 Очистить историю', '📊 Статистика'],
    ['🎭 Сменить роль', '❓ Помощь'],
    ['🌤 Погода', '📝 Заметки'],
    ['⏰ Напоминание']
]).resize()

bot.start((ctx) => {
    ctx.reply('Привет! Я AI-бот. Напиши мне что-нибудь!', mainMenu)
})

bot.hears('🧹 Очистить историю', (ctx) => {
    const userId = String(ctx.from.id)
    histories[userId] = []
    saveJSON(HISTORY_FILE, histories)
    ctx.reply('История очищена! 🧹', mainMenu)
})

bot.hears('❓ Помощь', (ctx) => {
    ctx.reply(
        'Я AI-ассистент. Вот что я умею:\n\n' +
        '🧹 Очистить историю — начать диалог заново\n' +
        '📊 Статистика — сколько сообщений ты отправил\n' +
        '🎭 Сменить роль — выбрать режим работы\n' +
        '🌤 Погода — узнать погоду в любом городе\n' +
        '📝 Заметки — сохранять и читать заметки\n' +
        '⏰ Напоминание — напомнить о чём-то через время\n\n' +
        'Просто напиши мне что-нибудь!',
        mainMenu
    )
})

bot.hears('📊 Статистика', (ctx) => {
    const userId = String(ctx.from.id)
    const history = histories[userId] || []
    const userMessages = history.filter(m => m.role === 'user').length
    ctx.reply(`📊 Твоя статистика:\nСообщений отправлено: ${userMessages}`, mainMenu)
})

bot.hears('🎭 Сменить роль', (ctx) => {
    ctx.reply('Выбери роль:', Markup.keyboard([
        ['👨‍💻 Программист', '💪 Тренер'],
        ['🌍 Переводчик', '✍️ Редактор'],
        ['🤖 Обычный ассистент']
    ]).resize())
})

bot.hears('👨‍💻 Программист', (ctx) => {
    const userId = String(ctx.from.id)
    roles[userId] = 'Ты опытный программист. Помогаешь с кодом, объясняешь технические концепции простым языком. Всегда отвечай на русском языке.'
    ctx.reply('Режим: 👨‍💻 Программист. Задавай вопросы про код!', mainMenu)
})

bot.hears('💪 Тренер', (ctx) => {
    const userId = String(ctx.from.id)
    roles[userId] = 'Ты личный фитнес-тренер. Даёшь советы по тренировкам, питанию и здоровому образу жизни. Всегда отвечай на русском языке.'
    ctx.reply('Режим: 💪 Тренер. Спрашивай про тренировки и питание!', mainMenu)
})

bot.hears('🌍 Переводчик', (ctx) => {
    const userId = String(ctx.from.id)
    roles[userId] = 'Ты профессиональный переводчик. Переводишь тексты на любой язык который просит пользователь. Объясняешь нюансы перевода.'
    ctx.reply('Режим: 🌍 Переводчик. Напиши текст и язык для перевода!', mainMenu)
})

bot.hears('✍️ Редактор', (ctx) => {
    const userId = String(ctx.from.id)
    roles[userId] = 'Ты строгий редактор. Исправляешь тексты, улучшаешь стиль и грамматику. Всегда отвечай на русском языке.'
    ctx.reply('Режим: ✍️ Редактор. Пришли текст для проверки!', mainMenu)
})

bot.hears('🤖 Обычный ассистент', (ctx) => {
    const userId = String(ctx.from.id)
    roles[userId] = null
    ctx.reply('Режим: 🤖 Обычный ассистент.', mainMenu)
})

// 🌤 Погода
bot.hears('🌤 Погода', (ctx) => {
    const userId = String(ctx.from.id)
    waitingFor[userId] = 'weather'
    ctx.reply('Напиши название города:', Markup.forceReply())
})

// 📝 Заметки
bot.hears('📝 Заметки', (ctx) => {
    ctx.reply('Выбери действие:', Markup.keyboard([
        ['📝 Добавить заметку', '📋 Мои заметки'],
        ['🗑 Удалить заметки', '🔙 Назад']
    ]).resize())
})

bot.hears('📝 Добавить заметку', (ctx) => {
    const userId = String(ctx.from.id)
    waitingFor[userId] = 'note'
    ctx.reply('Напиши заметку:', Markup.forceReply())
})

bot.hears('📋 Мои заметки', (ctx) => {
    const userId = String(ctx.from.id)
    const userNotes = notes[userId] || []
    if (userNotes.length === 0) {
        ctx.reply('У тебя пока нет заметок 📝', mainMenu)
    } else {
        const text = userNotes.map((n, i) => `${i + 1}. ${n}`).join('\n')
        ctx.reply(`📋 Твои заметки:\n\n${text}`, mainMenu)
    }
})

bot.hears('🗑 Удалить заметки', (ctx) => {
    const userId = String(ctx.from.id)
    notes[userId] = []
    saveJSON(NOTES_FILE, notes)
    ctx.reply('Все заметки удалены! 🗑', mainMenu)
})

bot.hears('🔙 Назад', (ctx) => {
    ctx.reply('Главное меню:', mainMenu)
})

// ⏰ Напоминания
bot.hears('⏰ Напоминание', (ctx) => {
    const userId = String(ctx.from.id)
    waitingFor[userId] = 'reminder_text'
    ctx.reply('О чём напомнить?', Markup.forceReply())
})

bot.command('clear', (ctx) => {
    const userId = String(ctx.from.id)
    histories[userId] = []
    saveJSON(HISTORY_FILE, histories)
    ctx.reply('История очищена! 🧹', mainMenu)
})

bot.on('text', async (ctx) => {
    const userId = String(ctx.from.id)
    const text = ctx.message.text

    // Погода
    if (waitingFor[userId] === 'weather') {
        waitingFor[userId] = null
        try {
            const res = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
                params: {
                    q: text,
                    appid: process.env.WEATHER_API_KEY,
                    units: 'metric',
                    lang: 'ru'
                }
            })
            const w = res.data
            const msg = `🌤 Погода в ${w.name}:\n\n` +
                `🌡 Температура: ${Math.round(w.main.temp)}°C\n` +
                `🤔 Ощущается как: ${Math.round(w.main.feels_like)}°C\n` +
                `💧 Влажность: ${w.main.humidity}%\n` +
                `💨 Ветер: ${w.wind.speed} м/с\n` +
                `☁️ ${w.weather[0].description}`
            ctx.reply(msg, mainMenu)
        } catch (e) {
            ctx.reply('Город не найден, попробуй ещё раз 🌍', mainMenu)
        }
        return
    }

    // Заметки
    if (waitingFor[userId] === 'note') {
        waitingFor[userId] = null
        if (!notes[userId]) notes[userId] = []
        notes[userId].push(text)
        saveJSON(NOTES_FILE, notes)
        ctx.reply('Заметка сохранена! 📝', mainMenu)
        return
    }

    // Напоминание — текст
    if (waitingFor[userId] === 'reminder_text') {
        waitingFor[userId] = { step: 'reminder_time', text }
    ctx.reply(
    'Через сколько времени напомнить?\n\nМожешь написать любое время:\n— 30 минут\n— 2 часа\n— 3 дня\n— 1 неделю\n— 2 месяца\n— 1 год',
    mainMenu
    )
        return
    }

    // Напоминание — время
    // Напоминание — время
    if (waitingFor[userId]?.step === 'reminder_time') {
    const reminderText = waitingFor[userId].text
    waitingFor[userId] = null

    // Парсим время из текста
    const timeRegex = /(\d+)\s*(мин|минут|час|часов|ч|день|дней|дня|неделю|недель|месяц|месяцев|год|лет)/i
    const match = text.match(timeRegex)

    if (!match) {
        ctx.reply('Не понял время 😕\n\nПиши так:\n— 30 минут\n— 2 часа\n— 3 дня\n— 1 неделю\n— 2 месяца\n— 1 год', mainMenu)
        return
    }

    const value = parseInt(match[1])
    const unit = match[2].toLowerCase()

    let ms = 0
    if (['мин', 'минут'].includes(unit)) ms = value * 60 * 1000
    else if (['час', 'часов', 'ч'].includes(unit)) ms = value * 60 * 60 * 1000
    else if (['день', 'дней', 'дня'].includes(unit)) ms = value * 24 * 60 * 60 * 1000
    else if (['неделю', 'недель'].includes(unit)) ms = value * 7 * 24 * 60 * 60 * 1000
    else if (['месяц', 'месяцев'].includes(unit)) ms = value * 30 * 24 * 60 * 60 * 1000
    else if (['год', 'лет'].includes(unit)) ms = value * 365 * 24 * 60 * 60 * 1000

    ctx.reply(`⏰ Напомню через ${value} ${unit}: "${reminderText}"`, mainMenu)

    setTimeout(() => {
        bot.telegram.sendMessage(userId, `⏰ Напоминание!\n\n${reminderText}`)
    }, ms)

    return
}

    // AI чат
    if (!histories[userId]) histories[userId] = []
    histories[userId].push({ role: 'user', content: text })

    if (histories[userId].length > 20) {
        histories[userId] = histories[userId].slice(-20)
    }

    await ctx.sendChatAction('typing')

    const systemPrompt = roles[userId]
        ? { role: 'system', content: roles[userId] }
        : SYSTEM_PROMPT

    try {
        const response = await client.chat.completions.create({
            model: 'openrouter/free',
            messages: [systemPrompt, ...histories[userId]],
        })

        const reply = response.choices[0].message.content
        histories[userId].push({ role: 'assistant', content: reply })

        saveJSON(HISTORY_FILE, histories)
        ctx.reply(reply, { ...mainMenu, parse_mode: 'Markdown' })
    } catch (error) {
        console.error(error)
        ctx.reply('Произошла ошибка, попробуй ещё раз!', mainMenu)
    }
})
const cron = require('node-cron')

// Каждый день в 6:30 утра отправляем погоду
cron.schedule('30 6 * * *', async () => {
    try {
        const res = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
            params: {
                q: 'Minsk',
                appid: process.env.WEATHER_API_KEY,
                units: 'metric',
                lang: 'ru'
            }
        })
        const w = res.data
        const msg = `🌅 Доброе утро! Погода в Минске:\n\n` +
            `🌡 Температура: ${Math.round(w.main.temp)}°C\n` +
            `🤔 Ощущается как: ${Math.round(w.main.feels_like)}°C\n` +
            `💧 Влажность: ${w.main.humidity}%\n` +
            `💨 Ветер: ${w.wind.speed} м/с\n` +
            `☁️ ${w.weather[0].description}`

        // Отправляем тебе — замени на свой Telegram ID
        await bot.telegram.sendMessage(process.env.MY_TELEGRAM_ID, msg)
    } catch (e) {
        console.error('Ошибка при отправке погоды:', e)
    }
}, {
    timezone: 'Europe/Minsk'
})

// 🖼 Анализ фото
bot.on('photo', async (ctx) => {
    try {
        await ctx.sendChatAction('typing')

        // Получаем файл фото
        const photo = ctx.message.photo[ctx.message.photo.length - 1]
        const fileLink = await ctx.telegram.getFileLink(photo.file_id)
        const imageUrl = fileLink.href

        const response = await client.chat.completions.create({
            model: 'google/gemma-4-26b-a4b-it:free',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image_url',
                            image_url: { url: imageUrl }
                        },
                        {
                            type: 'text',
                            text: 'Опиши подробно что ты видишь на этом изображении. Отвечай на русском языке.'
                        }
                    ]
                }
            ]
        })

        const reply = response.choices[0].message.content
        ctx.reply(reply, mainMenu)
    } catch (error) {
        console.error(error)
        ctx.reply('Не удалось проанализировать фото, попробуй ещё раз!', mainMenu)
    }
})

bot.launch()
console.log('Бот запущен!')