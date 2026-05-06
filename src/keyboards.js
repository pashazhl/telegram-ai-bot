'use strict'

const { Markup } = require('telegraf')

const mainMenu = Markup.keyboard([
    ['🧹 Очистить историю', '📊 Статистика'],
    ['🎭 Сменить роль', '❓ Помощь'],
    ['🌤 Погода', '📝 Заметки'],
    ['⏰ Напоминание'],
]).resize()

const rolesMenu = Markup.keyboard([
    ['👨‍💻 Программист', '💪 Тренер'],
    ['🌍 Переводчик', '✍️ Редактор'],
    ['🤖 Обычный ассистент'],
    ['🔙 Назад'],
]).resize()

const notesMenu = Markup.keyboard([
    ['📝 Добавить заметку', '📋 Мои заметки'],
    ['🗑 Удалить заметки', '🔙 Назад'],
]).resize()

module.exports = { mainMenu, rolesMenu, notesMenu }
