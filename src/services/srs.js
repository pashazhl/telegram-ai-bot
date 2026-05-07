'use strict'

/**
 * Spaced Repetition System (SM-2, упрощённая версия Anki).
 *
 * Карточка хранит: ease_factor, interval_days, repetitions, next_review.
 * При оценке (rating) пересчитываем все три значения и ставим новую дату.
 *
 * Рейтинги:
 *   'again' (1) — забыл, начать сначала
 *   'hard'  (2) — вспомнил с трудом
 *   'good'  (3) — норма (целевая середина)
 *   'easy'  (4) — легко
 */

const DAY_MS = 86_400_000

/**
 * Чистая функция: принимает текущее состояние карточки и rating, отдаёт новое.
 * Не лезет в БД, не зависит от времени напрямую (now передаётся параметром).
 */
function applyRating(card, rating, now = Date.now()) {
    let { ease_factor, interval_days, repetitions } = card

    if (rating === 'again') {
        // Забыл — повторяем завтра, серию обнуляем.
        repetitions = 0
        interval_days = 1
        // Снижаем ease, но не ниже 1.3 (стандарт Anki)
        ease_factor = Math.max(1.3, ease_factor - 0.2)
    } else if (rating === 'hard') {
        repetitions += 1
        // Маленький шаг — interval * 1.2, но минимум +1 день.
        interval_days = repetitions === 1 ? 1 : Math.max(1, interval_days * 1.2)
        ease_factor = Math.max(1.3, ease_factor - 0.15)
    } else if (rating === 'good') {
        repetitions += 1
        if (repetitions === 1) interval_days = 1
        else if (repetitions === 2) interval_days = 3
        else interval_days = Math.round(interval_days * ease_factor)
        // ease_factor не меняется на «норма».
    } else if (rating === 'easy') {
        repetitions += 1
        if (repetitions === 1) interval_days = 3
        else if (repetitions === 2) interval_days = 5
        else interval_days = Math.round(interval_days * ease_factor * 1.3)
        ease_factor += 0.15
    } else {
        throw new Error(`Unknown rating: ${rating}`)
    }

    const next_review = now + interval_days * DAY_MS
    return { ease_factor, interval_days, repetitions, next_review }
}

/**
 * Начальное состояние новой карточки.
 */
function initial(now = Date.now()) {
    return {
        ease_factor: 2.5,
        interval_days: 0,
        repetitions: 0,
        // Новая карточка сразу due — её увидишь в первой же сессии.
        next_review: now,
    }
}

/**
 * Человекочитаемое описание следующего повторения.
 */
function describeInterval(intervalDays) {
    if (intervalDays < 1) return 'сегодня'
    if (intervalDays === 1) return 'завтра'
    if (intervalDays < 7) return `через ${Math.round(intervalDays)} дн.`
    if (intervalDays < 30) return `через ${Math.round(intervalDays / 7)} нед.`
    return `через ${Math.round(intervalDays / 30)} мес.`
}

const RATING_KEYS = ['again', 'hard', 'good', 'easy']

module.exports = { applyRating, initial, describeInterval, RATING_KEYS, DAY_MS }
