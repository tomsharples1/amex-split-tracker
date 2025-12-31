import "dotenv/config";
import { getAccessToken } from "./client.js";

export async function fetchCardTransactions(db, cardId) {
  const accessToken = await getAccessToken(db);

  const res = await fetch(
    `https://api.truelayer.com/data/v1/cards/${cardId}/transactions`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!res.ok) {
    const text = 