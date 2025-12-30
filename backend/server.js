import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use a writable directory
const DB_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DB_DIR, "amex.db");

// Ensure directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Open DB (read-only is fine once created)
const db = new sqlite3.Database(DB_PATH, err => {
  if (err) {
    console.error("Failed to open DB:", err.message);
    process.exit(1);
  }
});


const app = express();
app.use(cors());

/* -------- helpers -------- */
function all(sql, params = []) {
  return new Promise((res, rej) => {
    db.all(sql, params, (err, rows) => (err ? rej(err) : res(rows)));
  });
}

/* -------- routes -------- */
app.get("/activity", async (_, res) => {
  try {
    const rows = await all(
      `SELECT *
       FROM activity
       ORDER BY date DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch activity" });
  }
});

app.get("/payments", async (_, res) => {
  try {
    const rows = await all(
      `SELECT *
       FROM payments
       ORDER BY date