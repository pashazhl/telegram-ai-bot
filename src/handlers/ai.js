'use strict'

const { mainMenu } = require('../keyboards')
const store = require('../storage')
const { DEFAULT_SYSTEM_PROMPT } = require('../prompts')
const ai = require('../services/ai')

async function handle(ctx) {
    const userId = ctx.from.id
    const text = ctx.message.text

    store.appendHistory(userId, { role: 'user', content: text })

    await ctx.sendChatAction('typing')

    const customRole = store.getRole(userId)
    const systemPrompt = customRole
        ? { role: 'system', content: customRole }
        : { role: 'system', content: DEFAULT_SYSTEM_PROMPT }

    try {
        const reply = await ai.chat([systemPrompt, ...store.getHistory(userId)])
        store.appendHistory(userId, { role: 'assistant', content: reply })
        await ctx.reply(reply, { ...mainMenu, parse_mode: 'Markdown' })
    } catch (error) {
        // Если упало форматирование Markdown — пробуем без него.
        if (error?.description?.includes("can't parse entities")) {
            try {
                const reply = await ai.chat([systemPrompt, ...store.getHistory(userId)])
                await ctx.reply(reply, mainMenu)
                return
            } catch (_) {}
        }
        console.error('AI error:', error?.message || error)
        ctx.reply('Произошла ошибка, попробуй ещё раз!', mainMenu)
    }
}

module.exports = { handle }
