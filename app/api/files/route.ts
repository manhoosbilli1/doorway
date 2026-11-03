import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
const MAX=100*1024*1024;
export async function POST(request:Request){
 const u=await getChatGPTUser();if(!u)return Response.json({error:'Sign in required'},{status:401});
 if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return new Response('Forbidden',{status:403});
 const length=Number(request.headers.get('content-length')||0);if(length>MAX)return Response.json({error:'Maximum upload is 100 MB'},{status:413});
 let name:string,mime:string,body:ReadableStream;
 if(request.headers.has('x-file-name')){
  try{name=decodeURIComponent(request.headers.get('x-file-name')!)}catch{return new Response('Invalid filename',{status:400})}
  mime=request.headers.get('content-type')||'application/octet-stream';if(!request.body)return new Response('Empty file',{status:400});body=request.body;
 }else{
  // Backward compatibility for small clients using multipart form data.
  if(length>12*1024*1024)return Response.json({error:'Use the current uploader for files over 12 MB'},{status:413});
  let form;try{form=await request.formData()}catch{return new Response('Invalid upload',{status:400})}const file=form.get('file');if(!(file instanceof File))return new Response('Choose a file',{status:400});name=file.name;mime=file.type;body=file.stream();
 }
 if(name.length>500||! /\.(pdf|epub|docx?|tex|txt|png|jpe?g)$/i.test(name))return Response.json({error:'Supported files: PDF, EPUB, DOCX, DOC, TeX and TXT'},{status:400});
 const id=crypto.randomUUID();await env.BUCKET!.put(`${u.userId}/${id}`,body,{httpMetadata:{contentType:mime},customMetadata:{name}});
 return Response.json({path:id,name,mime},{headers:{'Cache-Control':'no-store'}});
}
