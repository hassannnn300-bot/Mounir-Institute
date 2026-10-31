// How many people have each homepage plan, and the plans overall (total), on screen right now. Needs docs/live-viewers.sql run once in Supabase.
// Until then, or if Supabase is unreachable, it answers counts:null and the page shows nothing.
const VIEWER_ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const PLANS=['recorded','intensive','mastery'];
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed'});}
 let data=req.body||{};
 // navigator.sendBeacon (used when someone leaves) posts the JSON as plain text.
 if(typeof data==='string'){try{data=JSON.parse(data);}catch{data={};}}
 const id=String(data.id||'').toLowerCase();
 const plans=Array.isArray(data.plans)?[...new Set(data.plans)]:null;
 if(!VIEWER_ID.test(id)||!plans||!plans.every(p=>PLANS.includes(p)))return res.status(400).json({error:'Invalid viewer.'});
 if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return res.status(200).json({counts:null});
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 try{
  const response=await fetch(process.env.SUPABASE_URL.replace(/\/$/,'')+'/rest/v1/rpc/ping_live_viewer',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({p_viewer_id:id,p_plans:plans})});
  if(!response.ok){console.error('Live viewer count failed',response.status,(await response.text()).slice(0,300));return res.status(200).json({counts:null});}
  const rows=await response.json(),counts={};
  for(const p of [...PLANS,'total'])counts[p]=rows&&Number.isInteger(rows[p])?rows[p]:0;
  return res.status(200).json({counts});
 }catch{console.error('Live viewer service unavailable');return res.status(200).json({counts:null});}
}
