import {compileExpression,complex} from './math-expression.js';
export const graphModes={vector1:'1D vector field',curve:'2D graph · y = f(x)',surface:'3D surface · z = f(x,y)',field2:'2D vector field',field3:'3D vector field',vectors:'Vector system · one per line',complex:'Complex curve · z = f(t)',complexField:'Complex mapping · f(z)'};
export const graphExamples={vector1:'sin(x)',curve:'sin(x)',surface:'sin(x)*cos(y)',field2:'-y, x',field3:'-y, x, sin(z)',vectors:'3, 1, 0\n1, 3, 2\n-2, 1, 1',complex:'exp(i*t)',complexField:'z^2'};
export function splitExpressions(text,separator=','){
 let depth=0,chunk='',out=[];for(const ch of text){if(ch==='(')depth++;if(ch===')')depth--;if(ch===separator&&depth===0){out.push(chunk.trim());chunk=''}else chunk+=ch}out.push(chunk.trim());return out;
}
function unwrapVector(source){const text=source.trim(),open=text[0],close=open==='('?')':open==='['?']':null;if(!close||text.at(-1)!==close)return text;let depth=0;for(let i=0;i<text.length;i++){if(text[i]===open)depth++;if(text[i]===close)depth--;if(depth===0&&i<text.length-1)return text}return text.slice(1,-1)}
export function compileGraph(mode,source){
 if(!Object.hasOwn(graphModes,mode))throw Error('Choose a graph type');if(source.length>1800)throw Error('Use shorter equations');
 let text=source.trim().replace(/^(?:[a-z]+(?:\([^)]*\))?)\s*=\s*/i,'');
 if(mode==='vectors'){const lines=text.split(/\n|;/).filter(s=>s.trim());if(!lines.length||lines.length>12)throw Error('Use 1–12 vectors, one per line');return lines.map(line=>{const parts=splitExpressions(unwrapVector(line));if(parts.length<1||parts.length>3)throw Error('Use up to three components per vector');return parts.map(s=>compileExpression(s))})}
 if(['field2','field3'].includes(mode)){text=unwrapVector(text);const parts=splitExpressions(text);if(parts.length!==(mode==='field2'?2:3))throw Error('Separate the '+(mode==='field2'?2:3)+' components with commas');return parts.map(s=>compileExpression(s))}
 return [compileExpression(text)];
}
const finite=v=>v.every(n=>Number.isFinite(n)&&Math.abs(n)<1e6);
// Bounded samples protect interaction latency even for singular or nested expressions.
export function graphGeometry(mode,source,{extent=5,a=1,b=1,c=1,vectorScale=.35}={}){
 const compiled=compileGraph(mode,source),lines=[],arrows=[],budget={remaining:300000};let invalid=0;extent=Math.max(.05,Math.min(1000,Number(extent)||5));
 const evaluate=(fn,x=0,y=0,z=0,t=x)=>fn({x,y,z:mode==='complexField'?complex(x,y):z,t,a,b,c},budget);
 const sample=fn=>{try{return fn()}catch(e){if(budget.remaining<0)throw e;invalid++;return null}};
 const pushLine=points=>{let run=[];for(const p of points){if(p&&finite(p)&&(!run.length||Math.hypot(...p.map((v,i)=>v-run.at(-1)[i]))<extent*4))run.push(p);else{if(run.length>1)lines.push(run);run=p&&finite(p)?[p]:[]}}if(run.length>1)lines.push(run)};
 if(mode==='curve'||mode==='complex'){const points=[];for(let n=0;n<=240;n++){const x=-extent+2*extent*n/240;points.push(sample(()=>{const v=evaluate(compiled[0],x);if(mode==='curve'&&Math.abs(v.im)>1e-8)throw Error('Use complex curve for imaginary values');return mode==='complex'?[v.re,v.im,0]:[x,v.re,0]}))}pushLine(points)}
 else if(mode==='surface'){for(let axis=0;axis<2;axis++)for(let row=0;row<=20;row++){const points=[];for(let col=0;col<=40;col++){const p=-extent+2*extent*row/20,q=-extent+2*extent*col/40,x=axis?p:q,y=axis?q:p;points.push(sample(()=>{const v=evaluate(compiled[0],x,y);if(Math.abs(v.im)>1e-8)throw Error('Surface heights must be real');return [x,y,v.re]}))}pushLine(points)}}
 else if(mode==='vectors'){for(const fs of compiled){const values=sample(()=>fs.map(f=>evaluate(f)));if(values){if(values.some(v=>Math.abs(v.im)>1e-8)){invalid++;continue}arrows.push([[0,0,0],[values[0]?.re||0,values[1]?.re||0,values[2]?.re||0]])}}}
 else {const dims=mode==='field3'?3:mode==='vector1'?1:2,n=dims===3?5:dims===1?19:11;
 for(let k=0;k<(dims===3?n:1);k++)for(let j=0;j<(dims>=2?n:1);j++)for(let i=0;i<n;i++){const x=-extent+2*extent*i/(n-1),y=dims>=2?-extent+2*extent*j/(n-1):0,z=dims===3?-extent+2*extent*k/(n-1):0;const values=sample(()=>{if(mode==='complexField'){const v=evaluate(compiled[0],x,y);return [v.re,v.im,0]}const v=compiled.map(f=>evaluate(f,x,y,z));if(v.some(v=>Math.abs(v.im)>1e-8))throw Error('Use complex mapping for imaginary components');return [v[0].re,v[1]?.re||0,v[2]?.re||0]});if(values&&finite(values)){// Preserve magnitudes, clip only extreme arrows outside the drawing.
 const d=values.map(v=>v*vectorScale),length=Math.hypot(...d);if(length>extent*4)continue;arrows.push([[x,y,z],[x+d[0],y+d[1],z+d[2]]])}}
 }
 if(!lines.length&&!arrows.length)throw Error('No finite values in this range. Check the equation or change the range.');return {lines,arrows,invalid};
}
export function drawGraph(ctx,width,height,geometry,settings){
 if(!ctx)return;const {extent=5,yaw=.65,pitch=.55,color='#356b8a',mode='curve'}=settings;const three=['surface','field3','vectors'].includes(mode),scale=Math.min(width,height)*.39/extent;
 const project=([x,y,z=0])=>{if(!three)return [width/2+x*scale,height/2-y*scale];const u=x*Math.cos(yaw)-y*Math.sin(yaw),v=x*Math.sin(yaw)+y*Math.cos(yaw);return [width/2+u*scale,height/2-(z*Math.cos(pitch)+v*Math.sin(pitch))*scale]};
 ctx.clearRect(0,0,width,height);ctx.lineWidth=.7;ctx.strokeStyle='#826c4a30';
 const line=(a,b)=>{const p=project(a),q=project(b);ctx.beginPath();ctx.moveTo(...p);ctx.lineTo(...q);ctx.stroke()};
 for(let i=-5;i<=5;i++){const v=i*extent/5;line([-extent,v,0],[extent,v,0]);line([v,-extent,0],[v,extent,0])}
 ctx.strokeStyle='#67533c88';ctx.fillStyle='#67533c';ctx.font='11px system-ui';const axes=three?[[extent,0,0],[0,extent,0],[0,0,extent]]:[[extent,0,0],[0,extent,0]];axes.forEach((p,i)=>{line(p.map(v=>-v),p);const q=project(p);ctx.fillText((mode.startsWith('complex')?['Re','Im']:['x','y','z'])[i],q[0]+4,q[1]-4)});
 ctx.fillText('±'+Number(extent.toPrecision(3)),8,height-8);ctx.lineWidth=1.5;ctx.strokeStyle=color;ctx.fillStyle=color;
 for(const path of geometry.lines){ctx.beginPath();path.forEach((p,i)=>{const q=project(p);if(i)ctx.lineTo(...q);else ctx.moveTo(...q)});ctx.stroke()}
 for(const [a,b] of geometry.arrows){const p=project(a),q=project(b);ctx.beginPath();ctx.moveTo(...p);ctx.lineTo(...q);ctx.stroke();const angle=Math.atan2(q[1]-p[1],q[0]-p[0]),head=Math.min(6,Math.hypot(q[0]-p[0],q[1]-p[1])*.4);ctx.beginPath();ctx.moveTo(...q);ctx.lineTo(q[0]-head*Math.cos(angle-.45),q[1]-head*Math.sin(angle-.45));ctx.lineTo(q[0]-head*Math.cos(angle+.45),q[1]-head*Math.sin(angle+.45));ctx.closePath();ctx.fill()}
}
