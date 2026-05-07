'use strict'

const express = require('express')
const store = require('../storage')
const histories = require('../db/repositories/histories')

function buildRouter() {
    const r = express.Router()

    r.get('/api/stats', (req, res) => {
        const users = store.listUsers()
        const totalUsers = users.length
        const totalMessages = users.reduce(
            (sum, u) => sum + histories.countUserMessages(u.id),
            0,
        )
        res.json({ totalUsers, totalMessages, generatedAt: Date.now() })
    })

    r.get('/api/users', (req, res) => {
        const users = store.listUsers()
        res.json(
            users.map((u) => ({
                ...u,
                messages: histories.countUserMessages(u.id),
                notes: store.getNotesFull(u.id).length,
                reminders: store.listUserReminders(u.id).length,
                cards: store.totalFlashcardCount(u.id),
                cardsDue: store.dueFlashcardCount(u.id),
            })),
        )
    })

    r.get('/api/users/:id/notes', (req, res) => {
        res.json(store.getNotesFull(req.params.id))
    })

    r.get('/api/users/:id/history', (req, res) => {
        const limit = Number(req.query.limit) || 50
        res.json(store.getHistory(req.params.id).slice(-limit))
    })

    r.get('/api/users/:id/reminders', (req, res) => {
        res.json(store.listUserReminders(req.params.id))
    })

    r.delete('/api/users/:id/notes/:noteId', (req, res) => {
        const ok = store.deleteNote(req.params.id, Number(req.params.noteId))
        res.json({ ok })
    })

    r.delete('/api/users/:id/reminders/:reminderId', (req, res) => {
        const ok = store.deleteReminder(req.params.id, Number(req.params.reminderId))
        res.json({ ok })
    })

    r.get('/api/users/:id/flashcards', (req, res) => {
        res.json(store.listAllFlashcards(req.params.id))
    })

    r.delete('/api/users/:id/flashcards/:cardId', (req, res) => {
        const ok = store.deleteFlashcard(req.params.id, Number(req.params.cardId))
        res.json({ ok })
    })

    return r
}

module.exports = { buildRouter }
