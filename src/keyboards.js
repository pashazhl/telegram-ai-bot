'use strict'

const { Markup } = require('telegraf')

const mainMenu = Markup.keyboard([
    ['🧑‍🏫 Наставник', '📇 Карточки'],
    ['🌤 Погода', '📝 Заметки'],
    ['⏰ Напоминание', '🎭 Другие роли'],
    ['📊 Статистика', '❓ Помощь'],
    ['🧹 Очистить историю'],
]).resize()

const mentorMenu = Markup.keyboard([
    ['🧑‍🏫 Объясни концепт', '🐛 Разбери проблему'],
    ['🔍 Сделай ревью', '🎯 Дай задачу'],
    ['🔙 Назад'],
]).resize()

const rolesMenu = Markup.keyboard([
    ['💪 Тренер', '🌍 Переводчик'],
    ['✍️ Редактор', '🤖 Обычный'],
    ['🔙 Назад'],
]).resize()

const notesMenu = Markup.keyboard([
    ['📝 Добавить заметку', '📋 Мои заметки'],
    ['🗑 Удалить заметки', '🔙 Назад'],
]).resize()

const cardsMenu = Markup.keyboard([
    ['🔁 Повторить', '➕ Создать'],
    ['📊 Статистика карточек', '🔙 Назад'],
]).resize()

const cardsRatingMenu = Markup.keyboard([
    ['❌ Снова', '😓 Сложно'],
    ['👍 Норма', '✨ Легко'],
]).resize()

module.exports = {
    mainMenu,
    mentorMenu,
    rolesMenu,
    notesMenu,
    cardsMenu,
    cardsRatingMenu,
}
