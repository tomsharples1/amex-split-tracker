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

  const data = await res.json();

  console.log("🔍 Raw /cards response:", JSON.stringify(data, null, 2));

  // Defensive return
  return Array.isArray(data.results) ? data.results : [];
}
