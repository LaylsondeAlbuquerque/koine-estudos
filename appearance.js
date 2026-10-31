const THEME_KEY='koine-theme-v1';
export const getTheme=()=>document.documentElement.dataset.theme==='light'?'light':'dark';
export function toggleTheme(){
 const next=getTheme()==='dark'?'light':'dark';
 document.documentElement.dataset.theme=next;
 document.querySelector('meta[name="theme-color"]')?.setAttribute('content',next==='dark'?'#0c1018':'#f5f7f9');
 try{localStorage.setItem(THEME_KEY,next);}catch{}
 window.dispatchEvent(new Event('koine-theme-change'));
 return next;
}

let dispose=()=>{};
let manualPause=null;
export function mountHomeMotion(){
 dispose();dispose=()=>{};
 const stage=document.querySelector('.home-hero'),canvas=document.querySelector('#home-motion');
 if(!stage||!canvas)return;
 const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const toggle=stage.querySelector('[data-motion-toggle]');
 let width=0,height=0,particles=[],raf=0,last=0,time=0,visible=true,alive=true,mouseX=0,mouseY=0,tiltX=0,tiltY=0;
 let seed=73421;
 const random=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
 const paused=()=>manualPause??reduced.matches;
 const syncButton=()=>{if(!toggle)return;toggle.setAttribute('aria-pressed',String(paused()));toggle.setAttribute('aria-label',paused()?'Retomar animação':'Pausar animação');toggle.innerHTML=`<span aria-hidden="true">${paused()?'▶':'Ⅱ'}</span><span>${paused()?'Retomar animação':'Pausar animação'}</span>`;};
 function resize(){
  const rect=stage.getBoundingClientRect();width=rect.width;height=rect.height;
  const ratio=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
  seed=73421;const count=width<600?850:1800;particles=[];
  for(let i=0;i<count;i++){
   const y=1-(i/(count-1))*2,angle=i*Math.PI*(3-Math.sqrt(5)),radial=Math.sqrt(1-y*y),shell=i%4===0?.54+random()*.43:1;
   particles.push({x:Math.cos(angle)*radial*shell,y:y*shell,z:Math.sin(angle)*radial*shell,angle,phase:random()*Math.PI*2,size:.65+random()*1.15,light:random()});
  }
  draw();
 }
 function draw(){
  if(!width||!height)return;
  ctx.clearRect(0,0,width,height);
  const dark=getTheme()==='dark',radius=Math.min(width*.35,height*.43,263),centerX=width*.5,centerY=height*.49;
  const turn=time*.115+tiltX*.26,rx=-.23+tiltY*.18,cy=Math.cos(turn),sy=Math.sin(turn),cx=Math.cos(rx),sx=Math.sin(rx);
  const morph=(Math.sin(time*.19)-.2)*.12;
  const points=[];
  for(const p of particles){
   const pulse=1+.075*Math.sin(p.angle*3+time*.55+p.y*4)+.045*Math.cos(p.phase+time*.8);
   const twist=.14*Math.sin(p.y*5+time*.38);
   let x=(p.x*Math.cos(twist)-p.z*Math.sin(twist))*pulse;
   let z=(p.x*Math.sin(twist)+p.z*Math.cos(twist))*pulse;
   let y=p.y*(1+.05*Math.sin(time*.5+p.angle));
   x+=morph*Math.sin(p.angle*2+p.phase);y+=morph*.6*Math.cos(p.angle*3+time*.2);
   const xx=x*cy+z*sy,zz=-x*sy+z*cy,yy=y*cx-zz*sx,depth=y*sx+zz*cx,scale=1/(1+depth*.22);
   const front=(1-depth)*.5,size=p.size*(.75+front*.9)*scale;
   points.push({x:centerX+xx*radius*scale,y:centerY+yy*radius*scale,z:depth,size,alpha:(.1+front*.64)*(dark?1:.7),light:p.light});
  }
  points.sort((a,b)=>b.z-a.z);
  for(const p of points){
   const r=Math.round(69+p.light*72),g=Math.round(91+p.light*58),b=dark?255:225;
   ctx.fillStyle=`rgba(${r},${g},${b},${p.alpha})`;
   ctx.fillRect(p.x,p.y,p.size,p.size);
   if(p.size>1.8){ctx.fillStyle=`rgba(153,170,255,${p.alpha*.38})`;ctx.fillRect(p.x,p.y,p.size,p.size*.3);}
  }
 }
 function frame(now){
  if(!alive||paused()||!visible||document.hidden){raf=0;return;}
  raf=requestAnimationFrame(frame);
  if(last&&now-last<32)return;
  const delta=last?Math.min((now-last)/1000,.05):0;last=now;time+=delta;
  tiltX+=(mouseX-tiltX)*.045;tiltY+=(mouseY-tiltY)*.045;draw();
 }
 const resume=()=>{if(!raf&&!paused()&&visible&&!document.hidden&&alive){last=0;raf=requestAnimationFrame(frame);}};
 const stop=()=>{if(raf)cancelAnimationFrame(raf);raf=0;};
 const handleToggle=()=>{manualPause=!paused();syncButton();if(paused())stop();else resume();};
 const handlePreference=()=>{syncButton();if(paused()){stop();draw();}else resume();};
 const handleVisibility=()=>{if(document.hidden)stop();else resume();};
 const handlePointer=event=>{const rect=stage.getBoundingClientRect();mouseX=(event.clientX-rect.left)/width-.5;mouseY=(event.clientY-rect.top)/height-.5;};
 const leave=()=>{mouseX=0;mouseY=0;};
 const observer=new ResizeObserver(resize);observer.observe(stage);
 const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)resume();else stop();},{threshold:0});intersection.observe(stage);
 stage.addEventListener('pointermove',handlePointer,{passive:true});stage.addEventListener('pointerleave',leave);
 document.addEventListener('visibilitychange',handleVisibility);window.addEventListener('koine-theme-change',draw);reduced.addEventListener('change',handlePreference);toggle?.addEventListener('click',handleToggle);
 resize();syncButton();resume();
 dispose=()=>{alive=false;stop();observer.disconnect();intersection.disconnect();stage.removeEventListener('pointermove',handlePointer);stage.removeEventListener('pointerleave',leave);document.removeEventListener('visibilitychange',handleVisibility);window.removeEventListener('koine-theme-change',draw);reduced.removeEventListener('change',handlePreference);toggle?.removeEventListener('click',handleToggle);};
}
