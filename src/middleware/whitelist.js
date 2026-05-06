'use strict'

const config = require('../config')

const REJECTION_LOG_INTERVAL_MS = 60_000
const lastLogged = new Map() // userId -> timestamp последнего лога об отказе

/**
 * Whitelist-middleware.
 *
 * Логика:
 *   - Если ALLOWED_USER_IDS / MY_TELEGRAM_ID не заданы вообще — бот открыт всем
 *     (для совместимости с первым деплоем). Выводим warning один раз при старте.
 *   - Иначе пропускаем только тех, чей from.id есть в списке.
 *   - Тихо отвечаем "Доступ запрещён", чтобы не палить наличие бота.
 *
 * Лог отказов с тротлингом (раз в минуту на юзера), чтобы не засорять логи спамом.
 */
function buildWhitelistMiddleware() {
    const allowed = config.allowedUserIds
    const open = allowed.size === 0

    if (open) {
        console.warn(
            '[whitelist] ALLOWED_USER_IDS / MY_TELEGRAM_ID не заданы — бот доступен любому. ' +
                'Для приватного бота укажи свой Telegram ID в .env',
        )
    } else {
        console.log(`[whitelist] Доступ разрешён ${allowed.size} пользователю(ям).`)
    }

    return async (ctx, next) => {
        if (open) return next()

        const userId = ctx.from?.id
        if (userId == null) return // апдейт без юзера — пропускаем (channel post и т.п.)

        if (allowed.has(String(userId))) return next()

        // Отказ. Логируем с тротлингом.
        const now = Date.now()
        const last = lastLogged.get(userId) || 0
        if (now - last > REJECTION_LOG_INTERVAL_MS) {
            lastLogged.set(userId, now)
            const tag = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name || ''
            console.warn(`[whitelist] Отказ: ${userId} ${tag}`.trim())
        }

        try {
            await ctx.reply('🚫 Доступ к этому боту ограничен.')
        } catch (_) {
            // Игнорируем — могли просто не успеть до блокировки.
        }
    }
}

module.exports = { buildWhitelistMiddleware }
