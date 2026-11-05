import {DOMParser} from '@xmldom/xmldom';
import {openEpubArchive} from './epub-archive';
globalThis.DOMParser=DOMParser;
self.onmessage=async event=>{try{const archive=await openEpubArchive(await event.data.arrayBuffer());self.postMessage({type:'doorway-epub-metadata',result:{title:archive.title,author:archive.author,identifier:archive.identifier,pages:archive.sections.length}})}catch(error){self.postMessage({type:'doorway-epub-metadata',error:error.message||'Could not read EPUB details'})}};
