// EPUB archives expand into memory; a large archive occupies both renderer slots.
let active=0;const waiting=[];const limit=2;
function grant(weight){active+=weight;let done=false;return ()=>{if(done)return;done=true;active-=weight;drain()}}
function drain(){while(waiting.length&&active+waiting[0].weight<=limit){const next=waiting.shift();next.signal?.removeEventListener('abort',next.abort);if(!next.signal?.aborted)next.resolve(grant(next.weight))}}
export function acquireEpubSlot(signal,weight=1){weight=weight>=2?2:1;if(signal?.aborted)return Promise.reject(new DOMException('Cancelled','AbortError'));if(!waiting.length&&active+weight<=limit)return Promise.resolve(grant(weight));return new Promise((resolve,reject)=>{const item={resolve,reject,signal,weight,abort:null};item.abort=()=>{const i=waiting.indexOf(item);if(i>=0)waiting.splice(i,1);reject(new DOMException('Cancelled','AbortError'));drain()};signal?.addEventListener('abort',item.abort,{once:true});waiting.push(item)})}
