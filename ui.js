/* ================= UI ================= */
const $=s=>document.querySelector(s);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let G=newGame({sector:'agri',profile:'heritier'});
let speed=1,paused=true,modalOpen=false,acc=0,lastT=performance.now();
const WEEK_MS=2000;
const ui={tab:'terrain',sel:null,hover:null,finance:true,loanAmt:0,loanMonths:60,busy:false,dirty:false};
const CO=()=>G.cos[G.cur];
const txt=(v,c)=>typeof v==='function'?v(c):v;

/* ---------- audio ---------- */
let AC=null,soundOn=true;
function initAudio(){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();AC.resume&&AC.resume();}catch(e){AC=null;}}
function tone(f,t0,d,type='sine',g=0.05){if(!AC||!soundOn)return;const o=AC.createOscillator(),v=AC.createGain();o.type=type;o.frequency.value=f;
  v.gain.setValueAtTime(0,AC.currentTime+t0);v.gain.linearRampToValueAtTime(g,AC.currentTime+t0+0.01);v.gain.exponentialRampToValueAtTime(0.0001,AC.currentTime+t0+d);
  o.connect(v).connect(AC.destination);o.start(AC.currentTime+t0);o.stop(AC.currentTime+t0+d+0.05);}
let lastSfx={};
function sfx(k){if(!AC||!soundOn)return;const n=performance.now();if(n-(lastSfx[k]||0)<120)return;lastSfx[k]=n;
  if(k==='coin'){tone(988,0,0.12,'triangle',0.035);tone(1318,0.06,0.18,'triangle',0.03);}
  else if(k==='build'){[392,523,659].forEach((f,i)=>tone(f,i*0.08,0.3,'triangle',0.04));}
  else if(k==='bad'){tone(196,0,0.3,'sawtooth',0.03);tone(147,0.15,0.4,'sawtooth',0.03);}
  else if(k==='event'){tone(660,0,0.12,'square',0.02);tone(880,0.1,0.15,'square',0.02);}
  else if(k==='click')tone(1400,0,0.04,'square',0.012);
  else if(k==='season'){tone(523,0,0.4,'sine',0.03);tone(784,0.12,0.5,'sine',0.025);}}
$('#snd').onclick=()=>{soundOn=!soundOn;initAudio();$('#snd').textContent='Son : '+(soundOn?'on':'off');$('#snd').setAttribute('aria-pressed',soundOn);};

/* ---------- colour helpers ---------- */
function hexRgb(h){return[1,3,5].map(i=>parseInt(h.substr(i,2),16));}
function mix(a,b,t){const A=hexRgb(a),B=hexRgb(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*clamp(t,0,1)).toString(16).padStart(2,'0')).join('');}
function shade(h,f){return'#'+hexRgb(h).map(v=>clamp(Math.round(v*f),0,255).toString(16).padStart(2,'0')).join('');}

/* ---------- map rendering ---------- */
const cv=$('#map'),ctx=cv.getContext('2d');
const chartCv=$('#chart'),cctx=chartCv.getContext('2d');
let dpr=1;
const HW=32,HH=16;
const isoP=(x,y)=>({x:(x-y)*HW,y:(x+y)*HH});
const TH={plaine:4,colline:12,riviere:0,foret:5,village:4,mer:-2};
const GROUND={
  plaine:['#7cab4c','#b2a947','#a2864a','#899783'],
  colline:['#5b8f46','#879044','#836e3f','#73846c'],
  foret:['#3f6e35','#45733a','#6b5f30','#4d6450'],
  village:['#8e9a7c','#a39f78','#9a8a6a','#8c9488'],
};
const CROP_COL={ble:'#e6c45a',mais:'#d5cf6a',tournesol:'#ffc928',colza:'#f3e63c',legumes:'#e0483a'};
function resize(){dpr=Math.min(2,window.devicePixelRatio||1);for(const c of [cv,chartCv]){c.width=Math.round(c.clientWidth*dpr);c.height=Math.round(c.clientHeight*dpr);}cam.ok=false;drawChart();}
let SAVE_KEY='terravolt-save-v1';
function saveGame(){if(!G.started||G.over)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify(G));}catch(e){}}
function loadSave(){try{const t=localStorage.getItem(SAVE_KEY);if(!t)return null;const g=JSON.parse(t);return g&&g.cos&&g.cos.length?g:null;}catch(e){return null;}}
function clearSave(){try{localStorage.removeItem(SAVE_KEY);}catch(e){}}
addEventListener('visibilitychange',()=>{if(document.hidden)saveGame();});
new ResizeObserver(resize).observe(cv);new ResizeObserver(resize).observe(chartCv);
const cam={s:1,x:0,y:0,ok:false,z:1,px:0,py:0,s0:1,x0:0,y0:0};
function fitCam(){const cw=cv.clientWidth,ch=cv.clientHeight;const minX=-N*HW,maxX=N*HW,minY=-95,maxY=2*N*HH+24;
  cam.s0=Math.min((cw-16)/(maxX-minX),(ch-40)/(maxY-minY));cam.x0=cw/2-(minX+maxX)/2*cam.s0;cam.y0=ch/2-(minY+maxY)/2*cam.s0+12;cam.ok=true;applyCam();}
function applyCam(){const cx=cv.clientWidth/2,cy=cv.clientHeight/2;cam.s=cam.s0*cam.z;cam.x=cx+(cam.x0-cx)*cam.z+cam.px;cam.y=cy+(cam.y0-cy)*cam.z+cam.py;}
function zoomAt(f,sx,sy){if(!cam.ok)fitCam();const wx=(sx-cam.x)/cam.s,wy=(sy-cam.y)/cam.s;cam.z=clamp(cam.z*f,0.8,4);applyCam();cam.px+=sx-(cam.x+wx*cam.s);cam.py+=sy-(cam.y+wy*cam.s);applyCam();}
function centerOnCompany(){const c=CO();if(!c||!c.hq||!cam.ok)return;const P=isoP(c.hq.x,c.hq.y);cam.px=0;cam.py=0;applyCam();
  cam.px=cv.clientWidth/2-(cam.x+P.x*cam.s);cam.py=cv.clientHeight/2-(cam.y+(P.y+HH)*cam.s);applyCam();}
document.querySelectorAll('[data-z]').forEach(b=>b.onclick=()=>{const z=b.dataset.z;
  if(z==='fit'){cam.z=1;cam.px=0;cam.py=0;applyCam();}else zoomAt(z==='in'?1.3:1/1.3,cv.clientWidth/2,cv.clientHeight/2);});

function poly(pts,fill,stroke,lw=1){ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();ctx.lineWidth=1;}}
function box(x,y,a,b,h,c){poly([[x-a,y],[x,y+b],[x,y+b-h],[x-a,y-h]],c[1]);poly([[x,y+b],[x+a,y],[x+a,y-h],[x,y+b-h]],c[2]);poly([[x,y-b-h],[x+a,y-h],[x,y+b-h],[x-a,y-h]],c[0]);}
function cyl(x,y,r,h,col){ctx.fillStyle=shade(col,0.75);ctx.beginPath();ctx.ellipse(x,y,r,r/2,0,0,Math.PI);ctx.fill();
  ctx.fillRect(x-r,y-h,r*2,h);const g=ctx.createLinearGradient(x-r,0,x+r,0);g.addColorStop(0,shade(col,0.85));g.addColorStop(0.4,col);g.addColorStop(1,shade(col,0.6));
  ctx.fillStyle=g;ctx.fillRect(x-r,y-h,r*2,h);ctx.beginPath();ctx.ellipse(x,y,r,r/2,0,0,Math.PI);ctx.fill();
  ctx.fillStyle=shade(col,1.12);ctx.beginPath();ctx.ellipse(x,y-h,r,r/2,0,0,7);ctx.fill();}

const smoke=[],floaters=[],walkers=[];
let flash=0;
function tilePts(t){const h=TH[t.ter],p=isoP(t.x,t.y);return{h,T:[p.x,p.y-h],R:[p.x+HW,p.y+HH-h],B:[p.x,p.y+2*HH-h],L:[p.x-HW,p.y+HH-h],C:[p.x,p.y+HH-h]};}
const uvPt=(P,u,v)=>[P.T[0]+u*HW-v*HW,P.T[1]+u*HH+v*HH];

