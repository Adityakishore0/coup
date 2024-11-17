const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Serve static files from the "public" folder
app.use(express.static('public'));

// Connect to SQLite database
const db = new sqlite3.Database('./results.db', (err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// Create the 'results' table if it doesn't exist
db.run(`
    CREATE TABLE IF NOT EXISTS results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        time TEXT,
        coupon_name TEXT,
        number TEXT
    )
`);

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
    const query = date
        ? `SELECT id, date, time, coupon_name, number FROM results WHERE date = ? ORDER BY time ASC`
        : `SELECT id, date, time, coupon_name, number FROM results ORDER BY date DESC, time ASC`;

    db.all(query, date ? [date] : [], (err, rows) => {
        if (err) {
            console.error('Error fetching results:', err);
            res.status(500).send('Error fetching results');
        } else {
            res.json(rows);
        }
    });
});

// Upload a result
app.post('/uploadResult', (req, res) => {
    const { date, time, coupon_name, number } = req.body;

    if (!date || !time || !coupon_name || !number) {
        return res.status(400).send('All fields are required!');
    }

    const query = `INSERT INTO results (date, time, coupon_name, number) VALUES (?, ?, ?, ?)`;
    db.run(query, [date, time, coupon_name, number], function (err) {
        if (err) {
            console.error('Error uploading result:', err);
            res.status(500).send('Error uploading result');
        } else {
            res.send('Result uploaded successfully!');
        }
    });
});

// Delete a result by ID
app.delete('/deleteResult/:id', (req, res) => {
    const { id } = req.params;
    const query = `DELETE FROM results WHERE id = ?`;

    db.run(query, [id], function (err) {
        if (err) {
            console.error('Error deleting result:', err);
            res.status(500).send('Error deleting result');
        } else {
            res.send('Result deleted successfully!');
        }
    });
});

// Handle 404 for unknown routes
app.use((req, res) => {
    res.status(404).send('Page not found');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
