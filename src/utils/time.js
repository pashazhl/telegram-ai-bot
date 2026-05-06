'use strict'

const REGEX = /(\d+)\s*(мин|минут|минуты|час|часов|часа|ч|день|дней|дня|неделю|недели|недель|месяц|месяцев|месяца|год|года|лет)/i

const UNITS = {
    мин: 60_000,
    минут: 60_000,
    минуты: 60_000,
    ч: 3_600_000,
    час: 3_600_000,
    часа: 3_600_000,
    часов: 3_600_000,
    день: 86_400_000,
    дня: 86_400_000,
    дней: 86_400_000,
    неделю: 7 * 86_400_000,
    недели: 7 * 86_400_000,
    недель: 7 * 86_400_000,
    месяц: 30 * 86_400_000,
    месяца: 30 * 86_400_000,
    месяцев: 30 * 86_400_000,
    год: 365 * 86_400_000,
    года: 365 * 86_400_000,
    лет: 365 * 86_400_000,
}

/**
 * Парсит строку вида "30 минут" / "2 часа" / "3 дня" в миллисекунды.
 * Возвращает { ms, value, unit } или null если не распарсилось.
 */
function parseDuration(text) {
    const match = String(text).match(REGEX)
    if (!match) return null
    const value = parseInt(match[1], 10)
    const unit = match[2].toLowerCase()
    const ms = (UNITS[unit] || 0) * value
    if (!ms || !Number.isFinite(ms)) return null
    return { ms, value, unit }
}

module.exports = { parseDuration }
