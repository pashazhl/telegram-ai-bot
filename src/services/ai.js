'use strict'

const OpenAI = require('openai')
const config = require('../config')

const client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: config.openRouterKey,
})

async function chat(messages, { model = config.aiModel } = {}) {
    const response = await client.chat.completions.create({ model, messages })
    return response.choices[0].message.content
}

async function describeImage(imageUrl, { model = config.visionModel } = {}) {
    const response = await client.chat.completions.create({
        model,
        messages: [
            {
                role: 'user',
                content: [
                    { type: 'image_url', image_url: { url: imageUrl } },
                    {
                        type: 'text',
                        text: 'Опиши подробно что ты видишь на этом изображении. Отвечай на русском языке.',
                    },
                ],
            },
        ],
    })
    return response.choices[0].message.content
}

module.exports = { chat, describeImage }