function drawTile(t,time,s,tractorAt){
  const P=tilePts(t),c=CO();
  // sides
  const water=t.ter==='riviere'||t.ter==='mer';
  const top=t.ter==='riviere'?'#3a7fb8':t.ter==='mer'?'#24578a':(GROUND[t.ter]||GROUND.plaine)[s];
  const depth=P.h+8;
  const sideC=t.ter==='riviere'?'#5a4a36':t.ter==='mer'?'#1a3f66':top;
  poly([P.L,P.B,[P.B[0],P.B[1]+depth],[P.L[0],P.L[1]+depth]],shade(sideC,0.62));
  poly([P.B,P.R,[P.R[0],P.R[1]+depth],[P.B[0],P.B[1]+depth]],shade(sideC,0.48));
  // top
  let fill=top;
  if(t.parcel&&(t.parcel.crop||t.parcel.plan))fill=s===3?'#6e5a44':'#7a5d3e';
  if(s===3&&G.weather&&(G.weather.id==='extreme'||G.weather.id==='pluvieuse')&&!water)fill=mix(fill,'#e8eef2',0.55);
  poly([P.T,P.R,P.B,P.L],fill);
  if(t.ter==='mer'){ctx.save();ctx.beginPath();ctx.moveTo(...P.T);ctx.lineTo(...P.R);ctx.lineTo(...P.B);ctx.lineTo(...P.L);ctx.closePath();ctx.clip();
    ctx.strokeStyle='rgba(200,230,255,.28)';ctx.lineWidth=1.2;
    for(let i=0;i<3;i++){const k=((time/4200+t.seed+i/3)%1);const a=uvPt(P,0.1+k*0.6,0.25+i*0.22),b=uvPt(P,0.24+k*0.6,0.25+i*0.22);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.quadraticCurveTo((a[0]+b[0])/2,(a[1]+b[1])/2-2,b[0],b[1]);ctx.stroke();}
    ctx.restore();ctx.lineWidth=1;
    const land=tileAt(G,t.x,t.y-1);if(land&&land.ter!=='mer'){ctx.strokeStyle='rgba(240,250,255,'+(0.35+0.25*Math.sin(time/800+t.x))+')';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(...P.T);ctx.lineTo(...P.R);ctx.stroke();ctx.lineWidth=1;}}
  if(t.ter==='riviere'){ctx.save();ctx.beginPath();ctx.moveTo(...P.T);ctx.lineTo(...P.R);ctx.lineTo(...P.B);ctx.lineTo(...P.L);ctx.closePath();ctx.clip();
    ctx.strokeStyle='rgba(220,240,255,.45)';ctx.lineWidth=1.2;
    for(let i=0;i<3;i++){const k=((time/2600+t.seed+i/3)%1);const a=uvPt(P,k*0.8+0.1,0.2+i*0.25),b=uvPt(P,k*0.8+0.22,0.2+i*0.25);ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();}
    ctx.restore();ctx.lineWidth=1;}
  // parcel
  if(t.parcel)drawParcel(t,P,s,time);
  if(t.irrig){ctx.strokeStyle='rgba(150,210,255,.85)';ctx.lineWidth=1.5;const a=uvPt(P,0.5,0.15),b=uvPt(P,0.5,0.85);ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();ctx.lineWidth=1;
    const k=(time/900+t.seed)%1;ctx.fillStyle='rgba(170,220,255,.6)';const d=uvPt(P,0.5,0.15+0.7*k);ctx.beginPath();ctx.arc(d[0],d[1]-2,2.2,0,7);ctx.fill();}
  // ownership
  if(t.owner){const oc=G.cos.find(x=>x.id===t.owner);ctx.save();if(t.lease)ctx.setLineDash([3,3]);
    poly([[P.T[0],P.T[1]+2],[P.R[0]-3,P.R[1]],[P.B[0],P.B[1]-2],[P.L[0]+3,P.L[1]]],null,oc?oc.color+'cc':'#fff',1.4);ctx.restore();}
  // content
  if(t.ter==='foret')drawTrees(t,P,s);
  if(t.ter==='village')drawVillage(t,P,time);
  if(t.asset)drawAsset(t,P,time,s);
  if(tractorAt.has(t))drawTractor(P,time,tractorAt.get(t));
  // hover/select
  if(ui.hover&&ui.hover.x===t.x&&ui.hover.y===t.y)poly([P.T,P.R,P.B,P.L],'rgba(255,255,255,.12)','rgba(255,255,255,.6)');
  if(ui.sel&&ui.sel.x===t.x&&ui.sel.y===t.y){const a=0.6+0.4*Math.sin(time/250);ctx.globalAlpha=a;poly([P.T,P.R,P.B,P.L],null,c.color,2.5);ctx.globalAlpha=1;}
}
function drawParcel(t,P,s,time){
  const p=t.parcel;
  if(!p.crop&&!p.plan)return;
  ctx.strokeStyle='rgba(60,40,25,.55)';ctx.lineWidth=1;
  for(let i=0;i<6;i++){const u=0.14+i*0.145;const a=uvPt(P,u,0.08),b=uvPt(P,u,0.92);ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();}
  if(!p.crop)return;
  const C=CROPS[p.crop.id];const g=clamp((G.w-p.crop.w0+acc/WEEK_MS*speed)/C.weeks,0,1);
  const ripe=CROP_COL[p.crop.id];
  let col=mix('#5fae45',ripe,(g-0.55)/0.4);
  if(p.crop.id==='colza'&&g>0.55&&g<0.8)col='#f7ea3a';else if(p.crop.id==='colza'&&g>=0.8)col='#9a8d4a';
  const hgt=(p.crop.id==='mais'?9:p.crop.id==='tournesol'?8:p.crop.id==='legumes'?3:5)*Math.max(0.15,g);
  for(let i=0;i<6;i++){const u=0.14+i*0.145;for(let j=0;j<6;j++){const v=0.14+j*0.145;const [x,y]=uvPt(P,u,v);
    ctx.strokeStyle=col;ctx.lineWidth=p.crop.id==='mais'?1.6:1.2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(g>0.3?Math.sin(time/700+i+j)*0.6:0),y-hgt);ctx.stroke();
    if(p.crop.id==='tournesol'&&g>0.65){ctx.fillStyle='#ffc928';ctx.beginPath();ctx.arc(x,y-hgt,1.8,0,7);ctx.fill();}
    if(p.crop.id==='legumes'&&g>0.55){ctx.fillStyle=(i+j)%2?'#e0483a':'#f08a3c';ctx.beginPath();ctx.arc(x+1,y-1.5,1.6,0,7);ctx.fill();}}}
  ctx.lineWidth=1;
  if(g>=0.97){const a=0.5+0.5*Math.sin(time/200);ctx.fillStyle=`rgba(255,211,107,${a})`;ctx.beginPath();ctx.arc(P.C[0],P.C[1]-16,3,0,7);ctx.fill();}
}
function drawTrees(t,P,s){
  const crown=[['#3e8a43','#2f6f39'],['#3b7d38','#2c6431'],['#c7742f','#9e5a24'],['#2e5b45','#24493a']][s];
  const pos=[[0.3,0.3],[0.7,0.35],[0.4,0.68],[0.72,0.72],[0.18,0.6]];
  pos.forEach(([u,v],i)=>{const [x,y]=uvPt(P,u,v);const h=12+((t.seed*10+i*3)%6);
    ctx.fillStyle='#4a3626';ctx.fillRect(x-1,y-4,2,5);
    ctx.fillStyle=crown[i%2];ctx.beginPath();ctx.moveTo(x,y-h-6);ctx.lineTo(x+6,y-3);ctx.lineTo(x-6,y-3);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.08)';ctx.beginPath();ctx.moveTo(x,y-h-6);ctx.lineTo(x-6,y-3);ctx.lineTo(x-1,y-3);ctx.closePath();ctx.fill();});
}
function drawVillage(t,P,time){
  const pos=[[0.3,0.35],[0.68,0.4],[0.45,0.72]];const roofs=['#b5533c','#c06a3a','#8f4a3a'];
  if(t.village&&t.village.sup){const sc=G.cos.find(x=>x.id===t.village.sup);const [x,y]=uvPt(P,0.78,0.72);
    ctx.strokeStyle='#9aa4ab';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-4,y);ctx.lineTo(x-2,y-14);ctx.moveTo(x+4,y);ctx.lineTo(x+2,y-14);ctx.stroke();ctx.lineWidth=1;
    cyl(x,y-14,6,8,sc?sc.color:'#7cc8ff');}
  pos.forEach(([u,v],i)=>{const [x,y]=uvPt(P,u,v);box(x,y,7,3.5,8,['#e8dfcf','#cfc4b0','#b5aa96']);
    poly([[x-7,y-8],[x,y-8+3.5],[x,y-16],],roofs[i]);poly([[x,y-8+3.5],[x+7,y-8],[x,y-16]],shade(roofs[i],0.8));
    ctx.fillStyle='rgba(255,214,120,.8)';ctx.fillRect(x+2,y-5,2,2);});
}
function drawAsset(t,P,time,s){
  const a=t.asset,[cx,cy]=P.C,c=G.cos.find(x=>x.id===t.owner)||CO();
  if(a.type!=='hq'&&!a.built){drawSite(cx,cy,a,time);return;}
  switch(a.type){
    case'hq':
      if(c.sector==='agri'){box(cx,cy+2,15,7.5,13,['#e2d6bd','#c1b195','#a4967c']);
        poly([[cx-15,cy+2-13],[cx,cy+2+7.5-13],[cx,cy-24]],'#a33f2f');poly([[cx,cy+2+7.5-13],[cx+15,cy+2-13],[cx,cy-24]],'#c24e38');
        ctx.fillStyle='#4a3a2a';ctx.fillRect(cx+4,cy-2,3,6);ctx.fillStyle='rgba(255,210,120,.85)';ctx.fillRect(cx-9,cy-6,3,3);}
      else{box(cx,cy+2,16,8,26,['#cfd8de','#9fb0bb','#7f919d']);
        ctx.fillStyle='rgba(180,220,255,.7)';for(let r=0;r<4;r++)for(let k=0;k<3;k++){ctx.fillRect(cx-14+k*4.4,cy-20+r*5+k*2.2,3,2.5);ctx.fillRect(cx+3+k*4.4,cy-20+r*5+(2-k)*2.2-2,3,2.5);}
        poly([[cx-16,cy+2-26],[cx,cy+2+8-26],[cx+16,cy+2-26],[cx,cy+2-8-26]],c.color);}
      break;
    case'silo':{const fillLvl=c.sector==='agri'?clamp(stockUsed(c)/Math.max(1,siloCap(G,c)),0,1):0;
      cyl(cx-6,cy,7,26,'#b7c0c6');cyl(cx+7,cy+4,7,22,'#aab4ba');
      ctx.fillStyle=c.color;ctx.fillRect(cx-13,cy-26+26*(1-fillLvl),2,26*fillLvl);
      poly([[cx-6-7,cy-26],[cx-6,cy-34],[cx-6+7,cy-26]],'#8c969c');break;}
    case'serre':{ctx.fillStyle='#4f9a4a';for(let i=0;i<5;i++){const [x,y]=uvPt(P,0.25+i*0.12,0.5);ctx.fillRect(x-1,y-4,2,4);}
      ctx.globalAlpha=0.55;box(cx,cy+3,22,11,14,['#dff4ff','#a9d6ec','#8bc2dc']);ctx.globalAlpha=1;
      poly([[cx-22,cy+3-14],[cx,cy+3+11-14],[cx+22,cy+3-14],[cx,cy+3-11-14]],null,'rgba(255,255,255,.8)');break;}
    case'atelier':box(cx,cy+3,18,9,16,['#c9b9a0','#a8987f','#8c7e68']);
      for(let i=0;i<3;i++)poly([[cx-14+i*10,cy-13+i*-0],[cx-9+i*10,cy-20],[cx-4+i*10,cy-13]],'#7a6a58');
      cyl(cx+11,cy-6,2.5,16,'#6b6b70');if(c.sector==='agri'&&(c.stock.ble||0)>0)puff(cx+11,cy-22,time);break;
    case'solaire':for(let r=0;r<3;r++)for(let k=0;k<2;k++){const [x,y]=uvPt(P,0.18+k*0.38,0.2+r*0.26);
      poly([[x,y],[x+HW*0.3,y+HH*0.3],[x+HW*0.3,y+HH*0.3-7],[x,y-7]],'#2b4c7e','#6f9bd8');
      ctx.strokeStyle='rgba(160,200,255,.35)';ctx.beginPath();ctx.moveTo(x+2,y-5);ctx.lineTo(x+HW*0.3-2,y+HH*0.3-5);ctx.stroke();}break;
    case'eolienne':{ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(cx+6,cy+2,12,4,0,0,7);ctx.fill();
      box(cx,cy+1,5,2.5,3,['#cfd5d8','#aab1b6','#8e979c']);
      ctx.strokeStyle='#eef1f3';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx,cy-74);ctx.stroke();ctx.lineWidth=1;
      ctx.fillStyle='#e3e7ea';ctx.fillRect(cx-3,cy-78,8,5);
      const wf=WIND_S[s]*(G.weather.wind||1);const ang=a.down?0.4:(time/1000)*(1.5*wf)+t.seed*6;
      ctx.strokeStyle='#f6f8f9';ctx.lineWidth=2.2;for(let i=0;i<3;i++){const an=ang+i*Math.PI*2/3;ctx.beginPath();ctx.moveTo(cx,cy-76);ctx.lineTo(cx+Math.cos(an)*28,cy-76+Math.sin(an)*28);ctx.stroke();}
      ctx.lineWidth=1;ctx.fillStyle='#d9dee1';ctx.beginPath();ctx.arc(cx,cy-76,2.5,0,7);ctx.fill();
      if(Math.sin(time/600)>0.6){ctx.fillStyle='#ff4d4d';ctx.beginPath();ctx.arc(cx+4,cy-79,1.3,0,7);ctx.fill();}break;}
    case'hydro':{box(cx,cy+2,26,13,9,['#c3c8cc','#a1a7ac','#868d93']);box(cx-8,cy-2,7,3.5,8,['#d8dcdf','#b3b9bd','#979ea3']);
      for(let i=0;i<6;i++){const k=(time/700+i/6)%1;const [x,y]=uvPt(P,0.2+i*0.12,0.8+k*0.2);ctx.fillStyle=`rgba(255,255,255,${0.7*(1-k)})`;ctx.beginPath();ctx.arc(x,y,1.5+k*2,0,7);ctx.fill();}break;}
    case'gaz':box(cx-5,cy+4,15,7.5,15,['#b8b2a8','#968f85','#7b756c']);cyl(cx+7,cy-3,3,30,'#d5d0c8');cyl(cx+13,cy,3,24,'#c9c3ba');
      ctx.fillStyle='#d24a3a';ctx.fillRect(cx+4,cy-30,6,2);
      if(a.run>0.1&&!a.down){puff(cx+7,cy-34,time);puff(cx+13,cy-25,time+300);}break;
    case'port':{const sea=[[0.85,0.5],[1.05,0.62]];ctx.fillStyle='#8a6a48';
      for(let i=0;i<4;i++){const a=uvPt(P,0.35,0.35+i*0.12),b=uvPt(P,1.1,0.35+i*0.12);ctx.strokeStyle='#7a5c3c';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();}ctx.lineWidth=1;
      const [hx,hy]=uvPt(P,0.3,0.4);box(hx,hy,9,4.5,10,['#d7d1c4','#b3ab9b','#968e7f']);poly([[hx-9,hy-10],[hx,hy-10+4.5],[hx,hy-17]],'#5f7d8f');poly([[hx,hy-10+4.5],[hx+9,hy-10],[hx,hy-17]],'#4c6878');
      ctx.strokeStyle='#f2c230';ctx.lineWidth=2;const [kx,ky]=uvPt(P,0.7,0.3);ctx.beginPath();ctx.moveTo(kx,ky);ctx.lineTo(kx,ky-26);ctx.lineTo(kx+14,ky-20);ctx.stroke();ctx.lineWidth=1;break;}
    case'conserverie':box(cx,cy+3,18,9,14,['#d9d2c3','#b5ad9c','#9a9283']);ctx.fillStyle=c.color;ctx.fillRect(cx-16,cy-8,14,3);
      cyl(cx+10,cy-6,2.5,14,'#8f9498');for(let i=0;i<3;i++){const [x,y]=uvPt(P,0.25+i*0.08,0.85);cyl(x,y,2,4,'#c9ccd0');}break;
    case'forage':{box(cx-3,cy+3,8,4,9,['#eef2f5','#c7d0d6','#a9b4bc']);poly([[cx-11,cy+3-9],[cx-3,cy+3+4-9],[cx+5,cy+3-9],[cx-3,cy+3-4-9]],'#3f8fd8');
      ctx.strokeStyle='#5b6b77';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx+5,cy+2);ctx.lineTo(cx+14,cy+6);ctx.stroke();ctx.lineWidth=1;
      const k=(time/600)%1;ctx.fillStyle=`rgba(124,200,255,${1-k})`;ctx.beginPath();ctx.arc(cx+14,cy+6-k*6,1.6,0,7);ctx.fill();break;}
    case'prise':box(cx,cy+4,14,7,6,['#c3c8cc','#a1a7ac','#868d93']);ctx.strokeStyle='#5b6670';for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(cx-10+i*5,cy-2+i*2.5);ctx.lineTo(cx-10+i*5,cy+3+i*2.5);ctx.stroke();}
      for(let i=0;i<4;i++){const k=(time/800+i/4)%1;const [x,y]=uvPt(P,0.2+i*0.18,0.25+k*0.3);ctx.fillStyle=`rgba(255,255,255,${0.6*(1-k)})`;ctx.beginPath();ctx.arc(x,y,1.3,0,7);ctx.fill();}break;
    case'station':{for(const [u,v] of [[0.32,0.38],[0.62,0.52]]){const [x,y]=uvPt(P,u,v);ctx.fillStyle='#9aa3a9';ctx.beginPath();ctx.ellipse(x,y,9,4.5,0,0,7);ctx.fill();
        ctx.fillStyle='#4f9fd6';ctx.beginPath();ctx.ellipse(x,y-1.5,7.5,3.6,0,0,7);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.6)';ctx.beginPath();const an=time/1500;ctx.moveTo(x,y-1.5);ctx.lineTo(x+Math.cos(an)*7,y-1.5+Math.sin(an)*3.5);ctx.stroke();}
      const [bx,by]=uvPt(P,0.3,0.75);box(bx,by,8,4,10,['#e9edf0','#c3cad0','#a7b0b8']);break;}
    case'dessal':box(cx,cy+3,22,11,12,['#f1f4f6','#cfd6db','#b3bcc3']);for(let i=0;i<4;i++){ctx.fillStyle='#4f9fd6';ctx.fillRect(cx-18+i*6,cy-6+i*3,3,2);}
      cyl(cx+14,cy-4,3,12,'#d8dde1');break;
    case'batterie':for(let i=0;i<3;i++){const [x,y]=uvPt(P,0.3+i*0.2,0.45+i*0.05);box(x,y,6,3,7,['#e9eef0','#bfc9cd','#a3afb4']);
      ctx.fillStyle=Math.sin(time/300+i)>0?'#6fd3a8':'#2e5b48';ctx.fillRect(x+1,y-5,2,2);}break;
  }
  if(a.down){const k=Math.sin(time/180)>0;if(k){ctx.fillStyle='#ff4d4d';ctx.beginPath();ctx.moveTo(cx,cy-42);ctx.lineTo(cx+7,cy-30);ctx.lineTo(cx-7,cy-30);ctx.closePath();ctx.fill();
    ctx.fillStyle='#fff';ctx.font='700 9px Figtree,sans-serif';ctx.textAlign='center';ctx.fillText('!',cx,cy-32);}}
}
function drawSite(cx,cy,a,time){
  const A=ASSETS[a.type],k=clamp(a.prog/A.build,0,1);
  ctx.save();ctx.setLineDash([2,2]);poly([[cx-16,cy],[cx,cy+8],[cx+16,cy],[cx,cy-8]],'rgba(120,90,50,.35)','#e9c34a');ctx.restore();
  if(k>0)box(cx,cy+2,12,6,20*k,['#b9a98f','#97896f','#7e7259']);
  ctx.strokeStyle='#f2c230';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx+14,cy+2);ctx.lineTo(cx+14,cy-46);ctx.lineTo(cx-14,cy-40);ctx.stroke();
  ctx.lineWidth=1;ctx.beginPath();const sw=Math.sin(time/700)*3;ctx.moveTo(cx-8+sw,cy-41);ctx.lineTo(cx-8+sw,cy-24);ctx.stroke();
  ctx.fillStyle='rgba(17,22,19,.85)';ctx.beginPath();ctx.roundRect(cx-15,cy-62,30,12,6);ctx.fill();
  ctx.fillStyle='#f2c230';ctx.font='600 8px JetBrains Mono,monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(Math.round(k*100)+' %',cx,cy-56);ctx.textBaseline='alphabetic';
}
function puff(x,y,time){if(reduced)return;if(Math.random()<0.12)smoke.push({x:x+rand(-1,1),y,vx:rand(0.05,0.25),vy:-rand(0.25,0.45),r:2,life:0,max:rand(1600,2600)});}
function drawTractor(P,time,i){
  const per=6000,k=((time+i*1700)%per)/per;const fw=k<0.5;const v=fw?0.1+1.6*k:0.1+1.6*(1-k);const u=0.2+0.6*((Math.floor(time/per)+i)%4)/3;
  const [x,y]=uvPt(P,u,v);
  ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(x,y+1,6,2.5,0,0,7);ctx.fill();
  box(x,y,5,2.5,5,['#e2463a','#b8362c','#962c24']);box(x+(fw?-2:2),y-5,2.5,1.3,4,['#2a2f33','#1d2124','#16191b']);
  ctx.fillStyle='#1b1b1b';ctx.beginPath();ctx.arc(x-3,y+1,2,0,7);ctx.arc(x+3.5,y+2,1.4,0,7);ctx.fill();
}

