import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import { pool } from '../database/config.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Налаштування multer для завантаження файлів
const upload = multer({ dest: 'uploads/' });

// Отримання статистики
router.get('/stats', async (req, res) => {
  try {
    // Загальна статистика
    const totalUsers = pool.query('SELECT COUNT(*) as count FROM users WHERE is_allowed = 1');
    const totalBets = pool.query('SELECT COUNT(*) as count FROM bets');
    const totalTeams = pool.query('SELECT COUNT(*) as count FROM teams');
    
    // Статистика ставок по грі
    const betsByGame = pool.query(`
      SELECT game, COUNT(*) as count 
      FROM bets 
      GROUP BY game
    `);

    // Топ користувачів
    const topUsers = pool.query(`
      SELECT 
        u.name, 
        u.username,
        COUNT(b.id) as bet_count,
        u.balance
      FROM users u
      LEFT JOIN bets b ON u.id = b.user_id
      WHERE u.is_allowed = 1
      GROUP BY u.id, u.name, u.username, u.balance
      ORDER BY u.balance DESC, bet_count DESC
      LIMIT 10
    `);

    res.json({
      totalUsers: totalUsers.rows[0].count,
      totalBets: totalBets.rows[0].count,
      totalTeams: totalTeams.rows[0].count,
      betsByGame: betsByGame.rows,
      topUsers: topUsers.rows
    });
  } catch (error) {
    logger.error('Помилка отримання статистики:', error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Завантаження команд
router.post('/upload-teams', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не завантажено' });
    }

    const filePath = req.file.path;
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          let count = 0;
          for (const team of results) {
            if (team.name && team.game) {
              try {
                pool.query(
                  'INSERT INTO teams (name, game) VALUES (?, ?)',
                  [team.name, team.game]
                );
                count++;
              } catch (error) {
                // Ignore duplicates
                if (!error.message.includes('UNIQUE constraint failed')) {
                  throw error;
                }
              }
            }
          }
          
          // Видалення тимчасового файлу
          fs.unlinkSync(filePath);
          
          res.json({ message: 'Команди успішно завантажені', count });
        } catch (error) {
          logger.error('Помилка збереження команд:', error);
          res.status(500).json({ error: 'Помилка збереження команд' });
        }
      })
      .on('error', (error) => {
        logger.error('Помилка читання CSV файлу:', error);
        res.status(500).json({ error: 'Помилка читання файлу' });
      });
  } catch (error) {
    logger.error('Помилка завантаження файлу:', error);
    res.status(500).json({ error: 'Помилка завантаження файлу' });
  }
});

// Завантаження користувачів
router.post('/upload-users', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не завантажено' });
    }

    const filePath = req.file.path;
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          let count = 0;
          for (const user of results) {
            if (user.id && user.username && user.name) {
              pool.query(
                'INSERT OR REPLACE INTO users (id, username, name, is_allowed, is_admin) VALUES (?, ?, ?, ?, ?)',
                [user.id, user.username, user.name, user.is_allowed === 'true' ? 1 : 0, user.is_admin === 'true' ? 1 : 0]
              );
              count++;
            }
          }
          
          fs.unlinkSync(filePath);
          res.json({ message: 'Користувачі успішно завантажені', count });
        } catch (error) {
          logger.error('Помилка збереження користувачів:', error);
          res.status(500).json({ error: 'Помилка збереження користувачів' });
        }
      })
      .on('error', (error) => {
        logger.error('Помилка читання CSV файлу:', error);
        res.status(500).json({ error: 'Помилка читання файлу' });
      });
  } catch (error) {
    logger.error('Помилка завантаження файлу:', error);
    res.status(500).json({ error: 'Помилка завантаження файлу' });
  }
});

// Встановлення переможців
router.post('/set-winners', async (req, res) => {
  try {
    const { game, winnerId, secondPlaceId, thirdPlaceId } = req.body;

    if (!game) {
      return res.status(400).json({ error: 'Гра не вказана' });
    }

    pool.query(
      'INSERT OR REPLACE INTO tournament_results (game, winner_team_id, second_place_team_id, third_place_team_id) VALUES (?, ?, ?, ?)',
      [game, winnerId || null, secondPlaceId || null, thirdPlaceId || null]
    );

    res.json({ message: 'Переможці встановлені' });
  } catch (error) {
    logger.error('Помилка встановлення переможців:', error);
    res.status(500).json({ error: 'Помилка встановлення переможців' });
  }
});

