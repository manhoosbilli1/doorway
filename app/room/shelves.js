import {inferGenre} from '../lib/book-organization.js';

export const SHELF_CAPACITY=16;
export const CABINET_SHELVES=10;
export const shelfKey=(kind,id)=>`${kind}:${id}`;
export function shelfEntries(data){
 const books=(data.books||[]).filter(b=>b.status!=='dropped');
 return [...books.map(b=>({...b,key:shelfKey('book',b.id),type:'book',sectionId:'genre:'+(b.genre&&!/^(general|uncategorized)$/i.test(b.genre)?b.genre:inferGenre(b,b.sourceName))})),
  ...(data.notes||[]).map(n=>({...n,title:n.title||'Untitled notebook',key:shelfKey('note',n.id),type:'note',sectionId:'notebooks'})),
  ...books.flatMap(b=>(b.chapters||[]).filter(c=>c.notes?.trim()||c.noteFile).map(c=>({...c,key:shelfKey('chapter',b.id+':'+c.id),type:'chapter',bookId:b.id,title:c.title+' · notes',author:b.title,sectionId:'notebooks'})))];
}
export function shelfSections(data){
 const entries=shelfEntries(data), placements=data.shelves?.placements||{};
 const sections=new Map();
 for(const s of data.shelves?.sections||[])if(s?.id&&typeof s.title==='string')sections.set(s.id,{...s,items:[]});
 for(const entry of entries){const place=placements[entry.key];const sectionId=place?.sectionId||entry.sectionId;
  if(!sections.has(sectionId))sections.set(sectionId,{id:sectionId,title:sectionId==='notebooks'?'Notebooks':sectionId.replace(/^genre:/,''),items:[]});
  sections.get(sectionId).items.push({...entry,sectionId,order:Number.isFinite(place?.order)?place.order:Infinity});
 }
 for(const section of sections.values())section.items.sort((a,b)=>a.order-b.order||a.title.localeCompare(b.title)||a.key.localeCompare(b.key));
 return [...sections.values()];
}
export function cabinetPages(sections,visibleKeys){
 const slots=[];
 for(const s of sections){const items=visibleKeys?s.items.filter(i=>visibleKeys.has(i.key)):s.items;if(visibleKeys&&!items.length)continue;
  for(let i=0;i<Math.max(1,items.length);i+=SHELF_CAPACITY)slots.push({...s,items:items.slice(i,i+SHELF_CAPACITY),part:i/SHELF_CAPACITY});
 }
 const pages=[];for(let i=0;i<Math.max(1,slots.length);i+=CABINET_SHELVES)pages.push(slots.slice(i,i+CABINET_SHELVES));return pages;
}
export function moveShelfEntry(data,key,sectionId,beforeKey){
 const sections=shelfSections(data),entry=sections.flatMap(s=>s.items).find(i=>i.key===key);
 const target=sections.find(s=>s.id===sectionId);if(!entry||!target||key===beforeKey)return data;
 const keys=target.items.filter(i=>i.key!==key).map(i=>i.key);const index=beforeKey?keys.indexOf(beforeKey):-1;keys.splice(index<0?keys.length:index,0,key);
 const placements={...data.shelves?.placements};keys.forEach((k,order)=>{placements[k]={sectionId,order}});
 return {...data,shelves:{...data.shelves,sections:sections.map(({id,title})=>({id,title})),placements}};
}
export function editShelfSection(data,id,title,direction=0){
 const sections=shelfSections(data).map(({id,title})=>({id,title}));const index=sections.findIndex(s=>s.id===id);
 if(index<0){if(title?.trim())sections.push({id,title:title.trim().slice(0,80)})}
 else {if(title?.trim())sections[index].title=title.trim().slice(0,80);const next=Math.max(0,Math.min(sections.length-1,index+direction));if(next!==index){const [section]=sections.splice(index,1);sections.splice(next,0,section)}}
 return {...data,shelves:{...data.shelves,sections}};
}
export function dropLibraryBook(data,id,reason){
 if(!reason?.trim())return data;
 return {...data,books:data.books.map(b=>b.id===id?{...b,status:'dropped',dropReason:reason.trim()}:b),active:(data.active||[]).filter(k=>k!==id),workspaces:(data.workspaces||[]).map(w=>({...w,bookIds:w.bookIds.filter(k=>k!==id),focusedBookId:w.focusedBookId===id?null:w.focusedBookId})),shelves:{...data.shelves,table:data.shelves?.table?.id===id?null:data.shelves?.table}};
}
export function spineColor(key){let hash=0;for(const ch of key)hash=(hash*31+ch.charCodeAt(0))|0;return ['#503128','#353e32','#4b392b','#2d363b','#523b2c','#42303a'][Math.abs(hash)%6]}
