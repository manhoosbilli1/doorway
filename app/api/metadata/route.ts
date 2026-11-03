import { getChatGPTUser } from '../../chatgpt-auth';
import {chooseMetadataCandidate,mapBook,cleanTitle,isbnFrom} from '../../lib/metadata';
export async function POST(request:Request){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in required'},{status:401});
 if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return new Response('Forbidden',{status:403});
 let input;try{const raw=await request.text();if(raw.length>2000)return new Response('Too large',{status:413});input=JSON.parse(raw)}catch{return new Response('Invalid JSON',{status:400})}
 const title=cleanTitle(input.title||''),isbn=isbnFrom(input.isbn||'');if(!title&&!isbn)return Response.json({book:null});
 const url=new URL('https://openlibrary.org/search.json');url.searchParams.set('limit','3');url.searchParams.set('fields','key,title,subtitle,author_name,cover_i,isbn,publisher,first_publish_year,subject');
 if(isbn)url.searchParams.set('isbn',isbn);else{url.searchParams.set('title',title);if(input.author)url.searchParams.set('author',String(input.author).slice(0,150))}
 try{
 const response=await fetch(url,{headers:{'User-Agent':'Doorway/0.2 (personal reading workspace; metadata lookup)'},signal:AbortSignal.timeout(7000)});
 if(!response.ok)return Response.json({book:null,unavailable:true});const payload:any=await response.json();
 const doc=chooseMetadataCandidate(payload.docs,title,isbn);
 if(!doc)return Response.json({book:null});
 return Response.json({book:mapBook(doc)},{headers:{'Cache-Control':'private,max-age=3600'}});
 }catch{return Response.json({book:null,unavailable:true})}
}
