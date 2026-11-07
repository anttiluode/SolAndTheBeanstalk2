/* Storm Climber: controls, synthesized sound, accessible menus and fixed-step loop. */
(function(){
'use strict';
const C=window.ClimbCore,$=id=>document.getElementById(id),canvas=$('world');
let renderer;
try{renderer=window.ClimbRender.create(canvas);}catch(e){$('error-message').textContent=e.message;$('error-screen').hidden=false;return;}
const KEY='sol-storm-record-v1';
let record;try{record=C.validateRecord(JSON.parse(localStorage.getItem(KEY)));}catch(_){record=C.validateRecord(null);}
const rawSeed=new URLSearchParams(location.hash.slice(1)).get('seed');
const validSeed=rawSeed!==null&&/^\d{1,10}$/.test(rawSeed)&&Number(rawSeed)<=4294967295;
let seed=validSeed?Number(rawSeed):C.dailySeed(),state=C.create(seed),started=false,deathSaved=false;
let accum=0,last=0,viewMode='menu',lastRegion=0,toastTimer=0,audio=null,soundOn=false,soundChosen=false;
const keys=new Set(),edges={jump:false,dash:false};let mouseGrapple=false,drag=null;
let touch=matchMedia('(pointer: coarse)').matches||navigator.maxTouchPoints>0;
document.body.classList.toggle('touch',touch);
function clearInput(){keys.clear();edges.jump=false;edges.dash=false;mouseGrapple=false;drag=null;}
function note(freq,duration=.18,volume=.035,delay=0,type='triangle'){
 if(!soundOn||!audio||audio.state!=='running')return;
 const osc=audio.createOscillator(),gain=audio.createGain(),t=audio.currentTime+delay;
 osc.type=type;osc.frequency.setValueAtTime(freq,t);gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(volume,t+.012);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
 osc.connect(gain).connect(audio.destination);osc.start(t);osc.stop(t+duration+.02);osc.onended=()=>{osc.disconnect();gain.disconnect();};
}
function setSound(on){soundOn=on;if(on){try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});}catch(_){soundOn=false;}}
 $('sound').textContent=soundOn?'SOUND ON':'SOUND OFF';$('sound').setAttribute('aria-pressed',String(soundOn));}
