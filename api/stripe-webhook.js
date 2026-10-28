import {createHmac,timingSafeEqual} from "node:crypto";
export const config={api:{bodyParser:false}};
async function raw(req){const chunks=[];for await(const chunk of req)chunks.push(Buffer.from(chunk));return Buffer.concat(chunks);}
export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).end();
 if(!process.env.STRIPE_WEBHOOK_SECRET||!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return res.status(503).end();
 const body=await raw(req),header=req.headers["stripe-signature"]||"";
 const parts=Object.fromEntries(header.split(",").map(x=>x.split("=")));
 const stamp=Number(parts.t);if(!stamp||Math.abs(Date.now()/1000-stamp)>300)return res.status(400).end();
 const expected=createHmac("sha256",process.env.STRIPE_WEBHOOK_SECRET).update(stamp+"."+body.toString()).digest("hex");
 if(!parts.v1||parts.v1.length!==expected.length||!timingSafeEqual(Buffer.from(parts.v1),Buffer.from(expected)))return res.status(400).end();
 let event;try{event=JSON.parse(body.toString());}catch{return res.status(400).end();}
 const object=(event.data&&event.data.object)||{};
 const base=process.env.SUPABASE_URL.replace(/\/$/,"")+"/rest/v1/founding_reservations?";
 const headers={apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:"Bearer "+process.env.SUPABASE_SERVICE_ROLE_KEY,"Content-Type":"application/json",Prefer:"return=minimal"};
 async function patch(filter,values){const response=await fetch(base+filter,{method:"PATCH",headers,body:JSON.stringify(values)});return response.ok;}
 const paymentIntentOf=o=>typeof o.payment_intent==="string"?o.payment_intent:(o.payment_intent&&o.payment_intent.id)||null;

 // Checkout sessions carry the reservation id in their metadata.
 if(event.type==="checkout.session.completed"||event.type==="checkout.session.async_payment_succeeded"){
  const id=object.metadata&&object.metadata.reservation_id;
  if(id&&(event.type==="checkout.session.async_payment_succeeded"||object.payment_status==="paid")){
   const values={state:"paid",paid_at:new Date().toISOString()};
   const paymentIntent=paymentIntentOf(object);if(paymentIntent)values.stripe_payment_intent_id=paymentIntent;
   const filter="id=eq."+encodeURIComponent(id)+"&stripe_session_id=eq."+encodeURIComponent(object.id)+"&state=eq.held";
   let ok=await patch(filter,values);
   // Until docs/founding-refunds.sql has been run the payment id column does not exist; still mark the place paid.
   if(!ok&&values.stripe_payment_intent_id){delete values.stripe_payment_intent_id;ok=await patch(filter,values);}
   if(!ok)return res.status(500).end();
  }
  return res.status(200).json({received:true});
 }
 if(event.type==="checkout.session.expired"||event.type==="checkout.session.async_payment_failed"){
  const id=object.metadata&&object.metadata.reservation_id;
  if(id&&!await patch("id=eq."+encodeURIComponent(id)+"&stripe_session_id=eq."+encodeURIComponent(object.id)+"&state=eq.held",{state:"released"}))return res.status(500).end();
  return res.status(200).json({received:true});
 }
 // A full refund made anywhere (the owners' page or the Stripe dashboard) marks the reservation refunded, which frees the place.
 if(event.type==="charge.refunded"){
  const paymentIntent=paymentIntentOf(object);
  const fullyRefunded=object.refunded===true||(typeof object.amount_refunded==="number"&&object.amount_refunded>=object.amount);
  if(paymentIntent&&fullyRefunded){
   const values={state:"refunded",refunded_at:new Date().toISOString()};
   const refundId=object.refunds&&object.refunds.data&&object.refunds.data[0]&&object.refunds.data[0].id;if(refundId)values.stripe_refund_id=refundId;
   if(!await patch("stripe_payment_intent_id=eq."+encodeURIComponent(paymentIntent)+"&state=eq.paid",values))return res.status(500).end();
  }
  return res.status(200).json({received:true});
 }
 return res.status(200).json({received:true});
}
