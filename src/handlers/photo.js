'use strict'

const { mainMenu } = require('../keyboards')
const ai = require('../services/ai')

function register(bot) {
    bot.on('photo', async (ctx) => {
        try {
            await ctx.sendChatAction('typing')
            const photo = ctx.message.photo[ctx.message.photo.length - 1]
            const fileLink = await ctx.telegram.getFileLink(photo.file_id)
            const reply = await ai.describeImage(fileLink.href)
            ctx.reply(reply, mainMenu)
        } catch (error) {
            console.error('Photo error:', error?.message || error)
            ctx.reply('Не удалось проанализировать фото, попробуй ещё раз!', mainMenu)
        }
    })
}

module.exports = { register }
