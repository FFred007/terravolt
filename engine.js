/* ================= ENGINE (no DOM) ================= */
const N=14;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rand=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];
function randn(){let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
const nfmt=new Intl.NumberFormat('fr-FR');
function eur(n){const a=Math.abs(n),sg=n<0?'−':'';
  if(a>=1e6)return sg+(a/1e6).toLocaleString('fr-FR',{maximumFractionDigits:a>=1e7?1:2})+' M€';
  if(a>=1e4)return sg+Math.round(a/1e3)+' k€';
  return sg+nfmt.format(Math.round(a))+' €';}
const pct=(v,d=0)=>(v*100).toLocaleString('fr-FR',{maximumFractionDigits:d,minimumFractionDigits:d})+' %';
const num=(v,d=0)=>v.toLocaleString('fr-FR',{maximumFractionDigits:d});

const SEASONS=['Printemps','Été','Automne','Hiver'];
const seasonOf=w=>Math.floor((((w%52)+52)%52)/13);
const yearOf=w=>2027+Math.floor(w/52);
const monthOf=w=>Math.floor(w*12/52);
const CHARGES=1.45,CEO_SAL=2500;

const SECTORS={
  agri:{name:'Agriculture',tva:0.10,co:'Domaine des Hautes Terres',tag:'Céréales, oléagineux et maraîchage',
    trait:'Revenus saisonniers, gros trous de trésorerie entre deux récoltes, météo décisive.'},
  elec:{name:'Électricité',tva:0.20,co:'Volterra Énergies',tag:'Solaire, éolien, hydro et gaz',
    trait:'Très gourmand en capital, revenus continus, prix de marché très volatils.'},
  peche:{name:'Pêche',tva:0.055,co:'Armement de la Pointe',tag:'Flotte, quotas et criée',
    trait:'Revenus chaque semaine, mais les stocks de poissons s’épuisent et les tempêtes bloquent les bateaux.'},
  eau:{name:'Eau',tva:0.055,co:'Société des Eaux du Val',tag:'Captages, traitement et réseaux vers les villages',
    trait:'Revenus stables sur 12 ans, gros investissements, fuites et sécheresses à gérer.'},
};
const PROFILES=[
  {id:'heritier',name:'Héritier',desc:'Tu reprends l’affaire familiale : plus de cash et d’actifs dès le départ.'},
  {id:'ingenieur',name:'Ingénieur',desc:'Tu fais de la R&D toi-même : +1,5 point de recherche par semaine.'},
  {id:'banquier',name:'Ex-banquier',desc:'Tu parles le langage des banques : taux −1 pt, capacité d’emprunt +30 %.'},
  {id:'manager',name:'Meneur d’hommes',desc:'Moral des équipes +12 et recrutements une semaine plus rapides.'},
];
const COLORS=['#ffb547','#6fd3a8','#7cb7ff','#ff7d6b','#c69cff','#f2e6c9'];

const TERRAIN={
  plaine:{name:'Plaine',buy:110000,lease:4500},
  colline:{name:'Colline',buy:60000,lease:2500},
  riviere:{name:'Rivière',buy:90000,lease:null},
  foret:{name:'Forêt',buy:null},
  village:{name:'Village',buy:null},
  mer:{name:'Mer',buy:null},
};
const WEATHER=[
  {id:'normale',name:'Normale',p:38,agri:1,sun:1,wind:1,water:1},
  {id:'seche',name:'Sèche',p:16,agri:0.7,sun:1.12,wind:0.9,water:0.6,drought:true},
  {id:'pluvieuse',name:'Pluvieuse',p:16,agri:0.93,sun:0.8,wind:1.05,water:1.35},
  {id:'venteuse',name:'Venteuse',p:12,agri:0.97,sun:0.95,wind:1.3,water:1},
  {id:'ideale',name:'Idéale',p:12,agri:1.12,sun:1.1,wind:1.05,water:1.05},
  {id:'extreme',name:'Extrême',p:6,agri:0.55,sun:0.85,wind:1.2,water:0.85,storm:true},
];
const SUN_S=[1,1.35,0.7,0.4],WIND_S=[1,0.75,1.15,1.3],WATER_S=[1.4,0.55,0.9,1.1];

const GOODS={
  ble:{name:'Blé',base:230,vol:0.022,unit:'t',color:'#e8c25a'},
  mais:{name:'Maïs',base:200,vol:0.024,unit:'t',color:'#b7c64a'},
  tournesol:{name:'Tournesol',base:450,vol:0.028,unit:'t',color:'#ff9f43'},
  colza:{name:'Colza',base:480,vol:0.028,unit:'t',color:'#f3ea6a'},
  legumes:{name:'Légumes',base:750,vol:0.035,unit:'t',season:[1.15,0.85,0.95,1.2],color:'#ff6b6b'},
  elec:{name:'Électricité',base:95,vol:0.07,unit:'MWh',season:[0.95,0.8,1.05,1.35],color:'#7cb7ff'},
  gaz:{name:'Gaz',base:35,vol:0.05,unit:'MWh',season:[0.95,0.85,1,1.25],color:'#c69cff'},
  sardine:{name:'Sardine',base:1200,vol:0.04,unit:'t',season:[1.05,0.85,1,1.15],color:'#9fd0e8'},
  merlu:{name:'Merlu',base:4000,vol:0.03,unit:'t',color:'#e8b4a0'},
  bar:{name:'Bar',base:12000,vol:0.035,unit:'t',season:[1,1.1,0.95,1.1],color:'#c5e86c'},
  thon:{name:'Thon',base:6000,vol:0.035,unit:'t',season:[1.1,0.9,0.95,1.1],color:'#ff8fa3'},
  carburant:{name:'Gazole marin',base:100,vol:0.04,unit:'indice',color:'#d9b26a'},
};
const SECTOR_GOODS={agri:['ble','mais','tournesol','colza','legumes'],elec:['elec','gaz'],peche:['sardine','merlu','bar','thon','carburant'],eau:['elec']};

const CROPS={
  ble:{name:'Blé tendre',sow:[2],weeks:40,yield:180,inputs:9000,labor:1,tract:1,drought:1},
  mais:{name:'Maïs',sow:[0],weeks:26,yield:240,inputs:13000,labor:1,tract:1,drought:1.6},
  tournesol:{name:'Tournesol',sow:[0],weeks:22,yield:72,inputs:6000,labor:1,tract:1,drought:0.4},
  colza:{name:'Colza',sow:[1,2],weeks:44,yield:85,inputs:10000,labor:1,tract:1,drought:0.8},
  legumes:{name:'Légumes',sow:[0,1],weeks:12,yield:90,inputs:20000,labor:3,tract:0.5,drought:1.3,perish:true},
};

const ASSETS={
  hq:{name:'Siège',sec:null,nobuild:true},
  silo:{sec:'agri',name:'Silo',cost:120000,build:4,life:25,opex:0.01,tiles:['plaine','colline'],cap:800,fin:0.7,
    desc:'Stocke 800 t de grain pour vendre quand les cours montent.'},
  serre:{sec:'agri',name:'Serre maraîchère',cost:220000,build:6,life:20,opex:0.02,tiles:['plaine'],fin:0.7,
    desc:'Légumes toute l’année sans risque météo. Demande 3 ouvriers.'},
  atelier:{sec:'agri',name:'Atelier de transformation',cost:350000,build:10,life:20,opex:0.02,tiles:['plaine','colline'],req:'transfo',fin:0.7,
    desc:'Transforme 25 t de blé stocké par semaine en farine, vendue 60 % plus cher.'},
  solaire:{sec:'elec',name:'Ferme solaire',cost:420000,build:8,life:25,opex:0.012,mw:0.5,cf:0.16,cap:0.85,tiles:['plaine','colline'],fin:0.8,
    desc:'0,5 MW. Produit surtout l’été, rien la nuit.'},
  eolienne:{sec:'elec',name:'Éolienne',cost:2400000,build:16,life:20,opex:0.02,mw:2,cf:0.30,cap:0.95,tiles:['colline','plaine'],fin:0.8,
    desc:'2 MW. Produit surtout l’hiver, 25 % de mieux sur une colline.'},
  hydro:{sec:'elec',name:'Centrale hydro',cost:3200000,build:26,life:40,opex:0.01,mw:2.5,cf:0.42,cap:1.05,tiles:['riviere'],fin:0.8,pilot:true,
    desc:'2,5 MW sur une rivière. Forte au printemps, faible en été sec.'},
  gaz:{sec:'elec',name:'Centrale à gaz',cost:4500000,build:20,life:30,opex:0.015,mw:8,cap:1.15,tiles:['plaine','colline'],fin:0.8,pilot:true,
    desc:'8 MW pilotables. Tourne seulement quand l’électricité vaut plus que le gaz. 3 techniciens.'},
  batterie:{sec:'elec',name:'Batterie',cost:900000,build:6,life:15,opex:0.01,mw:2,tiles:['plaine','colline'],req:'stockage',fin:0.8,pilot:true,
    desc:'2 MW / 4 MWh. Achète bas, revend haut. Protège des prix négatifs.'},
};
const TRACTOR={cost:85000,life:10};

const ROLES={
  ouvrier:{sec:'agri',name:'Ouvrier agricole',sal:2100,desc:'Sème, entretient, récolte. 1 pour 6 parcelles, légumes ×3, serre = 3.'},
  agronome:{sec:'agri',name:'Agronome',sal:3600,desc:'1 point de R&D par semaine et +3 % de rendement chacun (max 3).',max:3},
  tech:{sec:'elec',name:'Technicien',sal:2700,desc:'Entretient les installations. 1 pour 4 MW renouvelables, 3 par centrale gaz.'},
  ingenieur:{sec:['elec','peche','eau'],name:'Ingénieur',sal:4300,desc:'1 point de R&D par semaine.'},
  marin:{sec:'peche',name:'Marin',sal:2600,desc:'Équipage : 2 par fileyeur, 4 par chalutier, 10 par thonier.'},
  patron:{sec:'peche',name:'Patron de pêche',sal:3900,desc:'+8 % de prises chacun (max 3).',max:3},
  agent:{sec:'eau',name:'Agent d’exploitation',sal:2700,desc:'Fait tourner captages et stations, entretient le réseau.'},
  trader:{sec:'elec',name:'Trader énergie',sal:5200,desc:'+4 % sur le prix de vente de ta production (max 2).',max:2},
  comptable:{sec:null,name:'Comptable',sal:3100,desc:'Débloque compte de résultat et prévisionnel. Relance les impayés, évite les erreurs.',max:2},
  daf:{sec:null,name:'DAF',sal:6500,desc:'Débloque le bilan et l’affacturage, taux −0,75 pt, découvert ×3. Nécessite un comptable.',max:1},
  rh:{sec:null,name:'Responsable RH',sal:3500,desc:'Moral +10, recrutement en 1 semaine au lieu de 3.',max:1},
  dg:{sec:null,name:'Directeur général',sal:7500,desc:'Pilote la société quand tu gères une autre filiale : recrute, plante, vend les stocks. Moral +5.',max:1},
};
const rolesFor=sec=>Object.keys(ROLES).filter(r=>{const S=ROLES[r].sec;return S===null||S===sec||(Array.isArray(S)&&S.includes(sec));});

const RD={
  agri:{branches:['Agronomie','Mécanisation','Valorisation'],nodes:[
    {id:'rot',br:0,name:'Rotation des cultures',cost:12,fx:'+5 % de rendement',a:f=>{f.yield*=1.05}},
    {id:'semences',br:0,req:'rot',name:'Semences sélectionnées',cost:25,fx:'+8 % de rendement',a:f=>{f.yield*=1.08}},
    {id:'precision',br:0,req:'semences',name:'Agriculture de précision',cost:40,fx:'Intrants −20 %',a:f=>{f.inputs*=0.8}},
    {id:'resist',br:0,req:'precision',name:'Variétés résistantes',cost:60,fx:'Effet des sécheresses −50 %',a:f=>{f.drought*=0.5}},
    {id:'entretien',br:1,name:'Entretien préventif',cost:10,fx:'Pannes de tracteur −50 %',a:f=>{f.breakMult*=0.5}},
    {id:'gps',br:1,req:'entretien',name:'Tracteurs guidés GPS',cost:24,fx:'Capacité des tracteurs +50 %',a:f=>{f.tractorCap*=1.5}},
    {id:'robots',br:1,req:'gps',name:'Robots de désherbage',cost:45,fx:'Ouvriers nécessaires −30 %',a:f=>{f.laborReq*=0.7}},
    {id:'autonome',br:1,req:'robots',name:'Machines autonomes',cost:70,fx:'Ouvriers −25 %, tracteurs +50 %',a:f=>{f.laborReq*=0.75;f.tractorCap*=1.5}},
    {id:'label',br:2,name:'Label qualité',cost:15,fx:'Prix de vente +6 %',a:f=>{f.price*=1.06}},
    {id:'direct',br:2,req:'label',name:'Vente directe',cost:28,fx:'Légumes vendus 25 % plus cher',a:f=>{f.legumes*=1.25}},
    {id:'transfo',br:2,req:'direct',name:'Transformation',cost:45,fx:'Débloque l’atelier de transformation',a:()=>{}},
    {id:'marque',br:2,req:'transfo',name:'Marque régionale',cost:65,fx:'Prix de vente +10 %',a:f=>{f.price*=1.1}},
  ],rep:{name:'Génétique végétale',fx:'+3 % de rendement',base:45,a:f=>{f.yield*=1.03}}},
  elec:{branches:['Rendement','Marché et stockage','Maintenance'],nodes:[
    {id:'nettoyage',br:0,name:'Nettoyage robotisé',cost:10,fx:'Solaire +6 %',a:f=>{f.sol*=1.06}},
    {id:'bifacial',br:0,req:'nettoyage',name:'Panneaux bifaciaux',cost:24,fx:'Solaire +12 %',a:f=>{f.sol*=1.12}},
    {id:'pales',br:0,req:'bifacial',name:'Pales plus longues',cost:40,fx:'Éolien +12 %',a:f=>{f.wind*=1.12}},
    {id:'turbines',br:0,req:'pales',name:'Turbines nouvelle génération',cost:65,fx:'Toute la production +8 %',a:f=>{f.all*=1.08}},
    {id:'meteo',br:1,name:'Prévision météo par IA',cost:12,fx:'Prix capté +4 %',a:f=>{f.capture*=1.04}},
    {id:'stockage',br:1,req:'meteo',name:'Stockage par batteries',cost:26,fx:'Débloque les batteries',a:()=>{}},
    {id:'smartgrid',br:1,req:'stockage',name:'Smart grid',cost:45,fx:'Prix capté +6 %',a:f=>{f.capture*=1.06}},
    {id:'capacite',br:1,req:'smartgrid',name:'Marché de capacité',cost:60,fx:'+500 € par MW pilotable et par semaine',a:f=>{f.capacity=500}},
    {id:'predictive',br:2,name:'Maintenance prédictive',cost:14,fx:'Pannes −40 %',a:f=>{f.breakMult*=0.6}},
    {id:'drones',br:2,req:'predictive',name:'Inspection par drones',cost:28,fx:'Techniciens nécessaires −25 %',a:f=>{f.techReq*=0.75}},
    {id:'repower',br:2,req:'drones',name:'Repowering',cost:45,fx:'Rénover coûte 30 % au lieu de 50 %',a:f=>{f.renov=0.3}},
    {id:'jumeau',br:2,req:'repower',name:'Jumeau numérique',cost:70,fx:'Pannes −40 %, usure −30 %',a:f=>{f.breakMult*=0.6;f.wear*=0.7}},
  ],rep:{name:'Optimisation continue',fx:'Toute la production +2 %',base:50,a:f=>{f.all*=1.02}}},
};
const baseFx=()=>({catch:1,fuel:1,quota:1,stormOk:false,leakFix:0,leakGrowth:1,treat:1,chem:1,energyW:1,connect:1,sat:0,wprice:1,yield:1,inputs:1,drought:1,breakMult:1,tractorCap:1,laborReq:1,price:1,legumes:1,
  sol:1,wind:1,all:1,capture:1,capacity:0,techReq:1,renov:0.5,wear:1});

/* ---------- map ---------- */
function genMap(){
  const T=[];for(let y=0;y<N;y++){T[y]=[];for(let x=0;x<N;x++)T[y][x]={x,y,ter:'plaine',owner:null,lease:false,price:0,asset:null,parcel:null,irrig:false,seed:Math.random()};}
  let rx=Math.floor(rand(3,N-3));
  for(let y=0;y<N;y++){T[y][rx].ter='riviere';
    if(Math.random()<0.4){const nx=clamp(rx+(Math.random()<0.5?-1:1),1,N-2);T[y][nx].ter='riviere';rx=nx;}}
  const blob=(ter,n,size)=>{for(let i=0;i<n;i++){let cx=Math.floor(rand(0,N)),cy=Math.floor(rand(0,N));
    const q=[[cx,cy]];let k=0;while(q.length&&k<size){const [x,y]=q.splice(Math.floor(Math.random()*q.length),1)[0];
      if(x<0||y<0||x>=N||y>=N||T[y][x].ter!=='plaine')continue;T[y][x].ter=ter;k++;
      q.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);}}};
  for(let y=N-2;y<N;y++)for(let x=0;x<N;x++)T[y][x].ter='mer';
  blob('colline',3,9);blob('foret',4,6);blob('village',4,2);
  let nv=T.flat().filter(t=>t.ter==='village').length;
  while(nv<5){const t=T[Math.floor(rand(1,N-3))][Math.floor(rand(1,N-1))];if(t.ter==='plaine'){t.ter='village';nv++;}}
  for(const t of T.flat())if(t.ter==='village')t.village={pop:Math.round(rand(1500,4500)),sup:null,end:0,sat:70};
  return T;
}
const allTiles=G=>G.tiles.flat();
const owned=(G,c)=>allTiles(G).filter(t=>t.owner===c.id);
const tileAt=(G,x,y)=>(x>=0&&y>=0&&x<N&&y<N)?G.tiles[y][x]:null;
const coastal=(G,t)=>[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>{const o=tileAt(G,t.x+dx,t.y+dy);return o&&o.ter==='mer';});
const dist=(a,b)=>Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y));
function reachable(G,c,t){
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const o=tileAt(G,t.x+dx,t.y+dy);if(o&&o.owner===c.id)return true;}
  return false;
}

