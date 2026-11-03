export function parseRange(header,size){
 if(!header)return null;const m=/^bytes=(\d*)-(\d*)$/.exec(header);if(!m||(!m[1]&&!m[2])||size===0)return false;
 let start,end;if(!m[1]){const suffix=Number(m[2]);if(!Number.isSafeInteger(suffix)||suffix<=0)return false;start=Math.max(0,size-suffix);end=size-1}else{start=Number(m[1]);end=m[2]?Math.min(Number(m[2]),size-1):size-1}
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start)return false;return {offset:start,length:end-start+1};
}
