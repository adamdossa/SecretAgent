import { requireOpenAI, MODELS } from '../config/openai.js'
import { db } from '../config/database.js'

export async function generateMissionOptions(
  playerName: string,
  playerId: number
): Promise<string[]> {
  // Get all existing missions to avoid duplicates
  const existingMissions = db
    .prepare('SELECT option_text FROM mission_options')
    .all() as { option_text: string }[]

  const existingList = existingMissions.map((m) => m.option_text)

  const prompt = `You are helping create a family Christmas game called "Secret Missions".

A "mission" is a subtle task where a player must get another family member to do something without them realizing it's a mission. Examples:
- Get someone to offer you a drink without asking for one
- Get someone to sing part of a Christmas song
- Get someone to tell you a story about their childhood
- Get someone to compliment your outfit

Generate 3 unique secret missions for ${playerName}.

Rules:
- The mission must involve at least one other person
- Should be subtle - the other person shouldn't realize they're part of a mission
- Not too easy - we don't want players completing it 10+ times in a day
- Not too hard - should be achievable at least 2-3 times during a family gathering
- The other person involved should be able to "spot" that something is up if they're paying attention
- Family-friendly and fun
- Should be DIFFERENT from these already-used missions: ${existingList.slice(0, 20).join('; ')}

Return a JSON object with this exact format: { "missions": ["mission 1", "mission 2", "mission 3"] }`

  const response = await requireOpenAI().chat.completions.create({
    model: MODELS.text,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.9,
  })

  const content = response.choices[0].message.content
  if (!content) throw new Error('No response from OpenAI')

  const result = JSON.parse(content)
  return result.missions || result.options || Object.values(result).flat().slice(0, 3)
}

export async function generateMissionImage(missionText: string): Promise<string> {
  const prompt = `Create a simple, cute, Christmas-themed illustration that represents this secret mission: "${missionText}".
Style: Warm, festive, cartoon-like, suitable for all ages.
Use red and green Christmas colors with a cozy holiday feel.
No text in the image. Simple and clear imagery that hints at the mission.`

  const response = await requireOpenAI().images.generate({
    model: MODELS.image,
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
    response_format: 'b64_json',
  })

  const imageData = response.data[0].b64_json
  if (!imageData) throw new Error('No image generated')

  return `data:image/png;base64,${imageData}`
}
