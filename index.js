require('dotenv').config()
const { Telegraf } = require('telegraf')
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
    content: `Ты полезный AI-ассистент. Отвечай всегда на русском языке. 
    Будь дружелюбным и лаконичным. Если не знаешь ответа — честно скажи об этом.`
}

// Загружаем историю из файла при старте
function loadHistories() {
    if (fs.existsSync(HISTORY_FILE)) {
        const data = fs.readFileSync(HISTORY_FILE, 'utf-8')
        return JSON.parse(data)
    }
    return {}
}

// Сохраняем историю в файл
function saveHistories(histories) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(histories, null, 2))
}

const histories = loadHistories()

bot.start((ctx) => {
    ctx.reply('Привет! Я AI-бот. Напиши мне что-нибудь!')
})

bot.command('clear', (ctx) => {
    const userId = String(ctx.from.id)
    histories[userId] = []
    saveHistories(histories)
    ctx.reply('История очищена! Начинаем заново 🧹')
})

bot.on('text', async (ctx) => {
    const userId = String(ctx.from.id)

    if (!histories[userId]) {
        histories[userId] = []
    }

    const userMessage = ctx.message.text
    histories[userId].push({ role: 'user', content: userMessage })

    await ctx.sendChatAction('typing')

    try {
        const response = await client.chat.completions.create({
            model: 'openrouter/free',
            messages: [SYSTEM_PROMPT, ...histories[userId]],
        })

        const reply = response.choices[0].message.content
        histories[userId].push({ role: 'assistant', content: reply })

        saveHistories(histories)
        ctx.reply(reply)
    } catch (error) {
        console.error(error)
        ctx.reply('Произошла ошибка, попробуй ещё раз!')
    }
})

bot.launch()
console.log('Бот запущен!')
