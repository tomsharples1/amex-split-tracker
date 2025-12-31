export function insertTransactions(db, cardId, transactions) {
  return new Promise((resolve, reject) => {
    if (!transactions.length) return resolve();

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      const stmt = db.prepare(`
        INSERT OR IGNORE INTO transactions
          (provider, external_account_id, external_transaction_id,
           transaction_date, description, amount, direction, raw_json)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const tx of transactions) {
        stmt.run([
          "truelayer",
         