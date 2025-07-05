import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create SQLite database
const dbPath = path.join(__dirname, '../../data/betbattlebot.db');
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create a pool-like interface for compatibility
export const pool = {
  query: (sql, params = []) => {
    try {
      if (sql.trim().toLowerCase().startsWith('select')) {
        const stmt = db.prepare(sql);
        const rows = stmt.all(params);
        return { rows };
      } else {
        const stmt = db.prepare(sql);
        const result = stmt.run(params);
        return { 
          rows: [{ 
            insertId: result.lastInsertRowid,
            changes: result.changes 
          }] 
        };
      }
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  },
  
  connect: () => Promise.resolve({
    query: pool.query,
    release: () => {}
  }),
  
  end: () => db.close()
};