function draw(time){
  const cw=cv.clientWidth,ch=cv.clientHeight;if(!cw||!ch)return;
  if(!cam.ok)fitCam();
  const s=seasonOf(G.w);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const sky=[['#1d2a24','#2b3b2f'],['#24291c','#38391f'],['#2a2218','#3a2e1f'],['#1a2026','#28323a']][s];
  const g=ctx.createLinearGradient(0,0,0,ch);g.addColorStop(0,sky[0]);g.addColorStop(1,sky[1]);ctx.fillStyle=g;ctx.fillRect(0,0,cw,ch);
  ctx.setTransform(dpr*cam.s,0,0,dpr*cam.s,dpr*cam.x,dpr*cam.y);
  // tractors assignment
  const c=CO(),tractorAt=new Map();
  if(c.sector==='agri'){const busy=owned(G,c).filter(t=>t.parcel&&t.parcel.crop);const n=Math.min(c.fleet.filter(f=>!f.down).length,busy.length,8);
    for(let i=0;i<n;i++){const t=busy[(i*3+Math.floor(time/24000))%busy.length];if(!tractorAt.has(t))tractorAt.set(t,i);}}
  for(let d=0;d<2*N-1;d++)for(let x=0;x<N;x++){const y=d-x;if(y<0||y>=N)continue;drawTile(G.tiles[y][x],time,s,tractorAt);}
  drawPipes(time);drawBoats(time);
  // walkers
  drawWalkers(time);
  // smoke
  for(const p of smoke){ctx.fillStyle=`rgba(210,210,210,${0.45*(1-p.life/p.max)})`;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fill();}
  // floaters
  ctx.textAlign='center';ctx.textBaseline='middle';
  for(const f of floaters){const a=1-f.t/f.life;ctx.globalAlpha=Math.min(1,a*1.6);ctx.font='800 13px "Big Shoulders Display",Impact,sans-serif';
    const w=ctx.measureText(f.text).width+10;ctx.fillStyle='rgba(17,22,19,.8)';ctx.beginPath();ctx.roundRect(f.x-w/2,f.y-8,w,16,8);ctx.fill();ctx.fillStyle=f.color;ctx.fillText(f.text,f.x,f.y+0.5);}
  ctx.globalAlpha=1;ctx.textBaseline='alphabetic';
  // weather overlay (screen space)
  ctx.setTransform(dpr,0,0,dpr,0,0);drawWeather(cw,ch,time,s);
}
const drops=Array.from({length:110},()=>({x:Math.random(),y:Math.random(),z:rand(0.5,1)}));
function drawWeather(cw,ch,time,s){
  const W=G.weather;if(!W||reduced)return;
  const snow=s===3&&(W.id==='pluvieuse'||W.id==='extreme');
  if(W.id==='seche'){ctx.fillStyle='rgba(255,170,60,.07)';ctx.fillRect(0,0,cw,ch);}
  if(W.id==='extreme'){ctx.fillStyle='rgba(10,14,20,.22)';ctx.fillRect(0,0,cw,ch);if(Math.random()<0.004)flash=1;if(flash>0){ctx.fillStyle=`rgba(255,255,255,${flash*0.35})`;ctx.fillRect(0,0,cw,ch);flash-=0.08;}}
  if(W.id==='pluvieuse'||W.id==='extreme'){ctx.strokeStyle=snow?'rgba(255,255,255,.75)':'rgba(180,210,240,.35)';ctx.fillStyle='rgba(255,255,255,.8)';
    for(const d of drops){const sp=snow?0.00004:0.0006;d.y=(d.y+sp*16*d.z*(snow?6:1))%1;const x=(d.x*cw+(snow?Math.sin(time/900+d.x*20)*8:d.y*30))%cw,y=d.y*ch;
      if(snow){ctx.beginPath();ctx.arc(x,y,1.3*d.z,0,7);ctx.fill();}else{ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-3,y+10*d.z);ctx.stroke();}}}
  if(W.id==='venteuse'){ctx.strokeStyle='rgba(255,255,255,.18)';for(let i=0;i<14;i++){const y=((i*67)%ch),x=((time/4+i*190)%(cw+200))-100;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+40,y-6,x+90,y);ctx.stroke();}}
}
function drawPipes(time){
  for(const v of allTiles(G)){if(!v.village||!v.village.sup)continue;const co=G.cos.find(x=>x.id===v.village.sup);if(!co)continue;
    const src=owned(G,co).filter(t=>t.asset&&(t.asset.type==='station'||t.asset.type==='dessal'));if(!src.length)continue;
    const s=src.sort((a,b)=>dist(a,v)-dist(b,v))[0];const A=tilePts(s).C,B=tilePts(v).C;
    ctx.save();ctx.setLineDash([4,4]);ctx.strokeStyle=co.color+'99';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(A[0],A[1]+4);ctx.lineTo(B[0],B[1]+4);ctx.stroke();ctx.restore();ctx.lineWidth=1;
    for(let i=0;i<3;i++){const k=((time/2400)+i/3)%1;ctx.fillStyle='#7cc8ff';ctx.beginPath();ctx.arc(A[0]+(B[0]-A[0])*k,A[1]+4+(B[1]-A[1])*k,1.6,0,7);ctx.fill();}}
}
function drawBoats(time){
  for(const co of G.cos){if(!co.boats||!co.boats.length)continue;
    const port=owned(G,co).find(t=>t.asset&&t.asset.type==='port');if(!port)continue;
    co.boats.forEach((b,i)=>{const P=tilePts(port);let x,y;
      if(b.atSea){const k=(time/9000+i*0.37)%1;const sway=Math.sin(k*Math.PI*2);const sea=isoP(clamp(port.x+sway*3+i-1,0,N-1),N-1);
        x=sea.x+HW*0.2+Math.sin(time/700+i)*2;y=sea.y+HH*0.9;}
      else{const d=uvPt(P,1.15+0.1*(i%2),0.3+0.18*i);x=d[0];y=d[1]+6;}
      const bob=Math.sin(time/500+i)*1;
      const hull=b.type==='thonier'?14:b.type==='chalutier'?10:7;
      ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(x,y+2,hull+2,3,0,0,7);ctx.fill();
      poly([[x-hull,y-3+bob],[x+hull,y-3+bob],[x+hull-3,y+2+bob],[x-hull+2,y+2+bob]],co.color);
      poly([[x-hull,y-3+bob],[x+hull,y-3+bob],[x+hull-1,y-1.5+bob],[x-hull+1,y-1.5+bob]],'#f2f2ef');
      box(x-hull*0.25,y-3+bob,hull*0.32,hull*0.16,hull*0.5,['#eef0ee','#cfd3d0','#b5bab7']);
      if(b.type!=='fileyeur'){ctx.strokeStyle='#d0d4d6';ctx.beginPath();ctx.moveTo(x+hull*0.4,y-3+bob);ctx.lineTo(x+hull*0.4,y-3-hull*0.9+bob);ctx.stroke();}
      if(b.down&&Math.sin(time/180)>0){ctx.fillStyle='#ff4d4d';ctx.beginPath();ctx.arc(x,y-14,2.5,0,7);ctx.fill();}});}
}
function drawWalkers(time){
  const c=CO();const tiles=owned(G,c);if(!tiles.length)return;
  const want=Math.min(24,staffTotal(c)+1);
  while(walkers.length<want){const a=pick(tiles),b=pick(tiles);walkers.push({a,b,t:Math.random(),sp:rand(0.00008,0.00016),col:pick(['#ffd36b','#e9eef0','#7cb7ff','#ff9f7a'])});}
  walkers.length=want;
  for(const w of walkers){w.t+=w.sp*16;if(w.t>=1||!w.a||w.a.owner!==c.id){w.a=w.b&&w.b.owner===c.id?w.b:pick(tiles);w.b=pick(tiles);w.t=0;}
    const A=tilePts(w.a).C,B=tilePts(w.b).C;const x=A[0]+(B[0]-A[0])*w.t,y=A[1]+(B[1]-A[1])*w.t+4;const bob=Math.abs(Math.sin(time/120+w.sp*1e5))*1.2;
    ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(x,y+1,2.5,1,0,0,7);ctx.fill();
    ctx.fillStyle=w.col;ctx.fillRect(x-1.3,y-6-bob,2.6,5);ctx.fillStyle='#f0c9a0';ctx.beginPath();ctx.arc(x,y-7.5-bob,1.5,0,7);ctx.fill();}
}
function updateFx(dt){
  while(G.fx.length){const f=G.fx.shift();const P=tilePts(G.tiles[f.y][f.x]);floaters.push({x:P.C[0],y:P.C[1]-30,text:f.text,color:f.color,t:0,life:1800});
    if(f.text.startsWith('+'))sfx('coin');else if(f.color==='#ff7d6b')sfx('bad');else sfx('build');}
  for(let i=floaters.length-1;i>=0;i--){const f=floaters[i];f.t+=dt;f.y-=dt*0.018;if(f.t>f.life)floaters.splice(i,1);}
  for(let i=smoke.length-1;i>=0;i--){const p=smoke[i];p.life+=dt;p.x+=p.vx*dt/16;p.y+=p.vy*dt/16;p.r+=0.03*dt/16;if(p.life>p.max)smoke.splice(i,1);}
}

/* ---------- picking ---------- */
function tileFromEvent(e){const r=cv.getBoundingClientRect();const mx=e.clientX-r.left,my=e.clientY-r.top;
  const wx=(mx-cam.x)/cam.s,wy=(my-cam.y)/cam.s+4;const gx=Math.floor((wx/HW+wy/HH)/2),gy=Math.floor((wy/HH-wx/HW)/2);
  return tileAt(G,gx,gy);}
const drag={on:false,moved:false,x:0,y:0};
cv.addEventListener('pointerdown',e=>{drag.on=true;drag.moved=false;drag.x=e.clientX;drag.y=e.clientY;});
addEventListener('pointerup',()=>{drag.on=false;});
cv.addEventListener('wheel',e=>{e.preventDefault();const r=cv.getBoundingClientRect();zoomAt(e.deltaY<0?1.12:1/1.12,e.clientX-r.left,e.clientY-r.top);},{passive:false});
cv.addEventListener('pointermove',e=>{
  if(drag.on){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(drag.moved||Math.abs(dx)+Math.abs(dy)>5){drag.moved=true;cam.px+=dx;cam.py+=dy;drag.x=e.clientX;drag.y=e.clientY;applyCam();$('#hover').hidden=true;return;}}
  const t=tileFromEvent(e);ui.hover=t?{x:t.x,y:t.y}:null;
  const h=$('#hover');if(!t||e.pointerType==='touch'){h.hidden=true;return;}h.hidden=false;h.innerHTML=tileTip(t);});
cv.addEventListener('pointerleave',()=>{ui.hover=null;$('#hover').hidden=true;});
cv.addEventListener('click',e=>{if(drag.moved){drag.moved=false;return;}const t=tileFromEvent(e);if(!t)return;ui.sel={x:t.x,y:t.y};setTab('terrain');sfx('click');});
function tileTip(t){const c=CO();let s=`<b>${TERRAIN[t.ter].name}</b>`;
  if(t.asset)s+=` · ${ASSETS[t.asset.type].name}${!t.asset.built?' (chantier)':''}`;
  if(t.village){const sc=G.cos.find(x=>x.id===t.village.sup);s+=` · ${nfmt.format(t.village.pop)} habitants<br><span class="muted">${sc?'Eau fournie par '+sc.name+' · satisfaction '+Math.round(t.village.sat):'Pas encore raccordé à un réseau d’eau'}</span>`;}
  if(t.ter==='mer')s+=` · zone de pêche`;
  if(t.parcel&&t.parcel.crop){const C=CROPS[t.parcel.crop.id];s+=` · ${C.name}, récolte dans ${Math.max(0,C.weeks-(G.w-t.parcel.crop.w0))} sem.`;}
  else if(t.parcel&&t.parcel.plan)s+=` · prévu : ${CROPS[t.parcel.plan].name.toLowerCase()}`;
  if(!t.owner&&TERRAIN[t.ter].buy)s+=`<br><span class="muted">${reachable(G,c,t)?'Disponible : '+eur(TERRAIN[t.ter].buy):'Trop loin de tes terres'}</span>`;
  if(t.owner===c.id)s+=`<br><span class="muted">${t.lease?'En fermage':'À toi'}</span>`;
  return s;}

