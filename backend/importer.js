import fs from "fs";
import path from "path";
import csv from "csv-parser";
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";

/* ------------------ paths ------------------ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DB_DIR, "amex.db");

const ACTIVITY_CSV = path.join(DB_DIR, "activity.csv");
const PAYMENTS_CSV = path.join(DB_DIR, "payments.csv");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

/* ------------------ db ------------------ */
const db = new sqlite3.Database(DB_PATH);

/* ------------------ helpers ------------------ */
function run(sql, params = []) {
  return new Promise((res, rej) =>
    db.run(sql, params, err => (err ? rej(err) : res()))
  );
}

function insertMany(table, rows) {
  if (!rows.length) return Promise.resolve();

  const cols = Object.keys(rows[0]);
  const quoted = cols.map(c => `"${c}"`).join(",");
  const qs = cols.map(() => "?").join(",");

  const stmt = db.prepare(
    `INSERT INTO ${table} (${quoted}) VALUES (${qs})`
  );

  return new Promise((res, rej) => {
    db.serialize(() => {
      rows.forEach(r => stmt.run(cols.map(c => r[c])));
      stmt.finalize(err => (err ? rej(err) : res()));
    });
  });
}

/* ------------------ header normalisation ------------------ */
function normalizeHeader(h) {
  return h
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .trim()
    .replace(/£|\$/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");
}

/* ------------------ import ------------------ */
async function importCSV(table, csvPath) {
  const rows = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv({ mapHeaders: ({ header }) => normalizeHeader(header) }))
      .on("data", r => rows.push(r))
      .on("end", async () => {
        try {
          if (!rows.length) return resolve();

          const cols = Object.keys(rows[0])
            .map(c => `"${c}" TEXT`)
            .join(",");

          await run(`DROP TABLE IF EXISTS ${table}`);
          await run(`CREATE TABLE ${table} (${cols})`);
          await insertMany(table, rows);

          console.log(`Imported ${rows.length} rows into ${table}`);
          resolve();
        } catch (e) {
          reject(e);
        }
      })
      .on("error", reject);
  });
}

/* ------------------ run ------------------ */
(async () => {
  try {
    await importCSV("activity", ACTIVITY_CSV);
    await importCSV("payments", PAYMENTS_CSV);
    console.log("✅ Import complete");
  } catch (err) {
    console.error("❌ Import failed:", err);
  } finally {
    db.close();
  }
})();
