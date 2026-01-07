import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('habitChain.db');

export const initDatabase = () => {
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#3B82F6',
      icon TEXT DEFAULT '🎯',
      frequency TEXT NOT NULL,  -- Store as JSON string
      target INTEGER DEFAULT 1,
      createdAt INTEGER NOT NULL,
      reminderTime TEXT,
      reminderUserName TEXT
    );

    CREATE TABLE IF NOT EXISTS completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habitId INTEGER NOT NULL,
      date INTEGER NOT NULL,
      value INTEGER DEFAULT 1,
      notes TEXT,
      FOREIGN KEY (habitId) REFERENCES habits (id) ON DELETE CASCADE,
      UNIQUE(habitId, date)
    );
  `);

  try {
    const col = db.getFirstSync(
      "SELECT name FROM pragma_table_info('habits') WHERE name = 'category'",
    );
    if (!col) {
      db.execSync('ALTER TABLE habits ADD COLUMN category TEXT');
    }
  } catch (e) {
    // ignore if column already exists or pragma not available
  }

  try {
    const col2 = db.getFirstSync(
      "SELECT name FROM pragma_table_info('habits') WHERE name = 'timeOfDay'",
    );
    if (!col2) {
      db.execSync('ALTER TABLE habits ADD COLUMN timeOfDay TEXT');
    }
  } catch (e) {
    // ignore
  }

  // Ensure reminderTime exists for older databases
  try {
    const col3 = db.getFirstSync(
      "SELECT name FROM pragma_table_info('habits') WHERE name = 'reminderTime'",
    );
    if (!col3) {
      db.execSync('ALTER TABLE habits ADD COLUMN reminderTime TEXT');
    }
  } catch (e) {
    // ignore
  }

  // Ensure reminderUserName exists for older databases
  try {
    const col4 = db.getFirstSync(
      "SELECT name FROM pragma_table_info('habits') WHERE name = 'reminderUserName'",
    );
    if (!col4) {
      db.execSync('ALTER TABLE habits ADD COLUMN reminderUserName TEXT');
    }
  } catch (e) {
    // ignore
  }
};

export default db;
