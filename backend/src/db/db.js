import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DATABASE_PATH || './data/workouts.db';
const dbDir = dirname(dbPath);

// Ensure data directory exists
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

// Initialize database
const db = new sqlite3.Database(dbPath);

// Promisify database methods
db.runAsync = promisify(db.run.bind(db));
db.getAsync = promisify(db.get.bind(db));
db.allAsync = promisify(db.all.bind(db));
db.execAsync = promisify(db.exec.bind(db));

// Initialize database (using exec for multiple statements)
async function initializeDatabase() {
  // Enable foreign keys and WAL mode
  await db.runAsync('PRAGMA foreign_keys = ON');
  await db.runAsync('PRAGMA journal_mode = WAL');

  // Initialize schema (exec supports multiple statements)
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf8');
  await db.execAsync(schema);

  // Check if we need to seed
  const result = await db.getAsync('SELECT COUNT(*) as count FROM exercises');
  if (result.count === 0) {
    console.log('Seeding database with initial exercises...');
    const seedPath = join(__dirname, 'seed.sql');
    const seed = readFileSync(seedPath, 'utf8');
    await db.execAsync(seed);
    console.log('Database seeded successfully');
  }
}

// Initialize before exporting
await initializeDatabase();

export default db;
