import {clamp} from './geometry.js';
// Convert browser selection rectangles into page-relative geometry for stable saved highlights.
export function selectionFromRange(selection,viewport){
 if(!selection||!viewport||!selection.rangeCount)return null;const passage=selection.toString().trim();if(!passage||!viewport.contains(selection.anchorNode)||!viewport.contains(selection.focusNode))return null;
 let range;try{range=selection.getRangeAt(0)}catch{return null}const rects=Array.from(range.getClientRects()).filter(r=>r.width>1&&r.height>1);const segments=[];
 for(const element of viewport.querySelectorAll('.virtual-page[data-page]')){const page=Number(element.dataset.page),box=element.getBoundingClientRect();if(!page||box.width<=0||box.height<=0)continue;const selected=[];
 for(const r of rects){const left=Math.max(r.left,box.left),top=Math.max(r.top,box.top),right=Math.min(r.right,box.right),bottom=Math.min(r.bottom,box.bottom);if(right-left>1&&bottom-top>1)selected.push({x:clamp((left-box.left)/box.width,0,1),y:clamp((top-box.top)/box.height,0,1),w:clamp((right-left)/box.width,0,1),h:clamp((bottom-top)/box.height,0,1)});if(selected.length>=100)break}
 if(selected.length)segments.push({page,rects:selected});
 }
 segments.sort((a,b)=>a.page-b.page);if(!segments.length)return null;const discontinuous=segments.some((s,i)=>i>0&&s.page!==segments[i-1].page+1);if(discontinuous)return {error:'Select a shorter passage across adjacent visible pages.'};return {page:segments[0].page,passage,rects:segments[0].rects,segments};
}
export function highlightRects(annotation,page){if(Array.isArray(annotation.segments)&&annotation.segments.length)return annotation.segments.find(s=>Number(s.page)===Number(page))?.rects||[];return Number(annotation.page)===Number(page)?annotation.rects||[]:[]}
// Map a dragged area into normalized PDF page coordinates, regardless of zoom or drag direction.
export function rectangleFromDrag(start,end,box){
 if(!box||box.width<=0||box.height<=0)return null;const x1=clamp((start.x-box.left)/box.width,0,1),y1=clamp((start.y-box.top)/box.height,0,1),x2=clamp((end.x-box.left)/box.width,0,1),y2=clamp((end.y-box.top)/box.height,0,1);
 const x=Math.min(x1,x2),y=Math.min(y1,y2),w=Math.abs(x2-x1),h=Math.abs(y2-y1);if(w*box.width<3||h*box.height<3)return null;return {x,y,w,h};
}
