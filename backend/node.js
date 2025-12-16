const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const sqlite3 = require('sqlite3').verbose()
const {v4:uuidv4} = require('uuid')
require('dotenv').config()
const axios = require('axios')

const app = express()
const PORT = 8000

// Middleware
const corsOptions = {
origin: [
        'http://127.0.0.1:5500',
        'https://localhost:5500',
        'https://college-football-hq.com',
        'https://www.college-football-hq.com'
    ],
    methods: ['GET','POST'],
    allowedHeaders: ['Content-Type'] // Specify allowed headers
}

app.use(cors(corsOptions))
app.use(bodyParser.json())

// Initialize SQLite database
const db = new sqlite3.Database('./database/bowlGames.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message)
    } else {
        console.log('Connected to SQLite database.')
        db.run(`
            CREATE TABLE IF NOT EXISTS tblUsers (
                userID TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL
            )
        `)
        db.run(`
            CREATE TABLE IF NOT EXISTS tblBowlGames (
                gameID TEXT PRIMARY KEY,
                gameName TEXT NOT NULL,
                team1 TEXT NOT NULL,
                team2 TEXT NOT NULL,
                type TEXT NOT NULL,
                score TEXT,
                UNIQUE(gameName, team1, team2)
            )
        `)
        db.run(`
            CREATE TABLE IF NOT EXISTS tblPredictions (
                prediction_id INTEGER PRIMARY KEY AUTOINCREMENT,
                userID TEXT NOT NULL,
                gameID TEXT NOT NULL,
                predictedWinner TEXT NOT NULL,
                FOREIGN KEY (userID) REFERENCES tblUsers(userID),
                FOREIGN KEY (gameID) REFERENCES tblBowlGames(gameID)
            )
        `)
        db.run(`
            CREATE TABLE IF NOT EXISTS tblPlayoffs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userID TEXT NOT NULL,
                gameName TEXT NOT NULL,
                winner TEXT NOT NULL,
                FOREIGN KEY (userID) REFERENCES tblUsers(userID)
            )
        `);


        // Auto-load bowl games on server start (optional)
        axios.get('http://localhost:8000/api/fetch-bowl-games')
            .then(() => console.log('Bowl games loaded on startup.'))
            .catch(err => console.error('Failed to auto-load bowl games:', err.message))
    }
})

// Route to handle user login/registration
app.post('/api/login', (req, res) => {
    const { firstName, lastName } = req.body

    if (!firstName || !lastName) {
        return res.status(400).json({ error: 'First name and last name are required.' })
    }

    const username = `${firstName.toLowerCase()}_${lastName.toLowerCase()}`
    const userID = uuidv4() // Generate UUID using uuidv4 library

    db.get('SELECT * FROM tblUsers WHERE username = ?', [username], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error.' })
        }

        if (!row) {
            // Register the user if they don't exist
            db.run(
                'INSERT INTO tblUsers (userID, username) VALUES (?, ?)',
                [userID, username],
                (err) => {
                    if (err) {
                        return res.status(500).json({ error: 'Database error.' })
                    }
                    res.json({ message: 'Login successful', username, userID })
                }
            )
        } else {
            res.json({ message: 'Login successful', username, userID: row.userID })
        }
    })
})

// Route to handle predictions submission
app.post('/api/predictions', (req, res) => {
    const { userID, predictions } = req.body;

    if (!userID || !predictions) {
        return res.status(400).json({ error: 'User ID and predictions are required.' });
    }

    // Check if the user already submitted predictions
    db.get('SELECT 1 FROM tblPredictions WHERE userID = ? LIMIT 1', [userID], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error.' });
        }

        if (row) {
            // User already submitted
            return res.status(409).json({ error: 'You already submitted your predictions.' });
        }

        // Continue with saving predictions
        const insert = db.prepare(`
            INSERT INTO tblPredictions (userID, gameID, predictedWinner)
            VALUES (?, ?, ?)
        `);

        db.serialize(() => {
            predictions.forEach(({ gameID, predictedWinner }) => {
                insert.run(userID, gameID, predictedWinner, (err) => {
                    if (err) console.error('Insert error:', err.message);
                });
            });

            insert.finalize((err) => {
                if (err) return res.status(500).json({ error: 'Database error during finalizing.' });
                res.json({ message: 'Predictions submitted successfully.' });
            });
        });
    });
});

// Route to fetch leaderboard data

