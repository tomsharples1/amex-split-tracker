import express from "express";

const router = express.Router();

/**
 * STEP 1: Redirect user to TrueLayer consent
 */
router.get("/connect", (req, res) => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.TRUELAYER_CLIENT_ID,
    redirect_uri: process.env.TRUELAYER_REDIRECT_URI,
    scope: [
      "info",
      "accounts",
      "balance",
      "cards",
      "transactions",
      "offline_access"
    ].join(" ")
    // NOTE: no providers param for LIVE
  });

  const authUrl = `https://auth.truelayer.com/?${params.toString()}`;
  console.log("TrueLayer LIVE auth URL:", authUrl);

  res.redirect(authUrl);
});

/**
 * STEP 2: Handle callback + exchange code for tokens
 */
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
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization":
          "Basic " +
          Buffer.from(
            `${process.env.TRUELAYER_CLIENT_ID}:${process.env.TRUELAYER_CLIENT_SECRET}`
          ).toString("base64")
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.TRUELAYER_REDIRECT_URI
      })
    }
  );

  const token = await tokenRes.json();

  if (!token.refresh_token) {
