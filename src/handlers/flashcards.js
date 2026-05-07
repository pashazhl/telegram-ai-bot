'use strict'

const { Markup } = require('telegraf')
const { mainMenu, cardsMenu, cardsRatingMenu } = require('../keyboards')
const state = require('../state')
const store = require('../storage')
const srs = require('../services/srs')
const ai = require('../services/ai')

// --- Стейты для пошагового флоу ---
// create_question  -> ждём вопрос
// create_answer    -> ждём ответ
// create_topic     -> ждём тему (или 'нет')
// reviewing        -> идёт сессия повторения, конкретная карточка в state
// review_rating    -> ждём кнопку оценки сложности

const RATING_BY_BUTTON = {
    '❌ Снова': 'again',
    '😓 Сложно': 'hard',
    '👍 Норма': 'good',
    '✨ Легко': 'easy',
}

function register(bot) {
    bot.hears('➕ Создать', (ctx) => {
        state.set(ctx.from.id, { kind: 'create_question' })
        ctx.reply(
            'Какой ВОПРОС у карточки? Например:\n«Что делает Promise.all и в чём разница с Promise.allSettled?»',
            Markup.forceReply(),
        )
    })

    bot.hears('🔁 Повторить', async (ctx) => {
        await startReview(ctx)
    })

    bot.hears('📊 Статистика карточек', (ctx) => {
        const total = store.totalFlashcardCount(ctx.from.id)
        const due = store.dueFlashcardCount(ctx.from.id)
        if (total === 0) {
            ctx.reply(
                'Карточек пока нет. Нажми ➕ Создать, чтобы добавить первую.',
                cardsMenu,
            )
            return
        }
        ctx.reply(
            `📇 Карточек всего: ${total}\n🔁 На повторение сейчас: ${due}`,
            cardsMenu,
        )
    })

    // Кнопки оценки сложности — обрабатываются только если идёт сессия.
    for (const [button, rating] of Object.entries(RATING_BY_BUTTON)) {
        bot.hears(button, async (ctx) => {
            const s = state.get(ctx.from.id)
            if (!s || s.kind !== 'review_rating') {
                // Лишний клик — мягко возвращаем в меню.
                return
            }
            await handleRating(ctx, s, rating)
        })
    }
}

// --- text-флоу для создания карточек и оценки ответов ---

async function handleTextIfWaiting(ctx) {
    const s = state.get(ctx.from.id)
    if (!s) return false

    if (s.kind === 'create_question') {
        const question = ctx.message.text.trim()
        if (!question) return true
        state.set(ctx.from.id, { kind: 'create_answer', question })
        ctx.reply('Окей. Какой ОТВЕТ?', Markup.forceReply())
        return true
    }

    if (s.kind === 'create_answer') {
        const answer = ctx.message.text.trim()
        if (!answer) return true
        state.set(ctx.from.id, {
            kind: 'create_topic',
            question: s.question,
            answer,
        })
        ctx.reply(
            'Тема карточки (например «JavaScript», «Node.js», «SQL»). ' +
                'Можешь написать «—» если без темы.',
            Markup.forceReply(),
        )
        return true
    }

    if (s.kind === 'create_topic') {
        let topic = ctx.message.text.trim()
        if (topic === '—' || topic === '-' || topic === '' || topic.toLowerCase() === 'нет') {
            topic = null
        }
        const id = store.createFlashcard(ctx.from.id, {
            question: s.question,
            answer: s.answer,
            topic,
        })
        state.clear(ctx.from.id)
        ctx.reply(
            `✅ Карточка #${id} сохранена.\nПервое повторение — сегодня. Нажми 🔁 Повторить, когда будешь готов.`,
            cardsMenu,
        )
        return true
    }

    if (s.kind === 'reviewing') {
        // Юзер прислал свой ответ. Сравним через AI.
        await evaluateAnswer(ctx, s, ctx.message.text)
        return true
    }

    return false
}

// --- Сессия повторения ---

async function startReview(ctx) {
    const due = store.listDueFlashcards(ctx.from.id, 1)
    if (due.length === 0) {
        const total = store.totalFlashcardCount(ctx.from.id)
        if (total === 0) {
            ctx.reply(
                'Карточек ещё нет. Создай первую через ➕ Создать.',
                cardsMenu,
            )
        } else {
            ctx.reply(
                '🎉 На сегодня всё повторено! Возвращайся завтра.',
                cardsMenu,
            )
        }
        return
    }

    const card = due[0]
    state.set(ctx.from.id, { kind: 'reviewing', cardId: card.id })

    const topic = card.topic ? `🏷 ${card.topic}\n` : ''
    ctx.reply(
        `${topic}❓ ${card.question}\n\n` +
            'Напиши свой ответ (текстом или голосом). Когда будешь готов — отправь.',
        Markup.forceReply(),
    )
}

async function evaluateAnswer(ctx, s, userAnswer) {
    const card = store.getFlashcard(ctx.from.id, s.cardId)
    if (!card) {
        state.clear(ctx.from.id)
        ctx.reply('Карточка пропала, попробуй ещё раз.', cardsMenu)
        return
    }

    await ctx.sendChatAction('typing')

    // Просим AI оценить ответ ученика без байаса в духе «всегда хвали».
    let verdict
    try {
        const judge = await ai.chat([
            {
                role: 'system',
                content:
                    'Ты строгий, но доброжелательный преподаватель. ' +
                    'Сравниваешь ответ ученика с эталоном. ' +
                    'Отвечай кратко (3-4 строки), на русском.\n' +
                    'Структура:\n' +
                    '1. Вердикт одной фразой: «верно», «частично верно», «неверно».\n' +
                    '2. Что ученик понял хорошо.\n' +
                    '3. Что упустил или сказал неточно.\n' +
                    'НЕ давай новый длинный ответ — только разбор.',
            },
            {
                role: 'user',
                content:
                    `Вопрос: ${card.question}\n\n` +
                    `Эталон: ${card.answer}\n\n` +
                    `Ответ ученика: ${userAnswer}`,
            },
        ])
        verdict = judge
    } catch (e) {
        console.error('flashcards judge error:', e?.message || e)
        verdict =
            '(не получилось разобрать ответ автоматически — оцени сам ниже)\n\n' +
            `Эталон: ${card.answer}`
    }

    state.set(ctx.from.id, { kind: 'review_rating', cardId: card.id })

    ctx.reply(
        `${verdict}\n\n` +
            '— Эталонный ответ —\n' +
            `${card.answer}\n\n` +
            'Оцени, насколько легко ты вспомнил:',
        cardsRatingMenu,
    )
}

async function handleRating(ctx, s, rating) {
    const updated = store.reviewFlashcard(ctx.from.id, s.cardId, rating)
    state.clear(ctx.from.id)

    if (!updated) {
        ctx.reply('Карточка не найдена, возвращаюсь в меню.', cardsMenu)
        return
    }

    const when = srs.describeInterval(updated.interval_days)
    ctx.reply(`✅ Записано. Повторим ${when}.`, cardsMenu)

    // Сразу предложим следующую карточку, если они ещё есть.
    const remaining = store.dueFlashcardCount(ctx.from.id)
    if (remaining > 0) {
        await startReview(ctx)
    } else {
        ctx.reply('🎉 Все карточки на сегодня — пройдены!', mainMenu)
    }
}

module.exports = { register, handleTextIfWaiting }
