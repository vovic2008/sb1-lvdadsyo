import { pool } from '../../database/config.js';
import { messages } from '../messages.js';
import { logger } from '../../utils/logger.js';

export async function handleStart(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username;
  const firstName = msg.from.first_name;

  try {
    // Перевірка чи користувач існує в базі
    const userQuery = pool.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    let user = userQuery.rows[0];

    if (!user) {
      // Створення нового користувача
      pool.query(
        'INSERT INTO users (id, username, name, is_allowed) VALUES (?, ?, ?, ?)',
        [userId, username, firstName, 0]
      );
      
      user = { id: userId, username, name: firstName, is_allowed: 0 };
    }

    // Перевірка дозволу
    if (!user.is_allowed) {
      await bot.sendMessage(chatId, messages.unauthorized);
      return;
    }

    // Головне меню
    const mainMenuKeyboard = {
      inline_keyboard: [
        [
          { text: '1️⃣ Зробити ставку', callback_data: 'bet_menu' },
          { text: '2️⃣ Переглянути статистику', callback_data: 'stats_menu' }
        ]
      ]
    };

    await bot.sendMessage(
      chatId,
      messages.welcome(firstName),
      { reply_markup: mainMenuKeyboard }
    );

    logger.info(`Користувач ${username} (${userId}) відкрив головне меню`);
  } catch (error) {
    logger.error('Помилка обробки команди /start:', error);
    await bot.sendMessage(chatId, messages.error.general);
  }
}