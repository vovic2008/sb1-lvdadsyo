import { pool } from '../../database/config.js';
import { messages } from '../messages.js';
import { logger } from '../../utils/logger.js';

export async function handleStats(bot, callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;

  try {
    if (data === 'stats_menu') {
      await showStatsMenu(bot, chatId);
    } else if (data === 'stats_my_bets') {
      await showMyBets(bot, chatId, userId);
    } else if (data === 'stats_top_players') {
      await showTopPlayers(bot, chatId);
    } else if (data === 'stats_results') {
      await showTournamentResults(bot, chatId);
    }
  } catch (error) {
    logger.error('Помилка обробки статистики:', error);
    await bot.sendMessage(chatId, messages.error.general);
  }
}

async function showStatsMenu(bot, chatId) {
  const keyboard = {
    inline_keyboard: [
      [{ text: '📊 Мої ставки', callback_data: 'stats_my_bets' }],
      [{ text: '🏆 ТОП вболівальників', callback_data: 'stats_top_players' }],
      [{ text: '📈 Результати турніру', callback_data: 'stats_results' }],
      [{ text: '🔙 Назад', callback_data: 'main_menu' }]
    ]
  };

  await bot.sendMessage(chatId, messages.statistics.myBets, { reply_markup: keyboard });
}

async function showMyBets(bot, chatId, userId) {
  const betsQuery = pool.query(`
    SELECT 
      b.game,
      b.bet_type,
      t.name as team_name,
      b.player_username,
      b.points,
      b.is_won
    FROM bets b
    LEFT JOIN teams t ON b.team_id = t.id
    WHERE b.user_id = ?
    ORDER BY b.game, b.bet_type
  `, [userId]);

  const bets = betsQuery.rows;

  if (bets.length === 0) {
    await bot.sendMessage(chatId, messages.statistics.noBets);
    return;
  }

  // Групування ставок за грою
  const dotaBets = bets.filter(bet => bet.game === 'dota');
  const csBets = bets.filter(bet => bet.game === 'cs');

  let message = '📊 Мої ставки:\n\n';

  if (dotaBets.length > 0) {
    message += '🎮 Dota 2:\n';
    dotaBets.forEach(bet => {
      const betTypeEmoji = {
        winner: '🏆',
        '2nd_place': '2️⃣',
        '3rd_place': '3️⃣',
        mvp: '⭐'
      };
      
      const choice = bet.team_name || bet.player_username;
      const status = bet.is_won === 1 ? '✅' : bet.is_won === 0 ? '❌' : '⏳';
      
      message += `${betTypeEmoji[bet.bet_type]} ${choice} ${status}\n`;
    });
    message += '\n';
  }

  if (csBets.length > 0) {
    message += '🔫 CS2:\n';
    csBets.forEach(bet => {
      const betTypeEmoji = {
        winner: '🏆',
        '2nd_place': '2️⃣',
        '3rd_place': '3️⃣',
        mvp: '⭐'
      };
      
      const choice = bet.team_name || bet.player_username;
      const status = bet.is_won === 1 ? '✅' : bet.is_won === 0 ? '❌' : '⏳';
      
      message += `${betTypeEmoji[bet.bet_type]} ${choice} ${status}\n`;
    });
    message += '\n';
  }

  // Підрахунок потенційного виграшу
  const potentialWin = bets.length * 10; // Мінімум 10 балів за ставку
  const maxWin = dotaBets.length * 50 + csBets.length * 50; // Максимум за MVP
  
  message += messages.statistics.potentialWin(`${potentialWin}-${maxWin}`);

  await bot.sendMessage(chatId, message);
}

async function showTopPlayers(bot, chatId) {
  const topQuery = pool.query(`
    SELECT 
      u.name,
      u.username,
      COUNT(b.id) as bet_count,
      SUM(CASE WHEN b.is_won = 1 THEN 
        CASE 
          WHEN b.bet_type = 'winner' THEN 30
          WHEN b.bet_type = 'mvp' THEN 50
          ELSE 10
        END
      ELSE 0 END) as total_wins
    FROM users u
    LEFT JOIN bets b ON u.id = b.user_id
    WHERE u.is_allowed = 1
    GROUP BY u.id, u.name, u.username
    ORDER BY total_wins DESC, bet_count DESC
    LIMIT 10
  `);

  const topPlayers = topQuery.rows;

  let message = '🏆 ТОП вболівальників:\n\n';

  topPlayers.forEach((player, index) => {
    const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}.`;
    message += `${medal} ${player.name} - ${player.total_wins} балів (${player.bet_count} ставок)\n`;
  });

  await bot.sendMessage(chatId, message);
}

async function showTournamentResults(bot, chatId) {
  const resultsQuery = pool.query(`
    SELECT 
      tr.game,
      t1.name as winner_name,
      t2.name as second_place_name,
      t3.name as third_place_name,
      tr.mvp_player,
      tr.is_finalized
    FROM tournament_results tr
    LEFT JOIN teams t1 ON tr.winner_team_id = t1.id
    LEFT JOIN teams t2 ON tr.second_place_team_id = t2.id
    LEFT JOIN teams t3 ON tr.third_place_team_id = t3.id
    ORDER BY tr.game
  `);

  const results = resultsQuery.rows;

  if (results.length === 0) {
    await bot.sendMessage(chatId, '📈 Результати турніру ще не оголошені');
    return;
  }

  let message = '📈 Результати турніру:\n\n';

  results.forEach(result => {
    const gameTitle = result.game === 'dota' ? '🎮 Dota 2' : '🔫 CS2';
    message += `${gameTitle}:\n`;
    
    if (result.is_finalized) {
      message += `🏆 1 місце: ${result.winner_name || 'TBD'}\n`;
      message += `🥈 2 місце: ${result.second_place_name || 'TBD'}\n`;
      message += `🥉 3 місце: ${result.third_place_name || 'TBD'}\n`;
      message += `⭐ MVP: ${result.mvp_player || 'TBD'}\n`;
    } else {
      message += '⏳ Результати ще не фіналізовані\n';
    }
    message += '\n';
  });

  await bot.sendMessage(chatId, message);
}