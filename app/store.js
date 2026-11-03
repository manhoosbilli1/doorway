export const configured=true;
export const supabase=null;
const KEY='doorway-workspace-v2';
export const starter={books:[],projects:[],lectures:[],sessions:[],annotations:[],links:[],uploads:[],active:[],view:'library'};
export const id=()=>crypto.randomUUID();
let revision=0;let queue=Promise.resolve();let conflicted=false;
export function localRead(){try{return {...starter,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return {...starter}}}
export function localWrite(data){localStorage.setItem(KEY,JSON.stringify(data))}
async function checked(response){if(!response.ok){let v;try{v=await response.json()}catch{};throw new Error(v?.error||'Could not save. Check your connection and try again.')}return response.json()}
export async function cloudRead(){const result=await checked(await fetch('/api/workspace',{cache:'no-store'}));revision=result.revision;conflicted=false;return {...starter,...(result.data||{})}}
export function cloudWrite(_userId,data){
 try{localWrite(data)}catch{}
 const task=async()=>{if(conflicted)throw new Error('Reload to resolve changes from another device. Your edits are backed up in this browser.');const response=await fetch('/api/workspace',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({data,revision}),keepalive:JSON.stringify(data).length<60000});if(response.status===409)conflicted=true;const result=await checked(response);revision=result.revision;};
 queue=queue.catch(()=>{}).then(task);return queue;
}
export async function uploadFile(file){const form=new FormData();form.append('file',file);return checked(await fetch('/api/files',{method:'POST',body:form}))}
export async function resolveFile(record){if(!record)return '';if(record.url){if(!/^(https?:|data:application\/pdf)/i.test(record.url))throw new Error('Use an HTTPS document URL');return record.url}return record.path?`/api/files/${encodeURIComponent(record.path)}`:''}
