export function backgroundEpubInfo(file,signal){return new Promise((resolve,reject)=>{
 if(signal?.aborted){reject(signal.reason);return}const worker=new Worker(new URL('./epub-metadata.worker.js',import.meta.url),{type:'module'});
 const done=()=>{worker.terminate();signal?.removeEventListener('abort',abort)};const abort=()=>{done();reject(signal.reason||new DOMException('Cancelled','AbortError'))};signal?.addEventListener('abort',abort,{once:true});
 worker.onmessage=event=>{if(event.data?.type!=='doorway-epub-metadata')return;done();event.data.error?reject(Error(event.data.error)):resolve(event.data.result)};worker.onerror=()=>{done();reject(Error('Could not read EPUB details'))};worker.postMessage(file);
})}
