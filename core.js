/* The Pin Beneath the Sky — deterministic rules. No rendering dependencies. */
(function(root,factory){
 const core=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=core;
 else root.SkyCore=core;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const ROOMS=[
  {name:"THE FIRST THREAD",subtitle:"Nothing holds itself up.",need:1,pressure:.12,lines:["One bean. One impossible distance.","Shoot the moon. Watch what grows."]},
  {name:"THE BORROWED CHAIN",subtitle:"Every branch has a price.",need:2,pressure:.38,lines:["The new vine grips the old chain.","Listen. Something above you is straining."]},
  {name:"THE CRYSTAL LUNG",subtitle:"Inside the beanstalk, something breathes.",need:2,pressure:.44,lines:["The glass remembers pressure.","Roots can carry weight you cannot see."]},
  {name:"THE GIANT'S PIN",subtitle:"A gardener has been holding the sky.",need:3,pressure:.10,lines:["No monster waits here. Only the keeper.","You cannot climb forever without holding something up."]}
 ];
 const SHOT=.31, SNAP=.89, WARN=.61, REDUCE=.65;
 function hash(x){let h=2166136261;for(let i=0;i<String(x).length;i++){h^=String(x).charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
 function dailySeed(date){const d=date instanceof Date?date:new Date(date||Date.now());return hash(d.toISOString().slice(0,10)+"-the-pin");}
 function create(seed){return {v:1,seed:seed>>>0,room:0,roots:2,shots:[0,0,0,0],rooted:[false,false,false,false],pressure:ROOMS[0].pressure,breaks:0,completed:false,choice:null,events:[],started:0};}
 function clone(s){return { ...s,shots:[...s.shots],rooted:[...s.rooted],events:[...s.events]};}
 function valid(s){return s&&s.v===1&&Number.isInteger(s.seed)&&s.room>=0&&s.room<ROOMS.length&&Array.isArray(s.shots)&&s.shots.length===4&&Array.isArray(s.rooted)&&s.rooted.length===4;}
 function restore(seed,stored){if(!valid(stored)||stored.seed!==(seed>>>0))return create(seed);
 const s=create(seed);s.room=Math.min(3,Math.max(0,stored.room|0));s.roots=Math.min(20,Math.max(0,stored.roots|0));s.breaks=Math.max(0,stored.breaks|0);s.shots=s.shots.map((_,i)=>Math.min(ROOMS[i].need,Math.max(0,stored.shots[i]|0)));s.rooted=s.rooted.map((_,i)=>!!stored.rooted[i]);s.pressure=Number.isFinite(stored.pressure)?Math.min(.95,Math.max(0,stored.pressure)):ROOMS[s.room].pressure;s.completed=!!stored.completed;s.choice=["hold","release"].includes(stored.choice)?stored.choice:null;s.events=Array.isArray(stored.events)?stored.events.slice(-25):[];s.started=Number(stored.started)||0;return s;
 }
 function ready(s){return s.shots[s.room]>=ROOMS[s.room].need&&(s.room===0||s.rooted[s.room]);}
 function act(s,verb){
  const n=clone(s),i=n.room,desc=ROOMS[i];
  const fail=(message)=>({ok:false,state:n,event:"blocked",message});
  const done=(event,message)=>{n.events.push(event);n.events=n.events.slice(-25);return {ok:true,state:n,event,message}};
  if(n.completed)return fail("The sky remembers your choice. Start a new seed to play again.");
  if(verb==="shoot"){
   if(ready(n))return fail("The way is grown. Press F or FOLLOW to cross.");
   if(n.shots[i]>=desc.need)return fail("The bridge needs a rooted pin before it can hold.");
   n.pressure+=SHOT;
   if(n.pressure>=SNAP){
    n.pressure=.56;n.breaks++;n.shots[i]=Math.max(0,n.shots[i]-1);
    return done("snap","THE PIN SNAPPED! A vine tore free. Root the support, then grow again.");
   }
   n.shots[i]++;
   return done(ready(n)?"open":n.pressure>=WARN?"strain":"growth",
    ready(n)?"THE PATH OPENS — press F to fly to the next chamber.":
    n.pressure>=WARN?"The chain SAGS and its voice drops. Root it before it tears.":"A bright vine blooms instantly around the chain.");
  }
  if(verb==="root"){
   if(n.roots<=0)return fail("No root pods left. Each new chamber grants one.");
   if(n.rooted[i])return fail("You already rooted this pin.");
   if(n.pressure<.30)return fail("This pin is not yet carrying enough to need a root.");
   n.roots--;n.rooted[i]=true;n.pressure=Math.max(.08,n.pressure-REDUCE);
   return done(ready(n)?"open":"root","A golden root finds stone. The chain rises. The hum returns to a higher note.");
  }
  if(verb==="cross"){
   if(!ready(n))return fail("The way ahead cannot bear you yet. Grow, then root the load.");
   if(i===ROOMS.length-1)return done("summit","At the summit, the keeper asks what should happen to the old chain.");
   n.room++;n.roots++;n.pressure=ROOMS[n.room].pressure;
   return done("travel","You pass into "+ROOMS[n.room].name+".");
  }
  if(verb==="hold"||verb==="release"){
   if(i!==3||!ready(n))return fail("Only the last chamber offers this choice.");
   n.choice=verb;n.completed=true;
   return done("ending",verb==="hold"?
    "You plant roots beneath the giant. The sky is held by many hands now.":
    "You open the pin. The sky rearranges, and its seeds scatter toward another morning.");
  }
  return fail("Unknown action.");
 }
 function palette(seed,room){
  const h=hash(seed+"-"+room),v=(n)=>((h>>>n)&255)/255;
  return {a:[.50+.15*v(0),.50+.15*v(8),.50+.15*v(16)],b:[.42,.42,.42],c:[1,1,1],d:[v(0),v(8),v(16)],shift:v(8)};
 }
 function stress(s){return Math.min(1,s.pressure/SNAP);}
 return {ROOMS,SHOT,SNAP,WARN,REDUCE,hash,dailySeed,create,restore,act,ready,stress,palette};
});
