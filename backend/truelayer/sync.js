import "dotenv/config";
import sqlite3 from "sqlite3";
import { fetchCards } from "./fetchCards.js";
import { fetchCardTransactions } from "./fetchTransactions.js";
import { insertTransactions } from "./insertTransactions.js";

const db = new sqlite3.Database("./db/app.db");

(async () => {
  try {
    console.log("🔄 Sync started");

    const cards = await fetchCards(db);

    if (!Array.isArray(cards) || cards.length === 0) {
      console.warn("⚠️ No cards returned from TrueLayer");
      process.exit(0);
    }

    for (const card of cards) {
      const name = card.display_nam