// Component simulation only; this deliberately does not drive a browser.
import {test,before} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
import React from 'react';
import TestRenderer,{act} from 'react-test-renderer';
import {pathToFileURL} from 'node:url';
let ReaderPane,Workspace,ReadingRitual,RoomLibrary,BookPanel,useRoomReturn,BulkImport,NotesDesk,EpubPane;
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
globalThis.window=new EventTarget();window.devicePixelRatio=2;window.getSelection=()=>null;
globalThis.document=new EventTarget();document.hidden=false;
globalThis.requestAnimationFrame=fn=>setTimeout(fn,0);globalThis.cancelAnimationFrame=clearTimeout;
globalThis.ResizeObserver=class{constructor(callback){this.callback=callback}observe(){this.callback([{contentRect:{width:500,height:700}}])}disconnect(){}};
before(async()=>{await mkdir('.sites-runtime/tests',{recursive:true});await build({stdin:{contents:"export {default as ReaderPane} from './app/reader/ReaderPane.jsx';export {default as Workspace} from './app/reader/Workspace.jsx';export {default as ReadingRitual} from './app/reader/ReadingRitual.jsx';export {default as RoomLibrary} from './app/room/RoomLibrary.jsx';export {default as BookPanel} from './app/room/BookPanel.jsx';export {default as useRoomReturn} from './app/room/useRoomReturn.js';export {default as BulkImport} from './app/reader/BulkImport.jsx';export {default as NotesDesk} from './app/notes/NotesDesk.jsx';export {default as EpubPane} from './app/reader/EpubPane.jsx';",resolveDir:process.cwd(),loader:'jsx'},bundle:true,platform:'node',format:'esm',packages:'external',external:['react','react/*'],outfile:'.sites-runtime/tests/components.mjs',loader:{'.css':'empty'},plugins:[{name:'mock-pdf-and-network',setup(b){b.onResolve({filter:/\.css$/},()=>({path:'empty',namespace:'empty'}));b.onLoad({filter:/.*/,namespace:'empty'},()=>({contents:''}));b.onResolve({filter:/\/epub-archive$/},()=>({path:'epub-archive',namespace:'epub-mock'}));b.onLoad({filter:/.*/,namespace:'epub-mock'},()=>({contents:"export async function openEpubArchive(){return {sections:[{},{},{}]}};export async function epubSection(a,n){return {html:'<p>Section '+(n+1)+'</p>',urls:[]}}"}));b.onResolve({filter:/\/book-import$/},()=>({path:'book-import',namespace:'metadata-mock'}));b.onResolve({filter:/\/epub-import$/},()=>({path:'epub-import',namespace:'metadata-mock'}));b.onLoad({filter:/.*/,namespace:'metadata-mock'},()=>({contents:"export async function inspectBook(record,name){return {title:name.replace(/\\.pdf$/i,''),author:'Author',pages:50,metadataSource:'PDF metadata'}};export async function inspectEpub(file){return {title:file.name.replace(/\\.epub$/i,''),author:'Author',pages:10,metadataSource:'EPUB metadata'}}"}));b.onResolve({filter:/\/MarkdownEditor$/},()=>({path:'markdown-mock',namespace:'markdown'}));b.onLoad({filter:/.*/,namespace:'markdown'},()=>({contents:"import React from 'react';export default function Editor(){return React.createElement('div',null,'Editor')}"}));b.onResolve({filter:/^react-pdf$/},()=>({path:'pdf-mock',namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:`import React,{useEffect} from 'react';export const pdfjs={GlobalWorkerOptions:{}};export function Document({file,onLoadSuccess,children}){useEffect(()=>{onLoadSuccess({numPages:5000,getPage:async()=>({getViewport:()=>({width:600,height:800})})})},[file]);return React.createElement('document-mock',null,children)}export function Page({pageNumber,onLoadSuccess,onGetTextSuccess}){useEffect(()=>{onLoadSuccess({getViewport:()=>({width:600,height:pageNumber%7===0?400:800})});onGetTextSuccess?.({items:pageNumber===7?[]:[{str:'Readable text'}]})},[pageNumber]);return React.createElement('canvas-mock',{'data-page':pageNumber})}` }));b.onResolve({filter:/\/store$/},()=>({path:'store-mock',namespace:'store'}));b.onLoad({filter:/.*/,namespace:'store'},()=>({contents:"export async function resolveFile(record){return record?.url||'/api/files/test'}"}))}}]});({ReaderPane,Workspace,ReadingRitual,RoomLibrary,BookPanel,useRoomReturn,BulkImport,NotesDesk,EpubPane}=await import(pathToFileURL(process.cwd()+'/.sites-runtime/tests/components.mjs').href))});
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

