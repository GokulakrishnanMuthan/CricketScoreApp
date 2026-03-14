import * as SQLite from 'expo-sqlite';

let db = null;
let dbPromise = null;

export const initDatabase = async () => {
    if (dbPromise) return dbPromise;

    dbPromise = (async () => {
        try {
            db = await SQLite.openDatabaseAsync('cricket_scorer.db');

            await db.execAsync(`
                PRAGMA foreign_keys = ON;

                CREATE TABLE IF NOT EXISTS matches (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    teamA TEXT NOT NULL,
                    teamB TEXT NOT NULL,
                    overs INTEGER NOT NULL,
                    tossWinner TEXT,
                    tossDecision TEXT,
                    state_json TEXT,
                    date TEXT DEFAULT (datetime('now', 'localtime')),
                    status TEXT DEFAULT 'LIVE'
                );

                CREATE TABLE IF NOT EXISTS players (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    matchId INTEGER,
                    name TEXT NOT NULL,
                    team TEXT NOT NULL,
                    FOREIGN KEY (matchId) REFERENCES matches (id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS balls (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    matchId INTEGER,
                    overNum INTEGER,
                    ballNum INTEGER,
                    batsmanId INTEGER,
                    bowlerId INTEGER,
                    runs INTEGER,
                    extraType TEXT,
                    extraRuns INTEGER DEFAULT 0,
                    isWicket INTEGER DEFAULT 0,
                    wicketType TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (matchId) REFERENCES matches (id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS app_players (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    jersey_number TEXT,
                    role TEXT,
                    phone TEXT,
                    image_uri TEXT,
                    insta_id TEXT,
                    batting_style TEXT,
                    bowling_style TEXT,
                    is_wicket_keeper INTEGER DEFAULT 0,
                    fb_id TEXT
                );
            `);

            // Check for migration
            const tableInfo = await db.getAllAsync("PRAGMA table_info(matches)");
            const hasStateJson = tableInfo.some(column => column.name === 'state_json');

            if (!hasStateJson) {
                await db.execAsync("ALTER TABLE matches ADD COLUMN state_json TEXT;");
            }

            // Migration for app_players new columns
            const playerTableInfo = await db.getAllAsync("PRAGMA table_info(app_players)");
            const hasRole = playerTableInfo.some(column => column.name === 'role');
            if (!hasRole) {
                await db.execAsync("ALTER TABLE app_players ADD COLUMN role TEXT;");
                await db.execAsync("ALTER TABLE app_players ADD COLUMN phone TEXT;");
            }

            const playerTableInfoExtended = await db.getAllAsync("PRAGMA table_info(app_players)");
            const hasImage = playerTableInfoExtended.some(column => column.name === 'image_uri');
            if (!hasImage) {
                await db.execAsync("ALTER TABLE app_players ADD COLUMN image_uri TEXT;");
                await db.execAsync("ALTER TABLE app_players ADD COLUMN insta_id TEXT;");
            }

            const playerTableInfoFinal = await db.getAllAsync("PRAGMA table_info(app_players)");
            const hasBatting = playerTableInfoFinal.some(column => column.name === 'batting_style');
            if (!hasBatting) {
                await db.execAsync("ALTER TABLE app_players ADD COLUMN batting_style TEXT;");
                await db.execAsync("ALTER TABLE app_players ADD COLUMN bowling_style TEXT;");
                await db.execAsync("ALTER TABLE app_players ADD COLUMN is_wicket_keeper INTEGER DEFAULT 0;");
                await db.execAsync("ALTER TABLE app_players ADD COLUMN fb_id TEXT;");
            }

            console.log('Database initialized successfully');
            return db;
        } catch (error) {
            console.error('Database initialization error:', error);
            dbPromise = null; // Reset to allow retry
            throw error;
        }
    })();

    return dbPromise;
};

export const createMatch = async (matchData) => {
    const database = await getDb();
    const result = await database.runAsync(
        'INSERT INTO matches (teamA, teamB, overs, tossWinner, tossDecision) VALUES (?, ?, ?, ?, ?)',
        [matchData.teamA, matchData.teamB, matchData.overs, matchData.tossWinner, matchData.tossDecision]
    );
    return result.lastInsertRowId;
};

export const updateMatchState = async (matchId, state) => {
    const database = await getDb();
    const stateJson = JSON.stringify(state);
    await database.runAsync(
        'UPDATE matches SET state_json = ? WHERE id = ?',
        [stateJson, matchId]
    );
};

export const getRecentMatches = async () => {
    const database = await getDb();
    return database.getAllAsync('SELECT * FROM matches ORDER BY date DESC LIMIT 10');
};

export const clearAllData = async () => {
    const database = await getDb();
    await database.execAsync('DELETE FROM matches');
    await database.execAsync('DELETE FROM players');
    await database.execAsync('DELETE FROM balls');
};

export const deleteMatch = async (matchId) => {
    const database = await getDb();
    await database.runAsync('DELETE FROM matches WHERE id = ?', [matchId]);
    // Cascade delete on players and balls should automatically trigger due to PRAGMA foreign_keys = ON
};

// Player Management
export const addAppPlayer = async (name, jersey, role, phone, image, insta, batting, bowling, isWK, fb) => {
    const database = await getDb();
    const result = await database.runAsync(
        'INSERT INTO app_players (name, jersey_number, role, phone, image_uri, insta_id, batting_style, bowling_style, is_wicket_keeper, fb_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, jersey, role, phone, image, insta, batting, bowling, isWK ? 1 : 0, fb]
    );
    return result.lastInsertRowId;
};

export const getAppPlayers = async () => {
    const database = await getDb();
    return database.getAllAsync('SELECT * FROM app_players ORDER BY name ASC');
};

export const deleteAppPlayer = async (id) => {
    const database = await getDb();
    await database.runAsync('DELETE FROM app_players WHERE id = ?', [id]);
};

export const updateAppPlayer = async (id, name, jersey, role, phone, image, insta, batting, bowling, isWK, fb) => {
    const database = await getDb();
    await database.runAsync(
        'UPDATE app_players SET name = ?, jersey_number = ?, role = ?, phone = ?, image_uri = ?, insta_id = ?, batting_style = ?, bowling_style = ?, is_wicket_keeper = ?, fb_id = ? WHERE id = ?',
        [name, jersey, role, phone, image, insta, batting, bowling, isWK ? 1 : 0, fb, id]
    );
};

export const getDb = async () => {
    if (!db) {
        return await initDatabase();
    }
    return db;
};
