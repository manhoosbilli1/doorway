import {createRequire} from 'node:module';
import {copyFileSync,mkdirSync,cpSync,existsSync} from 'node:fs';
import path from 'node:path';
const require=createRequire(import.meta.url);
const pdfRequire=createRequire(require.resolve('react-pdf'));
const root=path.dirname(pdfRequire.resolve('pdfjs-dist/package.json'));
mkdirSync('public',{recursive:true});copyFileSync(path.join(root,'build/pdf.worker.min.mjs'),'public/pdf.worker.min.mjs');
for(const name of ['cmaps','standard_fonts','wasm','iccs'])if(existsSync(path.join(root,name)))cpSync(path.join(root,name),path.join('public/pdf-assets',name),{recursive:true});
