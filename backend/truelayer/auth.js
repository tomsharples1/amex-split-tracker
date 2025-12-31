import express from "express";

const router = express.Router();

router.get("/connect", (req, res) => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.TRUELAYER_CLIENT_ID,
    redirect_uri: process.env.TRUELAYER_REDIRECT_URI,
    scope: "cards transactions balance offline_access",
    providers: "uk-ob-all"
  });

  res.redirect(
  `https://auth.truelayer-sandbox.com/?${params.toString()}`
    );

});

router.get("/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("No code returned from TrueLayer");
  }

  const tokenRes = await fetch(
    "https://auth.truelayer.com/connect/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.TRUELAYER_REDIRECT_URI,
        client_id: process.env.TRUELAYER_CLIENT_ID,
        client_secret: process.env.TRUELAYER_CLIENT_SECRET
      })
    }
  );

  const token = await tokenRes.json();

  if (!token.refresh_token) {
    console.error(token);
    return res.status(500).send("No refresh token returned");
  }

  req.app.locals.db.run(
    `INSERT OR REPLACE INTO connections
     (provider, refresh_token, status)
     VALUES ('truelayer', ?, 'connected')`,
    [token.refresh_token]
  );

  res.send("TrueLayer connected. You can close this tab.");
});

export default router;
