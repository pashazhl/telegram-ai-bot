'use strict'

const cron = require('node-cron')
const config = require('../config')
const store = require('../storage')

/**
 * Раз в день, в указанное время, шлём пинг каждому юзеру у которого есть
 * due-карточки. По умолчанию 9:00 утра по Минску.
 *
 * Конфиг: CARDS_CRON в .env (cron-выражение). Дефолт: '0 9 * * *'.
 */
function schedule(bot) {
    const expr = config.cardsCron || '0 9 * * *'

    return cron.schedule(
        expr,
        async () => {
            const due = store.listUsersWithDueFlashcards()
            for (const row of due) {
                try {
                    await bot.telegram.sendMessage(
                        row.user_id,
                        `📇 Доброе утро! У тебя ${row.n} ${plural(row.n, 'карточка', 'карточки', 'карточек')} на повторение сегодня.\nНажми «📇 Карточки» → «🔁 Повторить», когда будет минута.`,
                    )
                } catch (e) {
                    console.error(`cards reminder for ${row.user_id}:`, e?.message || e)
                }
            }
            if (due.length) {
                console.log(`[cards] Утренний пинг отправлен ${due.length} юзеру(ам).`)
            }
        },
        { timezone: config.timezone },
    )
}

function plural(n, one, two, five) {
    const m = Math.abs(n) % 100
    const m1 = m % 10
    if (m > 10 && m < 20) return five
    if (m1 > 1 && m1 < 5) return two
    if (m1 === 1) return one
    return five
}

module.exports = { schedule }
