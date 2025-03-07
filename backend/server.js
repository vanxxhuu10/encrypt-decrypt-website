require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

// Load SECRET_KEY from .env
const SECRET_KEY = process.env.SECRET_KEY || "d9fab44e53f9f7028df27035582a626e74b404a746101deb645a1c4753ce9add";
if (!SECRET_KEY || SECRET_KEY.length !== 64) {
    console.error("❌ SECRET_KEY is missing or invalid!");
    process.exit(1);
}

// Encryption function
function encryptMessage(message) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(SECRET_KEY, "hex"), iv);
    let encrypted = cipher.update(message, "utf-8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
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
        return null;
    }
}

// Test Route
app.get("/", (req, res) => {
    res.send("Encryption API is running!");
});

// Encrypt Route
app.post("/encrypt", (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const encryptedMessage = encryptMessage(message);
    res.json({ encryptedMessage });
});

// Decrypt Route
app.post("/decrypt", (req, res) => {
    const { encryptedMessage } = req.body;
    if (!encryptedMessage) return res.status(400).json({ error: "Encrypted message is required" });

    const decryptedMessage = decryptMessage(encryptedMessage);
    if (!decryptedMessage) return res.status(400).json({ error: "Decryption failed!" });

    res.json({ decryptedMessage });
});

app.get("/debug-db", (req, res) => {
    db.all("SELECT * FROM messages", [], (err, rows) => {
        if (err) {
            console.error("❌ Database Query Error:", err.message);
            return res.status(500).json({ error: "Database error", details: err.message });
        }
        console.log("📜 Stored Messages:", rows); // Log in Vercel logs
        res.json(rows);
    });
});

// **DO NOT use app.listen() on Vercel**
module.exports = app;
