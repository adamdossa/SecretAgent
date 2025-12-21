import OpenAI from 'openai'

const apiKey = process.env.OPENAI_API_KEY

export const openai = apiKey && apiKey !== 'sk-your-api-key-here'
  ? new OpenAI({ apiKey })
  : null

export const MODELS = {
  text: 'gpt-4o',
  image: 'dall-e-3',
} as const

export function requireOpenAI(): OpenAI {
  if (!openai) {
    throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in .env file.')
  }
  return openai
}
