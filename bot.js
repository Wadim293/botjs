const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const { Pool } = require('pg');

const TOKEN = '7918446559:AAH7zcyqkHZu6CzebbZRjIATBGEp_Y7fhKc';
const WEBHOOK_URL = 'https://botjs-production-82da.up.railway.app/bot' + TOKEN;

const PG_CONFIG = {
    user: 'postgres',
    host: 'postgres.railway.internal',
    database: 'railway',
    password: 'fcQCCCboiwWDqCdoJqhuNCtaWeSAcaXq',
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    }
};

const pool = new Pool(PG_CONFIG);

async function createTableIfNotExists() {
    const query = `
        CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            chat_id BIGINT,
            text TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `;
    await pool.query(query);
}

const app = express();
app.use(bodyParser.json());

const bot = new TelegramBot(TOKEN);

bot.setWebHook(WEBHOOK_URL).then(() => {
    console.log('Webhook set:', WEBHOOK_URL);
}).catch(err => {
    console.error('Webhook set error:', err);
});

app.post('/bot' + TOKEN, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const photoUrl = 'https://i.postimg.cc/zXZ9mLcn/66930cd0-5ed3-4919-96c1-003241670dc1.png';

    const opts = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '📋 Меню', callback_data: 'menu' }]
            ]
        }
    };

    const sent = await bot.sendPhoto(chatId, photoUrl, {
        caption: 'Привет! Нажми кнопку ниже 👇',
        reply_markup: opts.reply_markup
    });

    bot._lastMessageId = sent.message_id;
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const msgId = query.message.message_id;
    const photoUrl = 'https://i.postimg.cc/zXZ9mLcn/66930cd0-5ed3-4919-96c1-003241670dc1.png';

    if (query.data === 'menu') {
        await bot.deleteMessage(chatId, msgId);
        const sent = await bot.sendPhoto(chatId, photoUrl, {
            caption: '📋 Меню:\n- Пункт 1\n- Пункт 2',
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Назад', callback_data: 'back' }]
                ]
            }
        });
        bot._lastMessageId = sent.message_id;
    }

    if (query.data === 'back') {
        await bot.deleteMessage(chatId, msgId);
        const sent = await bot.sendPhoto(chatId, photoUrl, {
            caption: 'Привет! Нажми кнопку ниже 👇',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📋 Меню', callback_data: 'menu' }]
                ]
            }
        });
        bot._lastMessageId = sent.message_id;
    }

    bot.answerCallbackQuery(query.id);
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text.startsWith('/start')) return;

    await createTableIfNotExists();

    try {
        await pool.query(
            'INSERT INTO messages(chat_id, text) VALUES($1, $2)',
            [chatId, text]
        );
        bot.sendMessage(chatId, 'Твоё сообщение записано в базу!');
    } catch (err) {
        console.error('DB insert error:', err);
        bot.sendMessage(chatId, 'Ошибка при записи в базу.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер слушает порт ${PORT}`);
});