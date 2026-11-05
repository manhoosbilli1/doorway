// A bounded expression interpreter. Never executes JavaScript or accesses object properties.
export const complex=(re=0,im=0)=>({re:Object.is(Number(re),-0)?0:Number(re),im:Object.is(Number(im),-0)?0:Number(im)});
const C=v=>typeof v==='number'?complex(v):v;
const add=(a,b)=>complex(a.re+b.re,a.im+b.im),neg=a=>complex(-a.re,-a.im),sub=(a,b)=>add(a,neg(b));
const mul=(a,b)=>complex(a.re*b.re-a.im*b.im,a.re*b.im+a.im*b.re);
const div=(a,b)=>{const n=b.re*b.re+b.im*b.im;if(n<1e-300)throw Error('Division by zero');return complex((a.re*b.re+a.im*b.im)/n,(a.im*b.re-a.re*b.im)/n)};
const exp=a=>complex(Math.exp(a.re)*Math.cos(a.im),Math.exp(a.re)*Math.sin(a.im));
const ln=a=>{if(!a.re&&!a.im)throw Error('Logarithm of zero');return complex(Math.log(Math.hypot(a.re,a.im)),Math.atan2(a.im,a.re))};
const pow=(a,b)=>{if(!a.re&&!a.im){if(b.im||b.re<=0)throw Error('Undefined power');return complex(0)}return exp(mul(b,ln(a)))};
const sin=a=>complex(Math.sin(a.re)*Math.cosh(a.im),Math.cos(a.re)*Math.sinh(a.im));
const cos=a=>complex(Math.cos(a.re)*Math.cosh(a.im),-Math.sin(a.re)*Math.sinh(a.im));
const sqrt=a=>pow(a,complex(.5)),I=complex(0,1),ONE=complex(1);
const real=a=>{if(Math.abs(a.im)>1e-9)throw Error('This function needs a real number');return a.re};
const factorial=a=>{const n=real(a);if(n<0||n>170||!Number.isInteger(n))throw Error('Factorial needs an integer from 0 to 170');let v=1;for(let i=2;i<=n;i++)v*=i;return complex(v)};
const combin=(a,b,perm=false)=>{const n=real(a),r=real(b);if(!Number.isInteger(n)||!Number.isInteger(r)||r<0||n<r||n>170)throw Error('Use integers 0 ≤ r ≤ n ≤ 170');let result=1;for(let k=0;k<r;k++)result*= (n-k)/(perm?1:k+1);return complex(result)};
const functions={
 sin:([a])=>sin(a),cos:([a])=>cos(a),tan:([a])=>div(sin(a),cos(a)),
 asin:([a])=>mul(neg(I),ln(add(mul(I,a),sqrt(sub(ONE,mul(a,a)))))),
 acos:([a])=>sub(complex(Math.PI/2),functions.asin([a])),atan:([a])=>mul(complex(0,.5),sub(ln(sub(ONE,mul(I,a))),ln(add(ONE,mul(I,a))))),
 sinh:([a])=>div(sub(exp(a),exp(neg(a))),complex(2)),cosh:([a])=>div(add(exp(a),exp(neg(a))),complex(2)),tanh:([a])=>div(functions.sinh([a]),functions.cosh([a])),
 asinh:([a])=>ln(add(a,sqrt(add(mul(a,a),ONE)))),acosh:([a])=>ln(add(a,mul(sqrt(add(a,ONE)),sqrt(sub(a,ONE))))),atanh:([a])=>mul(complex(.5),ln(div(add(ONE,a),sub(ONE,a)))),
 sqrt:([a])=>sqrt(a),cbrt:([a])=>a.im?pow(a,complex(1/3)):complex(Math.cbrt(a.re)),exp:([a])=>exp(a),ln:([a])=>ln(a),log:([a,b=complex(10)])=>div(ln(a),ln(b)),
 abs:([a])=>complex(Math.hypot(a.re,a.im)),re:([a])=>complex(a.re),im:([a])=>complex(a.im),arg:([a])=>complex(Math.atan2(a.im,a.re)),conj:([a])=>complex(a.re,-a.im),
 floor:([a])=>complex(Math.floor(real(a))),ceil:([a])=>complex(Math.ceil(real(a))),round:([a])=>complex(Math.round(real(a))),sign:([a])=>complex(Math.sign(real(a))),fact:([a])=>factorial(a),
 ncr:([a,b])=>combin(a,b),npr:([a,b])=>combin(a,b,true),mod:([a,b])=>complex(real(a)%real(b)),atan2:([a,b])=>complex(Math.atan2(real(a),real(b))),
 min:args=>complex(Math.min(...args.map(real))),max:args=>complex(Math.max(...args.map(real))),hypot:args=>complex(Math.hypot(...args.map(real))),
 sum:args=>args.reduce(add,complex()),mean:args=>div(functions.sum(args),complex(args.length)),std:args=>{const vals=args.map(real),mean=vals.reduce((s,v)=>s+v,0)/vals.length;return complex(Math.sqrt(vals.reduce((s,v)=>s+(v-mean)**2,0)/vals.length))}
};
const variableNames=new Set(['x','y','z','t','a','b','c','ans','m','pi','e','i']);
export function compileExpression(source,{degrees=false}={}){
 if(typeof source!=='string'||source.length>512)throw Error('Use an expression under 512 characters');
 const text=source.replaceAll('π','pi').replaceAll('×','*').replaceAll('÷','/').replaceAll('−','-').replaceAll('²','^2').replaceAll('³','^3').trim().toLowerCase();
 const tokens=[];let at=0;
 while(at<text.length){if(/\s/.test(text[at])){at++;continue}const m=/^(?:(?:\d*\.\d+|\d+\.?\d*)(?:e[+-]?\d+)?|[a-z]+|[+\-*/^(),!%])/.exec(text.slice(at));if(!m)throw Error('Unexpected symbol near '+text.slice(at,at+12));tokens.push(m[0]);at+=m[0].length;if(tokens.length>256)throw Error('Expression is too long')}
 if(!tokens.length)throw Error('Enter an equation');let index=0,depth=0;
 const parse=(min=0)=>{if(++depth>48)throw Error('Expression is nested too deeply');let node,token=tokens[index++];
 if(token==='+'||token==='-')node={op:token==='-'?'neg':'pos',a:parse(30)};
 else if(token==='('){node=parse();if(tokens[index++]!==')')throw Error('Missing closing parenthesis')}
 else if(token&&/^(\d|\.)/.test(token))node={value:complex(Number(token))};
 else if(token&&/^[a-z]+$/.test(token)){
  if(tokens[index]==='('&&Object.hasOwn(functions,token)||['diff','integral'].includes(token)&&tokens[index]==='('){index++;const args=[];if(tokens[index]!==')'){do{args.push(parse());if(tokens[index]!==',')break;index++}while(true)}if(tokens[index++]!==')')throw Error('Missing closing parenthesis');if(!args.length||args.length>32)throw Error('Use 1–32 arguments');node={call:token,args}}
  else {if(!variableNames.has(token))throw Error('Unknown name: '+token);node={variable:token}}
 }else throw Error('Expected a number, function, or variable');
 while(index<tokens.length){const next=tokens[index];if(next==='!'||next==='%'){if(50<min)break;index++;node={op:next,a:node};continue}
  const implicit=next==='('||/^[a-z]/.test(next)||/^[\d.]/.test(next),op=implicit?'*':next,precedence={'+':10,'-':10,'*':20,'/':20,'^':40}[op];if(precedence==null||precedence<min)break;if(!implicit)index++;node={op,a:node,b:parse(op==='^'?precedence:precedence+1)};
 }
 depth--;return node};const ast=parse();if(index!==tokens.length)throw Error('Unexpected '+tokens[index]);
 const evaluate=(node,vars,budget)=>{if(--budget.remaining<0)throw Error('Calculation is too complex');if(node.value)return node.value;if(node.variable){const constants={pi:complex(Math.PI),e:complex(Math.E),i:I};if(Object.hasOwn(constants,node.variable))return constants[node.variable];if(!Object.hasOwn(vars,node.variable))throw Error('Set a value for '+node.variable);return C(vars[node.variable])}
 if(node.call){if(node.call==='diff'||node.call==='integral'){
  if(node.args.length!==(node.call==='diff'?2:3))throw Error(node.call==='diff'?'Use diff(expression, x value)':'Use integral(expression, lower, upper)');
  const a=real(evaluate(node.args[1],vars,budget));if(node.call==='diff'){const h=1e-5*Math.max(1,Math.abs(a));return div(sub(evaluate(node.args[0],{...vars,x:a+h},budget),evaluate(node.args[0],{...vars,x:a-h},budget)),complex(2*h))}
  const b=real(evaluate(node.args[2],vars,budget)),steps=128,h=(b-a)/steps;let out=complex();for(let n=0;n<=steps;n++)out=add(out,mul(complex(n===0||n===steps?1:n%2?4:2),evaluate(node.args[0],{...vars,x:a+n*h},budget)));return mul(out,complex(h/3));
 }
 const args=node.args.map(n=>evaluate(n,vars,budget));const two=['ncr','npr','mod','atan2'];if(two.includes(node.call)&&args.length!==2)throw Error(node.call+' needs two arguments');if(![...two,'log','sum','mean','std','min','max','hypot'].includes(node.call)&&args.length!==1)throw Error(node.call+' needs one argument');if(degrees&&['sin','cos','tan'].includes(node.call))args[0]=mul(args[0],complex(Math.PI/180));let out=functions[node.call](args);if(degrees&&['asin','acos','atan','atan2','arg'].includes(node.call))out=mul(out,complex(180/Math.PI));return out}
 const a=evaluate(node.a,vars,budget);if(node.op==='neg')return neg(a);if(node.op==='pos')return a;if(node.op==='!')return factorial(a);if(node.op==='%')return div(a,complex(100));const b=evaluate(node.b,vars,budget);return {'+':add,'-':sub,'*':mul,'/':div,'^':pow}[node.op](a,b)};
 return (vars={},budget={remaining:20000})=>{const result=evaluate(ast,vars,budget);if(!Number.isFinite(result.re)||!Number.isFinite(result.im))throw Error('Result is outside the numerical range');return result};
}
export function calculate(source,vars={},options){return compileExpression(source,options)(vars)}
export function formatNumber(value){const a=C(value);const fmt=n=>Math.abs(n)<1e-12?'0':Number(n.toPrecision(11)).toString();if(Math.abs(a.im)<1e-12)return fmt(a.re);return (Math.abs(a.re)<1e-12?'':fmt(a.re)+(a.im<0?' − ':' + '))+(a.re===0&&a.im<0?'-':'')+(Math.abs(Math.abs(a.im)-1)<1e-12?'':fmt(Math.abs(a.im)))+'i'}
