export function sourceKey(name=''){return String(name).normalize('NFC').replaceAll('\\','/').split('/').pop().trim().toLocaleLowerCase()}
export function inferGenre(book={},filename=''){
 const text=[book.title,book.author,book.genre,book.domain,filename].filter(Boolean).join(' ').toLowerCase();
 const groups=[['Electrical Engineering',/antenna|rfid|radio frequency|electronic|semiconductor|circuit|electromagnet|microwave|radio engineering|amplifier|pcb design|embedded|signal processing/],['Mathematics',/mathematic|calculus|geometry|algebra|topology|number theory|differential equation|euclid|probability/],['Computer Science',/programming|computer science|software|data structure|algorithm|machine learning|artificial intelligence|python|javascript/],['Business & Entrepreneurship',/entrepreneur|startup|business|marketing|product positioning|sales|selling|financial intelligence|economics|innovation|personal mba|customer/],['Psychology & Behaviour',/psycholog|motivation|self.determination|implementation intention|goal.setting|behavio[u]?r|ryandeci|sheldonelliot|locke.latham/],['Islamic Studies',/islam|taymiyyah|muhammad|quran|qur.an|hadith|purification|zaad|deen|muslim/],['Biology & Medicine',/biology|biological|anatomy|medical|medicine|physiology|genetics|neuroscience/],['Physics',/physics|quantum|relativity|mechanics|thermodynamic|optics|astronom/],['Philosophy',/philosoph|metaphysic|epistemology|ethics/],['History',/history|historical|civilization/]];
 return groups.find(([,pattern])=>pattern.test(text))?.[0]||'Uncategorized';
}
export function isDuplicateFile(file,books){const key=sourceKey(file.name);return !!key&&books.some(b=>sourceKey(b.pdf?.name||b.sourceName)===key&&(b.sourceSize==null||Number(b.sourceSize)===Number(file.size)))}
export function findDuplicateFile(file,books){const key=sourceKey(file.name);return key?books.find(b=>sourceKey(b.pdf?.name||b.sourceName)===key&&(b.sourceSize==null||Number(b.sourceSize)===Number(file.size))):undefined}
export function refreshedMetadata(book,metadata,file){
 const change={};const genre=inferGenre({...book,...metadata},file.webkitRelativePath||file.name);if(!book.sourceName)change.sourceName=file.name;if(book.sourceSize==null)change.sourceSize=file.size;
 if(!book.cover&&metadata.cover)change.cover=metadata.cover;if((!book.author||/^(unknown|author|user)$/i.test(book.author))&&metadata.author)change.author=metadata.author;
 const oldTitle=String(book.title||'').trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' '),newTitle=String(metadata.title||'').trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ');const oldWords=oldTitle.split(' ').filter(x=>x.length>1);const newWords=new Set(newTitle.split(' '));const score=oldWords.length?oldWords.filter(x=>newWords.has(x)).length/oldWords.length:0;
 if(metadata.title&&metadata.metadataSource!=='Filename'&&(!book.title||/^(untitled|unknown)/i.test(book.title)||(book.metadataSource==='Filename'&&score>=.7))){change.title=metadata.title;change.metadataSource=metadata.metadataSource;change.metadataUrl=metadata.metadataUrl||book.metadataUrl}
 if(metadata.pages&&(!book.pages||Number(book.pages)<=1||Number(book.pages)===100))change.pages=metadata.pages;
 if((!book.genre||/^(general|uncategorized)$/i.test(book.genre))&&genre!=='Uncategorized')change.genre=genre;
 if((!book.domain||/^(general|uncategorized)$/i.test(book.domain))&&genre!=='Uncategorized')change.domain=genre;
 for(const key of ['isbn','publisher','year','description'])if(!book[key]&&metadata[key])change[key]=metadata[key];return change;
}
