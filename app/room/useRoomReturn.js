'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
export default function useRoomReturn(onReturn,{motion=true}={}){
 const [transition,setTransition]=useState(null);const timers=useRef([]),busy=useRef(false),latest=useRef(onReturn),pending=useRef(null),motionRef=useRef(motion);latest.current=onReturn;motionRef.current=motion;
 const clear=()=>{for(const t of timers.current)clearTimeout(t);timers.current=[]};
 useEffect(()=>()=>{clear();pending.current=null},[]);
 const finish=useCallback(()=>{clear();setTransition(null);busy.current=false;pending.current=null},[]);
 const skip=useCallback(()=>{const action=pending.current;pending.current=null;try{action?.()}finally{finish()}},[finish]);
 const begin=useCallback((action,title)=>{if(busy.current)return false;busy.current=true;const reduced=!motionRef.current||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;const commit=()=>{try{action?.()}finally{latest.current()}};pending.current=commit;setTransition({title,phase:'closing'});timers.current.push(setTimeout(()=>{pending.current=null;try{commit();setTransition({title,phase:'returning'})}catch(e){finish();throw e}},reduced?0:720));timers.current.push(setTimeout(finish,reduced?80:1900));return true},[finish]);
 const beginOpen=useCallback((action,title,origin)=>{if(busy.current)return false;busy.current=true;const reduced=!motionRef.current||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;pending.current=action;const state={title,origin};setTransition({...state,phase:reduced?'opening':'rising'});
 const descent=!reduced&&origin?.y<30?600:0;
 if(!reduced)for(const [delay,phase] of [[450,'walking'],[1550,'reaching'],...(descent?[[2150,'descending']]:[]),[2150+descent,'carrying'],[3250+descent,'seated'],[3700+descent,'opening']])timers.current.push(setTimeout(()=>setTransition({...state,phase}),delay));
 timers.current.push(setTimeout(()=>{pending.current=null;try{action?.();setTransition({...state,phase:'entering'})}catch(e){finish();throw e}},reduced?0:4400+descent));timers.current.push(setTimeout(finish,reduced?80:5050+descent));return true},[finish]);
 return {transition,begin,beginOpen,skip};
}
