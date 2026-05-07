'use strict'

const { db } = require('../index')
const srs = require('../../services/srs')

const insertStmt = db.prepare(`
INSERT INTO flashcards (
  user_id, question, answer, topic,
  ease_factor, interval_days, repetitions, next_review,
  created_at, updated_at
) VALUES (
  @user_id, @question, @answer, @topic,
  @ease_factor, @interval_days, @repetitions, @next_review,
  @now, @now
)
`)

const updateAfterReviewStmt = db.prepare(`
UPDATE flashcards
SET ease_factor = @ease_factor,
    interval_days = @interval_days,
    repetitions = @repetitions,
    next_review = @next_review,
    updated_at = @now
WHERE id = @id AND user_id = @user_id
`)

const dueStmt = db.prepare(`
SELECT *
FROM flashcards
WHERE user_id = ? AND next_review <= ?
ORDER BY next_review
LIMIT ?
`)

const dueCountStmt = db.prepare(
    `SELECT COUNT(*) AS n FROM flashcards WHERE user_id = ? AND next_review <= ?`,
)

const allCountStmt = db.prepare(
    `SELECT COUNT(*) AS n FROM flashcards WHERE user_id = ?`,
)

const listAllStmt = db.prepare(
    `SELECT * FROM flashcards WHERE user_id = ? ORDER BY id DESC`,
)

const deleteStmt = db.prepare(
    `DELETE FROM flashcards WHERE id = ? AND user_id = ?`,
)

const getStmt = db.prepare(
    `SELECT * FROM flashcards WHERE id = ? AND user_id = ?`,
)

const distinctUsersWithDueStmt = db.prepare(`
SELECT user_id, COUNT(*) AS n
FROM flashcards
WHERE next_review <= ?
GROUP BY user_id
`)

function create(userId, { question, answer, topic = null }) {
    const init = srs.initial()
    const info = insertStmt.run({
        user_id: String(userId),
        question,
        answer,
        topic,
        ease_factor: init.ease_factor,
        interval_days: init.interval_days,
        repetitions: init.repetitions,
        next_review: init.next_review,
        now: Date.now(),
    })
    return info.lastInsertRowid
}

function listDue(userId, limit = 20) {
    return dueStmt.all(String(userId), Date.now(), limit)
}

function dueCount(userId) {
    return dueCountStmt.get(String(userId), Date.now()).n
}

function totalCount(userId) {
    return allCountStmt.get(String(userId)).n
}

function listAll(userId) {
    return listAllStmt.all(String(userId))
}

function getOne(userId, id) {
    return getStmt.get(id, String(userId))
}

function deleteOne(userId, id) {
    return deleteStmt.run(id, String(userId)).changes > 0
}

/**
 * Применить оценку к карточке: пересчитать SM-2 и записать в БД.
 * Возвращает новое состояние карточки.
 */
function applyReview(userId, cardId, rating) {
    const card = getOne(userId, cardId)
    if (!card) return null
    const next = srs.applyRating(card, rating)
    updateAfterReviewStmt.run({
        id: cardId,
        user_id: String(userId),
        ease_factor: next.ease_factor,
        interval_days: next.interval_days,
        repetitions: next.repetitions,
        next_review: next.next_review,
        now: Date.now(),
    })
    return { ...card, ...next }
}

function listUsersWithDue() {
    return distinctUsersWithDueStmt.all(Date.now())
}

module.exports = {
    create,
    listDue,
    dueCount,
    totalCount,
    listAll,
    getOne,
    deleteOne,
    applyReview,
    listUsersWithDue,
}
