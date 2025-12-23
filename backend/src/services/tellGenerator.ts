import { requireOpenAI, MODELS } from '../config/openai.js'
import { db } from '../config/database.js'

export async function generateTellOptions(
  playerName: string,
  playerId: number
): Promise<string[]> {
  // Get all existing tells to avoid duplicates
  const existingTells = db
    .prepare('SELECT option_text FROM tell_options')
    .all() as { option_text: string }[]

  const existingList = existingTells.map((t) => t.option_text)

  const prompt = `You are helping create a family Christmas game called "Secret Tells".

A "tell" is a subtle behavior a player must do throughout the day whenever a specific trigger happens. Examples:
- Touch your ear every time someone says "Christmas"
- Blink three times whenever someone laughs
- Clear your throat when someone mentions food
- Scratch your nose when someone says a name

Generate 3 unique, fun, and achievable "secret tells" for ${playerName}.

Rules:
- Each tell should be subtle enough to not be immediately obvious
- Should be doable multiple times throughout a family gathering
- Should be family-friendly and safe for all ages
- Should be DIFFERENT from these already-used tells: ${existingList.slice(0, 20).join('; ')}
- Make them fun and slightly challenging but not too hard
- Include the trigger (what causes the tell) and the action (what to do)

Return a JSON object with this exact format: { "tells": ["tell 1", "tell 2", "tell 3"] }`

  const response = await requireOpenAI().chat.completions.create({
    model: MODELS.text,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.9,
  })

  const content = response.choices[0].message.content
  if (!content) throw new Error('No response from OpenAI')

  const result = JSON.parse(content)
  return result.tells || result.options || Object.values(result).flat().slice(0, 3)
}

export async function generateTellImage(tellText: string): Promise<string> {
  const prompt = `Create a simple, cute, Christmas-themed illustration that represents this secret tell behavior: "${tellText}".
Style: Warm, festive, cartoon-like, suitable for all ages.
Use red and green Christmas colors with a cozy holiday feel.
No text in the image. Simple and clear imagery.`

  const response = await requireOpenAI().images.generate({
    model: MODELS.image,
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
    response_format: 'b64_json',
  })

  if (!response.data || !response.data[0]) throw new Error('No image response')
  const imageData = response.data[0].b64_json
  if (!imageData) throw new Error('No image generated')

  return `data:image/png;base64,${imageData}`
}
