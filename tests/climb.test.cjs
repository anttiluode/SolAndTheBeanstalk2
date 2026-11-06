'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
let C; try { C=require('../climb-core.js'); } catch (_) { C={}; }
test('endless generation is deterministic and keeps a traversable main route at extreme indices',()=>{
 assert.equal(typeof C.platform,'function');
 for(const seed of [0,1,42,4294967295])for(const i of [0,1,2,50,1000,1000000]){
  const a=C.platform(seed,i),b=C.platform(seed,i+1);
  assert.deepEqual(a,C.platform(seed,i));
  assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<11);
  assert.ok(b.y-a.y<=2.41); assert.ok(a.r>=1.7);
 }
 assert.notDeepEqual(C.platform(1,42),C.platform(2,42));
});
test('jump, double jump and dash are limited until landing',()=>{
 assert.equal(typeof C.create,'function');
 const s=C.create(42);C.step(s,{jump:true},1/120);assert.ok(s.player.vy>0);assert.equal(s.player.jumps,1);
 C.step(s,{jump:true},1/120);assert.equal(s.player.jumps,2);
 const vy=s.player.vy;C.step(s,{jump:true},1/120);assert.ok(s.player.vy<vy);
 C.step(s,{dash:true,z:-1},1/120);assert.equal(s.player.dashes,1);assert.ok(s.player.vz<-10);
});
test('vine pulls toward an anchor, drains charge and requires release to reattach',()=>{
 assert.equal(typeof C.create,'function');
 const s=C.create(8);C.step(s,{grapple:true},1/120);
 assert.ok(s.rope);const initial=s.player.y;
 for(let i=0;i<100;i++)C.step(s,{grapple:true},1/120);
 assert.ok(s.player.y>initial);assert.ok(s.charge<1);
 C.step(s,{grapple:false},1/120);assert.equal(s.rope,null);
});
test('storm kills an idle player and a fresh run fully resets gameplay',()=>{
 assert.equal(typeof C.create,'function');
 const s=C.create(17);for(let i=0;i<6000&&s.mode==='playing';i++)C.step(s,{},1/120);
 assert.equal(s.mode,'dead');assert.match(s.cause,/storm/i);
 const fresh=C.create(17);assert.equal(fresh.mode,'playing');assert.equal(fresh.time,0);assert.equal(fresh.points,0);
});
test('new-platform landing rewards once and upgrades freeze the simulation',()=>{
 assert.equal(typeof C.create,'function');
 const s=C.create(12);
 function land(i){const p=C.platform(s.seed,i);s.player.x=p.x;s.player.z=p.z;s.player.y=p.y+.08;s.player.vy=-5;s.player.ground=null;C.step(s,{},1/30);}
 land(1);assert.equal(s.progress,1);const points=s.points;land(1);assert.equal(s.points,points);
 land(12);assert.equal(s.mode,'upgrade');const t=s.time,y=s.player.y;
 C.step(s,{jump:true},1/30);assert.equal(s.time,t);assert.equal(s.player.y,y);
 assert.equal(C.chooseUpgrade(s,'nonsense'),false);
 assert.equal(C.chooseUpgrade(s,s.offers[0]),true);assert.equal(s.mode,'playing');
});
test('streamed simulation remains bounded far beyond the original chapters',()=>{
 assert.equal(typeof C.create,'function');const s=C.create(3);
 for(let i=1;i<3000;i+=7){const p=C.platform(s.seed,i);s.player.x=p.x;s.player.y=p.y+.4;s.player.z=p.z;s.player.vy=0;s.progress=i;s.storm=p.y-20;C.step(s,{},1/120);}
 assert.ok(s.platforms.size<=50);assert.ok(s.events.length<=16);assert.ok(Number.isFinite(C.score(s)));
});
test('persisted records reject invalid or nonfinite data',()=>{
 assert.equal(typeof C.validateRecord,'function');
 assert.deepEqual(C.validateRecord({score:NaN,height:-2,runs:'x'}),{score:0,height:0,runs:0});
 assert.deepEqual(C.validateRecord({score:500,height:120,runs:3}),{score:500,height:120,runs:3});
});
