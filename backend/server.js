require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const crypto = require("crypto");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Load SECRET_KEY from .env file
const SECRET_KEY ="d9fab44e53f9f7028df27035582a626e74b404a746101deb645a1c4753ce9add";
if (!SECRET_KEY || SECRET_KEY.length !== 64) {
    console.error("❌ SECRET_KEY is missing or invalid! Please check your .env file.");
    process.exit(1);
}

// Define absolute database path
const dbFolder = path.join(__dirname, "database");
const dbPath = path.join(dbFolder, "messages.db");

// Ensure database folder exists
if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
    console.log("📁 Created 'database' directory.");
}

// Connect to SQLite Database
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error("❌ Error connecting to database:", err.message);
        process.exit(1);
    }
    console.log(`✅ Connected to SQLite database at: ${dbPath}`);
});

// Ensure the 'messages' table exists
db.run(
    `CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original_message TEXT NOT NULL,
        encrypted_message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => {
        if (err) {
            console.error("❌ Error creating table:", err.message);
        } else {
            console.log("✅ Table 'messages' ensured in database");
        }
    }
);

// Test route
app.get("/", (req, res) => {
    res.send("Encryption/Decryption Server is Running!");
});

// AES Encryption function
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

// AES Decryption function
function decryptMessage(encryptedMessage) {
    try {
        const parts = encryptedMessage.split(":");
        if (parts.length !== 2) throw new Error("Invalid encrypted format");

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

// Encrypt and Store Message
app.post("/encrypt", (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const encryptedMessage = encryptMessage(message);
    if (!encryptedMessage) return res.status(500).json({ error: "Encryption failed" });

    console.log("🔹 Storing message in database...");
    console.log("➡️ Original:", message);
    console.log("➡️ Encrypted:", encryptedMessage);

    db.run("INSERT INTO messages (original_message, encrypted_message) VALUES (?, ?)", 
        [message, encryptedMessage], 
        function (err) {
            if (err) {
                console.error("❌ Database Insert Error:", err.message);
                return res.status(500).json({ error: "Failed to store message", details: err.message });
            }

            console.log(`✅ Message stored successfully! ID: ${this.lastID}`);
            res.json({ id: this.lastID, encryptedMessage });
        }
    );
});


// Decrypt Message
// Decrypt Message from Database
app.post("/decrypt", (req, res) => {
    const { encryptedMessage } = req.body;
    if (!encryptedMessage) {
        return res.status(400).json({ error: "Encrypted message is required" });
    }

    // Fetch the original message from the database
    db.get("SELECT original_message FROM messages WHERE encrypted_message = ?", [encryptedMessage], (err, row) => {
        if (err) {
            console.error("❌ Database Error:", err.message);
            return res.status(500).json({ error: "Failed to retrieve message" });
        }

        if (!row) {
            return res.status(404).json({ error: "No matching record found" });
        }

        // Send back the original message
        res.json({ decryptedMessage: row.original_message });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});
