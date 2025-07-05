import { pool } from '../../database/config.js';
import { messages } from '../messages.js';
import { logger } from '../../utils/logger.js';

export async function handleAdmin(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // Перевірка прав адміністратора
    const adminQuery = pool.query(
      'SELECT is_admin FROM users WHERE id = ?',
      [userId]
    );

    const user = adminQuery.rows[0];
    
    if (!user || !user.is_admin) {
      await bot.sendMessage(chatId, messages.admin.unauthorized);
      return;
    }

    // Меню адміністратора
    const adminKeyboard = {
      inline_keyboard: [
        [{ text: '📂 Завантажити команди', callback_data: 'admin_upload_teams' }],
        [{ text: '🏆 Встановити переможців', callback_data: 'admin_set_winners' }],
        [{ text: '⭐ Встановити MVP', callback_data: 'admin_set_mvp' }],
        [{ text: '🧮 Розрахувати виграші', callback_data: 'admin_calculate' }],
        [{ text: '📊 Експорт статистики', callback_data: 'admin_export' }]
      ]
    };

    await bot.sendMessage(chatId, messages.admin.menu, { reply_markup: adminKeyboard });
    
    logger.info(`Адмін ${userId} відкрив панель адміністратора`);
  } catch (error) {
    logger.error('Помилка обробки команди /admin:', error);
    await bot.sendMessage(chatId, messages.error.general);
  }
}

export async function handleAdminCallback(bot, callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;

  try {
    if (data === 'admin_calculate') {
      await calculateWinnings(bot, chatId);
    } else if (data === 'admin_export') {
      await exportStatistics(bot, chatId);
    }
  } catch (error) {
    logger.error('Помилка обробки адмін callback:', error);
    await bot.sendMessage(chatId, messages.error.general);
  }
}

async function calculateWinnings(bot, chatId) {
  try {
    // Отримання результатів турніру
    const resultsQuery = pool.query(`
      SELECT * FROM tournament_results WHERE is_finalized = 1
    `);

    const results = resultsQuery.rows;

    for (const result of results) {
      // Розрахунок виграшів для переможця
      if (result.winner_team_id) {
        pool.query(`
          UPDATE bets 
          SET is_won = 1 
          WHERE game = ? AND bet_type = 'winner' AND team_id = ?
        `, [result.game, result.winner_team_id]);

        pool.query(`
          UPDATE users 
          SET balance = balance + 30 
          WHERE id IN (
            SELECT user_id FROM bets 
            WHERE game = ? AND bet_type = 'winner' AND team_id = ?
          )
        `, [result.game, result.winner_team_id]);
      }

      // Розрахунок для 2 і 3 місця
      const topTeams = [result.winner_team_id, result.second_place_team_id, result.third_place_team_id];
      
      for (const teamId of topTeams) {
        if (teamId) {
          pool.query(`
            UPDATE bets 
            SET is_won = 1 
            WHERE game = ? AND bet_type IN ('2nd_place', '3rd_place') AND team_id = ?
          `, [result.game, teamId]);

          pool.query(`
            UPDATE users 
            SET balance = balance + 10 
            WHERE id IN (
              SELECT user_id FROM bets 
              WHERE game = ? AND bet_type IN ('2nd_place', '3rd_place') AND team_id = ?
            )
          `, [result.game, teamId]);
        }
      }

      // Розрахунок для MVP
      if (result.mvp_player) {
        pool.query(`
          UPDATE bets 
          SET is_won = 1 
          WHERE game = ? AND bet_type = 'mvp' AND player_username = ?
        `, [result.game, result.mvp_player]);

        pool.query(`
          UPDATE users 
          SET balance = balance + 50 
          WHERE id IN (
            SELECT user_id FROM bets 
            WHERE game = ? AND bet_type = 'mvp' AND player_username = ?
          )
        `, [result.game, result.mvp_player]);
      }
    }

    // Позначення програшних ставок
    pool.query(`
      UPDATE bets SET is_won = 0 WHERE is_won IS NULL
    `);

    await bot.sendMessage(chatId, messages.admin.calculationComplete);
    
    logger.info('Розрахунок виграшів завершено');
  } catch (error) {
    logger.error('Помилка розрахунку виграшів:', error);
    await bot.sendMessage(chatId, messages.error.general);
  }
}

async function exportStatistics(bot, chatId) {
  // Експорт статистики у CSV форматі
  // Реалізація буде додана пізніше
  await bot.sendMessage(chatId, '📊 Експорт статистики буде доступний незабаром');
}