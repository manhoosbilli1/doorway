import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
const json = (v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
const readRow=(userId:string)=>env.DB!.prepare('SELECT data,revision FROM workspaces WHERE user_id=?').bind(userId).first<{data:string;revision:number}>();
const pointer=(data:any,userId:string)=>!Array.isArray(data?.books)&&data?.storage==='doorway-workspace-r2-v1'&&typeof data.key==='string'&&data.key.startsWith(`${userId}/workspace/`);
export async function GET() {
 const u=await getChatGPTUser(); if(!u)return json({error:'Sign in required'},401);
 // A concurrent save may retire an old object after the row was read; re-read its pointer.
 for(let attempt=0;attempt<3;attempt++){
  const row=await readRow(u.userId);if(!row)return json({data:null,revision:0});
  const stored=JSON.parse(row.data);if(!pointer(stored,u.userId))return json({data:stored,revision:row.revision});
  const blob=await env.BUCKET!.get(stored.key);if(blob)return json({data:await blob.json(),revision:row.revision});
 }
 return json({error:'Saved data could not be loaded. Please retry; your workspace has not been changed.'},503);
}
export async function PUT(request:Request) {
 const u=await getChatGPTUser(); if(!u)return json({error:'Sign in required'},401);
 if(request.headers.get('origin') && request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Invalid origin'},403);
 if(Number(request.headers.get('content-length'))>8_000_000)return json({error:'Workspace is too large. Export a backup before removing old annotations.'},413);
 const raw=await request.text();if(new TextEncoder().encode(raw).length>8_000_000)return json({error:'Workspace is too large. Export a backup before removing old annotations.'},413);
 let input:any;try{input=JSON.parse(raw)}catch{return json({error:'Invalid JSON'},400)}
 const {data,revision}=input;
 if(!data||!Array.isArray(data.books)||!Number.isInteger(revision)||revision<0)return json({error:'Invalid workspace'},400);
 const conflict=()=>json({error:'This workspace changed in another tab or device. Compatible changes will be merged; your changes are backed up in this browser.'},409);
 const prior=await readRow(u.userId);if((prior?.revision||0)!==revision)return conflict();
 const payload=JSON.stringify(data),at=new Date().toISOString(),old=prior?JSON.parse(prior.data):null;
 const oldKeys=pointer(old,u.userId)?[old.key,...(Array.isArray(old.previous)?old.previous:[]).filter((k:any)=>typeof k==='string'&&k.startsWith(`${u.userId}/workspace/`))]:[];
 let stored=payload,newKey:string|undefined;
 if(new TextEncoder().encode(payload).length>1_500_000){
  newKey=`${u.userId}/workspace/${crypto.randomUUID()}.json`;
  await env.BUCKET!.put(newKey,payload,{httpMetadata:{contentType:'application/json'}});
  stored=JSON.stringify({storage:'doorway-workspace-r2-v1',key:newKey,previous:oldKeys.slice(0,2)});
 }
 const result=revision===0
 ?await env.DB!.prepare('INSERT INTO workspaces(user_id,data,revision,updated_at) VALUES(?,?,1,?) ON CONFLICT(user_id) DO NOTHING').bind(u.userId,stored,at).run()
 :await env.DB!.prepare('UPDATE workspaces SET data=?,revision=revision+1,updated_at=? WHERE user_id=? AND revision=?').bind(stored,at,u.userId,revision).run();
 if(!result.meta.changes){if(newKey)await env.BUCKET!.delete(newKey).catch(()=>{});return conflict()}
 // Keep the preceding two large revisions for readers already in flight.
 const retired=newKey?oldKeys.slice(2):oldKeys;
 if(retired.length)await env.BUCKET!.delete(retired).catch(()=>{});
 return json({revision:revision+1});
}
