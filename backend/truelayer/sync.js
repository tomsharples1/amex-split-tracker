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

    for (const card of cards) {
      const name = card.display_name || card.account_id;
      console.log(`📇 Fetching transactions for ${name}`);

      const txs = await fetchCardTransactions(db, card.account_id);
      console.log(`   ↳ ${txs.length} transactions`);

      await insertTransactions(db, card.account_id, txs);
    }

    console.log("✅ Sync complete");

    db.close();
  } catch (err) {
    console.error("❌ Sync failed:", err);
    db.close();
  }
})();
