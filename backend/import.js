import fs from "fs";
import path from "path";
import csv from "csv-parser";
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";

/* ------------------ setup paths ------------------ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, "amex.db");
const ACTIVITY_CSV = path.join(__dirname, "../data/activity.csv");
const PAYMENTS_CSV = path.join(__dirname, "../data/payments.csv");

/* ------------------ open db ------------------ */
const db = new sqlite3.Database(DB_PATH);

/* ------------------ helpers ------------------ */
function run(sql, params = []) {
  return new Promise((res, rej) => {
    db.run(sql, params, err => (err ? rej(err) : res()));
  });
}

function insertMany(table, rows) {
  if (!rows.length) return Promise.resolve();

  const cols = Object.keys(rows[0]);
  const quotedCols = cols.map(c => `"${c}"`);
  const placeholders = cols.map(() => "?").join(",");

  const stmt = db.prepare(
    `INSERT INTO ${table} (${quotedCols.join(",")}) VALUES (${placeholders})`
  );

  return new Promise((res, rej) => {
    db.serialize(() => {
      for (const r of rows) {
        stmt.run(cols.map(c => r[c]));
      }
      stmt.finalize(err => (err ? rej(err) : res()));
    });
  });
}

/* ------------------ header normalisation ------------------ */
function normalizeHeader(header) {
  return header
    .toLowerCase()
    .trim()
    .replace(/£|\$/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_")
    .replace(/^\d/, "_$&");
}

/* ------------------ import logic ------------------ */
async function importCSV(table, csvPath) {
  const rows = [];
  const headerMap = {};

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(
        csv({
          mapHeaders: ({ header }) => {
            const normalized = normalizeHeader(header);
            headerMap[header] = normalized;
            return normalized;
          }
        })
      )
      .on("data", data => rows.push(data))
      .on("end", async () => {
        try {
          if (!rows.length) {
            console.warn(`${table}: CSV contained no rows — skipping`);
            return resolve();
          }

          const columns = Object.keys(rows[0])
            .map(c => `"${c}" TEXT`)
            .join(",");

          await run(`DROP TABLE IF EXISTS ${table}`);
          await run(`CREATE TABLE ${table} (${columns})`);
          await insertMany(table, rows);

          console.log(`Imported ${rows.length} rows into ${table}`);
          console.table(headerMap);

          resolve();
        } catch (err) {
          reject(err);
        }
      })
      .on("error", reject);
  });
}

/* ------------------ run both ------------------ */
(async () => {
  try {
    await importCSV("activity", ACTIVITY_CSV);
    await importCSV("payments", PAYMENTS_CSV);
    console.log("All CSVs imported successfully");
  } catch (err) {
    console.error("Import failed:", err);
  } finally {
    db.close();
  }
})();
