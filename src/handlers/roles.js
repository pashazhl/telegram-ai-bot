'use strict'

const { mainMenu } = require('../keyboards')
const { ROLES } = require('../prompts')
const store = require('../storage')

const ROLE_BY_BUTTON = {
    '👨‍💻 Программист': { key: 'programmer', label: '👨‍💻 Программист', hint: 'Задавай вопросы про код!' },
    '💪 Тренер': { key: 'coach', label: '💪 Тренер', hint: 'Спрашивай про тренировки и питание!' },
    '🌍 Переводчик': {
        key: 'translator',
        label: '🌍 Переводчик',
        hint: 'Напиши текст и язык для перевода!',
    },
    '✍️ Редактор': { key: 'editor', label: '✍️ Редактор', hint: 'Пришли текст для проверки!' },
    '🤖 Обычный ассистент': { key: null, label: '🤖 Обычный ассистент', hint: '' },
}

function register(bot) {
    for (const [button, meta] of Object.entries(ROLE_BY_BUTTON)) {
        bot.hears(button, (ctx) => {
            const prompt = meta.key ? ROLES[meta.key] : null
            store.setRole(ctx.from.id, prompt)
            const tail = meta.hint ? ` ${meta.hint}` : ''
            ctx.reply(`Режим: ${meta.label}.${tail}`, mainMenu)
        })
    }
}

module.exports = { register }
