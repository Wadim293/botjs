import os
import asyncio
from aiogram import Bot, Dispatcher, types
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties
from aiogram.fsm.storage.memory import MemoryStorage
from aiohttp import web

API_TOKEN = os.getenv("API_TOKEN")
WEBHOOK_PATH = f"/bot{API_TOKEN}"
APP_URL = os.getenv("APP_URL")  # Railway URL вроде https://project.up.railway.app
WEBHOOK_URL = f"{APP_URL}{WEBHOOK_PATH}"

bot = Bot(
    token=API_TOKEN,
    default=DefaultBotProperties(parse_mode=ParseMode.HTML)
)
dp = Dispatcher(storage=MemoryStorage())

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

    port = int(os.getenv("PORT", 3000)) 
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, port=port)
    await site.start()
    print(f"🚀 Сервер запущен на порту {port}")

    await asyncio.Event().wait()

if __name__ == "__main__":
    asyncio.run(main())