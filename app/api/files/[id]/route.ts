import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../../chatgpt-auth';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
 const u=await getChatGPTUser();if(!u)return new Response('Sign in required',{status:401});
 const {id}=await params;if(!/^[a-f0-9-]{36}$/.test(id))return new Response('Not found',{status:404});
 const obj=await env.BUCKET!.get(`${u.userId}/${id}`,{range:request.headers});if(!obj)return new Response('Not found',{status:404});
 const name=obj.customMetadata?.name||'document';
 const headers=new Headers({'Content-Type':/\.pdf$/i.test(name)?'application/pdf':/\.docx$/i.test(name)?'application/vnd.openxmlformats-officedocument.wordprocessingml.document':'text/plain; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes','Content-Disposition':`inline; filename="${name.replace(/[^\w. -]/g,'_')}"`});
 let status=200;
 if(request.headers.has('range')&&obj.range&&'offset' in obj.range&&'length' in obj.range&&typeof obj.range.offset==='number'&&typeof obj.range.length==='number'){status=206;headers.set('Content-Range',`bytes ${obj.range.offset}-${obj.range.offset+obj.range.length-1}/${obj.size}`);headers.set('Content-Length',String(obj.range.length));}else headers.set('Content-Length',String(obj.size));
 return new Response(obj.body,{status,headers});
}
