/* Small native WebGL2 renderer, derived from the first Sol & the Beanstalk's geometry approach.
   Meshes are local to islands, streamed and explicitly freed. No raymarching or external assets. */
(function(root){
'use strict';
const C=root.ClimbCore,TAU=Math.PI*2;
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s);
const dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>mul(a,1/(Math.hypot(...a)||1));
function tri(m,a,b,c,col){const n=unit(cross(sub(b,a),sub(c,a)));for(const p of [a,b,c])m.push(...p,...n,...col);}
function quad(m,a,b,c,d,col){tri(m,a,b,c,col);tri(m,a,c,d,col);}
function tube(m,pts,r,col,sides=6){
 const rings=pts.map((p,i)=>{const dir=unit(sub(pts[Math.min(i+1,pts.length-1)],pts[Math.max(0,i-1)])),u=unit(cross(dir,Math.abs(dir[1])>.9?[1,0,0]:[0,1,0])),v=cross(u,dir);
 return Array.from({length:sides},(_,k)=>add(p,add(mul(u,Math.cos(k*TAU/sides)*r),mul(v,Math.sin(k*TAU/sides)*r))));});
 for(let i=1;i<rings.length;i++)for(let j=0;j<sides;j++)quad(m,rings[i-1][j],rings[i-1][(j+1)%sides],rings[i][(j+1)%sides],rings[i][j],col);
}
function orb(m,at,r,col,stretch=[1,1,1]){
 for(let i=0;i<6;i++)for(let j=0;j<9;j++){
  const p=(a,b)=>add(at,[r*Math.sin(a)*Math.cos(b)*stretch[0],r*Math.cos(a)*stretch[1],r*Math.sin(a)*Math.sin(b)*stretch[2]]);
  quad(m,p(i*Math.PI/6,j*TAU/9),p(i*Math.PI/6,(j+1)*TAU/9),p((i+1)*Math.PI/6,(j+1)*TAU/9),p((i+1)*Math.PI/6,j*TAU/9),col);
 }
}
function crystal(m,p,r,col){for(let k=0;k<6;k++){const a=add(p,[Math.cos(k*TAU/6)*r,0,Math.sin(k*TAU/6)*r]),b=add(p,[Math.cos((k+1)*TAU/6)*r,0,Math.sin((k+1)*TAU/6)*r]);tri(m,a,add(p,[0,r*1.8,0]),b,col);tri(m,b,add(p,[0,-r,0]),a,mul(col,.65));}}
function flower(m,p,r,col){for(let k=0;k<7;k++){const a=k*TAU/7,b=a+.6;tri(m,p,add(p,[Math.cos(a)*r,.15,Math.sin(a)*r]),add(p,[Math.cos(b)*r*.75,.2,Math.sin(b)*r*.75]),col);}orb(m,add(p,[0,.12,0]),r*.17,[1,.86,.41]);}
function ring(m,r,y,col){for(let i=0;i<32;i++){const a=i*TAU/32,b=(i+1)*TAU/32;quad(m,[Math.cos(a)*r,y,Math.sin(a)*r],[Math.cos(b)*r,y,Math.sin(b)*r],[Math.cos(b)*(r+.08),y,Math.sin(b)*(r+.08)],[Math.cos(a)*(r+.08),y,Math.sin(a)*(r+.08)],col);}}
function island(p,seed){
 const m=[],pal=C.BIOMES[p.biome],r=p.r,top=p.kind==='crumble'?[.82,.40,.29]:p.kind==='bounce'?[.35,.72,.65]:pal.color;
 const N=18;for(let j=0;j<N;j++){
  const a=j*TAU/N,b=(j+1)*TAU/N;
  const aa=[Math.cos(a)*r,0,Math.sin(a)*r],bb=[Math.cos(b)*r,0,Math.sin(b)*r];
  tri(m,[0,0,0],bb,aa,mul(top,.85+C.rand(seed,p.index,j)*.22));
  quad(m,aa,bb,[bb[0]*.72,-1.2,bb[2]*.72],[aa[0]*.72,-1.2,aa[2]*.72],mul(top,.48));
  tri(m,[aa[0]*.72,-1.2,aa[2]*.72],[bb[0]*.72,-1.2,bb[2]*.72],[.4,-3.8,-.2],mul(top,.29));
 }
 ring(m,r*.95,.025,p.kind==='crumble'?[1,.55,.34]:pal.accent);
 if(p.kind==='shrine'){
  ring(m,1.2,.04,[1,.82,.39]);
  for(const side of [-1,1]){tube(m,[[side*1.8,0,-1.5],[side*2,2,-1.5],[side*1.3,4,-1.5],[0,4.6,-1.5]],.17,[.86,.74,.43]);crystal(m,[side*1.8,1.7,-1.5],.3,pal.accent);}
 }else if(p.kind==='bounce'){flower(m,[0,.05,0],r*.74,[.52,.97,.68]);}
 else if(p.kind==='crumble'){
  for(let j=0;j<3;j++){const x=(j-1)*.7;tube(m,[[x,0.04,-r*.7],[x+.3,.04,0],[x-.2,.04,r*.7]],.03,[.25,.15,.18],3);}
 }
 for(let j=0;j<16;j++){
  const a=C.rand(seed,p.index,100+j)*TAU,rr=r*(.65+.27*C.rand(seed,p.index,130+j)),x=Math.cos(a)*rr,z=Math.sin(a)*rr,h=.25+C.rand(seed,p.index,160+j)*.6;
  if(p.biome===2&&j%3===0)crystal(m,[x,.1,z],h*.45,pal.accent);
  else {tri(m,[x-.09,0,z],[x+h*.3,h,z+.12],[x+.09,0,z],mul(pal.color,1.2));if(j%4===0)flower(m,[x,.25,z],.23,pal.accent);}
 }
 // Hanging roots and a flower-tipped grapple stem; anchor position matches simulation.
 for(let j=0;j<3;j++)tube(m,[[Math.cos(j*2)*r*.6,-.7,Math.sin(j*2)*r*.6],[Math.cos(j*2)*r*.3,-3,Math.sin(j*2)*r*.3],[Math.cos(j*2+.6),-4.5,Math.sin(j*2+.6)]],.065,mul(pal.color,.7),5);
 tube(m,[[0,0,0],[.25,1.3,.05],[0,3,0]],.045,pal.color,5);
 flower(m,[0,3,0],.4,pal.accent);return m;
}
function perspective(aspect){const s=1/Math.tan(.96/2),n=.1,f=240;return [s/aspect,0,0,0,0,s,0,0,0,0,(f+n)/(n-f),-1,0,0,2*f*n/(n-f),0];}
function look(eye,target){const z=unit(sub(eye,target)),x=unit(cross([0,1,0],z)),y=cross(z,x);return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];}
function mult(a,b){const r=Array(16).fill(0);for(let j=0;j<4;j++)for(let i=0;i<4;i++)for(let k=0;k<4;k++)r[i+j*4]+=a[i+k*4]*b[k+j*4];return r;}
const VS=`#version 300 es
precision highp float;
in vec3 aPos; in vec3 aNormal; in vec3 aColor;
uniform mat4 uVP; uniform vec3 uOffset; uniform float uTurn; uniform float uScale;
out vec3 vColor; out vec3 vNormal; out vec3 vPos;
void main(){float c=cos(uTurn),s=sin(uTurn);mat3 r=mat3(c,0.,-s,0.,1.,0.,s,0.,c);vPos=r*aPos*uScale+uOffset;vNormal=r*aNormal;vColor=aColor;gl_Position=uVP*vec4(vPos,1.);}`;
const FS=`#version 300 es
precision highp float;
in vec3 vColor;in vec3 vNormal;in vec3 vPos;
uniform vec3 uEye;uniform vec3 uFog;uniform float uGlow;uniform float uAlpha;
out vec4 color;
void main(){vec3 n=normalize(vNormal);float sun=max(dot(n,normalize(vec3(-.4,.85,.3))),0.);float rim=pow(1.-abs(dot(n,normalize(uEye-vPos))),2.);vec3 c=vColor*(.48+sun*.65+uGlow)+vColor*rim*.16;float f=smoothstep(35.,150.,distance(vPos,uEye));color=vec4(mix(c,uFog,f),uAlpha);}`;
function create(canvas){
 const gl=canvas.getContext('webgl2',{antialias:true,alpha:true,powerPreference:'high-performance'});
 if(!gl)throw Error('WebGL2 is unavailable. Enable hardware acceleration in your browser, then reload.');
 function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
 const program=gl.createProgram(),vs=shader(gl.VERTEX_SHADER,VS),fs=shader(gl.FRAGMENT_SHADER,FS);gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.deleteShader(vs);gl.deleteShader(fs);
 const u={};for(const k of ['VP','Offset','Turn','Scale','Eye','Fog','Glow','Alpha'])u[k]=gl.getUniformLocation(program,'u'+k);
 const attrs=['aPos','aNormal','aColor'].map(k=>gl.getAttribLocation(program,k));
 function upload(vertices,dynamic=false){const vao=gl.createVertexArray(),buf=gl.createBuffer();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),dynamic?gl.DYNAMIC_DRAW:gl.STATIC_DRAW);attrs.forEach((at,i)=>{gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,3,gl.FLOAT,false,36,i*12);});return {vao,buf,count:vertices.length/9};}
 function free(m){gl.deleteBuffer(m.buf);gl.deleteVertexArray(m.vao);}
 const meshes=new Map();let meshSeed=null,vp=null,origin=[0,0,0];
 const camera={yaw:0,pitch:.35,distance:14,eye:[0,0,0]};
 const avatar=[];
 orb(avatar,[0,.65,0],.32,[.85,.41,.29],[.85,1.35,.78]);orb(avatar,[0,1.2,0],.25,[1,.82,.61]);
 orb(avatar,[0,1.4,0],.32,[.79,.93,.43],[1,.5,1]);flower(avatar,[0,1.57,0],.25,[.91,.98,.56]);
 for(const sign of [-1,1]){tube(avatar,[[sign*.18,.43,0],[sign*.22,.09,0]],.09,[.23,.29,.29]);tube(avatar,[[sign*.27,.94,0],[sign*.37,.58,-.03]],.075,[1,.82,.61]);}
 const actor=upload(avatar),gem=[];crystal(gem,[0,0,0],.28,[1,.84,.36]);const gemMesh=upload(gem);
 const gold=[];ring(gold,.65,0,[.83,1,.47]);const targetMesh=upload(gold);
 const sphere=[];orb(sphere,[0,0,0],1,[.13,.22,.27]);const cloud=upload(sphere);
 const rope=upload([],true),stalk=[];
 const pts=[];for(let i=0;i<=32;i++)pts.push([Math.sin(i*.25)*2.5,i*2,Math.cos(i*.25)*2.5]);tube(stalk,pts,1.4,[.16,.29,.24],9);
 for(let j=0;j<2;j++)tube(stalk,pts.map((p,i)=>add(p,[Math.cos(i*.7+j*Math.PI)*1.4,0,Math.sin(i*.7+j*Math.PI)*1.4])),.15,[.28,.48,.32],5);
 const stalkMesh=upload(stalk);
 const plane=[];quad(plane,[-220,0,-220],[220,0,-220],[220,0,220],[-220,0,220],[.27,.14,.29]);const stormMesh=upload(plane);
 function draw(m,offset,glow=0,turn=0,scale=1,alpha=1){gl.uniform3fv(u.Offset,offset);gl.uniform1f(u.Glow,glow);gl.uniform1f(u.Turn,turn);gl.uniform1f(u.Scale,scale);gl.uniform1f(u.Alpha,alpha);gl.bindVertexArray(m.vao);gl.drawArrays(gl.TRIANGLES,0,m.count);}
 function rel(x,y,z){return [x-origin[0],y-origin[1],z-origin[2]];}
 function frame(s,time){
  const dpr=Math.min(devicePixelRatio||1,1.5),w=Math.max(1,Math.round(canvas.clientWidth*dpr)),h=Math.max(1,Math.round(canvas.clientHeight*dpr));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}gl.viewport(0,0,w,h);
  origin=[s.player.x,s.player.y,s.player.z];
  const dist=camera.distance+(w/h<.8?4:0),cp=camera.pitch;
  camera.eye=[Math.sin(camera.yaw)*Math.cos(cp)*dist,2.8+Math.sin(cp)*dist,Math.cos(camera.yaw)*Math.cos(cp)*dist];
  vp=mult(perspective(w/h),look(camera.eye,[0,2,-3]));
  gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.useProgram(program);
  gl.uniformMatrix4fv(u.VP,false,new Float32Array(vp));gl.uniform3fv(u.Eye,camera.eye);gl.uniform3fv(u.Fog,[.055,.12,.16]);
  if(meshSeed!==s.seed){for(const m of meshes.values())free(m);meshes.clear();meshSeed=s.seed;}
  for(const [id,m] of meshes)if(!s.platforms.has(id)){free(m);meshes.delete(id);}
  for(const [id,p] of s.platforms){
   if(!meshes.has(id))meshes.set(id,upload(island(p,s.seed)));
   const pos=C.position(p,s.time);let sink=0;
   if(!C.live(p,s.time))sink=Math.min(30,(s.time-p.landedAt-.85)*12);
   if(pos.y-sink<s.storm-5)continue;
   const shake=p.kind==='crumble'&&p.landedAt!==null&&C.live(p,s.time)?Math.sin(time*75)*.045:0;
   draw(meshes.get(id),rel(pos.x+shake,pos.y-sink,pos.z),0);
   if(p.gem&&!p.collected){const count=p.bonus?3:1;for(let k=0;k<count;k++)draw(gemMesh,rel(pos.x+(k-(count-1)/2)*.55,pos.y+1.25+Math.sin(time*3+p.phase)*.15,pos.z),.5,time+k, p.bonus?1.35:1);}
  }
  // Local sections of an endless background stalk. All world-space values are rebased before upload.
  const base=Math.floor(s.progress/9)*9;for(let k=-1;k<3;k++){const i=base+k*9;draw(stalkMesh,rel(-15,2+i*2.4,-i*7-28),.03,.25);draw(stalkMesh,rel(19,2+i*2.4,-i*7-40),.03,-.6,.8);}
  const speed=Math.hypot(s.player.vx,s.player.vz),turn=speed>.2?Math.atan2(-s.player.vx,-s.player.vz):0;
  draw(actor,[0,s.player.ground!==null?Math.sin(time*speed*1.5)*.035:0,0],.18,turn);
  const target=s.rope?s.platforms.get(s.rope.id):C.target(s);
  if(target){const pos=C.position(target,s.time);draw(targetMesh,rel(pos.x,pos.y+3.06,pos.z),.7,time,1+Math.sin(time*4)*.12);}
  if(s.rope&&target){
   const at=C.position(target,s.time),end=rel(at.x,at.y+3,at.z),verts=[],points=[];
   for(let i=0;i<=12;i++){const t=i/12;points.push([end[0]*t,end[1]*t+.9*(1-t)-Math.sin(t*Math.PI)*.23,end[2]*t]);}
   tube(verts,points,.045,[.8,.98,.38],5);gl.bindBuffer(gl.ARRAY_BUFFER,rope.buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.DYNAMIC_DRAW);rope.count=verts.length/9;draw(rope,[0,0,0],.6);
  }
  draw(stormMesh,rel(s.player.x,s.storm,s.player.z),.12);
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
  for(let i=0;i<24;i++){const a=i*2.399+time*.015,r=8+(i%6)*7;draw(cloud,[Math.cos(a)*r,s.storm-s.player.y+Math.sin(i+time*.6)*.45,Math.sin(a)*r-14],.12,0,3+(i%4)*2,.55);}
  gl.depthMask(true);gl.disable(gl.BLEND);
 }
 function project(x,y,z){if(!vp)return null;const p=rel(x,y,z),v=Array.from({length:4},(_,i)=>vp[i]*p[0]+vp[i+4]*p[1]+vp[i+8]*p[2]+vp[i+12]);if(v[3]<=0)return null;return {x:(v[0]/v[3]*.5+.5)*canvas.clientWidth,y:(.5-v[1]/v[3]*.5)*canvas.clientHeight,visible:Math.abs(v[0]/v[3])<1&&Math.abs(v[1]/v[3])<1};}
 return {frame,project,camera,get meshCount(){return meshes.size;}};
}
root.ClimbRender={create};
})(globalThis);
