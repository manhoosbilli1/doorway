import {latestWriter} from './latest-writer.js';
import {mergeWorkspace,sameValue} from './workspace-merge.js';
export function workspaceSync({read,write,onMerge=()=>{}}){
 let revision=0,base={};
 const writer=latestWriter(async item=>{let target=mergeWorkspace(item.base,item.data,base);
  for(let attempt=0;attempt<4;attempt++){
   try{const result=await write(target,revision);revision=result.revision;base=target;if(!sameValue(item.data,target))onMerge({before:item.data,saved:target});return}
   catch(error){if(error.status!==409||attempt===3)throw error;const latest=await read();revision=latest.revision;base=latest.data;target=mergeWorkspace(item.base,item.data,base)}
  }
 });
 return {async load(){const result=await read();revision=result.revision;base=result.data;return base},save(data){return writer({data,base})}};
}