test('reading companion opens by touch, exposes settings, and closes without leaving controls active',async()=>{
 let tree;const settings=[];await act(async()=>{tree=TestRenderer.create(React.createElement(ReadingRitual,{ambient:true,motion:true,aperture:48,onSetting:v=>settings.push(v),onAdd(){},onNotes(){},onTool(){},onBack(){}}),{createNodeMock:nodeMock})});
 assert.equal(tree.root.findByProps({className:'ritual-pages'}).props.inert,true);
 await act(async()=>find(tree,'Open reading companion').props.onClick());assert.equal(tree.root.findByProps({className:'ritual-pages'}).props.inert,false);
 await act(async()=>tree.root.findByProps({'aria-label':'Pool of light size'}).props.onChange({target:{value:'65'}}));assert.deepEqual(settings[0],{aperture:65});
 await act(async()=>find(tree,'Keep reading companion open').props.onClick());assert.equal(find(tree,'Keep reading companion open').props['aria-pressed'],true);
 await act(async()=>find(tree,'Close reading companion').props.onClick());assert.equal(tree.root.findByProps({className:'ritual-pages'}).props.inert,true);await act(async()=>tree.unmount());
});
test('pointer lighting coalesces updates without remounting PDF pages',async()=>{
 const writes=[];let tree;await act(async()=>{tree=TestRenderer.create(React.createElement(ReaderPane,{book:{id:'light',title:'Book',pdf:{url:'light.pdf'}},onPosition(){},onSticky(){},onHighlight(){}}),{createNodeMock:e=>e.type==='section'?{getBoundingClientRect:()=>({left:0,top:0,width:500,height:700}),style:{setProperty:(...v)=>writes.push(v)}}:nodeMock(e)});await sleep(20)});
 const pages=tree.root.findAllByType('canvas-mock');const pane=tree.root.findByType('section');
 await act(async()=>{for(let i=0;i<30;i++)pane.props.onPointerMove({pointerType:'mouse',clientX:250,clientY:350});await sleep(10)});
 assert.deepEqual(writes,[['--light-x','50%'],['--light-y','50%']]);assert.equal(tree.root.findAllByType('canvas-mock')[0],pages[0]);
 await act(async()=>pane.props.onPointerMove({pointerType:'touch',clientX:10,clientY:10}));assert.equal(writes.length,2);await act(async()=>tree.unmount());
});

