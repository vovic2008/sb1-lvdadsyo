import { pool } from '../../database/config.js';
import { messages } from '../messages.js';
import { logger } from '../../utils/logger.js';

// Тимчасове сховище для контекстів MVP
const mvpContexts = new Map();

export function setMvpContext(userId, game) {
  mvpContexts.set(userId, { game, timestamp: Date.now() });
}

export function getMvpContext(userId) {
  const context = mvpContexts.get(userId);
  if (context && Date.now() - context.timestamp < 300000) { // 5 хвилин
    return context;
  }
  mvpContexts.delete(userId);
  return null;
}

export async function handleMvpInput(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const mvpUsername = msg.text;

  const context = getMvpContext(userId);
  if (!context) {
    return; // Якщо немає контексту, ігноруємо
  }

  try {
    // Валідація username
    if (!mvpUsername.startsWith('@') || mvpUsername.length < 2) {
      await bot.sendMessage(chatId, messages.betting.invalidMvp);
      return;
    }

    // Перевірка чи користувач уже робив ставку на MVP
    const existingBet = pool.query(
      'SELECT id FROM bets WHERE user_id = ? AND game = ? AND bet_type = ?',
      [userId, context.game, 'mvp']
    );

    if (existingBet.rows.length > 0) {
      await bot.sendMessage(chatId, messages.betting.betExists);
      mvpContexts.delete(userId);
      return;
    }

    // Збереження ставки на MVP
    pool.query(
      'INSERT INTO bets (user_id, game, bet_type, player_username, points) VALUES (?, ?, ?, ?, ?)',
      [userId, context.game, 'mvp', mvpUsername, 10]
    );

    await bot.sendMessage(chatId, messages.betting.betPlaced);
    mvpContexts.delete(userId);
    
    logger.info(`MVP ставка створена: користувач ${userId}, гра ${context.game}, гравець ${mvpUsername}`);
  } catch (error) {
    logger.error('Помилка збереження MVP ставки:', error);
    await bot.sendMessage(chatId, messages.error.database);
    mvpContexts.delete(userId);
  }
}