/* ---------- game ---------- */
function newGame(o){
  const G={w:0,tiles:genMap(),px:{},hist:{},shocks:[],rate:3.5,weather:WEATHER[0],cos:[],cur:0,
    log:[],fx:[],nextEvent:9,lastEvent:null,pendingEvent:null,over:null,started:false,miles:{},holding:null};
  for(const k in GOODS){G.px[k]=GOODS[k].base;G.hist[k]=[];}
  G.fish=Object.fromEntries(Object.entries(SPECIES).map(([k,S])=>[k,{B:S.K*rand(0.7,0.85)}]));
  for(let i=0;i<30;i++)stepMarket(G);
  G.cos.push(newCompany(G,o));
  return G;
}
function newCompany(G,o){
  const sector=o.sector||'agri',profile=o.profile||'heritier';
  const c={id:'c'+Math.random().toString(36).slice(2,8),name:o.name||SECTORS[sector].co,founder:o.founder||'',sector,profile,color:o.color||COLORS[0],
    cash:0,recv:[],pay:[],tva:0,isDue:null,deficit:0,loans:[],
    staff:Object.fromEntries(rolesFor(sector).map(r=>[r,0])),pending:[],payPolicy:0,morale:65,layoffHit:0,unpaidHit:0,mods:[],
    fleet:[],boats:[],fishq:{},fishc:{},respectQ:true,water:{leak:0.16,prod:0,sold:0,demand:0},stock:{},contracts:[],offers:[],insured:false,rdBudget:0,
    rd:{bank:0,cur:null,done:{},rep:0},fx:baseFx(),pl:{},hist:{cash:[],ca:[]},odWeeks:0,weekCA:0,last:{},hq:null,stats:{harvests:0,mwh:0}};
  // HQ placement: plaine tile with many plaine neighbours, near centre, not too close to edge
  let best=null,bs=-1;
  for(const t of allTiles(G)){if(t.ter!=='plaine'||t.owner||t.x<2||t.y<2||t.x>N-3||t.y>N-3)continue;
    if(sector!=='peche'&&(t.x<3||t.y<3||t.x>N-4||t.y>N-5))continue;
    if(sector==='peche'&&t.y<N-5)continue;
    let s=0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const o2=tileAt(G,t.x+dx,t.y+dy);if(o2&&o2.ter==='plaine'&&!o2.owner)s++;}
    if(sector==='peche')s+=allTiles(G).some(o2=>o2.ter==='plaine'&&!o2.owner&&coastal(G,o2)&&dist(o2,t)<=2)?20:0;
    if(sector==='eau')s+=allTiles(G).filter(o2=>o2.village&&!o2.village.sup&&dist(o2,t)<=3).length*4;
    if(sector==='elec'){for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const o2=tileAt(G,t.x+dx,t.y+dy);if(o2&&(o2.ter==='colline'||o2.ter==='riviere'))s+=0.5;}}
    s+=Math.random();if(s>bs){bs=s;best=t;}}
  best=best||G.tiles[6][6];
  best.ter='plaine';best.owner=c.id;best.price=TERRAIN.plaine.buy;best.asset={type:'hq',built:true,cond:1,down:0,age:0,cost:0};
  c.hq={x:best.x,y:best.y};
  const near=allTiles(G).filter(t=>!t.owner&&t.ter==='plaine').sort((a,b)=>(Math.abs(a.x-best.x)+Math.abs(a.y-best.y))-(Math.abs(b.x-best.x)+Math.abs(b.y-best.y)));
  const her=profile==='heritier';
  if(o.bare){c.cash=o.capital||0;}
  else if(sector==='agri'){
    c.cash=her?160000:100000;
    const nOwn=her?6:4;
    near.slice(0,nOwn).forEach(t=>{t.owner=c.id;t.price=TERRAIN.plaine.buy;t.parcel={plan:null,crop:null};});
    near.slice(nOwn,nOwn+2).forEach(t=>{t.owner=c.id;t.lease=true;t.parcel={plan:null,crop:null};});
    const parcels=owned(G,c).filter(t=>t.parcel);
    const plans=['mais','mais','tournesol','ble','ble','ble','colza','ble'];
    parcels.forEach((t,i)=>{t.parcel.plan=plans[i%plans.length];
      if(i<3){t.parcel.crop={id:t.parcel.plan,w0:0,fs:0,fn:0};}});
    c.fleet.push({cost:TRACTOR.cost,age:52*3,cond:0.8,down:0});
    c.staff.ouvrier=1;
    c.loans.push(mkLoan('Prêt d’installation',200000,0.015,120,0));
  } else if(sector==='peche'){
    c.cash=her?320000:220000;
    const portT=allTiles(G).filter(t=>!t.owner&&t.ter==='plaine'&&coastal(G,t)).sort((a,b)=>dist(a,best)-dist(b,best))[0];
    if(portT){portT.owner=c.id;portT.price=TERRAIN.plaine.buy;portT.asset={type:'port',built:true,prog:8,cond:0.9,down:0,age:52*4,cost:ASSETS.port.cost};}
    c.boats.push(mkBoat('fileyeur','merlu',0.85),mkBoat('fileyeur','sardine',0.8));if(her)c.boats.push(mkBoat('fileyeur','sardine',0.9));
    c.staff.marin=her?6:4;
    c.loans.push(mkLoan('Prêt d’armement',150000,0.02,96,0));
  } else if(sector==='eau'){
    c.cash=her?450000:300000;
    const f=near[0],st=near[1],f0=near[3];
    f.owner=c.id;f.price=TERRAIN.plaine.buy;f.asset={type:'forage',built:true,prog:6,cond:0.9,down:0,age:52*5,cost:ASSETS.forage.cost};
    f0.owner=c.id;f0.price=TERRAIN.plaine.buy;f0.asset={type:'forage',built:true,prog:6,cond:0.85,down:0,age:52*8,cost:ASSETS.forage.cost};
    st.owner=c.id;st.price=TERRAIN.plaine.buy;st.asset={type:'station',built:true,prog:12,cond:0.9,down:0,age:52*5,cost:ASSETS.station.cost};
    if(her){const f2=near[2];f2.owner=c.id;f2.price=TERRAIN.plaine.buy;f2.asset={type:'forage',built:true,prog:6,cond:0.9,down:0,age:52*3,cost:ASSETS.forage.cost};}
    const v=allTiles(G).filter(t=>t.village&&!t.village.sup).sort((a,b)=>dist(a,best)-dist(b,best))[0];
    if(v){v.village.sup=c.id;v.village.end=52*12;v.village.sat=70;if(v.village.pop<3000)v.village.pop=Math.round(rand(3000,3800));}
    c.staff.agent=2;
    c.loans.push(mkLoan('Prêt de concession',900000,0.025,180,0));
  } else {
    c.cash=her?900000:650000;
    const sol=near.slice(0,her?2:1);
    sol.forEach(t=>{t.owner=c.id;t.price=TERRAIN.plaine.buy;t.asset={type:'solaire',built:true,prog:8,cond:0.95,down:0,age:52,cost:ASSETS.solaire.cost};});
    c.staff.tech=1;
  }
  return c;
}
function mkLoan(name,P,rate,months,start){
  const r=rate/12,pay=r>0?P*r/(1-Math.pow(1+r,-months)):P/months;
  return{id:'L'+Math.random().toString(36).slice(2,7),name,P,rate,months,pay,start,left:months};
}
const has=(c,r)=>(c.staff[r]||0)>0;
const staffTotal=c=>Object.values(c.staff).reduce((a,b)=>a+b,0);
function log(G,text,cls=''){G.log.unshift({w:G.w,text,cls});if(G.log.length>80)G.log.pop();}
function fx(G,t,text,color){G.fx.push({x:t.x,y:t.y,text,color});}

