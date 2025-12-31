export function insertTransactions(db, cardId, transactions) {
  for (const tx of transactions) {
    db.run(
      `
      INSERT OR IGNORE INTO transactions
        (provider, external_account_id, external_transaction_id,
         transaction_date, description, amount, direction, raw_json)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        "truelayer",
        cardId,
        tx.transaction_id,
        tx.timestamp,
        tx.description,
        Math.abs(tx.amount),
        tx.amount < 0 ? "out" : "in",
        JSON.stringify(tx)
      ]
    );
  }
}
