"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const html=fs.readFileSync("story.html","utf8");
test("startup controllers load after engine creation, never before",()=>{
 const engine=html.indexOf("window.SkyEngine={");
 const play=html.indexOf('<script src="play.js"></script>');
 const core=html.indexOf('<script src="core.js"></script>');
 assert.ok(core>=0,"core library present");
 assert.ok(engine>core,"engine created after core");
 assert.ok(play>engine,"play.js must load AFTER SkyEngine is assigned; reversed order freezes Enter forever");
 assert.equal(html.indexOf('<script src="play.js"></script>',play+1),-1,"only one play controller");
});
test("the skyready event is emitted after initialization and subscribed by the controller",()=>{
 assert.ok(html.includes('dispatchEvent(new Event("skyready"))'),"engine emits readiness");
 const play=fs.readFileSync("play.js","utf8");
 assert.ok(play.includes('addEventListener("skyready"'),"controller subscribes to readiness");
 assert.ok(play.includes('if(engine.ready)window.dispatchEvent(new Event("skyready"))'),"controller handles already-ready engine");
});
