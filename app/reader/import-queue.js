import {boundedTask} from '../lib/async-task.js';
import {cleanTitle} from '../lib/metadata.js';
import {inferGenre,findDuplicateFile,refreshedMetadata,sourceKey} from '../lib/book-organization.js';
export const importFileKey=file=>sourceKey(file.name)+':'+file.size;
export async function importBooks(files,{known=[],recovery=[],upload,inspect,add,patch=()=>{},refresh=false,signal,onProgress=()=>{},onControl=()=>{},metadataTimeout=18000,uploadTimeout=900000,saveTimeout=35000,records=new Map(),shouldStop=()=>false}={}){
 const all=Array.from(files),supported=all.filter(f=>/\.(pdf|epub)$/i.test(f.name)),seen=new Set(),queue=[],active=new Map(),metadata=[],warnings=[],failures=[];
 let added=0,skipped=0,refreshed=0,processed=0,detailsDone=0,halted=false,metadataTail=Promise.resolve();const library=[...known];
 const report=()=>onProgress({total:supported.length,processed,added,skipped,detailsDone,detailsTotal:metadata.length,active:[...active.values()],failures:[...failures],warnings:[...warnings]});
 const detailJob=(file,book)=>{metadata.push(book.id);metadataTail=metadataTail.then(async()=>{if(signal?.aborted)return;const key='details:'+book.id;active.set(key,{key,name:file.name,stage:'Finding details',percent:null});report();try{const details=await boundedTask(s=>inspect(file,book.pdf,s),{signal,timeout:metadataTimeout,label:'Book details'});const change=refreshedMetadata(book,details,file);if(!signal?.aborted){patch(book.id,{...change,metadataPending:false});refreshed++}}catch(error){if(!signal?.aborted){patch(book.id,{metadataPending:false});warnings.push({name:file.name,error:'Uploaded safely; details can be retried later.'})}}finally{detailsDone++;active.delete(key);report()}})};
 for(const file of supported){const key=importFileKey(file);if(seen.has(key)){skipped++;processed++}else{seen.add(key);queue.push(file)}}
 onControl({skip:key=>active.get(key)?.controller?.abort(new DOMException('Skipped this file','AbortError'))});report();
 const worker=async()=>{for(;;){if(signal?.aborted||halted||shouldStop())break;const file=queue.shift();if(!file)break;const key=importFileKey(file),controller=new AbortController();const abort=()=>controller.abort(signal?.reason);signal?.addEventListener('abort',abort,{once:true});const state={key,name:file.name,stage:'Uploading',percent:0,controller};active.set(key,state);report();
 try{let duplicate=findDuplicateFile(file,library);if(duplicate&&duplicate.sourceSize==null&&duplicate.pdf?.path){try{const response=await boundedTask(s=>fetch('/api/files/'+encodeURIComponent(duplicate.pdf.path),{method:'HEAD',signal:s}),{signal:controller.signal,timeout:4000,label:'Checking existing book'});const size=response.headers.get('content-length');if(response.ok&&size!==null&&Number(size)!==file.size)duplicate=null}catch{}}
 if(duplicate){skipped++;if(refresh||duplicate.metadataPending)detailJob(file,duplicate);continue}
 let book=records.get(key);if(!book){const prior=findDuplicateFile(file,recovery);if(prior?.pdf?.path){state.stage='Checking previous upload';report();try{const head=await boundedTask(s=>fetch('/api/files/'+encodeURIComponent(prior.pdf.path),{method:'HEAD',signal:s}),{signal:controller.signal,timeout:4000,label:'Previous upload'});if(head.ok&&head.headers.get('content-length')!==null&&Number(head.headers.get('content-length'))===file.size)book={...prior}}catch{}}}
 if(!book){state.stage='Uploading';report();const record=await boundedTask(s=>upload(file,percent=>{state.percent=percent;report()},s),{signal:controller.signal,timeout:uploadTimeout,label:'Book upload'});const title=cleanTitle(file.name)||file.name,genre=inferGenre({title},file.webkitRelativePath||file.name);book={id:crypto.randomUUID(),title,author:'',domain:genre,genre,level:1,length:1,kind:'Foundational',status:'wishlist',rating:0,progress:0,pages:1,page:1,cover:'',chapters:[],endNote:'',dropReason:'',createdAt:new Date().toISOString(),metadataSource:'Filename',metadataPending:true,pdf:record,sourceName:file.name,sourceSize:file.size};records.set(key,book)}else records.set(key,book);
 state.stage='Saving to your library';state.percent=100;report();
 // Once the bytes arrive, commit the record even if the user pauses this batch.
 try{await boundedTask(()=>add(book),{timeout:saveTimeout,label:'Saving imported book'})}catch(error){halted=true;throw error}
 library.push(book);added++;records.delete(key);detailJob(file,book);
 }catch(error){if(!signal?.aborted)failures.push({name:file.name,error:error.message});}finally{processed++;active.delete(key);signal?.removeEventListener('abort',abort);report()}}
 };
 // Two upload streams; metadata is serial and never blocks the next upload.
 await Promise.all([worker(),worker()]);await metadataTail;
 return {added,skipped,refreshed,failures,warnings,skippedTypes:all.length-supported.length,stopped:signal?.aborted||queue.length>0,syncError:halted||shouldStop(),books:library};
}
