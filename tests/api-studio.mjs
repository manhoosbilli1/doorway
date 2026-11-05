// Local authenticated API integration. Never sends data to the production site.
import assert from 'node:assert/strict';
const origin='http://127.0.0.1:5173';const login=await fetch(origin+'/signin-with-chatgpt?return_to=%2F',{redirect:'manual'});const cookie=login.headers.get('set-cookie').split(';')[0];
const api=(path,options={})=>fetch(origin+path,{...options,headers:{cookie,...options.headers}});
const read=async()=>{const r=await api('/api/workspace');assert.equal(r.status,200,await r.clone().text());return r.json()};
const write=(data,revision)=>api('/api/workspace',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({data,revision})});
const initial=await read();
try {
 const annotations=Array.from({length:150},(_,i)=>({id:'ink-'+i,kind:'ink',bookId:'a',page:i%30+1,color:'#315074',points:Array.from({length:800},(_,j)=>[j/800,.12345,.5])}));
 const data={books:[{id:'a',title:'Calculus',progress:42}],annotations,boardNotes:[{id:'todo',text:'Study vectors',due:'2026-11-10',x:.2,y:.3}],readingActivity:[{id:'r',bookId:'a',seconds:31,day:'2026-11-06'}],calculator:{expression:'sqrt(-1)'},shelves:{placements:{'book:a':{sectionId:'math',order:0}}}};
 assert.ok(JSON.stringify(data).length>2_000_000);
 let r=await write(data,initial.revision);assert.equal(r.status,200,await r.clone().text());let saved=await read();assert.deepEqual(saved.data,data);
 const concurrent=await Promise.all([write({...data,marker:'first'},saved.revision),write({...data,marker:'second'},saved.revision)]);assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,409]);saved=await read();assert.ok(['first','second'].includes(saved.data.marker));assert.equal(saved.data.annotations.length,150);
 for(let i=0;i<4;i++){r=await write({...data,marker:i},saved.revision);assert.equal(r.status,200);saved=await read();assert.equal(saved.data.marker,i)}
 for(const [name,mime] of [['screenshot.webp','image/webp'],['clip.mp4','video/mp4'],['clip.webm','video/webm'],['music.mp3','audio/mpeg'],['music.m4a','audio/mp4']]){
 const bytes=Buffer.from('PRIVATE MEDIA RANGE TEST '+name);r=await api('/api/files',{method:'POST',headers:{'x-file-name':encodeURIComponent(name),'content-type':mime},body:bytes});assert.equal(r.status,200,await r.clone().text());const file=await r.json();r=await api('/api/files/'+file.path,{headers:{range:'bytes=8-12'}});assert.equal(r.status,206);assert.equal(r.headers.get('content-type'),mime);assert.equal(await r.text(),bytes.subarray(8,13).toString());assert.equal(r.headers.get('accept-ranges'),'bytes');assert.equal((await fetch(origin+'/api/files/'+file.path)).status,401)
 }
 r=await write({books:[],annotations:[]},saved.revision);assert.equal(r.status,200);assert.deepEqual((await read()).data,{books:[],annotations:[]});
 console.log('PASS: >2 MB ink snapshot round-trip, concurrent revision protection, R2 revision retirement, whiteboard/time/calculator persistence, media MIME and byte ranges, private media authentication');
}finally{const saved=await read();const r=await write(initial.data||{books:[]},saved.revision);assert.equal(r.status,200)}
