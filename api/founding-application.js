// Founding Class application endpoint. Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.
// Create the applications table using the SQL in docs/founding-applications.sql.
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed'});}
 if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return res.status(503).json({error:'Applications are not configured yet. Please email info@mounirinstitute.com.'});
 const data=req.body||{};
 const base=process.env.SUPABASE_URL.replace(/\\/$/,'')+'/rest/v1/founding_applications';
 const headers={'apikey':process.env.SUPABASE_SERVICE_ROLE_KEY,'Authorization':'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY};
 async function duplicates(email,phone){const query=new URLSearchParams({select:'email,phone',or:`(email.eq.${email},phone.eq.${phone})`,limit:'5'});const response=await fetch(base+'?'+query,{headers});if(!response.ok)throw new Error('Duplicate lookup failed');const rows=await response.json();return {email:rows.some(x=>x.email===email),phone:rows.some(x=>x.phone===phone)};}
 if(data.action==='check_duplicates'){const email=String(data.email||'').trim().toLowerCase(),phone=String(data.phone||'').trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!/^\+[1-9]\d{7,14}$/.test(phone))return res.status(400).json({error:'Enter a valid email and phone number.'});try{return res.status(200).json(await duplicates(email,phone))}catch(e){return res.status(503).json({error:'Could not verify details. Please try again.'})}}

 if(data.website)return res.status(200).json({ok:true});
 const fields=['name','email','phone','region','age','goal','format','start'];
 for(const key of fields){if(typeof data[key]!=='string'||!data[key].trim()||data[key].length>500)return res.status(400).json({error:'Please complete all required fields.'});}
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))return res.status(400).json({error:'Please enter a valid email address.'});
 const record=Object.fromEntries(fields.map(k=>[k,data[k].trim()]));
 record.email=record.email.toLowerCase();record.status='requested';record.presale_interest=data.presale_interest===true;
 try{
  const dupe=await duplicates(record.email,record.phone);if(dupe.email||dupe.phone)return res.status(409).json({error:'These details are already registered.',duplicates:dupe});
  const url=base;
  const response=await fetch(url,{method:'POST',headers:{'apikey':process.env.SUPABASE_SERVICE_ROLE_KEY,'Authorization':'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json','Prefer':'return=representation'},body:JSON.stringify(record)});
  if(response.status===409)return res.status(409).json({error:'This email is already registered.',duplicates:{email:true,phone:false}});if(!response.ok){const detail=await response.text();console.error('Application persistence failed',response.status,detail.slice(0,1200));return res.status(502).json({error:'We could not save your request. Please try again, or email info@mounirinstitute.com if this continues.'});}
  const rows=await response.json();
  if(!rows.length)return res.status(409).json({error:'This email already has a request. Contact info@mounirinstitute.com if you need to update it.'});
  return res.status(201).json({ok:true,message:'Your request has been received. This is not a confirmed place; we will contact you with enrolment details.'});
 }catch(e){console.error('Application service unavailable');return res.status(502).json({error:'We could not save your request. Please try again.'});}
}
