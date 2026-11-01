// Recitation upload (1 November 2026). After an application is saved, the questionnaire sends the applicant's 30 to 90
// second recitation here first: this checks the application and returns a one-time Supabase Storage link, and the
// browser sends the audio straight to that link, so large files never pass through Vercel (its limit is 4.5 MB).
// Recordings are kept in the private "recitations" bucket, created here the first time it is needed, one file per
// application, named by date, name and application id (2026-11-01/ahmed-khan-<id>.webm). The owners listen to them in
// Supabase under Storage. Uses SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, like api/founding-application.js.
const BUCKET='recitations',MAX_BYTES=20*1024*1024;
const EXT={'audio/webm':'webm','audio/mp4':'m4a','audio/x-m4a':'m4a','audio/m4a':'m4a','audio/aac':'aac','audio/mpeg':'mp3','audio/mp3':'mp3','audio/wav':'wav','audio/x-wav':'wav','audio/wave':'wav','audio/ogg':'ogg','audio/x-caf':'caf','audio/3gpp':'3gp','audio/amr':'amr','audio/flac':'flac','audio/x-flac':'flac'};
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed'});}
 if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return res.status(503).json({error:'Recordings are not set up yet.'});
 const data=req.body||{};
 const id=String(data.application_id||''),email=String(data.email||'').trim().toLowerCase();
 const type=String(data.type||'').split(';')[0].trim().toLowerCase(),size=Number(data.size);
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({error:'Please submit your application again.'});
 if(!/^audio\/[a-z0-9.+-]+$/.test(type))return res.status(400).json({error:'Please choose an audio file, such as a voice memo.'});
 if(!(size>0&&size<=MAX_BYTES))return res.status(400).json({error:'That file is over 20 MB. Please choose a smaller recording.'});
 const base=process.env.SUPABASE_URL.replace(/\/$/,''),key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 const headers={'apikey':key,'Authorization':'Bearer '+key,'Content-Type':'application/json'};
 const failed=()=>res.status(502).json({error:'Your recitation didn’t send. Please try again.'});
 try{
  // Only for an application made in the last day with the same email address.
  const found=await fetch(base+'/rest/v1/founding_applications?select=id,name,created_at&id=eq.'+id+'&email=eq.'+encodeURIComponent(email),{headers});
  if(!found.ok){console.error('Recitation: application lookup failed',found.status,(await found.text()).slice(0,600));return failed();}
  const app=(await found.json())[0];
  if(!app||Date.now()-Date.parse(app.created_at)>24*3600*1000)return res.status(403).json({error:'Please submit your application again.'});
  const slug=String(app.name||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40)||'applicant';
  const path=String(app.created_at).slice(0,10)+'/'+slug+'-'+id+'.'+(EXT[type]||type.split('/')[1].replace(/[^a-z0-9]/g,'')||'audio');
  const sign=()=>fetch(base+'/storage/v1/object/upload/sign/'+BUCKET+'/'+path,{method:'POST',headers,body:'{}'});
  let signed=await sign();
  if(!signed.ok){
   const detail=await signed.text();
   if(!/bucket not found/i.test(detail)){console.error('Recitation: signing failed',signed.status,detail.slice(0,600));return failed();}
   const made=await fetch(base+'/storage/v1/bucket',{method:'POST',headers,body:JSON.stringify({id:BUCKET,name:BUCKET,public:false,file_size_limit:MAX_BYTES,allowed_mime_types:['audio/*']})});
   if(!made.ok&&!/already exists/i.test(await made.text())){console.error('Recitation: bucket could not be created',made.status);return failed();}
   signed=await sign();
   if(!signed.ok){console.error('Recitation: signing failed after creating the bucket',signed.status,(await signed.text()).slice(0,600));return failed();}
  }
  const link=(await signed.json()).url;
  if(!link)return failed();
  return res.status(200).json({upload_url:base+'/storage/v1'+link,path});
 }catch(e){console.error('Recitation service unavailable');return failed();}
}