/* ---------- chart & schedule ---------- */
function drawChart(){
  const w=chartCv.clientWidth,h=chartCv.clientHeight;if(!w||!h)return;
  cctx.setTransform(dpr,0,0,dpr,0,0);cctx.clearRect(0,0,w,h);
  const goods=SECTOR_GOODS[CO().sector];const n=Math.min(104,G.hist[goods[0]].length);
  const series=goods.map(g=>G.hist[g].slice(-n).map(v=>v/GOODS[g].base*100));
  let lo=Math.min(...series.flat(),80),hi=Math.max(...series.flat(),120);const pad=(hi-lo)*0.08;lo-=pad;hi+=pad;
  const X=i=>4+i/(n-1)*(w-8),Y=v=>4+(h-8)*(1-(v-lo)/(hi-lo));
  cctx.strokeStyle='rgba(152,166,156,.25)';cctx.setLineDash([3,4]);cctx.beginPath();cctx.moveTo(4,Y(100));cctx.lineTo(w-4,Y(100));cctx.stroke();cctx.setLineDash([]);
  cctx.fillStyle='rgba(152,166,156,.7)';cctx.font='10px JetBrains Mono,monospace';cctx.fillText('100',6,Y(100)-3);
  series.forEach((sr,k)=>{cctx.strokeStyle=GOODS[goods[k]].color;cctx.lineWidth=1.6;cctx.beginPath();sr.forEach((v,i)=>i?cctx.lineTo(X(i),Y(v)):cctx.moveTo(X(i),Y(v)));cctx.stroke();});
  cctx.lineWidth=1;
}
function renderChips(){const goods=SECTOR_GOODS[CO().sector];
  $('#chips').innerHTML=goods.map(g=>{const h=G.hist[g],now=G.px[g],prev=h[h.length-5]||now,d=(now-prev)/prev;
    return`<span style="--c:${GOODS[g].color}"><i></i>${GOODS[g].name} <b class="mono">${num(now,g==='elec'||g==='gaz'?1:0)} €/${GOODS[g].unit}</b> <span class="${d>=0?'pos':'neg'} mono">${d>=0?'+':''}${pct(d)}</span></span>`;}).join('');}
function renderSched(){
  const c=CO(),f=forecast(G,c,8),isC=has(c,'comptable');const rows=[];
  for(const wk of f)for(const [lbl,amt] of wk.ev)rows.push({w:wk.w,lbl,amt});
  if(c.sector==='agri'){for(const t of owned(G,c)){if(!t.parcel||!t.parcel.crop)continue;const C=CROPS[t.parcel.crop.id],left=C.weeks-(G.w-t.parcel.crop.w0);if(left<=8)rows.push({w:G.w+left,lbl:'Récolte '+C.name.toLowerCase(),amt:null});}}
  for(const t of owned(G,c))if(t.asset&&!t.asset.built){const left=ASSETS[t.asset.type].build-t.asset.prog;if(left<=8)rows.push({w:G.w+left,lbl:'Mise en service '+ASSETS[t.asset.type].name.toLowerCase(),amt:null});}
  const seen={};const list=rows.sort((a,b)=>a.w-b.w).filter(r=>{const k=r.w+r.lbl;if(seen[k])return false;seen[k]=1;return true;}).slice(0,6);
  $('#sched-note').textContent=isC?'8 prochaines semaines':'montants : comptable requis';
  $('#sched').innerHTML=list.length?list.map(r=>`<li><span class="w">S+${r.w-G.w}</span><span>${r.lbl}</span><span class="a ${r.amt===null?'muted':r.amt<0?'pos':''}">${r.amt===null?'':isC?(r.amt<0?'+'+eur(-r.amt):'−'+eur(r.amt)):'?'}</span></li>`).join(''):'<li class="muted"><span></span><span>Rien d’important dans les 8 semaines</span></li>';
}

/* ---------- top bar ---------- */
const set=(id,v)=>{const e=document.getElementById(id);if(e&&e.innerHTML!==String(v))e.innerHTML=v;};
function renderTop(){
  const c=CO(),y=yearOf(G.w),P=PL(c,y),r=plCalc(P),isC=has(c,'comptable');
  document.documentElement.style.setProperty('--brand',c.color);
  set('co-name',c.name);set('co-meta',`${G.holding?G.holding.name+' · ':''}${SECTORS[c.sector].name} · S${G.w%52+1} ${y}`);
  const cs=$('#cos');cs.hidden=G.cos.length<2;if(G.cos.length>1)set('cos',G.cos.map((x,i)=>`<button class="${i===G.cur?'on':''}" data-co="${i}" style="--c:${x.color}" title="${x.name}"><i></i><span>${x.name}</span></button>`).join(''));
  $('#tab-group').classList.toggle('gold',canCreateHolding(G));
  set('k-cash',eur(c.cash));
  $('#kpi-cash').classList.toggle('warn',c.cash<0);
  set('k-cashd',c.cash<0?`découvert, plafond ${eur(odLimit(c))}`:`découvert possible ${eur(odLimit(c))}`);
  const rc=c.recv.reduce((a,x)=>a+x.amt,0);set('k-recv',eur(rc));set('k-recvd',`${c.recv.length} facture${c.recv.length>1?'s':''} en attente`);
  set('k-debt',eur(debt(c)));const mp=c.loans.filter(l=>l.start<=G.w).reduce((a,l)=>a+l.pay,0);set('k-debtd',mp?`${eur(mp)} / mois`:'aucune échéance');
  set('k-cal',`Chiffre d’affaires ${y}`);set('k-resl',`Résultat ${y}`);
  if(isC){set('k-ca',eur(P.ca));set('k-cad',`EBE ${eur(r.ebe)}`);set('k-res',`<span class="${r.rcai>=0?'pos':'neg'}">${eur(r.rcai)}</span>`);set('k-resd','avant impôt');}
  else{set('k-ca','?');set('k-cad','comptable requis');set('k-res','?');set('k-resd','comptable requis');}
  const m=Math.round(c.morale);set('k-mor',`${m} / 100`);const mb=$('#k-morbar');mb.style.width=m+'%';mb.style.background=m>=60?'var(--good)':m>=40?'var(--cash)':'var(--bad)';
  const W=G.weather;set('p-season',`<b>${SEASONS[seasonOf(G.w)]}</b> ${y}`);
  $('#p-wx').className='pill '+(W.id==='seche'||W.id==='extreme'?'bad':W.id==='ideale'?'good':'');set('p-wx',`Météo : <b>${W.name}</b>`);
  const o=owned(G,c);set('p-own',`<b>${o.length}</b> case${o.length>1?'s':''} · ${o.filter(t=>t.lease).length} en fermage`);
}
function renderLog(){$('#log').innerHTML=G.log.slice(0,40).map(l=>`<li class="${l.cls}">S${l.w%52+1} · <b>${l.text}</b></li>`).join('');}

/* ---------- panes ---------- */
function setTab(t){ui.tab=t;document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('on',b.dataset.tab===t));renderPane(true);}
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
const pane=$('#pane');
pane.addEventListener('pointerdown',()=>{ui.busy=true;});
addEventListener('pointerup',()=>{if(ui.busy){ui.busy=false;setTimeout(()=>{if(ui.dirty)renderPane();},0);}});
function renderPane(force){
  const ae=document.activeElement;
  if(!force&&(ui.busy||(ae&&ae.tagName==='INPUT'&&pane.contains(ae)))){ui.dirty=true;return;}
  ui.dirty=false;const st=pane.scrollTop;
  pane.innerHTML=({terrain:paneTerrain,team:paneTeam,rd:paneRd,market:paneMarket,finance:paneFinance,group:paneGroup})[ui.tab]();
  pane.scrollTop=st;bindInputs();
}
const lock=(what,role)=>`<div class="locked"><b>${role==='daf'?'DAF requis':'Comptable requis'}</b>Recrute ${role==='daf'?'un DAF':'un comptable'} dans l’onglet Équipe pour voir ${what}.</div>`;
const btn=(act,label,dis,cls='btn')=>`<button class="${cls}" data-act="${act}"${dis?' disabled':''}>${label}</button>`;
const tog=(act,on,label)=>`<button class="toggle${on?' on':''}" data-act="${act}" aria-pressed="${on}"><span class="sw"></span>${label}</button>`;

