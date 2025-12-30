import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new sqlite3.Database(
  path.join(__dirname, "amex.db"),
  sqlite3.OPEN_READONLY
);

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
       ORDER BY date DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

/* -------- start -------- */
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`API running on port ${PORT