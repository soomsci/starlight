const $ = id => document.getElementById(id);
const slider = $('radius');
let radius = Number(slider.value);
let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
let phase = 0;
let previousTime = 0;
let view = 'area';
const fmt = n => Number(n.toFixed(2)).toString();
function surface(canvas) {
  const box = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  if (canvas.width !== Math.round(box.width*dpr) || canvas.height !== Math.round(box.height*dpr)) {
    canvas.width = Math.round(box.width*dpr); canvas.height = Math.round(box.height*dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,box.width,box.height);
  return {ctx,w:box.width,h:box.height};
}
function drawScene() {
  if (view !== 'sphere') return;
  const {ctx,w,h} = surface($('scene'));
  const scale = Math.min(w*.32,h*.29)/radius;
  const origin = [w*.43,h*.48];
  function project(x,y,z) {return [origin[0]+scale*(x*.86+z*.5),origin[1]+scale*(x*.18-y*.95-z*.31)];}
  function line(points,color,width=1,close=false,fill=null) {
    ctx.beginPath();points.forEach((p,i)=>{const q=project(...p);i?ctx.lineTo(...q):ctx.moveTo(...q)});
    if(close)ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
  }
  function sphere(r,active=false) {
    const color='rgba(157,233,198,.65)';
    for(let lat=-45;lat<=45;lat+=45){const a=lat*Math.PI/180;const points=[];for(let j=0;j<=96;j++){let t=j/96*Math.PI*2;points.push([r*Math.cos(a)*Math.cos(t),r*Math.sin(a),r*Math.cos(a)*Math.sin(t)])}line(points,color,1.5)}
    for(let lon=0;lon<180;lon+=60){let a=lon*Math.PI/180;const points=[];for(let j=0;j<=96;j++){let t=j/96*Math.PI*2;points.push([r*Math.cos(t)*Math.cos(a),r*Math.sin(t),r*Math.cos(t)*Math.sin(a)])}line(points,color,1.5)}
  }
  // Fit one sphere to the viewport; area mode provides the fixed-scale comparison.
  sphere(radius,true);
  // A fixed solid angle: its spherical patch scales exactly with r².
  function direction(a,b){return [Math.cos(b)*Math.cos(a),Math.sin(b),Math.cos(b)*Math.sin(a)]}
  function patch(r) {let points=[];const a0=-.25,a1=.25,b0=-.29,b1=.29;for(let j=0;j<=16;j++)points.push(direction(a0+(a1-a0)*j/16,b0).map(x=>x*r));for(let j=0;j<=16;j++)points.push(direction(a1,b0+(b1-b0)*j/16).map(x=>x*r));for(let j=0;j<=16;j++)points.push(direction(a1-(a1-a0)*j/16,b1).map(x=>x*r));for(let j=0;j<=16;j++)points.push(direction(a0,b1-(b1-b0)*j/16).map(x=>x*r));return points}
  line(patch(radius),'#edcb7da0',1,true,'#edcb7d19');
  if(radius>1.05)line(patch(1),'#edcb7d80',1,true,'#edcb7d28');
  // Golden-angle directions provide an even distribution over the whole sphere.
  for(let i=0;i<32;i++){
    const y=1-2*(i+.5)/32,a=i*Math.PI*(3-Math.sqrt(5)),s=Math.sqrt(1-y*y),d=[s*Math.cos(a),y,s*Math.sin(a)];
    const t=((phase*.8+i*.618)%1)*radius*1.2;const p=project(...d.map(v=>v*t));
    ctx.beginPath();ctx.arc(...p,2,0,Math.PI*2);ctx.fillStyle='#e3f2c9';ctx.fill();
  }
  for(let iy=0;iy<5;iy++)for(let iz=0;iz<5;iz++){
    const d=direction(-.25+iz*.125,-.29+iy*.145);
    line([[0,0,0],d.map(v=>v*radius*1.2)],'#f4cb6480',1.2);
    const t=((phase*.8+iy*.18+iz*.15)%1)*radius*1.2,p=project(...d.map(v=>v*t));
    ctx.beginPath();ctx.arc(...p,1.9,0,Math.PI*2);ctx.fillStyle='#ffdc88';ctx.fill();
  }
  const glow=ctx.createRadialGradient(...origin,0,...origin,33);glow.addColorStop(0,'#ffe9a9cc');glow.addColorStop(.2,'#ffe18a55');glow.addColorStop(1,'#ffd87500');ctx.fillStyle=glow;ctx.fillRect(origin[0]-33,origin[1]-33,66,66);
  ctx.beginPath();ctx.arc(...origin,6,0,Math.PI*2);ctx.fillStyle='#fff1c4';ctx.fill();
  ctx.font='bold 16px "Noto Sans KR", sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff1ce';ctx.fillText('점광원',origin[0],origin[1]+32);
  const tip=project(radius,0,0);ctx.setLineDash([3,4]);ctx.strokeStyle='#ffe19b99';ctx.beginPath();ctx.moveTo(origin[0],origin[1]);ctx.lineTo(...tip);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='#f3dca2';ctx.fillText(`r = ${radius.toFixed(1)} m`,(origin[0]+tip[0])/2,origin[1]-14);
  ctx.textAlign='center';ctx.fillStyle='#bcffdd';ctx.fillText(`구의 표면적 ${fmt(radius*radius)}배`,w/2,94);
  ctx.fillStyle='#ffe39c';ctx.fillText(`같은 빛 묶음이 덮는 면적도 ${fmt(radius*radius)}배`,w/2,h-125);
  ctx.font='13px "Noto Sans KR", sans-serif';ctx.fillStyle='#d5e8df';ctx.fillText('구면은 화면에 맞춰 확대 · 실제 크기 비교는 ①에서',w/2,h-99);
}
function drawArea(id, r) {
  const {ctx,w,h}=surface($(id));
  // Both panels use the same scale, fitted together to keep the comparison large.
  const extent=Math.max(2,radius);
  const unit=Math.min((w-24)/extent,(h-24)/extent),size=unit*r,left=(w-size)/2,top=(h-size)/2;
  ctx.fillStyle='#213d4f';ctx.fillRect(left,top,size,size);
  ctx.fillStyle='#ffe397';
  for(let row=0;row<12;row++)for(let col=0;col<12;col++){
    ctx.beginPath();ctx.arc(left+(col+.5)*size/12,top+(row+.5)*size/12,Math.min(3,unit/34),0,Math.PI*2);ctx.fill();
  }
  ctx.strokeStyle='#a8c6d6';ctx.lineWidth=1.5;
  for(let i=0;i<=r;i++){
    ctx.beginPath();ctx.moveTo(left+i*unit,top);ctx.lineTo(left+i*unit,top+size);ctx.stroke();
    ctx.beginPath();ctx.moveTo(left,top+i*unit);ctx.lineTo(left+size,top+i*unit);ctx.stroke();
  }
  ctx.strokeRect(left,top,size,size);ctx.strokeStyle='#fff4b8';ctx.lineWidth=3;ctx.strokeRect(left,top,unit,unit);
}
// Stable, evenly spread samples avoid flicker while their total weight follows 1/r².
function drawSample(id,r) {
  const {ctx,w,h}=surface($(id));const count=144/(r*r);
  for(let i=0;i<Math.ceil(count);i++){
    const x=10+((i*.754877666+.15)%1)*(w-20), y=10+((i*.569840296+.31)%1)*(h-20);
    ctx.globalAlpha=Math.min(1,count-i);ctx.fillStyle='#805800';ctx.beginPath();ctx.arc(x,y,2.6,0,Math.PI*2);ctx.fill();
  }ctx.globalAlpha=1;
}
function drawGraph(){
  const {ctx,w,h}=surface($('graph'));const l=45,t=18,r=w-23,b=h-30;
  const x=d=>l+(d-1)/3*(r-l),y=i=>b-i*(b-t);
  ctx.font='12px "Noto Sans KR", sans-serif';ctx.lineWidth=1;
  [0,.25,.5,1].forEach(v=>{ctx.strokeStyle='#d8e2d2';ctx.beginPath();ctx.moveTo(l,y(v));ctx.lineTo(r,y(v));ctx.stroke();ctx.fillStyle='#4d6146';ctx.textAlign='right';ctx.fillText(`${v*100}%`,l-7,y(v)+3)});
  [1,2,3,4].forEach(v=>{ctx.textAlign='center';ctx.fillStyle='#4d6146';ctx.fillText(`${v} m`,x(v),b+19)});
  ctx.beginPath();ctx.moveTo(x(1),b);for(let d=1;d<=4.001;d+=.025)ctx.lineTo(x(d),y(1/d**2));ctx.lineTo(r,b);ctx.closePath();ctx.fillStyle='#eef4e9';ctx.fill();
  ctx.beginPath();for(let d=1;d<=4.001;d+=.025){d===1?ctx.moveTo(x(d),y(1/d**2)):ctx.lineTo(x(d),y(1/d**2))}ctx.strokeStyle='#77996a';ctx.lineWidth=2;ctx.stroke();
  const px=x(radius),py=y(1/radius**2);ctx.setLineDash([3,3]);ctx.strokeStyle='#9fb390';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px,b);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.arc(px,py,5,0,Math.PI*2);ctx.fillStyle='#48764e';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#527548';ctx.textAlign=radius>3?'right':'left';ctx.fillText(`${fmt(100/radius**2)}%`,px+(radius>3?-9:9),py+(radius<1.3?14:-9));
}
function update(){
  radius=Number(slider.value);const area=fmt(radius**2),fraction=radius===1?'1':`1/${area}`,percent=fmt(100/radius**2);
  $('hero-distance').textContent=`${fmt(radius)}배`;$('hero-area').textContent=`${area}배`;$('hero-intensity').textContent=`${fraction}배`;
  $('grid-distance').textContent=`${fmt(radius)} m`;$('grid-area').textContent=`${area}칸`;$('grid-count').textContent=`${fmt(144/radius**2)}점`;
  if(view==='area'){drawArea('area-near',1);drawArea('area-far',radius)}
  $('distance').textContent=radius.toFixed(1);$('area').textContent=area;$('fraction').textContent=`${fraction} 배`;$('percent').textContent=percent;$('meter-fill').style.width=`${percent}%`;
  $('sample-distance').textContent=`${fmt(radius)} m`;$('sample-percent').textContent=`${percent}%`;$('take-distance').textContent=fmt(radius);$('take-area').textContent=area;$('take-fraction').textContent=fraction;
  document.querySelectorAll('[data-radius]').forEach(button=>{const selected=Number(button.dataset.radius)===radius;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected))});
  drawScene();drawSample('near',1);drawSample('far',radius);drawGraph();
}
slider.addEventListener('input',update);
function setView(next){view=next;$('area-panel').hidden=next!=='area';$('sphere-panel').hidden=next!=='sphere';$('area-view').setAttribute('aria-pressed',String(next==='area'));$('sphere-view').setAttribute('aria-pressed',String(next==='sphere'));update()}
$('area-view').addEventListener('click',()=>setView('area'));
$('sphere-view').addEventListener('click',()=>setView('sphere'));
$('fullscreen').hidden=!document.fullscreenEnabled;
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{$('fullscreen').textContent='전체화면을 사용할 수 없습니다'}});
document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'⛶ 전체화면 종료':'⛶ 전체화면';update()});
document.querySelectorAll('[data-radius]').forEach(button=>button.addEventListener('click',()=>{slider.value=button.dataset.radius;update()}));
function updatePause(){$('pause').textContent=paused?'▶ 재생':'Ⅱ 일시정지';$('pause').setAttribute('aria-pressed',String(paused))}
$('pause').addEventListener('click',()=>{paused=!paused;updatePause()});
$('answer-toggle').addEventListener('click',()=>{const show=$('answer').hidden;$('answer').hidden=!show;$('answer-toggle').setAttribute('aria-expanded',String(show));$('answer-toggle').textContent=show?'정답 닫기 −':'정답 보기 ＋'});
new ResizeObserver(update).observe(document.querySelector('.workspace'));
window.addEventListener('resize',update);
function animate(time){if(!paused){phase+=Math.min((time-previousTime)/1000,.05);drawScene()}previousTime=time;requestAnimationFrame(animate)}
update();updatePause();requestAnimationFrame(animate);
