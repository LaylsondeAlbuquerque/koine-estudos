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
 const toggle=stage.querySelector('[data-motion-toggle]'),copyElement=stage.querySelector('.hero-copy'),bottomElement=stage.querySelector('.hero-bottom'),header=document.querySelector('.site-header');
 let width=0,height=0,letters=[],points=[],copyBounds=null,motionTop=95,motionBottom=0,raf=0,last=0,time=0,visible=true,alive=true,mouseX=0,mouseY=0,tiltX=0,tiltY=0,pointerX=0,pointerY=0,pointerDirty=false;
 const glyphWidths=new Map(),occupied=[];
 const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
 const alphabet=Array.from('αβγδεζηθικλμνξοπρστυφχψω');
 const accented=['ἀ','ἑ','ἦ','ἰ','ὁ','ὑ','ὦ','ᾶ','ῆ','ῖ','ῦ','ῷ','᾿','῾','῀','ς'];
 const words=['λόγος','χάρις','ἀγάπη','γραφή'];
 let seed=73421;
 const random=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
 const paused=()=>manualPause??reduced.matches;
 const syncButton=()=>{if(!toggle)return;toggle.setAttribute('aria-pressed',String(paused()));toggle.setAttribute('aria-label',paused()?'Retomar animação':'Pausar animação');toggle.innerHTML=`<span aria-hidden="true">${paused()?'▶':'Ⅱ'}</span><span>${paused()?'Retomar animação':'Pausar animação'}</span>`;};
 // Font advances scale with the glyph size; measure once and refresh after the web font loads.
 function measureGlyphs(){
  ctx.font='100px DidotGreek, Georgia, serif';
  for(const p of letters){
   if(!glyphWidths.has(p.glyph))glyphWidths.set(p.glyph,ctx.measureText(p.glyph).width/100);
   p.widthRatio=glyphWidths.get(p.glyph);
  }
 }
 function resize(){
  const rect=stage.getBoundingClientRect();width=rect.width;height=rect.height;
  const ratio=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
  copyBounds=copyElement?{left:copyElement.offsetLeft-12,right:copyElement.offsetLeft+copyElement.offsetWidth+12,top:copyElement.offsetTop-8,bottom:copyElement.offsetTop+copyElement.offsetHeight+8}:null;
  motionTop=header?Math.max(95,header.offsetHeight+14):95;motionBottom=bottomElement?bottomElement.offsetTop-14:height-90;
  seed=73421;const counts=width<600?[12,8,2]:[24,16,5];letters=[];
  for(let ring=0;ring<counts.length;ring++)for(let i=0;i<counts[ring];i++){
   const collection=ring===0?alphabet:ring===1?accented:words;
   letters.push({ring,band:i%2,angle:i/counts[ring]*Math.PI*2+ring*.61,phase:random()*Math.PI*2,glyph:collection[i%collection.length],baseSize:17+random()*14,light:random(),box:{},x:0,y:0,z:0,size:0,alpha:0,widthRatio:0});
  }
  points=letters.slice();ctx.textAlign='center';ctx.textBaseline='middle';measureGlyphs();
  draw();
 }
 function draw(){
  if(!width||!height)return;
  ctx.clearRect(0,0,width,height);
  const dark=getTheme()==='dark',mobile=width<600,centerX=width*.5,centerY=height*.49;
  const radiusX=mobile?width*.43:Math.min(width*.43,540),radiusY=Math.min(height*(mobile?.39:.38),300);
  for(const p of letters){
   const angle=p.angle+time*(p.ring===1?-.055:.07),depth=Math.sin(angle+p.ring*.8),scale=.85+(depth+1)*.1;
   p.z=depth;
   if(mobile&&copyBounds){
    // Use the space around the copy: an ellipse otherwise hides most glyphs on narrow screens.
    const top=p.band?copyBounds.bottom+10:motionTop,bottom=p.band?motionBottom:copyBounds.top-10;
    p.size=Math.min((p.ring===2?24:p.baseSize+7)*scale,(bottom-top)/1.65);
    if(p.size<18){p.alpha=0;continue;}
    const track=width+140,direction=p.band?-1:1;
    p.x=((p.angle/(Math.PI*2)*track+time*direction*20)%track+track)%track-70;
    p.y=(top+bottom)/2+Math.sin(time*.65+p.phase)*Math.min(8,(bottom-top-p.size*1.6)/2);
    p.alpha=(.72+(depth+1)*.1)*(dark?1:.9);
   }else{
    p.x=centerX+Math.cos(angle)*radiusX*(1-p.ring*.105)+Math.sin(time*.24+p.phase)*7+tiltX*14;
    p.y=centerY+Math.sin(angle)*radiusY*(1-p.ring*.07)+Math.cos(angle*2+p.phase)*18+tiltY*9;
    p.size=(p.ring===2?22:p.baseSize)*scale;
    p.alpha=(.5+(depth+1)*.2)*(dark?1:.82);
   }
  }
  points.sort((a,b)=>b.z-a.z);
  occupied.length=0;
  for(const p of points){
   if(!p.alpha)continue;
   const half=p.widthRatio*p.size*.5+7;
   const x=Math.max(half+16,Math.min(width-half-16,p.x)),y=p.y;
   const box=p.box;box.left=x-half;box.right=x+half;box.top=y-p.size*.85;box.bottom=y+p.size*.75;
   if(y<(mobile?motionTop:115)||y>(mobile?motionBottom:height-100)||copyBounds&&overlaps(box,copyBounds)||occupied.some(other=>overlaps(box,other)))continue;
   occupied.push(box);
   const gap=copyBounds?Math.hypot(Math.max(copyBounds.left-box.right,box.left-copyBounds.right,0),Math.max(copyBounds.top-box.bottom,box.top-copyBounds.bottom,0)):40;
   const r=dark?Math.round((mobile?156:132)+p.light*53):65,g=dark?Math.round((mobile?177:155)+p.light*38):81,b=dark?255:162;
   ctx.font=`${p.size}px DidotGreek, Georgia, serif`;ctx.fillStyle=`rgba(${r},${g},${b},${p.alpha*Math.min(gap/16,1)})`;ctx.fillText(p.glyph,x,y);
  }
 }
 function frame(now){
  if(!alive||paused()||!visible||document.hidden){raf=0;return;}
  raf=requestAnimationFrame(frame);
  if(last&&now-last<32)return;
  const delta=last?Math.min((now-last)/1000,.05):0;last=now;time+=delta;
  if(pointerDirty){const rect=stage.getBoundingClientRect();mouseX=(pointerX-rect.left)/width-.5;mouseY=(pointerY-rect.top)/height-.5;pointerDirty=false;}
  tiltX+=(mouseX-tiltX)*.045;tiltY+=(mouseY-tiltY)*.045;draw();
 }
 const resume=()=>{if(!raf&&!paused()&&visible&&!document.hidden&&alive){last=0;raf=requestAnimationFrame(frame);}};
 const stop=()=>{if(raf)cancelAnimationFrame(raf);raf=0;};
 const handleToggle=()=>{manualPause=!paused();syncButton();if(paused())stop();else resume();};
 const handlePreference=()=>{syncButton();if(paused()){stop();draw();}else resume();};
 const handleVisibility=()=>{if(document.hidden)stop();else resume();};
 const handlePointer=event=>{pointerX=event.clientX;pointerY=event.clientY;pointerDirty=true;};
 const leave=()=>{pointerDirty=false;mouseX=0;mouseY=0;};
 const observer=new ResizeObserver(resize);observer.observe(stage);if(copyElement)observer.observe(copyElement);
 const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)resume();else stop();},{threshold:0});intersection.observe(stage);
 stage.addEventListener('pointermove',handlePointer,{passive:true});stage.addEventListener('pointerleave',leave);
 document.addEventListener('visibilitychange',handleVisibility);window.addEventListener('koine-theme-change',draw);reduced.addEventListener('change',handlePreference);toggle?.addEventListener('click',handleToggle);
 resize();syncButton();resume();
 document.fonts.load('24px DidotGreek','ἀλφάβητος ᾶ ῷ').then(()=>{if(alive){glyphWidths.clear();measureGlyphs();draw();}}).catch(()=>{});
 dispose=()=>{alive=false;stop();observer.disconnect();intersection.disconnect();stage.removeEventListener('pointermove',handlePointer);stage.removeEventListener('pointerleave',leave);document.removeEventListener('visibilitychange',handleVisibility);window.removeEventListener('koine-theme-change',draw);reduced.removeEventListener('change',handlePreference);toggle?.removeEventListener('click',handleToggle);};
}
