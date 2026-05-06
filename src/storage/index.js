'use strict'

/**
 * Единый интерфейс хранилища для хендлеров. Реализован поверх SQLite (better-sqlite3).
 * Если в будущем поменяешь движок (PostgreSQL, etc) — меняешь только репозитории под капотом.
 */

const histories = require('../db/repositories/histories')
const notes = require('../db/repositories/notes')
const roles = require('../db/repositories/roles')
const reminders = require('../db/repositories/reminders')
const users = require('../db/repositories/users')

module.exports = {
    // histories
    getHistory: (userId) => histories.getRecent(userId),
    appendHistory: (userId, message) => histories.append(userId, message),
    clearHistory: (userId) => histories.clear(userId),
    countUserMessages: (userId) => histories.countUserMessages(userId),

    // notes
    getNotes: (userId) => notes.list(userId).map((n) => n.text),
    getNotesFull: (userId) => notes.list(userId),
    addNote: (userId, text) => notes.add(userId, text),
    clearNotes: (userId) => notes.clear(userId),
    deleteNote: (userId, id) => notes.deleteOne(userId, id),

    // roles
    getRole: (userId) => roles.get(userId),
    setRole: (userId, prompt) => roles.set(userId, prompt),

    // reminders
    createReminder: (userId, text, triggerAt) => reminders.create(userId, text, triggerAt),
    listPendingReminders: () => reminders.listPending(),
    listUserReminders: (userId) => reminders.listForUser(userId),
    markReminderDelivered: (id) => reminders.markDelivered(id),
    deleteReminder: (userId, id) => reminders.deleteOne(userId, id),

    // users
    touchUser: (userId, info) => users.touchUser(userId, info),
    listUsers: () => users.listUsers(),
}
