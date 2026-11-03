import {latestWriter} from './lib/latest-writer';
import {withPositions,clearPositions} from './reader/positions';
import {normalizeData} from './lib/workspaces';
export const configured=true;
export const supabase=null;
const KEY='doorway-workspace-v2';
export const starter=normalizeData({books:[],projects:[],lectures:[],sessions:[],annotations:[],links:[],uploads:[],active:[],view:'library'});
export const id=()=>crypto.randomUUID();
let revision=0;let conflicted=false;
export function localRead(){try{return {...starter,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return {...starter}}}
export function localWrite(data){localStorage.setItem(KEY,JSON.stringify(data))}
async function checked(response){if(!response.ok){let v;try{v=await response.json()}catch{};throw new Error(v?.error||'Could not save. Check your connection and try again.')}return response.json()}
export async function cloudRead(){const result=await checked(await fetch('/api/workspace',{cache:'no-store'}));revision=result.revision;conflicted=false;clearPositions();return normalizeData(result.data||starter)}
const writeLatest=latestWriter(async data=>{if(conflicted)throw new Error('Reload to resolve changes from another device. Your edits are backed up in this browser.');data=withPositions(data);const body=JSON.stringify({data,revision});const response=await fetch('/api/workspace',{method:'PUT',headers:{'Content-Type':'application/json'},body,keepalive:body.length<60000});if(response.status===409)conflicted=true;const result=await checked(response);revision=result.revision;});
export function cloudWrite(_userId,data){data=withPositions(data);try{localWrite(data)}catch{}return writeLatest(data)}
export async function uploadFile(file,_userId,onProgress){
 if(file.size>512*1024*1024)throw new Error('Choose a file up to 512 MB.');if(!file.size)throw new Error('This file is empty.');
 if(/\.pdf$/i.test(file.name)){const start=await file.slice(0,1024).text();if(!start.includes('%PDF-'))throw new Error('This file is not a valid PDF. Try exporting it as PDF again.')}
 const chunk=8*1024*1024;
 if(file.size<=chunk)return checked(await fetch('/api/files',{method:'POST',headers:{'Content-Type':file.type||'application/octet-stream','X-File-Name':encodeURIComponent(file.name)},body:file}));
 const upload=await checked(await fetch('/api/uploads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:file.name,size:file.size,mime:file.type})}));
 const endpoint=`/api/uploads/${upload.path}?uploadId=${encodeURIComponent(upload.uploadId)}`;const parts=[];
 try{
 for(let offset=0;offset<file.size;offset+=chunk){const n=parts.length+1;let lastError;for(let attempt=0;attempt<3;attempt++){try{const part=await checked(await fetch(endpoint+'&part='+n,{method:'PUT',body:file.slice(offset,Math.min(file.size,offset+chunk))}));parts.push(part);lastError=null;break}catch(e){lastError=e;if(attempt<2)await new Promise(r=>setTimeout(r,500*(attempt+1)))}}if(lastError)throw lastError;onProgress?.(Math.round(Math.min(file.size,offset+chunk)/file.size*100))}
 const completed=await checked(await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({parts})}));return {...completed,name:file.name,mime:file.type};
 }catch(e){fetch(endpoint,{method:'DELETE'}).catch(()=>{});throw e}
}
export async function resolveFile(record){if(!record)return '';if(record.url){if(!/^(https?:|data:application\/pdf)/i.test(record.url))throw new Error('Use an HTTPS document URL');return record.url}return record.path?`/api/files/${encodeURIComponent(record.path)}`:''}
