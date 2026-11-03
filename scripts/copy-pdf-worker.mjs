import {createRequire} from 'node:module';
import {copyFileSync,mkdirSync} from 'node:fs';
const require=createRequire(import.meta.url);
const pdfRequire=createRequire(require.resolve('react-pdf'));
const worker=pdfRequire.resolve('pdfjs-dist/build/pdf.worker.min.mjs');
mkdirSync('public',{recursive:true});copyFileSync(worker,'public/pdf.worker.min.mjs');