/* ---------- accounting primitives ---------- */
function PL(c,y){return c.pl[y]||(c.pl[y]={ca:0,subv:0,achats:0,perso:0,loyers:0,autres:0,impayes:0,amort:0,interets:0,is:0});}
const plAdd=(G,c,k,v)=>{PL(c,yearOf(G.w))[k]+=v;};
function plCalc(p){const ebe=p.ca+p.subv-p.achats-p.perso-p.loyers-p.autres-p.impayes;const rex=ebe-p.amort;const rcai=rex-p.interets;return{ebe,rex,rcai,net:rcai-p.is};}
function sale(G,c,ht,dso){if(ht<=0)return;const t=SECTORS[c.sector].tva;c.recv.push({amt:ht*(1+t),due:G.w+dso,chk:false});c.tva+=ht*t;plAdd(G,c,'ca',ht);c.weekCA+=ht;}
function purchase(G,c,ht,cat,dpo=4){if(ht<=0)return;c.pay.push({amt:ht*1.2,due:G.w+dpo});c.tva-=ht*0.2;plAdd(G,c,cat,ht);}
const odLimit=c=>has(c,'daf')?90000:30000;
const payroll=c=>{let s=CEO_SAL;for(const r in c.staff)s+=c.staff[r]*ROLES[r].sal*(1+c.payPolicy);return s*CHARGES;};
const assetBook=a=>a.type==='hq'?0:a.cost*Math.max(0,1-a.age/(ASSETS[a.type].life*52));
function assetsBook(G,c){let s=0;for(const t of owned(G,c))if(t.asset)s+=assetBook(t.asset);for(const f of c.fleet)s+=f.cost*Math.max(0,1-f.age/(TRACTOR.life*52));for(const b of (c.boats||[]))s+=b.cost*Math.max(0,1-b.age/(BOATS[b.type].life*52));s+=(c.water&&c.water.net)?c.water.net*0.8:0;return s;}
const landValue=(G,c)=>owned(G,c).filter(t=>!t.lease).reduce((a,t)=>a+t.price,0);
const debt=c=>c.loans.reduce((a,l)=>a+l.P,0);
const insurancePremium=(G,c)=>300+0.0025*(assetsBook(G,c)+landValue(G,c));
const rentMonthly=(G,c)=>owned(G,c).filter(t=>t.lease).reduce((a,t)=>a+(TERRAIN[t.ter].lease||0),0)/12;
function ebeRef(G,c){const y=yearOf(G.w),wk=G.w%52;const cur=plCalc(PL(c,y)).ebe;
  if(wk>=26||!c.pl[y-1])return wk>0?cur*52/Math.max(wk,13):cur;return plCalc(PL(c,y-1)).ebe;}
function rateFor(G,c,kind){return Math.max(1,G.rate+(kind==='project'?1.5:2.5)-(has(c,'daf')?0.75:0)-(c.profile==='banquier'?1:0))/100;}
function loanCapacity(G,c){
  const classic=c.loans.filter(l=>l.kind==='classic').reduce((a,l)=>a+l.P,0);
  const cap=(0.5*(landValue(G,c)+assetsBook(G,c))+2*Math.max(0,ebeRef(G,c)))*(c.profile==='banquier'?1.3:1);
  return Math.max(0,Math.floor((cap-classic)/1000)*1000);
}
const prodMult=c=>(0.8+c.morale/250)*(1+c.mods.filter(m=>m.key==='prod').reduce((a,m)=>a+m.val,0));

/* ---------- needs & coverage ---------- */
function needs(G,c){
  const o=owned(G,c);
  if(c.sector==='agri'){
    let labor=0,tract=0;
    for(const t of o){if(t.parcel){const id=t.parcel.crop?t.parcel.crop.id:t.parcel.plan;if(id){labor+=CROPS[id].labor;tract+=CROPS[id].tract;}}
      if(t.asset&&t.asset.type==='serre'&&t.asset.built)labor+=18;}
    const lab=labor/6*c.fx.laborReq,tr=tract/(6*c.fx.tractorCap);
    const tractors=c.fleet.filter(f=>!f.down).length;
    const covL=lab>0?Math.min(1,c.staff.ouvrier/lab):1,covT=tr>0?Math.min(1,tractors/tr):1;
    return{main:'ouvrier',need:lab,have:c.staff.ouvrier,cov:Math.min(covL,covT),covL,covT,tractNeed:tr,tractors};
  }
  if(c.sector==='peche'){const need=c.boats.reduce((a,b)=>a+BOATS[b.type].crew,0)*c.fx.techReq;return{main:'marin',need,have:c.staff.marin,cov:need>0?Math.min(1,c.staff.marin/need):1};}
  if(c.sector==='eau'){const as=o.filter(t=>t.asset&&t.asset.built&&WATER_ASSETS.includes(t.asset.type)).length;const vs=servedVillages(G,c).length;
    let need=(as*0.4+vs*0.3)*c.fx.techReq;if(as&&need<1)need=1;return{main:'agent',need,have:c.staff.agent,cov:need>0?Math.min(1,c.staff.agent/need):1};}
  let mw=0,gas=0,bat=0,any=0;
  for(const t of o){const a=t.asset;if(!a||a.type==='hq'||!a.built)continue;any++;
    if(a.type==='gaz')gas++;else if(a.type==='batterie')bat++;else mw+=ASSETS[a.type].mw;}
  let need=(mw/4+gas*3+bat*0.5)*c.fx.techReq;if(any&&need<1)need=1;
  return{main:'tech',need,have:c.staff.tech,cov:need>0?Math.min(1,c.staff.tech/need):1};
}

/* ---------- market & weather ---------- */
function stepMarket(G){
  const s=seasonOf(G.w);
  for(const k in GOODS){const g=GOODS[k];
    let tgt=g.base*(g.season?g.season[s]:1);
    for(const sh of G.shocks)if(sh.good===k)tgt*=sh.mult;
    let p=G.px[k]*Math.exp(g.vol*randn());p+=(tgt-p)*0.09;
    G.px[k]=Math.max(g.base*0.25,p);G.hist[k].push(G.px[k]);if(G.hist[k].length>260)G.hist[k].shift();}
  G.shocks.forEach(sh=>sh.weeks--);G.shocks=G.shocks.filter(sh=>sh.weeks>0);
  G.rate=clamp(G.rate+randn()*0.03,1.5,8);
}
function rollWeather(G){
  const tot=WEATHER.reduce((a,w)=>a+w.p,0);let r=Math.random()*tot;
  for(const w of WEATHER){r-=w.p;if(r<=0){G.weather=w;break;}}
  log(G,`${SEASONS[seasonOf(G.w)]} ${yearOf(G.w)} : saison ${G.weather.name.toLowerCase()}.`,G.weather.id==='seche'||G.weather.id==='extreme'?'bad':G.weather.id==='ideale'?'good':'');
}

/* ---------- weekly simulation ---------- */
function tick(G){
  G.w++;
  if(G.w%13===0)rollWeather(G);
  stepMarket(G);fishRegrow(G);
  for(const c of G.cos){tickCo(G,c);if(has(c,'dg')&&c!==G.cos[G.cur])autopilot(G,c);}
  for(const c of G.cos.filter(x=>x.bankrupt)){
    if(G.cos.length>1)liquidate(G,c);else{G.over='bankrupt';return;}}
  const c=G.cos[G.cur];
  if(G.w>=G.nextEvent){G.nextEvent=G.w+Math.round(rand(7,12));const e=pickEvent(G,c);if(e){G.pendingEvent=e.id;G.lastEvent=e.id;}}
}
function tickCo(G,c){
  const y=yearOf(G.w);
  c.weekCA=0;
  // year close
  if(G.w%52===0&&G.w>0)closeYear(G,c);
  // arrivals
  c.pending.forEach(p=>p.weeks--);
  const arr=c.pending.filter(p=>p.weeks<=0);c.pending=c.pending.filter(p=>p.weeks>0);
  arr.forEach(p=>{c.staff[p.role]=(c.staff[p.role]||0)+1;log(G,`Arrivée : ${ROLES[p.role].name}.`);});
  c.mods.forEach(m=>m.weeks--);c.mods=c.mods.filter(m=>m.weeks>0);
  const nd=needs(G,c);
  if(c.sector==='agri')agriWeek(G,c,nd);else if(c.sector==='elec')elecWeek(G,c,nd);else if(c.sector==='peche')fishWeek(G,c,nd);else waterWeek(G,c,nd);
  assetsWeek(G,c,nd);
  rdWeek(G,c);
  contractsWeek(G,c);
  // cash in/out
  const isC=has(c,'comptable');
  for(const r of c.recv){if(r.due>G.w||r.done)continue;
    if(!r.chk){r.chk=true;const bad=isC?0.01:0.04,late=isC?0.03:0.12,x=Math.random();
      if(x<bad){if(isC&&Math.random()<0.6){r.due+=6;continue;}r.done=true;const ht=r.amt/(1+SECTORS[c.sector].tva);plAdd(G,c,'impayes',ht);c.tva-=ht*SECTORS[c.sector].tva;log(G,`Facture impayée : ${eur(r.amt)} perdus.`,'bad');continue;}
      if(x<bad+late){r.due+=Math.round(rand(3,6));continue;}}
    c.cash+=r.amt;r.done=true;}
  c.recv=c.recv.filter(r=>!r.done);
  for(const p of c.pay){if(p.due<=G.w){c.cash-=p.amt;p.done=true;}}
  c.pay=c.pay.filter(p=>!p.done);
  // monthly
  if(monthOf(G.w)!==monthOf(G.w-1)){
    const pr=payroll(c);c.cash-=pr;plAdd(G,c,'perso',pr);
    if(c.cash<-odLimit(c)){c.unpaidHit=30;log(G,'Salaires versés en retard : le découvert est dépassé.','bad');}
    const rent=rentMonthly(G,c);if(rent){c.cash-=rent;plAdd(G,c,'loyers',rent);}
    for(const l of c.loans){if(l.start>G.w||l.left<=0)continue;const int=l.P*l.rate/12;const pr2=Math.min(l.P,l.pay-int);
      l.P-=pr2;l.left--;c.cash-=int+pr2;plAdd(G,c,'interets',int);}
    c.loans=c.loans.filter(l=>l.P>1&&l.left>0);
    if(c.insured){const ins=insurancePremium(G,c);c.cash-=ins;plAdd(G,c,'autres',ins);}
    if(c.rdBudget)purchase(G,c,c.rdBudget,'autres');
  }
  // quarterly VAT
  if(G.w%13===0&&G.w>0){
    let amt=c.tva;
    if(!isC&&Math.random()<0.12&&Math.abs(amt)>100){const maj=Math.max(500,Math.abs(amt)*0.1);c.cash-=maj;plAdd(G,c,'autres',maj);log(G,`Erreur de déclaration de TVA : majoration de ${eur(maj)}.`,'bad');}
    c.cash-=amt;c.tva=0;
    log(G,amt>=0?`TVA du trimestre reversée : ${eur(amt)}.`:`Crédit de TVA remboursé : ${eur(-amt)}.`,amt>=0?'':'good');
  }
  if(c.isDue&&G.w>=c.isDue.week){c.cash-=c.isDue.amt;if(c.isDue.amt>0)log(G,`Impôt sur les sociétés payé : ${eur(c.isDue.amt)}.`);c.isDue=null;}
  // overdraft
  if(c.cash<0){const int=-c.cash*0.09/52;c.cash-=int;plAdd(G,c,'interets',int);}
  if(c.cash<-odLimit(c)){c.odWeeks++;if(c.odWeeks===1)log(G,'Découvert autorisé dépassé. Six semaines comme ça et c’est la cessation de paiements.','bad');}
  else c.odWeeks=0;
  if(c.odWeeks>=6)c.bankrupt=true;
  // morale
  const over=Math.max(0,1-nd.cov);
  const target=62+c.payPolicy*100+(has(c,'rh')?10:0)+(has(c,'dg')?5:0)+(c.profile==='manager'?12:0)-over*40-c.layoffHit-c.unpaidHit;
  c.morale+=(clamp(target,5,100)-c.morale)*0.12;c.layoffHit*=0.9;c.unpaidHit*=0.93;
  if(c.morale<35&&staffTotal(c)>0&&Math.random()<(35-c.morale)/35*0.3){
    const rs=Object.keys(c.staff).filter(r=>c.staff[r]>0);const r=pick(rs);c.staff[r]--;log(G,`Démission d’un ${ROLES[r].name.toLowerCase()} : le moral est au plus bas.`,'bad');}
  c.hist.cash.push(c.cash);if(c.hist.cash.length>260)c.hist.cash.shift();
  c.hist.ca.push(c.weekCA);if(c.hist.ca.length>260)c.hist.ca.shift();
  milestones(G,c);
}
function closeYear(G,c){
  const y=yearOf(G.w-1),P=PL(c,y),r=plCalc(P);
  let is=0;
  if(r.rcai>0){const tax=Math.max(0,r.rcai-c.deficit);c.deficit=Math.max(0,c.deficit-r.rcai);is=tax*0.25;}
  else c.deficit+=-r.rcai;
  P.is=is;c.isDue={amt:is,week:G.w+18};
  log(G,`Clôture ${y} : CA ${eur(P.ca)}, résultat net ${eur(r.rcai-is)}.`,r.rcai-is>=0?'good':'bad');
}
function milestones(G,c){
  const m=G.miles,ck=(k,cond,txt)=>{if(!m[k]&&cond){m[k]=1;log(G,txt,'gold');}};
  const ca=c.hist.ca.slice(-52).reduce((a,b)=>a+b,0);
  ck('ca1',ca>=1e6,'Un million d’euros de chiffre d’affaires sur un an.');
  ck('ca10',ca>=1e7,'10 M€ de chiffre d’affaires sur un an. Tu pèses dans la région.');
  ck('t20',owned(G,c).length>=20,'20 parcelles sous ton nom.');
  ck('t50',owned(G,c).length>=50,'50 parcelles : un quart de la région t’appartient.');
}

