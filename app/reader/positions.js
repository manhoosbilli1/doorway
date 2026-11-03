const positions=new Map();
export function rememberPosition(workspaceId,bookId,value,pages){if(workspaceId)positions.set(workspaceId+':'+bookId,{workspaceId,bookId,value,pages})}
export function clearPositions(){positions.clear()}
export function withPositions(data){
 if(!positions.size||!data.workspaces)return data;
 const workspaces=data.workspaces.map(w=>{let panes=w.panes;for(const p of positions.values())if(p.workspaceId===w.id&&w.bookIds.includes(p.bookId))panes={...panes,[p.bookId]:p.value};return panes===w.panes?w:{...w,panes}});
 let books=data.books;for(const p of positions.values())if(p.workspaceId===data.workspaceId&&p.pages)books=books.map(b=>b.id===p.bookId?{...b,page:p.value.page,pages:p.pages,progress:Math.round(p.value.page/p.pages*100)}:b);
 return {...data,workspaces,books};
}
