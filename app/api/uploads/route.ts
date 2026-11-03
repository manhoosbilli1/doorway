import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
export async function POST(request:Request){
 const user=await getChatGPTUser();if(!user)return new Response('Sign in required',{status:401});
 if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return new Response('Forbidden',{status:403});
 let input;try{const raw=await request.text();if(raw.length>2000)return new Response('Too large',{status:413});input=JSON.parse(raw)}catch{return new Response('Invalid JSON',{status:400})}
 const {name,size}=input;if(typeof name!=='string'||name.length>500||!/\.(pdf|epub|docx?|tex|txt|png|jpe?g)$/i.test(name)||!Number.isSafeInteger(size)||size<=0||size>512*1024*1024)return Response.json({error:'Choose a supported file up to 512 MB'},{status:400});
 const mime=typeof input.mime==='string'?input.mime.slice(0,100):'application/octet-stream';const id=crypto.randomUUID();
 const upload=await env.BUCKET!.createMultipartUpload(`${user.userId}/${id}`,{httpMetadata:{contentType:mime},customMetadata:{name,size:String(size)}});
 return Response.json({path:id,uploadId:upload.uploadId,name,mime});
}
