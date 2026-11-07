'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright'),path=require('node:path'),fs=require('node:fs');
fs.mkdirSync(path.resolve(__dirname,'../.artifacts'),{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const url='file://'+path.resolve(__dirname,'../index.html')+'#seed=42';
  await page.goto(url);await page.waitForFunction(()=>window.ClimbGame?.ready,{timeout:10000});
  await page.screenshot({path:'.artifacts/climb-title.png'});
  await page.locator('#start').click();await page.keyboard.down('w');await page.keyboard.press('Space');
  await page.waitForTimeout(220);await page.keyboard.press('Space');await page.waitForTimeout(400);await page.keyboard.up('w');
  assert.ok(await page.evaluate(()=>ClimbGame.state.height)>2,'real keyboard input moves the player upward');
  await page.keyboard.down('e');await page.waitForTimeout(500);
  assert.ok(await page.evaluate(()=>ClimbGame.state.charge)<1,'real grapple input drains charge');await page.keyboard.up('e');
  await page.screenshot({path:'.artifacts/climb-playing.png'});
  await page.keyboard.press('Escape');const t=await page.evaluate(()=>ClimbGame.state.time);await page.waitForTimeout(150);
  assert.equal(await page.evaluate(()=>ClimbGame.state.time),t,'pause freezes the simulation');
  await page.locator('#resume').click();await page.keyboard.press('r');
  assert.ok(await page.evaluate(()=>ClimbGame.state.time)<.3);assert.equal(await page.evaluate(()=>ClimbGame.state.progress),0);
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await page.evaluate(()=>ClimbGame.state.mode),'paused');
  await page.locator('#pause-menu').click();assert.equal(await page.locator('#menu').isVisible(),true);
  await page.locator('#daily').click();assert.equal(await page.evaluate(()=>ClimbGame.state.seed===ClimbCore.dailySeed()),true);
  assert.deepEqual(errors,[]);
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await mobile.goto(url);await mobile.waitForFunction(()=>window.ClimbGame?.ready);await mobile.locator('#start').tap();
  assert.equal(await mobile.locator('#touch-controls').isVisible(),true);
  await mobile.locator('#touch-jump').tap();await mobile.waitForTimeout(160);assert.ok(await mobile.evaluate(()=>ClimbGame.state.height)>.3);
  await mobile.screenshot({path:'.artifacts/climb-mobile.png'});
  const fail=await browser.newPage();await fail.addInitScript(()=>{HTMLCanvasElement.prototype.getContext=()=>null;});await fail.goto(url);
  assert.equal(await fail.locator('#error-screen').isVisible(),true);assert.match(await fail.locator('#error-message').textContent(),/WebGL2/);
  console.log('PASS production WebGL: keyboard jump/grapple, pause/resume, retry, focus loss, daily seed, touch jump, visible WebGL failure; no page errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
