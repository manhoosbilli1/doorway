import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
export async function POST(request:Request) {
 const u=await getChatGPTUser();if(!u)return Response.json({error:'Sign in required'},{status:401});
 if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return new Response('Forbidden',{status:403});
 const length=Number(request.headers.get('content-length')||0);if(length>100*1024*1024)return Response.json({error:'Maximum upload is 100 MB'},{status:413});
 const form=await request.formData();const file=form.get('file');
 if(!(file instanceof File)||file.size>100*1024*1024)return Response.json({error:'Choose a file up to 100 MB'},{status:400});
 if(!/\.(pdf|docx?|tex|txt)$/i.test(file.name))return Response.json({error:'Supported files: PDF, DOCX, DOC, TeX and TXT'},{status:400});
 const id=crypto.randomUUID();await env.BUCKET!.put(`${u.userId}/${id}`,file.stream(),{httpMetadata:{contentType:file.type||'application/octet-stream'},customMetadata:{name:file.name}});
 return Response.json({path:id,name:file.name,mime:file.type},{headers:{'Cache-Control':'no-store'}});
}
