// Component simulation only; this deliberately does not drive a browser.
import {test,before} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
import React from 'react';
import TestRenderer,{act} from 'react-test-renderer';
import {pathToFileURL} from 'node:url';
let ReaderPane,Workspace;
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
globalThis.window=new EventTarget();window.devicePixelRatio=2;window.getSelection=()=>null;
globalThis.document=new EventTarget();document.hidden=false;
globalThis.requestAnimationFrame=fn=>setTimeout(fn,0);globalThis.cancelAnimationFrame=clearTimeout;
globalThis.ResizeObserver=class{constructor(callback){this.callback=callback}observe(){this.callback([{contentRect:{width:500,height:700}}])}disconnect(){}};
before(async()=>{await mkdir('.sites-runtime/tests',{recursive:true});await build({stdin:{contents:"export {default as ReaderPane} from './app/reader/ReaderPane.jsx';export {default as Workspace} from './app/reader/Workspace.jsx';",resolveDir:process.cwd(),loader:'jsx'},bundle:true,platform:'node',format:'esm',packages:'external',external:['react','react/*'],outfile:'.sites-runtime/tests/components.mjs',loader:{'.css':'empty'},plugins:[{name:'mock-pdf-and-network',setup(b){b.onResolve({filter:/\.css$/},()=>({path:'empty',namespace:'empty'}));b.onLoad({filter:/.*/,namespace:'empty'},()=>({contents:''}));b.onResolve({filter:/^react-pdf$/},()=>({path:'pdf-mock',namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:`import React,{useEffect} from 'react';export const pdfjs={GlobalWorkerOptions:{}};export function Document({file,onLoadSuccess,children}){useEffect(()=>{onLoadSuccess({numPages:5000,getPage:async()=>({getViewport:()=>({width:600,height:800})})})},[file]);return React.createElement('document-mock',null,children)}export function Page({pageNumber,onLoadSuccess}){useEffect(()=>{onLoadSuccess({getViewport:()=>({width:600,height:pageNumber%7===0?400:800})})},[pageNumber]);return React.createElement('canvas-mock',{'data-page':pageNumber})}` }));b.onResolve({filter:/\/store$/},()=>({path:'store-mock',namespace:'store'}));b.onLoad({filter:/.*/,namespace:'store'},()=>({contents:"export async function resolveFile(record){return record?.url||'/api/files/test'}"}))}}]});({ReaderPane,Workspace}=await import(pathToFileURL(process.cwd()+'/.sites-runtime/tests/components.mjs').href))});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function nodeMock(element){if(element.props?.className?.includes('virtual-viewport'))return {scrollTop:0};return {}}
const find=(tree,name)=>tree.root.findAll(n=>n.type==='button'&&n.props['aria-label']===name)[0];
test('reader mounts a bounded page window, jumps to page 4999, and retains its zoom',async()=>{
 let tree;const saved=[];await act(async()=>{tree=TestRenderer.create(React.createElement(ReaderPane,{book:{id:'test',title:'Textbook',page:1,pdf:{url:'test.pdf'}},pane:{page:2500,offset:.25,zoom:1.2},onPosition:(...v)=>saved.push(v),onSticky(){},onHighlight(){}}),{createNodeMock:nodeMock});await sleep(20)});
 assert.ok(tree.root.findAllByType('canvas-mock').length<=8);let input=tree.root.findByProps({'aria-label':'Page number'});assert.equal(input.props.value,'2500');
 await act(async()=>{input.props.onChange({target:{value:'4999'}})});input=tree.root.findByProps({'aria-label':'Page number'});await act(async()=>{input.props.onKeyDown({key:'Enter',currentTarget:{blur(){}}});await sleep(20)});
 assert.equal(tree.root.findByProps({'aria-label':'Page number'}).props.value,'4999');assert.ok(tree.root.findAllByType('canvas-mock').some(n=>n.props['data-page']===4999));
 await act(async()=>{find(tree,'Zoom in').props.onClick()});assert.ok(saved.some(v=>v[1].zoom>1.2));
 await act(async()=>tree.unmount());
});
test('six PDFs still mount at most 48 pages, and all close cleanly',async()=>{
 let tree;await act(async()=>{tree=TestRenderer.create(React.createElement('main',null,...Array.from({length:6},(_,i)=>React.createElement(ReaderPane,{key:i,book:{id:String(i),title:'Book '+i,pdf:{url:'test'+i+'.pdf'}},onPosition(){},onSticky(){},onHighlight(){}}))),{createNodeMock:nodeMock});await sleep(30)});
 const pages=tree.root.findAllByType('canvas-mock').length;assert.ok(pages>=6&&pages<=48);await act(async()=>tree.unmount());
});
test('sticky notes stay on the page, can be edited, and can be moved by keyboard',async()=>{
 const patches=[];let tree;await act(async()=>{tree=TestRenderer.create(React.createElement(ReaderPane,{book:{id:'a',title:'Book',pdf:{url:'test.pdf'}},annotations:[{id:'note',kind:'sticky',page:1,text:'A connection',x:.2,y:.2}],onPosition(){},onSticky(){},onHighlight(){},onPatchAnnotation:(...p)=>patches.push(p),onDeleteAnnotation(){}}),{createNodeMock:nodeMock});await sleep(20)});
 const note=tree.root.findByProps({'aria-label':'Sticky note text'});assert.equal(note.props.value,'A connection');await act(async()=>note.props.onChange({target:{value:'Updated connection'}}));assert.deepEqual(patches[0],['note',{text:'Updated connection'}]);
 const handle=tree.root.findByProps({'aria-label':'Move sticky note'});await act(async()=>handle.props.onKeyDown({key:'ArrowRight',preventDefault(){}}));assert.ok(patches[1][1].x>.2);
 await act(async()=>tree.unmount());
});
test('sticky pointer capture records a bounded, movable page coordinate',async()=>{
 const patches=[];let tree;await act(async()=>{tree=TestRenderer.create(React.createElement(ReaderPane,{book:{id:'a',title:'Book',pdf:{url:'test.pdf'}},annotations:[{id:'note',kind:'sticky',page:1,text:'Move me',x:.1,y:.1}],onPosition(){},onSticky(){},onHighlight(){},onPatchAnnotation:(...p)=>patches.push(p),onDeleteAnnotation(){}}),{createNodeMock:nodeMock});await sleep(20)});
 const currentTarget={setPointerCapture(){},releasePointerCapture(){}};const e={target:{closest(){return null}},currentTarget,pointerId:1,clientX:50,clientY:50,preventDefault(){}};
 await act(async()=>tree.root.findByProps({'aria-label':'Move sticky note'}).props.onPointerDown(e));await act(async()=>tree.root.findByProps({'aria-label':'Move sticky note'}).props.onPointerMove({...e,clientX:10000,clientY:-1000}));await act(async()=>tree.root.findByProps({'aria-label':'Move sticky note'}).props.onPointerUp(e));assert.ok(patches[0][1].x<1);assert.equal(patches[0][1].y,0);await act(async()=>tree.unmount());
});
test('switching workspaces cannot save the old pane position into the new desk',async()=>{
 const base={books:[{id:'a',title:'Book',pdf:{url:'test.pdf'}}],annotations:[],workspaceId:'first',active:['a'],workspaces:[{id:'first',name:'First',bookIds:['a'],panes:{},notes:'old notes',files:[],layout:'grid'},{id:'second',name:'Second',bookIds:[],panes:{},notes:'new notes',files:[],layout:'grid'}]};let current=base;const update=fn=>{current=fn(current)};let tree;
 const props={onUpdate:update,onBack(){},onAdd(){},onTool(){},onUpload(){},onQuick(){},onEndSession(){},sync:'saved'};
 await act(async()=>{tree=TestRenderer.create(React.createElement(Workspace,{...props,data:current}),{createNodeMock:nodeMock});await sleep(20)});
 const reader=tree.root.findAll(n=>n.props.book?.id==='a'&&typeof n.props.onPosition==='function')[0];const onPosition=reader.props.onPosition;
 await act(async()=>tree.root.findByProps({'aria-label':'Current workspace'}).props.onChange({target:{value:'second'}}));assert.equal(current.workspaceId,'second');
 await act(async()=>onPosition('a',{page:230,offset:.4,zoom:1.3},5000));assert.equal(current.workspaces[0].panes.a.page,230);assert.equal(current.workspaces[1].panes.a,undefined);
 await act(async()=>tree.update(React.createElement(Workspace,{...props,data:current})));await act(async()=>tree.unmount());
});
