import {captureImportRecovery} from './lib/import-recovery';
import {workspaceSync} from './lib/workspace-sync';
import {requestJSON} from './lib/async-task';
export {uploadFile} from './lib/file-upload';
import {withPositions,clearPositions} from './reader/positions';
import {normalizeData} from './lib/workspaces';
export const configured=true;
export const supabase=null;
const KEY='doorway-workspace-v2';
let recoveryBooks=[],recoveryKey='';
export const getImportRecoveryBooks=()=>recoveryBooks;
export const starter=normalizeData({books:[],projects:[],lectures:[],sessions:[],annotations:[],links:[],uploads:[],active:[],view:'library'});
export const id=()=>crypto.randomUUID();
export function localRead(){try{return {...starter,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return {...starter}}}
export function localWrite(data){localStorage.setItem(KEY,JSON.stringify(data))}
const syncClient=workspaceSync({
 read:async()=>{const result=await requestJSON('/api/workspace',{cache:'no-store'},{timeout:20000,label:'Loading saved data'});return {...result,data:normalizeData(result.data||starter)}},
 write:(data,revision)=>{const body=JSON.stringify({data,revision});return requestJSON('/api/workspace',{method:'PUT',headers:{'Content-Type':'application/json'},body,keepalive:body.length<60000},{timeout:30000,label:'Saving your library'})},
 onMerge:detail=>{if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('doorway-synced-data',{detail}))}
});
export async function cloudRead(userId){const data=await syncClient.load();clearPositions();try{recoveryKey=KEY+'-import-recovery-'+userId;let previous=JSON.parse(localStorage.getItem(recoveryKey)||'[]');recoveryBooks=captureImportRecovery(localStorage,KEY,data,Array.isArray(previous)?previous:[]);if(recoveryBooks.length){localStorage.setItem(recoveryKey,JSON.stringify(recoveryBooks));const backupKey=KEY+'-before-recovery-'+userId;if(!localStorage.getItem(backupKey))localStorage.setItem(backupKey,localStorage.getItem(KEY)||'{}')}}catch{}return data}
export function cloudWrite(_userId,data){data=withPositions(data);try{localWrite(data)}catch{}return syncClient.save(data).then(()=>{if(recoveryBooks.length){const saved=new Set(data.books.map(b=>b.id));recoveryBooks=recoveryBooks.filter(b=>!saved.has(b.id));try{localStorage.setItem(recoveryKey,JSON.stringify(recoveryBooks))}catch{}}})}
export async function resolveFile(record){if(!record)return '';if(record.url){if(!/^(https?:|data:application\/pdf)/i.test(record.url))throw new Error('Use an HTTPS document URL');return record.url}return record.path?`/api/files/${encodeURIComponent(record.path)}`:''}
