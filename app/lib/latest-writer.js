// Serialize writes and replace waiting snapshots with the newest one.
export function latestWriter(write){let pending=null,running=false;
 async function run(){running=true;while(pending){const batch=pending;pending=null;try{await write(batch.value);batch.waiters.forEach(w=>w.resolve())}catch(error){batch.waiters.forEach(w=>w.reject(error))}}running=false}
 return value=>new Promise((resolve,reject)=>{if(pending){pending.value=value;pending.waiters.push({resolve,reject})}else pending={value,waiters:[{resolve,reject}]};if(!running)void run()});
}
