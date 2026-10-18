export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Vary", "Origin");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const origin = req.headers.origin;
  const allowedOrigin = process.env.SITE_URL || "https://mounir-institute.vercel.app";
  let baseUrl;
  try {
    baseUrl = new URL(allowedOrigin).origin;
    if (origin && new URL(origin).origin !== baseUrl) {
      return res.status(403).json({ error: "Request origin not allowed." });
    }
  } catch (error) {
    console.error("Invalid SITE_URL configuration:", error && error.message);
    return res.status(503).json({
      error: "Checkout configuration issue: Vercel's SITE_URL must be a full valid URL, for example https://mounir-institute.vercel.app (without quotes or extra spaces)."
    });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!secretKey || !publishableKey) {
    return res.status(503).json({
      error: "Secure checkout is missing its Stripe keys. In Vercel, check STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY are set for the Production environment."
    });
  }

  // Validate key types before calling Stripe so a copied restricted key,
  // secret key in the publishable field, or pasted quotes/spaces is caught clearly.
  const secretMatch = /^sk_(test|live)_[A-Za-z0-9]+$/.exec(secretKey.trim());
  const publishableMatch = /^pk_(test|live)_[A-Za-z0-9]+$/.exec(publishableKey.trim());
  if (!secretMatch || !publishableMatch) {
    console.error("Stripe key format check failed. Secret key type:", secretKey.trim().slice(0, 3),
      "publishable key type:", publishableKey.trim().slice(0, 3));
    return res.status(503).json({
      error: "Stripe key configuration issue: Vercel must contain a standard sk_test_/sk_live_ secret key and a matching pk_test_/pk_live_ publishable key. Do not use an rk_ restricted key or add quotation marks."
    });
  }
  if (secretMatch[1] !== publishableMatch[1]) {
    return res.status(503).json({
      error: "Your Stripe keys do not match: both must be test keys or both must be live keys."
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
    founding_presale: {name: "Founding Class — £50 Presale Reservation", amount: 5000, mode: "payment", description: "One-time £50 presale payment credited towards the first month if your Founding Class place is accepted. Not a recurring subscription; confirmation follows review."},
    mentoring: {
      name: "1-to-1 Learning with Qari Hassan Mounir",
      amount: 15000,
      mode: "subscription",
      description: "Monthly learning, all eight Maqamaat lessons, two online lessons each week, community and individual mentoring."
    }
  };

  const plan = plans[body && body.plan];
  if (!plan) return res.status(400).json({ error: "Please select a valid learning plan." });

  if (body && body.plan === "founding_presale") {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return res.status(503).json({error:"Presale reservations are not yet available. Please apply for a place first."});
    const requestedEmail=typeof body.email==="string"?body.email.trim().toLowerCase():"";
    if(!requestedEmail)return res.status(400).json({error:"Complete the Founding Class application first."});
    try {
      const lookup=await fetch(process.env.SUPABASE_URL.replace(/\/$/,"")+"/rest/v1/founding_applications?email=eq."+encodeURIComponent(requestedEmail)+"&select=id,status,presale_interest&limit=1",{headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:"Bearer "+process.env.SUPABASE_SERVICE_ROLE_KEY}});
      if(!lookup.ok)return res.status(503).json({error:"Could not verify your application."});
      const rows=await lookup.json();if(!rows.length||!rows[0].presale_interest)return res.status(403).json({error:"Please complete the Founding Class presale application before paying."});
      if(["declined","withdrawn"].includes(rows[0].status))return res.status(403).json({error:"This application is not eligible for presale payment."});
    }catch(e){return res.status(503).json({error:"Application verification is unavailable. No payment was started."});}
  }

  const email = typeof body.email === "string" ? body.email.trim().slice(0, 254) : "";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }

  const params = new URLSearchParams();
  params.set("ui_mode", "embedded_page");
  // Stripe owns the embedded iframe: brand it through Checkout Session settings.
  params.set("branding_settings[background_color]", "#141310");
  params.set("branding_settings[button_color]", "#D7B56D");
  params.set("branding_settings[display_name]", "Mounir Institute");
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
  params.set("metadata[plan]", body.plan);\n  if(body.plan==="founding_presale")params.set("metadata[reservation_status]","pending_review");
  params.set("metadata[site]", "mounir-institute");

  try {
    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + secretKey.trim(),
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
      publishableKey: publishableKey.trim(),
      plan: body.plan
    });
  } catch (error) {
    console.error("Stripe request failed:", error && error.message);
    return res.status(502).json({ error: "Unable to connect to secure checkout. Please try again." });
  }
}
