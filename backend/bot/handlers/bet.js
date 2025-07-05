import { pool } from '../../database/config.js';
import { messages } from '../messages.js';
import { logger } from '../../utils/logger.js';
import { setMvpContext } from './mvp.js';

export async function handleBet(bot, callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;

  try {
    if (data === 'bet_menu') {
      await showBetTypeMenu(bot, chatId);
    } else if (data.startsWith('bet_type_')) {
      const betType = data.split('_')[2];
      await showGameMenu(bot, chatId, betType);
    } else if (data.startsWith('bet_game_')) {
      const parts = data.split('_');
      const betType = parts[2];
      const game = parts[3];
      
      if (betType === 'mvp') {
        await askMvpInput(bot, chatId, userId, game);
      } else {
        await showTeamMenu(bot, chatId, betType, game);
      }
    } else if (data.startsWith('bet_team_')) {
      const parts = data.split('_');
      const betType = parts[2];
      const game = parts[3];
      const teamId = parts[4];
      await confirmBet(bot, chatId, userId, betType, game, teamId);
    } else if (data.startsWith('confirm_bet_')) {
      await processBet(bot, chatId, userId, data);
    } else if (data === 'main_menu') {
      await showMainMenu(bot, chatId);
    }
  } catch (error) {
    logger.error('Помилка обробки ставки:', error);
    await bot.sendMessage(chatId, messages.error.general);
  }
}

async function showMainMenu(bot, chatId) {
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
    '👋 Головне меню\n\nЩо хочеш зробити?',
    { reply_markup: mainMenuKeyboard }
  );
}

async function showBetTypeMenu(bot, chatId) {
  const keyboard = {
    inline_keyboard: [
      [{ text: '🏆 Хто переможе (1 місце)', callback_data: 'bet_type_winner' }],
      [{ text: '2️⃣ Хто буде на 2 місці?', callback_data: 'bet_type_2nd_place' }],
      [{ text: '3️⃣ Хто буде на 3 місці?', callback_data: 'bet_type_3rd_place' }],
      [{ text: '⭐ Хто стане MVP', callback_data: 'bet_type_mvp' }],
      [{ text: '🔙 Назад', callback_data: 'main_menu' }]
    ]
  };

  await bot.sendMessage(chatId, messages.betting.chooseType, { reply_markup: keyboard });
}

async function showGameMenu(bot, chatId, betType) {
  const keyboard = {
    inline_keyboard: [
      [{ text: '🎮 Dota 2', callback_data: `bet_game_${betType}_dota` }],
      [{ text: '🔫 Counter-Strike 2', callback_data: `bet_game_${betType}_cs` }],
      [{ text: '🔙 Назад', callback_data: 'bet_menu' }]
    ]
  };

  await bot.sendMessage(chatId, messages.betting.chooseGame, { reply_markup: keyboard });
}

async function showTeamMenu(bot, chatId, betType, game) {
  // Отримання команд з бази
  const teamsQuery = pool.query(
    'SELECT id, name FROM teams WHERE game = ? ORDER BY name',
    [game]
  );

  const teams = teamsQuery.rows;
  
  if (teams.length === 0) {
    await bot.sendMessage(chatId, '❌ Команди для цієї гри ще не додані');
    return;
  }

  const keyboard = {
    inline_keyboard: [
      ...teams.map(team => [
        { text: team.name, callback_data: `bet_team_${betType}_${game}_${team.id}` }
      ]),
      [{ text: '🔙 Назад', callback_data: `bet_type_${betType}` }]
    ]
  };

  await bot.sendMessage(chatId, messages.betting.chooseTeam, { reply_markup: keyboard });
}

async function askMvpInput(bot, chatId, userId, game) {
  // Встановлюємо контекст для обробки наступного повідомлення
  setMvpContext(userId, game);
  
  await bot.sendMessage(chatId, messages.betting.enterMvp);
}

async function confirmBet(bot, chatId, userId, betType, game, teamId) {
  // Перевірка чи користувач уже робив ставку цього типу
  const existingBet = pool.query(
    'SELECT id FROM bets WHERE user_id = ? AND game = ? AND bet_type = ?',
    [userId, game, betType]
  );

  if (existingBet.rows.length > 0) {
    await bot.sendMessage(chatId, messages.betting.betExists);
    return;
  }

  // Отримання назви команди
  const teamQuery = pool.query(
    'SELECT name FROM teams WHERE id = ?',
    [teamId]
  );

  const teamName = teamQuery.rows[0]?.name || 'Невідома команда';
  
  const betTypeNames = {
    winner: '🏆 Переможець',
    '2nd_place': '2️⃣ 2 місце',
    '3rd_place': '3️⃣ 3 місце'
  };

  const gameNames = {
    dota: 'Dota 2',
    cs: 'Counter-Strike 2'
  };

  const keyboard = {
    inline_keyboard: [
      [{ text: '✅ Підтвердити', callback_data: `confirm_bet_${betType}_${game}_${teamId}` }],
      [{ text: '❌ Скасувати', callback_data: 'bet_menu' }]
    ]
  };

  await bot.sendMessage(
    chatId,
    messages.betting.confirmBet(betTypeNames[betType], gameNames[game], teamName),
    { reply_markup: keyboard }
  );
}

async function processBet(bot, chatId, userId, data) {
  const parts = data.split('_');
  const betType = parts[2];
  const game = parts[3];
  const teamId = parts[4];

  try {
    // Збереження ставки
    pool.query(
      'INSERT INTO bets (user_id, game, bet_type, team_id, points) VALUES (?, ?, ?, ?, ?)',
      [userId, game, betType, teamId, 10]
    );

    await bot.sendMessage(chatId, messages.betting.betPlaced);
    
    logger.info(`Ставка створена: користувач ${userId}, гра ${game}, тип ${betType}, команда ${teamId}`);
  } catch (error) {
    logger.error('Помилка збереження ставки:', error);
    await bot.sendMessage(chatId, messages.error.database);
  }
}