function notify(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2300);}
function bestMenu(){$('menu-best').textContent=record.height.toLocaleString()+' m';$('menu-score').textContent=record.score.toLocaleString()+' pts';}
function hideOverlays(){for(const id of ['pause-screen','death-screen','upgrade-screen'])$(id).hidden=true;}
function start(next=seed){
 seed=next>>>0;state=C.create(seed);started=true;deathSaved=false;viewMode='playing';lastRegion=0;accum=0;clearInput();hideOverlays();
 renderer.camera.yaw=0;renderer.camera.pitch=.35;renderer.camera.distance=14;
 $('menu').hidden=true;$('hud').hidden=false;$('pause').hidden=false;$('touch-controls').hidden=!touch;$('toast').classList.remove('show');
 try{history.replaceState(null,'',location.pathname+location.search+'#seed='+seed);}catch(_){}
 if(!soundChosen)setSound(true);else if(soundOn)audio?.resume().catch(()=>{});
 note(330,.3);note(495,.4,.03,.1);hud();
}
function menu(){
 started=false;viewMode='menu';clearInput();hideOverlays();state=C.create(seed);accum=0;renderer.camera.yaw=-.28;renderer.camera.distance=22;
 $('menu').hidden=false;$('hud').hidden=true;$('pause').hidden=true;$('touch-controls').hidden=true;document.body.classList.remove('danger');bestMenu();
}
function pause(){if(!started||state.mode!=='playing')return;state.mode='paused';viewMode='paused';clearInput();$('pause-screen').hidden=false;$('touch-controls').hidden=true;audio?.suspend().catch(()=>{});}
function resume(){if(state.mode!=='paused')return;clearInput();state.mode='playing';viewMode='playing';accum=0;$('pause-screen').hidden=true;$('touch-controls').hidden=!touch;if(soundOn)audio?.resume().catch(()=>{});}
function randomSeed(){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0];}
function showDeath(){
 if(deathSaved)return;deathSaved=true;clearInput();viewMode='dead';$('death-screen').hidden=false;$('touch-controls').hidden=true;
 const total=C.score(state),newBest=total>record.score;
 record={score:Math.max(record.score,total),height:Math.max(record.height,Math.floor(state.height)),runs:record.runs+1};
 try{localStorage.setItem(KEY,JSON.stringify(record));}catch(_){}
 $('death-label').textContent=newBest?'A NEW PERSONAL BEST':'THE STORM CAUGHT YOU';
 $('result-height').textContent=Math.floor(state.height).toLocaleString();$('result-score').textContent=total.toLocaleString();$('result-combo').textContent=state.bestCombo+'×';
 $('death-tip').textContent=state.progress<2?'Hold E to catch the glowing flower. Release above the island, then land to recharge.':state.progress<6?'Tap Space again in midair. Save your dash for a gap you cannot quite reach.':'Fast landings build your multiplier. Golden side islands are worth five crystals—but cost time.';
 $('seed-line').textContent='SEED '+seed+' · '+Math.floor(state.time)+' SECONDS · R TO RETRY';
 note(220,.5,.045);note(165,.6,.03,.12);note(110,.7,.025,.25);bestMenu();
}
const icons={spring:'↟',vine:'❧',dash:'⇢',magnet:'✧',calm:'◌',rhythm:'∞'};
function showUpgrades(){
 clearInput();viewMode='upgrade';$('upgrade-screen').hidden=false;$('touch-controls').hidden=true;
 const options=$('upgrade-options');options.replaceChildren();state.offers.forEach((id,i)=>{
  const d=C.UPGRADES[id],button=document.createElement('button');
  const icon=document.createElement('span');icon.className='upgrade-icon';icon.textContent=icons[id];
  const tag=document.createElement('small');tag.textContent=(i+1)+' / '+d.tag;
  const title=document.createElement('strong');title.textContent=d.name;
  const text=document.createElement('p');text.textContent=d.text;button.append(icon,tag,title,text);
  button.addEventListener('click',()=>pick(id));options.append(button);
 });note(392,.5);note(494,.5,.035,.1);note(587,.6,.035,.2);
 options.firstElementChild?.focus({preventScroll:true});
}
function pick(id){if(!C.chooseUpgrade(state,id))return;clearInput();viewMode='playing';$('upgrade-screen').hidden=true;$('touch-controls').hidden=!touch;accum=0;notify(C.UPGRADES[id].name.toUpperCase()+' · GROWING STRONGER');}
function processEvents(){
 for(const e of state.events){
  if(e.type==='jump')note(e.air?620:390,.12,.025);
  if(e.type==='dash'){note(180,.16,.03,0,'sawtooth');note(360,.15,.02,.04);}
  if(e.type==='grapple')note(260,.18,.04);if(e.type==='release')note(520,.15,.025);
  if(e.type==='gem'){note(740,.20,.035);note(1110,.20,.025,.07);if(e.bonus)notify('TREASURE! +'+e.value);}
  if(e.type==='land'){note(220*Math.pow(2,e.combo/12),.14,.03);if(e.combo>=3)notify(e.combo+'× FLOW · KEEP THE CHAIN');}
  if(e.type==='bounce'){note(330,.25,.045);note(660,.25,.03,.08);notify('BOUNCE BLOOM · UP YOU GO');}
 }
 state.events.length=0;
}
function hud(){
 const q=state.player,region=Math.floor(state.progress/24)%4,gap=Math.max(0,q.y-state.storm);
 $('height').textContent=Math.floor(state.height).toLocaleString();$('score').textContent=String(C.score(state)).padStart(5,'0');$('gems').textContent=state.gems;
 $('region').textContent=C.BIOMES[region].name;
 if(region!==lastRegion){lastRegion=region;notify('ENTERING '+C.BIOMES[region].name);note(523,.5);note(784,.7,.03,.12);}
 $('best-chase').textContent=record.height>0?(state.height>=record.height?'ABOVE YOUR PERSONAL BEST':Math.ceil(record.height-state.height)+' m to your personal best'):'A new sky. Set your first record.';
 $('combo').textContent=state.combo?state.combo+'× FLOW · CHAIN YOUR LANDINGS':'BUILD A LANDING CHAIN';
 $('combo-fill').style.width=(state.combo?C.clamp(1-(state.time-state.lastLanding)/(4.2+state.upgrades.rhythm*1.5),0,1)*100:0)+'%';
 $('charge-fill').style.width=(state.charge*100)+'%';
 $('jump-status').replaceChildren(document.createTextNode('●'.repeat(Math.max(0,2-q.jumps))+'○'.repeat(q.jumps)+' '),Object.assign(document.createElement('small'),{textContent:'JUMPS'}));
 $('dash-status').replaceChildren(document.createTextNode('◆'.repeat(Math.max(0,1+state.upgrades.dash-q.dashes))+'◇'.repeat(q.dashes)+' '),Object.assign(document.createElement('small'),{textContent:'DASH'}));
 $('storm-gap').textContent=Math.floor(gap)+' m';$('storm-label').textContent=state.time<4?'STORM WAKING':gap<7?'KEEP CLIMBING':'STORM BELOW';$('storm-fill').style.width=(C.clamp(1-gap/30,0,1)*100)+'%';document.body.classList.toggle('danger',gap<7&&state.mode==='playing');
 const tutorial=state.progress<2?['01','MAKE THE FIRST LEAP',touch?'Move ↑. Tap JUMP twice, or hold VINE to catch the next flower.':'W moves forward. Tap SPACE twice, or hold E to catch the next flower.']:state.progress<4?['02','LET GO TO FLY',touch?'Release VINE over an island. Land to refill every ability.':'Release E over an island. Land to refill every ability.']:state.progress<6?['03','SAVE A LITTLE AIR',touch?'DASH gives a burst in your movement direction.':'SHIFT dashes in your movement direction. Hold right mouse to look.']:state.progress<8?['04','THE GARDEN BITES BACK','Orange islands crumble. Mint flowers bounce you higher.']:null;
 $('tutorial').hidden=!tutorial;if(tutorial){$('tutorial-number').textContent=tutorial[0];$('tutorial-title').textContent=tutorial[1];$('tutorial-text').textContent=tutorial[2];}
 const t=state.rope?state.platforms.get(state.rope.id):C.target(state),label=$('target-label');
 if(t&&state.mode==='playing'){const p=C.position(t,state.time),screen=renderer.project(p.x,p.y+3,p.z);label.hidden=!screen?.visible;if(screen?.visible){label.style.left=screen.x+'px';label.style.top=screen.y+'px';label.querySelector('small').textContent=state.rope?'RELEASE TO LAUNCH':touch?'HOLD VINE':'HOLD E · VINE';}}else label.hidden=true;
}
$('start').addEventListener('click',()=>start());$('daily').addEventListener('click',()=>start(C.dailySeed()));
$('retry').addEventListener('click',()=>start());$('pause-retry').addEventListener('click',()=>start());$('new-seed').addEventListener('click',()=>start(randomSeed()));
$('pause').addEventListener('click',()=>state.mode==='paused'?resume():pause());$('resume').addEventListener('click',resume);
$('pause-menu').addEventListener('click',menu);$('death-menu').addEventListener('click',menu);
$('sound').addEventListener('click',()=>{soundChosen=true;setSound(!soundOn);if(soundOn)note(440);});
$('share').addEventListener('click',async()=>{
 const url=new URL(location.href);url.hash='seed='+seed;
 const text='Beat my '+C.score(state)+' points / '+Math.floor(state.height)+'m in Sol & the Beanstalk: '+url.href;
 try{await navigator.clipboard.writeText(text);notify('CHALLENGE COPIED');}catch(_){$('seed-line').textContent='Copy this challenge: '+url.href;const selection=getSelection(),range=document.createRange();range.selectNodeContents($('seed-line'));selection.removeAllRanges();selection.addRange(range);}
});
addEventListener('keydown',e=>{
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
 if(e.repeat)return;
 if(e.code==='Escape'){state.mode==='paused'?resume():pause();return;}
 if(e.code==='KeyR'&&started){start();return;}
 if(state.mode==='upgrade'){const i=Number(e.key)-1;if(i>=0&&i<3)pick(state.offers[i]);return;}
 if(!started||state.mode!=='playing')return;
 if(e.code==='Space')edges.jump=true;if(e.code==='ShiftLeft'||e.code==='ShiftRight')edges.dash=true;keys.add(e.code);
});
addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('blur',()=>{clearInput();pause();});
addEventListener('pagehide',()=>{clearInput();pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();pause();audio?.suspend().catch(()=>{});}});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{if(!started||state.mode!=='playing')return;e.preventDefault();canvas.setPointerCapture(e.pointerId);if(e.button===2||e.pointerType==='touch')drag={x:e.clientX,y:e.clientY};else mouseGrapple=true;});
canvas.addEventListener('pointermove',e=>{if(!drag)return;renderer.camera.yaw-=(e.clientX-drag.x)*.004;renderer.camera.pitch=C.clamp(renderer.camera.pitch+(e.clientY-drag.y)*.003,-.1,.85);drag={x:e.clientX,y:e.clientY};});
for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>{mouseGrapple=false;drag=null;});
canvas.addEventListener('wheel',e=>{e.preventDefault();renderer.camera.distance=C.clamp(renderer.camera.distance+Math.sign(e.deltaY),9,24);},{passive:false});
const moveKeys={forward:'KeyW',back:'KeyS',left:'KeyA',right:'KeyD'};
function hold(button,on,off){button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);if(state.mode==='playing')on();});for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,off);}
for(const b of document.querySelectorAll('[data-move]')){const key=moveKeys[b.dataset.move];hold(b,()=>keys.add(key),()=>keys.delete(key));}
hold($('touch-vine'),()=>keys.add('KeyE'),()=>keys.delete('KeyE'));
hold($('touch-jump'),()=>edges.jump=true,()=>{});hold($('touch-dash'),()=>edges.dash=true,()=>{});
function input(){
 const x=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
 const z=Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'));
 const a=renderer.camera.yaw,result={x:x*Math.cos(a)+z*Math.sin(a),z:z*Math.cos(a)-x*Math.sin(a),jump:edges.jump,dash:edges.dash,grapple:keys.has('KeyE')||mouseGrapple};edges.jump=false;edges.dash=false;return result;
}
let frameCount=0;
function frame(now){
 const dt=Math.min(.08,(now-last)/1000||0);last=now;
 if(started&&state.mode==='playing'){
  accum+=dt;while(accum>=1/120){C.step(state,input(),1/120);accum-=1/120;if(state.mode!=='playing'){accum=0;break;}}
  processEvents();if(state.mode==='dead')showDeath();else if(state.mode==='upgrade')showUpgrades();
 }else accum=0;
 renderer.frame(state,now/1000);
 if(started&&frameCount++%3===0)hud();
 requestAnimationFrame(frame);
}
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();$('error-message').textContent='The graphics context was interrupted. Reload to start a new run; your saved records are safe.';$('error-screen').hidden=false;});
window.ClimbGame={get state(){return state;},get ready(){return true;},get meshCount(){return renderer.meshCount;}};
menu();requestAnimationFrame(frame);
})();
