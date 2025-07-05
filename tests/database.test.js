import { pool } from '../backend/database/config.js';
import { initializeDatabase } from '../backend/database/init.js';

describe('Database Tests', () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  afterAll(async () => {
    await pool.end();
  });

  test('повинен підключитися до бази даних', async () => {
    const client = await pool.connect();
    expect(client).toBeTruthy();
    client.release();
  });

  test('повинен створити таблицю users', async () => {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    expect(result.rows[0].exists).toBe(true);
  });

  test('повинен створити таблицю teams', async () => {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'teams'
      );
    `);
    expect(result.rows[0].exists).toBe(true);
  });

  test('повинен створити таблицю bets', async () => {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'bets'
      );
    `);
    expect(result.rows[0].exists).toBe(true);
  });

  test('повинен додати користувача', async () => {
    const testUser = {
      id: 123456789,
      username: 'testuser',
      name: 'Тест Користувач',
      is_allowed: true
    };

    await pool.query(
      'INSERT INTO users (id, username, name, is_allowed) VALUES ($1, $2, $3, $4)',
      [testUser.id, testUser.username, testUser.name, testUser.is_allowed]
    );

    const result = await pool.query('SELECT * FROM users WHERE id = $1', [testUser.id]);
    expect(result.rows[0].username).toBe(testUser.username);

    // Очищення
    await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);
  });

  test('повинен додати команду', async () => {
    const testTeam = {
      name: 'Тестова Команда',
      game: 'dota'
    };

    const result = await pool.query(
      'INSERT INTO teams (name, game) VALUES ($1, $2) RETURNING id',
      [testTeam.name, testTeam.game]
    );

    expect(result.rows[0].id).toBeTruthy();

    // Очищення
    await pool.query('DELETE FROM teams WHERE id = $1', [result.rows[0].id]);
  });
});