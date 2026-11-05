// Only the local mock identity is used; never production.
import assert from 'node:assert/strict';
import {workspaceSync} from '../app/lib/workspace-sync.js';
import {uploadFile} from '../app/lib/file-upload.js';
const origin='http://127.0.0.1:5173';const signin=await fetch(origin+'/signin-with-chatgpt?return_to=%2F',{redirect:'manual'});const cookie=signin.headers.get('set-cookie').split(';')[0],nativeFetch=fetch;
globalThis.fetch=(url,options={})=>nativeFetch(typeof url==='string'&&url.startsWith('/')?origin+url:url,{...options,headers:{cookie,...options.headers}});
const read=async()=>{const r=await fetch('/api/workspace');assert.equal(r.status,200);return r.json()};
const write=async(data,revision)=>{const r=await fetch('/api/workspace',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({data,revision})});const result=await r.json();if(!r.ok){const error=Error(result.error);error.status=r.status;throw error}return result};
const backup=await read();let small,large;
try{
 await write({books:[{id:'initial',title:'Already imported'}],notes:[{id:'n',markdown:'Original note'}],solo:{panes:{initial:{page:7}}}},backup.revision);
 const client=workspaceSync({read,write});const local=await client.load();const remote=await read();await write({...remote.data,notes:[{id:'n',markdown:'A thought from another device'}]},remote.revision);
 small=await uploadFile(new File(['%PDF-1.4\n% local import test'],'book.pdf',{type:'application/pdf'}));assert.ok(small.path);
 await client.save({...local,books:[...local.books,{id:'added',title:'New import',pdf:small}]});const recovered=await read();assert.equal(recovered.data.books.length,2);assert.equal(recovered.data.notes[0].markdown,'A thought from another device');assert.equal(recovered.data.solo.panes.initial.page,7);
 const progress=[];large=await uploadFile(new File(['%PDF-1.4\n',new Uint8Array(8*1024*1024+50)],'large.pdf',{type:'application/pdf'}),null,v=>progress.push(v));assert.equal(progress.at(-1),100);const head=await fetch('/api/files/'+large.path,{method:'HEAD'});assert.equal(Number(head.headers.get('content-length')),8*1024*1024+59);
 console.log('PASS: real API conflict recovery preserves remote notes, imported files, solo position, and multipart upload progress');
}finally{const current=await read();await write(backup.data||{books:[]},current.revision);globalThis.fetch=nativeFetch}
