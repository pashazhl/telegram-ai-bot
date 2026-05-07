'use strict'

const { mainMenu, mentorMenu, rolesMenu } = require('../keyboards')
const { ROLES } = require('../prompts')
const store = require('../storage')

// Подменю «Наставник» → 4 sub-режима. После выбора сбрасываем историю,
// чтобы AI не тащил контекст из прошлого диалога другой роли.
const MENTOR_BUTTONS = {
    '🧑‍🏫 Объясни концепт': {
        key: 'mentor_explain',
        label: '🧑‍🏫 Объясни концепт',
        hint: 'Скажи, какую тему хочешь разобрать (например: "что такое closures").',
    },
    '🐛 Разбери проблему': {
        key: 'mentor_debug',
        label: '🐛 Разбери проблему',
        hint: 'Опиши что не работает: что ожидаешь, что получаешь, текст ошибки.',
    },
    '🔍 Сделай ревью': {
        key: 'mentor_review',
        label: '🔍 Сделай ревью',
        hint: 'Пришли код одним сообщением — разберём что хорошо и что улучшить.',
    },
    '🎯 Дай задачу': {
        key: 'mentor_challenge',
        label: '🎯 Дай задачу',
        hint: 'Скажи на чём сейчас фокус (например: "async/await на Node.js"), пришлю задачу.',
    },
}

const OTHER_ROLE_BUTTONS = {
    '💪 Тренер': { key: 'coach', label: '💪 Тренер', hint: 'Спрашивай про тренировки и питание.' },
    '🌍 Переводчик': {
        key: 'translator',
        label: '🌍 Переводчик',
        hint: 'Напиши текст и язык для перевода.',
    },
    '✍️ Редактор': { key: 'editor', label: '✍️ Редактор', hint: 'Пришли текст для проверки.' },
    '🤖 Обычный': { key: null, label: '🤖 Обычный ассистент', hint: '' },
}

function register(bot) {
    // Главное меню → Наставник
    bot.hears('🧑‍🏫 Наставник', (ctx) => {
        ctx.reply(
            'Что нужно сейчас?\n\n' +
                '🧑‍🏫 Объясни концепт — разберём как работает что-то\n' +
                '🐛 Разбери проблему — у меня что-то не работает\n' +
                '🔍 Сделай ревью — посмотри мой код\n' +
                '🎯 Дай задачу — хочу попрактиковаться',
            mentorMenu,
        )
    })

    // Главное меню → Другие роли
    bot.hears('🎭 Другие роли', (ctx) => {
        ctx.reply('Выбери роль:', rolesMenu)
    })

    // Кнопки наставника
    for (const [button, meta] of Object.entries(MENTOR_BUTTONS)) {
        bot.hears(button, (ctx) => {
            store.setRole(ctx.from.id, ROLES[meta.key])
            // Сбрасываем историю при смене режима — иначе старый контекст
            // мешает наставнику выйти из своего нового подхода.
            store.clearHistory(ctx.from.id)
            ctx.reply(
                `Включён режим: ${meta.label}.\n\n${meta.hint}`,
                mainMenu,
            )
        })
    }

    // Кнопки других ролей
    for (const [button, meta] of Object.entries(OTHER_ROLE_BUTTONS)) {
        bot.hears(button, (ctx) => {
            const prompt = meta.key ? ROLES[meta.key] : null
            store.setRole(ctx.from.id, prompt)
            const tail = meta.hint ? `\n\n${meta.hint}` : ''
            ctx.reply(`Режим: ${meta.label}.${tail}`, mainMenu)
        })
    }
}

module.exports = { register }
