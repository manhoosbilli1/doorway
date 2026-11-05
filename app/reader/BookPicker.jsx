'use client';
import React,{useMemo,useState} from 'react';
import BookProgress from './BookProgress';
import {BookOpen,Plus,Search,Check} from 'lucide-react';
export function filterBooks(books,query='',genre='All subjects'){
 const q=query.trim().toLocaleLowerCase();return books.filter(b=>b.status!=='dropped'&&(genre==='All subjects'||(b.genre||b.domain||'Uncategorized')===genre)&&[b.title,b.author,b.genre,b.domain].join(' ').toLocaleLowerCase().includes(q)).sort((a,b)=>(a.genre||a.domain||'Uncategorized').localeCompare(b.genre||b.domain||'Uncategorized')||a.title.localeCompare(b.title));
}
export default function BookPicker({books,selected=[],onPick}){
 const [query,setQuery]=useState(''),[genre,setGenre]=useState('All subjects'),[limit,setLimit]=useState(60);
 const genres=useMemo(()=>[...new Set(books.filter(b=>b.status!=='dropped').map(b=>b.genre||b.domain||'Uncategorized'))].sort(),[books]);
 const matches=useMemo(()=>filterBooks(books,query,genre),[books,query,genre]);const rows=matches.slice(0,limit);
 return <div className="book-picker"><div className="picker-filters"><label><Search size={17}/><input autoFocus aria-label="Search books to add" value={query} onChange={e=>{setQuery(e.target.value);setLimit(60)}} placeholder="Title, author, or subject…"/></label><select aria-label="Filter books by subject" value={genre} onChange={e=>{setGenre(e.target.value);setLimit(60)}}><option>All subjects</option>{genres.map(g=><option key={g}>{g}</option>)}</select></div><p>{selected.length} of 6 places filled · {matches.length} books found</p><div className="picker-results">{rows.map((b,i)=>{const g=b.genre||b.domain||'Uncategorized',prev=rows[i-1],added=selected.includes(b.id);return <React.Fragment key={b.id}>{(!prev||(prev.genre||prev.domain||'Uncategorized')!==g)&&<h3>{g}</h3>}<button className="picker-book" disabled={added||selected.length>=6} onClick={()=>onPick(b.id)}><span className="picker-cover">{b.cover?<img src={b.cover} loading="lazy" alt="" onError={e=>{e.currentTarget.style.display='none'}}/>:<BookOpen size={22}/>}</span><span><strong>{b.title}</strong><small>{b.author||'Author unknown'} · {b.status==='reading'?'Reading':b.status==='completed'?'Completed':'On your shelf'}</small><BookProgress book={b}/></span>{added?<Check size={17}/>:<Plus size={17}/>}</button></React.Fragment>})}{!rows.length&&<p>No books match this search.</p>}{matches.length>limit&&<button className="btn secondary" onClick={()=>setLimit(n=>n+60)}>Show 60 more</button>}</div></div>;
}
