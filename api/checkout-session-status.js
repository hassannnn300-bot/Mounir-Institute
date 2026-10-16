export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const sessionId = typeof req.query.session_id === "string" ? req.query.session_id : "";
  if (!secretKey || !sessionId || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
    return res.status(400).json({ error: "Missing or invalid checkout session." });
  }
  try {
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions/" + encodeURIComponent(sessionId), {
      headers: { Authorization: "Bearer " + secretKey }
    });
    const session = await response.json();
    if (!response.ok) return res.status(502).json({ error: "Could not verify payment status." });
    return res.status(200).json({
      status: session.status,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details && session.customer_details.email,
      mode: session.mode,
      subscriptionStatus: session.subscription ? "created" : null
    });
  } catch {
    return res.status(502).json({ error: "Could not verify payment status." });
  }
}
