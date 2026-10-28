export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Vary", "Origin");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const origin = req.headers.origin;
  const canonicalOrigin = "https://mounir-institute-hassannnn300-7147.vercel.app";
  const configuredSiteUrl = (process.env.SITE_URL || canonicalOrigin).trim();
  let baseUrl;
  try {
    baseUrl = new URL(configuredSiteUrl).origin;
    // Allow the live production URL and the institute's known domain aliases.
    // SITE_URL controls Stripe's return URL, but an outdated value must not block
    // requests made from the current production site.
    const allowedOrigins = new Set([
      canonicalOrigin,
      "https://mounir-institute.vercel.app",
      "https://mounirinstitute.com",
      "https://www.mounirinstitute.com",
      baseUrl
    ]);
    if (origin) {
      let requestOrigin;
      try { requestOrigin = new URL(origin).origin; } catch { requestOrigin = ""; }
      if (!allowedOrigins.has(requestOrigin)) {
        return res.status(403).json({ error: "Request origin not allowed." });
      }
    }
    // Always send customers back to the canonical live site, avoiding stale SITE_URL aliases.
    baseUrl = canonicalOrigin;
  } catch (error) {
    console.error("Invalid SITE_URL configuration:", error && error.message);
    return res.status(503).json({
      error: "Checkout configuration issue: Vercel's SITE_URL must be a full valid URL, for example https://mounir-institute-hassannnn300-7147.vercel.app (without quotes or extra spaces)."
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
      description: "All eight Maqamaat, recorded video lessons, vocal drills and breathing techniques. Immediate access requested at checkout; the 14-day cancellation right ends once access begins. 7-day money-back guarantee applies."
    },
    monthly: {
      name: "Maqamaat Intensive",
      amount: 15900,
      mode: "subscription",
      description: "All eight Maqamaat lessons, two online lessons each week, private student community, daily quizzes and games."
    },
    founding_presale: {name: "Applied Maqamaat Place Reservation", amount: 2500, mode: "payment", description: "£25 holding payment for an Applied Maqamaat place. Comes off your first month if you start. Refunded in full if you are not offered a place or decide not to go ahead. Not a subscription."},
    mentoring: {
      name: "1-to-1 Learning with Qari Hassan Mounir",
      amount: 29900,
      mode: "subscription",
      description: "Everything in the Maqamaat Intensive (all eight Maqamaat lessons, two online lessons each week, community) plus individual mentoring."
    }
  };

  const plan = plans[body && body.plan];
  if (!plan) return res.status(400).json({ error: "Please select a valid learning plan." });

  // The recorded course is digital content supplied straight away. UK consumer law lets the 14-day
  // cancellation right end only if the buyer expressly asked for immediate access and acknowledged
  // losing that right, so the session is refused without that request, and the request is recorded.
  const DIGITAL_CONSENT_VERSION = "2026-10-28";
  const DIGITAL_CONSENT_TEXT = "I ask for immediate access to the recorded lessons as soon as my payment goes through, and I understand that I then lose my 14-day statutory right to cancel. The 7-day money-back guarantee still applies to this purchase.";
  if (body.plan === "recorded" && body.digital_consent !== true) {
    return res.status(400).json({ error: "Please tick the box asking for immediate access to the recorded lessons before continuing." });
  }

  let reservationId=null;
  const db=(process.env.SUPABASE_URL||"").replace(/\/$/,"")+"/rest/v1";
  const auth={apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:"Bearer "+process.env.SUPABASE_SERVICE_ROLE_KEY,"Content-Type":"application/json"};
  async function release(){if(reservationId)await fetch(db+"/founding_reservations?id=eq."+reservationId+"&state=eq.held",{method:"PATCH",headers:auth,body:JSON.stringify({state:"released"})});}
  if (body && body.plan === "founding_presale") {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return res.status(503).json({error:"Presale reservations are not yet available. Please apply for a place first."});
    const requestedEmail=typeof body.email==="string"?body.email.trim().toLowerCase():"";
    if(!requestedEmail)return res.status(400).json({error:"Complete the Applied Maqamaat application first."});
    try {
      const lookup=await fetch(process.env.SUPABASE_URL.replace(/\/$/,"")+"/rest/v1/founding_applications?email=eq."+encodeURIComponent(requestedEmail)+"&select=id,status,presale_interest&order=created_at.desc&limit=1",{headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:"Bearer "+process.env.SUPABASE_SERVICE_ROLE_KEY}});
      if(!lookup.ok)return res.status(503).json({error:"Could not verify your application."});
      const rows=await lookup.json();if(!rows.length||!rows[0].presale_interest)return res.status(403).json({error:"Please complete the Applied Maqamaat application before paying."});
      if(["declined","withdrawn"].includes(rows[0].status))return res.status(403).json({error:"This application is not eligible for presale payment."});
      const hold=await fetch(db+"/rpc/hold_founding_place",{method:"POST",headers:auth,body:JSON.stringify({p_application_id:rows[0].id})});
      if(!hold.ok)return res.status(503).json({error:"Reservations are not configured. No payment was started."});
      const seat=(await hold.json())[0];
      if(!seat||seat.result==="full")return res.status(409).json({error:"All 30 places are taken. Enrolment is closed."});
      if(seat.result==="existing")return res.status(409).json({error:"You already have a reservation in progress. Please contact info@mounirinstitute.com."});
      if(seat.result!=="held")return res.status(403).json({error:"This application is not eligible."});
      reservationId=seat.reservation_id;
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
  params.set("metadata[plan]", body.plan);
  if(reservationId){
    params.set("metadata[reservation_id]",reservationId);
    params.set("payment_intent_data[metadata][reservation_id]",reservationId);
    params.set("payment_intent_data[metadata][plan]","founding_presale");
    params.set("expires_at",String(Math.floor(Date.now()/1000)+1800));
  }
  params.set("metadata[site]", "mounir-institute");
  if (body.plan === "recorded") {
    const consentAt = new Date().toISOString();
    const consentRecord = [
      ["digital_content_consent", "yes"],
      ["digital_consent_version", DIGITAL_CONSENT_VERSION],
      ["digital_consent_at", consentAt],
      ["digital_consent_text", DIGITAL_CONSENT_TEXT]
    ];
    for (const [key, value] of consentRecord) {
      params.set("metadata[" + key + "]", value);
      params.set("payment_intent_data[metadata][" + key + "]", value);
    }
    params.set("custom_text[submit][message]", "By paying, you confirm that you asked for immediate access to the recorded lessons and understand that your 14-day right to cancel ends once access begins. Our 7-day money-back guarantee still applies.");
  }

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
      await release();
      console.error("Stripe session creation failed:", session.error && session.error.message);
      return res.status(502).json({ error: "Stripe could not start checkout. Please try again in a moment." });
    }
    if(reservationId){
      const link=await fetch(db+"/founding_reservations?id=eq."+reservationId+"&state=eq.held",{method:"PATCH",headers:auth,body:JSON.stringify({stripe_session_id:session.id})});
      if(!link.ok){await release();await fetch("https://api.stripe.com/v1/checkout/sessions/"+session.id+"/expire",{method:"POST",headers:{Authorization:"Bearer "+secretKey.trim()}});return res.status(503).json({error:"Could not secure reservation. No payment was started."});}
    }
    return res.status(200).json({
      clientSecret: session.client_secret,
      publishableKey: publishableKey.trim(),
      plan: body.plan
    });
  } catch (error) {
    try{await release();}catch(e){console.error("Could not release reservation hold");}
    console.error("Stripe request failed:", error && error.message);
    return res.status(502).json({ error: "Unable to connect to secure checkout. Please try again." });
  }
}
