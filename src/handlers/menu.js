'use strict'

const { mainMenu, notesMenu, cardsMenu } = require('../keyboards')
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
            'Я твой AI-помощник по обучению программированию.\n\n' +
                '🧑‍🏫 Наставник — учитель, который ведёт тебя через материал ' +
                '(объясняет концепты, разбирает баги, делает ревью, даёт задачи).\n' +
                '📇 Карточки — записи в формате вопрос/ответ. Бот напоминает ' +
                'их повторить по интервалам (spaced repetition).\n' +
                '📝 Заметки — короткие пометки на потом.\n' +
                '⏰ Напоминание — пинг через любое время, переживает рестарт.\n' +
                '🌤 Погода — по любому городу + утренний прогноз в 6:30.\n' +
                '🎭 Другие роли — переводчик, редактор, тренер.\n' +
                '📊 Статистика — сколько сообщений ты отправил.\n' +
                '🧹 Очистить историю — начать диалог заново.\n\n' +
                'Можно говорить голосом — распознаю и отвечу.',
            mainMenu,
        )
    })

    bot.hears('📊 Статистика', (ctx) => {
        const count = store.countUserMessages(ctx.from.id)
        ctx.reply(`📊 Твоя статистика:\nСообщений отправлено: ${count}`, mainMenu)
    })

    bot.hears('📝 Заметки', (ctx) => {
        ctx.reply('Выбери действие:', notesMenu)
    })

    bot.hears('📇 Карточки', (ctx) => {
        ctx.reply('Карточки знаний — что делаем?', cardsMenu)
    })

    bot.hears('🔙 Назад', (ctx) => {
        state.clear(ctx.from.id)
        ctx.reply('Главное меню:', mainMenu)
    })
}

module.exports = { register }
