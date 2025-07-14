const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const { Pool } = require('pg');

const TOKEN = '7918446559:AAH7zcyqkHZu6CzebbZRjIATBGEp_Y7fhKc';
const WEBHOOK_URL = 'https://99473a1996ff.ngrok-free.app/bot' + TOKEN;

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

// Инициализация базы
const pool = new Pool(PG_CONFIG);

// Функция автосоздания таблицы, если её нет
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

// Express-приложение
const app = express();
app.use(bodyParser.json());

// Инициализация Telegram-бота на вебхуке
const bot = new TelegramBot(TOKEN, { webHook: { port: 3000 } });

bot.setWebHook(WEBHOOK_URL).then(() => {
    console.log('Webhook set:', WEBHOOK_URL);
}).catch(err => {
    console.error('Webhook set error:', err);
});

// Webhook-роут для Telegram
app.post('/bot' + TOKEN, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Тестовый обработчик сообщений
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Автосоздание таблицы при первом запросе
    await createTableIfNotExists();

    // Вставка сообщения в БД
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

app.listen(3000, () => {
    console.log('Сервер слушает порт 3000');
});