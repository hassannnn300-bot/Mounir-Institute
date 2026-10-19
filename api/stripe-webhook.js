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
 const session=event.data?.object,id=session?.metadata?.reservation_id;
 if(!id)return res.status(200).json({received:true});
 const base=process.env.SUPABASE_URL.replace(/\/$/,"")+"/rest/v1/founding_reservations?id=eq."+encodeURIComponent(id)+"&stripe_session_id=eq."+encodeURIComponent(session.id)+"&state=eq.held";
 const headers={apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:"Bearer "+process.env.SUPABASE_SERVICE_ROLE_KEY,"Content-Type":"application/json",Prefer:"return=minimal"};
 let state=null;
 if(event.type==="checkout.session.completed"&&session.payment_status==="paid")state={state:"paid",paid_at:new Date().toISOString()};
 if(event.type==="checkout.session.async_payment_succeeded")state={state:"paid",paid_at:new Date().toISOString()};
 if(event.type==="checkout.session.expired"||event.type==="checkout.session.async_payment_failed")state={state:"released"};
 if(state){const response=await fetch(base,{method:"PATCH",headers,body:JSON.stringify(state)});if(!response.ok)return res.status(500).end();}
 return res.status(200).json({received:true});
}
