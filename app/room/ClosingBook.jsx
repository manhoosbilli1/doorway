'use client';
import React from 'react';
export default function ClosingBook({title}){
 return <div className="closing-ritual" role="status" aria-live="polite"><div className="closing-table"><div className="closing-volume"><div className="closing-page page-left"/><div className="closing-page page-right"/><div className="closing-cover"><span>DOORWAY</span><strong>{title||'Until the next page'}</strong><i>Every return is a beginning.</i></div><img className="closing-hand" src="/room-assets/closing-hand.webp" alt=""/></div></div><p>Keeping your place. Returning to the fire.</p></div>
}
