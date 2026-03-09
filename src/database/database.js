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
            `);

            // Check for migration
            const tableInfo = await db.getAllAsync("PRAGMA table_info(matches)");
            const hasStateJson = tableInfo.some(column => column.name === 'state_json');

            if (!hasStateJson) {
                await db.execAsync("ALTER TABLE matches ADD COLUMN state_json TEXT;");
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

export const getDb = async () => {
    if (!db) {
        return await initDatabase();
    }
    return db;
};
