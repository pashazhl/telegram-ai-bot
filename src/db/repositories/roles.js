'use strict'

const { db } = require('../index')

const upsertStmt = db.prepare(`
INSERT INTO roles (user_id, prompt, updated_at)
VALUES (?, ?, ?)
ON CONFLICT(user_id) DO UPDATE SET
  prompt = excluded.prompt,
  updated_at = excluded.updated_at
`)

const getStmt = db.prepare(`SELECT prompt FROM roles WHERE user_id = ?`)
const deleteStmt = db.prepare(`DELETE FROM roles WHERE user_id = ?`)

function set(userId, prompt) {
    if (prompt) {
        upsertStmt.run(String(userId), prompt, Date.now())
    } else {
        deleteStmt.run(String(userId))
    }
}

function get(userId) {
    const row = getStmt.get(String(userId))
    return row ? row.prompt : null
}

module.exports = { set, get }
