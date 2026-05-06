'use strict'

const { db } = require('../index')
const config = require('../../config')

const insertStmt = db.prepare(
    `INSERT INTO histories (user_id, role, content, created_at) VALUES (?, ?, ?, ?)`,
)

const recentStmt = db.prepare(
    `SELECT role, content
     FROM histories
     WHERE user_id = ?
     ORDER BY id DESC
     LIMIT ?`,
)

const countUserStmt = db.prepare(
    `SELECT COUNT(*) AS n FROM histories WHERE user_id = ? AND role = 'user'`,
)

const deleteAllStmt = db.prepare(`DELETE FROM histories WHERE user_id = ?`)

const trimStmt = db.prepare(`
DELETE FROM histories
WHERE user_id = ?
  AND id NOT IN (
    SELECT id FROM histories
    WHERE user_id = ?
    ORDER BY id DESC
    LIMIT ?
  )
`)

function append(userId, message) {
    const id = String(userId)
    const tx = db.transaction(() => {
        insertStmt.run(id, message.role, message.content, Date.now())
        trimStmt.run(id, id, config.historyLimit)
    })
    tx()
}

function getRecent(userId, limit = config.historyLimit) {
    const rows = recentStmt.all(String(userId), limit)
    // recentStmt отдаёт DESC — переворачиваем в хронологию
    return rows.reverse().map((r) => ({ role: r.role, content: r.content }))
}

function clear(userId) {
    deleteAllStmt.run(String(userId))
}

function countUserMessages(userId) {
    return countUserStmt.get(String(userId)).n
}

module.exports = { append, getRecent, clear, countUserMessages }