/* ---------- agriculture ---------- */
function agriWeek(G,c,nd){
  const s=seasonOf(G.w),wk=G.w%13,W=G.weather;
  const agr=Math.min(3,c.staff.agronome||0);
  for(const t of owned(G,c)){
    const p=t.parcel;if(!p)continue;
    if(!p.crop&&p.plan&&CROPS[p.plan].sow.includes(s)&&wk<=9)sow(G,c,t,p.plan);
    if(!p.crop)continue;
    const C=CROPS[p.crop.id];
    let f;
    if(W.drought){const sens=C.drought*c.fx.drought*(t.irrig?0.15:1);f=1-(1-W.agri)*sens;}else f=W.agri;
    if(t.irrig)f+=0.05;
    if(c.insured&&W.storm)f=Math.max(f,0.85);
    p.crop.fs+=Math.max(0.1,f);p.crop.fn++;
    if(G.w-p.crop.w0>=C.weeks)harvest(G,c,t,nd,agr);
  }
  // greenhouses & workshop
  for(const t of owned(G,c)){const a=t.asset;if(!a||!a.built||a.down)continue;
    if(a.type==='serre'){a.cyc=(a.cyc||0)+1;
      if(a.cyc===1)purchase(G,c,18000*c.fx.inputs,'achats');
      if(a.cyc>=12){a.cyc=0;const tn=100*c.fx.yield*prodMult(c)*(0.55+0.45*nd.covL);
        const v=tn*G.px.legumes*c.fx.price*c.fx.legumes;sale(G,c,v,2);fx(G,t,'+'+eur(v),'#6fd3a8');c.stats.harvests++;}}
    if(a.type==='atelier'){const q=Math.min(25,c.stock.ble||0);if(q>0){c.stock.ble-=q;sale(G,c,q*G.px.ble*1.6*c.fx.price,4);}}
  }
  let energy=0;for(const t of owned(G,c)){if(t.irrig)energy+=s===1?160:40;if(t.asset&&t.asset.built){if(t.asset.type==='serre')energy+=400;if(t.asset.type==='atelier')energy+=300;}}
  energy*=G.px.elec/GOODS.elec.base;
  if(energy>0){const sup=G.cos.find(x=>x.sector==='elec'&&x!==c&&(x.last.mwh||0)>0);
    if(sup&&G.holding){purchase(G,c,energy*0.7,'achats');sale(G,sup,energy*0.7,4);c.last.intra=energy*0.3;}else{purchase(G,c,energy,'achats');c.last.intra=0;}}
  c.last.energy=energy;
  if(G.w%52===42){const n=owned(G,c).filter(t=>t.parcel).length;let amt=n*5000;
    if(!has(c,'comptable')&&Math.random()<0.15){amt*=0.5;log(G,'Dossier PAC incomplet : aide réduite de moitié.','bad');}
    if(amt>0){c.cash+=amt;plAdd(G,c,'subv',amt);log(G,`Aides PAC versées : ${eur(amt)}.`,'good');}}
}
function sow(G,c,t,id){const C=CROPS[id];t.parcel.crop={id,w0:G.w,fs:0,fn:0};purchase(G,c,C.inputs*c.fx.inputs,'achats');}
function siloCap(G,c){return owned(G,c).filter(t=>t.asset&&t.asset.type==='silo'&&t.asset.built).length*ASSETS.silo.cap;}
const stockUsed=c=>Object.values(c.stock).reduce((a,b)=>a+b,0);
function harvest(G,c,t,nd,agr){
  const p=t.parcel,C=CROPS[p.crop.id],mean=p.crop.fs/Math.max(1,p.crop.fn);
  const terr=t.ter==='colline'?0.8:1;
  const tn=C.yield*mean*terr*c.fx.yield*(1+0.03*agr)*prodMult(c)*(0.5+0.5*nd.cov)*rand(0.92,1.08);
  const g=p.crop.id;let price=G.px[g]*c.fx.price;
  let val=0;
  if(C.perish){price*=c.fx.legumes;val=tn*price;sale(G,c,val,2);}
  else{const free=Math.max(0,siloCap(G,c)-stockUsed(c));const st=Math.min(free,tn);
    c.stock[g]=(c.stock[g]||0)+st;const rest=tn-st;val=rest*price*0.93;if(rest>0)sale(G,c,val,4);
    if(st>0)log(G,`Récolte de ${C.name.toLowerCase()} : ${num(tn)} t, dont ${num(st)} t stockées.`);}
  fx(G,t,val>0?'+'+eur(val):`+${num(tn)} t`,'#ffd36b');
  if(C.perish||val>0)log(G,`Récolte de ${C.name.toLowerCase()} : ${num(tn)} t (${pct(mean)} de conditions).`,mean>=0.95?'good':mean<0.8?'bad':'');
  p.crop=null;c.stats.harvests++;
}
function sellStock(G,c,g,share){
  const q=(c.stock[g]||0)*share;if(q<=0)return 0;
  c.stock[g]-=q;const v=q*G.px[g]*c.fx.price;sale(G,c,v,4);
  log(G,`Vente de ${num(q)} t de ${GOODS[g].name.toLowerCase()} : ${eur(v)}.`);return v;
}

/* ---------- electricity ---------- */
function elecWeek(G,c,nd){
  const s=seasonOf(G.w),W=G.weather,spot=G.px.elec;
  const avail=(0.55+0.45*nd.cov)*prodMult(c);
  const trader=1+0.04*Math.min(2,c.staff.trader||0);
  let mwh=0,spotRev=0,other=0;
  for(const t of owned(G,c)){const a=t.asset;if(!a||!a.built||a.down||a.type==='hq')continue;
    const A=ASSETS[a.type];const cond=0.7+0.3*a.cond;let m=0,capF=A.cap||1;
    if(a.type==='solaire')m=A.mw*168*A.cf*SUN_S[s]*W.sun*c.fx.sol;
    else if(a.type==='eolienne')m=A.mw*168*A.cf*WIND_S[s]*W.wind*(t.ter==='colline'?1.25:1)*c.fx.wind*rand(0.85,1.15);
    else if(a.type==='hydro')m=A.mw*168*A.cf*WATER_S[s]*W.water;
    else if(a.type==='gaz'){const fuel=G.px.gaz/0.55+30;const run=clamp((spot*capF*c.fx.capture*trader-fuel)/30+0.5,0,0.92);
      m=A.mw*168*run;purchase(G,c,m*avail*cond*c.fx.all*fuel,'achats');a.run=run;}
    else if(a.type==='batterie'){const rv=4*6*spot*0.35*c.fx.capture*trader*avail;other+=rv;}
    if(A.pilot&&c.fx.capacity)other+=A.mw*c.fx.capacity;
    m*=avail*cond*c.fx.all;a.lastMWh=m;
    mwh+=m;spotRev+=m*spot*capF*c.fx.capture*trader;
  }
  // contracts
  c.last.short=0;
  const need=c.contracts.filter(k=>k.type==='ppa').reduce((a,k)=>a+k.mwh,0);
  let ctrRev=0;
  for(const k of c.contracts.filter(k=>k.type==='ppa'))ctrRev+=k.mwh*k.price;
  if(need>0){
    if(mwh>=need){const avgCap=mwh>0?spotRev/mwh:spot;spotRev-=need*avgCap;}
    else{const short=need-mwh;spotRev=0;purchase(G,c,short*spot*1.1,'achats');if(short>5)c.last.short=short;}
  }
  sale(G,c,spotRev+other,2);sale(G,c,ctrRev,8);
  c.last.mwh=mwh;c.stats.mwh+=mwh;
}

/* ---------- assets ---------- */
function assetsWeek(G,c,nd){
  let opex=0,amort=0;
  for(const t of owned(G,c)){const a=t.asset;if(!a||a.type==='hq')continue;const A=ASSETS[a.type];
    if(!a.built){a.prog++;if(a.prog>=A.build){a.built=true;log(G,`Mise en service : ${A.name}.`,'good');fx(G,t,'En service','#6fd3a8');}continue;}
    a.age++;amort+=a.cost/(A.life*52);opex+=a.cost*A.opex/52;
    const wear=1/(A.life*52)*(nd.cov>=1?0.7:1.4)*c.fx.wear;a.cond=Math.max(0,a.cond-wear);
    if(a.down>0){a.down--;if(!a.down)log(G,`${A.name} réparée.`);continue;}
    const p=0.003*(1+(1-a.cond)*4)*(nd.cov<1?1+(1-nd.cov)*3:1)*c.fx.breakMult*(G.weather.storm&&a.type==='eolienne'?4:1);
    if(Math.random()<p)breakAsset(G,c,t,0.03);
  }
  for(const f of c.fleet){f.age++;amort+=f.cost/(TRACTOR.life*52);opex+=f.cost*0.02/52;
    f.cond=Math.max(0,f.cond-1/(TRACTOR.life*52));
    if(f.down>0){f.down--;continue;}
    if(Math.random()<0.004*(1+(1-f.cond)*4)*c.fx.breakMult){f.down=Math.round(rand(1,3));const rep=f.cost*0.04*(c.insured?0.2:1);purchase(G,c,rep,'autres');log(G,`Tracteur en panne (${f.down} sem.). Réparation : ${eur(rep)}.`,'bad');}
  }
  for(const b of c.boats){const B=BOATS[b.type];b.age++;amort+=b.cost/(B.life*52);opex+=b.cost*0.025/52;
    b.cond=Math.max(0,b.cond-1/(B.life*52)*(nd.cov>=1?0.8:1.5));
    if(b.down>0){b.down--;continue;}
    if(Math.random()<0.004*(1+(1-b.cond)*4)*c.fx.breakMult*(G.weather.storm?3:1)){b.down=Math.round(rand(2,5));const rep=b.cost*0.05*(c.insured?0.2:1);purchase(G,c,rep,'autres');log(G,`Avarie sur un ${B.name.toLowerCase()} (${b.down} sem. à quai). Réparation : ${eur(rep)}.`,'bad');}}
  if(opex)purchase(G,c,opex,'autres');
  plAdd(G,c,'amort',amort);
}
function breakAsset(G,c,t,repairShare,weeks){
  const a=t.asset,A=ASSETS[a.type];a.down=weeks||Math.round(rand(2,6));
  const rep=a.cost*repairShare*(c.insured?0.2:1);purchase(G,c,rep,'autres');
  log(G,`Panne : ${A.name} à l’arrêt ${a.down} semaines. Réparation ${eur(rep)}${c.insured?' (assurée)':''}.`,'bad');
  fx(G,t,'Panne','#ff7d6b');
}

