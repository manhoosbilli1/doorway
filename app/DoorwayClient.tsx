'use client';
import { useEffect, useState } from 'react';
export default function DoorwayClient({ user }: { user: {id:string;email:string} }) {
 const [App,setApp] = useState<any>(null);
 useEffect(()=>{import('./Doorway').then(m=>setApp(()=>m.default));},[]);
 return App ? <App initialUser={user}/> : <div className="auth-shell">Opening your workspace…</div>;
}
