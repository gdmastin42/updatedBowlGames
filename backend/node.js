const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const sqlite3 = require('sqlite3').verbose()
const {v4:uuidv4} = require('uuid')
require('dotenv').config()

const app = express()
const PORT = 8000

// Middleware
const corsOptions = {
    origin: 'http://127.0.0.1:5500', // Allow requests from your frontend
    methods: ['GET', 'POST'],       // Specify allowed HTTP methods
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
                score TEXT
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

        // Example of inserting a new game
        db.run(
            'INSERT INTO tblBowlGames (gameID, gameName, team1, team2, type, score) VALUES (?, ?, ?, ?, ?, ?)',
            [uuidv4(), 'Example Bowl Game', 'Team A', 'Team B', 'traditional', null],
            (err) => {
                if (err) {
                    console.error('Error inserting game:', err.message)
                }
            }
        )

        db.all('SELECT * FROM tblBowlGames', (err, rows) => {
            if (err) {
                console.error('Error fetching games:', err.message)
                return
            }

            rows.forEach((row) => {
                const newGameID = uuidv4()
                db.run(
                    'UPDATE tblBowlGames SET gameID = ? WHERE gameID = ?',
                    [newGameID, row.gameID],
                    (err) => {
                        if (err) {
                            console.error('Error updating gameID:', err.message)
                        }
                    }
                )
            })
        })
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
    const { userID, predictions } = req.body

    if (!userID || !predictions) {
        return res.status(400).json({ error: 'User ID and predictions are required.' })
    }

    const insertPrediction = db.prepare(`
        INSERT INTO tblPredictions (prediction_id, userID, gameID, predictedWinner)
        VALUES (?, ?, ?, ?)
    `)

    db.serialize(() => {
        predictions.forEach(({ gameID, predictedWinner }) => {
            const predictionID = uuidv4() // Generate a UUID for prediction_id
            insertPrediction.run(predictionID, userID, gameID, predictedWinner, (err) => {
                if (err) {
                    console.error('Error inserting prediction:', err.message)
                }
            })
        })
        insertPrediction.finalize((err) => {
            if (err) {
                return res.status(500).json({ error: 'Database error.' })
            }
            res.json({ message: 'Predictions saved successfully.' })
        })
    })
})

// Route to fetch leaderboard data
app.get('/api/leaderboard', (req, res) => {
    db.all(`
        SELECT u.username, COUNT(p.predictionID) AS score
        FROM tblUsers u
        LEFT JOIN tblPredictions p ON u.userID = p.userID
        GROUP BY u.userID, u.username
        ORDER BY score DESC
    `, (err, rows) => {
        if (err) {
            console.error('Database error:', err.message)
            return res.status(500).json({ error: 'Database error.' })
        }
        res.json(rows)
    })    
})

// Route to fetch game results
app.get('/api/gameResults', (req, res) => {
    db.all(`
        SELECT b.team1, b.team2, p.predictedWinner AS winner, b.score
        FROM tblBowlGames b
        LEFT JOIN tblPredictions p ON b.gameID = p.gameID
    `, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error.' })
        }
        res.json(rows)
    })
})

// Route to fetch API key
app.get('/api/key', (req, res) => {
    const apiKey = process.env.API_KEY // Ensure API_KEY is set in your .env file
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not found.' })
    }
    res.json({ apiKey })
})

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})