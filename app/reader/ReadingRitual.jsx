'use client';
import React,{useState,useRef,useEffect} from 'react';
import {BookOpen,Flame,Sun,StickyNote,Library,Plus,GraduationCap,Highlighter,Clapperboard,Timer,Pin,X} from 'lucide-react';

export function Hearth({motion}){
 const [hidden,setHidden]=useState(false);
 useEffect(()=>{const update=()=>setHidden(document.hidden);document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update)},[]);
 return <div className={'hearth '+(!motion||hidden?'hearth-still':'')} aria-hidden="true"><div className="hearth-glow"/><div className="hearth-flames">{Array.from({length:5},(_,i)=><i key={i} style={{'--i':i}}/>)}</div><div className="hearth-embers">{Array.from({length:12},(_,i)=><i key={i} style={{'--i':i,'--drift':`${(i%2?1:-1)*(20+i*9)}px`}}/>)}</div></div>
}
export default function ReadingRitual({ambient,motion,aperture,onSetting,onAdd,onNotes,onTool,onBack}){
 const [open,setOpen]=useState(false),[pinned,setPinned]=useState(false);const timer=useRef(null),root=useRef(null);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 const reveal=()=>{clearTimeout(timer.current);setOpen(true)};
 const leave=()=>{clearTimeout(timer.current);timer.current=setTimeout(()=>{const keyboardFocus=root.current?.contains(document.activeElement)&&document.activeElement?.matches?.(':focus-visible');if(!pinned&&!keyboardFocus)setOpen(false)},600)};
 return <aside ref={root} className={'ritual-book '+(open?'is-open':'')} onPointerEnter={e=>{if(e.pointerType==='mouse')reveal()}} onPointerLeave={leave} onFocus={reveal} onBlur={leave} onKeyDown={e=>{if(e.key==='Escape'){e.currentTarget.querySelector('.ritual-cover')?.focus();setPinned(false);setOpen(false)}}} aria-label="Reading companion">
 <button className="ritual-cover" aria-label="Open reading companion" aria-expanded={open} aria-controls="ritual-pages" onClick={()=>{clearTimeout(timer.current);setOpen(v=>!v)}}><BookOpen size={23}/><span>COMPANION</span><small>doorway</small></button>
 <div id="ritual-pages" className="ritual-pages" inert={!open} aria-hidden={!open}>
 <div className="ritual-binding"/><header><span>THE READING COMPANION</span><div><button aria-label="Keep companion open" aria-pressed={pinned} onClick={()=>setPinned(v=>!v)}><Pin size={14}/></button><button aria-label="Close reading companion" onClick={()=>{setPinned(false);setOpen(false)}}><X size={16}/></button></div></header>
 <h2>A little light.<br/>A little room to think.</h2><p>Follow a thought. Leave a mark.</p>
 <div className="ritual-tools">{[[Plus,'Open a book',onAdd],[StickyNote,'Workspace notes',onNotes],[GraduationCap,'Chapter notes',()=>onTool('chapters')],[Highlighter,'Connections',()=>onTool('annotations')],[Clapperboard,'Lectures',()=>onTool('lecture-open')],[Timer,'Reading session',()=>onTool('session')]].map(([Icon,label,action])=><button key={label} onClick={action}><Icon size={17}/>{label}</button>)}</div>
 <div className="ritual-settings"><button aria-pressed={ambient} onClick={()=>onSetting({ambient:!ambient})}><Sun size={16}/><span>Candlelight</span><b>{ambient?'On':'Off'}</b></button><button aria-pressed={motion} onClick={()=>onSetting({motion:!motion})}><Flame size={16}/><span>Embers & motion</span><b>{motion?'On':'Off'}</b></button><label>Pool of light <input aria-label="Pool of light size" type="range" min="25" max="75" value={aperture} onChange={e=>onSetting({aperture:Number(e.target.value)})}/></label></div>
 <footer><button onClick={onBack}><Library size={15}/> Return to library</button><span>Hover to open · pin to stay</span></footer>
 </div></aside>
}
