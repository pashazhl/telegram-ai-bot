'use strict'

const { db } = require('../index')

const insertStmt = db.prepare(
    `INSERT INTO notes (user_id, text, created_at) VALUES (?, ?, ?)`,
)
const listStmt = db.prepare(
    `SELECT id, text, created_at FROM notes WHERE user_id = ? ORDER BY id`,
)
const clearStmt = db.prepare(`DELETE FROM notes WHERE user_id = ?`)
const deleteOneStmt = db.prepare(`DELETE FROM notes WHERE id = ? AND user_id = ?`)

function add(userId, text) {
    insertStmt.run(String(userId), text, Date.now())
}

function list(userId) {
    return listStmt.all(String(userId))
}

function clear(userId) {
    clearStmt.run(String(userId))
}

function deleteOne(userId, noteId) {
    return deleteOneStmt.run(noteId, String(userId)).changes > 0
}

module.exports = { add, list, clear, deleteOne }
