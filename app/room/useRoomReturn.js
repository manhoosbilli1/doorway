'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
export default function useRoomReturn(onReturn){
 const [transition,setTransition]=useState(null);const timers=useRef([]),busy=useRef(false),latest=useRef(onReturn);latest.current=onReturn;
 useEffect(()=>()=>{for(const timer of timers.current)clearTimeout(timer)},[]);
 const begin=useCallback((action,title)=>{if(busy.current)return;busy.current=true;const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;setTransition({title,phase:'closing'});timers.current.push(setTimeout(()=>{try{action?.()}finally{latest.current();setTransition({title,phase:'returning'})}},reduced?0:720));timers.current.push(setTimeout(()=>{setTransition(null);busy.current=false;timers.current=[]},reduced?80:1900))},[]);
 const beginOpen=useCallback((action,title)=>{if(busy.current)return;busy.current=true;const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;setTransition({title,phase:'opening'});timers.current.push(setTimeout(()=>{action?.();setTransition({title,phase:'entering'})},reduced?0:700));timers.current.push(setTimeout(()=>{setTransition(null);busy.current=false;timers.current=[]},reduced?80:1600))},[]);
 return {transition,begin,beginOpen};
}