/* ---------- R&D ---------- */
const rdPts=c=>(c.staff.agronome||0)+(c.staff.ingenieur||0)+(c.profile==='ingenieur'?1.5:0)+c.rdBudget/10000;
function rdCost(c,id){if(id==='rep')return Math.round(RD[c.sector].rep.base*Math.pow(1.35,c.rd.rep));return RD[c.sector].nodes.find(n=>n.id===id).cost;}
function rdWeek(G,c){
  const pts=rdPts(c);
  if(!c.rd.cur){c.rd.bank+=pts;return;}
  c.rd.cur.prog+=pts;const cost=rdCost(c,c.rd.cur.id);
  if(c.rd.cur.prog>=cost){const extra=c.rd.cur.prog-cost;finishRd(G,c,c.rd.cur.id);c.rd.bank+=extra;c.rd.cur=null;}
}
function finishRd(G,c,id){
  const T=RD[c.sector];
  if(id==='rep'){T.rep.a(c.fx);c.rd.rep++;log(G,`Recherche terminée : ${T.rep.name} ${c.rd.rep} (${T.rep.fx}).`,'good');return;}
  const n=T.nodes.find(x=>x.id===id);n.a(c.fx);c.rd.done[id]=true;log(G,`Recherche terminée : ${n.name} (${n.fx}).`,'good');
}
function startRd(G,c,id){
  if(c.rd.cur&&c.rd.cur.id===id)return;
  if(id!=='rep'){const n=RD[c.sector].nodes.find(x=>x.id===id);if(c.rd.done[id]||(n.req&&!c.rd.done[n.req]))return;}
  if(c.rd.cur)c.rd.bank+=c.rd.cur.prog;
  const cost=rdCost(c,id),use=Math.min(c.rd.bank,cost-0.01);c.rd.bank-=use;c.rd.cur={id,prog:use};
}
// rebuild fx from done list (used after loading a snapshot)
function rebuildFx(c){c.fx=baseFx();const T=RD[c.sector];for(const n of T.nodes)if(c.rd.done[n.id])n.a(c.fx);for(let i=0;i<c.rd.rep;i++)T.rep.a(c.fx);}

/* ---------- contracts & offers ---------- */
const CLIENTS=['Fonderie Marchand','Papeterie du Val','Data center Nordia','Ville de Saint-Aubin','Laiterie Perrin','Verrerie Bellecour','Hôpital régional','Cimenterie Delorme'];
const COOPS=['Coopérative Céréalière du Centre','Négoce Lambert','Moulins Réunis','Huilerie Garnier','Agri-Export Atlantique'];
function expectedWeeklyMWh(G,c){let m=0;for(const t of owned(G,c)){const a=t.asset;if(!a||!a.built||a.type==='hq')continue;const A=ASSETS[a.type];
  if(a.type==='solaire')m+=A.mw*168*A.cf*0.86;else if(a.type==='eolienne')m+=A.mw*168*A.cf*1.05*(t.ter==='colline'?1.25:1);else if(a.type==='hydro')m+=A.mw*168*A.cf*0.99;}return m;}
function contractsWeek(G,c){
  // agri forward deliveries
  for(const k of c.contracts){if(k.type!=='fwd'||k.due>G.w)continue;
    const have=c.stock[k.good]||0,del=Math.min(have,k.qty),short=k.qty-del;
    c.stock[k.good]=have-del;
    if(short>0){purchase(G,c,short*G.px[k.good]*1.05,'achats');log(G,`Livraison à terme incomplète : ${num(short)} t de ${GOODS[k.good].name.toLowerCase()} rachetées au marché.`,'bad');}
    sale(G,c,k.qty*k.price,4);log(G,`Contrat livré à ${k.client} : ${num(k.qty)} t pour ${eur(k.qty*k.price)}.`,'good');k.done=true;}
  for(const k of c.contracts){if(k.type!=='ppa')continue;k.weeks--;if(k.weeks<=0){k.done=true;log(G,`Contrat terminé avec ${k.client}.`);}}
  c.contracts=c.contracts.filter(k=>!k.done);
  c.offers=c.offers.filter(o=>o.exp>G.w);
  if(G.w%4===0){
    if(c.sector==='agri'){for(let i=0;i<2;i++){const g=pick(['ble','mais','tournesol','colza']);
      c.offers.push({id:Math.random().toString(36).slice(2,7),type:'fwd',good:g,client:pick(COOPS),qty:Math.round(rand(80,400)/10)*10,price:Math.round(G.px[g]*rand(1.02,1.12)),due:G.w+Math.round(rand(10,30)),exp:G.w+8});}}
    else{const e=expectedWeeklyMWh(G,c);if(e>10)for(let i=0;i<2;i++){const avg=(G.hist.elec.slice(-26).reduce((a,b)=>a+b,0)/Math.min(26,G.hist.elec.length));
      c.offers.push({id:Math.random().toString(36).slice(2,7),type:'ppa',client:pick(CLIENTS),mwh:Math.max(5,Math.round(e*rand(0.15,0.4))),price:Math.round(avg*rand(0.95,1.12)),weeks:pick([52,104,156]),exp:G.w+8});}}
    c.offers=c.offers.slice(-4);
  }
}
function acceptOffer(G,c,id){const o=c.offers.find(x=>x.id===id);if(!o)return;c.offers=c.offers.filter(x=>x!==o);
  c.contracts.push({...o});log(G,o.type==='fwd'?`Vente à terme signée : ${num(o.qty)} t de ${GOODS[o.good].name.toLowerCase()} à ${o.price} €/t, livraison semaine ${o.due}.`:`Contrat signé avec ${o.client} : ${num(o.mwh)} MWh/sem. à ${o.price} €/MWh pendant ${o.weeks} sem.`);}

/* ---------- player actions ---------- */
function canAfford(c,amt){return c.cash-amt>=-odLimit(c)*0.5;}
function buyTile(G,c,t){const T=TERRAIN[t.ter];if(t.owner||!T.buy||!reachable(G,c,t)||!canAfford(c,T.buy))return false;
  c.cash-=T.buy;t.owner=c.id;t.lease=false;t.price=T.buy;if(c.sector==='agri'&&(t.ter==='plaine'||t.ter==='colline'))t.parcel={plan:null,crop:null};
  log(G,`Achat d’une parcelle (${T.name.toLowerCase()}) : ${eur(T.buy)}.`);return true;}
function leaseTile(G,c,t){const T=TERRAIN[t.ter];if(t.owner||!T.lease||!reachable(G,c,t))return false;
  t.owner=c.id;t.lease=true;t.price=0;if(c.sector==='agri'&&(t.ter==='plaine'||t.ter==='colline'))t.parcel={plan:null,crop:null};
  log(G,`Bail signé sur une parcelle : ${eur(T.lease)} par an.`);return true;}
function releaseTile(G,c,t){if(t.owner!==c.id||t.asset)return false;
  if(t.lease){log(G,'Bail résilié.');}else{const v=t.price*0.95;c.cash+=v;log(G,`Terrain vendu : ${eur(v)}.`);}
  t.owner=null;t.lease=false;t.price=0;t.parcel=null;t.irrig=false;return true;}
function buildAsset(G,c,t,type,finance){
  const A=ASSETS[type];if(t.owner!==c.id||t.asset||!A.tiles.includes(t.ter))return false;
  if(A.coast&&!coastal(G,t))return false;
  if(A.req&&!c.rd.done[A.req])return false;
  if(t.parcel&&t.parcel.crop)return false;
  const loanAmt=finance?projectLoanMax(G,c,A.cost,A.fin):0,cashNeed=(A.cost-loanAmt)*1.2;
  if(!canAfford(c,cashNeed))return false;
  c.cash-=cashNeed;c.tva-=(A.cost-loanAmt)*0.2;
  if(loanAmt>0)c.loans.push({...mkLoan(`Financement ${A.name.toLowerCase()}`,loanAmt,rateFor(G,c,'project'),c.sector==='elec'?180:120,G.w+A.build),kind:'project'});
  t.asset={type,built:false,prog:0,cond:1,down:0,age:0,cost:A.cost};t.parcel=null;
  log(G,`Chantier lancé : ${A.name} (${A.build} semaines).`);return true;
}
function irrigate(G,c,t){if(t.owner!==c.id||!t.parcel||t.irrig||!canAfford(c,33600))return false;c.cash-=28000*1.2;c.tva-=5600;t.irrig=true;
  t.irrigCost=28000;log(G,'Irrigation installée.');return true;}
function renovate(G,c,t){const a=t.asset;if(!a||a.type==='hq')return false;const cost=a.cost*c.fx.renov;if(!canAfford(c,cost*1.2))return false;
  c.cash-=cost*1.2;c.tva-=cost*0.2;a.cond=1;a.age=0;a.cost=cost/c.fx.renov;a.down=Math.max(a.down,4);log(G,`Rénovation : ${ASSETS[a.type].name} (${eur(cost)}).`);return true;}
function demolish(G,c,t){const a=t.asset;if(!a||a.type==='hq')return false;
  const book=assetBook(a);plAdd(G,c,'autres',book);t.asset=null;if(c.sector==='agri'&&(t.ter==='plaine'||t.ter==='colline'))t.parcel={plan:null,crop:null};
  log(G,`${ASSETS[a.type].name} démolie. Valeur restante passée en charge : ${eur(book)}.`);return true;}
function projectLoanMax(G,c,cost,share){const room=0.75*(assetsBook(G,c)+landValue(G,c)+cost)-debt(c);return Math.max(0,Math.min(cost*share,Math.floor(room/1000)*1000));}
function buyTractor(G,c,finance){const loan=finance?projectLoanMax(G,c,TRACTOR.cost,0.7):0,need=(TRACTOR.cost-loan)*1.2;if(!canAfford(c,need))return false;
  c.cash-=need;c.tva-=(TRACTOR.cost-loan)*0.2;if(loan)c.loans.push({...mkLoan('Financement tracteur',loan,rateFor(G,c,'project'),60,G.w),kind:'project'});
  c.fleet.push({cost:TRACTOR.cost,age:0,cond:1,down:0});log(G,'Nouveau tracteur.');return true;}
function sellTractor(G,c){if(!c.fleet.length)return false;const f=c.fleet.sort((a,b)=>a.cond-b.cond).shift();const v=f.cost*Math.max(0.1,1-f.age/(TRACTOR.life*52))*0.7;c.cash+=v;log(G,`Tracteur revendu : ${eur(v)}.`);return true;}
function hire(G,c,r){const R=ROLES[r];const pend=c.pending.filter(p=>p.role===r).length;
  if(R.max&&c.staff[r]+pend>=R.max)return false;if(r==='daf'&&!has(c,'comptable'))return false;if(!canAfford(c,2000))return false;
  c.cash-=2000;plAdd(G,c,'autres',2000);
  c.pending.push({role:r,weeks:Math.max(1,(has(c,'rh')?1:3)-(c.profile==='manager'?1:0))});return true;}
function fire(G,c,r){const pi=c.pending.findIndex(p=>p.role===r);if(pi>=0){c.pending.splice(pi,1);return true;}
  if(c.staff[r]<=0)return false;if(r==='comptable'&&c.staff.comptable===1&&has(c,'daf'))return false;
  c.staff[r]--;const sev=ROLES[r].sal*CHARGES;c.cash-=sev;plAdd(G,c,'perso',sev);c.layoffHit+=8;
  log(G,`Licenciement d’un ${ROLES[r].name.toLowerCase()} (indemnité ${eur(sev)}).`);return true;}
function takeLoan(G,c,amt,months){if(amt<=0||amt>loanCapacity(G,c))return false;
  c.loans.push({...mkLoan(`Prêt bancaire ${months/12} ans`,amt,rateFor(G,c,'classic'),months,G.w),kind:'classic'});c.cash+=amt;
  log(G,`Prêt obtenu : ${eur(amt)} sur ${months/12} ans à ${pct(rateFor(G,c,'classic'),1)}.`);return true;}
function factoring(G,c){if(!has(c,'daf'))return 0;const tot=c.recv.reduce((a,r)=>a+r.amt,0);if(tot<=0)return 0;
  const fee=tot*0.03;c.cash+=tot-fee;plAdd(G,c,'interets',fee);c.recv=[];log(G,`Affacturage : ${eur(tot-fee)} encaissés tout de suite (frais ${eur(fee)}).`);return tot;}

/* ---------- forecast ---------- */
function forecast(G,c,weeks=12){
  const out=[];let bal=c.cash;const isC=has(c,'comptable');
  for(let k=1;k<=weeks;k++){const w=G.w+k;const ev=[];let inn=0,o=0;
    for(const r of c.recv)if(r.due===w)inn+=r.amt*(isC?0.97:0.88);
    for(const p of c.pay)if(p.due===w)o+=p.amt;
    if(monthOf(w)!==monthOf(w-1)){const pr=payroll(c);o+=pr;ev.push(['Salaires et charges',pr]);
      const rent=rentMonthly(G,c);if(rent){o+=rent;ev.push(['Fermages',rent]);}
      const lp=c.loans.filter(l=>l.start<=w&&l.left>0).reduce((a,l)=>a+l.pay,0);if(lp){o+=lp;ev.push(['Échéances de prêts',lp]);}
      if(c.insured){const ins=insurancePremium(G,c);o+=ins;ev.push(['Assurance',ins]);}}
    if(w%13===0){o+=c.tva;ev.push([c.tva>=0?'TVA trimestrielle':'Remboursement de TVA',c.tva]);}
    if(c.isDue&&c.isDue.week===w&&c.isDue.amt>0){o+=c.isDue.amt;ev.push(['Impôt sur les sociétés',c.isDue.amt]);}
    if(c.sector==='agri'&&w%52===42){const amt=owned(G,c).filter(t=>t.parcel).length*5000;inn+=amt;ev.push(['Aides PAC',-amt]);}
    bal+=inn-o;out.push({w,inn,out:o,bal,ev});}
  return out;
}
function bilan(G,c){
  const terr=landValue(G,c),inst=assetsBook(G,c);
  const stocks=Object.entries(c.stock).reduce((a,[g,q])=>a+q*G.px[g]*0.9,0);
  const cre=c.recv.reduce((a,r)=>a+r.amt,0)+(c.tva<0?-c.tva:0);
  const treso=Math.max(0,c.cash);
  const emp=debt(c),fou=c.pay.reduce((a,p)=>a+p.amt,0),fisc=Math.max(0,c.tva)+(c.isDue?c.isDue.amt:0),dec=Math.max(0,-c.cash);
  const actif=terr+inst+stocks+cre+treso;const cp=actif-emp-fou-fisc-dec;
  return{terr,inst,stocks,cre,treso,actif,emp,fou,fisc,dec,cp};
}
function lastYearEbe(G,c){const y=yearOf(G.w)-1;return c.pl[y]?plCalc(c.pl[y]).ebe:0;}
function valuation(G,c){const b=bilan(G,c);return Math.max(0,b.cp+5*Math.max(0,lastYearEbe(G,c)));}

