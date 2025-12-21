# Silver Leigh Secret Agents

A Christmas-themed family game web app with Secret Tells, Secret Missions, and AI-powered features.

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up your OpenAI API key

Edit the `.env` file and add your OpenAI API key:
```
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### 3. Initialize the database
```bash
npm run db:seed
```

### 4. Build and start
```bash
npm run build
npm start
```

The app will be available at **http://localhost:3000**

## How to Play

### Login
- Everyone opens http://localhost:3000 on their phone/tablet
- Select your name from the dropdown
- Suggest a team name (optional, but fun!)
- Enter the password: `Hughes2026`

### Secret Tell
- Each player gets 3 AI-generated secret tells to choose from
- A "tell" is a subtle behavior you do when triggered (e.g., "Touch your ear when someone says Christmas")
- Be subtle! Others will try to guess what your tell is

### Secret Mission
- Each player gets 3 AI-generated secret missions to choose from
- A "mission" involves getting another family member to do something without them realizing
- Record each time you complete your mission with a different person

### Guessing
- Try to guess what each player's secret tell is
- You can change your guess anytime before the game ends
- You get points for correct guesses (and bonus points for early guesses!)

### Scoring
- **Correct tell guess**: 1 point
- **Early guess bonus**: +1 point per hour before game ends
- **Stealth bonus**: 1 point per 2 people who guessed your tell wrong
- **Mission completions**: 1 point each (different person each time)
- **Best team name**: 1 point (AI judges!)

## Admin Controls (Adam only)

Access the Admin panel from the navigation bar to:
- See who has logged in
- See who has chosen their tells and missions
- Start the game
- End the game (triggers scoring and reveals)
- Restart the game (clears all data)

## Teams

- **Team 1**: David, Neal, Emily, Lizzy
- **Team 2**: Rosanne, Adam, Katherine, Ben
- **Team 3**: Elaine, Alex, Vicky, Jemima, Olivia

## Development

Run in development mode with hot reloading:
```bash
npm run dev
```

Reset the database:
```bash
npm run db:reset
```

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Express.js, SQLite, TypeScript
- **AI**: OpenAI GPT-4o (text) + DALL-E 3 (images)
