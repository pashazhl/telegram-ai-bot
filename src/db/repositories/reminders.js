'use strict'

const { db } = require('../index')

const insertStmt = db.prepare(`
INSERT INTO reminders (user_id, text, trigger_at, created_at)
VALUES (?, ?, ?, ?)
`)

const listPendingStmt = db.prepare(`
SELECT id, user_id, text, trigger_at
FROM reminders
WHERE delivered_at IS NULL
ORDER BY trigger_at
`)

const listUserStmt = db.prepare(`
SELECT id, text, trigger_at, delivered_at, created_at
FROM reminders
WHERE user_id = ?
ORDER BY trigger_at
`)

const markDeliveredStmt = db.prepare(
    `UPDATE reminders SET delivered_at = ? WHERE id = ?`,
)

const deleteStmt = db.prepare(`DELETE FROM reminders WHERE id = ? AND user_id = ?`)

function create(userId, text, triggerAt) {
    const info = insertStmt.run(String(userId), text, triggerAt, Date.now())
    return info.lastInsertRowid
}

function listPending() {
    return listPendingStmt.all()
}

function listForUser(userId) {
    return listUserStmt.all(String(userId))
}

function markDelivered(id) {
    markDeliveredStmt.run(Date.now(), id)
}

function deleteOne(userId, id) {
    return deleteStmt.run(id, String(userId)).changes > 0
}

module.exports = { create, listPending, listForUser, markDelivered, deleteOne }
