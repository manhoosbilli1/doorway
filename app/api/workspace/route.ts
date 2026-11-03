import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
const json = (v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
export async function GET() {
 const u=await getChatGPTUser(); if(!u)return json({error:'Sign in required'},401);
 const row=await env.DB!.prepare('SELECT data,revision FROM workspaces WHERE user_id=?').bind(u.userId).first<{data:string;revision:number}>();
 return json({data:row?JSON.parse(row.data):null,revision:row?.revision||0});
}
export async function PUT(request:Request) {
 const u=await getChatGPTUser(); if(!u)return json({error:'Sign in required'},401);
 if(request.headers.get('origin') && request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Invalid origin'},403);
 const raw=await request.text(); if(raw.length>8_000_000)return json({error:'Workspace is too large'},413);
 let input:any;try{input=JSON.parse(raw)}catch{return json({error:'Invalid JSON'},400)}
 const {data,revision}=input;
 if(!data||!Array.isArray(data.books)||!Number.isInteger(revision)||revision<0)return json({error:'Invalid workspace'},400);
 const payload=JSON.stringify(data);const at=new Date().toISOString();
 const result=revision===0
 ?await env.DB!.prepare('INSERT INTO workspaces(user_id,data,revision,updated_at) VALUES(?,?,1,?) ON CONFLICT(user_id) DO NOTHING').bind(u.userId,payload,at).run()
 :await env.DB!.prepare('UPDATE workspaces SET data=?,revision=revision+1,updated_at=? WHERE user_id=? AND revision=?').bind(payload,at,u.userId,revision).run();
 if(!result.meta.changes)return json({error:'This workspace changed in another tab or device. Reload to get the latest version. Your unsaved changes are backed up in this browser.'},409);
 return json({revision:revision+1});
}
