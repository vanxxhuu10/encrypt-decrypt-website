const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Define the absolute path for the database
const dbPath = path.join(__dirname, "../database/messages.db");

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error("❌ Error connecting to database:", err.message);
        process.exit(1);
    }
    console.log("✅ Connected to the SQLite database at:", dbPath);
});

// Create the table if it doesn’t exist
db.run(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original_message TEXT NOT NULL,
        encrypted_message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {
    if (err) {
        console.error("❌ Error creating table:", err.message);
    } else {
        console.log("✅ Table 'messages' ensured in database");
    }
});

module.exports = db;
