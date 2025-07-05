import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import initializeDatabase from './database/init.js';
import { startTelegramBot } from './bot/index.js';
import { logger } from './utils/logger.js';
import adminRoutes from './routes/admin.js';
import apiRoutes from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API маршрути
app.use('/api/admin', adminRoutes);
app.use('/api', apiRoutes);

// Статичні файли для фронтенду (тільки в продакшені)
if (isProduction) {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  // Головна сторінка адмінки (тільки в продакшені)
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
} else {
  // В режимі розробки повертаємо JSON для API запитів
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: 'API endpoint not found' });
    } else {
      res.json({ 
        message: 'Backend server is running in development mode',
        frontend: 'Frontend is served by Vite dev server on port 5173'
      });
    }
  });
}

// Обробка помилок
app.use((err, req, res, next) => {
  logger.error('Помилка сервера:', err);
  res.status(500).json({ error: 'Внутрішня помилка сервера' });
});

// Запуск сервера
async function startServer() {
  try {
    // Запуск Express сервера
    app.listen(PORT, () => {
      logger.info(`Сервер запущений на порту ${PORT}`);
      if (!isProduction) {
        logger.info('Режим розробки: фронтенд обслуговується Vite dev server');
      }
    });

    // Ініціалізація бази даних з повторними спробами
    let dbInitialized = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!dbInitialized && attempts < maxAttempts) {
      attempts++;
      logger.info(`Спроба підключення до бази даних ${attempts}/${maxAttempts}`);
      
      dbInitialized = await initializeDatabase();
      
      if (!dbInitialized) {
        logger.warn(`Не вдалося підключитися до бази даних. Повторна спроба через 5 секунд...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    if (dbInitialized) {
      logger.info('База даних ініціалізована');
      
      // Запуск Telegram бота тільки після успішного підключення до БД
      await startTelegramBot();
      logger.info('Telegram бот запущений');
    } else {
      logger.error('Не вдалося підключитися до бази даних після всіх спроб');
      logger.info('Сервер працює без бази даних та Telegram бота');
    }
  } catch (error) {
    logger.error('Помилка запуску сервера:', error);
    // Не завершуємо процес, щоб сервер міг працювати без БД
  }
}

startServer();