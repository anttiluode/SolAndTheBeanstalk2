/* Storm Climber: deterministic generation and fixed-step physics, shared by Node/browser. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ClimbCore=api;})(globalThis,function(){
'use strict';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function hash(x){let h=2166136261;for(const c of String(x)){h=Math.imul(h^c.charCodeAt(0),16777619);}return h>>>0;}
function rand(seed,index,salt=0){let a=(seed^Math.imul(index+1,374761393)^Math.imul(salt+1,668265263))>>>0;a=Math.imul(a^(a>>>13),1274126177);return ((a^(a>>>16))>>>0)/4294967296;}
const BIOMES=[{name:'THE VERDANT WAKE',color:[.48,.76,.39],accent:[.85,.98,.49]},
 {name:'AMBER ORCHARD',color:[.68,.47,.28],accent:[1,.73,.33]},
 {name:'THE CRYSTAL LUNG',color:[.29,.55,.68],accent:[.41,.91,1]},
 {name:'MIDNIGHT BLOOM',color:[.52,.35,.68],accent:[.94,.55,.84]}];
const UPGRADES={
 spring:{name:'Spring heels',tag:'JUMP',text:'+12% jump power. Reach higher; recover later.',max:3},
 vine:{name:'Wild tendril',tag:'GRAPPLE',text:'+25% vine charge and +3m grapple reach.',max:3},
 dash:{name:'Second wind',tag:'DASH',text:'One extra dash before you need to land.',max:2},
 magnet:{name:'Honey heart',tag:'TREASURE',text:'Collect crystals from 2m farther away.',max:3},
 calm:{name:'Eye of the storm',tag:'BREATH',text:'Push the storm down 14m. Buy time now.',max:Infinity},
 rhythm:{name:'Long summer',tag:'COMBO',text:'+1.5 seconds to keep your landing chain.',max:3}
};
function platform(seed,index,bonus=false){
 const phase=rand(seed,0,99)*6.283,level=Math.min(1,index/130);
 const x=index===0?0:Math.sin(index*.67+phase)*3.2+Math.sin(index*.23)*2.5;
 let kind=index===0?'start':index%12===0?'shrine':'leaf';
 const roll=rand(seed,index,1);
 if(index>5&&kind==='leaf')kind=roll<.22?'crumble':roll<.39?'moving':roll<.51?'bounce':'leaf';
 const sign=rand(seed,index,3)>.5?1:-1;
 return {id:bonus?'b'+index:index,index,bonus,x:x+(bonus?sign*6.4:0),y:2+index*2.4+(bonus?.7:0),z:-index*7,
  r:bonus?1.5:index===0?5:index%12===0?3.4:2.8-level*.85+rand(seed,index,2)*.3,
  kind:bonus?'treasure':kind,biome:Math.floor(index/24)%4,phase:rand(seed,index,4)*6.283,
  gem:index>0,landedAt:null,collected:false};
}
function position(p,t){return {x:p.x+(p.kind==='moving'?Math.sin(t*1.6+p.phase)*1.1:0),y:p.y,z:p.z};}
function live(p,t){return p.kind!=='crumble'||p.landedAt===null||t-p.landedAt<.85;}
function stream(s){
 const center=Math.max(s.progress,Math.floor((s.player.y-2)/2.4));
 const lo=Math.max(0,center-10),hi=center+21;
 for(const [id,p] of s.platforms)if(p.index<lo||p.index>hi)s.platforms.delete(id);
 for(let i=lo;i<=hi;i++){
  if(!s.platforms.has(i))s.platforms.set(i,platform(s.seed,i));
  if(i%5===3&&!s.platforms.has('b'+i))s.platforms.set('b'+i,platform(s.seed,i,true));
 }
}
function create(seed){
 const s={seed:seed>>>0,mode:'playing',time:0,storm:-12,progress:0,height:0,points:0,gems:0,combo:0,bestCombo:0,
  lastLanding:-99,nextShrine:12,upgrades:{spring:0,vine:0,dash:0,magnet:0,calm:0,rhythm:0},offers:[],
  player:{x:0,y:2,z:0,vx:0,vy:0,vz:0,jumps:0,dashes:0,ground:0,coyote:0,dashTime:0},
  charge:1,rope:null,grappleHeld:false,platforms:new Map(),events:[],cause:'',jumpBuffer:0};stream(s);return s;
}
function event(s,type,data={}){s.events.push({type,...data});if(s.events.length>16)s.events.shift();}
function score(s){return Math.floor(s.height*10+s.points);}
function target(s){
 const q=s.player,reach=17+s.upgrades.vine*3;let best=null,cost=Infinity;
 for(const p of s.platforms.values()){
  if(!live(p,s.time)||p.y<s.storm+1||p.id===q.ground)continue;
  const a=position(p,s.time),dx=a.x-q.x,dy=a.y+3-q.y,dz=a.z-q.z,d=Math.hypot(dx,dy,dz);
  if(d>reach||dy<-.5||p.index>s.progress+3||p.index<s.progress)continue;
  const value=d+(p.bonus?5:0)+(p.index===s.progress?3:0);
  if(value<cost){cost=value;best=p;}
 }return best;
}
function chooseUpgrade(s,id){
 if(s.mode!=='upgrade'||!s.offers.includes(id))return false;
 s.upgrades[id]++;if(id==='calm')s.storm-=14;
 s.charge=1;s.mode='playing';s.rope=null;s.grappleHeld=false;s.offers=[];event(s,'upgrade',{id});return true;
}
function offer(s){
 const keys=Object.keys(UPGRADES).filter(k=>s.upgrades[k]<UPGRADES[k].max);
 keys.sort((a,b)=>rand(s.seed,s.progress,hash(a))-rand(s.seed,s.progress,hash(b)));
 s.offers=keys.slice(0,3);s.mode='upgrade';s.rope=null;event(s,'shrine');
}
function die(s,cause){s.mode='dead';s.cause=cause;s.rope=null;event(s,'death');}
function land(s,p){
 const q=s.player;q.y=p.y;q.vy=0;q.ground=p.id;q.jumps=0;q.dashes=0;q.coyote=.12;s.charge=1;
 if(p.landedAt===null)p.landedAt=s.time;
 if(!p.bonus&&p.index>s.progress){
  s.combo=s.time-s.lastLanding<4.2+s.upgrades.rhythm*1.5?Math.min(8,s.combo+1):1;
  s.bestCombo=Math.max(s.combo,s.bestCombo);s.lastLanding=s.time;s.progress=p.index;
  s.points+=25*s.combo;event(s,'land',{combo:s.combo,kind:p.kind});
  if(p.index>=s.nextShrine&&p.kind==='shrine'){s.nextShrine=p.index+12;offer(s);}
 }
 if(p.kind==='bounce'){q.vy=15*(1+s.upgrades.spring*.08);q.ground=null;event(s,'bounce');}
}
function step(s,input,dt){
 if(s.mode!=='playing')return;
 dt=clamp(dt,0,1/30);if(!dt)return;
 s.time+=dt;stream(s);const q=s.player;
 if(s.time>4)s.storm+=dt*(.65+Math.min(1.25,s.progress*.014)+Math.max(0,(s.height-s.storm-32)*.1));
 q.coyote=Math.max(0,q.coyote-dt);q.dashTime=Math.max(0,q.dashTime-dt);
 if(q.ground!==null){const p=s.platforms.get(q.ground);if(!p||!live(p,s.time)){q.ground=null;}else{
  const now=position(p,s.time),old=position(p,s.time-dt);q.x+=now.x-old.x;
  if(Math.hypot(q.x-now.x,q.z-now.z)>p.r+.15)q.ground=null;else q.coyote=.12;
 }}
 if(input.jump)s.jumpBuffer=.12;else s.jumpBuffer=Math.max(0,s.jumpBuffer-dt);
 if(s.jumpBuffer>0&&(q.jumps<2||q.coyote>0)){
  if(q.coyote>0)q.jumps=0;
  q.vy=(q.jumps===0?11.5:10.5)*(1+s.upgrades.spring*.12);q.jumps++;q.ground=null;q.coyote=0;
  s.jumpBuffer=0;s.rope=null;event(s,'jump',{air:q.jumps>1});
 }
 let mx=Number(input.x)||0,mz=Number(input.z)||0,m=Math.hypot(mx,mz);if(m>1){mx/=m;mz/=m;}
 if(input.dash&&q.dashes<1+s.upgrades.dash){
  if(m<.1){mx=0;mz=-1;}q.vx=mx*19;q.vz=mz*19;q.vy=Math.max(q.vy,3.5);q.dashTime=.19;q.dashes++;
  q.ground=null;q.coyote=0;event(s,'dash');
 }
 if(input.grapple&&!s.grappleHeld&&s.charge>.15){const p=target(s);if(p){s.rope={id:p.id};q.ground=null;q.coyote=0;event(s,'grapple');}}
 if(!input.grapple&&s.rope){s.rope=null;q.vy=Math.max(q.vy,6);event(s,'release');}
 s.grappleHeld=!!input.grapple;
 const accel=q.ground!==null?17:7;
 if(q.dashTime<=0){q.vx+=(mx*8.5-q.vx)*Math.min(1,accel*dt);q.vz+=(mz*8.5-q.vz)*Math.min(1,accel*dt);}
 q.vy-=24*dt;
 if(s.rope){
  const p=s.platforms.get(s.rope.id);
  if(!p||!live(p,s.time)||s.charge<=0){s.rope=null;}else{
   const a=position(p,s.time),dx=a.x-q.x,dy=a.y+3-q.y,dz=a.z-q.z,d=Math.hypot(dx,dy,dz)||1;
   // A damped, reeling vine: steering remains possible; release preserves launch momentum.
   const speed=Math.min(16,d*3.6),f=Math.min(1,dt*9);
   q.vx+=(dx/d*speed-q.vx)*f;q.vy+=(dy/d*speed-q.vy)*f;q.vz+=(dz/d*speed-q.vz)*f;
   s.charge=Math.max(0,s.charge-dt/(1.45*(1+s.upgrades.vine*.25)));
  }
 }else if(q.ground!==null)s.charge=Math.min(1,s.charge+dt*3);
 const oldY=q.y;q.x+=q.vx*dt;q.z+=q.vz*dt;q.y+=q.vy*dt;
 if(q.vy<=0){
  let hit=null;
  for(const p of s.platforms.values()){
   if(!live(p,s.time))continue;const a=position(p,s.time);
   if(oldY>=a.y-.05&&q.y<=a.y&&Math.hypot(q.x-a.x,q.z-a.z)<p.r+.15&&(!hit||p.y>hit.y))hit=p;
  }
  if(hit)land(s,hit);else q.ground=null;
 }
 for(const p of s.platforms.values()){
  if(!p.gem||p.collected)continue;const a=position(p,s.time);
  if(Math.hypot(q.x-a.x,q.y+.8-(a.y+1.2),q.z-a.z)<1.35+s.upgrades.magnet*2){
   p.collected=true;s.gems+=p.bonus?5:1;const value=(p.bonus?125:20)*Math.max(1,s.combo);s.points+=value;event(s,'gem',{value,bonus:p.bonus});
  }
 }
 s.height=Math.max(s.height,q.y-2);
 if(s.time-s.lastLanding>4.2+s.upgrades.rhythm*1.5)s.combo=0;
 if(q.y<s.storm+.3)die(s,'The storm caught you.');
}
function validateRecord(value){const o=value&&typeof value==='object'?value:{};const n=k=>Number.isFinite(o[k])&&o[k]>=0?Math.floor(Math.min(1e12,o[k])):0;return {score:n('score'),height:n('height'),runs:n('runs')};}
function dailySeed(date=new Date()){return hash('storm-'+date.toISOString().slice(0,10));}
return {BIOMES,UPGRADES,clamp,hash,rand,platform,position,live,create,step,target,chooseUpgrade,score,validateRecord,dailySeed};
});