// Встановлення MVP
router.post('/set-mvp', async (req, res) => {
  try {
    const { game, playerUsername } = req.body;

    if (!game || !playerUsername) {
      return res.status(400).json({ error: 'Гра або гравець не вказані' });
    }

    pool.query(
      'UPDATE tournament_results SET mvp_player = ? WHERE game = ?',
      [playerUsername, game]
    );

    res.json({ message: 'MVP встановлено' });
  } catch (error) {
    logger.error('Помилка встановлення MVP:', error);
    res.status(500).json({ error: 'Помилка встановлення MVP' });
  }
});

// Розрахунок виграшів
router.post('/calculate-winnings', async (req, res) => {
  try {
    // Отримання результатів турніру
    const results = pool.query(`
      SELECT * FROM tournament_results WHERE is_finalized = 1
    `);

    let totalCalculated = 0;

    for (const result of results.rows) {
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
        totalCalculated++;
      }

      // Розрахунок для 2 і 3 місця
      const topTeams = [result.second_place_team_id, result.third_place_team_id];
      
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
          totalCalculated++;
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
        totalCalculated++;
      }
    }

    // Позначення програшних ставок
    pool.query(`
      UPDATE bets SET is_won = 0 WHERE is_won IS NULL
    `);

    res.json({ 
      message: 'Розрахунок виграшів завершено', 
      calculated: totalCalculated 
    });
    
    logger.info('Розрахунок виграшів завершено');
  } catch (error) {
    logger.error('Помилка розрахунку виграшів:', error);
    res.status(500).json({ error: 'Помилка розрахунку виграшів' });
  }
});

// Експорт статистики
router.get('/export-stats', async (req, res) => {
  try {
    const stats = pool.query(`
      SELECT 
        u.name,
        u.username,
        u.balance,
        COUNT(b.id) as total_bets,
        SUM(CASE WHEN b.is_won = 1 THEN 1 ELSE 0 END) as won_bets
      FROM users u
      LEFT JOIN bets b ON u.id = b.user_id
      WHERE u.is_allowed = 1
      GROUP BY u.id, u.name, u.username, u.balance
      ORDER BY u.balance DESC
    `);

    // Створення CSV контенту
    let csvContent = 'Name,Username,Balance,Total Bets,Won Bets\n';
    stats.rows.forEach(row => {
      csvContent += `"${row.name}","${row.username}",${row.balance},${row.total_bets},${row.won_bets}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="betting_stats.csv"');
    res.send(csvContent);
  } catch (error) {
    logger.error('Помилка експорту статистики:', error);
    res.status(500).json({ error: 'Помилка експорту статистики' });
  }
});

// Отримання команд
router.get('/teams', async (req, res) => {
  try {
    const teams = pool.query('SELECT * FROM teams ORDER BY game, name');
    res.json(teams.rows);
  } catch (error) {
    logger.error('Помилка отримання команд:', error);
    res.status(500).json({ error: 'Помилка отримання команд' });
  }
});

// Отримання користувачів
router.get('/users', async (req, res) => {
  try {
    const users = pool.query('SELECT * FROM users ORDER BY name');
    res.json(users.rows);
  } catch (error) {
    logger.error('Помилка отримання користувачів:', error);
    res.status(500).json({ error: 'Помилка отримання користувачів' });
  }
});

// Отримання ставок
router.get('/bets', async (req, res) => {
  try {
    const bets = pool.query(`
      SELECT 
        b.*,
        u.name as user_name,
        u.username as user_username,
        t.name as team_name
      FROM bets b
      JOIN users u ON b.user_id = u.id
      LEFT JOIN teams t ON b.team_id = t.id
      ORDER BY b.created_at DESC
    `);
    res.json(bets.rows);
  } catch (error) {
    logger.error('Помилка отримання ставок:', error);
    res.status(500).json({ error: 'Помилка отримання ставок' });
  }
});

export default router;