/* Sol & the Beanstalk 2 — arcade interaction and procedural Web Audio.
   Runs after the embedded PsychedelicGarden-derived renderer. No external libraries. */
(function(){
"use strict";
const $=id=>document.getElementById(id),engine=window.SkyEngine,C=window.SkyCore;
if(!engine||!C)throw Error("The game engine and core must load before play.js.");
const roomNames=["THE FIRST THREAD","THE BORROWED CHAIN","THE CRYSTAL LUNG","THE GIANT'S PIN"];
let started=false,soundOn=false,ctx=null,drone=null,lastFire=0,timeout=0,startedAt=0;
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function note(f,d=.30,vol=.10,type="sine",when=0){
 if(!ctx||!soundOn)return;
 const at=ctx.currentTime+when,osc=ctx.createOscillator(),gain=ctx.createGain();
 osc.type=type;osc.frequency.setValueAtTime(f,at);gain.gain.setValueAtTime(.0001,at);
 gain.gain.exponentialRampToValueAtTime(vol,at+.016);
 gain.gain.exponentialRampToValueAtTime(.0001,at+d);
 osc.connect(gain).connect(ctx.destination);osc.start(at);osc.stop(at+d+.02);
}
function sequence(offset=0){
 if(!ctx||!soundOn)return;
 const s=engine.state,r=s.room,scale=[0,2,4,7,9,12];
 const idx=(s.shots[r]+offset)%scale.length;
 const freq=220*Math.pow(2,(scale[idx]+r*2)/12);
 note(freq,.32,.09,"triangle");note(freq*1.5,.34,.045,"sine",.07);
 note(freq*2,.43,.03,"sine",.14);
}
function snapSound(){
 if(!ctx||!soundOn)return;
 const when=ctx.currentTime,osc=ctx.createOscillator(),gain=ctx.createGain();
 osc.type="sawtooth";osc.frequency.setValueAtTime(196,when);
 osc.frequency.exponentialRampToValueAtTime(42,when+.40);
 gain.gain.setValueAtTime(.0001,when);
 gain.gain.exponentialRampToValueAtTime(.16,when+.012);
 gain.gain.exponentialRampToValueAtTime(.0001,when+.45);
 osc.connect(gain).connect(ctx.destination);osc.start(when);osc.stop(when+.46);
 note(110,.42,.10,"triangle",.09);
}
function startSound(){
 if(!soundOn)return;
 if(!ctx){
  try{ctx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){soundOn=false;return;}
  const a=ctx.createOscillator(),b=ctx.createOscillator(),gain=ctx.createGain(),lp=ctx.createBiquadFilter();
  a.type="sine";b.type="triangle";a.frequency.value=65.4;b.frequency.value=130.8;
  lp.type="lowpass";lp.frequency.value=380;gain.gain.value=.014;
  a.connect(lp);b.connect(lp);lp.connect(gain);gain.connect(ctx.destination);
  a.start();b.start();drone={a,b,gain,lp};
 }
 if(ctx.state==="suspended")ctx.resume().catch(()=>{});
 if(drone)drone.gain.gain.setTargetAtTime(.014,ctx.currentTime,.15);
}
function setSound(on){
 soundOn=!!on;
 if(soundOn)startSound();
 else if(ctx&&drone)drone.gain.gain.setTargetAtTime(.0001,ctx.currentTime,.10);
 $("b-sound").textContent=soundOn?"♫ SOUND ON":"♫ SOUND OFF";
 $("b-sound").setAttribute("aria-pressed",String(soundOn));
}
function updateDrone(){
 if(!ctx||!drone||!soundOn)return;
 const p=engine.state.pressure,at=ctx.currentTime;
 drone.a.frequency.setTargetAtTime(67-p*26,at,.08);
 drone.b.frequency.setTargetAtTime(135-p*42,at,.08);
 drone.lp.frequency.setTargetAtTime(600-p*430,at,.10);
 drone.gain.gain.setTargetAtTime(.011+p*.014,at,.10);
}
function notify(message,seconds=3){
 $("notice").textContent=message;
 $("notice").classList.add("show");
 clearTimeout(timeout);
 timeout=setTimeout(()=>$("notice").classList.remove("show"),seconds*1000);
}
function pulseFlash(){
 $("flash").classList.add("snap");
 setTimeout(()=>$("flash").classList.remove("snap"),130);
}
function updateHud(){
 const s=engine.state,i=s.room,d=C.ROOMS[i],p=clamp(s.pressure,0,1);
 $("chapter").textContent=String(i+1).padStart(2,"0")+" / 04  ·  "+roomNames[i];
 $("roomname").textContent=d.name;
 $("roomstory").textContent=d.lines[i===0&&s.shots[i]===0?0:1];
 $("pressure").textContent=Math.round(p*100)+"%";
 $("stress-fill").style.width=(100*p).toFixed(0)+"%";
 $("stress-fill").style.filter=p>.65?"drop-shadow(0 0 7px #ff6558)":"";
 $("grown").textContent=s.shots[i]+" / "+d.need+" VINES";
 $("root-count").textContent=s.roots;
 const danger=p>=C.SNAP*.90,warning=p>=C.WARN;
 $("game-hud").classList.toggle("warning",warning&&!danger);
 $("game-hud").classList.toggle("critical",danger);
 let message=p>.78?"PIN NEAR FAILURE · the metal is crying out":p>=C.WARN?"THE CHAIN IS SAGGING · its pitch is falling":s.rooted[i]?"ROOTS SHARING THE LOAD":s.shots[i]?"THE HOOK IS CARRYING NEW GROWTH":"THE PIN IS QUIET FOR NOW";
 $("pin-message").textContent=message;
 const ready=C.ready(s);
 $("follow").disabled=!ready||s.completed;
 $("follow").classList.toggle("ready",ready&&!s.completed);
 $("fire").disabled=ready||s.completed;
 $("root").disabled=s.rooted[i]||s.roots===0||s.pressure<.30||s.completed;
 if(s.completed){$("mission").textContent="THIS SKY REMEMBERS YOUR CHOICE.";return;}
 if(ready){
   $("mission").textContent=i===3?"THE KEEPER WAITS · PRESS F TO REACH HIM":"PATH SAFE ENOUGH · PRESS F TO LAUNCH TO THE NEXT CHAMBER";
 }else if(s.shots[i]>=d.need&&!s.rooted[i]){
   $("mission").textContent="YOUR VINES ARE READY, BUT THE PIN ISN'T. PLANT A ROOT [R].";
 }else if(warning&&!s.rooted[i]){
   $("mission").textContent="WARNING: THE LOAD IS REAL. ROOT THE SUPPORT [R] BEFORE SHOOTING MORE.";
 }else{
   $("mission").textContent="FIRE "+(d.need-s.shots[i])+" MORE "+(d.need-s.shots[i]===1?"VINE":"VINES")+" · SPACE OR CLICK · THEN FOLLOW [F]";
 }
}
function dispatch(verb){
 if(!started||!engine.ready)return;
 const now=performance.now();
 if(verb==="shoot"){
  if(now-lastFire<200)return;
  lastFire=now;
 }
 const result=engine.dispatch(verb);
 if(!result.ok){notify(result.message,2.7);if(verb==="shoot")note(165,.14,.05);return;}
 updateHud();
 switch(result.event){
  case "growth":sequence();notify(result.message,2);break;
  case "strain":sequence();note(108,.42,.065);notify(result.message,3.2);break;
  case "snap":snapSound();pulseFlash();notify(result.message,4.0);break;
  case "root":sequence(2);notify(result.message,3.0);break;
  case "open":sequence(3);notify(result.message,3.0);break;
  case "travel":sequence(4);notify(result.message,2.4);break;
  case "summit":sequence(5);showEnding();break;
  case "ending":sequence(5);showEnding();break;
 }
}
function showEnding(){
 $("ending").hidden=false;
 const s=engine.state;
 const duration=startedAt?Math.max(0,Math.floor((Date.now()-startedAt)/1000)):0;
 $("run-summary").textContent="WORLD SEED "+engine.seed+" · "+Math.floor(duration/60)+"m "+String(duration%60).padStart(2,"0")+"s · "+s.breaks+" BROKEN CHAINS";
 if(s.completed){
  $("end-choices").hidden=true;
  $("epilogue").hidden=false;
  $("epilogue").textContent=s.choice==="hold"?
    "You plant the last root beneath the keeper. Weight spreads into a thousand smaller hands. Below you, a new climber sees only flowers—and a path that holds.":
    "You lift the oldest pin. The sky does not fall; it rearranges. Some paths disappear. Seeds scatter across the cloud sea, and a different world begins.";
  $("another").hidden=false;
 }
}
function enter(){
 if(!engine.ready)return;
 started=true;startedAt=Date.now();
 $("intro").hidden=true;
 $("boot").classList.add("gone");
 setSound(true);
 if(engine.state.completed){showEnding();return;}
 updateHud();
 notify("Shoot a vine with SPACE or the FIRE button. It grows immediately.",4);
 sequence();
}
function fresh(seed){engine.resetSeed(seed>>>0);}
function randomSeed(){
 if(window.crypto&&crypto.getRandomValues){
  const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0];
 }
 return (Date.now()*2654435761)>>>0;
}
$("begin").addEventListener("click",enter);
$("fire").addEventListener("click",()=>dispatch("shoot"));
$("root").addEventListener("click",()=>dispatch("root"));
$("follow").addEventListener("click",()=>dispatch("cross"));
$("choice-hold").addEventListener("click",()=>dispatch("hold"));
$("choice-release").addEventListener("click",()=>dispatch("release"));
$("another").addEventListener("click",()=>fresh(randomSeed()));
$("b-new").addEventListener("click",()=>fresh(randomSeed()));
$("b-daily").addEventListener("click",()=>fresh(C.dailySeed(new Date())));
$("b-sound").addEventListener("click",()=>setSound(!soundOn));
$("b-photo").addEventListener("click",()=>{
 window.skyPhotoRequested=true;notify("Capturing a screenshot of the living sky…",1.7);
});
window.addEventListener("skyready",()=>{
 $("begin").disabled=false;
 $("begin").innerHTML="ENTER THE GARDEN <span>✦</span>";
 $("loader").textContent="READY · WORLD SEED "+engine.seed+" · mouse/keyboard and touch supported";
});
if(engine.ready)window.dispatchEvent(new Event("skyready"));
window.addEventListener("skyaction",()=>updateHud());
window.addEventListener("skychange",()=>{
 updateHud();sequence(2);
 notify("CHAPTER "+(engine.state.room+1)+" · "+C.ROOMS[engine.state.room].subtitle,3.6);
});
window.addEventListener("keydown",e=>{
 if(!started||e.repeat||engine.state.completed||!$("ending").hidden)return;
 if(["Space","KeyR","KeyF","KeyP"].includes(e.code))e.preventDefault();
 if(e.code==="Space")dispatch("shoot");
 if(e.code==="KeyR")dispatch("root");
 if(e.code==="KeyF")dispatch("cross");
 if(e.code==="KeyP")$("b-photo").click();
});
let pointer=null;
const canvas=$("gl");
canvas.addEventListener("pointerdown",e=>{if(e.button!==0)return;pointer={x:e.clientX,y:e.clientY};});
canvas.addEventListener("pointerup",e=>{
 if(!pointer)return;
 const d=Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y);
 pointer=null;
 if(started&&d<12&&e.button===0)dispatch("shoot");
});
canvas.addEventListener("pointercancel",()=>pointer=null);
for(const button of document.querySelectorAll("#touch-pad [data-key]")){
 const key=button.dataset.key;
 button.addEventListener("pointerdown",e=>{
  e.preventDefault();engine.setKey(key,true);button.setPointerCapture(e.pointerId);
 });
 for(const event of ["pointerup","pointercancel","lostpointercapture"]){
  button.addEventListener(event,()=>engine.setKey(key,false));
 }
}
const ambience=setInterval(updateDrone,180);
document.addEventListener("visibilitychange",()=>{
 if(ctx&&drone){
  const g=(!document.hidden&&soundOn)?(.011+engine.state.pressure*.014):.0001;
  drone.gain.gain.setTargetAtTime(g,ctx.currentTime,.10);
 }
});
updateHud();
window.SkyPlay={get started(){return started;},dispatch,enter,showEnding,updateHud};
})();
