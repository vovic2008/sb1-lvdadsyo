import dotenv from 'dotenv';

// Завантажуємо тестове середовище
dotenv.config({ path: '.env.test' });

// Глобальні налаштування для тестів
global.console = {
  ...console,
  // Приховуємо логи під час тестування
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};