function paneTerrain(){
  const c=CO();
  if(!ui.sel){
    const o=owned(G,c),assets={};o.forEach(t=>{if(t.asset&&t.asset.type!=='hq')assets[t.asset.type]=(assets[t.asset.type]||0)+1;});
    let h=`<div class="sec"><div class="sec-head"><h3>Ton territoire</h3></div><p class="hint" style="margin:0 0 10px">Clique sur une case de la carte pour l’acheter, la louer, la cultiver ou y construire. Tu peux t’étendre jusqu’à 2 cases de tes terres.</p>
      <div class="grid2"><div class="stat"><div class="l">Cases</div><div class="v">${o.length}</div><div class="s">${o.filter(t=>t.lease).length} en fermage</div></div>
      <div class="stat"><div class="l">Valeur des terres</div><div class="v">${eur(landValue(G,c))}</div><div class="s">au prix d’achat</div></div></div></div>`;
    if(Object.keys(assets).length)h+=`<div class="sec"><div class="sec-head"><h3>Installations</h3></div><div class="list">${Object.entries(assets).map(([k,n])=>`<div class="row"><span>${ASSETS[k].name}</span><span class="mono">× ${n}</span></div>`).join('')}</div></div>`;
    if(c.sector==='agri'){const cr=o.filter(t=>t.parcel&&t.parcel.crop).sort((a,b)=>(CROPS[a.parcel.crop.id].weeks-(G.w-a.parcel.crop.w0))-(CROPS[b.parcel.crop.id].weeks-(G.w-b.parcel.crop.w0)));
      const idle=o.filter(t=>t.parcel&&!t.parcel.crop&&!t.parcel.plan).length;
      h+=`<div class="sec"><div class="sec-head"><h3>Cultures</h3><span class="x">${cr.length} en terre</span></div><div class="list">${cr.slice(0,8).map(t=>{const C=CROPS[t.parcel.crop.id],left=C.weeks-(G.w-t.parcel.crop.w0);
        return`<div class="row"><span>${C.name}</span><span class="mono muted">récolte dans ${left} sem.</span></div>`;}).join('')||'<span class="hint">Aucune culture en terre.</span>'}</div>
        ${idle?`<p class="hint" style="color:var(--cash)">${idle} parcelle${idle>1?'s':''} sans plan de culture.</p>`:''}</div>`;}
    else if(c.sector==='peche'){const tot=Object.values(c.last.catch||{}).reduce((a,b)=>a+b,0);
      h+=`<div class="sec"><div class="sec-head"><h3>Flotte</h3><span class="x">${c.boats.length} / ${portCap(G,c)} places au port</span></div><div class="row"><span>Prises de la semaine</span><span class="mono">${num(tot,1)} t · ${eur(c.last.fishRev||0)}</span></div>${c.last.storm?'<p class="hint neg">Tempête : la flotte reste à quai.</p>':''}<p class="hint">Gère ta flotte et tes quotas dans l’onglet Marché.</p></div>`;}
    else if(c.sector==='eau'){const W=c.water;
      h+=`<div class="sec"><div class="sec-head"><h3>Réseau d’eau</h3><span class="x">${servedVillages(G,c).length} village${servedVillages(G,c).length>1?'s':''}</span></div><div class="row"><span>Demande servie</span><span class="mono ${(W.ratio||1)<0.98?'neg':'pos'}">${pct(W.ratio==null?1:W.ratio)}</span></div><div class="row"><span>Fuites</span><span class="mono">${pct(W.leakNow||W.leak)}</span></div><p class="hint">Clique sur un village pour signer une concession. Détails dans l’onglet Marché.</p></div>`;}
    else{const e=expectedWeeklyMWh(G,c);h+=`<div class="sec"><div class="sec-head"><h3>Production</h3></div><div class="row"><span>Semaine dernière</span><span class="mono">${num(c.last.mwh||0)} MWh</span></div><div class="row"><span>Moyenne attendue (hors gaz)</span><span class="mono">${num(e)} MWh / sem.</span></div></div>`;}
    return h;
  }
  const t=G.tiles[ui.sel.y][ui.sel.x],T=TERRAIN[t.ter];
  let h=`<div class="sec"><div class="sec-head"><h3>${T.name}</h3><span class="x">case ${t.x+1}·${t.y+1} ${btn('desel','Fermer',false,'btn ghost sm')}</span></div>`;
  if(t.owner&&t.owner!==c.id){const i=G.cos.findIndex(x=>x.id===t.owner);return h+(i>=0?`<p class="hint">Cette case appartient à ta filiale <b>${G.cos[i].name}</b>.</p><div class="btns" style="margin-top:8px">${btn('co:'+i,'Gérer '+G.cos[i].name)}</div></div>`:`<p class="hint">Cette case appartient à une autre entreprise.</p></div>`);}
  if(!t.owner){
    if(t.village)return h+villageCard(c,t)+'</div>';
    if(t.ter==='mer')return h+`<p class="hint">${c.sector==='peche'?'Zone de pêche. Tes bateaux y partent depuis ton port.':'La mer. Les ports et les usines de dessalement doivent la toucher.'}</p></div>`;
    if(!T.buy)return h+`<p class="hint">Forêt protégée : rien ne peut s’y construire.</p></div>`;
    h+=`<p class="hint" style="margin:0 0 8px">${terrainUse(c,t)}</p>`;
    if(!reachable(G,c,t))return h+`<div class="locked"><b>Trop loin de tes terres</b>Achète ou loue d’abord une case à 2 cases maximum de celle-ci.</div></div>`;
    h+=`<div class="btns">${btn('buy','Acheter · '+eur(T.buy),!canAfford(c,T.buy))}${T.lease?btn('lease','Louer · '+eur(T.lease)+' / an',false,'btn ghost'):''}</div>
      <p class="hint">Acheter immobilise du cash mais augmente ta capacité d’emprunt. Le fermage coûte peu chaque mois.</p></div>`;
    return h;
  }
  h+=`<div class="btns" style="margin-bottom:6px"><span class="chip on">${t.asset&&t.asset.type==='hq'?'Siège':t.lease?'En fermage':'Propriété'}</span>${t.irrig?'<span class="chip good">Irriguée</span>':''}</div></div>`;
  if(t.asset)h+=assetCard(c,t);
  if(t.parcel)h+=parcelCard(c,t);
  if(!t.asset&&(!t.parcel||!t.parcel.crop))h+=buildList(c,t);
  if(!t.asset)h+=`<div class="sec">${btn('release',t.lease?'Rendre la parcelle au propriétaire':'Revendre le terrain · '+eur(t.price*0.95),t.parcel&&t.parcel.crop,'btn ghost sm')}</div>`;
  return h;
}
function villageCard(c,t){const V=t.village,sc=G.cos.find(x=>x.id===V.sup);const dem=V.pop*1.05;
  let h=`<div class="card" style="margin-top:6px"><div class="row"><span>Habitants</span><span class="mono">${nfmt.format(V.pop)}</span></div><div class="row"><span>Besoin en eau</span><span class="mono">${num(dem)} m³ / sem. (+30 % l’été)</span></div>`;
  if(sc){h+=`<div class="row"><span>Fournisseur</span><span>${sc.name}</span></div><div class="row"><span>Satisfaction</span><span class="mono ${V.sat<40?'neg':V.sat>70?'pos':''}">${Math.round(V.sat)} / 100</span></div><div class="bar"><i style="width:${V.sat}%;background:${V.sat<40?'var(--bad)':'var(--good)'}"></i></div>
    <div class="row"><span>Fin de concession</span><span class="mono">dans ${num(Math.max(0,V.end-G.w)/52,1)} ans</span></div></div>
    <p class="hint">Sous 20 de satisfaction, le village résilie. À l’échéance, il renouvelle si la satisfaction dépasse 55.</p>`;return h;}
  h+=`<div class="row"><span>Revenu potentiel</span><span class="mono">≈ ${eur(dem*WATER_PRICE*52)} / an</span></div></div>`;
  if(c.sector!=='eau')return h+`<p class="hint">Une filiale Eau peut signer une concession avec ce village.</p>`;
  const cost=connectCost(G,c,t),hasSt=owned(G,c).some(x=>x.asset&&(x.asset.type==='station'||x.asset.type==='dessal'));
  if(cost==null||!hasSt)return h+`<div class="locked" style="margin-top:8px"><b>Station requise</b>Construis d’abord une station de traitement.</div>`;
  const cap=waterCapacity(G,c),free=Math.max(0,cap.out*(1-(c.water.leakNow||c.water.leak))-servedVillages(G,c).reduce((a,v)=>a+v.village.pop*1.05,0));
  return h+`<p class="hint">Raccordement depuis ta source la plus proche : ${eur(cost)} HT. Contrat de 12 ans à ${num(WATER_PRICE*c.fx.wprice,2)} €/m³. Capacité libre actuelle : ${num(free)} m³/sem.${free<dem*1.3?' <span class="neg">Pas assez pour l’été : prévois un forage de plus.</span>':''}</p>
    ${btn('concess','Signer la concession · '+eur(cost*1.2)+' TTC',!canAfford(c,cost*1.2))}`;
}
function terrainUse(c,t){
  if(c.sector==='peche')return coastal(G,t)?'Au bord de la mer : emplacement de port possible.':'Peut accueillir une conserverie.';
  if(c.sector==='eau'){if(t.ter==='riviere')return'Seul emplacement pour une prise d’eau en rivière.';return coastal(G,t)?'Au bord de la mer : forage, station ou usine de dessalement.':'Forage ou station de traitement.';}
  if(c.sector==='agri'){if(t.ter==='plaine')return'Bonne terre agricole. Accueille aussi silos, serres et ateliers.';if(t.ter==='colline')return'Cultivable, mais rendement −20 %.';if(t.ter==='riviere')return'Pas cultivable.';}
  if(t.ter==='colline')return'Idéal pour l’éolien : +25 % de production.';if(t.ter==='riviere')return'Seul emplacement possible pour une centrale hydro.';return'Convient au solaire, à l’éolien, au gaz et aux batteries.';
}
function assetCard(c,t){
  const a=t.asset;if(a.type==='hq')return`<div class="sec"><div class="card"><b>Siège de ${c.name}</b><span class="hint" style="margin:0">Ton point de départ. Il ne se vend pas.</span></div></div>`;
  const A=ASSETS[a.type];
  let h=`<div class="sec"><div class="sec-head"><h3>${A.name}</h3></div><div class="card">`;
  if(!a.built){const left=A.build-a.prog;h+=`<div class="row"><span>Chantier</span><span class="mono">${Math.max(0,Math.round(a.prog))} / ${A.build} sem.</span></div><div class="bar"><i style="width:${clamp(a.prog/A.build,0,1)*100}%"></i></div><span class="hint" style="margin:0">Mise en service dans ${Math.max(0,left)} semaines.${c.loans.some(l=>l.start>G.w)?' Les échéances du prêt démarrent à la mise en service.':''}</span>`;}
  else{h+=`<div class="row"><span>État</span><span class="mono ${a.cond<0.5?'neg':''}">${pct(a.cond)}</span></div><div class="bar"><i style="width:${a.cond*100}%;background:${a.cond<0.5?'var(--bad)':'var(--good)'}"></i></div>
    <div class="row"><span>Âge</span><span class="mono">${num(a.age/52,1)} / ${A.life} ans</span></div>
    <div class="row"><span>Valeur comptable</span><span class="mono">${eur(assetBook(a))}</span></div>`;
    if(A.mw)h+=`<div class="row"><span>Puissance</span><span class="mono">${num(A.mw,1)} MW</span></div><div class="row"><span>Production semaine dernière</span><span class="mono">${num(a.lastMWh||0)} MWh</span></div>`;
    if(a.type==='gaz')h+=`<div class="row"><span>Taux de marche</span><span class="mono">${pct(a.run||0)}</span></div>`;
    if(a.type==='silo')h+=`<div class="row"><span>Stock total</span><span class="mono">${num(stockUsed(c))} / ${num(siloCap(G,c))} t</span></div>`;
    if(a.down)h+=`<div class="row neg"><span>En panne</span><span class="mono">${a.down} sem.</span></div>`;}
  h+=`</div><div class="btns" style="margin-top:8px">${a.built?btn('renov','Rénover · '+eur(a.cost*c.fx.renov*1.2),!canAfford(c,a.cost*c.fx.renov*1.2),'btn ghost sm'):''}${btn('demol','Démolir',false,'btn ghost sm')}</div>
    <p class="hint">Rénover remet l’installation à neuf (4 semaines d’arrêt). Démolir passe la valeur restante en charge.</p></div>`;
  return h;
}
function cropMargin(c,id){const C=CROPS[id];return C.yield*G.px[id]*c.fx.price*(C.perish?c.fx.legumes:1)*c.fx.yield-C.inputs*c.fx.inputs;}
function parcelCard(c,t){
  const p=t.parcel,s=seasonOf(G.w);let h=`<div class="sec"><div class="sec-head"><h3>Parcelle</h3>${t.ter==='colline'?'<span class="x">rendement −20 %</span>':''}</div>`;
  if(p.crop){const C=CROPS[p.crop.id],el=G.w-p.crop.w0,mean=p.crop.fn?p.crop.fs/p.crop.fn:1;
    h+=`<div class="card"><div class="row"><b>${C.name}</b><span class="mono">${Math.max(0,C.weeks-el)} sem. avant récolte</span></div><div class="bar"><i style="width:${clamp(el/C.weeks,0,1)*100}%"></i></div>
      <div class="row"><span>Conditions de culture</span><span class="mono ${mean<0.85?'neg':mean>1?'pos':''}">${pct(mean)}</span></div>
      <div class="row"><span>Récolte estimée</span><span class="mono">${num(C.yield*mean*(t.ter==='colline'?0.8:1)*c.fx.yield)} t</span></div></div>`;}
  h+=`<div class="lbl" style="margin-top:10px">Plan de culture${p.crop?' (après cette récolte)':''}</div><div class="opts">`;
  for(const [id,C] of Object.entries(CROPS)){const m=cropMargin(c,id);
    h+=`<button class="opt${p.plan===id?' on':''}" data-act="plan:${id}"><b>${C.name}</b><span>Semis ${C.sow.map(x=>SEASONS[x].toLowerCase()).join(' ou ')} · ${C.weeks} sem.</span><span>Marge brute ≈ <span class="${m>0?'pos':'neg'}">${eur(m)}</span>${C.drought>1.2?' · craint la sécheresse':C.drought<0.6?' · résiste au sec':''}${C.labor>1?' · ×3 main-d’œuvre':''}</span></button>`;}
  h+=`<button class="opt${!p.plan?' on':''}" data-act="plan:"><b>Jachère</b><span>Ne rien semer</span><span>Aucun coût</span></button></div>`;
  if(!p.crop&&p.plan){const ok=CROPS[p.plan].sow.includes(s);h+=`<p class="hint">${ok?(G.w%13<=9?'Semis automatique cette semaine.':'Trop tard dans la saison, semis à la prochaine fenêtre.'):'Semis automatique à la prochaine saison de semis : '+CROPS[p.plan].sow.map(x=>SEASONS[x].toLowerCase()).join(' ou ')+'.'}</p>`;}
  if(!t.irrig)h+=`<div class="btns" style="margin-top:8px">${btn('irrig','Installer l’irrigation · 33,6 k€',!canAfford(c,33600),'btn ghost sm')}</div><p class="hint">Protège de la sécheresse et ajoute 5 % de rendement.</p>`;
  return h+'</div>';
}
function buildList(c,t){
  const list=Object.entries(ASSETS).filter(([k,A])=>A.sec===c.sector);if(!list.length)return'';
  let h=`<div class="sec"><div class="sec-head"><h3>Construire</h3></div><div style="margin-bottom:8px">${tog('fin',ui.finance,'Financer par emprunt bancaire')}</div><div class="list">`;
  for(const [k,A] of list){const okTer=A.tiles.includes(t.ter),okReq=!A.req||c.rd.done[A.req];
    const loan=ui.finance?projectLoanMax(G,c,A.cost,A.fin):0,need=(A.cost-loan)*1.2;
    let why='';if(!okTer)why='Terrain incompatible';else if(A.coast&&!coastal(G,t))why='Doit toucher la mer';else if(!okReq)why='Recherche requise : '+RD[c.sector].nodes.find(n=>n.id===A.req).name;
    h+=`<div class="build"><span class="n">${A.name}</span><span class="c">${eur(A.cost)}</span><span class="d">${A.desc} Chantier : ${A.build} sem.</span>
      <span class="d">${why?`<span class="neg">${why}</span>`:ui.finance?`Banque : ${eur(loan)} (${pct(loan/A.cost)}) · apport TTC ${eur(need)}`:`Paiement comptant TTC ${eur(need)}`}</span>
      <span class="d">${btn('build:'+k,'Lancer le chantier',!!why||!canAfford(c,need),'btn sm')}</span></div>`;}
  return h+`</div><p class="hint">La banque limite ta dette totale à 75 % de tes actifs. La TVA payée est remboursée au trimestre.</p></div>`;
}
function paneTeam(){
  const c=CO(),nd=needs(G,c);
  let h=`<div class="sec"><div class="sec-head"><h3>Moral</h3><span class="x">${Math.round(c.morale)} / 100</span></div><div class="bar"><i style="width:${c.morale}%;background:${c.morale>=60?'var(--good)':c.morale>=40?'var(--cash)':'var(--bad)'}"></i></div>
    <p class="hint">Productivité ${prodMult(c)>=1?'+':'−'}${pct(Math.abs(prodMult(c)-1))}. ${nd.cov<1?'<span class="neg">Équipes en sous-effectif : le moral baisse.</span>':''} ${c.morale<35?'<span class="neg">Risque de démissions.</span>':''}</p>
    <div class="lbl" style="margin-top:8px">Politique salariale</div><div class="seg" style="width:max-content">${[-0.1,0,0.1,0.2].map(v=>`<button class="${Math.abs(c.payPolicy-v)<0.001?'on':''}" data-act="pay:${v}">${v===0?'Marché':(v>0?'+':'')+Math.round(v*100)+' %'}</button>`).join('')}</div></div>`;
  h+=`<div class="sec"><div class="sec-head"><h3>Effectifs</h3><span class="x">masse salariale ${eur(payroll(c))} / mois</span></div>`;
  if(c.sector==='agri')h+=`<div class="card" style="margin-bottom:8px"><div class="row"><span>Ouvriers nécessaires</span><span class="mono ${nd.covL<1?'neg':'pos'}">${c.staff.ouvrier} / ${num(nd.need,1)}</span></div><div class="row"><span>Tracteurs nécessaires</span><span class="mono ${nd.covT<1?'neg':'pos'}">${nd.tractors} / ${num(nd.tractNeed,1)}</span></div><span class="hint" style="margin:0">En sous-effectif, les rendements baissent jusqu’à −50 %.</span></div>`;
  else if(c.sector!=='elec')h+=`<div class="card" style="margin-bottom:8px"><div class="row"><span>${c.sector==='peche'?'Marins nécessaires':'Agents nécessaires'}</span><span class="mono ${nd.cov<1?'neg':'pos'}">${nd.have} / ${num(nd.need,1)}</span></div><span class="hint" style="margin:0">${c.sector==='peche'?'Sans équipage complet, les bateaux pêchent moins et s’usent plus vite.':'En sous-effectif, la production d’eau baisse et les pannes augmentent.'}</span></div>`;
  else h+=`<div class="card" style="margin-bottom:8px"><div class="row"><span>Techniciens nécessaires</span><span class="mono ${nd.cov<1?'neg':'pos'}">${c.staff.tech} / ${num(nd.need,1)}</span></div><span class="hint" style="margin:0">En sous-effectif : production réduite, usure et pannes en hausse.</span></div>`;
  h+=`<div class="list">`;
  for(const r of rolesFor(c.sector)){const R=ROLES[r],pend=c.pending.filter(p=>p.role===r).length;
    const dis=(R.max&&c.staff[r]+pend>=R.max)||(r==='daf'&&!has(c,'comptable'))||!canAfford(c,2000);
    h+=`<div class="role"><div style="min-width:0"><div class="rn">${R.name}<span class="sal">${eur(R.sal*(1+c.payPolicy))} brut</span></div><div class="rd">${R.desc}</div></div>
      <div class="step"><button class="sb" data-act="fire:${r}" aria-label="Retirer" ${c.staff[r]+pend===0?'disabled':''}>−</button><span class="cnt">${c.staff[r]}${pend?`<small>+${pend}</small>`:''}</span><button class="sb" data-act="hire:${r}" aria-label="Recruter" ${dis?'disabled':''}>+</button></div></div>`;}
  h+=`</div><p class="hint">Recruter coûte 2 k€ et prend ${has(c,'rh')?1:3} semaine${has(c,'rh')?'':'s'}. Licencier coûte un mois de salaire chargé et fait baisser le moral. Charges patronales : 45 %.</p></div>`;
  if(c.sector==='agri'){h+=`<div class="sec"><div class="sec-head"><h3>Tracteurs</h3><span class="x">${c.fleet.length} · ${c.fleet.filter(f=>f.down).length} en panne</span></div>
    ${c.fleet.map((f,i)=>`<div class="row"><span>Tracteur ${i+1}</span><span class="mono ${f.cond<0.5?'neg':''}">état ${pct(f.cond)}${f.down?' · panne':''}</span></div>`).join('')}
    <div style="margin:8px 0">${tog('fin',ui.finance,'Financer par emprunt (70 %)')}</div>
    <div class="btns">${btn('tractor-buy','Acheter un tracteur · '+eur(TRACTOR.cost),!canAfford(c,(TRACTOR.cost-(ui.finance?projectLoanMax(G,c,TRACTOR.cost,0.7):0))*1.2))}${btn('tractor-sell','Revendre le plus usé',!c.fleet.length,'btn ghost')}</div>
    <p class="hint">Un tracteur couvre 6 parcelles.</p></div>`;}
  return h;
}
function paneRd(){
  const c=CO(),T=RD[c.sector],pts=rdPts(c);
  let h=`<div class="sec"><div class="sec-head"><h3>Recherche</h3><span class="x">${num(pts,1)} pts / sem.</span></div>`;
  if(pts<=0)h+=`<p class="hint" style="color:var(--cash);margin:0 0 8px">Aucun point de recherche : recrute ${c.sector==='agri'?'un agronome':'un ingénieur'} ou finance un labo partenaire.</p>`;
  h+=`<div class="lbl">Budget labo partenaire : <b class="mono">${eur(c.rdBudget)} / mois</b> (1 pt par 10 k€)</div><input type="range" id="rdb" min="0" max="60000" step="5000" value="${c.rdBudget}" aria-label="Budget de recherche mensuel">`;
  if(c.rd.cur){const n=c.rd.cur.id==='rep'?{name:T.rep.name+' '+(c.rd.rep+1)}:T.nodes.find(x=>x.id===c.rd.cur.id);const cost=rdCost(c,c.rd.cur.id);
    h+=`<div class="card" style="margin-top:10px"><div class="row"><b>${n.name}</b><span class="mono">${Math.floor(c.rd.cur.prog)} / ${cost}</span></div><div class="bar"><i style="width:${c.rd.cur.prog/cost*100}%"></i></div>${pts>0?`<span class="hint" style="margin:0">Fin dans ${Math.ceil((cost-c.rd.cur.prog)/pts)} sem.</span>`:''}</div>`;}
  else h+=`<p class="hint">Aucun projet en cours. ${c.rd.bank>=1?num(c.rd.bank)+' points en réserve.':''} Choisis une recherche ci-dessous.</p>`;
  h+=`</div><div class="tree">`;
  T.branches.forEach((b,bi)=>{h+=`<div class="col"><div class="bh">${b}</div>`;
    for(const n of T.nodes.filter(x=>x.br===bi)){const done=c.rd.done[n.id],cur=c.rd.cur&&c.rd.cur.id===n.id,locked=n.req&&!c.rd.done[n.req];
      h+=`<button class="node${done?' done':''}${cur?' cur':''}" data-act="rd:${n.id}" ${done||locked?'disabled':''}><b>${n.name}</b><span>${n.fx}</span><span class="c">${done?'Acquis':cur?'En cours':n.cost+' pts'}</span></button>`;}
    h+=`</div>`;});
  h+=`</div><div class="sec" style="margin-top:10px"><button class="node${c.rd.cur&&c.rd.cur.id==='rep'?' cur':''}" data-act="rd:rep" style="width:100%"><b>${T.rep.name} ${c.rd.rep+1}</b><span>${T.rep.fx}. Recherche sans fin, chaque niveau coûte 35 % de plus.</span><span class="c">${rdCost(c,'rep')} pts</span></button></div>`;
  return h;
}
function fishMarket(c){
  let h=`<div class="sec"><div class="sec-head"><h3>Quotas ${yearOf(G.w)}</h3></div><div style="margin-bottom:8px">${tog('respq',c.respectQ,'Respecter les quotas')}</div>
    <table class="fin"><tr><th>Espèce</th><th>Prises / quota</th><th>Stock régional</th><th></th></tr>`;
  for(const k in SPECIES){const S=SPECIES[k],hl=G.fish[k].B/S.K,q=c.fishq[k]||0,cg=c.fishc[k]||0;
    h+=`<tr><td>${S.name}<br><span class="muted mono" style="font-size:11px">${num(G.px[k])} €/t</span></td><td class="mono ${cg>q?'neg':''}">${num(cg)} / ${num(q)} t</td><td class="mono ${hl<0.35?'neg':hl>0.7?'pos':''}">${pct(hl)}</td><td>${btn('quota:'+k,'+20 %',false,'btn ghost sm')}</td></tr>`;}
  h+=`</table><p class="hint">Les quotas sont fixés chaque année selon l’état des stocks. Un stock surexploité donne moins de quotas l’année suivante. Racheter 20 % de quota coûte 25 % de sa valeur. ${c.respectQ?'':'<span class="neg">Hors quotas : amende de 2 fois la valeur en fin d’année, contrôles possibles.</span>'}</p></div>`;
  h+=`<div class="sec"><div class="sec-head"><h3>Flotte</h3><span class="x">${c.boats.length} / ${portCap(G,c)} places</span></div><div class="list">`;
  c.boats.forEach((b,i)=>{const B=BOATS[b.type];h+=`<div class="card"><div class="row"><b>${B.name}</b><span class="mono ${b.cond<0.5?'neg':''}">état ${pct(b.cond)}${b.down?' · à quai '+b.down+' sem.':''}</span></div>
    <div class="row"><span>Prise de la semaine</span><span class="mono">${num(b.lastCatch||0,1)} t</span></div>
    <div class="btns">${B.targets.map(k=>`<button class="chip${b.target===k?' on':''}" data-act="target:${i}:${k}">${SPECIES[k].name}</button>`).join('')}${btn('sellboat:'+i,'Revendre',false,'btn ghost sm')}</div></div>`;});
  h+=`</div><div style="margin:10px 0 8px">${tog('fin',ui.finance,'Financer par emprunt (70 %)')}</div><div class="list">`;
  for(const [k,B] of Object.entries(BOATS)){const lock=B.req&&!c.rd.done[B.req],full=c.boats.length>=portCap(G,c);const loan=ui.finance?projectLoanMax(G,c,B.cost,0.7):0,need=(B.cost-loan)*1.2;
    h+=`<div class="build"><span class="n">${B.name}</span><span class="c">${eur(B.cost)}</span><span class="d">Équipage ${B.crew} · capacité ×${num(B.cap,1)} · ${B.targets.map(x=>SPECIES[x].name.toLowerCase()).join(', ')}</span>
      <span class="d">${lock?'<span class="neg">Recherche requise : Pêche hauturière</span>':full?'<span class="neg">Port plein : construis un autre port</span>':`Apport ${eur(need)}`}</span><span class="d">${btn('boat:'+k,'Acheter',lock||full||!canAfford(c,need),'btn sm')}</span></div>`;}
  return h+`</div></div>`;
}
function waterMarket(c){const W=c.water,cap=W.cap||waterCapacity(G,c);
  let h=`<div class="sec"><div class="sec-head"><h3>Bilan hydraulique</h3><span class="x">par semaine</span></div>
    <div class="row"><span>Eau brute captée (capacité)</span><span class="mono">${num(cap.raw)} m³</span></div>
    <div class="row"><span>Capacité de traitement</span><span class="mono ${cap.treat<cap.raw?'':'muted'}">${num(cap.treat)} m³</span></div>
    ${cap.des?`<div class="row"><span>Dessalement</span><span class="mono">${num(cap.des)} m³</span></div>`:''}
    <div class="row"><span>Pertes par fuites</span><span class="mono ${(W.leakNow||W.leak)>0.25?'neg':''}">${pct(W.leakNow||W.leak)}</span></div>
    <div class="row"><span>Demande des villages</span><span class="mono">${num(W.demand||0)} m³</span></div>
    <div class="row"><b>Demande servie</b><span class="mono ${(W.ratio??1)<0.98?'neg':'pos'}">${pct(W.ratio??1)}</span></div>
    <p class="hint">L’eau captée est limitée par ta capacité de traitement. Les forages baissent en été et en saison sèche, la prise en rivière suit le débit.</p>
    ${btn('renew','Renouveler les canalisations · '+eur(servedVillages(G,c).length*120000*1.2)+' TTC',!servedVillages(G,c).length||!canAfford(c,servedVillages(G,c).length*144000),'btn ghost sm')}<p class="hint">Fuites −6 pts. Elles augmentent d’environ 1 pt par an.</p></div>`;
  h+=`<div class="sec"><div class="sec-head"><h3>Concessions</h3></div><div class="list">${servedVillages(G,c).map(v=>`<div class="row"><span>Village ${v.x+1}·${v.y+1} · ${nfmt.format(v.village.pop)} hab.</span><span class="mono ${v.village.sat<40?'neg':''}">satisf. ${Math.round(v.village.sat)} · ${num(Math.max(0,v.village.end-G.w)/52,1)} ans</span></div>`).join('')||'<p class="hint" style="margin:0">Aucune concession.</p>'}</div>
    <p class="hint">Prix de vente : ${num(WATER_PRICE*c.fx.wprice,2)} €/m³, payé à 60 jours par les mairies.</p></div>`;
  return h;
}
function paneMarket(){
  const c=CO();let h='';
  h+=`<div class="sec"><div class="sec-head"><h3>Assurance</h3><span class="x">${eur(insurancePremium(G,c))} / mois</span></div>${tog('insure',c.insured,'Assurance multirisque')}
    <p class="hint">${c.sector==='agri'?'Couvre 80 % des réparations, la grêle et limite les pertes des saisons extrêmes.':c.sector==='peche'?'Couvre 80 % des avaries de bateaux et des pannes.':'Couvre 80 % des réparations et des dégâts de tempête.'}</p></div>`;
  if(c.sector==='agri'){
    const cap=siloCap(G,c),used=stockUsed(c);
    h+=`<div class="sec"><div class="sec-head"><h3>Stocks</h3><span class="x">${num(used)} / ${num(cap)} t</span></div>`;
    if(!cap)h+=`<p class="hint" style="margin:0 0 6px">Sans silo, toute ta récolte part à la coopérative le jour même, 7 % sous le cours.</p>`;
    const goods=['ble','mais','tournesol','colza'].filter(g=>(c.stock[g]||0)>=1);
    h+=goods.map(g=>`<div class="card" style="margin-bottom:6px"><div class="row"><b>${GOODS[g].name}</b><span class="mono">${num(c.stock[g])} t · ${eur(c.stock[g]*G.px[g]*c.fx.price)}</span></div>
      <div class="btns">${btn(`sell:${g}:0.25`,'Vendre 25 %',false,'btn ghost sm')}${btn(`sell:${g}:1`,'Tout vendre',false,'btn sm')}</div></div>`).join('')||(cap?'<p class="hint">Silos vides.</p>':'');
    h+=`</div>`;
  } else if(c.sector==='peche'){h+=fishMarket(c);
  } else if(c.sector==='eau'){h+=waterMarket(c);
  } else {
    h+=`<div class="sec"><div class="sec-head"><h3>Production</h3></div><div class="row"><span>Semaine dernière</span><span class="mono">${num(c.last.mwh||0)} MWh</span></div><div class="row"><span>Prix spot</span><span class="mono">${num(G.px.elec,1)} €/MWh</span></div><div class="row"><span>Coût du gaz par MWh produit</span><span class="mono">${num(G.px.gaz/0.55+30,1)} €</span></div>${c.last.short?`<p class="hint neg">Contrats non couverts la semaine dernière : ${num(c.last.short)} MWh rachetés au marché.</p>`:''}</div>`;
  }
  const act=c.contracts;
  const ppaTot=act.filter(k=>k.type==='ppa').reduce((a,k)=>a+k.mwh,0),fwdTot=act.filter(k=>k.type==='fwd').reduce((a,k)=>a+k.qty,0);
  const totTxt=ppaTot?`${num(ppaTot)} MWh/sem. · ${pct(ppaTot/Math.max(1,c.last.mwh||1))} de ta production`:fwdTot?`${num(fwdTot)} t à livrer`:'';
  h+=`<div class="sec"><div class="sec-head"><h3>Contrats en cours</h3><span class="x">${totTxt}</span></div>`;
  h+=act.length?act.map(k=>k.type==='fwd'?`<div class="row"><span>${k.client} · ${num(k.qty)} t de ${GOODS[k.good].name.toLowerCase()}</span><span class="mono">${k.price} €/t · S+${k.due-G.w}</span></div>`:`<div class="row"><span>${k.client} · ${num(k.mwh)} MWh/sem.</span><span class="mono">${k.price} €/MWh · ${k.weeks} sem.</span></div>`).join(''):'<p class="hint" style="margin:0">Aucun contrat. Tu vends tout au prix du marché.</p>';
  h+=`</div><div class="sec"><div class="sec-head"><h3>Offres reçues</h3></div><div class="list">`;
  h+=c.offers.length?c.offers.map(o=>o.type==='fwd'?`<div class="build"><span class="n">${o.client}</span><span class="c">${o.price} €/t</span><span class="d">Achète ${num(o.qty)} t de ${GOODS[o.good].name.toLowerCase()} livrées dans ${o.due-G.w} semaines. Cours actuel ${num(G.px[o.good])} €/t. Si ton stock manque, tu rachètes la différence au marché.</span><span class="d">${btn('offer:'+o.id,'Signer',false,'btn sm')}</span></div>`
    :`<div class="build"><span class="n">${o.client}</span><span class="c">${o.price} €/MWh</span><span class="d">${num(o.mwh)} MWh par semaine pendant ${o.weeks} semaines. Payé à 60 jours. Si tu produis moins, tu rachètes au spot +10 %.</span><span class="d">${btn('offer:'+o.id,'Signer',false,'btn sm')}</span></div>`).join(''):'<p class="hint" style="margin:0">De nouvelles offres arrivent chaque mois.</p>';
  return h+`</div></div>`;
}
function paneFinance(){
  const c=CO(),isC=has(c,'comptable'),isD=has(c,'daf'),y=yearOf(G.w);
  const rc=c.recv.reduce((a,x)=>a+x.amt,0),py=c.pay.reduce((a,x)=>a+x.amt,0);
  let h=`<div class="sec"><div class="sec-head"><h3>Trésorerie</h3></div><div class="grid2">
    <div class="stat"><div class="l">Banque</div><div class="v ${c.cash<0?'neg':''}">${eur(c.cash)}</div><div class="s">découvert max ${eur(odLimit(c))}</div></div>
    <div class="stat"><div class="l">Créances clients</div><div class="v">${eur(rc)}</div><div class="s">paiement à 2-8 sem.</div></div>
    <div class="stat"><div class="l">Fournisseurs</div><div class="v">${eur(py)}</div><div class="s">payés à 4 sem.</div></div>
    <div class="stat"><div class="l">${c.tva>=0?'TVA à reverser':'Crédit de TVA'}</div><div class="v">${eur(Math.abs(c.tva))}</div><div class="s">dans ${13-G.w%13} sem.</div></div></div>
    ${c.isDue&&c.isDue.amt>0?`<p class="hint">Impôt sur les sociétés à payer : ${eur(c.isDue.amt)} dans ${c.isDue.week-G.w} semaines.</p>`:''}</div>`;
  h+=`<div class="sec"><div class="sec-head"><h3>Prévisionnel</h3><span class="x">12 semaines, hors nouvelles ventes</span></div>`;
  if(isC){const f=forecast(G,c,12);const vals=f.map(x=>x.bal);const mx=Math.max(1,...vals.map(Math.abs));const mn=Math.min(...vals);
    h+=`<div class="fc">${f.map(x=>`<i class="${x.bal<0?'neg':''}" style="height:${Math.abs(x.bal)/mx*100}%" title="S+${x.w-G.w} : ${eur(x.bal)}"></i>`).join('')}</div><div class="fcl"><span>S+1</span><span>point bas ${eur(mn)}</span><span>S+12</span></div>
      ${mn<-odLimit(c)?'<p class="hint neg">Le découvert autorisé sera dépassé. Encaisse, emprunte ou vends du stock.</p>':''}`;}
  else h+=lock('l’évolution de ta trésorerie semaine par semaine');
  h+=`</div><div class="sec"><div class="sec-head"><h3>Compte de résultat</h3></div>`;
  if(isC){const a=PL(c,y),b=c.pl[y-1]?PL(c,y-1):null,ra=plCalc(a),rb=b?plCalc(b):null;
    const line=(l,k,neg)=>`<tr><td>${l}</td><td class="mono">${eur((neg?-1:1)*a[k])}</td>${b?`<td class="mono muted">${eur((neg?-1:1)*b[k])}</td>`:''}</tr>`;
    h+=`<table class="fin"><tr><th></th><th>${y} (en cours)</th>${b?`<th>${y-1}</th>`:''}</tr>${line('Chiffre d’affaires','ca')}${line('Subventions','subv')}${line('Achats','achats',1)}${line('Personnel','perso',1)}${line('Fermages','loyers',1)}${line('Autres charges','autres',1)}${line('Impayés','impayes',1)}
      <tr class="tot"><td>EBE</td><td class="mono">${eur(ra.ebe)}</td>${b?`<td class="mono">${eur(rb.ebe)}</td>`:''}</tr>${line('Amortissements','amort',1)}${line('Intérêts','interets',1)}
      <tr class="tot"><td>Résultat avant impôt</td><td class="mono ${ra.rcai<0?'neg':'pos'}">${eur(ra.rcai)}</td>${b?`<td class="mono">${eur(rb.rcai)}</td>`:''}</tr>${b?`<tr><td>Impôt sur les sociétés</td><td></td><td class="mono">${eur(-b.is)}</td></tr>`:''}</table>
      ${c.deficit>0?`<p class="hint">Déficit reportable : ${eur(c.deficit)}. Il réduira tes impôts futurs.</p>`:''}`;}
  else h+=lock('ton chiffre d’affaires, tes charges et ton résultat');
  h+=`</div><div class="sec"><div class="sec-head"><h3>Bilan</h3></div>`;
  if(isD){const B=bilan(G,c);h+=`<table class="fin"><tr><th>Actif</th><th></th></tr><tr><td>Terrains</td><td class="mono">${eur(B.terr)}</td></tr><tr><td>Installations et matériel</td><td class="mono">${eur(B.inst)}</td></tr><tr><td>Stocks</td><td class="mono">${eur(B.stocks)}</td></tr><tr><td>Créances</td><td class="mono">${eur(B.cre)}</td></tr><tr><td>Trésorerie</td><td class="mono">${eur(B.treso)}</td></tr><tr class="tot"><td>Total</td><td class="mono">${eur(B.actif)}</td></tr>
    <tr><th>Passif</th><th></th></tr><tr><td>Capitaux propres</td><td class="mono ${B.cp<0?'neg':''}">${eur(B.cp)}</td></tr><tr><td>Emprunts</td><td class="mono">${eur(B.emp)}</td></tr><tr><td>Fournisseurs</td><td class="mono">${eur(B.fou)}</td></tr><tr><td>Dettes fiscales</td><td class="mono">${eur(B.fisc)}</td></tr><tr><td>Découvert</td><td class="mono">${eur(B.dec)}</td></tr><tr class="tot"><td>Total</td><td class="mono">${eur(B.actif)}</td></tr></table>
    <p class="hint">Valeur estimée de l’entreprise : <b class="mono">${eur(valuation(G,c))}</b> (capitaux propres + 5 × EBE).</p>`;}
  else h+=lock('ton patrimoine, tes dettes et la valeur de l’entreprise','daf');
  const cap=loanCapacity(G,c);ui.loanAmt=Math.min(ui.loanAmt||0,cap);
  h+=`</div><div class="sec"><div class="sec-head"><h3>Banque</h3><span class="x">taux directeur ${num(G.rate,1)} %</span></div>
    ${c.loans.map(l=>`<div class="row"><span>${l.name}</span><span class="mono">${eur(l.P)} · ${pct(l.rate,1)} · ${l.start>G.w?'différé':eur(l.pay)+'/mois'}</span></div>`).join('')||'<p class="hint" style="margin:0">Aucun prêt en cours.</p>'}
    <div class="card" style="margin-top:8px"><div class="row"><span>Capacité d’emprunt</span><span class="mono">${eur(cap)}</span></div>
      <div class="row"><span>Taux proposé</span><span class="mono">${pct(rateFor(G,c,'classic'),1)}</span></div>
      <label class="lbl" for="loan-amt" style="margin:4px 0 0">Montant : <b class="mono">${eur(ui.loanAmt)}</b></label><input type="range" id="loan-amt" min="0" max="${cap}" step="10000" value="${ui.loanAmt}" ${cap?'':'disabled'}>
      <div class="btns">${[60,84].map(m=>`<button class="chip${ui.loanMonths===m?' on':''}" data-act="lm:${m}">${m/12} ans</button>`).join('')}</div>
      ${btn('loan','Emprunter',!ui.loanAmt)}</div>
    <p class="hint">La capacité dépend de la valeur de tes terres et installations, et de ton EBE.</p>
    ${isD?`<div class="btns" style="margin-top:8px">${btn('factor','Affacturage · encaisser '+eur(rc)+' maintenant (−3 %)',rc<=0,'btn ghost sm')}</div>`:''}</div>`;
  return h;
}
function paneGroup(){
  const c0=G.cos[0];
  if(!G.holding){const v=valuation(G,c0);
    return`<div class="sec"><div class="sec-head"><h3>Holding</h3></div>
      <p class="hint" style="margin:0 0 10px">Une holding détient tes entreprises. Elle te permet de lancer des filiales dans d’autres secteurs, de faire circuler le cash entre elles et de limiter les risques : si une filiale fait faillite, ses dettes ne touchent pas le reste du groupe.</p>
      <div class="card"><div class="row"><span>Valeur de ${c0.name}</span><span class="mono">${eur(v)}</span></div><div class="bar"><i style="width:${clamp(v/HOLDING_MIN,0,1)*100}%"></i></div>
        <span class="hint" style="margin:0">Il faut ${eur(HOLDING_MIN)} de valeur (capitaux propres + 5 × l’EBE de l’année précédente).</span></div>
      <div class="namefield"><label for="h-name">Nom de la holding</label><input id="h-name" maxlength="26" placeholder="Groupe ${c0.name.split(' ').slice(-1)[0]}"></div>
      ${btn('holding','Créer la holding · 15 k€ de frais juridiques',!canCreateHolding(G))}</div>`;}
  const H=G.holding;let h=`<div class="sec"><div class="sec-head"><h3>${H.name}</h3></div><div class="grid2">
    <div class="stat"><div class="l">Trésorerie holding</div><div class="v">${eur(H.cash)}</div><div class="s">dividendes reçus ${eur(H.divs)}</div></div>
    <div class="stat"><div class="l">Valeur du groupe</div><div class="v">${eur(groupValue(G))}</div><div class="s">${G.cos.length} filiale${G.cos.length>1?'s':''}</div></div></div></div>
    <div class="sec"><div class="sec-head"><h3>Filiales</h3></div><div class="list">`;
  G.cos.forEach((c,i)=>{const P=PL(c,yearOf(G.w)),r=plCalc(P),keep=50000;
    h+=`<div class="cocard" style="--c:${c.color}"><div class="row"><b>${c.name}</b><span class="chip">${SECTORS[c.sector].name}</span></div>
      <div class="row"><span>Trésorerie</span><span class="mono ${c.cash<0?'neg':''}">${eur(c.cash)}</span></div>
      <div class="row"><span>CA ${yearOf(G.w)} · EBE</span><span class="mono">${eur(P.ca)} · ${eur(r.ebe)}</span></div>
      <div class="row"><span>Dette · valeur</span><span class="mono">${eur(debt(c))} · ${eur(valuation(G,c))}</span></div>
      <div class="row"><span>Direction</span><span class="mono">${has(c,'dg')?'DG en place':i===G.cur?'toi':'personne'}</span></div>
      <div class="btns">${i===G.cur?'<span class="chip on">Affichée</span>':btn('co:'+i,'Gérer',false,'btn sm')}
        ${btn('div:'+i+':0.25','Dividende 25 %',c.cash<=keep,'btn ghost sm')}${btn('div:'+i+':all','Tout sauf 50 k€',c.cash<=keep,'btn ghost sm')}
        ${btn('apport:'+i+':100000','Apport 100 k€',H.cash<100000,'btn ghost sm')}${btn('apport:'+i+':500000','Apport 500 k€',H.cash<500000,'btn ghost sm')}</div></div>`;});
  h+=`</div><p class="hint">Les dividendes remontent à la holding avec 1,25 % de frais (régime mère-fille). Une filiale sans DG fonctionne seule mais ne recrute ni ne replante quand tu gères une autre société.</p></div>`;
  const sec=ui.subSector||'elec',min=SUB_MIN[sec],caps=[min,min*2,min*5];if(!caps.includes(ui.subCap))ui.subCap=min;
  const used=G.cos.map(c=>c.color);const free=COLORS.filter(x=>!used.includes(x));if(!ui.subColor||used.includes(ui.subColor))ui.subColor=free[0]||COLORS[0];
  h+=`<div class="sec"><div class="sec-head"><h3>Nouvelle filiale</h3></div>
    <div class="opts">${['agri','elec','peche','eau'].map(k=>`<button class="opt${sec===k?' on':''}" data-act="ssec:${k}"><b>${SECTORS[k].name}</b><span>Capital minimum ${eur(SUB_MIN[k])}</span></button>`).join('')}</div>
    <div class="namefield"><label for="sub-name">Nom</label><input id="sub-name" maxlength="28" placeholder="${SECTORS[sec].co}"></div>
    <div class="lbl">Capital apporté par la holding</div><div class="btns">${caps.map(v=>`<button class="chip${ui.subCap===v?' on':''}" data-act="scap:${v}">${eur(v)}</button>`).join('')}</div>
    <div class="lbl" style="margin-top:10px">Couleur</div><div class="swatches" style="margin-bottom:10px">${COLORS.map(x=>`<button class="swatch${ui.subColor===x?' on':''}" data-act="scol:${x}" style="--c:${x}" aria-label="Couleur ${x}" ${used.includes(x)?'disabled':''}></button>`).join('')}</div>
    ${btn('sub','Créer la filiale · '+eur(ui.subCap),H.cash<ui.subCap)}
    <p class="hint">La filiale démarre avec un siège et son capital, sans terres ni équipe. ${G.cos.some(c=>c.sector==='elec')&&G.cos.some(c=>c.sector==='agri')?'':'Synergie : une filiale électrique fournit l’énergie de tes serres, ateliers et irrigations 30 % moins cher.'}</p></div>`;
  return h;
}
function bindInputs(){
  const r=$('#rdb');if(r)r.oninput=()=>{CO().rdBudget=+r.value;r.previousElementSibling.innerHTML=`Budget labo partenaire : <b class="mono">${eur(+r.value)} / mois</b> (1 pt par 10 k€)`;};
  const l=$('#loan-amt');if(l)l.oninput=()=>{ui.loanAmt=+l.value;l.previousElementSibling.innerHTML=`Montant : <b class="mono">${eur(+l.value)}</b>`;const b=pane.querySelector('[data-act="loan"]');if(b)b.disabled=!ui.loanAmt;};
}
pane.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b||b.disabled)return;
  const c=CO(),[act,arg,arg2]=b.dataset.act.split(':');const t=ui.sel?G.tiles[ui.sel.y][ui.sel.x]:null;let ok=true;
  switch(act){
    case'desel':ui.sel=null;break;
    case'buy':ok=buyTile(G,c,t);break;
    case'lease':ok=leaseTile(G,c,t);break;
    case'release':ok=releaseTile(G,c,t);break;
    case'plan':t.parcel.plan=arg||null;break;
    case'irrig':ok=irrigate(G,c,t);break;
    case'build':ok=buildAsset(G,c,t,arg,ui.finance);if(ok)sfx('build');break;
    case'fin':ui.finance=!ui.finance;break;
    case'renov':ok=renovate(G,c,t);break;
    case'demol':ok=demolish(G,c,t);break;
    case'hire':ok=hire(G,c,arg);break;
    case'fire':ok=fire(G,c,arg);break;
    case'pay':c.payPolicy=+arg;break;
    case'tractor-buy':ok=buyTractor(G,c,ui.finance);break;
    case'tractor-sell':ok=sellTractor(G,c);break;
    case'rd':startRd(G,c,arg);break;
    case'sell':sellStock(G,c,arg,+arg2);sfx('coin');break;
    case'offer':acceptOffer(G,c,arg);break;
    case'insure':c.insured=!c.insured;log(G,c.insured?'Assurance souscrite.':'Assurance résiliée.');break;
    case'lm':ui.loanMonths=+arg;break;
    case'loan':ok=takeLoan(G,c,ui.loanAmt,ui.loanMonths);ui.loanAmt=0;break;
    case'factor':factoring(G,c);break;
    case'co':switchCo(+arg);break;
    case'concess':ok=signConcession(G,c,t);break;
    case'renew':ok=renewNetwork(G,c);break;
    case'respq':c.respectQ=!c.respectQ;break;
    case'quota':ok=buyQuota(G,c,arg);break;
    case'target':c.boats[+arg].target=arg2;break;
    case'sellboat':ok=sellBoat(G,c,+arg);break;
    case'boat':ok=buyBoat(G,c,arg,ui.finance);if(ok)sfx('build');break;
    case'holding':{const n=($('#h-name')||{}).value;ok=createHolding(G,n&&n.trim());break;}
    case'div':{const k=G.cos[+arg];const amt=arg2==='all'?k.cash-50000:k.cash*0.25;ok=dividend(G,k,Math.floor(amt));if(ok)sfx('coin');break;}
    case'apport':ok=apport(G,G.cos[+arg],+arg2);break;
    case'ssec':ui.subSector=arg;break;
    case'scap':ui.subCap=+arg;break;
    case'scol':ui.subColor=b.dataset.act.slice(5);break;
    case'sub':{const n=($('#sub-name')||{}).value;const k=createSub(G,{sector:ui.subSector||'elec',name:(n&&n.trim())||SECTORS[ui.subSector||'elec'].co,color:ui.subColor,capital:ui.subCap});ok=!!k;if(k){switchCo(G.cos.indexOf(k));sfx('build');}break;}
  }
  if(ok)sfx('click');else sfx('bad');
  ui.busy=false;renderAll(true);
});

