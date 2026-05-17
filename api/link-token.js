export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  const env = process.env.PLAID_ENV === "production"
    ? "https://production.plaid.com"
    : "https://sandbox.plaid.com";

  try {
    const response = await fetch(`${env}/link/token/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.PLAID_CLIENT_ID,
        secret: process.env.PLAID_SECRET,
        client_name: "fintrack",
        user: { client_user_id: "fintrack-user" },
        products: ["auth", "transactions"],
        country_codes: ["US"],
        language: "en",
      }),
    });
    const data = await response.json();
    if (data.error_message) throw new Error(data.error_message);
    res.status(200).json({ link_token: data.link_token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