test('the oak shelf groups books and opens the selected title directly',async()=>{
 let tree;const reads=[];await act(async()=>{tree=TestRenderer.create(React.createElement(RoomLibrary,{books:[{id:'a',title:'Calculus',author:'One',level:1},{id:'b',title:'RFID Handbook',author:'Two',level:2}],filter:'library',onRead:id=>reads.push(id),onEdit(){},onChapters(){},onAdd(){},onResume(){},hasWorkspace:false,minutes:70}))});
 assert.ok(tree.root.findByProps({'aria-label':'Mathematics bookshelf, scroll sideways for more books'}));assert.ok(tree.root.findByProps({'aria-label':'Electrical Engineering bookshelf, scroll sideways for more books'}));await act(async()=>find(tree,'Open RFID Handbook').props.onClick());assert.deepEqual(reads,['b']);await act(async()=>tree.unmount());
});
test('book panels have distinct control IDs and close after the pointer leaves',async()=>{
 let tree;await act(async()=>{tree=TestRenderer.create(React.createElement('main',null,React.createElement(BookPanel,{title:'Atlas'},'A'),React.createElement(BookPanel,{title:'Housekeeping'},'B')),{createNodeMock:()=>({contains:()=>false})})});
 const buttons=tree.root.findAll(n=>n.type==='button'&&n.props['aria-controls']);assert.notEqual(buttons[0].props['aria-controls'],buttons[1].props['aria-controls']);
 const panel=tree.root.findAllByType('aside')[0];await act(async()=>{panel.props.onFocus({target:{getAttribute:()=>'book-panel-id'}});find(tree,'Open atlas').props.onClick()});assert.equal(find(tree,'Open atlas').props['aria-expanded'],true);await act(async()=>find(tree,'Close atlas').props.onClick());await act(async()=>panel.props.onPointerEnter({pointerType:'mouse'}));assert.equal(find(tree,'Open atlas').props['aria-expanded'],true);
 await act(async()=>{panel.props.onPointerLeave();await sleep(650)});assert.equal(find(tree,'Open atlas').props['aria-expanded'],false);await act(async()=>tree.unmount());
});
test('return to the room commits a close once and respects reduced motion',async()=>{
 let api,tree;const events=[];window.matchMedia=()=>({matches:true});function Harness(){api=useRoomReturn(()=>events.push('room'));return null}
 await act(async()=>{tree=TestRenderer.create(React.createElement(Harness))});await act(async()=>{api.begin(()=>events.push('closed'),'Book');api.begin(()=>events.push('duplicate'),'Book');await sleep(15)});assert.deepEqual(events,['closed','room']);assert.equal(api.transition.phase,'returning');await act(async()=>{await sleep(90)});assert.equal(api.transition,null);await act(async()=>tree.unmount());delete window.matchMedia;
});

test('saved PDF bookmarks fold pages, toggle, and jump to the saved page',async()=>{
 const marks=[{id:'a',bookId:'book',page:1},{id:'b',bookId:'book',page:42}],toggles=[];let tree;await act(async()=>{tree=TestRenderer.create(React.createElement(ReaderPane,{book:{id:'book',title:'Book',pdf:{url:'test.pdf'}},bookmarks:marks,onToggleBookmark:(...v)=>toggles.push(v),onPosition(){},onSticky(){},onHighlight(){}}),{createNodeMock:nodeMock});await sleep(25)});
 assert.ok(tree.root.findByProps({'aria-label':'Bookmarked page 1'}));await act(async()=>find(tree,'Remove bookmark').props.onClick());assert.deepEqual(toggles[0],['book',{page:1}]);
 const jump=tree.root.findAll(n=>n.type==='button'&&n.children?.join('')==='Page 42')[0];await act(async()=>jump.props.onClick());assert.equal(tree.root.findByProps({'aria-label':'Page number'}).props.value,'42');await act(async()=>tree.unmount());
});
test('only the book under the pointer retains its pool of light',async()=>{
 const data={books:[{id:'a',title:'A',pdf:{url:'a.pdf'}},{id:'b',title:'B',pdf:{url:'b.pdf'}}],annotations:[],bookmarks:[],notes:[],workspaceId:'desk',active:['a','b'],workspaces:[{id:'desk',name:'Desk',bookIds:['a','b'],panes:{},notes:'',files:[],layout:'grid'}]};let tree;const props={data,onUpdate(){},onBack(){},onAdd(){},onTool(){},onUpload(){},onQuick(){},onEndSession(){},sync:'saved'};
 await act(async()=>{tree=TestRenderer.create(React.createElement(Workspace,props),{createNodeMock:nodeMock});await sleep(20)});const paneA=()=>tree.root.findByProps({'data-book-id':'a'});const paneB=()=>tree.root.findByProps({'data-book-id':'b'});assert.match(paneA().props.className,/illuminated/);assert.doesNotMatch(paneB().props.className,/illuminated/);
 await act(async()=>paneB().props.onPointerEnter());assert.doesNotMatch(paneA().props.className,/illuminated/);assert.match(paneB().props.className,/illuminated/);await act(async()=>tree.unmount());
});
test('folder import skips repeated source files and preserves existing book fields',async()=>{
 const added=[],patched=[],busy=[];const existing={id:'old',title:'Calculus',metadataSource:'Filename',author:'',rating:5,pdf:{name:'calculus.pdf',path:'old'}};let tree;
 await act(async()=>{tree=TestRenderer.create(React.createElement(BulkImport,{books:[existing],onUpload:async f=>({name:f.name,path:f.name}),onAdd:b=>added.push(b),onPatch:(id,v)=>patched.push([id,v]),onBusy:v=>busy.push(v),onClose(){}}))});
 const files=[{name:'calculus.pdf',size:5},{name:'RFID handbook.pdf',size:10},{name:'RFID handbook.pdf',size:10},{name:'sample.epub',size:20},{name:'ignore.zip',size:1}];const input=tree.root.findByProps({'aria-label':'Choose Books folder'});
 await act(async()=>{input.props.onChange({target:{files,value:'x'}});await sleep(20)});assert.equal(added.length,2);assert.deepEqual(busy,[true,false]);assert.equal(existing.rating,5);assert.equal(existing.sourceSize,undefined);assert.ok(patched.some(([id,v])=>id==='old'&&v.sourceSize===5));assert.ok(added.some(b=>b.genre==='Electrical Engineering'));await act(async()=>tree.unmount());
});

