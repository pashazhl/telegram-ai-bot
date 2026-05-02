require('dotenv').config()
const { Telegraf, Markup } = require('telegraf')
const OpenAI = require('openai')
const fs = require('fs')

const bot = new Telegraf(process.env.BOT_TOKEN)
const client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
})

const HISTORY_FILE = 'histories.json'

const SYSTEM_PROMPT = {
    role: 'system',
    content: `Ты полезный AI-ассистент. 
    ВАЖНО: Всегда отвечай ТОЛЬКО на русском языке, даже если пользователь пишет на другом языке.
    Никогда не переходи на английский или другой язык.
    Будь дружелюбным и лаконичным. Если не знаешь ответа — честно скажи об этом.`
}

function loadHistories() {
    if (fs.existsSync(HISTORY_FILE)) {
        const data = fs.readFileSync(HISTORY_FILE, 'utf-8')
        return JSON.parse(data)
    }
    return {}
}

function saveHistories(histories) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(histories, null, 2))
}

const histories = loadHistories()
const roles = {}

const mainMenu = Markup.keyboard([
    ['🧹 Очистить историю', '📊 Статистика'],
    ['🎭 Сменить роль', '❓ Помощь']
]).resize()

bot.start((ctx) => {
    ctx.reply('Привет! Я AI-бот. Напиши мне что-нибудь!', mainMenu)
})

bot.hears('🧹 Очистить историю', (ctx) => {
    const userId = String(ctx.from.id)
    histories[userId] = []
    saveHistories(histories)
    ctx.reply('История очищена! Начинаем заново 🧹', mainMenu)
})

bot.hears('❓ Помощь', (ctx) => {
    ctx.reply(
        'Я AI-ассистент. Вот что я умею:\n\n' +
        '🧹 Очистить историю — начать диалог заново\n' +
        '📊 Статистика — сколько сообщений ты отправил\n' +
        '🎭 Сменить роль — выбрать режим работы\n\n' +
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

bot.command('clear', (ctx) => {
    const userId = String(ctx.from.id)
    histories[userId] = []
    saveHistories(histories)
    ctx.reply('История очищена! 🧹', mainMenu)
})

bot.on('text', async (ctx) => {
    const userId = String(ctx.from.id)

    if (!histories[userId]) {
        histories[userId] = []
    }

    const userMessage = ctx.message.text
    histories[userId].push({ role: 'user', content: userMessage })

    await ctx.sendChatAction('typing')
// Ограничиваем историю до 20 последних сообщений
    if (histories[userId].length > 20) {
    histories[userId] = histories[userId].slice(-20)
    }
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

        saveHistories(histories)
        ctx.reply(reply, { ...mainMenu, parse_mode: 'Markdown' })
    } catch (error) {
        console.error(error)
        ctx.reply('Произошла ошибка, попробуй ещё раз!', mainMenu)
    }
})

bot.launch()
console.log('Бот запущен!')