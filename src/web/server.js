'use strict'

const path = require('path')
const express = require('express')
const config = require('../config')
const { buildAuthMiddleware } = require('./auth')
const { buildRouter } = require('./routes')

function start() {
    if (!config.adminToken) {
        console.warn('[web] ADMIN_TOKEN не задан — веб-панель не запускается.')
        return null
    }

    const app = express()
    app.disable('x-powered-by')
    app.set('trust proxy', false)

    // Базовые security-заголовки руками (без helmet, чтобы не добавлять зависимость).
    app.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff')
        res.setHeader('X-Frame-Options', 'DENY')
        res.setHeader('Referrer-Policy', 'no-referrer')
        res.setHeader('Cache-Control', 'no-store')
        next()
    })

    app.use(express.json({ limit: '64kb' }))

    // /login — публичная страница ввода токена (без auth).
    app.get('/login', (req, res) => {
        res.type('html').send(`<!doctype html>
<html><meta charset="utf-8"><title>Login</title>
<style>body{font:14px/1.5 system-ui;max-width:420px;margin:80px auto;padding:0 16px}
input{width:100%;padding:10px;font:inherit;border:1px solid #ccc;border-radius:6px}
button{margin-top:12px;padding:10px 16px;font:inherit;border:0;border-radius:6px;background:#0a66c2;color:#fff;cursor:pointer}</style>
<h1>Bot Admin</h1>
<form onsubmit="event.preventDefault();const t=document.querySelector('input').value.trim();if(!t)return;location.href='/?token='+encodeURIComponent(t)">
  <input type="password" placeholder="ADMIN_TOKEN" autofocus required>
  <button>Войти</button>
</form></html>`)
    })

    // Всё остальное — за auth.
    const auth = buildAuthMiddleware(config.adminToken)
    app.use(auth)

    app.use(buildRouter())
    app.use(express.static(path.join(__dirname, 'public')))

    // Railway автоматически проставляет PORT — учитываем его как fallback,
    // чтобы не приходилось руками править WEB_PORT при Generate Domain.
    const port = Number(process.env.WEB_PORT || process.env.PORT || 3000)
    const host = process.env.WEB_HOST || '0.0.0.0'

    const server = app.listen(port, host, () => {
        console.log(`[web] Админка слушает http://${host}:${port}`)
    })

    return server
}

module.exports = { start }
