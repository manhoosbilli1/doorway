import {test} from 'node:test';
import assert from 'node:assert/strict';
import {importBooks} from '../app/reader/import-queue.js';
import {boundedTask} from '../app/lib/async-task.js';
import {workspaceSync} from '../app/lib/workspace-sync.js';
import {mergeWorkspace} from '../app/lib/workspace-merge.js';
import {uploadFile} from '../app/lib/file-upload.js';
import {openSingleBook,putInWorkspace,soloWorkspace,SOLO_ID} from '../app/lib/reading-mode.js';
import {normalizeData} from '../app/lib/workspaces.js';
import {rememberPosition,withPositions,clearPositions} from '../app/reader/positions.js';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const books=n=>Array.from({length:n},(_,i)=>({name:`book-${i+1}.pdf`,size:i+100}));
const inspect=async()=>({title:'Book',author:'Author',metadataSource:'PDF metadata'});
const copy=x=>structuredClone(x);

test('196 files finish despite a stalled 21st upload and stalled metadata, with at most two uploads',async()=>{
 let running=0,max=0;const saved=[],patched=[];
 const result=await importBooks(books(196),{uploadTimeout:25,metadataTimeout:10,upload:async(file,progress,signal)=>{running++;max=Math.max(max,running);if(file.name==='book-21.pdf')return new Promise((_,reject)=>signal.addEventListener('abort',()=>{running--;reject(signal.reason)}));await wait(1);running--;progress(100);return {path:file.name,name:file.name}},inspect:async(file)=>file.name==='book-5.pdf'?new Promise(()=>{}):inspect(),add:b=>saved.push(b),patch:(...v)=>patched.push(v)});
 assert.equal(max,2);assert.equal(result.added,195);assert.equal(result.failures.length,1);assert.match(result.failures[0].name,/21/);assert.equal(result.warnings.length,1);assert.ok(saved.some(b=>b.sourceName==='book-196.pdf'));assert.equal(patched.length,195);
});
test('a finished upload is committed before slow metadata and the next upload proceeds',async()=>{
 const order=[];let release;const gate=new Promise(r=>release=r);let metadataStarted=false;
 const run=importBooks(books(3),{upload:async f=>{order.push('upload:'+f.name);return {path:f.name}},add:b=>order.push('saved:'+b.sourceName),inspect:async()=>{metadataStarted=true;await gate;return {}},patch(){}});
 await wait(15);assert.ok(metadataStarted);assert.ok(order.includes('saved:book-3.pdf'));release();await run;
});
test('pause aborts active uploads promptly and preserves already saved books',async()=>{
 const controller=new AbortController();let starts=0;const saved=[];
 const result=await importBooks(books(10),{signal:controller.signal,upload:async(file,progress,signal)=>{if(++starts===1)return {path:file.name};return new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(signal.reason)))},add:b=>{saved.push(b);setTimeout(()=>controller.abort(),5)},inspect});
 assert.equal(result.added,1);assert.equal(result.stopped,true);assert.equal(saved.length,1);assert.ok(starts<=3);
});
test('retry after a failed save reuses uploaded bytes',async()=>{
 const records=new Map();let uploads=0;const options={records,upload:async()=>{uploads++;return {path:'safe'}},inspect};const first=await importBooks(books(1),{...options,add:()=>{throw Error('Offline')}});assert.equal(first.syncError,true);assert.equal(records.size,1);const second=await importBooks(books(1),{...options,add:()=>{}});assert.equal(second.added,1);assert.equal(uploads,1);assert.equal(records.size,0);
});
test('duplicate files and dropped records are skipped, while unfinished metadata can resume',async()=>{
 let uploads=0,lookups=0;const file=books(1)[0];const result=await importBooks([file,file],{known:[{id:'old',title:'Custom title',status:'dropped',pdf:{name:file.name},sourceSize:file.size,metadataPending:true}],upload:async()=>uploads++,add(){},inspect:async()=>{lookups++;return {}},patch(){}});assert.equal(result.skipped,2);assert.equal(uploads,0);assert.equal(lookups,1);
});
test('timeouts reject even when a dependency ignores cancellation',async()=>{await assert.rejects(boundedTask(()=>new Promise(()=>{}),{timeout:5,label:'Stalled read'}),{name:'TimeoutError'})});
test('single-request uploads are bounded and abort their fetch',async()=>{const prior=globalThis.fetch;let aborted=false;globalThis.fetch=(_url,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>{aborted=true;reject(signal.reason)}));try{await assert.rejects(uploadFile(new File(['%PDF-1.4'],'test.pdf'),null,()=>{},{timeout:5}),{name:'TimeoutError'});assert.equal(aborted,true)}finally{globalThis.fetch=prior}});
test('multipart retries are bounded and abort an unfinished upload after failure',async()=>{const prior=globalThis.fetch;let parts=0,cleanups=0;globalThis.fetch=async(url,options)=>{if(url==='/api/uploads')return Response.json({path:'path',uploadId:'id'});if(options.method==='DELETE'){cleanups++;return new Response(null,{status:204})}parts++;return new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(options.signal.reason)))};try{const file=new File(['%PDF-1.4',new Uint8Array(8*1024*1024)],'large.pdf');await assert.rejects(uploadFile(file,null,()=>{},{timeout:5}),{name:'TimeoutError'});assert.equal(parts,3);await wait(1);assert.equal(cleanups,1)}finally{globalThis.fetch=prior}});
function server(initial){let data=copy(initial),revision=1;return {read:async()=>({data:copy(data),revision}),write:async(next,expected)=>{if(expected!==revision){const e=Error('Conflict');e.status=409;throw e}data=copy(next);return {revision:++revision}},change:fn=>{data=fn(data);revision++},get:()=>data}}
test('a save conflict merges imported books with another device notes without losing either',async()=>{
 const remote=server({books:[{id:'a',title:'A'}],notes:[{id:'n',markdown:'old'}]});const merges=[];const client=workspaceSync({...remote,onMerge:d=>merges.push(d)});const local=await client.load();remote.change(d=>({...d,notes:[{id:'n',markdown:'remote thought'}]}));await client.save({...local,books:[...local.books,{id:'new',title:'Imported'}]});assert.equal(remote.get().books.length,2);assert.equal(remote.get().notes[0].markdown,'remote thought');assert.equal(merges.length,1);
});
test('pending old snapshots cannot remove remote records recovered by a previous save',async()=>{
 const remote=server({books:[],notes:[]});const client=workspaceSync(remote);const base=await client.load();remote.change(d=>({...d,notes:[{id:'remote',markdown:'Keep this'}]}));const a=client.save({...base,books:[{id:'a',title:'A'}]}),b=client.save({...base,books:[{id:'a',title:'A'},{id:'b',title:'B'}]});await Promise.all([a,b]);assert.equal(remote.get().books.length,2);assert.equal(remote.get().notes.length,1);
});
test('conflicting edits to the same note are preserved instead of silently overwritten',async()=>{
 const remote=server({books:[],notes:[{id:'n',markdown:'base'}]});const client=workspaceSync(remote);await client.load();remote.change(d=>({...d,notes:[{id:'n',markdown:'remote'}]}));await assert.rejects(client.save({books:[],notes:[{id:'n',markdown:'local'}]}),{name:'SyncConflictError'});assert.equal(remote.get().notes[0].markdown,'remote');
});
test('three-way merge respects independent deletions and field updates',()=>{
 const base={books:[{id:'a',title:'A',rating:1},{id:'b',title:'B'}]},local={books:[{id:'a',title:'A',rating:5}]},remote={books:[{id:'a',title:'Better title',rating:1},{id:'b',title:'B'}]};assert.deepEqual(mergeWorkspace(base,local,remote),{books:[{id:'a',title:'Better title',rating:5}]});assert.throws(()=>mergeWorkspace(base,{books:[]},{books:[{id:'a',title:'A',rating:5},{id:'b',title:'B'}]}),{name:'SyncConflictError'});
});
test('opening a shelf book never changes the saved multi-book workspace',()=>{
 const data=normalizeData({books:[{id:'a',title:'A'},{id:'b',title:'B'},{id:'c',title:'C'}],active:['a','b']});const opened=openSingleBook(data,'c');assert.deepEqual(opened.workspaces,data.workspaces);assert.deepEqual(opened.active,['a','b']);assert.equal(opened.ui.singleBookId,'c');assert.deepEqual(soloWorkspace(opened,'c').bookIds,['c']);
});
test('explicitly adding the first book creates a workspace and carries its saved page',()=>{
 const data=normalizeData({books:[{id:'a',title:'A'}],solo:{panes:{a:{page:42,offset:.2}}}});const next=putInWorkspace(data,'a',null,'new');assert.equal(next.workspaces.length,2);assert.deepEqual(next.active,['a']);assert.equal(next.workspaces[1].panes.a.page,42);assert.equal(next.ui.singleBookId,null);assert.deepEqual(data.active,[]);
});
test('single-book scroll snapshots survive reload without changing desk positions',()=>{
 clearPositions();const data=normalizeData({books:[{id:'a',title:'A'}],active:['a']});rememberPosition(SOLO_ID,'a',{page:29,offset:.7},100);const saved=withPositions(data);assert.equal(saved.solo.panes.a.page,29);assert.equal(saved.books[0].page,29);assert.equal(saved.workspaces[0].panes.a,undefined);clearPositions();
});
test('the latest reading position wins when switching repeatedly between solo and a workspace',()=>{
 clearPositions();const data=normalizeData({books:[{id:'a',title:'A'}],active:['a']});rememberPosition('default','a',{page:20},100);rememberPosition(SOLO_ID,'a',{page:40},100);rememberPosition('default','a',{page:60},100);assert.equal(withPositions(data).books[0].page,60);assert.equal(withPositions(data).solo.panes.a.page,40);clearPositions();
});
test('an interrupted import recovers already-uploaded private bytes after reload',async()=>{
 const prior=globalThis.fetch;let uploads=0,saved;globalThis.fetch=async()=>new Response(null,{status:200,headers:{'content-length':'100'}});
 try{const result=await importBooks(books(1),{recovery:[{id:'recovered',title:'My corrected title',sourceName:'book-1.pdf',sourceSize:100,pdf:{path:'owned-file',name:'book-1.pdf'},progress:22,rating:5}],upload:async()=>{uploads++},inspect,add:b=>{saved=b}});assert.equal(uploads,0);assert.equal(result.added,1);assert.equal(saved.id,'recovered');assert.equal(saved.progress,22);assert.equal(saved.rating,5)}finally{globalThis.fetch=prior}
});
test('recovery cannot reuse another account files or a differently sized upload',async()=>{
 const prior=globalThis.fetch;let uploads=0;try{for(const response of [()=>new Response(null,{status:404}),()=>new Response(null,{headers:{'content-length':'999'}})]){globalThis.fetch=async()=>response();const result=await importBooks(books(1),{recovery:[{id:'old',sourceName:'book-1.pdf',sourceSize:100,pdf:{path:'other-file'}}],upload:async()=>{uploads++;return {path:'new-file'}},inspect,add(){}});assert.equal(result.added,1)}assert.equal(uploads,2)}finally{globalThis.fetch=prior}
});
