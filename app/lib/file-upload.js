import {boundedTask,requestJSON} from './async-task.js';
export async function uploadFile(file,_userId,onProgress,{signal,timeout=120000}={}){
 if(file.size>512*1024*1024)throw Error('Choose a file up to 512 MB.');if(!file.size)throw Error('This file is empty.');
 if(/\.pdf$/i.test(file.name)){const start=await boundedTask(()=>file.slice(0,1024).text(),{signal,timeout:10000,label:'Reading file'});if(!start.includes('%PDF-'))throw Error('This file is not a valid PDF. Try exporting it as PDF again.')}
 const request=(url,options)=>requestJSON(url,options,{signal,timeout,label:'Upload'});
 const chunk=8*1024*1024;
 if(file.size<=chunk){const record=await request('/api/files',{method:'POST',headers:{'Content-Type':file.type||'application/octet-stream','X-File-Name':encodeURIComponent(file.name)},body:file});onProgress?.(100);return record}
 const upload=await request('/api/uploads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:file.name,size:file.size,mime:file.type})});
 const endpoint=`/api/uploads/${upload.path}?uploadId=${encodeURIComponent(upload.uploadId)}`;const parts=[];
 try{
 for(let offset=0;offset<file.size;offset+=chunk){const n=parts.length+1;let lastError;for(let attempt=0;attempt<3;attempt++){try{const part=await request(endpoint+'&part='+n,{method:'PUT',body:file.slice(offset,Math.min(file.size,offset+chunk))});parts.push(part);lastError=null;break}catch(e){lastError=e;if(signal?.aborted||e.status===401||e.status===403)throw e;if(attempt<2)await boundedTask(()=>new Promise(r=>setTimeout(r,400*(attempt+1))),{signal,timeout:1500})}}if(lastError)throw lastError;onProgress?.(Math.round(Math.min(file.size,offset+chunk)/file.size*100))}
 const completed=await request(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({parts})});return {...completed,name:file.name,mime:file.type};
 }catch(e){boundedTask(s=>fetch(endpoint,{method:'DELETE',signal:s}),{timeout:5000}).catch(()=>{});throw e}
}
