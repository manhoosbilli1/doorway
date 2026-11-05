const plain=v=>v&&typeof v==='object'&&!Array.isArray(v);
export function sameValue(a,b){if(a===b)return true;if(Array.isArray(a)&&Array.isArray(b))return a.length===b.length&&a.every((v,i)=>sameValue(v,b[i]));if(plain(a)&&plain(b)){const keys=Object.keys(a);return keys.length===Object.keys(b).length&&keys.every(k=>Object.hasOwn(b,k)&&sameValue(a[k],b[k]))}return false}
const keyed=v=>Array.isArray(v)&&v.every(x=>plain(x)&&typeof x.id==='string')&&new Set(v.map(x=>x.id)).size===v.length;
const transient=path=>/^(ui|active|view|workspaceId|solo)(\/|$)/.test(path)||/^workspaces\/[^/]+\/(panes|focusedBookId|notesOpen)(\/|$)/.test(path)||/^books\/[^/]+\/(page|pages|progress|updatedAt)$/.test(path);
export function mergeWorkspace(base,local,remote,path=''){
 if(sameValue(local,base))return remote;if(sameValue(remote,base)||sameValue(local,remote))return local;
 if(transient(path))return local;
 if((base===undefined||plain(base))&&plain(local)&&plain(remote)){const out={};for(const key of new Set([...Object.keys(base||{}),...Object.keys(local),...Object.keys(remote)])){const value=mergeWorkspace(base?.[key],local[key],remote[key],path?path+'/'+key:key);if(value!==undefined)out[key]=value}return out}
 if((base===undefined||keyed(base))&&keyed(local)&&keyed(remote)){const old=new Map((base||[]).map(v=>[v.id,v])),left=new Map(local.map(v=>[v.id,v])),right=new Map(remote.map(v=>[v.id,v]));return [...new Set([...local.map(v=>v.id),...remote.map(v=>v.id)])].map(id=>mergeWorkspace(old.get(id),left.get(id),right.get(id),path+'/'+id)).filter(v=>v!==undefined)}
 const error=new Error('The same saved field changed in another tab or device. Your edits are backed up. Export your backup before reloading.');error.name='SyncConflictError';error.path=path;throw error;
}