/* ---------- events ---------- */
const anyCrop=(G,c,id)=>owned(G,c).filter(t=>t.parcel&&t.parcel.crop&&(!id||t.parcel.crop.id===id));
const building=(G,c)=>owned(G,c).filter(t=>t.asset&&!t.asset.built);
const ofType=(G,c,ty)=>owned(G,c).filter(t=>t.asset&&t.asset.type===ty&&t.asset.built);
const EVENTS=[
  {id:'fisc',t:'Contrôle fiscal',b:c=>has(c,'comptable')?'Un inspecteur des impôts épluche tes comptes. Ton comptable a tout préparé.':'Un inspecteur des impôts épluche tes comptes. Personne n’a vraiment tenu les livres.',
    ch:[{l:'Ouvrir les classeurs',f:c=>has(c,'comptable')?'Aucune conséquence':'Redressement probable : environ 4 % du CA',a:(G,c)=>{
      if(has(c,'comptable')){log(G,'Contrôle fiscal clos sans rectification.','good');return;}
      const amt=Math.max(8000,(PL(c,yearOf(G.w)).ca+PL(c,yearOf(G.w)-1).ca)*0.04);c.cash-=amt;plAdd(G,c,'autres',amt);log(G,`Redressement fiscal : ${eur(amt)}.`,'bad');}}]},
  {id:'demission',cond:(G,c)=>staffTotal(c)>=3,t:'Un pilier de l’équipe veut partir',b:'Un concurrent lui propose 25 % de plus. Il te prévient par correction, avant de signer.',
    ch:[{l:'Faire une contre-offre',f:'−9 k€',a:(G,c)=>{c.cash-=9000;plAdd(G,c,'perso',9000);}},
        {l:'Le laisser partir',f:'Un départ dans le métier le plus représenté · moral −6',a:(G,c)=>{const r=Object.keys(c.staff).sort((a,b)=>c.staff[b]-c.staff[a])[0];if(c.staff[r]>0)c.staff[r]--;c.layoffHit+=6;}}]},
  {id:'greve',cond:(G,c)=>c.morale<50&&staffTotal(c)>=2,t:'Les équipes menacent de faire grève',b:'Charge de travail, salaires : la coupe est pleine. Un préavis est posé pour lundi.',
    ch:[{l:'Négocier une hausse de 5 %',f:'Politique salariale +5 % · moral +15',a:(G,c)=>{c.payPolicy=Math.min(0.3,c.payPolicy+0.05);c.morale+=15;}},
        {l:'Tenir bon',f:'Production −50 % pendant 2 semaines · moral −10',a:(G,c)=>{c.mods.push({key:'prod',val:-0.5,weeks:2});c.layoffHit+=10;}}]},
  {id:'taux',t:'La banque centrale remonte ses taux',b:'Les nouveaux crédits vont coûter plus cher. Les prêts déjà signés ne bougent pas.',
    ch:[{l:'Noté',f:'Taux de base +1 pt',a:G=>{G.rate=Math.min(8,G.rate+1);}}]},
  {id:'subvention',t:'Appel à projets de la région',b:'La région finance la modernisation des entreprises locales. Le dossier fait 80 pages.',
    ch:[{l:'Monter le dossier',f:c=>has(c,'comptable')?'+60 k€ de subvention':'40 % de chances de +60 k€, sinon 5 k€ de frais perdus',a:(G,c)=>{
      if(has(c,'comptable')||Math.random()<0.4){c.cash+=60000;plAdd(G,c,'subv',60000);log(G,'Subvention régionale obtenue : 60 k€.','good');}
      else{c.cash-=5000;plAdd(G,c,'autres',5000);log(G,'Dossier de subvention refusé.','bad');}}},
        {l:'Pas le temps',f:'Rien ne change',a:()=>{}}]},
  {id:'audit',t:'Un cabinet propose un audit technique',b:'Trois consultants, deux semaines sur le terrain, un rapport plein d’idées.',
    ch:[{l:'Accepter',f:'−20 k€ · +15 points de R&D',a:(G,c)=>{c.cash-=20000;plAdd(G,c,'autres',20000);if(c.rd.cur)c.rd.cur.prog+=15;else c.rd.bank+=15;}},
        {l:'Décliner',f:'Rien ne change',a:()=>{}}]},
  // agriculture
  {id:'grele',sec:'agri',cond:(G,c)=>anyCrop(G,c).length>0,t:'Orage de grêle',b:'Des grêlons gros comme des noix sont tombés sur une de tes parcelles en culture.',
    ch:[{l:'Constater les dégâts',f:c=>c.insured?'Culture perdue, l’assurance rembourse 80 %':'Culture perdue',a:(G,c)=>{const t=pick(anyCrop(G,c));const C=CROPS[t.parcel.crop.id];
      if(c.insured){const v=C.yield*G.px[t.parcel.crop.id]*0.8;c.cash+=v;plAdd(G,c,'subv',v);log(G,`Grêle : l’assurance verse ${eur(v)}.`);}else log(G,`Grêle : ${C.name.toLowerCase()} détruit sur une parcelle.`,'bad');
      fx(G,t,'Grêle','#ff7d6b');t.parcel.crop=null;}}]},
  {id:'voisin',sec:'agri',cond:(G,c)=>allTiles(G).some(t=>!t.owner&&t.ter==='plaine'&&reachable(G,c,t)),t:'Ton voisin part à la retraite',b:'Il préfère que ses terres restent travaillées par quelqu’un du coin.',
    ch:[{l:'Racheter ses terres (−30 %)',f:'Jusqu’à 3 parcelles à 77 k€',a:(G,c)=>{let n=0;for(const t of allTiles(G)){if(n>=3)break;if(!t.owner&&t.ter==='plaine'&&reachable(G,c,t)&&c.cash>77000){c.cash-=77000;t.owner=c.id;t.price=77000;t.parcel={plan:null,crop:null};n++;}}log(G,`${n} parcelle${n>1?'s':''} rachetée${n>1?'s':''} au voisin.`);}},
        {l:'Les prendre en fermage',f:'Jusqu’à 3 parcelles à 4,5 k€ par an',a:(G,c)=>{let n=0;for(const t of allTiles(G)){if(n>=3)break;if(!t.owner&&t.ter==='plaine'&&reachable(G,c,t)){leaseTile(G,c,t);n++;}}}},
        {l:'Décliner',f:'Rien ne change',a:()=>{}}]},
  {id:'cours',sec:'agri',t:'Flambée des cours mondiaux',b:'Une mauvaise récolte dans un grand pays exportateur fait grimper les prix des céréales.',
    ch:[{l:'Surveiller les prix',f:'Blé et maïs +40 % pendant environ 3 mois',a:G=>{G.shocks.push({good:'ble',mult:1.4,weeks:14},{good:'mais',mult:1.4,weeks:14});}}]},
  {id:'krach',sec:'agri',t:'Les cours s’effondrent',b:'Récolte record partout en Europe. Les silos débordent et les acheteurs se font prier.',
    ch:[{l:'Serrer les dents',f:'Blé, maïs et colza −25 % pendant environ 3 mois',a:G=>{G.shocks.push({good:'ble',mult:0.75,weeks:14},{good:'mais',mult:0.75,weeks:14},{good:'colza',mult:0.75,weeks:14});}}]},
  {id:'sangliers',sec:'agri',cond:(G,c)=>anyCrop(G,c,'mais').length>0||anyCrop(G,c,'legumes').length>0,t:'Les sangliers ont faim',b:'Une harde retourne tes cultures la nuit.',
    ch:[{l:'Poser des clôtures électriques',f:'−6 k€',a:(G,c)=>{c.cash-=6000;plAdd(G,c,'autres',6000);}},
        {l:'Laisser faire',f:'Une parcelle perd 40 % de son potentiel',a:(G,c)=>{const t=pick(anyCrop(G,c).filter(t=>['mais','legumes'].includes(t.parcel.crop.id)));if(t){t.parcel.crop.fs*=0.6;fx(G,t,'Sangliers','#ff7d6b');}}}]},
  // electricity
  {id:'tempete',sec:'elec',cond:(G,c)=>ofType(G,c,'eolienne').length>0,t:'Tempête sur le parc éolien',b:'Des rafales à 140 km/h. Une éolienne s’est mise en sécurité trop tard.',
    ch:[{l:'Lancer les réparations',f:c=>c.insured?'Arrêt 6 sem., réparation assurée à 80 %':'Arrêt 6 sem. et réparation à ta charge',a:(G,c)=>{breakAsset(G,c,pick(ofType(G,c,'eolienne')),0.05,6);}}]},
  {id:'froid',sec:'elec',cond:G=>seasonOf(G.w)===3,t:'Vague de froid',b:'Tous les radiateurs du pays tournent. Le prix de l’électricité s’envole.',
    ch:[{l:'Produire au maximum',f:'Électricité ×1,8 pendant 6 semaines',a:G=>{G.shocks.push({good:'elec',mult:1.8,weeks:6});}}]},
  {id:'negatif',sec:'elec',cond:G=>seasonOf(G.w)===1,t:'Prix négatifs en plein été',b:'Trop de solaire sur le réseau à midi. Les prix s’écroulent.',
    ch:[{l:'Subir',f:'Électricité ×0,5 pendant 4 semaines',a:G=>{G.shocks.push({good:'elec',mult:0.5,weeks:4});}}]},
  {id:'gaz',sec:'elec',t:'Tension sur le gaz',b:'Un gazoduc est fermé. Le gaz flambe et tire l’électricité avec lui.',
    ch:[{l:'Noté',f:'Gaz ×1,8 et électricité ×1,3 pendant 10 semaines',a:G=>{G.shocks.push({good:'gaz',mult:1.8,weeks:10},{good:'elec',mult:1.3,weeks:10});}}]},
  {id:'recours',sec:'elec',cond:(G,c)=>building(G,c).length>0,t:'Une association attaque ton chantier',b:'Recours devant le tribunal administratif contre ton projet en construction.',
    ch:[{l:'Prendre un avocat',f:'−40 k€ · chantier retardé de 4 semaines',a:(G,c)=>{c.cash-=40000;plAdd(G,c,'autres',40000);building(G,c).forEach(t=>t.asset.prog-=4);}},
        {l:'Attendre le jugement',f:'Chantier retardé de 12 semaines',a:(G,c)=>{building(G,c).forEach(t=>t.asset.prog-=12);}}]},
  {id:'raccord',sec:'elec',cond:(G,c)=>building(G,c).length>0,t:'Le réseau est saturé',b:'Le gestionnaire de réseau demande une contribution pour renforcer la ligne avant raccordement.',
    ch:[{l:'Payer la contribution',f:'−60 k€',a:(G,c)=>{c.cash-=60000;plAdd(G,c,'autres',60000);}},
        {l:'Attendre les travaux publics',f:'Chantier retardé de 10 semaines',a:(G,c)=>{building(G,c).forEach(t=>t.asset.prog-=10);}}]},
];
function pickEvent(G,c){
  const pool=EVENTS.filter(e=>e.id!==G.lastEvent&&(!e.sec||e.sec===c.sector)&&(!e.cond||e.cond(G,c)));
  const wp=pool.flatMap(e=>e.sec?[e,e]:[e]);return wp.length?pick(wp):null;
}

/* ---------- holding ---------- */
const HOLDING_MIN=1500000;
const SUB_MIN={agri:150000,elec:700000,peche:450000,eau:1800000};
function groupValue(G){return(G.holding?G.holding.cash:0)+G.cos.reduce((a,c)=>a+valuation(G,c),0);}
function canCreateHolding(G){return!G.holding&&valuation(G,G.cos[0])>=HOLDING_MIN;}
function createHolding(G,name){if(!canCreateHolding(G))return false;const c=G.cos[0];
  c.cash-=15000;plAdd(G,c,'autres',15000);G.holding={name:name||('Groupe '+c.name.split(' ').slice(-1)[0]),cash:0,divs:0};
  log(G,`Création de la holding ${G.holding.name}. ${c.name} devient sa première filiale.`,'gold');return true;}
