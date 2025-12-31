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
  return data.results;
}
