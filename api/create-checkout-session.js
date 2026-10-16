export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Vary", "Origin");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const origin = req.headers.origin;
  const allowedOrigin = process.env.SITE_URL || "https://mounir-institute.vercel.app";
  if (origin && new URL(origin).origin !== new URL(allowedOrigin).origin) {
    return res.status(403).json({ error: "Request origin not allowed." });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!secretKey || !publishableKey) {
    return res.status(503).json({
      error: "Secure checkout is not configured yet. Add STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY in Vercel Project Settings → Environment Variables."
    });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "Invalid request." });
  }

  const plans = {
    recorded: {
      name: "Recorded Maqamaat Lessons",
      amount: 25000,
      mode: "payment",
      description: "All eight Maqamaat, recorded video lessons, vocal drills and breathing techniques."
    },
    monthly: {
      name: "Monthly Learning",
      amount: 5000,
      mode: "subscription",
      description: "All eight Maqamaat lessons, two online lessons each week, private student community, daily quizzes and games."
    },
    mentoring: {
      name: "1-to-1 Learning with Qari Hassan Mounir",
      amount: 15000,
      mode: "subscription",
      description: "Monthly learning, all eight Maqamaat lessons, two online lessons each week, community and individual mentoring."
    }
  };

  const plan = plans[body && body.plan];
  if (!plan) return res.status(400).json({ error: "Please select a valid learning plan." });

  const email = typeof body.email === "string" ? body.email.trim().slice(0, 254) : "";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }

  const baseUrl = new URL(allowedOrigin).origin;
  const params = new URLSearchParams();
  params.set("ui_mode", "embedded_page");
  params.set("mode", plan.mode);
  params.set("return_url", baseUrl + "/checkout-success.html?session_id={CHECKOUT_SESSION_ID}");
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "gbp");
  params.set("line_items[0][price_data][unit_amount]", String(plan.amount));
  params.set("line_items[0][price_data][product_data][name]", plan.name);
  params.set("line_items[0][price_data][product_data][description]", plan.description);
  if (plan.mode === "subscription") {
    params.set("line_items[0][price_data][recurring][interval]", "month");
  }
  if (email) params.set("customer_email", email);
  params.set("billing_address_collection", "auto");
  params.set("allow_promotion_codes", "true");
  params.set("metadata[plan]", body.plan);
  params.set("metadata[site]", "mounir-institute");

  try {
    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + secretKey,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });
    const session = await stripeResponse.json();
    if (!stripeResponse.ok) {
      console.error("Stripe session creation failed:", session.error && session.error.message);
      return res.status(502).json({ error: "Stripe could not start checkout. Please try again in a moment." });
    }
    return res.status(200).json({
      clientSecret: session.client_secret,
      publishableKey,
      plan: body.plan
    });
  } catch (error) {
    console.error("Stripe request failed:", error && error.message);
    return res.status(502).json({ error: "Unable to connect to secure checkout. Please try again." });
  }
}