function switchCo(i){if(i<0||i>=G.cos.length)return;G.cur=i;ui.sel=null;walkers.length=0;centerOnCompany();renderAll(true);}
$('#cos').addEventListener('click',e=>{const b=e.target.closest('[data-co]');if(b)switchCo(+b.dataset.co);});
/* ---------- modals ---------- */
function openModal(html,bind,wide){modalOpen=true;const m=$('#modal');m.classList.toggle('wide',!!wide);m.innerHTML=html;$('#ov').hidden=false;bind&&bind(m);const f=m.querySelector('button:not(:disabled),input');f&&f.focus();}
function closeModal(){modalOpen=false;$('#ov').hidden=true;}
const draft={sector:'agri',profile:'heritier',color:COLORS[0],name:'',founder:''};
function startScreen(){
  openModal(`<div class="eyebrow">Étape 1 sur 2 · Jeu de gestion en bac à sable</div>
    <div class="title-big">Terravolt</div>
    <p>Bâtis un empire sur un territoire : terres, machines, centrales. Chaque investissement se paie en trésorerie, chaque saison change la donne. Il n’y a pas de fin, seulement la faillite. Commence par choisir ton secteur.</p>
    <div class="picks sectors">${Object.entries(SECTORS).map(([id,s])=>`<button class="pick${draft.sector===id?' on':''}" data-sector="${id}" ${s.soon?'disabled':''}>
      <span class="pk-t">${s.name}</span><span class="pk-d">${s.tag}</span>${s.soon?'<span class="soon">Bientôt</span>':`<span class="pk-x">${s.trait}</span>`}</button>`).join('')}</div>
    <button class="btn" id="next" style="width:100%;margin-top:16px">Continuer</button>
    ${(()=>{const sv=loadSave();if(!sv)return'';const c=sv.cos[0];return`<button class="btn ghost" id="resume" style="width:100%;margin-top:8px">Reprendre ma partie · ${sv.holding?sv.holding.name:c.name}, ${SEASONS[seasonOf(sv.w)].toLowerCase()} ${yearOf(sv.w)}</button>`;})()}`,m=>{
      const rs=m.querySelector('#resume');if(rs)rs.onclick=()=>{const sv=loadSave();if(!sv)return;G=sv;fixup(G);G.started=true;walkers.length=0;floaters.length=0;ui.sel=null;initAudio();closeModal();setSpeed(1);renderAll(true);};
      m.querySelectorAll('[data-sector]').forEach(b=>b.onclick=()=>{draft.sector=b.dataset.sector;m.querySelectorAll('[data-sector]').forEach(x=>x.classList.toggle('on',x===b));});
      m.querySelector('#next').onclick=identityScreen;},true);
}
function identityScreen(){
  const sec=SECTORS[draft.sector];
  openModal(`<div class="eyebrow">Étape 2 sur 2 · ${sec.name}</div><h2>Qui reprend l’affaire ?</h2>
    <div class="twocol"><div class="namefield"><label for="co-in">Nom de l’entreprise</label><input id="co-in" maxlength="28" placeholder="${sec.co}" value="${draft.name}"></div>
      <div class="namefield"><label for="fd-in">Ton prénom</label><input id="fd-in" maxlength="14" placeholder="Facultatif" value="${draft.founder}"></div></div>
    <div class="lbl">Ton parcours</div>
    <div class="picks profiles">${PROFILES.map(p=>`<button class="pick${draft.profile===p.id?' on':''}" data-profile="${p.id}"><span class="pk-t" style="font-size:17px">${p.name}</span><span class="pk-d">${p.desc}</span></button>`).join('')}</div>
    <div class="lbl" style="margin-top:12px">Couleur de l’entreprise</div>
    <div class="swatches">${COLORS.map(c=>`<button class="swatch${draft.color===c?' on':''}" data-color="${c}" style="--c:${c}" aria-label="Couleur ${c}"></button>`).join('')}</div>
    <div class="row-btns"><button class="btn ghost" id="back">Retour</button><button class="btn" id="go">Lancer l’entreprise</button></div>`,m=>{
      const grab=()=>{draft.name=m.querySelector('#co-in').value.trim();draft.founder=m.querySelector('#fd-in').value.trim();};
      m.querySelectorAll('[data-profile]').forEach(b=>b.onclick=()=>{draft.profile=b.dataset.profile;m.querySelectorAll('[data-profile]').forEach(x=>x.classList.toggle('on',x===b));});
      m.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>{draft.color=b.dataset.color;m.querySelectorAll('[data-color]').forEach(x=>x.classList.toggle('on',x===b));});
      m.querySelector('#back').onclick=()=>{grab();startScreen();};
      const go=()=>{grab();G=newGame({...draft,name:draft.name||sec.co});G.started=true;walkers.length=0;floaters.length=0;ui.sel=null;
        const c=CO();initAudio();
        log(G,`${c.name} démarre${c.founder?' sous la direction de '+c.founder:''}. ${eur(c.cash)} en banque.`,'gold');
        log(G,({agri:'Conseil : regarde l’onglet Équipe, tu manques déjà de bras. Clique une parcelle pour choisir sa culture.',elec:'Conseil : ta ferme solaire ne paie pas les salaires. Loue une colline et lance une éolienne financée par la banque.',peche:'Conseil : surveille tes quotas dans l’onglet Marché et change la cible d’un bateau quand son quota est épuisé.',eau:'Conseil : un seul village ne suffit pas. Ajoute un forage puis signe une concession avec un village voisin.'})[c.sector]);
        closeModal();setSpeed(1);renderAll(true);};
      m.querySelector('#go').onclick=go;m.querySelectorAll('input').forEach(i=>i.onkeydown=e=>{if(e.key==='Enter')go();});},true);
}
function eventModal(){
  const e=EVENTS.find(x=>x.id===G.pendingEvent),c=CO();if(!e){G.pendingEvent=null;return;}
  sfx('event');
  openModal(`<div class="eyebrow">${SEASONS[seasonOf(G.w)]} ${yearOf(G.w)} · Événement</div><h2>${e.t}</h2><p>${txt(e.b,c)}</p>
    <div class="choices">${e.ch.map((ch,i)=>`<button class="choice" data-ch="${i}"><b>${ch.l}</b><span>${txt(ch.f,c)}</span></button>`).join('')}</div>`,m=>{
      m.querySelectorAll('[data-ch]').forEach(b=>b.onclick=()=>{const ch=e.ch[+b.dataset.ch];ch.a(G,c);log(G,`${e.t} → ${ch.l}`);G.pendingEvent=null;closeModal();renderAll(true);});});
}
function endModal(){
  const c=CO();sfx('bad');
  openModal(`<div class="eyebrow">Cessation de paiements · ${SEASONS[seasonOf(G.w)]} ${yearOf(G.w)}</div><h2>${c.name} est placée en liquidation</h2>
    <p>Six semaines au-delà du découvert autorisé : la banque a coupé les lignes. Ça arrive aux meilleurs.</p>
    <div class="endstats"><div class="stat"><div class="l">Années tenues</div><div class="v">${num(G.w/52,1)}</div></div><div class="stat"><div class="l">Cases possédées</div><div class="v">${owned(G,c).length}</div></div>
      <div class="stat"><div class="l">CA cumulé</div><div class="v">${eur(Object.values(c.pl).reduce((a,p)=>a+p.ca,0))}</div></div><div class="stat"><div class="l">${c.sector==='agri'?'Récoltes':c.sector==='peche'?'Poisson débarqué':c.sector==='eau'?'Villages servis':'Production'}</div><div class="v">${c.sector==='agri'?c.stats.harvests:c.sector==='peche'?num(c.stats.fish||0)+' t':c.sector==='eau'?servedVillages(G,c).length:num(c.stats.mwh/1000,1)+' GWh'}</div></div></div>
    <button class="btn" id="again" style="width:100%">Recommencer</button>`,m=>{clearSave();m.querySelector('#again').onclick=()=>{closeModal();startScreen();};});
}

