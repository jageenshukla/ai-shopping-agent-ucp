import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.DATABASE_PATH || './data/seller.db';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      sku TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      image_url TEXT,
      inventory_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS checkout_sessions (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'incomplete',
      items TEXT NOT NULL,
      buyer_info TEXT,
      shipping_address TEXT,
      total_amount REAL,
      subtotal REAL,
      tax REAL,
      currency TEXT DEFAULT 'USD',
      payment_credential TEXT,
      ap2_mandate TEXT,
      continue_url TEXT,
      nonce TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      checkout_session_id TEXT REFERENCES checkout_sessions(id),
      customer_email TEXT,
      customer_name TEXT,
      items TEXT NOT NULL,
      total_amount REAL,
      currency TEXT,
      payment_status TEXT,
      fulfillment_status TEXT DEFAULT 'pending',
      stripe_payment_intent_id TEXT,
      shipping_address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS used_nonces (
      nonce TEXT PRIMARY KEY,
      used_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Database tables created successfully');
});

export default db;
