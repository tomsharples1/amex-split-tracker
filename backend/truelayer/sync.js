import sqlite3 from "sqlite3";
import { fetchCards } from "./fetchCards.js";
import { fetchCardTransactions } from "./fetchTransactions.js";
import { insertTransactions } from "./insertTransactions.js";

const db = new sqlite3.Database("./db/app.db");

(async () => {
  console.log("Sync started");

  const cards = await fetchCards(db);

  for (const card of cards) {
    console.log(`Fetching transactions for ${card.display_name}`);
    const txs = await fetchCardTransactions(db, card.account_id);
    insertTransactions(db, card.account_id, txs);
  }

  console.log("Sync complete");
})();