function createSub(G,o){const H=G.holding;if(!H)return false;const min=SUB_MIN[o.sector];const cap=Math.max(min,o.capital||min);if(H.cash<cap)return false;
  H.cash-=cap;const c=newCompany(G,{...o,bare:true,capital:cap,profile:G.cos[0].profile,founder:G.cos[0].founder});G.cos.push(c);
  log(G,`Nouvelle filiale : ${c.name} (${SECTORS[o.sector].name.toLowerCase()}), capital ${eur(cap)}.`,'gold');return c;}
function dividend(G,c,amt){const H=G.holding;if(!H||amt<=0||amt>c.cash)return false;c.cash-=amt;const net=amt*0.9875;H.cash+=net;H.divs+=net;
  log(G,`${c.name} verse ${eur(amt)} de dividendes à la holding (${eur(net)} nets).`);return true;}
function apport(G,c,amt){const H=G.holding;if(!H||amt<=0||amt>H.cash)return false;H.cash-=amt;c.cash+=amt;log(G,`Apport de ${eur(amt)} de la holding à ${c.name}.`);return true;}
function liquidate(G,c){
  for(const t of owned(G,c)){t.owner=null;t.lease=false;t.price=0;t.asset=null;t.parcel=null;t.irrig=false;}
  const i=G.cos.indexOf(c);G.cos.splice(i,1);if(G.cur>=G.cos.length||G.cur===i)G.cur=0;
  log(G,`${c.name} est liquidée. Ses dettes disparaissent avec elle : responsabilité limitée. Ses terres retournent sur le marché.`,'bad');
}
function autopilot(G,c){
  const nd=needs(G,c);
  if(nd.cov<0.95&&!c.pending.some(p=>p.role===nd.main)&&c.cash>20000)hire(G,c,nd.main);
  if(c.sector==='agri'){
    if(nd.covT<0.9&&c.cash>150000)buyTractor(G,c,true);
    const s=seasonOf(G.w);
    for(const t of owned(G,c))if(t.parcel&&!t.parcel.crop&&!t.parcel.plan)t.parcel.plan=s===0?'tournesol':s===1?'colza':'ble';
    for(const g in c.stock)if(c.stock[g]>0&&G.px[g]>GOODS[g].base*1.05)sellStock(G,c,g,1);
  }
}
function fixup(G){ // after loading a save
  for(const c of G.cos){for(const r of rolesFor(c.sector))if(c.staff[r]==null)c.staff[r]=0;c.last=c.last||{};c.boats=c.boats||[];c.fishq=c.fishq||{};c.fishc=c.fishc||{};if(c.respectQ==null)c.respectQ=true;c.water=c.water||{leak:0.16};const b=baseFx();for(const k in b)if(c.fx[k]==null)c.fx[k]=b[k];}
  if(!G.fish)G.fish=Object.fromEntries(Object.entries(SPECIES).map(([k,S])=>[k,{B:S.K*0.8}]));
  if(G.holding===undefined)G.holding=null;G.fx=[];
}

/* ---------- fishing & water: data ---------- */
Object.assign(ASSETS,{
  port:{sec:'peche',name:'Port de pêche',cost:300000,build:8,life:40,opex:0.01,tiles:['plaine'],coast:true,fin:0.7,
    desc:'Abrite 4 bateaux. Doit toucher la mer.'},
  conserverie:{sec:'peche',name:'Conserverie',cost:600000,build:12,life:25,opex:0.02,tiles:['plaine','colline'],req:'conserve',fin:0.7,
    desc:'Met en boîte sardines et thons : +28 % sur leur valeur.'},
  forage:{sec:'eau',name:'Forage',cost:400000,build:6,life:30,opex:0.01,tiles:['plaine','colline'],m3:8000,fin:0.75,
    desc:'Pompe 8 000 m³ par semaine dans la nappe. Baisse en été et en saison sèche.'},
  prise:{sec:'eau',name:'Prise d’eau en rivière',cost:900000,build:10,life:40,opex:0.01,tiles:['riviere'],m3:25000,fin:0.75,
    desc:'25 000 m³ par semaine, selon le débit de la rivière.'},
  station:{sec:'eau',name:'Station de traitement',cost:1200000,build:12,life:30,opex:0.02,tiles:['plaine','colline'],treat:30000,fin:0.75,
    desc:'Rend potables 30 000 m³ par semaine. Sans station, l’eau captée ne se vend pas.'},
  dessal:{sec:'eau',name:'Usine de dessalement',cost:5000000,build:30,life:30,opex:0.02,tiles:['plaine'],coast:true,m3:40000,req:'dessal',fin:0.75,
    desc:'40 000 m³ d’eau potable tirés de la mer, insensible à la sécheresse mais très gourmande en électricité.'},
});
const SPECIES={
  sardine:{name:'Sardine',q:4,K:6000,r:0.012,season:[0.8,1.4,1,0.6]},
  merlu:{name:'Merlu',q:1.2,K:2500,r:0.006,season:[1,1,1.1,0.9]},
  bar:{name:'Bar',q:0.35,K:500,r:0.004,season:[1.2,0.8,1.2,0.7]},
  thon:{name:'Thon',q:1,K:8000,r:0.006,season:[0.6,1.4,1.2,0.4]},
};
const BOATS={
  fileyeur:{name:'Fileyeur',cost:120000,crew:2,cap:1,fuel:600,life:25,targets:['sardine','merlu','bar']},
  chalutier:{name:'Chalutier côtier',cost:380000,crew:4,cap:2.2,fuel:2500,life:25,targets:['sardine','merlu','bar']},
  thonier:{name:'Thonier hauturier',cost:1800000,crew:10,cap:8,fuel:12000,life:30,targets:['thon','merlu'],req:'hauturier'},
};
RD.peche={branches:['Navigation','Valorisation','Durabilité'],nodes:[
  {id:'sonar',br:0,name:'Sonar de pêche',cost:10,fx:'Prises +12 %',a:f=>{f.catch*=1.12}},
  {id:'moteurs',br:0,req:'sonar',name:'Moteurs sobres',cost:22,fx:'Carburant −25 %',a:f=>{f.fuel*=0.75}},
  {id:'hauturier',br:0,req:'moteurs',name:'Pêche hauturière',cost:40,fx:'Débloque le thonier',a:()=>{}},
  {id:'routage',br:0,req:'hauturier',name:'Routage météo',cost:60,fx:'Prises +10 %, sorties possibles par gros temps',a:f=>{f.catch*=1.1;f.stormOk=true}},
  {id:'label',br:1,name:'Label pêche durable',cost:14,fx:'Prix de vente +8 %',a:f=>{f.price*=1.08}},
  {id:'ligne',br:1,req:'label',name:'Vente directe aux restaurants',cost:26,fx:'Prix de vente +10 %',a:f=>{f.price*=1.1}},
  {id:'conserve',br:1,req:'ligne',name:'Conserverie',cost:42,fx:'Débloque la conserverie',a:()=>{}},
  {id:'marque',br:1,req:'conserve',name:'Marque de la Pointe',cost:62,fx:'Prix de vente +10 %',a:f=>{f.price*=1.1}},
  {id:'selectif',br:2,name:'Engins sélectifs',cost:12,fx:'Quotas +15 %',a:f=>{f.quota*=1.15}},
  {id:'repos',br:2,req:'selectif',name:'Repos biologique',cost:25,fx:'Les stocks de la région se reconstituent 20 % plus vite',a:()=>{}},
  {id:'aires',br:2,req:'repos',name:'Aires marines protégées',cost:45,fx:'Quotas +20 %',a:f=>{f.quota*=1.2}},
  {id:'observ',br:2,req:'aires',name:'Observateurs embarqués',cost:65,fx:'Quotas +25 %',a:f=>{f.quota*=1.25}},
],rep:{name:'Optimisation des campagnes',fx:'Prises +2 %',base:50,a:f=>{f.catch*=1.02}}};
RD.eau={branches:['Réseau','Traitement','Clients'],nodes:[
  {id:'sector',br:0,name:'Sectorisation du réseau',cost:10,fx:'Fuites −3 pts',a:f=>{f.leakFix+=0.03}},
  {id:'capteurs',br:0,req:'sector',name:'Capteurs acoustiques',cost:24,fx:'Fuites −4 pts, vieillissement du réseau ×0,5',a:f=>{f.leakFix+=0.04;f.leakGrowth*=0.5}},
  {id:'tele',br:0,req:'capteurs',name:'Télégestion',cost:40,fx:'Agents nécessaires −25 %',a:f=>{f.techReq*=0.75}},
  {id:'iaw',br:0,req:'tele',name:'Détection de fuites par IA',cost:60,fx:'Fuites −4 pts, pannes −40 %',a:f=>{f.leakFix+=0.04;f.breakMult*=0.6}},
  {id:'membranes',br:1,name:'Membranes d’ultrafiltration',cost:12,fx:'Capacité de traitement +15 %',a:f=>{f.treat*=1.15}},
  {id:'uv',br:1,req:'membranes',name:'Désinfection UV',cost:26,fx:'Réactifs −40 %',a:f=>{f.chem*=0.6}},
  {id:'dessal',br:1,req:'uv',name:'Osmose inverse',cost:45,fx:'Débloque l’usine de dessalement',a:()=>{}},
  {id:'recup',br:1,req:'dessal',name:'Récupération d’énergie',cost:65,fx:'Électricité consommée −35 %',a:f=>{f.energyW*=0.65}},
  {id:'compteurs',br:2,name:'Compteurs communicants',cost:14,fx:'Prix de l’eau +5 %',a:f=>{f.wprice*=1.05}},
  {id:'tarif',br:2,req:'compteurs',name:'Tarification saisonnière',cost:28,fx:'Prix de l’eau +8 %',a:f=>{f.wprice*=1.08}},
  {id:'qualite',br:2,req:'tarif',name:'Certification qualité',cost:45,fx:'Satisfaction des villages en hausse plus rapide',a:f=>{f.sat+=1.5}},
  {id:'regie',br:2,req:'qualite',name:'Ingénierie de réseau',cost:65,fx:'Raccordements −40 %',a:f=>{f.connect*=0.6}},
],rep:{name:'Optimisation hydraulique',fx:'Capacité de traitement +2 %',base:50,a:f=>{f.treat*=1.02}}};
EVENTS.push(
  {id:'tempmer',sec:'peche',cond:(G,c)=>c.boats.length>0,t:'Avis de tempête en mer',b:'Creux de 6 mètres annoncés. Un bateau est resté dehors un peu trop longtemps.',
    ch:[{l:'Rentrer tout le monde',f:c=>c.insured?'Un bateau avarié 4 sem., réparation assurée':'Un bateau avarié 4 sem. et réparation à ta charge',a:(G,c)=>{const b=pick(c.boats);b.down=4;const rep=b.cost*0.06*(c.insured?0.2:1);purchase(G,c,rep,'autres');log(G,`Avarie de tempête : ${eur(rep)}.`,'bad');}}]},
  {id:'banc',sec:'peche',t:'Un énorme banc de sardines',b:'Les sondeurs sont saturés. Les anciens disent n’avoir rien vu de tel depuis vingt ans.',
    ch:[{l:'Envoyer toute la flotte',f:'Stock de sardines +25 %, cours de la sardine −15 % pendant 6 sem.',a:G=>{G.fish.sardine.B=Math.min(SPECIES.sardine.K,G.fish.sardine.B*1.25);G.shocks.push({good:'sardine',mult:0.85,weeks:6});}}]},
  {id:'gazole',sec:'peche',t:'Le gazole flambe',b:'Les raffineries tournent au ralenti. Le plein d’un chalutier coûte une fortune.',
    ch:[{l:'Serrer les dents',f:'Carburant ×1,6 pendant 10 semaines',a:G=>{G.shocks.push({good:'carburant',mult:1.6,weeks:10});}}]},
  {id:'controle',sec:'peche',cond:(G,c)=>!c.respectQ,t:'Contrôle des affaires maritimes',b:'Une vedette de contrôle accoste ton bateau et pèse les cales.',
    ch:[{l:'Ouvrir les cales',f:'Amende si tes prises dépassent tes quotas',a:(G,c)=>{let ex=0;for(const k in SPECIES)ex+=Math.max(0,(c.fishc[k]||0)-(c.fishq[k]||0))*G.px[k];
      if(ex>0){const f=ex*1.5;c.cash-=f;plAdd(G,c,'autres',f);log(G,`Contrôle en mer : amende de ${eur(f)}.`,'bad');}else log(G,'Contrôle en mer sans suite.','good');}}]},
  {id:'algues',sec:'peche',t:'Prolifération d’algues toxiques',b:'La préfecture interdit la pêche du bar pendant un mois et le stock en souffre.',
    ch:[{l:'Noté',f:'Stock de bar −25 %',a:G=>{G.fish.bar.B*=0.75;}}]},
  {id:'pollution',sec:'eau',cond:(G,c)=>servedVillages(G,c).length>0,t:'Pic de nitrates dans la nappe',b:'Les épandages agricoles ont dégradé l’eau brute. L’ARS surveille ta station de près.',
    ch:[{l:'Traitement renforcé',f:'−80 k€',a:(G,c)=>{c.cash-=80000;plAdd(G,c,'autres',80000);}},
        {l:'Couper l’eau une semaine',f:'Satisfaction des villages −25',a:(G,c)=>{servedVillages(G,c).forEach(v=>v.village.sat-=25);}}]},
  {id:'canicule',sec:'eau',cond:G=>seasonOf(G.w)===1,t:'Canicule',b:'38 °C pendant dix jours. Les piscines se remplissent, les jardins s’arrosent.',
    ch:[{l:'Tenir le réseau',f:'Demande en eau +40 % pendant 6 semaines',a:(G,c)=>{c.mods.push({key:'demand',val:0.4,weeks:6});}}]},
  {id:'casse',sec:'eau',cond:(G,c)=>servedVillages(G,c).length>0,t:'Rupture d’une canalisation principale',b:'Un geyser au milieu de la départementale. Les photos tournent sur les réseaux sociaux.',
    ch:[{l:'Réparer en urgence',f:'−60 k€',a:(G,c)=>{c.cash-=60000;plAdd(G,c,'autres',60000);}},
        {l:'Rafistoler',f:'Fuites +5 pts',a:(G,c)=>{c.water.leak+=0.05;}}]},
  {id:'mairie',sec:'eau',cond:(G,c)=>servedVillages(G,c).length>1,t:'Une mairie veut renégocier',b:'Le nouveau maire trouve l’eau trop chère et menace de passer en régie publique.',
    ch:[{l:'Baisser le prix de 5 %',f:'Prix de l’eau −5 %',a:(G,c)=>{c.fx.wprice*=0.95;}},
        {l:'Tenir bon',f:'Satisfaction de ce village −30',a:(G,c)=>{const v=pick(servedVillages(G,c));v.village.sat-=30;}}]},
);

