import { timingSafeEqual } from "node:crypto";

// Owners' endpoint for the £25 Applied Maqamaat holding payments.
//   GET  lists holds, payments and refunds with each applicant's details.
//   POST {reservation_id, reason: "declined" | "withdrawn"} refunds a paid holding payment in full
//        through Stripe, marks the reservation refunded (which frees the place) and sets the
//        application status to the reason.
// Protected by ADMIN_API_TOKEN, sent as "Authorization: Bearer <token>". Used by /admin/refunds.html.

const SELECT = "id,state,created_at,paid_at,refunded_at,refund_reason,stripe_session_id,stripe_payment_intent_id,stripe_refund_id," +
  "application:founding_applications(id,name,email,status,created_at)";

function authorised(req) {
  const expected = (process.env.ADMIN_API_TOKEN || "").trim();
  const header = typeof req.headers.authorization === "string" ? req.headers.authorization : "";
  const given = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!expected || !given) return false;
  const a = Buffer.from(given), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function present(row) {
  const a = row.application || {};
  return {
    reservationId: row.id,
    state: row.state,
    createdAt: row.created_at,
    paidAt: row.paid_at,
    refundedAt: row.refunded_at,
    refundReason: row.refund_reason,
    stripeRefundId: row.stripe_refund_id,
    applicant: { id: a.id, name: a.name, email: a.email, status: a.status, appliedAt: a.created_at }
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const token = (process.env.ADMIN_API_TOKEN || "").trim();
  if (token.length < 24) {
    return res.status(503).json({ error: "Refund access is not set up yet. Add ADMIN_API_TOKEN (at least 24 characters) in Vercel." });
  }
  if (!authorised(req)) return res.status(401).json({ error: "Not authorised." });
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return res.status(503).json({ error: "Supabase is not configured." });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json({ error: "Stripe is not configured." });

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const db = process.env.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1";
  const dbHeaders = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
  const stripeKey = process.env.STRIPE_SECRET_KEY.trim();

  if (req.method === "GET") {
    const list = await fetch(db + "/founding_reservations?select=" + encodeURIComponent(SELECT) +
      "&state=in.(held,paid,refunded)&order=created_at.desc&limit=200", { headers: dbHeaders });
    if (!list.ok) {
      return res.status(502).json({ error: "Could not read the holding payments. If the refund columns are missing, run docs/founding-refunds.sql in Supabase." });
    }
    const rows = await list.json();
    return res.status(200).json({ reservations: rows.map(present) });
  }

  let body;
  try { body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {}); } catch { return res.status(400).json({ error: "Invalid request." }); }
  const reservationId = typeof body.reservation_id === "string" ? body.reservation_id.trim() : "";
  const reason = body.reason === "declined" || body.reason === "withdrawn" ? body.reason : "";
  if (!/^[0-9a-f-]{36}$/i.test(reservationId) || !reason) {
    return res.status(400).json({ error: "Send reservation_id and a reason of declined or withdrawn." });
  }

  const lookup = await fetch(db + "/founding_reservations?id=eq." + encodeURIComponent(reservationId) + "&select=" + encodeURIComponent(SELECT), { headers: dbHeaders });
  if (!lookup.ok) return res.status(502).json({ error: "Could not read the reservation." });
  const [reservation] = await lookup.json();
  if (!reservation) return res.status(404).json({ error: "Reservation not found." });
  if (reservation.state === "refunded") return res.status(200).json({ ok: true, alreadyRefunded: true, reservation: present(reservation) });
  if (reservation.state !== "paid") {
    return res.status(409).json({ error: "This reservation has not been paid (state: " + reservation.state + "), so there is nothing to refund." });
  }

  // Find the payment behind the checkout session. Older payments were stored without the payment id.
  let paymentIntent = reservation.stripe_payment_intent_id || null;
  if (!paymentIntent) {
    if (!reservation.stripe_session_id) return res.status(409).json({ error: "No Stripe checkout session is linked to this reservation." });
    const sessionResponse = await fetch("https://api.stripe.com/v1/checkout/sessions/" + encodeURIComponent(reservation.stripe_session_id), {
      headers: { Authorization: "Bearer " + stripeKey }
    });
    const session = await sessionResponse.json();
    const pi = session && session.payment_intent;
    paymentIntent = typeof pi === "string" ? pi : (pi && pi.id) || null;
    if (!sessionResponse.ok || !paymentIntent) return res.status(502).json({ error: "Could not find the payment behind this reservation in Stripe." });
  }

  // Refund in full. The idempotency key makes a retry safe: Stripe returns the same refund rather than making a second one.
  const params = new URLSearchParams();
  params.set("payment_intent", paymentIntent);
  params.set("metadata[reservation_id]", reservation.id);
  params.set("metadata[reason]", reason);
  if (reason === "withdrawn") params.set("reason", "requested_by_customer");
  const refundResponse = await fetch("https://api.stripe.com/v1/refunds", {
    method: "POST",
    headers: { Authorization: "Bearer " + stripeKey, "Content-Type": "application/x-www-form-urlencoded", "Idempotency-Key": "holding-refund-" + reservation.id },
    body: params.toString()
  });
  const refund = await refundResponse.json();
  if (!refundResponse.ok) {
    const alreadyRefunded = refund && refund.error && refund.error.code === "charge_already_refunded";
    if (!alreadyRefunded) {
      console.error("Stripe refund failed:", refund && refund.error && refund.error.code);
      return res.status(502).json({ error: "Stripe could not refund this payment" + (refund && refund.error && refund.error.message ? ": " + refund.error.message : ".") });
    }
  }

  const patch = { state: "refunded", refunded_at: new Date().toISOString(), refund_reason: reason, stripe_payment_intent_id: paymentIntent };
  if (refundResponse.ok && refund.id) patch.stripe_refund_id = refund.id;
  const update = await fetch(db + "/founding_reservations?id=eq." + encodeURIComponent(reservation.id) + "&state=eq.paid", {
    method: "PATCH", headers: { ...dbHeaders, Prefer: "return=minimal" }, body: JSON.stringify(patch)
  });
  if (!update.ok) {
    return res.status(502).json({
      error: "The refund was made in Stripe, but the reservation could not be updated. If the refund columns are missing, run docs/founding-refunds.sql, then refresh.",
      refundId: refund.id || null
    });
  }
  const applicationId = reservation.application && reservation.application.id;
  if (applicationId) {
    await fetch(db + "/founding_applications?id=eq." + encodeURIComponent(applicationId), {
      method: "PATCH", headers: { ...dbHeaders, Prefer: "return=minimal" }, body: JSON.stringify({ status: reason })
    });
  }
  const updated = { ...reservation, ...patch, application: applicationId ? { ...reservation.application, status: reason } : reservation.application };
  return res.status(200).json({ ok: true, refundId: refund.id || null, reservation: present(updated) });
}
