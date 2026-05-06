#!/usr/bin/env node
'use strict'

/**
 * Одноразовый скрипт миграции данных из histories.json / notes.json / roles.json
 * в SQLite. Запускать ОДИН РАЗ:
 *
 *   node scripts/migrate-json-to-sqlite.js
 *
 * После успешной миграции JSON-файлы можно (но не обязательно) удалить.
 */

const fs = require('fs')
const path = require('path')

// Грузим .env, потому что DATA_DIR/DB_FILE могут быть переопределены
require('dotenv').config()

const { db } = require('../src/db')

function readJsonOrEmpty(file) {
    if (!fs.existsSync(file)) return {}
    try {
        return JSON.parse(fs.readFileSync(file, 'utf-8'))
    } catch (e) {
        console.error(`Не удалось прочитать ${file}:`, e.message)
        return {}
    }
}

const root = path.resolve(__dirname, '..')
const histories = readJsonOrEmpty(path.join(root, 'histories.json'))
const notes = readJsonOrEmpty(path.join(root, 'notes.json'))
const roles = readJsonOrEmpty(path.join(root, 'roles.json'))

const now = Date.now()

const insertHistory = db.prepare(
    `INSERT INTO histories (user_id, role, content, created_at) VALUES (?, ?, ?, ?)`,
)
const insertNote = db.prepare(
    `INSERT INTO notes (user_id, text, created_at) VALUES (?, ?, ?)`,
)
const upsertRole = db.prepare(`
INSERT INTO roles (user_id, prompt, updated_at)
VALUES (?, ?, ?)
ON CONFLICT(user_id) DO UPDATE SET
  prompt = excluded.prompt,
  updated_at = excluded.updated_at
`)
const upsertUser = db.prepare(`
INSERT INTO users (id, username, first_name, created_at, last_seen)
VALUES (?, NULL, NULL, ?, ?)
ON CONFLICT(id) DO NOTHING
`)

let totalH = 0
let totalN = 0
let totalR = 0

const tx = db.transaction(() => {
    // histories: { userId: [ {role, content}, ... ] }
    for (const [userId, list] of Object.entries(histories)) {
        if (!Array.isArray(list)) continue
        upsertUser.run(userId, now, now)
        for (const m of list) {
            if (!m || !m.role || !m.content) continue
            insertHistory.run(userId, m.role, m.content, now)
            totalH++
        }
    }

    // notes: { userId: [ "text", ... ] }
    for (const [userId, list] of Object.entries(notes)) {
        if (!Array.isArray(list)) continue
        upsertUser.run(userId, now, now)
        for (const text of list) {
            if (!text) continue
            insertNote.run(userId, String(text), now)
            totalN++
        }
    }

    // roles: { userId: "prompt" }
    for (const [userId, prompt] of Object.entries(roles)) {
        if (!prompt) continue
        upsertUser.run(userId, now, now)
        upsertRole.run(userId, String(prompt), now)
        totalR++
    }
})

tx()

console.log(`Миграция завершена:`)
console.log(`  histories: ${totalH} записей`)
console.log(`  notes:     ${totalN} записей`)
console.log(`  roles:     ${totalR} ролей`)
console.log(`Файл БД: data/bot.db`)