/* ---------- loop ---------- */
function setSpeed(v){if(v===0)paused=true;else{paused=false;speed=v;}
  document.querySelectorAll('[data-speed]').forEach(b=>b.classList.toggle('on',(+b.dataset.speed===0&&paused)||(!paused&&+b.dataset.speed===speed)));}
document.querySelectorAll('[data-speed]').forEach(b=>b.onclick=()=>{if(G.started)setSpeed(+b.dataset.speed);});
addEventListener('keydown',e=>{if(e.code==='Space'&&!modalOpen&&G.started&&e.target.tagName!=='INPUT'){e.preventDefault();setSpeed(paused?speed:0);}});
let lastSeason=-1;
function renderAll(force){renderTop();renderLog();renderPane(force);renderChips();renderSched();drawChart();}
function frame(now){
  const dt=Math.min(100,now-lastT);lastT=now;
  if(G.started&&!paused&&!modalOpen&&!G.over){acc+=dt;const wd=WEEK_MS/speed;
    let ticked=false;while(acc>=wd){acc-=wd;tick(G);ticked=true;if(G.pendingEvent||G.over){acc=0;break;}}
    if(ticked){if(seasonOf(G.w)!==lastSeason){if(lastSeason>=0)sfx('season');lastSeason=seasonOf(G.w);saveGame();}renderAll();}
    if(G.over){endModal();}else if(G.pendingEvent)eventModal();}
  updateFx(dt);draw(now);
  $('#paused').hidden=!(paused&&G.started&&!G.over&&!modalOpen);
  requestAnimationFrame(frame);
}
function start(data){
  if(data&&data.G){G=data.G;fixup(G);speed=data.speed||1;renderAll(true);setSpeed(data.paused?0:speed);}
  else{renderAll(true);startScreen();setSpeed(1);}
  resize();requestAnimationFrame(frame);
}
window.claude?.hot?.snapshot?.(()=>({G,speed,paused}));
window.claude?.hot?.ready?window.claude.hot.ready(start):start(window.claude?.hot?.data??{});
