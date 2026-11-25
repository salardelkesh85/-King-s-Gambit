'use strict';
const sprites = {};
for (const key of ['opponents','court','arena1','arena2','outpost','palace',...starters.map(id=>'piece-'+id)]) {
  const image = new Image();
  image.src = 'art/'+key+'.webp';
  sprites[key] = image;
}
sprites['piece-windcatcher']=new Image(); sprites['piece-windcatcher'].src='art/windcatcher.svg';
const W=18, H=32, bridges=[5,13], bank=1.35;
const clamp=(v,low,high)=>Math.max(low,Math.min(high,v));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function teamColor(team){return team?'#ff5261':'#35d9ff';}
let canvas, pen, drag, hudKey='', audioContext;
function sound(freq,duration=.09){
  if(!audioContext || audioContext.state!=='running')return;
  const oscillator=audioContext.createOscillator(), gain=audioContext.createGain();
  oscillator.type='triangle';oscillator.frequency.setValueAtTime(freq,audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(freq*.48,audioContext.currentTime+duration);
  gain.gain.setValueAtTime(.055,audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);
  oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start();oscillator.stop(audioContext.currentTime+duration);
}
function start(drill=false){
  try{audioContext ||= new AudioContext();audioContext.resume().catch(()=>{});}catch{}
  screen='Battle';drag=null;hudKey='';nav.style.display='none';
  bar.innerHTML='<button id="pause" aria-label="Pause">Ⅱ</button><span>ARENA AI</span><strong id="clock">3:00</strong><b id="crowns"></b>';
  main.innerHTML='<section class="battle"><div class="field"><canvas class="board" aria-label="Battle arena"></canvas></div><div class="command"><div class="handrow"><aside><small>NEXT</small><img id="next" alt="Next card"></aside><div id="hand"></div></div><div class="fuel"><b id="charge"></b><div class="track"><i></i></div><span id="rate"></span></div></div></section>';
  canvas=main.querySelector('canvas');pen=canvas.getContext('2d');
  const deck=drill?['windcatcher',...starters.slice(0,7)]:profile.deck.slice();
  const enemyDeck=['ram','guard','echo','windcatcher','scout','spark','falcon','warden'];
  fight={drill:drill===true, drillShots:new Set(), diverted:false,banked:0,arena:profile.arena,time:180,elapsed:0,overtime:false,last:0,paused:false,
    towers:[],units:[],effects:[],shots:[],mana:[5,5],hands:[deck.slice(0,4),enemyDeck.slice(0,4)],
    queues:[deck.slice(4),enemyDeck.slice(4)],slot:0,ai:2,seq:0,notice:'Drag a card onto your side',noticeUntil:4};
  for(const team of [0,1])for(const lane of [0,1,2]){
    const royal=lane===2,y=royal?5.4:8.4,max=royal?1180:760;
    fight.towers.push({team,lane,x:royal?9:bridges[lane],y:team?y:H-y,hp:max,max,cd:0,flash:0});
  }
  if(drill){
    play(1,0,{x:5.5,y:14.5});
    fight.ai=Infinity;fight.notice='Drop Windcatcher on the marked tile';fight.noticeUntil=6;
  }
  bar.querySelector('button').onclick=pauseBattle;
  for(let i=0;i<4;i++){
    const b=button('',()=>{} ,'card');b.dataset.slot=i;
    b.onpointerdown=e=>beginDrag(e,i);
    b.onclick=()=>{if(fight){fight.slot=i;hud();}};
    main.querySelector('#hand').append(b);
  }
  canvas.onpointerdown=e=>beginDrag(e,fight.slot);
  hudKey='';hud();frame=requestAnimationFrame(loop);
}
function point(e){
  const r=canvas.getBoundingClientRect();
  return {x:Math.floor((e.clientX-r.left)*W/r.width)+.5,y:Math.floor((e.clientY-r.top)*H/r.height)+.5};
}
function beginDrag(e,slot){
  if(!fight||fight.paused||drag)return;
  e.preventDefault();fight.slot=slot;drag={slot,id:e.pointerId,...point(e)};
  e.currentTarget.setPointerCapture(e.pointerId);hud();
}
window.addEventListener('pointermove',e=>{if(drag&&drag.id===e.pointerId)Object.assign(drag,point(e));});
window.addEventListener('pointerup',e=>{
  if(!drag||drag.id!==e.pointerId)return;
  const {slot}=drag;drag=null;if(!fight||fight.paused)return;
  const p=point(e);if(p.y>=0&&p.y<=H)play(0,slot,p);
});
window.addEventListener('pointercancel',()=>{drag=null;});
function legal(team,id,p){
  if(p.x<1.4||p.x>W-1.4||p.y<1||p.y>H-1)return false;
  if(isSpell(id))return true;
  const depth=team?H-p.y:p.y;
  const enemy=fight.towers.find(t=>t.team!==team&&t.lane===(p.x<9?0:1));
  if(depth<(enemy.hp<=0?12:17.5))return false;
  if(Math.abs(p.y-16)<bank)return false;
  if(fight.units.some(u=>u.hp>0&&u.id==='windcatcher'&&distance(u,p)<1.4))return false;
  if(id==='windcatcher'&&fight.units.some(u=>u.hp>0&&distance(u,p)<1))return false;
  return !fight.towers.some(t=>t.hp>0&&distance(t,p)<(t.lane===2?1.8:1.3));
}
function notice(message){fight.notice=message;fight.noticeUntil=fight.elapsed+1.6;}
function play(team,slot,p){
  const f=fight,id=f.hands[team][slot], [cost,hp,dmg,speed,range]=troops[id];
  p={x:Math.floor(p.x)+.5,y:Math.floor(p.y)+.5};
  if(!legal(team,id,p)){if(!team)notice('Choose an open deployment tile');return false;}
  if(f.mana[team]<cost){if(!team)notice('Need '+cost+' elixir');return false;}
  f.mana[team]-=cost;f.hands[team][slot]=f.queues[team].shift();f.queues[team].push(id);
  const level=team?1:profile.levels[id]||1;
  if(isSpell(id)){
    for(const target of [...f.units,...f.towers])if(target.team!==team&&target.hp>0&&distance(p,target)<3.1)hit(target,dmg*scale(level)*(target.lane===undefined?1:.45));
    burst(p,id==='storm'?'#b895ff':'#ff994e',3.1);
  }else{
    const offsets=id==='bandit'?[-.38,.38]:[0];
    for(const offset of offsets)f.units.push({id,team,x:p.x+offset,y:p.y,hp:hp*scale(level),max:hp*scale(level),dmg:dmg*scale(level),
      life:32,speed:speed*23,range:range*28,cd:.48,spawn:.55,moving:false,phase:f.seq++*1.9,flash:0,attack:0,bridge:p.x<9?5:13,face:team?-1:1});
    burst(p,teamColor(team),.9);
  }
  if(!team)sound(470);hud();return true;
}
function burst(p,color,radius){fight.effects.push({x:p.x,y:p.y,color,radius,life:.42,max:.42});}
function hit(t,damage){
  if(t.hp<=0)return;t.hp=Math.max(0,t.hp-damage);t.flash=.15;
  if(t.lane===2 || (t.lane!==undefined&&!t.hp))fight.towers.find(k=>k.team===t.team&&k.lane===2).awake=true;
  if(!t.hp){burst(t,t.lane===undefined?'#fff0a4':'#eea45e',t.lane===undefined?.8:2.7);if(t.lane!==undefined){sound(100,.36);notice('Tower down!');}}
}
function crowns(team){return fight.towers.filter(t=>t.team!==team&&t.hp<=0).length;}
function route(u,target){
  if(u.id==='falcon')return target;
  const side=u.team?1:-1;
  const near=16-side*(bank+.16), far=16+side*(bank+.16);
  if((target.y-16)*side>bank && (u.y-far)*side<0){
    if((u.y-near)*side<-.07)return {x:u.bridge,y:near};
    return {x:u.bridge,y:far};
  }
  // A defending troop may turn back toward a target across the water.
  if((u.y-16)*(target.y-16)<0&&Math.abs(u.x-u.bridge)>.7)return {x:u.bridge,y:u.y};
  return target;
}
function move(u,target,dt){
  const p=route(u,target),d=distance(u,p);if(d<.001)return;
  const step=Math.min(1,u.speed*dt/d);
  let dx=(p.x-u.x)*step,dy=(p.y-u.y)*step;
  for(const ally of fight.units){
    if(ally===u||ally.hp<=0||ally.team!==u.team)continue;
    const gap=distance(u,ally);if(gap>.01&&gap<.63){dx+=(u.x-ally.x)/gap*(.63-gap)*dt*3;dy+=(u.y-ally.y)/gap*(.63-gap)*dt*3;}
  }
  u.x=clamp(u.x+dx,1.2,16.8);u.y=clamp(u.y+dy,1,31);
  if(u.id!=='falcon'&&Math.abs(u.y-16)<=bank)u.x=clamp(u.x,u.bridge-.59,u.bridge+.59);
  if(Math.abs(dx)>.001)u.face=dx>0?1:-1;u.moving=true;
}
function attack(a,t){
  if(fight.drill&&a.team===0&&a.lane!==undefined&&t.id==='ram')fight.drillShots.add(a.lane);
  const ranged=!a.id||['spark','echo','warden','windcatcher'].includes(a.id);
  a.cd=tacticsFor(a).interval-tacticsFor(a).windup;a.attack=.23;
  if(ranged){
    fight.shots.push({x:a.x,y:a.y-.65,t,team:a.team,id:a.id||'tower',origin:a.lane,dmg:a.dmg||28});
  }else{hit(t,a.dmg);burst(t,'#fff2ab',.54);}
}
function tick(dt){
  const f=fight;f.elapsed+=dt;f.time-=dt;
  const mult=f.overtime||f.time<=60?2:1;
  for(const team of [0,1])f.mana[team]=Math.min(10,f.mana[team]+dt*mult/2.3);
  f.ai-=dt;
  if(f.ai<=0){aiTurn();f.ai=1;}
  for(const actor of [...f.towers,...f.units])combatStep(actor,dt);
  for(const s of f.shots){
    const d=distance(s,s.t),step=15*dt;
    if(d<=step){s.done=true;hit(s.t,s.dmg);
      if(s.id==='spark'||s.id==='echo')for(const u of f.units)if(u!==s.t&&u.team!==s.team&&distance(u,s.t)<1.5)hit(u,s.dmg*.5);
      burst(s.t,s.id==='spark'?'#ffb24c':'#a5f5ff',s.id==='spark'?1.4:.6);
    }else{s.x+=(s.t.x-s.x)*step/d;s.y+=(s.t.y-s.y)*step/d;}
  }
  f.units=f.units.filter(u=>u.hp>0);f.shots=f.shots.filter(s=>!s.done);
  f.effects.forEach(e=>e.life-=dt);f.effects=f.effects.filter(e=>e.life>0);
  if(f.drill&&!f.units.some(u=>u.team&&u.id==='ram'&&u.hp>0)){finish(0);return;}
  const result=crowns(0)-crowns(1);
  const deadKing=f.towers.find(t=>t.lane===2&&!t.hp);
  if(deadKing){finish(deadKing.team?1:-1);return;}
  if((f.overtime||f.time<=0)&&result){finish(Math.sign(result));return;}
  if(f.time<=0){if(f.overtime){const lowest=team=>Math.min(...f.towers.filter(t=>t.hp>0&&t.team===team).map(t=>t.hp));finish(Math.sign(lowest(0)-lowest(1)));}else{f.overtime=true;f.time=60;notice('Sudden death');}}
}
function hud(){
  const f=fight;if(!f)return;
  const seconds=Math.max(0,Math.ceil(f.time)), energy=Math.floor(f.mana[0]);
  const state=[seconds,energy,f.slot,...f.hands[0],crowns(0),crowns(1),f.overtime].join('|');
  main.querySelector('.track i').style.width=(10*f.mana[0])+'%';
  if(state===hudKey)return;hudKey=state;
  document.querySelector('#clock').textContent=(f.overtime?'+ ':'')+Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
  document.querySelector('#crowns').textContent='♛ '+crowns(0)+' – '+crowns(1);
  main.querySelector('#rate').textContent=(f.overtime||seconds<=60?'×2':'×1');
  main.querySelector('#charge').textContent='♦ '+energy;
  main.querySelector('#next').src=cardArt(f.queues[0][0]);
  main.querySelectorAll('#hand button').forEach((b,i)=>{
    const id=f.hands[0][i];
    if(b.dataset.id!==id){b.dataset.id=id;b.innerHTML='<img alt="" src="'+cardArt(id)+'"><b>'+troops[id][0]+'</b><span>'+names[id]+'</span>';}
    b.classList.toggle('active',i===f.slot);b.classList.toggle('low',troops[id][0]>f.mana[0]);
  });
}
function render(){
  const f=fight,r=canvas.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio);
  if(!r.width||!r.height)return;
  const w=r.width,h=r.height,px=w/W,py=h/H;
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
  const c=pen;c.setTransform(dpr,0,0,dpr,0,0);
  const ground=sprites[f.arena?'arena'+f.arena:'court'];
  if(ground.naturalWidth){
    if(f.arena){const gh=ground.height,gw=ground.width;c.drawImage(ground,0,gh*.25,gw,gh*.50,0,0,w,h);}
    else c.drawImage(ground,0,0,w,h);
  }else{c.fillStyle='#af8358';c.fillRect(0,0,w,h);}
  if(f.drill&&!f.units.some(u=>u.id==='windcatcher')){
    c.save();c.strokeStyle='#fff6ae';c.lineWidth=2;c.setLineDash([4,3]);c.strokeRect(8*px,21*py,px,py);c.restore();
  }
  if(drag){
    const id=f.hands[0][drag.slot];
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){
      const ok=legal(0,id,{x:x+.5,y:y+.5});c.fillStyle=ok?'#76f7ee20':'#bd183a40';c.fillRect(x*px,y*py,px-1,py-1);
    }
  }
  for(const o of [...f.units,...f.towers].sort((a,b)=>a.y-b.y)){
    const x=o.x*px,y=o.y*py,tower=o.lane!==undefined;
    if(o.hp<=0){
      c.fillStyle='#664736';c.beginPath();c.ellipse(x,y,px*1.12,py*.4,0,0,Math.PI*2);c.fill();
      for(let i=0;i<8;i++){c.fillStyle=i%2?'#a98560':'#d6ab7d';c.fillRect(x+Math.cos(i*3)*px*.88,y+Math.sin(i*3)*py*.18,px*.34,py*.23);}continue;
    }
    const sprite=sprites[tower?(o.lane===2?'palace':'outpost'):'piece-'+o.id];
    const unitSize=o.id==='guard'||o.id==='ram'?2.35:o.id==='bandit'?1.44:1.94;
    const width=px*(tower?(o.lane===2?4.1:2.65):unitSize),height=width*(sprite.naturalWidth?sprite.height/sprite.width:1);
    const phase=f.elapsed*10+o.phase;
    const bob=tower?0:(o.moving?Math.abs(Math.sin(phase))*px*.15:Math.sin(f.elapsed*3+o.phase)*px*.035);
    c.fillStyle='#29182359';c.beginPath();c.ellipse(x,y,width*.43,px*(tower?.43:.18),0,0,Math.PI*2);c.fill();
    c.strokeStyle=teamColor(o.team);c.lineWidth=tower?2:1.4;c.stroke();
    c.save();c.translate(x,y-bob-(o.id==='falcon'?px*.7:0));if(!tower&&o.face<0)c.scale(-1,1);
    if(!tower && o.id!=='windcatcher')c.rotate(o.attack>0?-.14*Math.sin(o.attack/.23*Math.PI):o.moving?.065*Math.sin(phase):0);
    c.globalAlpha=o.spawn>0?.5:1;
    if(o.team && o.id!=='windcatcher' && sprites.opponents.naturalWidth){
      const idx=tower?(o.lane===2?9:8):starters.indexOf(o.id);
      c.drawImage(sprites.opponents,(idx%5)*152,Math.floor(idx/5)*160,152,160,-width/2,-height,width,height);
    }else if(sprite.naturalWidth)c.drawImage(sprite,-width/2,-height,width,height);
    c.restore();
    const top=Math.max(tower?14:1,y-height-bob-5-(o.id==='falcon'?px*.7:0)),bw=width*.82;
    c.fillStyle='#271f30';c.fillRect(x-bw/2-1,top-1,bw+2,6);c.fillStyle=o.flash>0?'#fff2c3':teamColor(o.team);c.fillRect(x-bw/2,top,bw*o.hp/o.max,4);
    if(o.wind>0){c.fillStyle='#ffcf67';c.fillRect(x-bw/2,top+5,bw*o.wind/tacticsFor(o).windup,2);}
    if(tower){c.font='bold 11px system-ui';c.textAlign='center';c.strokeStyle='#301e23';c.lineWidth=3;c.strokeText(Math.ceil(o.hp),x,top-2);c.fillStyle='white';c.fillText(Math.ceil(o.hp),x,top-2);}
  }
  for(const s of f.shots){c.fillStyle=s.id==='spark'?'#ff8e1e':s.id==='echo'?'#ec9cff':'#ffdf75';c.beginPath();c.arc(s.x*px,(s.y-.3)*py,px*.18,0,Math.PI*2);c.fill();}
  for(const e of f.effects){c.globalAlpha=e.life/e.max;c.strokeStyle=e.color;c.lineWidth=2+e.life*5;c.beginPath();c.ellipse(e.x*px,e.y*py,(1-e.life/e.max+.05)*e.radius*px,(1-e.life/e.max+.05)*e.radius*py*.6,0,0,Math.PI*2);c.stroke();}c.globalAlpha=1;
  if(drag&&drag.y<=H){
    const id=f.hands[0][drag.slot];const valid=legal(0,id,drag)&&f.mana[0]>=troops[id][0];
    c.strokeStyle=valid?'#e9ffff':'#ff4859';c.lineWidth=3;c.beginPath();c.ellipse(drag.x*px,drag.y*py,px*(isSpell(id)?3.1:1),py*(isSpell(id)?3.1:.55),0,0,Math.PI*2);c.stroke();
    const ghost=sprites['piece-'+id];if(ghost?.naturalWidth){c.globalAlpha=.65;c.drawImage(ghost,(drag.x-1)*px,drag.y*py-2.5*px,2*px,2.5*px);c.globalAlpha=1;}
  }
  if(f.elapsed<f.noticeUntil){c.font='bold 13px system-ui';c.textAlign='center';const tw=c.measureText(f.notice).width;c.fillStyle='#24182ce8';c.fillRect((w-tw)/2-10,h-25,tw+20,22);c.fillStyle='#fff2ce';c.fillText(f.notice,w/2,h-10);}
}
function loop(now){
  if(!fight||fight.paused)return;
  const dt=fight.last?Math.min(.1,(now-fight.last)/1000):0;fight.last=now;
  fight.banked+=dt;while(fight&&fight.banked>=1/30){fight.banked-=1/30;tick(1/30);}if(!fight)return;render();hud();frame=requestAnimationFrame(loop);
}
show('Home');
