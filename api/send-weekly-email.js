export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  const { email, subject, content } = req.body;
  if (!email || !content) {
    return res.status(400).json({ error: "Missing email or content" });
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: "fintrack <onboarding@resend.dev>",
        to: [email],
        subject: subject || "Your Weekly Finance Summary",
        text: content
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(typeof data.error === "string" ? data.error : data.error.message || "Send failed");

    res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
