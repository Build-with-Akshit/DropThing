const path = require('path');
const fs = require('fs');

// Detect if Turso Cloud SQLite is configured
const isTurso = process.env.DATABASE_PROVIDER === 'turso' || 
  (!!process.env.TURSO_DATABASE_URL && !!process.env.TURSO_AUTH_TOKEN);

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS folders (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    is_temporary INTEGER DEFAULT 1,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    folder_id TEXT NOT NULL,
    item_type TEXT NOT NULL,
    title TEXT,
    text_content TEXT,
    file_name TEXT,
    stored_name TEXT,
    file_size INTEGER DEFAULT 0,
    mime_type TEXT,
    category TEXT DEFAULT 'other',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_folders_code ON folders(code);
  CREATE INDEX IF NOT EXISTS idx_items_folder_id ON items(folder_id);
`;

let db;

if (isTurso) {
  console.log('⚡ Connecting to Turso Cloud SQLite Database...');
  const { createClient } = require('@libsql/client');
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
  });

  // Execute schema creation on Turso cloud
  client.executeMultiple(SCHEMA_SQL)
    .then(() => console.log('✅ Turso Cloud Database initialized successfully!'))
    .catch((err) => console.error('❌ Failed to initialize Turso schema:', err.message));

  db = {
    isCloud: true,
    client,

    async get(sql, params = []) {
      const res = await client.execute({ sql, args: params });
      return res.rows[0] || null;
    },

    async all(sql, params = []) {
      const res = await client.execute({ sql, args: params });
      return res.rows || [];
    },

    async run(sql, params = []) {
      const res = await client.execute({ sql, args: params });
      return {
        changes: res.rowsAffected,
        lastInsertRowid: res.lastInsertRowid
      };
    },

    async exec(sql) {
      return await client.executeMultiple(sql);
    },

    prepare(sql) {
      return {
        get: (...params) => db.get(sql, params),
        all: (...params) => db.all(sql, params),
        run: (...params) => db.run(sql, params)
      };
    }
  };
} else {
  // Local SQLite (better-sqlite3)
  const Database = require('better-sqlite3');
  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Preserve existing droppin.db or use droppin.db
  const dbPath = path.join(dataDir, 'droppin.db');
  const localDb = new Database(dbPath);

  // Performance pragmas
  localDb.pragma('foreign_keys = ON');
  localDb.pragma('journal_mode = WAL');

  // Initialize schema
  localDb.exec(SCHEMA_SQL);
  console.log('💾 Local SQLite Database initialized (data/droppin.db)');

  db = {
    isCloud: false,
    localDb,

    get(sql, params = []) {
      return localDb.prepare(sql).get(...params);
    },

    all(sql, params = []) {
      return localDb.prepare(sql).all(...params);
    },

    run(sql, params = []) {
      return localDb.prepare(sql).run(...params);
    },

    exec(sql) {
      return localDb.exec(sql);
    },

    prepare(sql) {
      const stmt = localDb.prepare(sql);
      return {
        get: (...params) => stmt.get(...params),
        all: (...params) => stmt.all(...params),
        run: (...params) => stmt.run(...params)
      };
    }
  };
}

module.exports = db;
