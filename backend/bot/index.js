import TelegramBot from 'node-telegram-bot-api';
import { logger } from '../utils/logger.js';
import { pool } from '../database/config.js';
import { messages } from './messages.js';
import { handleStart } from './handlers/start.js';
import { handleBet } from './handlers/bet.js';
import { handleStats } from './handlers/stats.js';
import { handleAdmin, handleAdminCallback } from './handlers/admin.js';
import { handleMvpInput } from './handlers/mvp.js';

const BOT_TOKEN = process.env.BOT_TOKEN || '8083203512:AAETDOeWNqeBT7Cnr0ypBVSgZjiJ5fbW2g4';
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

export async function startTelegramBot() {
  try {
    // Обробка команди /start
    bot.onText(/\/start/, async (msg) => {
      await handleStart(bot, msg);
    });

    // Обробка команди /admin
    bot.onText(/\/admin/, async (msg) => {
      await handleAdmin(bot, msg);
    });

    // Обробка inline кнопок
    bot.on('callback_query', async (callbackQuery) => {
      const msg = callbackQuery.message;
      const data = callbackQuery.data;

      try {
        if (data.startsWith('bet_') || data === 'main_menu') {
          await handleBet(bot, callbackQuery);
        } else if (data.startsWith('stats_')) {
          await handleStats(bot, callbackQuery);
        } else if (data.startsWith('admin_')) {
          await handleAdminCallback(bot, callbackQuery);
        }
        
        // Відповідь на callback query
        await bot.answerCallbackQuery(callbackQuery.id);
      } catch (error) {
        logger.error('Помилка обробки callback:', error);
        await bot.sendMessage(msg.chat.id, messages.error.general);
      }
    });

    // Обробка текстових повідомлень
    bot.on('message', async (msg) => {
      if (msg.text && !msg.text.startsWith('/')) {
        // Обробка введення MVP
        if (msg.text.startsWith('@')) {
          await handleMvpInput(bot, msg);
        }
      }
    });

    // Обробка помилок бота
    bot.on('error', (error) => {
      logger.error('Помилка Telegram бота:', error);
    });

    logger.info('Telegram бот успішно запущений');
  } catch (error) {
    logger.error('Помилка запуску Telegram бота:', error);
    throw error;
  }
}

export { bot };