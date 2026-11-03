// DOM-level format tests; these do not exercise a browser or frame rate.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import JSZip from 'jszip';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://reader.test'});
dom.window.URL.createObjectURL=URL.createObjectURL.bind(URL);dom.window.URL.revokeObjectURL=URL.revokeObjectURL.bind(URL);
for(const k of ['window','document','DOMParser','XMLSerializer','Node','HTMLElement','MutationObserver','getSelection'])globalThis[k]=k==='window'?dom.window:k==='document'?dom.window.document:dom.window[k];
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
const [{Editor},{default:StarterKit},{Markdown},{openEpubArchive,epubSection}]=await Promise.all([import('@tiptap/core'),import('@tiptap/starter-kit'),import('@tiptap/markdown'),import('../app/reader/epub-archive.js')]);
test('formatted editor reads and writes Markdown without a second preview',()=>{
 const editor=new Editor({element:document.createElement('div'),extensions:[StarterKit,Markdown],content:'# Reading notes\n\nA **bold** idea.',contentType:'markdown'});
 assert.match(editor.getHTML(),/<h1>Reading notes<\/h1>/);assert.match(editor.getHTML(),/<strong>bold<\/strong>/);assert.match(editor.getMarkdown(),/\*\*bold\*\*/);
 editor.commands.setContent('## Linked thought\n\n- first\n- second',{contentType:'markdown'});assert.match(editor.getHTML(),/<h2>Linked thought<\/h2>/);assert.match(editor.getMarkdown(),/first/);editor.destroy();
});
test('EPUB metadata and a section open lazily and active content is removed',async()=>{
 const zip=new JSZip();zip.file('mimetype','application/epub+zip',{compression:'STORE'});zip.file('META-INF/container.xml','<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>');
 zip.file('OEBPS/content.opf','<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Test Book</dc:title><dc:creator>Test Author</dc:creator><dc:identifier id="id">test-id</dc:identifier><dc:language>en</dc:language></metadata><manifest><item id="chapter" href="chapter.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="chapter"/></spine></package>');
 zip.file('OEBPS/chapter.xhtml','<html xmlns="http://www.w3.org/1999/xhtml"><head><title>Chapter</title></head><body><h1>Chapter</h1><script>alert(1)</script><p onclick="alert(1)">Test.</p><a href="javascript:alert(1)">bad link</a><img src="https://evil.example/a.png"/></body></html>');
 const archive=await openEpubArchive(await zip.generateAsync({type:'nodebuffer'}));assert.equal(archive.title,'Test Book');assert.equal(archive.sections.length,1);const result=await epubSection(archive,0);assert.match(result.html,/Chapter/);assert.doesNotMatch(result.html,/script|onclick|javascript:|evil\.example/);assert.equal(result.urls.length,0);
 await assert.rejects(openEpubArchive(Buffer.from('not a zip')));
});
async function list(dir){const found=[];for(const f of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,f.name);if(f.isDirectory())found.push(...await list(p));else if(/\.epub$/i.test(f.name))found.push(p)}return found}
test('owned EPUBs expose metadata and readable first, middle and last sections',{skip:!process.env.DOORWAY_TEST_BOOKS,timeout:120000},async()=>{
 const files=await list(process.env.DOORWAY_TEST_BOOKS);assert.ok(files.length);for(const file of files){const data=await readFile(file);const archive=await openEpubArchive(data);assert.ok(archive.sections.length);for(const index of new Set([0,Math.floor(archive.sections.length/2),archive.sections.length-1])){const page=await epubSection(archive,index);assert.equal(typeof page.html,'string');for(const u of page.urls)URL.revokeObjectURL(u)}globalThis.gc?.()}
});
