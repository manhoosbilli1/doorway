'use client';
import React from 'react';
export function bookProgress(book){return Math.max(0,Math.min(100,Math.round(Number(book.progress)||0)))}
export default function BookProgress({book,compact=false}){const p=bookProgress(book);return <span className={'book-progress '+(compact?'progress-compact':'')}><span className="progress-track" role="progressbar" aria-label={'Reading progress for '+book.title} aria-valuenow={p} aria-valuemin={0} aria-valuemax={100}><i style={{width:p+'%'}}/></span>{!compact&&<small>{p}% read</small>}</span>}
