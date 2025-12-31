import "dotenv/config";

export async function getAccessToken(db) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT refresh_token FROM connections WHERE provider = 'truelayer'",
      async (err, row) => {
        if (err || !row) {
          return reject("No refresh token found");
        }

        try {
          const res = await fetch(
            "https://auth.truelayer.com/connect/token",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization":
                  "Basic " +
                  Buffer.from(
                    `${process.env.TRUELAYER_CLIENT_ID}:${process.env.TRUELAYER_CLIENT_SECRET}`
                  ).toString("base64")
              },
              body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: row.refresh_token
              })
            }
          );

          const data = await res.json();

          // 🔍 DEBUG LOG
          console.log("🎟️ Token response keys:", Object.keys(data));

          if (!data.access_token) {
            console.error("❌ Token refresh failed:", data);
            return reject("No access token returned");
          }

          resolve(data.access_token);
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}
