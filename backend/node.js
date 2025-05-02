const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const sqlite3 = require('sqlite3').verbose()
require('dotenv').config();

const app = express()
const PORT = 8000

// Middleware
const corsOptions = {
    origin: 'http://127.0.0.1:5500', // Allow requests from your frontend
    methods: ['GET', 'POST'],       // Specify allowed HTTP methods
    allowedHeaders: ['Content-Type'] // Specify allowed headers
};

app.use(cors(corsOptions));
app.use(bodyParser.json())
;

// Serve API key to frontend (optional: add auth here)
app.get('/api/key', (req, res) => {
    res.json({ apiKey: process.env.API_KEY });
});

// Initialize SQLite database
const db = new sqlite3.Database('./database/bowlGames.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message)
    } else {
        console.log('Connected to SQLite database.')
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                username TEXT PRIMARY KEY,
                firstName TEXT NOT NULL,
                lastName TEXT NOT NULL
            )
        `)
        db.run(`
            CREATE TABLE IF NOT EXISTS predictions (
                username TEXT NOT NULL,
                predictionData TEXT NOT NULL,
                PRIMARY KEY (username),
                FOREIGN KEY (username) REFERENCES users(username)
            )
        `)
    }
})

// Route to handle user login/registration
app.post('/api/login', (req, res) => {
    const { firstName, lastName } = req.body

    if (!firstName || !lastName) {
        return res.status(400).json({ error: 'First name and last name are required.' })
    }

    const username = `${firstName.toLowerCase()}_${lastName.toLowerCase()}`

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error.' })
        }

        if (!row) {
            // Register the user if they don't exist
            db.run(
                'INSERT INTO users (username, firstName, lastName) VALUES (?, ?, ?)',
                [username, firstName, lastName],
                (err) => {
                    if (err) {
                        return res.status(500).json({ error: 'Database error.' })
                    }
                    res.json({ message: 'Login successful', username })
                }
            )
        } else {
            res.json({ message: 'Login successful', username })
        }
    })
})

// Route to handle predictions submission
app.post('/api/predictions', (req, res) => {
    const { username, predictions } = req.body

    if (!username || !predictions) {
        return res.status(400).json({ error: 'Username and predictions are required.' })
    }

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error.' })
        }

        if (!row) {
            return res.status(404).json({ error: 'User not found.' })
        }

        const predictionData = JSON.stringify(predictions)
        db.run(
            'INSERT OR REPLACE INTO predictions (username, predictionData) VALUES (?, ?)',
            [username, predictionData],
            (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error.' })
                }
                res.json({ message: 'Predictions saved successfully.' })
            }
        )
    })
})

// Route to fetch user data (optional)
app.get('/api/user/:username', (req, res) => {
    const { username } = req.params

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, userRow) => {
        if (err) {
            return res.status(500).json({ error: 'Database error.' })
        }

        if (!userRow) {
            return res.status(404).json({ error: 'User not found.' })
        }

        db.get('SELECT predictionData FROM predictions WHERE username = ?', [username], (err, predictionRow) => {
            if (err) {
                return res.status(500).json({ error: 'Database error.' })
            }

            res.json({
                ...userRow,
                predictions: predictionRow ? JSON.parse(predictionRow.predictionData) : {}
            })
        })
    })
})

// Route to fetch leaderboard data
app.get('/api/leaderboard', (req, res) => {
    db.all(`
        SELECT u.firstName, u.lastName, COUNT(p.username) AS score
        FROM users u
        LEFT JOIN predictions p ON u.username = p.username
        GROUP BY u.username
        ORDER BY score DESC
    `, (err, rows) => {
        if (err) {
        return res.status(500).json({ error: 'Database error.' })
        }
        res.json(rows)
    })
})

// Route to fetch game results
app.get('/api/game-results', (req, res) => {
  // Example game results data
    const gameResults = [
        { game: 'Game 1', winner: 'Team A', loser: 'Team B' },
        { game: 'Game 2', winner: 'Team C', loser: 'Team D' },
        // Add more games here
    ]
    res.json(gameResults)
})

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})