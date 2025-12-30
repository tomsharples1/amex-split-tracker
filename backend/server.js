import fs from "fs";
import path from "path";
import express from "express";
import Papa from "papaparse";
import cors from "cors";

const app = express();
const PORT = 3001;

app.use(cors()); // dev only (remove later if same-origin)

const DATA_DIR = path.join(process.cwd(), "data");

function normaliseHeader(header){
  return header
    .toLowerCase()
    .replace(/[^a-z ]+/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

function loadCSV(filename){
  const csv = fs.readFileSync(path.join(DATA_DIR, filename), "utf8");
  const parsed = Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normaliseHeader
  });

  return parsed.data;
}

/* ---------- API ---------- */
app.get("/api/activity", (_req, res) => {
  try {
    res.json(loadCSV("activity.csv"));
  } catch (e) {
    res.status(500).json({ error: "Failed to load activity.csv" });
  }
});

app.get("/api/payments", (_req, res) => {
  try {
    res.json(loadCSV("payments.csv"));
  } catch (e) {
    res.status(500).json({ error: "Failed to load payments.csv" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
