'use strict'

const { db } = require('../index')

const upsert = db.prepare(`
INSERT INTO users (id, username, first_name, created_at, last_seen)
VALUES (@id, @username, @first_name, @now, @now)
ON CONFLICT(id) DO UPDATE SET
  username   = excluded.username,
  first_name = excluded.first_name,
  last_seen  = excluded.last_seen
`)

function touchUser(userId, { username = null, firstName = null } = {}) {
    upsert.run({
        id: String(userId),
        username,
        first_name: firstName,
        now: Date.now(),
    })
}

const listAll = db.prepare(
    `SELECT id, username, first_name, created_at, last_seen FROM users ORDER BY last_seen DESC`,
)

function listUsers() {
    return listAll.all()
}

module.exports = { touchUser, listUsers }
