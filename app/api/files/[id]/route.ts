import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../../chatgpt-auth';
import {parseRange} from '../../../lib/http-range';
async function serve(request:Request,{params}:{params:Promise<{id:string}>},head=false){
 const u=await getChatGPTUser();if(!u)return new Response('Sign in required',{status:401});
 const {id}=await params;if(!/^[a-f0-9-]{36}$/.test(id))return new Response('Not found',{status:404});
 const key=`${u.userId}/${id}`;const info=await env.BUCKET!.head(key);if(!info)return new Response('Not found',{status:404});
 const range=parseRange(request.headers.get('range'),info.size);if(range===false)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${info.size}`}});
 const name=info.customMetadata?.name||'document';
 const headers=new Headers({'Content-Type':/\.png$/i.test(name)?'image/png':/\.jpe?g$/i.test(name)?'image/jpeg':/\.pdf$/i.test(name)?'application/pdf':/\.docx$/i.test(name)?'application/vnd.openxmlformats-officedocument.wordprocessingml.document':'text/plain; charset=utf-8','Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes','ETag':info.httpEtag,'Content-Disposition':`inline; filename="${name.replace(/[^\w. -]/g,'_')}"`});
 if(range){headers.set('Content-Range',`bytes ${range.offset}-${range.offset+range.length-1}/${info.size}`);headers.set('Content-Length',String(range.length))}else headers.set('Content-Length',String(info.size));
 if(head)return new Response(null,{status:range?206:200,headers});
 const obj=await env.BUCKET!.get(key,range?{range}:undefined);if(!obj)return new Response('Not found',{status:404});
 return new Response(obj.body,{status:range?206:200,headers});
}
export const GET=(request:Request,context:{params:Promise<{id:string}>})=>serve(request,context);
export const HEAD=(request:Request,context:{params:Promise<{id:string}>})=>serve(request,context,true);
