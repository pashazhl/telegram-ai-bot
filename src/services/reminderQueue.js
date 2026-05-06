'use strict'

const store = require('../storage')

const MAX_TIMEOUT = 2_147_483_647 // setTimeout max (~24.8 дней)
const timers = new Map() // reminderId -> Timeout

/**
 * Планирует одно напоминание (через chained setTimeout если delay > MAX_TIMEOUT).
 */
function scheduleOne(bot, reminder) {
    const { id, user_id: userId, text, trigger_at: triggerAt } = reminder
    const delay = Math.max(0, triggerAt - Date.now())

    const fire = async () => {
        try {
            await bot.telegram.sendMessage(userId, `⏰ Напоминание!\n\n${text}`)
        } catch (e) {
            console.error(`Не удалось отправить напоминание ${id}:`, e.message)
        } finally {
            store.markReminderDelivered(id)
            timers.delete(id)
        }
    }

    if (delay <= MAX_TIMEOUT) {
        const t = setTimeout(fire, delay)
        timers.set(id, t)
    } else {
        // Долгое напоминание (>24 дней) — спим максимум, потом перепланируем.
        const t = setTimeout(() => {
            timers.delete(id)
            scheduleOne(bot, reminder)
        }, MAX_TIMEOUT)
        timers.set(id, t)
    }
}

/**
 * Создаёт новое напоминание, сохраняет в БД, планирует таймер.
 */
function create(bot, userId, text, delayMs) {
    const triggerAt = Date.now() + delayMs
    const id = store.createReminder(userId, text, triggerAt)
    scheduleOne(bot, { id, user_id: String(userId), text, trigger_at: triggerAt })
    return { id, triggerAt }
}

/**
 * Загружает все недоставленные напоминания из БД и планирует их.
 * Те, у которых trigger_at в прошлом — отправляются сразу с пометкой.
 */
function restoreAll(bot) {
    const pending = store.listPendingReminders()
    let scheduled = 0
    let overdue = 0
    const now = Date.now()

    for (const r of pending) {
        if (r.trigger_at < now) {
            overdue++
            // Отправляем с пометкой "пропущенное" (но не блокирующе).
            bot.telegram
                .sendMessage(
                    r.user_id,
                    `⏰ Пропущенное напоминание (бот был выключен):\n\n${r.text}`,
                )
                .catch((e) => console.error('Не отправил пропущенное:', e.message))
                .finally(() => store.markReminderDelivered(r.id))
        } else {
            scheduleOne(bot, r)
            scheduled++
        }
    }

    if (scheduled || overdue) {
        console.log(
            `Восстановлено напоминаний: ${scheduled} запланировано, ${overdue} пропущенных отправлено.`,
        )
    }
}

function cancelAll() {
    for (const t of timers.values()) clearTimeout(t)
    timers.clear()
}

module.exports = { create, restoreAll, cancelAll, scheduleOne }
