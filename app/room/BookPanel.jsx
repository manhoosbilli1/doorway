'use client';
import React,{useId,useRef,useState,useEffect} from 'react';
import {BookOpen,Pin,X} from 'lucide-react';
export default function BookPanel({title='Companion',subtitle='Doorway',children,className='',icon:Icon=BookOpen,onOpenChange}){
 const [open,setOpen]=useState(false),[pinned,setPinned]=useState(false);const timer=useRef(null),root=useRef(null);const id=useId();const pinRef=useRef(false);pinRef.current=pinned;
 useEffect(()=>{onOpenChange?.(open)},[open,onOpenChange]);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 const reveal=()=>{clearTimeout(timer.current);setOpen(true)};
 useEffect(()=>{const openBook=e=>{if(e.detail===title){clearTimeout(timer.current);setOpen(true)}};window.addEventListener('doorway-open-book',openBook);return()=>window.removeEventListener('doorway-open-book',openBook)},[title]);
 const leave=()=>{clearTimeout(timer.current);timer.current=setTimeout(()=>{const keyboardFocus=root.current?.contains(document.activeElement)&&document.activeElement?.matches?.(':focus-visible');if(!pinRef.current&&!keyboardFocus)setOpen(false)},600)};
 const close=()=>{clearTimeout(timer.current);pinRef.current=false;setPinned(false);setOpen(false)};
 return <aside ref={root} className={'ritual-book '+className+' '+(open?'is-open':'')} onPointerEnter={e=>{if(e.pointerType==='mouse')reveal()}} onPointerLeave={leave} onFocus={e=>{if(e.target.getAttribute?.('aria-controls')==null)reveal()}} onBlur={leave} onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();e.currentTarget.querySelector('.ritual-cover')?.focus();close()}}} aria-label={title}>
 <button className="ritual-cover" aria-label={'Open '+title.toLowerCase()} aria-expanded={open} aria-controls={id} onClick={()=>{clearTimeout(timer.current);setOpen(v=>!v)}}><Icon size={21}/><span>{title}</span><small>doorway</small></button>
 <div id={id} className="ritual-pages" inert={!open} aria-hidden={!open}><header><span>{subtitle}</span><div><button aria-label={'Keep '+title.toLowerCase()+' open'} aria-pressed={pinned} onClick={()=>{clearTimeout(timer.current);pinRef.current=!pinRef.current;setPinned(pinRef.current);setOpen(true)}}><Pin size={14}/></button><button aria-label={'Close '+title.toLowerCase()} onClick={close}><X size={16}/></button></div></header><h2>{title}</h2>{children}</div>
 </aside>
}
