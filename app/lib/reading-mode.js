export const SOLO_ID='__single_book__';
export function soloWorkspace(data,bookId){return {id:SOLO_ID,name:'Your book',panes:{},files:[],notes:'',layout:'tabs',...data.solo,focusedBookId:bookId,bookIds:[bookId]}}
export function openSingleBook(data,bookId){if(!data.books.some(b=>b.id===bookId&&b.status!=='dropped'))return data;return {...data,solo:{...data.solo,bookId},ui:{...data.ui,workspaceOpen:true,singleBookId:bookId}}}
export function putInWorkspace(data,bookId,workspaceId,newId){
 if(!data.books.some(b=>b.id===bookId&&b.status!=='dropped'))return data;
 const existing=data.workspaces.find(w=>w.id===workspaceId&&!w.archived);if(existing&&!existing.bookIds.includes(bookId)&&existing.bookIds.length>=6)throw Error('This workspace already has six books.');
 const ws=existing?{...existing,bookIds:[...new Set([...existing.bookIds,bookId])],focusedBookId:bookId,panes:{...existing.panes,[bookId]:data.solo?.panes?.[bookId]||existing.panes?.[bookId]}}:{id:newId,name:'Reading workspace',bookIds:[bookId],focusedBookId:bookId,panes:{[bookId]:data.solo?.panes?.[bookId]},notes:'',files:[],layout:'grid'};
 return {...data,workspaces:existing?data.workspaces.map(w=>w.id===existing.id?ws:w):[...data.workspaces,ws],workspaceId:ws.id,active:ws.bookIds,ui:{...data.ui,workspaceOpen:true,singleBookId:null}};
}
