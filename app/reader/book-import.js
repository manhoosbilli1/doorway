import {pdfjs} from 'react-pdf';
import {cleanTitle,isbnFrom} from '../lib/metadata';
import {resolveFile,uploadFile} from '../store';
pdfjs.GlobalWorkerOptions.workerSrc='/pdf.worker.min.mjs';
export async function inspectBook(record,filename,{signal,skipCover=false,textPages=4}={}){
 const cleaned=String(filename).replace(/\([^)]*(?:z-library|1lib|z-lib)[^)]*\)/gi,'');const authorMatch=cleaned.replace(/\.pdf$/i,'').match(/\(([^()]+)\)\s*$/);const inferred=cleanTitle(authorMatch?cleaned.replace(authorMatch[0]+'.pdf','').replace(authorMatch[0],''):cleaned);const result={title:inferred,author:authorMatch?.[1]||'',metadataSource:'Filename'};
 const url=await resolveFile(record);let task,thumbnail;
 try{
  task=pdfjs.getDocument({url,standardFontDataUrl:"/pdf-assets/standard_fonts/",cMapUrl:"/pdf-assets/cmaps/",cMapPacked:true,wasmUrl:"/pdf-assets/wasm/",disableAutoFetch:true,disableStream:true,rangeChunkSize:262144,isEvalSupported:false});
  const abort=()=>task.destroy();signal?.addEventListener('abort',abort,{once:true});
  try{const pdf=await task.promise;result.pages=pdf.numPages;result.length=pdf.numPages<150?1:pdf.numPages<300?2:pdf.numPages<500?3:pdf.numPages<800?4:5;
   const meta=await pdf.getMetadata();const title=cleanTitle(meta.info?.Title||meta.metadata?.get('dc:title')||'');
   if(title&&!/\.(docx?|tex)$/i.test(title)){result.title=title;result.metadataSource='PDF metadata'}
   const author=String(meta.info?.Author||meta.metadata?.get('dc:creator')||'').trim();if(author&&!/^(admin|user|unknown|author)$/i.test(author))result.author=author.slice(0,200);
   if(!skipCover)try{const cover=await pdf.getPage(1),v=cover.getViewport({scale:1}),viewport=cover.getViewport({scale:240/v.width});const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await cover.render({canvasContext:canvas.getContext('2d'),viewport}).promise;thumbnail=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.75));canvas.width=0;canvas.height=0}catch{}
   let text='';for(let n=1;n<=Math.min(textPages,pdf.numPages);n++){if(signal?.aborted)break;const page=await pdf.getPage(n);const content=await page.getTextContent();text+=' '+content.items.map(t=>t.str||'').join(' ');page.cleanup()}
   result.isbn=isbnFrom(text);if(!result.title){const lines=text.split(/\s{2,}/).map(cleanTitle).filter(Boolean);result.title=lines[0]?.slice(0,200)||''}
  }finally{signal?.removeEventListener('abort',abort)}
 }catch(e){if(signal?.aborted)throw new DOMException('Import cancelled','AbortError');result.importWarning=e.name==='PasswordException'?'Password-protected PDF added. You can unlock it in the reader.':'PDF metadata could not be read. You can retry the file in the reader.'}
 finally{await task?.destroy().catch(()=>{})}
 if(signal?.aborted)throw new DOMException('Import cancelled','AbortError');
 try{const response=await fetch('/api/metadata',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:result.title,isbn:result.isbn,author:result.author}),signal});if(response.ok){const {book}=await response.json();if(book){for(const [key,value]of Object.entries(book))if(value)result[key]=value}}}catch(e){if(signal?.aborted)throw e}
 if(!skipCover&&!result.cover&&thumbnail&&!signal?.aborted){try{const cover=await uploadFile(new File([thumbnail],'book-cover.jpg',{type:'image/jpeg'}));result.cover='/api/files/'+cover.path}catch{}}
 return result;
}
