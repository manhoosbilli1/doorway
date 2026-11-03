export const GAP=16;
export function clamp(value,min,max){const n=Number(value);return Math.min(max,Math.max(min,Number.isFinite(n)?n:min))}
export function pageLayout(count,width,ratios={},fallback=1.4142){
 const offsets=new Float64Array(count+1);for(let i=0;i<count;i++)offsets[i+1]=offsets[i]+Math.max(80,width*clamp(ratios[i+1]||fallback,.2,6))+GAP;
 return offsets;
}
export function pageAt(offsets,scroll){let lo=0,hi=offsets.length-2;while(lo<hi){const m=Math.floor((lo+hi+1)/2);if(offsets[m]<=scroll)lo=m;else hi=m-1}return lo}
export function visiblePages(offsets,top,height,overscan=1){
 if(offsets.length<2)return [];const start=Math.max(0,pageAt(offsets,Math.max(0,top))-overscan);const end=Math.min(offsets.length-2,pageAt(offsets,top+height)+overscan,start+7);
 return Array.from({length:end-start+1},(_,i)=>start+i+1);
}
export function anchorAt(offsets,top){const index=pageAt(offsets,top);return {page:index+1,offset:clamp((top-offsets[index])/(offsets[index+1]-offsets[index]),0,1)}}
export function anchorTop(offsets,anchor){const i=clamp((anchor?.page||1)-1,0,offsets.length-2);return offsets[i]+clamp(anchor?.offset||0,0,1)*(offsets[i+1]-offsets[i])}
export function notePosition(x,y,width,height,noteWidth=190,noteHeight=130){return {x:clamp(x,0,Math.max(0,1-noteWidth/width)),y:clamp(y,0,Math.max(0,1-noteHeight/height))}}
export function pixelRatio(width,height,deviceRatio=1){return Math.min(Math.max(1,deviceRatio),1.5,Math.sqrt(1_500_000/Math.max(1,width*height)))}
