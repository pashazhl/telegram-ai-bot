'use strict'

/**
 * Сессионное состояние "чего ждём от юзера" (например, текст напоминания, город погоды).
 * Хранится в памяти — терять не страшно, при рестарте просто диалог сбросится.
 */
const waitingFor = new Map()

function set(userId, value) {
    waitingFor.set(String(userId), value)
}

function get(userId) {
    return waitingFor.get(String(userId)) ?? null
}

function clear(userId) {
    waitingFor.delete(String(userId))
}

module.exports = { set, get, clear }
