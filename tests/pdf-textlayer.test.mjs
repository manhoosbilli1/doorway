// Exercises real PDF.js text-layer generation and DOM selection in jsdom.
// Layout rectangles are simulated; this is not a substitute for mouse/touch browser testing.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {createCanvas,DOMMatrix,ImageData,Path2D} from '@napi-rs/canvas';
import {selectionFromRange} from '../app/reader/selection.js';
test('a real book page produces selectable PDF.js text and a saved highlight geometry',{skip:!process.env.DOORWAY_TEST_BOOKS,timeout:30000},async()=>{
 const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://reader.test'});globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.getComputedStyle=dom.window.getComputedStyle;globalThis.DOMMatrix=DOMMatrix;globalThis.ImageData=ImageData;globalThis.Path2D=Path2D;Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
 dom.window.HTMLCanvasElement.prototype.getContext=function(type){if(type!=='2d')return null;const actual=createCanvas(10,10).getContext('2d'),node=this;return new Proxy(actual,{get(target,key){if(key==='canvas')return node;const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value},set(target,key,value){return Reflect.set(target,key,value,target)}})};
 const require=createRequire(import.meta.url),pdfRequire=createRequire(require.resolve('react-pdf'));const pdf=await import(pathToFileURL(pdfRequire.resolve('pdfjs-dist/legacy/build/pdf.mjs')));pdf.GlobalWorkerOptions.workerSrc=pathToFileURL(pdfRequire.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')).href;
 const dir=process.env.DOORWAY_TEST_BOOKS,names=await readdir(dir),name=names.find(n=>n.startsWith('Foundations of Geometry')&&n.endsWith('.pdf'));assert.ok(name,'Expected the authorized test PDF');const bytes=await readFile(path.join(dir,name));const task=pdf.getDocument({data:new Uint8Array(bytes),isEvalSupported:false});
 try{const doc=await task.promise,page=await doc.getPage(20),content=await page.getTextContent(),viewport=document.createElement('div'),wrapper=document.createElement('div'),layerNode=document.createElement('div');wrapper.className='virtual-page';wrapper.dataset.page='20';wrapper.getBoundingClientRect=()=>({left:0,top:0,right:500,bottom:700,width:500,height:700});layerNode.className='textLayer';viewport.append(wrapper);wrapper.append(layerNode);document.body.append(viewport);await new pdf.TextLayer({textContentSource:content,container:layerNode,viewport:page.getViewport({scale:1})}).render();const span=Array.from(layerNode.querySelectorAll('span')).find(n=>n.textContent.trim().length>2);assert.ok(span);const range=document.createRange();range.selectNodeContents(span);range.getClientRects=()=>[{left:20,top:40,right:120,bottom:55,width:100,height:15}];const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);const captured=selectionFromRange(selection,viewport);assert.equal(captured.page,20);assert.equal(captured.passage,span.textContent.trim());assert.equal(captured.rects[0].x,.04);assert.ok(captured.rects[0].w>0);selection.removeAllRanges();}finally{await task.destroy();dom.window.close()}
});