// === Replace your current leaderboardQuery with the following ===
const leaderboardQuery = `
    SELECT
        u.username,
        COUNT(*) AS score
    FROM tblUsers u
    LEFT JOIN tblPredictions p
        ON p.userID = u.userID
    LEFT JOIN tblBowlGames b
        ON p.gameID = b.gameID
    WHERE b.score IS NOT NULL
        AND (
            (
                CAST(SUBSTR(b.score, 1, INSTR(b.score, '-') - 1) AS INTEGER) >
                CAST(SUBSTR(b.score, INSTR(b.score, '-') + 1) AS INTEGER)
                AND p.predictedWinner = b.team1
            )
            OR
            (
                CAST(SUBSTR(b.score, 1, INSTR(b.score, '-') - 1) AS INTEGER) <
                CAST(SUBSTR(b.score, INSTR(b.score, '-') + 1) AS INTEGER)
                AND p.predictedWinner = b.team2
            )
        )
    GROUP BY u.userID, u.username
    ORDER BY score DESC, u.username ASC
    LIMIT 100;
`

app.get('/api/leaderboard', (req, res) => {
    db.all(leaderboardQuery, [], (err, rows) => {
        if (err) {
            console.error('Leaderboard error:', err);
            return res.status(500).json({ error: 'Failed to load leaderboard' });
        }
        res.json(rows || []);
    });
});
// get team logos
app.get('/api/teamLogos', async (req, res) => {
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "API key not set." });
    }

    try {
        const response = await axios.get(
            "https://apinext.collegefootballdata.com/teams/fbs",
            { headers: { Authorization: `Bearer ${apiKey}` } }
        );

        const teams = response.data;
        const logos = {};

        teams.forEach(team => {
            logos[team.school] = team.logos?.[0] || "";
        });

        res.json(logos);

    } catch (err) {
        console.error("Failed to fetch team logos:", err.message);
        res.status(500).json({ error: "Failed to fetch team logos." });
    }
});

// Helper to sync scores from CollegeFootballData API
async function syncScoresFromAPI(db) {
    const apiKey = process.env.API_KEY
    if (!apiKey) {
        console.error('API key not set; cannot sync scores.')
        return
    }

    try {
        const { data } = await axios.get('https://api.collegefootballdata.com/games', {
            params: {
                year: 2025,
                seasonType: 'postseason',
                classification: 'fbs'
                // week: '13'
            },
            headers: { Authorization: `Bearer ${apiKey}` }
        })

        // Build a quick lookup: key = `${homeTeam}__${awayTeam}`, value = "home-away" score or null
        const latest = new Map()
        for (const g of data) {
            if (!g.homeTeam || !g.awayTeam) continue
            const score = (g.homePoints != null && g.awayPoints != null) ? `${g.homePoints}-${g.awayPoints}` : null
            latest.set(`${g.homeTeam}__${g.awayTeam}`, score)
        }

        // Pull db games and update any scores we have
        db.all('SELECT gameID, team1, team2 FROM tblBowlGames', (err, rows) => {
            if (err) {
                console.error('DB read for sync failed:', err.message)
                return
            }
            const updateStmt = db.prepare('UPDATE tblBowlGames SET score = ? WHERE gameID = ?')

            for (const row of rows) {
                const key = `${row.team1}__${row.team2}`
                if (latest.has(key)) {
                    const newScore = latest.get(key) // may be null if game not finished yet
                    updateStmt.run(newScore, row.gameID)
                } else {
                    // Try reversed key in case home/away flipped when you inserted locally
                    const rkey = `${row.team2}__${row.team1}`
                    if (latest.has(rkey)) {
                        const revScore = latest.get(rkey)
                        // If reversed, winner should still compute correctly since we compare by team names below.
                        updateStmt.run(revScore, row.gameID)
                    }
                }
            }

            updateStmt.finalize((e) => {
                if (e) console.error('Finalize updateStmt error:', e.message)
                else console.log('Scores sync complete.')
            })
        })
    } catch (e) {
        console.error('Sync from API failed:', e.message)
    }
}

// Manual trigger (you can hit this after deploying)
app.post('/api/sync-scores', async (req, res) => {
    await syncScoresFromAPI(db)
    res.json({ message: 'Score sync triggered.' })
})

// Auto-sync every 15 minutes (adjust as you like)
// Schedule syncScoresFromAPI to run once per day at midnight
function scheduleDailyMidnightSync() {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0); // set to next midnight
    const msUntilMidnight = nextMidnight - now;
    setTimeout(() => {
        syncScoresFromAPI(db);
        setInterval(() => syncScoresFromAPI(db), 24 * 60 * 60 * 1000); // every 24 hours
    }, msUntilMidnight);
}
scheduleDailyMidnightSync();

