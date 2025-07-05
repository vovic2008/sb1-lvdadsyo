import { db } from './config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeDatabase() {
  try {
    // Ensure data directory exists
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Create tables
    const schema = `
      -- Створення таблиці користувачів
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT,
        name TEXT,
        is_admin INTEGER DEFAULT 0,
        is_allowed INTEGER DEFAULT 0,
        balance INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Створення таблиці команд
      CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        game TEXT NOT NULL CHECK (game IN ('dota', 'cs')),
        is_top3 INTEGER DEFAULT 0,
        is_winner INTEGER DEFAULT 0,
        place INTEGER DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Створення таблиці ставок
      CREATE TABLE IF NOT EXISTS bets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        game TEXT NOT NULL CHECK (game IN ('dota', 'cs')),
        bet_type TEXT NOT NULL CHECK (bet_type IN ('winner', '2nd_place', '3rd_place', 'mvp')),
        team_id INTEGER REFERENCES teams(id),
        player_username TEXT,
        points INTEGER DEFAULT 10,
        is_won INTEGER DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Створення таблиці результатів турніру
      CREATE TABLE IF NOT EXISTS tournament_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game TEXT NOT NULL CHECK (game IN ('dota', 'cs')),
        winner_team_id INTEGER REFERENCES teams(id),
        second_place_team_id INTEGER REFERENCES teams(id),
        third_place_team_id INTEGER REFERENCES teams(id),
        mvp_player TEXT,
        is_finalized INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Створення індексів для оптимізації
      CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);
      CREATE INDEX IF NOT EXISTS idx_bets_game ON bets(game);
      CREATE INDEX IF NOT EXISTS idx_teams_game ON teams(game);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_tournament_results_game ON tournament_results(game);
    `;

    // Execute schema
    db.exec(schema);

    // Insert test data if tables are empty
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (userCount.count === 0) {
      const insertUsers = db.prepare(`
        INSERT INTO users (id, username, name, is_admin, is_allowed, balance) 
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      insertUsers.run(123456789, 'admin', 'Адміністратор', 1, 1, 0);
      insertUsers.run(987654321, 'testuser', 'Тестовий Користувач', 0, 1, 100);
    }

    // Insert test teams if tables are empty
    const teamCount = db.prepare('SELECT COUNT(*) as count FROM teams').get();
    if (teamCount.count === 0) {
      const insertTeam = db.prepare('INSERT INTO teams (name, game) VALUES (?, ?)');
      
      // Dota 2 teams
      insertTeam.run('Team Liquid', 'dota');
      insertTeam.run('OG', 'dota');
      insertTeam.run('Evil Geniuses', 'dota');
      insertTeam.run('PSG.LGD', 'dota');
      
      // CS2 teams
      insertTeam.run('Natus Vincere', 'cs');
      insertTeam.run('Astralis', 'cs');
      insertTeam.run('FaZe Clan', 'cs');
      insertTeam.run('G2 Esports', 'cs');
    }

    console.log('SQLite database initialized successfully');
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  }
}

export default initializeDatabase;