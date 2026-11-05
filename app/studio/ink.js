export const bounded=(n,lo=0,hi=1)=>Math.max(lo,Math.min(hi,Number(n)||0));
export function inkPoint(e,box){return [Math.round(bounded((e.clientX-box.left)/box.width)*100000)/100000,Math.round(bounded((e.clientY-box.top)/box.height)*100000)/100000,Math.round(bounded(e.pointerType==='pen'?(e.pressure>0?e.pressure:.08):.5,.05,1)*100)/100]}
export function appendPoints(points,events,box){for(const event of events){const p=inkPoint(event,box),last=points.at(-1);if(!last||Math.hypot((p[0]-last[0])*box.width,(p[1]-last[1])*box.height)>.45)points.push(p)}return points}
export function paintStroke(ctx,stroke,width,height,alpha=1){
 const points=stroke.points||[];if(!points.length)return;ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=stroke.color||'#315074';ctx.fillStyle=stroke.color||'#315074';ctx.lineCap='round';ctx.lineJoin='round';const size=(stroke.size||.003)*width;
 if(points.length===1){ctx.beginPath();ctx.arc(points[0][0]*width,points[0][1]*height,Math.max(.4,size*(.3+points[0][2])*.5),0,Math.PI*2);ctx.fill()}
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],prev=points[i-2]||a;ctx.lineWidth=Math.max(.4,size*(.3+(a[2]+b[2])/2));ctx.beginPath();ctx.moveTo((prev[0]+a[0])/2*width,(prev[1]+a[1])/2*height);ctx.quadraticCurveTo(a[0]*width,a[1]*height,(a[0]+b[0])/2*width,(a[1]+b[1])/2*height);ctx.stroke();if(i===points.length-1){ctx.beginPath();ctx.moveTo((a[0]+b[0])/2*width,(a[1]+b[1])/2*height);ctx.lineTo(b[0]*width,b[1]*height);ctx.stroke()}}
 ctx.restore();
}
function segmentDistance(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy,t=length?bounded(((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length):0;return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)}
export function hitsInk(stroke,point,width,height,radius=12){const pts=stroke.points||[],p=[point[0]*width,point[1]*height];for(let i=0;i<pts.length;i++){const a=pts[Math.max(0,i-1)],b=pts[i];if(segmentDistance(p,[a[0]*width,a[1]*height],[b[0]*width,b[1]*height])<radius+(stroke.size||.003)*width)return true}return false}
export function objectBox(item,change={}){const w=bounded(change.w??item.w??.38,.12,.95),h=bounded(change.h??item.h??.22,.07,.8);return {w,h,x:bounded(change.x??item.x??.1,0,1-w),y:bounded(change.y??item.y??.1,0,1-h)}}
export function mediaKind(file){if(/\.(png|jpe?g|webp|gif)$/i.test(file.name))return 'image';if(/\.(mp4|webm|mov|m4v)$/i.test(file.name))return 'video';return null}
