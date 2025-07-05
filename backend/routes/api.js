import express from 'express';
import { pool } from '../database/config.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Отримання публічної статистики
router.get('/stats/public', async (req, res) => {
  try {
    const totalBets = await pool.query('SELECT COUNT(*) FROM bets');
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users WHERE is_allowed = true');
    
    res.json({
      totalBets: parseInt(totalBets.rows[0].count),
      totalUsers: parseInt(totalUsers.rows[0].count)
    });
  } catch (error) {
    logger.error('Помилка отримання публічної статистики:', error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Перевірка здоров'я сервера
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default router;