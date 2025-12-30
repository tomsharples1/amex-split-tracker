import fs from "fs";
import path from "path";
import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

/* ------------------ paths ------------------ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DB_DIR, "amex.db");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

/* ------------------ db ------------------ */
const db = new sqlite3.Database(DB_PATH);

/* ------------------ auto-import ------------------ */
function ensureTables() {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='activity'`,
      (err, row) => {
        if (err) return reject(err);
        if (row) return resolve(); // tables already exist

        console.log("🟡 No tables found. Running importer…");

        const child = spawn("node", ["import.js"], {
          cwd: __dirname,
          stdio: "inherit"
        });

        child.on("exit", code => {
          if (code === 0) {
            console.log("✅ Import complete");
            resolve();
          } else {
            reject(new Error("Importer failed"));
          }
        });
      }
    );
  });
}

/* ------------------ app ------------------ */
const app = express();
app.use(cors());

function all(sql) {
  return new Promise((res, rej) =>
    db.all(sql, [], (err, rows) => (err ? rej(err) : res(rows)))
  );
}

/* ------------------ routes ------------------ */
app.get("/activity", async (_, res) => {
  try {
    const rows = await all(`
      SELECT *
      FROM activity
      ORDER BY rowid DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Activity unavailable" });
  }
});

app.get("/payments", async (_, res) => {
  try {
    const rows = await all(`
      SELECT *
      FROM payments
      ORDER BY rowid DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Payments unavailable" });
  }
});

/* ------------------ start ------------------ */
const PORT = process.env.PORT || 3001;

ensureTables()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`✅ API running on port ${PORT}`)
    );
  })
  .catch(err => {
    console.error("❌ Startup failed:", err);
    process.exit(1);
  });
