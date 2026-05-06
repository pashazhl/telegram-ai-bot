'use strict'

const crypto = require('crypto')

function safeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false
    const ab = Buffer.from(a)
    const bb = Buffer.from(b)
    if (ab.length !== bb.length) return false
    return crypto.timingSafeEqual(ab, bb)
}

/**
 * Auth middleware: принимает либо Bearer-токен в заголовке Authorization,
 * либо ?token= в query-параметре (для удобной открытия дашборда из браузера).
 *
 * adminToken приходит из config.adminToken — если он не задан, web-сервер
 * вообще не стартует.
 */
function buildAuthMiddleware(adminToken) {
    return (req, res, next) => {
        const header = req.headers.authorization || ''
        const fromHeader = header.startsWith('Bearer ') ? header.slice(7).trim() : null
        const fromQuery = typeof req.query.token === 'string' ? req.query.token : null
        const provided = fromHeader || fromQuery

        if (provided && safeEqual(provided, adminToken)) {
            return next()
        }

        // Для HTML-дашборда отдаём страницу логина, для API — JSON.
        const wantsHtml = req.accepts(['json', 'html']) === 'html'
        if (wantsHtml) {
            res.setHeader('WWW-Authenticate', 'Bearer realm="admin"')
            res.status(401).send(`<!doctype html>
<html><meta charset="utf-8"><title>Auth</title>
<style>body{font:14px/1.5 system-ui;max-width:420px;margin:80px auto;padding:0 16px;color:#222}
input{width:100%;padding:10px;font:inherit;border:1px solid #ccc;border-radius:6px}
button{margin-top:12px;padding:10px 16px;font:inherit;border:0;border-radius:6px;background:#0a66c2;color:#fff;cursor:pointer}
.err{color:#b00;margin-top:8px}</style>
<h1>Вход</h1>
<form onsubmit="event.preventDefault();const t=document.querySelector('input').value.trim();if(!t)return;location.href='/?token='+encodeURIComponent(t)">
  <input type="password" placeholder="ADMIN_TOKEN" autofocus required>
  <button>Войти</button>
</form>
${provided ? '<p class=err>Неверный токен</p>' : ''}
</html>`)
            return
        }

        res.status(401).json({ error: 'unauthorized' })
    }
}

module.exports = { buildAuthMiddleware }
