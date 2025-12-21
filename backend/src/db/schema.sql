-- Players table: stores all 12 family members
CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    team_number INTEGER NOT NULL CHECK (team_number IN (1, 2, 3)),
    is_admin BOOLEAN DEFAULT FALSE,
    is_logged_in BOOLEAN DEFAULT FALSE,
    logged_in_at DATETIME,
    team_name_suggestion TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Game state table: single row for global game state
CREATE TABLE IF NOT EXISTS game_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    status TEXT NOT NULL DEFAULT 'setup' CHECK (status IN ('setup', 'active', 'finished')),
    started_at DATETIME,
    ended_at DATETIME,
    winning_team_name_player_id INTEGER REFERENCES players(id)
);

-- Tell options: AI-generated options for each player
CREATE TABLE IF NOT EXISTS tell_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL REFERENCES players(id),
    option_text TEXT NOT NULL,
    option_number INTEGER NOT NULL CHECK (option_number IN (1, 2, 3)),
    is_selected BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(player_id, option_number)
);

-- Selected tells: the tell each player has chosen
CREATE TABLE IF NOT EXISTS selected_tells (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL UNIQUE REFERENCES players(id),
    tell_option_id INTEGER NOT NULL REFERENCES tell_options(id),
    image_url TEXT,
    selected_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Mission options: AI-generated mission options for each player
CREATE TABLE IF NOT EXISTS mission_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL REFERENCES players(id),
    option_text TEXT NOT NULL,
    option_number INTEGER NOT NULL CHECK (option_number IN (1, 2, 3)),
    is_selected BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(player_id, option_number)
);

-- Selected missions: the mission each player has chosen
CREATE TABLE IF NOT EXISTS selected_missions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL UNIQUE REFERENCES players(id),
    mission_option_id INTEGER NOT NULL REFERENCES mission_options(id),
    image_url TEXT,
    selected_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Mission completions: record of each mission completion
CREATE TABLE IF NOT EXISTS mission_completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL REFERENCES players(id),
    involved_player_id INTEGER NOT NULL REFERENCES players(id),
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(player_id, involved_player_id)
);

-- Tell guesses: players' guesses about others' tells
CREATE TABLE IF NOT EXISTS tell_guesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guesser_id INTEGER NOT NULL REFERENCES players(id),
    target_player_id INTEGER NOT NULL REFERENCES players(id),
    guessed_tell_option_id INTEGER NOT NULL REFERENCES tell_options(id),
    guessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(guesser_id, target_player_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tell_options_player ON tell_options(player_id);
CREATE INDEX IF NOT EXISTS idx_mission_options_player ON mission_options(player_id);
CREATE INDEX IF NOT EXISTS idx_tell_guesses_guesser ON tell_guesses(guesser_id);
CREATE INDEX IF NOT EXISTS idx_tell_guesses_target ON tell_guesses(target_player_id);
CREATE INDEX IF NOT EXISTS idx_mission_completions_player ON mission_completions(player_id);
