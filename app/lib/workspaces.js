const arrays=['books','projects','lectures','sessions','annotations','links','uploads','bookmarks','notes'];
const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
export function normalizeData(input={}){
 if(!object(input))input={};const data={...input};for(const key of arrays)data[key]=Array.isArray(input[key])?input[key].filter(object):[];
 data.books=data.books.filter(b=>typeof b.id==='string'&&b.id).map(b=>({...b,title:String(b.title||'Untitled book'),chapters:Array.isArray(b.chapters)?b.chapters.filter(object):[]}));
 const valid=new Set(data.books.filter(b=>b.status!=='dropped').map(b=>b.id));
 const normalize=(w,i)=>({...w,id:typeof w.id==='string'&&w.id?w.id:`workspace-${i}`,name:String(w.name||'Reading desk'),layout:['grid','columns','tabs'].includes(w.layout)?w.layout:'grid',bookIds:[...new Set(Array.isArray(w.bookIds)?w.bookIds:[])].filter(id=>valid.has(id)).slice(0,6),panes:object(w.panes)?w.panes:{},notes:typeof w.notes==='string'?w.notes:'',files:Array.isArray(w.files)?w.files.filter(object):[]});
 const source=Array.isArray(input.workspaces)?input.workspaces.filter(object):[];
 data.workspaces=(source.length?source:[{id:'default',name:'Reading desk',bookIds:Array.isArray(input.active)?input.active:[],panes:{}}]).map(normalize);
 if(!data.workspaces.some(w=>!w.archived))data.workspaces[0].archived=false;
 data.workspaceId=data.workspaces.some(w=>w.id===input.workspaceId&&!w.archived)?input.workspaceId:data.workspaces.find(w=>!w.archived).id;
 data.active=data.workspaces.find(w=>w.id===data.workspaceId).bookIds;
 return data;
}
export function mutateWorkspace(data,patch){const workspaces=data.workspaces.map(w=>w.id===data.workspaceId?{...w,...(typeof patch==='function'?patch(w):patch)}:w);return {...data,workspaces,active:workspaces.find(w=>w.id===data.workspaceId).bookIds}}
