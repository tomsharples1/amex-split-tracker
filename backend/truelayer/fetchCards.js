import "dotenv/config";
import { getAccessToken } from "./client.js";

export async function fetchCards(db) {
  const accessToken = await getAccessToken(db);

  const res = await fetch(
    "https://api.truelayer.com/data/v1/cards",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`TrueLayer /cards failed: ${error}`);
  }

  const data = await res.json();

  return Array.isArray(data.results) ? data.results : [];
}
