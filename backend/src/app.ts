import express from 'express'
import cors from 'cors'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { errorHandler } from './middleware/errorHandler.js'
import { requireBearerToken } from './middleware/authToken.js'
import authRoutes from './routes/auth.js'
import gameRoutes from './routes/game.js'
import tellsRoutes from './routes/tells.js'
import missionsRoutes from './routes/missions.js'
import guessesRoutes from './routes/guesses.js'
import adminRoutes from './routes/admin.js'
import prizesRoutes from './routes/prizes.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export function createApp() {
  const app = express()

  // Middleware
  app.use(cors())
  app.use(express.json())

  // Shared bearer token protection for all API routes
  app.use('/api', requireBearerToken)

  // API routes
  app.use('/api/auth', authRoutes)
  app.use('/api/game', gameRoutes)
  app.use('/api/tells', tellsRoutes)
  app.use('/api/missions', missionsRoutes)
  app.use('/api/guesses', guessesRoutes)
  app.use('/api/admin', adminRoutes)
  app.use('/api/prizes', prizesRoutes)

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // Serve frontend in production
  const frontendPath = join(__dirname, '../../frontend/dist')
  app.use(express.static(frontendPath))

  // SPA fallback
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(frontendPath, 'index.html'))
    }
  })

  // Error handler
  app.use(errorHandler)

  return app
}
