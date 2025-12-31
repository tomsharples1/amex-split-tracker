import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";

import truelayerAuth from "./truelayer/auth.js";

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// SQLite DB
const db = new sqlite3.Database("./db/app.db");
app.locals.db = db;

// Mount TrueLayer routes
app.use("/truelayer", truelayerAuth);

// Health check (optional but useful)
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
