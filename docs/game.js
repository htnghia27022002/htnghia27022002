// Packet Runner — 3D mini game: walk the avatar through a server city and open project prototypes.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

const host = document.getElementById('game');
const canvas = document.getElementById('gl');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const C = { blue:0x3b82f6, sky:0x60a5fa, ice:0x93c5fd, white:0xf5f6f8, milk:0xd8d4cb, cream:0xe7e3da, bg:0x05070d, red:0xf87171, green:0x34d399 };
const ZONES = [
  {id:'crm',    name:'Gaming CRM',     eye:'Zone 1 · Workflow',      icon:'⚙️', color:C.blue,  css:'#3b82f6', x:-30, z:-22,
   line:'Temporal workflows that survive failures + WebSocket fan-out to 10K+ players.', chips:['Go','Temporal','Kafka','NATS'],
   bullets:['Temporal workflow engine','WebSocket · 10K+ players','NATS + Kafka event stream']},
  {id:'tms',    name:'Logistics TMS',  eye:'Zone 2 · Logistics',     icon:'🚚', color:C.sky,   css:'#60a5fa', x: 30, z:-22,
   line:'Routing, dispatch and live GPS for 15+ enterprises. Cut costs 15–20%.', chips:['Go','PHP','WebSocket','GPS'],
   bullets:['Routing & dispatch','Live GPS from driver apps','−15–20% operating cost']},
  {id:'ticket', name:'Ticket Booking', eye:'Zone 3 · Concurrency',   icon:'🎟️', color:C.white, css:'#f5f6f8', x:-30, z: 24,
   line:'Redis locks keep seat sales correct when everyone clicks at once.', chips:['Go','Redis','Queue'],
   bullets:['Redis lock per seat','Zero double-booking','Peak-season traffic']},
  {id:'erp',    name:'Seafood ERP',    eye:'Zone 4 · Manufacturing', icon:'🐟', color:C.milk,  css:'#d8d4cb', x: 30, z: 24,
   line:'Batch traceability from intake to export, QC rework built in.', chips:['Laravel','MySQL','Docker'],
   bullets:['Batch traceability','QC → rework flow','Laravel + Docker']},
];
const BOUND = 62, ZONE_R = 10, GOAL = 12, WALK = 12, RUN = 22;

await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]);

let renderer;
try { renderer = new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:'high-performance'}); }
catch { host.classList.add('nogl'); }
if (renderer) start();

