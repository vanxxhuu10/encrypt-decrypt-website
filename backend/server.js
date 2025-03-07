require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const crypto = require("crypto");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Load SECRET_KEY from .env
const SECRET_KEY = process.env.SECRET_KEY || "d9fab44e53f9f7028df27035582a626e74b404a746101deb645a1c4753ce9add";
if (!SECRET_KEY || SECRET_KEY.length !== 64) {
    console.error("❌ SECRET_KEY is missing or invalid!");
    process.exit(1);
}

// Database setup
const dbFolder = path.join(__dirname, "database");
const dbPath = path.join(dbFolder, "messages.db");

// Ensure database folder exists
if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
}

// Connect to SQLite
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error("❌ Database Connection Error:", err.message);
        process.exit(1);
    }
    console.log(`✅ Connected to SQLite database at: ${dbPath}`);
});

// Ensure messages table exists
db.run(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original_message TEXT NOT NULL,
        encrypted_message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`);

// Test route
app.get("/", (req, res) => {
    res.send("Encryption/Decryption API is running!");
});

// Encryption function
function encryptMessage(message) {
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(SECRET_KEY, "hex"), iv);
        let encrypted = cipher.update(message, "utf-8", "hex");
        encrypted += cipher.final("hex");
        return iv.toString("hex") + ":" + encrypted;
    } catch (error) {
        console.error("❌ Encryption Error:", error.message);
        return null;
    }
}

// Decryption function
function decryptMessage(encryptedMessage) {
    try {
        const parts = encryptedMessage.split(":");
        if (parts.length !== 2) throw new Error("Invalid format");

        const iv = Buffer.from(parts[0], "hex");
        const encryptedText = parts[1];

        const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(SECRET_KEY, "hex"), iv);
        let decrypted = decipher.update(encryptedText, "hex", "utf-8");
        decrypted += decipher.final("utf-8");
        return decrypted;
    } catch (error) {
        console.error("❌ Decryption Error:", error.message);
        return null;
    }
}

// Encrypt and store message
app.post("/api/encrypt", (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const encryptedMessage = encryptMessage(message);
    if (!encryptedMessage) return res.status(500).json({ error: "Encryption failed" });

    db.run(
        "INSERT INTO messages (original_message, encrypted_message) VALUES (?, ?)",
        [message, encryptedMessage],
        function (err) {
            if (err) {
                return res.status(500).json({ error: "Failed to store message", details: err.message });
            }
            res.json({ id: this.lastID, encryptedMessage });
        }
    );
});

// Decrypt message from database
app.post("/api/decrypt", (req, res) => {
    const { encryptedMessage } = req.body;
    if (!encryptedMessage) return res.status(400).json({ error: "Encrypted message is required" });

    db.get("SELECT original_message FROM messages WHERE encrypted_message = ?", [encryptedMessage], (err, row) => {
        if (err) return res.status(500).json({ error: "Failed to retrieve message" });
        if (!row) return res.status(404).json({ error: "No matching record found" });

        res.json({ decryptedMessage: row.original_message });
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// Export for Vercel
module.exports = app;
