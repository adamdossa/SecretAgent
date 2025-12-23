import Database from 'better-sqlite3'
import { readFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '../../../data')
const dbPath = join(dataDir, 'game.db')

// Create data directory if it doesn't exist
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

export const db = new Database(dbPath)

// Enable foreign keys
db.pragma('foreign_keys = ON')

export function initializeDatabase() {
  const schemaPath = join(__dirname, '../db/schema.sql')
  const schema = readFileSync(schemaPath, 'utf-8')
  db.exec(schema)
  console.log('Database initialized')
}

export function getDb() {
  return db
}
