import { Request, Response, NextFunction } from 'express'
import { GAME_PASSWORD } from '../config/constants.js'

const TOKEN_PREFIX = 'Bearer '

export function requireBearerToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith(TOKEN_PREFIX)) {
    return res.status(401).json({ error: 'Authorization token required' })
  }

  const token = authHeader.slice(TOKEN_PREFIX.length).trim()

  if (!token || token !== GAME_PASSWORD) {
    return res.status(401).json({ error: 'Invalid authorization token' })
  }

  return next()
}
