'use client';
import React,{useState,useRef,useEffect} from 'react';
import BookPanel from '../room/BookPanel';
import {BookOpen,Flame,Sun,StickyNote,Library,Plus,GraduationCap,Highlighter,Clapperboard,Timer,Pin,X} from 'lucide-react';

export function Hearth({motion}){
 const [hidden,setHidden]=useState(false);const root=useRef(null);
 useEffect(()=>{const crackle=e=>{if(!motion||document.hidden||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;root.current?.animate?.([{opacity:.35},{opacity:.75+e.detail/3,offset:.15},{opacity:.35}],{duration:650,easing:'ease-out'})};window.addEventListener('doorway-crackle',crackle);return()=>window.removeEventListener('doorway-crackle',crackle)},[motion]);
 useEffect(()=>{const update=()=>setHidden(document.hidden);document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update)},[]);
 return <div className={'hearth '+(!motion||hidden?'hearth-still':'')} aria-hidden="true"><div className="hearth-glow" ref={root}/><div className="page-firelight"/><div className="hearth-flames">{Array.from({length:5},(_,i)=><i key={i} style={{'--i':i}}/>)}</div><div className="hearth-embers">{Array.from({length:12},(_,i)=><i key={i} style={{'--i':i,'--drift':`${(i%2?1:-1)*(20+i*9)}px`}}/>)}</div></div>
}
export default function ReadingRitual({ambient,motion,aperture,onSetting,onAdd,onNotes,onTool,onBack,onEndSession,children,single=false,onOpenChange}){
 return <BookPanel onOpenChange={onOpenChange} title="Reading companion" subtitle="A LITTLE LIGHT. A LITTLE ROOM TO THINK."><p>Follow a thought. Leave a mark.</p>{children}
 <div className="ritual-tools">{[[Plus,single?'Add this book to a workspace':'Open a book',onAdd],[StickyNote,single?'Your notes':'Workspace notes',onNotes],[GraduationCap,'Chapter notes',()=>onTool('chapters')],[Highlighter,'Connections',()=>onTool('annotations')],[Clapperboard,'Lectures',()=>onTool('lecture-open')],[Timer,'Reading session',()=>onTool('session')]].map(([Icon,label,action])=><button key={label} onClick={action}><Icon size={17}/>{label}</button>)}</div>
 <div className="ritual-settings"><button aria-pressed={ambient} onClick={()=>onSetting({ambient:!ambient})}><Sun size={16}/><span>Candlelight</span><b>{ambient?'On':'Off'}</b></button><button aria-pressed={motion} onClick={()=>onSetting({motion:!motion})}><Flame size={16}/><span>Embers & motion</span><b>{motion?'On':'Off'}</b></button><label>Pool of light <input aria-label="Pool of light size" type="range" min="25" max="75" value={aperture} onChange={e=>onSetting({aperture:Number(e.target.value)})}/></label></div>
 <footer>{onEndSession&&<button className="end-session-link" onClick={onEndSession}><Timer size={15}/> End & log this session</button>}<button onClick={onBack}><Library size={15}/> Return to library</button><span>Hover to open · pin to stay</span></footer>
 </BookPanel>
}
