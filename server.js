const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Serve static files from the "public" folder
app.use(express.static('public'));

// Connect to SQLite database
const db = new Database('./results.db', { verbose: console.log });

// Create the 'results' table if it doesn't exist
db.prepare(`
    CREATE TABLE IF NOT EXISTS results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        time TEXT,
        coupon_name TEXT,
        number TEXT
    )
`).run();

// Route for user (index.html)
app.get('/user', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route for admin (upload.html)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

// Fetch results (optional: filter by date)
app.get('/getResults', (req, res) => {
    const { date } = req.query;

    try {
        const query = date
            ? `SELECT id, date, time, coupon_name, number FROM results WHERE date = ? ORDER BY time ASC`
            : `SELECT id, date, time, coupon_name, number FROM results ORDER BY date DESC, time ASC`;

        const stmt = db.prepare(query);
        const rows = date ? stmt.all(date) : stmt.all();
        res.json(rows);
    } catch (err) {
        console.error('Error fetching results:', err);
        res.status(500).send('Error fetching results');
    }
});

// Upload a result
app.post('/uploadResult', (req, res) => {
    const { date, time, coupon_name, number } = req.body;

    if (!date || !time || !coupon_name || !number) {
        return res.status(400).send('All fields are required!');
    }

    try {
        const query = `INSERT INTO results (date, time, coupon_name, number) VALUES (?, ?, ?, ?)`;
        const stmt = db.prepare(query);
        stmt.run(date, time, coupon_name, number);
        res.send('Result uploaded successfully!');
    } catch (err) {
        console.error('Error uploading result:', err);
        res.status(500).send('Error uploading result');
    }
});

// Delete a result by ID
app.delete('/deleteResult/:id', (req, res) => {
    const { id } = req.params;

    try {
        const query = `DELETE FROM results WHERE id = ?`;
        const stmt = db.prepare(query);
        const changes = stmt.run(id).changes;

        if (changes > 0) {
            res.send('Result deleted successfully!');
        } else {
            res.status(404).send('Result not found');
        }
    } catch (err) {
        console.error('Error deleting result:', err);
        res.status(500).send('Error deleting result');
    }
});

// Handle 404 for unknown routes
app.use((req, res) => {
    res.status(404).send('Page not found');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
