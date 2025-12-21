import dotenv from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../../.env') })

// Dynamic imports to ensure env vars are loaded first
const { createApp } = await import('./app.js')
const { initializeDatabase } = await import('./config/database.js')

const PORT = process.env.PORT || 3000

// Initialize database
initializeDatabase()

// Create and start server
const app = createApp()

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log('Press Ctrl+C to stop')
})
