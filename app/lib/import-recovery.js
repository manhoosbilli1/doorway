// Recovery candidates remain local until their private file is verified for the signed-in user.
export function captureImportRecovery(storage,key,remote,previous=[]){
 const ids=new Set((remote.books||[]).map(b=>b.id));let local;try{local=JSON.parse(storage.getItem(key)||'null')}catch{}
 const candidates=[...previous,...(local?.books||[])].filter(b=>b?.id&&!ids.has(b.id)&&b.pdf?.path&&b.sourceName&&Number.isFinite(b.sourceSize));return [...new Map(candidates.map(b=>[b.id,b])).values()];
}