/* ---------- fishing ---------- */
function mkBoat(type,target,cond=1){return{type,target,cond,down:0,age:cond<1?Math.round((1-cond)*BOATS[type].life*52):0,cost:BOATS[type].cost};}
const msyYear=k=>SPECIES[k].r*SPECIES[k].K/4*52;
function fishRegrow(G){
  if(!G.fish)return;
  const regen=G.cos.some(c=>c.rd&&c.rd.done&&c.rd.done.repos)?1.2:1;
  for(const k in SPECIES){const S=SPECIES[k],f=G.fish[k];
    f.B+=S.r*regen*f.B*(1-f.B/S.K)-0.25*S.r*S.K/4*(f.B/S.K);f.B=clamp(f.B,S.K*0.03,S.K);}
}
function quotaFor(G,c,k){const f=G.fish[k],S=SPECIES[k];return Math.round(msyYear(k)*0.35*clamp(f.B/(0.5*S.K),0.25,1.4)*c.fx.quota);}
const portCap=(G,c)=>owned(G,c).filter(t=>t.asset&&t.asset.type==='port'&&t.asset.built).length*4;
function fishWeek(G,c,nd){
  const s=seasonOf(G.w),W=G.weather,y=yearOf(G.w);
  if(c.fishYear!==y){c.fishYear=y;c.fishc={};for(const k in SPECIES)c.fishq[k]=quotaFor(G,c,k);}
  const patrons=Math.min(3,c.staff.patron||0);
  const storm=!!W.storm&&!c.fx.stormOk;
  const cons=owned(G,c).some(t=>t.asset&&t.asset.type==='conserverie'&&t.asset.built&&!t.asset.down);
  let rev=0,fuel=0;const catchT={};
  c.last.storm=storm;
  for(const b of c.boats){const B=BOATS[b.type];b.lastCatch=0;b.atSea=false;
    if(b.down||!b.target||storm)continue;
    const k=b.target,S=SPECIES[k],f=G.fish[k];
    let t=B.cap*S.q*Math.pow(f.B/S.K,0.7)*S.season[s]*(W.id==='venteuse'&&!c.fx.stormOk?0.6:1)*nd.cov*prodMult(c)*c.fx.catch*(1+0.08*patrons)*(0.7+0.3*b.cond)*rand(0.8,1.2);
    if(c.respectQ){const left=Math.max(0,(c.fishq[k]||0)-(c.fishc[k]||0));t=Math.min(t,left);}
    if(t<=0)continue;
    b.atSea=true;f.B=Math.max(S.K*0.02,f.B-t);c.fishc[k]=(c.fishc[k]||0)+t;b.lastCatch=t;catchT[k]=(catchT[k]||0)+t;
    fuel+=B.fuel*G.px.carburant/100*c.fx.fuel;
    let v=t*G.px[k]*c.fx.price;if(cons&&(k==='sardine'||k==='thon'))v*=1.28;rev+=v;}
  if(fuel)purchase(G,c,fuel,'achats');
  if(rev){sale(G,c,rev,1);const port=owned(G,c).find(t=>t.asset&&t.asset.type==='port');if(port&&Math.random()<0.35)fx(G,port,'+'+eur(rev),'#9fd0e8');}
  c.last.catch=catchT;c.last.fishRev=rev;c.stats.fish=(c.stats.fish||0)+Object.values(catchT).reduce((a,b)=>a+b,0);
  if(G.w%52===51&&!c.respectQ){let fine=0;for(const k in SPECIES){const ex=(c.fishc[k]||0)-(c.fishq[k]||0);if(ex>0)fine+=ex*G.px[k]*2;}
    if(fine>0){c.cash-=fine;plAdd(G,c,'autres',fine);log(G,`Dépassement de quotas constaté : amende de ${eur(fine)}.`,'bad');}}
}
function buyQuota(G,c,k){const add=Math.max(1,Math.round(quotaFor(G,c,k)*0.2));const cost=add*G.px[k]*0.25;if(!canAfford(c,cost))return false;
  c.cash-=cost;plAdd(G,c,'autres',cost);c.fishq[k]=(c.fishq[k]||0)+add;log(G,`Rachat de ${num(add)} t de quota de ${SPECIES[k].name.toLowerCase()} : ${eur(cost)}.`);return true;}
function buyBoat(G,c,type,finance){const B=BOATS[type];if(B.req&&!c.rd.done[B.req])return false;if(c.boats.length>=portCap(G,c))return false;
  const loan=finance?projectLoanMax(G,c,B.cost,0.7):0,need=(B.cost-loan)*1.2;if(!canAfford(c,need))return false;
  c.cash-=need;c.tva-=(B.cost-loan)*0.2;if(loan)c.loans.push({...mkLoan(`Financement ${B.name.toLowerCase()}`,loan,rateFor(G,c,'project'),96,G.w),kind:'project'});
  c.boats.push(mkBoat(type,B.targets[0]));log(G,`Nouveau bateau : ${B.name}.`,'good');return true;}
function sellBoat(G,c,i){const b=c.boats[i];if(!b)return false;const v=b.cost*Math.max(0.1,1-b.age/(BOATS[b.type].life*52))*0.7;c.cash+=v;c.boats.splice(i,1);log(G,`${BOATS[b.type].name} revendu : ${eur(v)}.`);return true;}

/* ---------- water ---------- */
const WATER_ASSETS=['forage','prise','station','dessal'];
const servedVillages=(G,c)=>allTiles(G).filter(t=>t.village&&t.village.sup===c.id);
const NAPPE_S=[1,0.75,0.95,1.1],DEMAND_S=[1,1.3,1,0.9];
const WATER_PRICE=2.2;
function connectCost(G,c,v){const src=owned(G,c).filter(t=>t.asset&&WATER_ASSETS.includes(t.asset.type));if(!src.length)return null;
  const d=Math.min(...src.map(t=>dist(t,v)));return Math.round(Math.max(1,d)*90000*c.fx.connect/1000)*1000;}
function signConcession(G,c,v){if(!v.village||v.village.sup)return false;const cost=connectCost(G,c,v);if(cost==null||!canAfford(c,cost*1.2))return false;
  if(!owned(G,c).some(t=>t.asset&&(t.asset.type==='station'||t.asset.type==='dessal')))return false;
  c.cash-=cost*1.2;c.tva-=cost*0.2;v.village.sup=c.id;v.village.end=G.w+52*12;v.village.sat=Math.max(v.village.sat,60);
  c.water.net=(c.water.net||0)+cost;
  log(G,`Concession signée pour 12 ans avec un village de ${nfmt.format(v.village.pop)} habitants. Raccordement : ${eur(cost)}.`,'good');fx(G,v,'Raccordé','#7cc8ff');return true;}
function renewNetwork(G,c){const vs=servedVillages(G,c).length;if(!vs)return false;const cost=vs*120000;if(!canAfford(c,cost*1.2))return false;
  c.cash-=cost*1.2;c.tva-=cost*0.2;c.water.net=(c.water.net||0)+cost;c.water.leak=Math.max(0.05,c.water.leak-0.06);log(G,`Canalisations renouvelées : ${eur(cost)}. Fuites ramenées à ${pct(c.water.leak)}.`,'good');return true;}
function waterCapacity(G,c){
  const s=seasonOf(G.w),W=G.weather;let raw=0,treat=0,des=0;
  for(const t of owned(G,c)){const a=t.asset;if(!a||!a.built||a.down)continue;const A=ASSETS[a.type];const cond=0.7+0.3*a.cond;
    if(a.type==='forage')raw+=A.m3*NAPPE_S[s]*(W.drought?0.7:1)*cond;
    else if(a.type==='prise')raw+=A.m3*clamp(WATER_S[s]*W.water,0.4,1.3)*cond;
    else if(a.type==='station')treat+=A.treat*c.fx.treat*cond;
    else if(a.type==='dessal')des+=A.m3*cond;}
  return{raw,treat,des,out:Math.min(raw,treat)+des};
}
function waterWeek(G,c,nd){
  const s=seasonOf(G.w),vs=servedVillages(G,c);
  const cap=waterCapacity(G,c);
  const run=(0.55+0.45*nd.cov)*prodMult(c);
  const produced=cap.out*run;
  const leak=clamp(c.water.leak-c.fx.leakFix,0.03,0.6);
  const avail=produced*(1-leak);
  const dm=1+c.mods.filter(m=>m.key==='demand').reduce((a,m)=>a+m.val,0);
  let demand=0;for(const v of vs)demand+=v.village.pop*1.05*DEMAND_S[s]*dm;
  const sold=Math.min(avail,demand),ratio=demand>0?sold/demand:1;
  const price=WATER_PRICE*c.fx.wprice;
  for(const v of vs){const V=v.village;V.sat=clamp(V.sat+(ratio>=0.98?1.5+c.fx.sat:-(1-ratio)*12),0,100);V.pop=Math.round(V.pop*1.0003);
    if(V.sat<40&&V.sat+ (1-ratio)*12>=40)log(G,'Un village menace de résilier sa concession : l’eau manque.','bad');
    if(V.sat<20){V.sup=null;log(G,'Un village résilie sa concession : trop de coupures d’eau.','bad');fx(G,v,'Concession perdue','#ff7d6b');}
    else if(G.w>=V.end){if(V.sat>=55){V.end=G.w+52*12;log(G,'Concession renouvelée pour 12 ans.','good');}else{V.sup=null;log(G,'La mairie ne renouvelle pas ta concession.','bad');}}}
  if(sold>0)sale(G,c,sold*price,8);
  // only what is actually needed gets pumped and treated
  const pumped=Math.min(produced,demand/(1-leak));
  const chem=pumped*0.15*c.fx.chem;
  const desShare=cap.out>0?cap.des/cap.out:0;
  const energyMWh=pumped*((1-desShare)*0.4+desShare*3.5)/1000*c.fx.energyW,energy=energyMWh*G.px.elec;
  purchase(G,c,chem,'achats');
  if(energy>0){const sup=G.cos.find(x=>x.sector==='elec'&&x!==c&&(x.last.mwh||0)>0);
    if(sup&&G.holding){purchase(G,c,energy*0.7,'achats');sale(G,sup,energy*0.7,4);c.last.intra=energy*0.3;}else{purchase(G,c,energy,'achats');c.last.intra=0;}}
  c.water.leak=Math.min(0.6,c.water.leak+0.0002*c.fx.leakGrowth);
  if(c.water.net)plAdd(G,c,'amort',c.water.net/(40*52));
  Object.assign(c.water,{prod:produced,sold,demand,avail,ratio,leakNow:leak,cap,pumped});
  if(ratio<0.9&&demand>0&&G.w%4===0)log(G,`Coupures d’eau : seulement ${pct(ratio)} de la demande servie.`,'bad');
}
