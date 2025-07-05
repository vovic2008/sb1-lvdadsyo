-- Ініціалізація бази даних для BetBattleBot

-- Створення таблиці користувачів
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY,
  username VARCHAR(255),
  name VARCHAR(255),
  is_admin BOOLEAN DEFAULT FALSE,
  is_allowed BOOLEAN DEFAULT FALSE,
  balance INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Створення таблиці команд
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  game VARCHAR(10) NOT NULL CHECK (game IN ('dota', 'cs')),
  is_top3 BOOLEAN DEFAULT FALSE,
  is_winner BOOLEAN DEFAULT FALSE,
  place INTEGER DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Створення таблиці ставок
CREATE TABLE IF NOT EXISTS bets (
  id SERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  game VARCHAR(10) NOT NULL CHECK (game IN ('dota', 'cs')),
  bet_type VARCHAR(20) NOT NULL CHECK (bet_type IN ('winner', '2nd_place', '3rd_place', 'mvp')),
  team_id INTEGER REFERENCES teams(id),
  player_username VARCHAR(255),
  points INTEGER DEFAULT 10,
  is_won BOOLEAN DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Створення таблиці MVP
CREATE TABLE IF NOT EXISTS mvp (
  id SERIAL PRIMARY KEY,
  game VARCHAR(10) NOT NULL CHECK (game IN ('dota', 'cs')),
  player_username VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Створення таблиці результатів турніру
CREATE TABLE IF NOT EXISTS tournament_results (
  id SERIAL PRIMARY KEY,
  game VARCHAR(10) NOT NULL CHECK (game IN ('dota', 'cs')),
  winner_team_id INTEGER REFERENCES teams(id),
  second_place_team_id INTEGER REFERENCES teams(id),
  third_place_team_id INTEGER REFERENCES teams(id),
  mvp_player VARCHAR(255),
  is_finalized BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Створення індексів для оптимізації
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_game ON bets(game);
CREATE INDEX IF NOT EXISTS idx_teams_game ON teams(game);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_tournament_results_game ON tournament_results(game);

-- Додавання тестових даних
INSERT INTO users (id, username, name, is_admin, is_allowed, balance) VALUES 
(123456789, 'admin', 'Адміністратор', true, true, 0),
(987654321, 'testuser', 'Тестовий Користувач', false, true, 100)
ON CONFLICT (id) DO NOTHING;

-- Додавання тестових команд
INSERT INTO teams (name, game) VALUES 
('Team Liquid', 'dota'),
('OG', 'dota'),
('Evil Geniuses', 'dota'),
('PSG.LGD', 'dota'),
('Natus Vincere', 'cs'),
('Astralis', 'cs'),
('FaZe Clan', 'cs'),
('G2 Esports', 'cs')
ON CONFLICT DO NOTHING;