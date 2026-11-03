import {cleanTitle} from '../lib/metadata';
import {uploadFile} from '../store';
import {openEpubArchive,epubCover} from './epub-archive';
export async function inspectEpub(file,{signal,skipCover=false}={}){
 if(signal?.aborted)throw new DOMException('Import cancelled','AbortError');const archive=await openEpubArchive(await file.arrayBuffer());if(signal?.aborted)throw new DOMException('Import cancelled','AbortError');
 const result={title:cleanTitle(archive.title||file.name),author:archive.author,metadataSource:archive.title?'EPUB metadata':'Filename',pages:archive.sections.length};
 if(!skipCover)try{const image=await epubCover(archive);if(image){const type=archive.cover.type;const name=type==='image/png'?'cover.png':type==='image/webp'?'cover.webp':'cover.jpg';if(type!=='image/webp'){const cover=await uploadFile(new File([image],name,{type}));result.cover='/api/files/'+cover.path}}}catch{}
 try{const response=await fetch('/api/metadata',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:result.title,author:result.author,isbn:archive.identifier}),signal});if(response.ok){const {book}=await response.json();if(book){for(const [key,value] of Object.entries(book))if(value)result[key]=value}}}catch(e){if(signal?.aborted)throw e}
 return result;
}
