// Browser-selected files only. Walking folders does not request wider filesystem access.
export async function filesFromDrop(dataTransfer){
 const files=[];
 const walk=async(entry,path='')=>{if(!entry)return;if(entry.isFile){const file=await new Promise((resolve,reject)=>entry.file(resolve,reject));try{Object.defineProperty(file,'webkitRelativePath',{value:path+file.name,configurable:true})}catch{}files.push(file);return}if(entry.isDirectory){const reader=entry.createReader();for(;;){const batch=await new Promise((resolve,reject)=>reader.readEntries(resolve,reject));if(!batch.length)break;for(const child of batch)await walk(child,path+entry.name+'/')}}};
 const items=Array.from(dataTransfer.items||[]).filter(i=>i.kind==='file');
 // Snapshot entries synchronously; the browser protects DataTransfer after the drop handler returns.
 const entries=items.map(i=>({entry:i.webkitGetAsEntry?.(),file:i.getAsFile?.()}));
 const fallback=Array.from(dataTransfer.files||[]);
 if(entries.length){for(const item of entries)if(item.entry)await walk(item.entry);else if(item.file)files.push(item.file)}else files.push(...fallback);
 return files;
}
