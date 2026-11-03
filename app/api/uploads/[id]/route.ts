import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../../chatgpt-auth';
async function authorize(request:Request,context:{params:Promise<{id:string}>}){
 const user=await getChatGPTUser();if(!user)return new Response('Sign in required',{status:401});
 if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return new Response('Forbidden',{status:403});
 const {id}=await context.params;const url=new URL(request.url);const uploadId=url.searchParams.get('uploadId');if(!/^[a-f0-9-]{36}$/.test(id)||!uploadId||uploadId.length>1000)return new Response('Invalid upload',{status:400});
 return {upload:env.BUCKET!.resumeMultipartUpload(`${user.userId}/${id}`,uploadId),url,key:`${user.userId}/${id}`};
}
export async function PUT(request:Request,context:{params:Promise<{id:string}>}){
 const auth=await authorize(request,context);if(auth instanceof Response)return auth;
 const part=Number(auth.url.searchParams.get('part'));if(!Number.isInteger(part)||part<1||part>64||!request.body||Number(request.headers.get('content-length'))>8*1024*1024)return new Response('Invalid part',{status:400});
 try{return Response.json(await auth.upload.uploadPart(part,request.body))}catch{return Response.json({error:'Upload interrupted. Please try again.'},{status:400})}
}
export async function POST(request:Request,context:{params:Promise<{id:string}>}){
 const auth=await authorize(request,context);if(auth instanceof Response)return auth;
 try{const raw=await request.text();if(raw.length>20000)return new Response('Too large',{status:413});const {parts}=JSON.parse(raw);if(!Array.isArray(parts)||parts.length<1||parts.length>64||parts.some((p,i)=>p.partNumber!==i+1||typeof p.etag!=='string'))return new Response('Invalid parts',{status:400});
 const obj=await auth.upload.complete(parts);return Response.json({path:auth.key.split('/').pop(),name:obj.customMetadata?.name,mime:obj.httpMetadata?.contentType});
 }catch{return Response.json({error:'Could not finish the upload. Please try again.'},{status:400})}
}
export async function DELETE(request:Request,context:{params:Promise<{id:string}>}){
 const auth=await authorize(request,context);if(auth instanceof Response)return auth;try{await auth.upload.abort()}catch{}return new Response(null,{status:204});
}
