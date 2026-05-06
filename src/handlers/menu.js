'use strict'

const { mainMenu, rolesMenu, notesMenu } = require('../keyboards')
const store = require('../storage')
const state = require('../state')

function register(bot) {
    bot.hears('🧹 Очистить историю', (ctx) => {
        store.clearHistory(ctx.from.id)
        state.clear(ctx.from.id)
        ctx.reply('История очищена! 🧹', mainMenu)
    })

    bot.command('clear', (ctx) => {
        store.clearHistory(ctx.from.id)
        state.clear(ctx.from.id)
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
            mainMenu,
        )
    })

    bot.hears('📊 Статистика', (ctx) => {
        const count = store.countUserMessages(ctx.from.id)
        ctx.reply(`📊 Твоя статистика:\nСообщений отправлено: ${count}`, mainMenu)
    })

    bot.hears('🎭 Сменить роль', (ctx) => {
        ctx.reply('Выбери роль:', rolesMenu)
    })

    bot.hears('📝 Заметки', (ctx) => {
        ctx.reply('Выбери действие:', notesMenu)
    })

    bot.hears('🔙 Назад', (ctx) => {
        state.clear(ctx.from.id)
        ctx.reply('Главное меню:', mainMenu)
    })
}

module.exports = { register }