test('EPUB section navigation saves location and releases its slot on close',async()=>{
 const nativeFetch=globalThis.fetch;globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(3)});let tree;const saves=[];try{await act(async()=>{tree=TestRenderer.create(React.createElement(EpubPane,{book:{id:'epub',title:'EPUB',pdf:{url:'test.epub'}},workspaceId:'desk',onPosition:(...v)=>saves.push(v),onExit(){},onFocus(){},onIlluminate(){}}),{createNodeMock:e=>e.type==='section'?{style:{setProperty(){}}}:e.props?.className==='epub-document'?{scrollHeight:1000,clientHeight:500,scrollTop:0}:{}});await sleep(40)});assert.match(tree.root.findByProps({'aria-label':'EPUB text: EPUB'}).props.dangerouslySetInnerHTML.__html,/Section 1/);
 const next=tree.root.findAll(n=>n.type==='button'&&n.children?.join('').includes('Next'))[0];await act(async()=>{next.props.onClick();await sleep(20)});assert.match(tree.root.findByProps({'aria-label':'EPUB text: EPUB'}).props.dangerouslySetInnerHTML.__html,/Section 2/);await act(async()=>tree.unmount());assert.ok(saves.some(v=>v[1].page===2));}finally{globalThis.fetch=nativeFetch}
});
test('a sync conflict stops folder import before another upload',async()=>{
 let tree,uploads=0;await act(async()=>{tree=TestRenderer.create(React.createElement(BulkImport,{books:[],sync:'error',onUpload:async()=>{uploads++;return {}},onAdd(){},onPatch(){},onBusy(){},onClose(){}}))});const input=tree.root.findByProps({'aria-label':'Choose Books folder'});await act(async()=>{input.props.onChange({target:{files:[{name:'test.pdf',size:4}],value:'x'}});await sleep(10)});assert.equal(uploads,0);assert.match(tree.root.findByProps({role:'status'}).children.join(''),/could not sync/);await act(async()=>tree.unmount());
});
test('opening a shelf book runs once and completes without motion when requested',async()=>{
 let api,tree;const actions=[];window.matchMedia=()=>({matches:true});function Harness(){api=useRoomReturn(()=>{});return null}await act(async()=>{tree=TestRenderer.create(React.createElement(Harness))});await act(async()=>{api.beginOpen(()=>actions.push('opened'),'Book');api.beginOpen(()=>actions.push('duplicate'),'Book');await sleep(10)});assert.deepEqual(actions,['opened']);assert.equal(api.transition.phase,'entering');await act(async()=>{await sleep(90)});assert.equal(api.transition,null);await act(async()=>tree.unmount());delete window.matchMedia;
});
test('a page-linked note keeps its book, page, and Markdown content',async()=>{
 let current={books:[{id:'a',title:'Book A'}],notes:[]},tree;const target={bookId:'a',page:42,token:'one'};const update=fn=>{current=fn(current)};
 await act(async()=>{tree=TestRenderer.create(React.createElement(NotesDesk,{data:current,onUpdate:update,target}));await sleep(10)});assert.equal(current.notes.length,1);assert.equal(current.notes[0].bookId,'a');assert.equal(current.notes[0].page,42);
 await act(async()=>{tree.update(React.createElement(NotesDesk,{data:current,onUpdate:update,target}));await sleep(10)});const editor=tree.root.findAll(n=>n.props.id===current.notes[0].id&&typeof n.props.onChange==='function')[0];assert.ok(editor);await act(async()=>editor.props.onChange('A **linked** thought.'));assert.equal(current.notes[0].markdown,'A **linked** thought.');assert.equal(current.notes[0].page,42);await act(async()=>tree.unmount());
});
test('selecting PDF text captures page-relative rectangles and saves the answer',async()=>{
 const previous=window.getSelection,saved=[],pageNode={dataset:{page:'1'},getBoundingClientRect:()=>({left:0,top:0,right:500,bottom:700,width:500,height:700})};window.getSelection=()=>({rangeCount:1,anchorNode:{},focusNode:{},toString:()=> 'A selected passage',getRangeAt:()=>({getClientRects:()=>[{left:10,top:20,right:110,bottom:35,width:100,height:15}]}),removeAllRanges(){}});let tree;
 try{await act(async()=>{tree=TestRenderer.create(React.createElement(ReaderPane,{book:{id:'a',title:'Book',pdf:{url:'test.pdf'}},onPosition(){},onSticky(){},onHighlight:(...v)=>saved.push(v)}),{createNodeMock:e=>e.props?.className?.includes('virtual-viewport')?{scrollTop:0,contains:()=>true,querySelectorAll:()=>[pageNode]}:{}});await sleep(25)});
 await act(async()=>tree.root.findByProps({'aria-label':'PDF pages: Book'}).props.onMouseUp({target:{closest:()=>null}}));const question=tree.root.findAll(n=>n.type==='input'&&n.props.placeholder==='What does this passage answer?')[0];assert.ok(question);await act(async()=>question.props.onChange({target:{value:'Why?'}}));const save=tree.root.findAll(n=>n.type==='button'&&n.children?.join('')==='Save highlighted answer')[0];await act(async()=>save.props.onClick());assert.equal(saved[0][0],'a');assert.equal(saved[0][1].passage,'A selected passage');assert.equal(saved[0][1].segments[0].page,1);assert.equal(saved[0][1].rects[0].x,.02);await act(async()=>tree.unmount());}finally{window.getSelection=previous}
});

test('a PDF page without a text layer explains that selection requires OCR for scans',async()=>{
 let tree;await act(async()=>{tree=TestRenderer.create(React.createElement(ReaderPane,{book:{id:'scan',title:'Scan',pdf:{url:'scan.pdf'}},pane:{page:7},onPosition(){},onSticky(){},onHighlight(){}}),{createNodeMock:nodeMock});await sleep(25)});const status=tree.root.findAll(n=>n.props.role==='status'&&n.children?.join('').includes('no selectable text'))[0];assert.ok(status);assert.match(status.children.join(''),/OCR/);await act(async()=>tree.unmount());
});
