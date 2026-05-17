export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  const env = process.env.PLAID_ENV === "production"
    ? "https://production.plaid.com"
    : "https://sandbox.plaid.com";

  try {
    const { public_token } = req.body;
    const exchangeRes = await fetch(`${env}/item/public_token/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: process.env.PLAID_CLIENT_ID, secret: process.env.PLAID_SECRET, public_token }),
    });
    const exchangeData = await exchangeRes.json();
    if (exchangeData.error_message) throw new Error(exchangeData.error_message);
    const access_token = exchangeData.access_token;
    const accountsRes = await fetch(`${env}/accounts/get`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: process.env.PLAID_CLIENT_ID, secret: process.env.PLAID_SECRET, access_token }),
    });
    const accountsData = await accountsRes.json();
    if (accountsData.error_message) throw new Error(accountsData.error_message);
    const balance = accountsData.accounts
      .filter(a => ["checking","savings","depository"].includes(a.subtype || a.type))
      .reduce((sum, a) => sum + (a.balances.current || 0), 0);
    res.status(200).json({ balance, accounts: accountsData.accounts.map(a => ({ name: a.name, balance: a.balances.current })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
