export const IDLE_MS=120000;
export function activeMilliseconds({from,to,lastInput,visible=true,focused=true,paused=false,idle=IDLE_MS}){if(!visible||!focused||paused||to<=from||to-from>15000)return 0;return Math.max(0,Math.min(to,lastInput+idle)-from)}
export function localDay(at){const d=new Date(at);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
export function splitActiveTime(from,milliseconds){const result=[];let start=from,left=milliseconds;while(left>0){const d=new Date(start),next=new Date(d.getFullYear(),d.getMonth(),d.getDate()+1).getTime(),amount=Math.min(left,next-start);result.push({day:localDay(start),seconds:amount/1000,at:new Date(start).toISOString()});left-=amount;start+=amount}return result}
export function readingSummary(data,at=Date.now(),days=7){
 const dates=Array.from({length:days},(_,i)=>{const d=new Date(at);d.setDate(d.getDate()-(days-1-i));return localDay(d)}),daily=Object.fromEntries(dates.map(d=>[d,0])),books=new Map(),genres=new Map();let seconds=0;
 for(const entry of data.readingActivity||[]){if(!dates.includes(entry.day)||!Number.isFinite(entry.seconds)||entry.seconds<0)continue;const book=data.books?.find(b=>b.id===entry.bookId),genre=entry.genre||book?.genre||'Uncategorized';daily[entry.day]+=entry.seconds;seconds+=entry.seconds;const row=books.get(entry.bookId)||{id:entry.bookId,title:book?.title||entry.bookTitle||'Book',seconds:0};row.seconds+=entry.seconds;books.set(entry.bookId,row);genres.set(genre,(genres.get(genre)||0)+entry.seconds)}
 return {dates,daily,seconds,books:[...books.values()].sort((a,b)=>b.seconds-a.seconds),genres:[...genres].sort((a,b)=>b[1]-a[1])};
}
export function timeLabel(seconds){const n=Math.max(0,Math.round(Number(seconds)||0)),h=Math.floor(n/3600),m=Math.floor(n%3600/60),s=n%60;return h?`${h}h ${m}m`:m?`${m}m ${s}s`:`${s}s`}
