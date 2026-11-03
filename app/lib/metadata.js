export function cleanTitle(value=''){
 const text=String(value).replace(/\.(?:pdf|epub)$/i,'').replace(/[_]/g,' ').replace(/\b(?:www\.[^\s]+|z-?lib(?:rary)?|libgen|download|ebook|pdfdrive)\b/gi,'').replace(/\s+/g,' ').trim();
 if(!text||/^(untitled|document\d*|microsoft word|scan\d*|[a-f0-9-]{20,})$/i.test(text))return '';
 return text.slice(0,250);
}
export function isbnFrom(text=''){
 const candidates=String(text).match(/(?:97[89][\d\s-]{10,20}\d|\b\d[\d -]{8,16}[\dX]\b)/g)||[];
 for(const value of candidates){const s=value.replace(/[^\dX]/gi,'').toUpperCase();if(s.length===13&&/^(978|979)/.test(s)&&s.split('').reduce((n,d,i)=>n+Number(d)*(i%2?3:1),0)%10===0)return s;
 if(s.length===10&&s.split('').reduce((n,d,i)=>n+(d==='X'?10:Number(d))*(10-i),0)%11===0)return s}
 return '';
}
export function matchScore(query,candidate){const words=s=>new Set(String(s).toLowerCase().replace(/[^\p{L}\p{N} ]/gu,' ').split(/\s+/).filter(w=>w.length>1));const a=words(query),b=words(candidate);if(!a.size||!b.size)return 0;return [...a].filter(w=>b.has(w)).length/Math.max(a.size,b.size*.7)}
export function mapBook(doc){return {title:doc.title||'',author:(doc.author_name||[]).join(', '),cover:doc.cover_i?`https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`:'',isbn:doc.isbn?.[0]||'',publisher:doc.publisher?.[0]||'',year:doc.first_publish_year||'',genre:(doc.subject||[]).find(s=>!/^(accessible book|protected daisy|in library|fiction|overdrive|large type books|translations)/i.test(s))||'',domain:(doc.subject||[]).find(s=>!/^(accessible book|protected daisy|in library|fiction|overdrive|large type books|translations)/i.test(s))||'General',description:doc.subtitle||'',metadataSource:'Open Library',metadataUrl:`https://openlibrary.org${doc.key||''}`}}

export function chooseMetadataCandidate(docs,title,isbn){const candidates=Array.isArray(docs)?docs:[];const doc=[...candidates].sort((a,b)=>matchScore(title,b.title)-matchScore(title,a.title))[0];if(!doc)return null;const score=matchScore(title,doc.title);if(title&&score<(isbn ? 0.55 : 0.68))return null;return doc}
