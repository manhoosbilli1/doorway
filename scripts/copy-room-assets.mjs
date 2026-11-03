import {readFileSync,writeFileSync,mkdirSync,readdirSync} from 'node:fs';
mkdirSync('public/room-assets',{recursive:true});
for(const name of readdirSync('assets/room').filter(n=>n.endsWith('.webp.b64')))writeFileSync('public/room-assets/'+name.slice(0,-4),Buffer.from(readFileSync('assets/room/'+name,'utf8'),'base64'));
