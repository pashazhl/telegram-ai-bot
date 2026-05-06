'use strict'

const { mainMenu } = require('../keyboards')

function register(bot) {
    bot.start((ctx) => {
        ctx.reply('Привет! Я AI-бот. Напиши мне что-нибудь!', mainMenu)
    })
}

module.exports = { register }
