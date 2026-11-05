"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),C=require("../core.js");
const apply=(s,a)=>{const r=C.act(s,a);assert.equal(r.ok,true,r.message);return r.state};
test("date seed stable and distinct",()=>{assert.equal(C.dailySeed("2026-11-05"),C.dailySeed("2026-11-05"));assert.notEqual(C.dailySeed("2026-11-05"),C.dailySeed("2026-11-06"));});
test("first shot gives a route immediately",()=>{let s=apply(C.create(17),"shoot");assert.equal(C.ready(s),true);assert.equal(s.shots[0],1);});
test("overload breaks a shoot, never destroys solvability",()=>{
 let s=C.create(17);s=apply(s,"shoot");s=apply(s,"cross");
 assert.equal(s.room,1);
 s=apply(s,"shoot");const broken=apply(s,"shoot");
 assert.equal(broken.breaks,1);assert.equal(C.ready(broken),false);
 s=apply(broken,"root");s=apply(s,"shoot");s=apply(s,"shoot");assert.equal(C.ready(s),true);
});
test("whole game with growth/root/cross and two endings",()=>{
 for(const choice of ["hold","release"]){
  let s=C.create(120);s=apply(s,"shoot");s=apply(s,"cross");
  for(let room=1;room<4;room++){
   s=apply(s,"shoot");s=apply(s,"root");
   for(let j=1;j<C.ROOMS[room].need;j++)s=apply(s,"shoot");
   assert.ok(C.ready(s));if(room<3)s=apply(s,"cross");
  }
  s=apply(s,"cross");assert.equal(s.room,3);
  s=apply(s,choice);assert.equal(s.completed,true);assert.equal(s.choice,choice);
 }
});
test("invalid actions do not consume seeds or mutate input",()=>{
 let s=C.create(1),copy=JSON.stringify(s);
 for(const a of ["root","cross","hold","release","nonsense"]){assert.equal(C.act(s,a).ok,false);assert.equal(JSON.stringify(s),copy);}
});
test("save recovery rejects corruption and restores pressure",()=>{
 let s=apply(C.create(7),"shoot");
 assert.deepEqual(C.restore(7,JSON.parse(JSON.stringify(s))),s);
 assert.equal(C.restore(8,s).room,0);
 assert.equal(C.restore(7,{v:1,seed:7,shots:[],rooted:[],room:0}).room,0);
});