// Route to fetch game results
app.get('/api/gameResults', (req, res) => {
    db.all(`
        SELECT 
            b.gameName, 
            b.team1, 
            b.team2, 
            b.score
        FROM tblBowlGames b
    `, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error.' })
        }
        // Compute winner based on score
        const results = rows.map(game => {
            let winner = null
            if (game.score && game.score.includes('-')) {
                const [home, away] = game.score.split('-').map(Number)
                if (!isNaN(home) && !isNaN(away)) {
                    winner = home > away ? game.team1 : (away > home ? game.team2 : 'Tie')
                }
            }
            return {
                game: game.gameName,
                team1: game.team1,
                team2: game.team2,
                winner,
                score: game.score
            }
        })
        res.json(results)
    })
})
app.post('/api/playoffs', (req, res) => {
    const { userID, predictions } = req.body;

    if (!userID || !predictions || !Array.isArray(predictions)) {
        return res.status(400).json({ error: 'Invalid request format.' });
    }

    // Check if user already submitted playoff predictions
    db.get(
        'SELECT 1 FROM tblPlayoffs WHERE userID = ? LIMIT 1',
        [userID],
        (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Database error.' });
            }

            if (row) {
                return res
                    .status(409)
                    .json({ error: 'You already submitted playoff predictions.' });
            }

            const insert = db.prepare(`
                INSERT INTO tblPlayoffs (userID, gameName, winner)
                VALUES (?, ?, ?)
            `);

            db.serialize(() => {
                predictions.forEach(({ gameName, winner }) => {
                    insert.run(
                        userID,
                        gameName,
                        winner,
                        (err) => {
                            if (err) {
                                console.error('Insert error:', err.message);
                            }
                        }
                    );
                });

                insert.finalize((err) => {
                    if (err) {
                        return res.status(500).json({ error: 'Error finalizing inserts.' });
                    }

                    res.json({
                        message: 'Playoff predictions submitted successfully.'
                    });
                });
            });
        }
    );
});

// Route to fetch and store last year's bowl games from CFBD
app.get('/api/fetch-bowl-games', async (req, res) => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API key not set' });

    try {
        const response = await axios.get('https://api.collegefootballdata.com/games', {
            params: {
                year: 2025,
                seasonType: 'postseason',
                classification: 'fbs'
            },
            headers: {
                Authorization: `Bearer ${apiKey}`
            }
        });

        const games = response.data.filter(game => game.homeTeam && game.awayTeam);
        if (games.length === 0) {
            return res.status(404).json({ message: 'No games found.' });
        }

        const stmt = db.prepare(`
            INSERT OR IGNORE INTO tblBowlGames
            (gameID, gameName, team1, team2, type, score)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        games.forEach(game => {
            const score = (game.homePoints !== null && game.awayPoints !== null)
                ? `${game.homePoints}-${game.awayPoints}`
                : null;

            let gameName = null;
            if (game.notes && game.notes.trim() !== "") {
                gameName = game.notes.trim();
            } else {
                gameName = `${game.awayTeam} at ${game.homeTeam}`;
            }

            // Detect playoff games
            let type = 'regular';
            if (game.notes && game.notes.includes('College Football Playoff')) {
                type = 'playoff';
            }

            stmt.run(
                uuidv4(),
                gameName,
                game.homeTeam,
                game.awayTeam,
                type,
                score
            );
        });

        stmt.finalize();
        res.json({ message: 'Postseason games loaded successfully.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch games from API.' });
    }
});

// Route to fetch all bowl games
app.get('/api/bowlGames', (req, res) => {
    db.all(`SELECT * FROM tblBowlGames WHERE type != 'playoff'`, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error.' })
        }
        res.json(rows)
    })
})

// Route to delete all bowl games (for testing/resetting purposes)
app.delete('/api/bowlGames', (req, res) => {
    db.run('DELETE FROM tblBowlGames', (err) => {
        if (err) {
            return res.status(500).json({ error: 'Database error.' })
        }
        res.json({ message: 'All bowl games deleted successfully.' })
    })
})

// Route to fetch all predictions with user and game info (for DataTable)
app.get('/api/predictions/full', (req, res) => {
    const sql = `
        SELECT 
            u.username,
            b.gameName,
            p.predictedWinner
        FROM tblPredictions p
        INNER JOIN tblUsers u ON u.userID = p.userID
        INNER JOIN tblBowlGames b ON b.gameID = p.gameID
        ORDER BY u.username ASC, b.gameName ASC;
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error fetching predictions:', err);
            return res.status(500).json({ error: 'Failed to fetch predictions' });
        }
        res.json(rows || []);
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})