function start(){
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(C.bg);
  scene.fog = new THREE.FogExp2(C.bg, 0.011);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 400);
  camera.position.set(0, 20, 34);

  scene.add(new THREE.HemisphereLight(0xa8c4ff, 0x05070d, 1.5));
  const sun = new THREE.DirectionalLight(0xffffff, 1.8); sun.position.set(18, 40, 22); scene.add(sun);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), new THREE.MeshStandardMaterial({color:0x0a0d14, roughness:.95}));
  ground.rotation.x = -Math.PI/2; scene.add(ground);
  const g1 = new THREE.GridHelper(260, 130, 0x1a2436, 0x111827); g1.position.y = .01; scene.add(g1);
  const g2 = new THREE.GridHelper(260, 26, 0x2a4a7a, 0x2a4a7a); g2.position.y = .02; g2.material.transparent = true; g2.material.opacity = .4; scene.add(g2);

  const glow = (color, i=.9) => new THREE.MeshStandardMaterial({color, emissive:color, emissiveIntensity:i, roughness:.4, metalness:.2});
  const solid = (color, flat=false) => new THREE.MeshStandardMaterial({color, roughness:.7, metalness:.15, flatShading:flat});
  const box = (w,h,d,m) => new THREE.Mesh(new THREE.BoxGeometry(w,h,d), m);
  const at = (mesh, x, y, z) => (mesh.position.set(x, y, z), mesh);

  function textSprite(text, color, w=12, h=3, font='700 54px Unbounded, Segoe UI, sans-serif'){
    const c = document.createElement('canvas'); c.width = 512; c.height = 128;
    const x = c.getContext('2d');
    x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.shadowColor = color; x.shadowBlur = 24; x.fillStyle = color; x.fillText(text, 256, 66);
    x.shadowBlur = 0; x.fillStyle = '#ffffff'; x.globalAlpha = .92; x.fillText(text, 256, 66);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({map:tex, transparent:true, depthWrite:false}));
    s.scale.set(w, h, 1); return s;
  }
  function iconSprite(emoji, size=3.4){
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = 'rgba(11,17,32,.85)'; x.beginPath(); x.arc(128,128,112,0,7); x.fill();
    x.lineWidth = 8; x.strokeStyle = 'rgba(245,246,248,.8)'; x.stroke();
    x.font = '130px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(emoji, 128, 140);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({map:tex, transparent:true, depthWrite:false}));
    s.scale.set(size, size, 1); return s;
  }
  function billboard(z){
    const c = document.createElement('canvas'); c.width = 1024; c.height = 520;
    const x = c.getContext('2d');
    x.fillStyle = '#0b1120'; x.beginPath(); x.roundRect(8, 8, 1008, 504, 36); x.fill();
    x.lineWidth = 6; x.strokeStyle = z.css; x.stroke();
    x.fillStyle = z.css; x.font = '600 30px "JetBrains Mono", Consolas, monospace'; x.fillText(z.eye.toUpperCase(), 52, 82);
    x.fillStyle = '#f5f6f8'; x.font = '800 66px Unbounded, "Segoe UI", sans-serif'; x.fillText(z.name, 52, 168);
    x.font = '600 38px Manrope, "Segoe UI", sans-serif';
    z.bullets.forEach((b, i) => {
      x.fillStyle = z.css; x.beginPath(); x.arc(66, 246 + i*66, 9, 0, 7); x.fill();
      x.fillStyle = '#d8d4cb'; x.fillText(b, 92, 259 + i*66);
    });
    x.fillStyle = z.css; x.font = '700 30px Manrope, "Segoe UI", sans-serif'; x.fillText('Walk in · press E to open the prototype', 52, 472);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const g = new THREE.Group();
    const board = new THREE.Mesh(new THREE.PlaneGeometry(11, 5.6), new THREE.MeshBasicMaterial({map:tex, transparent:true}));
    board.position.y = 6.4; g.add(board);
    const back = box(11.3, 5.9, .25, solid(0x0e1422)); back.position.set(0, 6.4, -.15); g.add(back);
    for (const sx of [-4.6, 4.6]) g.add(at(box(.3, 3.6, .3, solid(0x1a2436)), sx, 1.9, -.15));
    return g;
  }

  /* ---------- hub ---------- */
  const hub = new THREE.Group();
  hub.add(at(new THREE.Mesh(new THREE.CylinderGeometry(5, 5, .8, 6), solid(0x141c2e)), 0, .4, 0));
  const hexRing = new THREE.Mesh(new THREE.TorusGeometry(5, .12, 8, 6), glow(C.ice, 1.2)); hexRing.rotation.x = Math.PI/2; hexRing.position.y = .85; hub.add(hexRing);
  const core = at(new THREE.Mesh(new THREE.OctahedronGeometry(1.4), glow(C.ice, 1)), 0, 3.4, 0); hub.add(core);
  const hubLabel = textSprite('API GATEWAY', '#93c5fd', 9.6, 2.4); hubLabel.position.y = 6; hub.add(hubLabel);
  scene.add(hub);

  /* ---------- roads + data packets ---------- */
  const flows = [];
  for (const z of ZONES){
    const len = Math.hypot(z.x, z.z);
    const road = box(len, .06, .7, glow(z.color, .3)); road.position.set(z.x/2, .05, z.z/2); road.rotation.y = -Math.atan2(z.z, z.x); scene.add(road);
    for (let i=0;i<4;i++){ const p = new THREE.Mesh(new THREE.SphereGeometry(.3, 12, 12), glow(z.color, 2)); scene.add(p); flows.push({p, z, t:i/4}); }
  }

  /* ---------- zones ---------- */
  const anim = [];
  const BUILD = {crm:buildCRM, tms:buildTMS, ticket:buildTicket, erp:buildERP};
  for (const z of ZONES){
    const g = new THREE.Group(); g.position.set(z.x, 0, z.z); scene.add(g);
    g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(ZONE_R, ZONE_R, .6, 56), solid(0x0e1422)), 0, .3, 0));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(ZONE_R, .14, 8, 72), glow(z.color, 1.3)); ring.rotation.x = Math.PI/2; ring.position.y = .62; g.add(ring);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(.5, 1.4, 34, 16, 1, true), new THREE.MeshBasicMaterial({color:z.color, transparent:true, opacity:.08, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide}));
    beam.position.set(0, 17, -7); g.add(beam);
    const bb = billboard(z); bb.position.z = -7; bb.scale.setScalar(1.25); g.add(bb);
    const icon = iconSprite(z.icon); icon.position.set(0, 13.4, -7); g.add(icon);
    anim.push(t => { icon.position.y = 13.4 + Math.sin(t*1.6 + z.x)*.3; });
    z.ring = ring; z.group = g;
    BUILD[z.id](g, z);
  }

  /* CRM: server racks with blinking LEDs, workflow nodes with a retrying step, WebSocket tower fanning out */
  function buildCRM(g, z){
    const leds = [];
    for (const [rx, rz] of [[-7.2,-2.6],[-7.2,0],[7.2,-2.6],[7.2,0]]){
      g.add(at(box(1.6, 3.4, 2.2, solid(0x111827)), rx, 2.3, rz));
      for (let i=0;i<6;i++){
        const l = at(box(.12, .14, .5, glow(C.sky, 1.5)), rx + (rx < 0 ? .82 : -.82), 1.2 + i*.48, rz);
        g.add(l); leds.push(l);
      }
    }
    const nodes = [];
    for (let i=0;i<5;i++){ const n = at(box(1.4, 1.4, 1.4, glow(z.color, .25)), -5 + i*2.5, 1.4, 4); g.add(n); nodes.push(n); }
    g.add(at(box(10, .1, .1, glow(z.color, .8)), 0, 1.4, 4));
    const pulse = new THREE.Mesh(new THREE.SphereGeometry(.4, 16, 16), glow(C.white, 2.5)); g.add(pulse);
    const tower = at(new THREE.Mesh(new THREE.CylinderGeometry(.35, .6, 4.5, 10), solid(0x18233a)), 0, 2.85, -1.5); g.add(tower);
    g.add(at(new THREE.Mesh(new THREE.SphereGeometry(.55, 16, 16), glow(C.sky, 2)), 0, 5.3, -1.5));
    const waves = [0,1,2].map(i => { const w = new THREE.Mesh(new THREE.TorusGeometry(1, .05, 6, 48), glow(C.sky, 2)); w.rotation.x = Math.PI/2; w.position.set(0, 5.3, -1.5); w.material.transparent = true; g.add(w); return {w, o:i/3}; });
    anim.push(t => {
      leds.forEach((l, i) => { l.material.emissiveIntensity = (Math.sin(t*8 + i*1.7) > .3) ? 2 : .2; });
      const k = (t*.3) % 1, x = -5 + k*10, failing = (t % 8) < 4;
      pulse.position.set(x, 1.4, 4);
      nodes.forEach((n, i) => {
        const near = Math.abs(x - (-5 + i*2.5)) < 1;
        const bad = near && i === 2 && failing && k < .52;
        n.material.emissive.setHex(bad ? C.red : near ? C.white : z.color);
        n.material.emissiveIntensity = near ? 2 : .25;
        n.rotation.y = t*.4 + i;
      });
      waves.forEach(({w, o}) => { const s = ((t*.5 + o) % 1); w.scale.setScalar(1 + s*5); w.material.opacity = 1 - s; });
    });
  }

  /* TMS: warehouse, loop road, trucks delivering to houses with bouncing pins */
  function buildTMS(g, z){
    g.add(at(box(4.2, 2.6, 3.2, solid(0x1a2a40)), 0, 1.9, -1.4));
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 4.4, 3), solid(0x2a4a7a, true)); roof.rotation.z = Math.PI/2; roof.rotation.x = Math.PI/6; roof.position.set(0, 3.6, -1.4); roof.scale.set(1, 1, .75); g.add(roof);
    g.add(at(box(1.8, 1.6, .05, glow(C.sky, .5)), 0, 1.4, .22));
    const road = new THREE.Mesh(new THREE.RingGeometry(5.6, 7, 64), solid(0x1f2a3d)); road.rotation.x = -Math.PI/2; road.position.y = .62; g.add(road);
    const dash = new THREE.Mesh(new THREE.TorusGeometry(6.3, .04, 4, 64), glow(C.cream, .6)); dash.rotation.x = Math.PI/2; dash.position.y = .64; g.add(dash);
    const pins = [];
    for (const a of [Math.PI*.15, Math.PI*.85, Math.PI*1.5]){
      const hx = Math.cos(a)*8.6, hz = Math.sin(a)*8.6;
      g.add(at(box(1.3, 1, 1.3, solid(0xd8d4cb)), hx, 1.1, hz));
      const rf = new THREE.Mesh(new THREE.ConeGeometry(1.1, .8, 4), solid(0x3b82f6, true)); rf.rotation.y = Math.PI/4; rf.position.set(hx, 2, hz); g.add(rf);
      const pin = new THREE.Group();
      pin.add(at(new THREE.Mesh(new THREE.SphereGeometry(.38, 12, 12), glow(C.sky, 1.5)), 0, .5, 0));
      const tip = new THREE.Mesh(new THREE.ConeGeometry(.3, .6, 12), glow(C.sky, 1.5)); tip.rotation.x = Math.PI; pin.add(tip);
      pin.position.set(hx, 3.2, hz); g.add(pin); pins.push({pin, a});
    }
    const trucks = [0,1,2].map(i => {
      const tr = new THREE.Group();
      tr.add(at(box(1.5, 1, .9, glow([C.sky, C.white, C.blue][i], .5)), -.2, .55, 0));
      tr.add(at(box(.6, .8, .85, solid(0xf5f6f8)), .85, .45, 0));
      for (const [wx, wz] of [[-.6,.45],[-.6,-.45],[.6,.45],[.6,-.45]]){ const w = new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.12,10), solid(0x111111)); w.rotation.x = Math.PI/2; w.position.set(wx, .18, wz); tr.add(w); }
      tr.position.y = .62; g.add(tr); return {tr, off:i*2.1, sp:.45 + i*.1};
    });
    anim.push(t => {
      trucks.forEach(o => { const a = t*o.sp + o.off; o.tr.position.x = Math.cos(a)*6.3; o.tr.position.z = Math.sin(a)*6.3; o.tr.rotation.y = -a - Math.PI/2; });
      pins.forEach(({pin, a}) => {
        const near = trucks.some(o => { const d = Math.abs(((t*o.sp + o.off) - a) % (Math.PI*2)); return d < .25 || d > Math.PI*2 - .25; });
        pin.position.y = 3.2 + (near ? .8 : Math.sin(t*2 + a)*.15);
        pin.children.forEach(c => c.material.emissive.setHex(near ? C.green : C.sky));
      });
    });
  }

  /* Ticket: stage + screen, tiered seats being booked, a floating Redis lock, a kiosk */
  function buildTicket(g, z){
    g.add(at(box(8.5, .9, 2.4, solid(0x18233a)), 0, 1, -4.2));
    const screen = at(box(6.5, 2.6, .15, glow(C.sky, .7)), 0, 3, -5.2); g.add(screen);
    const seats = [], palette = [0x1c2433, 0x3a4456, C.sky, C.blue];
    for (let r=0;r<4;r++){
      g.add(at(box(9.4, .4 + r*.45, 1.2, solid(0x111827)), 0, .6 + (.4 + r*.45)/2, -1 + r*1.3));
      for (let c=0;c<7;c++){
        const m = at(box(.8, .7, .7, glow(palette[Math.random()*4|0], .5)), -3.6 + c*1.2, 1.3 + r*.45, -1 + r*1.3);
        g.add(m); seats.push(m);
      }
    }
    const lock = new THREE.Group();
    lock.add(at(box(1.3, 1.05, .5, glow(C.white, .9)), 0, 0, 0));
    const shackle = new THREE.Mesh(new THREE.TorusGeometry(.42, .11, 8, 24, Math.PI), glow(C.cream, 1)); shackle.position.y = .5; lock.add(shackle);
    lock.add(at(box(.18, .35, .52, solid(0x05070d)), 0, -.05, 0));
    lock.position.set(0, 6.2, 0); g.add(lock);
    g.add(at(box(1.8, 2.2, 1.6, solid(0xf5f6f8)), 6.3, 1.7, 4));
    g.add(at(box(2.2, .25, 2, glow(C.blue, .8)), 6.3, 2.9, 4));
    let last = 0, raced = null, raceT = 0;
    anim.push(t => {
      lock.rotation.y = t*.8; lock.position.y = 6.2 + Math.sin(t*1.5)*.25;
      if (t - last > .3){ last = t; const s = seats[Math.random()*seats.length|0]; s.material.color.setHex(palette[Math.random()*4|0]); s.material.emissive.copy(s.material.color); }
      if (!raced && (t % 5) < .05){ raced = seats[Math.random()*seats.length|0]; raceT = t; }
      if (raced){
        const k = t - raceT;
        raced.material.emissive.setHex(k < .8 ? C.cream : C.green); raced.material.color.copy(raced.material.emissive);
        raced.material.emissiveIntensity = k < .8 ? 1.5 + Math.sin(k*30) : 1.2;
        lock.children[0].material.emissive.setHex(k < .8 ? C.cream : C.white);
        if (k > 1.6){ raced.material.emissiveIntensity = .5; raced = null; }
      }
    });
  }

  /* ERP: factory with smoke, cold storage, conveyor with crates passing a QC gate */
  function buildERP(g, z){
    g.add(at(box(5.5, 3.2, 3.6, solid(0x1a2a40)), -3.2, 2.2, -3));
    for (let i=0;i<3;i++){ const saw = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, 3.6, 3), solid(0x2a4a7a, true)); saw.rotation.x = Math.PI/2; saw.rotation.y = Math.PI/2; saw.rotation.z = Math.PI/2; saw.position.set(-5 + i*1.8, 4.1, -3); g.add(saw); }
    g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(.35, .45, 3.4, 10), solid(0x3a4456)), -1.2, 5.2, -4));
    const smoke = [0,1,2,3].map(i => { const s = new THREE.Mesh(new THREE.SphereGeometry(.5, 10, 10), new THREE.MeshStandardMaterial({color:0xd8d4cb, transparent:true, opacity:.5, roughness:1})); g.add(s); return {s, o:i/4}; });
    const cold = at(box(3.2, 2.8, 3, solid(0xf5f6f8)), 4, 2, -3); g.add(cold);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(cold.geometry), new THREE.LineBasicMaterial({color:C.sky})); edges.position.copy(cold.position); g.add(edges);
    const flake = textSprite('❄', '#60a5fa', 2.4, .6, '700 110px "Segoe UI Symbol", sans-serif'); flake.position.set(4, 4.2, -3); g.add(flake);
    g.add(at(box(15, .35, 1.8, solid(0x18233a)), 0, .95, 3.4));
    for (let i=0;i<10;i++){ const r = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, 1.8, 8), solid(0x3a4456)); r.rotation.x = Math.PI/2; r.position.set(-6.75 + i*1.5, .78, 3.4); g.add(r); }
    const gateMat = glow(C.sky, 1);
    for (const sx of [-1.1, 1.1]) g.add(at(box(.25, 2.6, .25, gateMat), sx, 2.1, 3.4));
    g.add(at(box(2.45, .25, .25, gateMat), 0, 3.4, 3.4));
    const crates = [0,1,2,3,4].map(i => { const c = box(1, .8, 1, glow(C.cream, .6)); g.add(c); return {c, i}; });
    anim.push(t => {
      let atGate = null;
      crates.forEach(({c, i}) => {
        const k = ((t*.1) + i/5) % 1, x = -7 + k*14; c.position.set(x, 1.55, 3.4);
        const passed = x > 0, fail = i === 3 && Math.floor(t*.1 + i/5) % 2 === 0;
        c.material.emissive.setHex(!passed ? C.cream : fail ? C.red : C.sky); c.material.color.copy(c.material.emissive);
        if (Math.abs(x) < .7) atGate = fail ? C.red : C.green;
      });
      gateMat.emissive.setHex(atGate ?? C.sky); gateMat.emissiveIntensity = atGate ? 2.4 : 1;
      smoke.forEach(({s, o}) => { const k = (t*.25 + o) % 1; s.position.set(-1.2 + Math.sin(k*4)*.4, 7 + k*4, -4); s.scale.setScalar(.6 + k*1.6); s.material.opacity = .45*(1 - k); });
    });
  }

  /* ---------- collectible events ---------- */
  const events = [], evGeo = new THREE.OctahedronGeometry(.7);
  function freeSpot(){
    for (let i=0;i<60;i++){
      const x = (Math.random()*2-1)*(BOUND-6), z = (Math.random()*2-1)*(BOUND-6);
      if (Math.hypot(x, z) < 9 || ZONES.some(q => Math.hypot(x-q.x, z-q.z) < ZONE_R + 3)) continue;
      return [x, z];
    }
    return [10, 10];
  }
  for (let i=0;i<GOAL;i++){ const m = new THREE.Mesh(evGeo, glow(C.cream, 1.4)); const [x,z] = freeSpot(); m.position.set(x, 1.8, z); m.userData.phase = Math.random()*6; scene.add(m); events.push(m); }

  const bursts = [];
  function burst(pos, color){
    const n = 24, geo = new THREE.BufferGeometry(), arr = new Float32Array(n*3), vel = [];
    for (let i=0;i<n;i++){ arr.set([pos.x, pos.y, pos.z], i*3); vel.push(new THREE.Vector3((Math.random()-.5)*12, Math.random()*10, (Math.random()-.5)*12)); }
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({color, size:.45, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false}));
    scene.add(pts); bursts.push({pts, vel, life:1});
  }

  /* ---------- the avatar: messy black hair, grey oversized tee, light-wash wide jeans, cream sneakers ---------- */
  const mat = c => new THREE.MeshStandardMaterial({color:c, roughness:.85, flatShading:true});
  const M = {skin:mat(0xd9a782), shirt:mat(0x9c9d9b), jeans:mat(0xaabdd2), shoe:mat(0xf0ebe0), sole:mat(0x9a948a), hair:mat(0x141414), dark:mat(0x1d1b1b)};
  const person = new THREE.Group(); person.scale.setScalar(1.45); scene.add(person);
  const hips = new THREE.Group(); hips.position.y = 1.7; person.add(hips);
  const legs = [-1, 1].map(side => {
    const leg = new THREE.Group(); leg.position.x = side*.24; hips.add(leg);
    leg.add(at(new THREE.Mesh(new THREE.CapsuleGeometry(.24, .55, 4, 8), M.jeans), 0, -.4, 0));
    const knee = new THREE.Group(); knee.position.y = -.82; leg.add(knee);
    knee.add(at(new THREE.Mesh(new THREE.CapsuleGeometry(.23, .45, 4, 8), M.jeans), 0, -.3, 0));
    knee.add(at(new THREE.Mesh(new THREE.CylinderGeometry(.26, .29, .28, 8), M.jeans), 0, -.6, 0));
    const foot = new THREE.Group(); foot.position.y = -.74; knee.add(foot);
    foot.add(at(box(.32, .22, .62, M.shoe), 0, 0, .1));
    foot.add(at(box(.34, .07, .66, M.sole), 0, -.13, .1));
    return {leg, knee, side};
  });
  const torso = new THREE.Group(); hips.add(torso);
  const shirt = new THREE.Mesh(new THREE.CylinderGeometry(.52, .6, 1.35, 10), M.shirt); shirt.scale.z = .64; shirt.position.y = .52; torso.add(shirt);
  torso.add(at(new THREE.Mesh(new THREE.CylinderGeometry(.13, .14, .22, 8), M.skin), 0, 1.28, 0));
  const head = new THREE.Group(); head.position.y = 1.6; torso.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(.36, 14, 12), M.skin); skull.scale.set(.95, 1.08, 1); head.add(skull);
  for (const s of [-1, 1]) head.add(at(new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 8), M.dark), s*.12, .03, .32));
  head.add(at(box(.13, .025, .03, M.dark), 0, -.15, .33));
  for (const s of [-1, 1]) head.add(at(new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 8), M.skin), s*.35, 0, 0));
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(.39, 14, 10, 0, Math.PI*2, 0, Math.PI*.55), M.hair); hairCap.position.y = .06; hairCap.rotation.x = -.15; head.add(hairCap);
  for (let i=0;i<14;i++){
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(.1 + Math.random()*.05, .18 + Math.random()*.1, 5), M.hair);
    const a = (i/14)*Math.PI*2, r = .22 + Math.random()*.08;
    tuft.position.set(Math.cos(a)*r, .36 + Math.random()*.06, Math.sin(a)*r*.9 - .02);
    tuft.rotation.set(Math.sin(a)*1.2 + (Math.random()-.5)*.5, 0, -Math.cos(a)*1.2 + (Math.random()-.5)*.5);
    head.add(tuft);
  }
  for (let i=0;i<5;i++){
    const fr = new THREE.Mesh(new THREE.ConeGeometry(.07, .26, 4), M.hair);
    fr.position.set(-.2 + i*.1, .2, .3); fr.rotation.set(2.3 + (Math.random()-.5)*.3, 0, (Math.random()-.5)*.5); head.add(fr);
  }
  const arms = [-1, 1].map(side => {
    const sh = new THREE.Group(); sh.position.set(side*.58, 1.08, 0); torso.add(sh);
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(.2, .25, .5, 8), M.shirt); sleeve.position.y = -.2; sh.add(sleeve);
    sh.add(at(new THREE.Mesh(new THREE.CapsuleGeometry(.11, .32, 4, 8), M.skin), 0, -.55, 0));
    const elbow = new THREE.Group(); elbow.position.y = -.75; sh.add(elbow);
    elbow.add(at(new THREE.Mesh(new THREE.CapsuleGeometry(.1, .32, 4, 8), M.skin), 0, -.25, 0));
    elbow.add(at(new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 8), M.skin), 0, -.5, 0));
    return {sh, elbow, side};
  });
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.9, 24), new THREE.MeshBasicMaterial({color:0x000000, transparent:true, opacity:.45, depthWrite:false}));
  shadow.rotation.x = -Math.PI/2; shadow.position.y = .03; scene.add(shadow);

  /* companion: the data packet orbiting the avatar */
  const packet = new THREE.Group();
  packet.add(new THREE.Mesh(new THREE.IcosahedronGeometry(.32, 1), glow(C.sky, 2)));
  const pRing = new THREE.Mesh(new THREE.TorusGeometry(.55, .04, 6, 32), glow(C.ice, 2)); packet.add(pRing);
  packet.add(new THREE.PointLight(C.sky, 6, 8, 2));
  scene.add(packet);

  person.position.set(0, 0, 12);


  const marker = new THREE.Mesh(new THREE.RingGeometry(.6, .9, 32), new THREE.MeshBasicMaterial({color:C.sky, transparent:true, opacity:.8, side:THREE.DoubleSide}));
  marker.rotation.x = -Math.PI/2; marker.position.y = .05; marker.visible = false; scene.add(marker);

  /* ---------- input ---------- */
  const keys = new Set(), vel = new THREE.Vector3();
  let target = null, inView = true, interacted = false;
  const typing = e => /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
  const dialogOpen = () => !!document.querySelector('dialog.proto[open]');
  addEventListener('keydown', e => {
    if (!inView || dialogOpen() || typing(e)) return;
    const k = e.key.toLowerCase();
    if (k === 'shift') keys.add('shift');
    if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){ keys.add(k); target = null; marker.visible = false; e.preventDefault(); firstMove(); }
    if ((k === 'e' || k === 'enter') && activeZone){ e.preventDefault(); openProto(activeZone.id); }
  });
  addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
  addEventListener('blur', () => keys.clear());
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0,1,0), 0), hit = new THREE.Vector3();
  canvas.addEventListener('pointerdown', e => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left)/r.width)*2 - 1, -((e.clientY - r.top)/r.height)*2 + 1);
    ray.setFromCamera(ndc, camera);
    if (ray.ray.intersectPlane(plane, hit)){
      target = new THREE.Vector3(THREE.MathUtils.clamp(hit.x, -BOUND, BOUND), 0, THREE.MathUtils.clamp(hit.z, -BOUND, BOUND));
      target.far = Math.hypot(target.x - person.position.x, target.z - person.position.z) > 20;
      marker.position.set(target.x, .05, target.z); marker.visible = true; firstMove();
    }
  });
  function firstMove(){ if (!interacted){ interacted = true; setTimeout(() => document.getElementById('hint').style.opacity = '.35', 2500); } }

  /* ---------- HUD ---------- */
  const card = document.getElementById('zoneCard'), scoreEl = document.getElementById('score'), toast = document.getElementById('toast');
  document.getElementById('zcOpen').addEventListener('click', () => activeZone && openProto(activeZone.id));
  let activeZone = null, score = 0;
  function setZone(z){
    if (z === activeZone) return;
    activeZone = z;
    if (!z){ card.classList.remove('show'); return; }
    card.style.setProperty('--zc', z.css);
    const eye = document.getElementById('zcEye'); eye.textContent = z.eye; eye.style.color = z.css;
    document.getElementById('zcTitle').textContent = z.name;
    document.getElementById('zcLine').textContent = z.line;
    document.getElementById('zcChips').innerHTML = z.chips.map(c => `<span class="chip">${c}</span>`).join('');
    card.classList.add('show');
  }
  function say(msg, ms=2200){ toast.textContent = msg; toast.classList.add('show'); clearTimeout(say.t); say.t = setTimeout(() => toast.classList.remove('show'), ms); }

  const mm = document.getElementById('minimap'), mx = mm.getContext('2d');
  function drawMinimap(){
    const W = mm.width, s = W/(BOUND*2+10), c = W/2;
    mx.clearRect(0,0,W,W);
    mx.strokeStyle = 'rgba(216,212,203,.15)'; mx.lineWidth = 2;
    for (const z of ZONES){ mx.beginPath(); mx.moveTo(c, c); mx.lineTo(c + z.x*s, c + z.z*s); mx.stroke(); }
    mx.fillStyle = '#93c5fd'; mx.beginPath(); mx.arc(c, c, 10, 0, 7); mx.fill();
    for (const z of ZONES){ mx.fillStyle = z.css + (z === activeZone ? 'ff' : '55'); mx.beginPath(); mx.arc(c + z.x*s, c + z.z*s, ZONE_R*s, 0, 7); mx.fill(); }
    mx.fillStyle = '#e7e3da';
    for (const e of events) if (e.visible){ mx.beginPath(); mx.arc(c + e.position.x*s, c + e.position.z*s, 4, 0, 7); mx.fill(); }
    const px = c + person.position.x*s, pz = c + person.position.z*s, h = person.rotation.y;
    mx.fillStyle = '#ffffff'; mx.beginPath();
    mx.moveTo(px + Math.sin(h)*12, pz + Math.cos(h)*12);
    mx.lineTo(px + Math.sin(h + 2.5)*9, pz + Math.cos(h + 2.5)*9);
    mx.lineTo(px + Math.sin(h - 2.5)*9, pz + Math.cos(h - 2.5)*9); mx.fill();
  }

  /* ---------- camera + resize ---------- */
  const camOff = new THREE.Vector3(0, 13, 17), camGoal = new THREE.Vector3(), look = new THREE.Vector3(0, 0, 12);
  function resize(){
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w/h;
    camera.fov = w < 600 ? 64 : w < 900 ? 56 : 48;
    camOff.set(0, w < 900 ? 15 : 13, w < 900 ? 20 : 17);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host); resize();
  new IntersectionObserver(es => { inView = es[0].isIntersecting; if (inView) loop(); }, {threshold:.15}).observe(host);

  /* ---------- loop ---------- */
  const clock = new THREE.Clock(); let running = false, t = 0, phase = 0;
  const lerpAngle = (a, b, k) => { let d = ((b - a + Math.PI) % (Math.PI*2)) - Math.PI; if (d < -Math.PI) d += Math.PI*2; return a + d*k; };
  say('Walk into a glowing zone to open a project', 3200);

  function loop(){ if (!running){ running = true; clock.getDelta(); requestAnimationFrame(tick); } }
  function tick(){
    if (!inView || document.hidden){ running = false; return; }
    const dt = Math.min(clock.getDelta(), .05); t += dt;

    /* movement */
    const acc = new THREE.Vector3();
    if (keys.has('w') || keys.has('arrowup')) acc.z -= 1;
    if (keys.has('s') || keys.has('arrowdown')) acc.z += 1;
    if (keys.has('a') || keys.has('arrowleft')) acc.x -= 1;
    if (keys.has('d') || keys.has('arrowright')) acc.x += 1;
    let running_ = keys.has('shift');
    if (acc.lengthSq() === 0 && target){
      const d = new THREE.Vector3(target.x - person.position.x, 0, target.z - person.position.z);
      if (d.length() > .6){ acc.copy(d.normalize()); running_ = target.far; } else { target = null; marker.visible = false; }
    }
    const maxSpeed = running_ ? RUN : WALK;
    if (acc.lengthSq()) acc.normalize().multiplyScalar(maxSpeed*5);
    vel.addScaledVector(acc, dt); vel.multiplyScalar(Math.pow(.02, dt));
    if (vel.length() > maxSpeed) vel.setLength(maxSpeed);
    person.position.addScaledVector(vel, dt);
    person.position.x = THREE.MathUtils.clamp(person.position.x, -BOUND, BOUND);
    person.position.z = THREE.MathUtils.clamp(person.position.z, -BOUND, BOUND);
    shadow.position.x = person.position.x; shadow.position.z = person.position.z;

    /* zones (needed for the look-up pose) */
    let near = null;
    for (const z of ZONES){
      const d = Math.hypot(person.position.x - z.x, person.position.z - z.z);
      if (d < ZONE_R + 1) near = z;
      z.ring.material.emissiveIntensity = z === near ? 3 + Math.sin(t*8) : 1.2;
    }
    setZone(near);

    /* avatar animation */
    const speed = vel.length(), s = Math.min(speed/WALK, 1.5), idle = 1 - Math.min(speed/2, 1);
    if (speed > .3) person.rotation.y = lerpAngle(person.rotation.y, Math.atan2(vel.x, vel.z), 1 - Math.pow(.0005, dt));
    else if (near) person.rotation.y = lerpAngle(person.rotation.y, Math.atan2(near.x - person.position.x, (near.z - 7) - person.position.z), 1 - Math.pow(.05, dt));
    phase += dt*(3 + speed*.55);
    const sw = Math.sin(phase);
    legs.forEach(({leg, knee, side}) => {
      leg.rotation.x = sw*side*.75*Math.min(s, 1.2);
      knee.rotation.x = Math.max(0, -Math.cos(phase)*side)*1.2*Math.min(s, 1.2) + .05;
    });
    arms.forEach(({sh, elbow, side}) => {
      const walkX = -sw*side*.7*Math.min(s, 1.2);
      sh.rotation.x = THREE.MathUtils.lerp(walkX, .45, idle);
      sh.rotation.z = THREE.MathUtils.lerp(side*.08, side*.28, idle);
      elbow.rotation.x = THREE.MathUtils.lerp(-.4 - s*.4, -.9, idle);
    });
    hips.position.y = 1.7 + Math.abs(sw)*.1*Math.min(s, 1.2) + Math.sin(t*2)*.015*idle;
    torso.rotation.x = .12*Math.min(s, 1.4);
    const lookUp = near && speed < 1 ? -.45 : 0;
    head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, lookUp, .06);
    head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, near ? 0 : Math.sin(t*.6)*.5*idle, .05);

    packet.position.set(person.position.x + Math.cos(t*2)*1.8, 4.6 + Math.sin(t*3)*.3, person.position.z + Math.sin(t*2)*1.6);
    packet.rotation.y += dt*2; pRing.rotation.x += dt*2;
    marker.scale.setScalar(1 + Math.sin(t*6)*.15);

    /* world */
    const wt = reduced ? t*.3 : t;
    anim.forEach(f => f(wt));
    core.rotation.y += dt; core.position.y = 3.4 + Math.sin(t*2)*.3;
    for (const f of flows){ f.t = (f.t + dt*.18) % 1; f.p.position.set(f.z.x*f.t, .45, f.z.z*f.t); }

    /* collectibles */
    for (const e of events){
      if (!e.visible) continue;
      e.rotation.y += dt*2; e.position.y = 1.8 + Math.sin(t*2 + e.userData.phase)*.35;
      if (Math.hypot(e.position.x - person.position.x, e.position.z - person.position.z) < 1.9){
        e.visible = false; score++; burst(e.position, C.cream);
        scoreEl.textContent = `Events processed ${score} / ${GOAL}`;
        if (score === GOAL){ say('All events processed · zero dropped messages', 3600); setTimeout(respawn, 4000); }
        else if (score === 1) say('+1 event consumed from Kafka', 1400);
      }
    }
    for (let i=bursts.length-1;i>=0;i--){
      const b = bursts[i], arr = b.pts.geometry.attributes.position.array;
      b.life -= dt*1.4;
      b.vel.forEach((v, k) => { v.y -= 18*dt; arr[k*3] += v.x*dt; arr[k*3+1] += v.y*dt; arr[k*3+2] += v.z*dt; });
      b.pts.geometry.attributes.position.needsUpdate = true; b.pts.material.opacity = Math.max(0, b.life);
      if (b.life <= 0){ scene.remove(b.pts); b.pts.geometry.dispose(); bursts.splice(i, 1); }
    }

    /* camera follows; pulls back a little when inside a zone so the whole diorama fits */
    camGoal.copy(person.position).add(camOff);
    if (near) camGoal.add(new THREE.Vector3(0, 4, 8));
    camera.position.lerp(camGoal, 1 - Math.pow(.003, dt));
    look.lerp(near ? new THREE.Vector3((person.position.x + near.x)/2, 4, near.z - 3) : new THREE.Vector3(person.position.x, 1.5, person.position.z), 1 - Math.pow(.004, dt));
    camera.lookAt(look);

    drawMinimap();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  function respawn(){
    score = 0; scoreEl.textContent = `Events processed 0 / ${GOAL}`;
    for (const e of events){ const [x,z] = freeSpot(); e.position.set(x, 1.8, z); e.visible = true; }
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && inView) loop(); });
  loop();
}
