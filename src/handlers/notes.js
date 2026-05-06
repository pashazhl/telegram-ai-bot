'use strict'

const { Markup } = require('telegraf')
const { mainMenu } = require('../keyboards')
const state = require('../state')
const store = require('../storage')

const WAIT_KEY = 'note'

function register(bot) {
    bot.hears('📝 Добавить заметку', (ctx) => {
        state.set(ctx.from.id, { kind: WAIT_KEY })
        ctx.reply('Напиши заметку:', Markup.forceReply())
    })

    bot.hears('📋 Мои заметки', (ctx) => {
        const list = store.getNotes(ctx.from.id)
        if (list.length === 0) {
            ctx.reply('У тебя пока нет заметок 📝', mainMenu)
        } else {
            const text = list.map((n, i) => `${i + 1}. ${n}`).join('\n')
            ctx.reply(`📋 Твои заметки:\n\n${text}`, mainMenu)
        }
    })

    bot.hears('🗑 Удалить заметки', (ctx) => {
        store.clearNotes(ctx.from.id)
        ctx.reply('Все заметки удалены! 🗑', mainMenu)
    })
}

function handleTextIfWaiting(ctx) {
    const s = state.get(ctx.from.id)
    if (!s || s.kind !== WAIT_KEY) return false
    state.clear(ctx.from.id)
    store.addNote(ctx.from.id, ctx.message.text)
    ctx.reply('Заметка сохранена! 📝', mainMenu)
    return true
}

module.exports = { register, handleTextIfWaiting }
