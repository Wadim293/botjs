import asyncio
from aiogram import Bot, Dispatcher, types, F
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties
from aiogram.fsm.storage.memory import MemoryStorage
from aiohttp import web

API_TOKEN = "7918446559:AAH7zcyqkHZu6CzebbZRjIATBGEp_Y7fhKc"
APP_URL = "https://botjs-production-82da.up.railway.app"

WEBHOOK_PATH = f"/bot{API_TOKEN}"
WEBHOOK_URL = f"{APP_URL}{WEBHOOK_PATH}"

bot = Bot(
    token=API_TOKEN,
    default=DefaultBotProperties(parse_mode=ParseMode.HTML)
)
dp = Dispatcher(storage=MemoryStorage())

PHOTO_URL = "https://i.postimg.cc/zXZ9mLcn/66930cd0-5ed3-4919-96c1-003241670dc1.png"  # свое фото

@dp.message(F.text == '/start')
async def start_handler(message: types.Message):
    kb = types.InlineKeyboardMarkup(
        inline_keyboard=[
            [types.InlineKeyboardButton(text="Перейти", callback_data="open_new")]
        ]
    )
    await message.answer_photo(
        photo=PHOTO_URL,
        caption="Вот тебе фотка через URL, старик!",
        reply_markup=kb
    )

@dp.callback_query(F.data == "open_new")
async def open_new_handler(callback_query: types.CallbackQuery):
    await callback_query.message.delete()
    kb = types.InlineKeyboardMarkup(
        inline_keyboard=[
            [types.InlineKeyboardButton(text="Назад", callback_data="back")]
        ]
    )
    await bot.send_photo(
        chat_id=callback_query.from_user.id,
        photo=PHOTO_URL,
        caption="Новое фото с кнопкой 'Назад'",
        reply_markup=kb
    )

@dp.callback_query(F.data == "back")
async def back_handler(callback_query: types.CallbackQuery):
    await callback_query.message.delete()
    kb = types.InlineKeyboardMarkup(
        inline_keyboard=[
            [types.InlineKeyboardButton(text="Перейти", callback_data="open_new")]
        ]
    )
    await bot.send_photo(
        chat_id=callback_query.from_user.id,
        photo=PHOTO_URL,
        caption="Вот тебе фотка через URL, старик!",
        reply_markup=kb
    )

@dp.message()
async def handle_message(message: types.Message):
    await message.answer("Привет! Это aiogram 3.7+ бот на вебхуке 🚀")

async def webhook_handler(request):
    update = types.Update.model_validate(await request.json(), context={"bot": bot})
    await dp.feed_update(bot, update)
    return web.Response()

async def on_startup(app):
    await bot.set_webhook(WEBHOOK_URL)
    print("✅ Webhook установлен:", WEBHOOK_URL)

async def on_shutdown(app):
    await bot.delete_webhook()
    await bot.session.close()

async def main():
    app = web.Application()
    app.router.add_post(WEBHOOK_PATH, webhook_handler)
    app.on_startup.append(on_startup)
    app.on_shutdown.append(on_shutdown)

    port = 8080
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, port=port)
    await site.start()
    print(f"🚀 Сервер запущен на порту {port}")

    await asyncio.Event().wait()

if __name__ == "__main__":
    asyncio.run(main())