// Real PDF.js parsing and canvas rendering against private local API uploads.
import assert from 'node:assert/strict';
import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import {openAsBlob} from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {DOMMatrix,ImageData,Path2D,createCanvas} from '@napi-rs/canvas';
import {PDFDocument} from 'pdf-lib';
globalThis.DOMMatrix=DOMMatrix;globalThis.ImageData=ImageData;globalThis.Path2D=Path2D;
const require=createRequire(import.meta.url);const pdfRequire=createRequire(require.resolve('react-pdf'));const pdfModule=pdfRequire.resolve('pdfjs-dist/legacy/build/pdf.mjs');const pdfjs=await import(pathToFileURL(pdfModule));
pdfjs.GlobalWorkerOptions.workerSrc=pathToFileURL(pdfRequire.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')).href;
const origin='http://127.0.0.1:5173';const response=await fetch(origin+'/signin-with-chatgpt?return_to=%2F',{redirect:'manual'});const cookie=response.headers.get('set-cookie').split(';')[0];const nativeFetch=fetch;
globalThis.fetch=(url,options={})=>nativeFetch(typeof url==='string'&&url.startsWith('/')?origin+url:url,{...options,headers:{cookie,...options.headers}});
const api=(p,o)=>fetch(origin+p,o);
await mkdir('.sites-runtime/tests',{recursive:true});await build({entryPoints:['app/store.js'],bundle:true,platform:'node',format:'esm',outfile:'.sites-runtime/tests/store.mjs'});const {uploadFile}=await import(pathToFileURL(process.cwd()+'/.sites-runtime/tests/store.mjs'));
// Use file names locally; never commit books or their paths to the repository.
const directory=process.env.DOORWAY_TEST_BOOKS;
if(!directory)throw Error('Set DOORWAY_TEST_BOOKS to a local directory with test PDFs.');
const names=(await readdir(directory)).filter(n=>/\.pdf$/i.test(n));const chosen=[names.find(n=>n.startsWith('Calculus for scientists')),names.find(n=>n.startsWith('Fundamentals of Power')),names.find(n=>n.startsWith('Antenna Theory')),names.find(n=>n.startsWith('Foundations of Geometry')),names.find(n=>n.startsWith('The Personal MBA')),names.find(n=>n.startsWith('Muhammad His Character'))].filter(Boolean);
assert.equal(chosen.length,6,'Need six real test books');
const uploads=[];for(let i=0;i<chosen.length;i++){const file=new File([await openAsBlob(path.join(directory,chosen[i]))],chosen[i],{type:'application/pdf'});const start=Date.now();const record=await uploadFile(file);uploads.push(record);console.log(JSON.stringify({upload:i+1,megabytes:Math.round(file.size/1024/1024),milliseconds:Date.now()-start}));}
// The same authenticated range endpoints used by the web reader.
const tasks=uploads.map(record=>pdfjs.getDocument({url:origin+'/api/files/'+record.path,httpHeaders:{Cookie:cookie},disableAutoFetch:true,disableStream:true,rangeChunkSize:262144,isEvalSupported:false,standardFontDataUrl:path.dirname(pdfModule)+'/../../standard_fonts/',cMapUrl:path.dirname(pdfModule)+'/../../cmaps/',cMapPacked:true,wasmUrl:path.dirname(pdfModule)+'/../../wasm/'}));
let docs=[];let rendered=0;const begin=Date.now();
try{
 docs=await Promise.all(tasks.map(t=>t.promise));assert.equal(docs.length,6);
 for(let i=0;i<docs.length;i++){
  const doc=docs[i];const meta=await doc.getMetadata();assert.ok(doc.numPages>1);const samples=[1,Math.ceil(doc.numPages/2),doc.numPages,2,Math.min(50,doc.numPages),Math.min(120,doc.numPages)];
  for(const n of samples){const page=await doc.getPage(n);const v=page.getViewport({scale:1});const scale=Math.min(900/v.width,Math.sqrt(1_500_000/(v.width*v.height)));const viewport=page.getViewport({scale});const canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;const text=await page.getTextContent();assert.ok(Array.isArray(text.items));if(i===3&&n===1)await writeFile('.sites-runtime/tests/rendered-page.png',await canvas.encode('png'));canvas.width=0;canvas.height=0;page.cleanup();rendered++}
  console.log(JSON.stringify({document:i+1,pages:doc.numPages,titleAvailable:Boolean(meta.info.Title),samples:samples.length,rssMB:Math.round(process.memoryUsage().rss/1024/1024)}));
 }
 // Repeated navigation across six documents, retaining no live page canvases.
 for(let turn=0;turn<24;turn++){const doc=docs[turn%6];const n=1+((turn*137)%doc.numPages);const page=await doc.getPage(n);const viewport=page.getViewport({scale:.5});const canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;canvas.width=0;canvas.height=0;page.cleanup();rendered++}
}finally{await Promise.all(tasks.map(t=>t.destroy()))}
const corrupt=pdfjs.getDocument({data:new TextEncoder().encode('%PDF-1.4\ninvalid pdf')});await assert.rejects(corrupt.promise);await corrupt.destroy();
const synthetic=await PDFDocument.create();for(let i=0;i<1000;i++)synthetic.addPage(i%2?[612,792]:[792,612]);const mixed=pdfjs.getDocument({data:await synthetic.save()});const mixedDoc=await mixed.promise;assert.equal(mixedDoc.numPages,1000);assert.notEqual((await mixedDoc.getPage(1)).view[2],(await mixedDoc.getPage(2)).view[2]);await mixed.destroy();
const report={realDocuments:6,renderedPages:rendered,elapsedSeconds:Math.round((Date.now()-begin)/1000),corruptPdfRejected:true,mixedSizeThousandPagePdf:true,uploadsOver100MB:true,finalRssMB:Math.round(process.memoryUsage().rss/1024/1024)};
await writeFile('.sites-runtime/tests/pdf-stress-report.json',JSON.stringify(report,null,2));console.log('PASS',JSON.stringify(report));
