'use strict';
const troops = {
 scout: [2,105,19,.095,.055], echo: [3,120,22,.070,.17], guard: [4,310,28,.044,.06],
 falcon: [5,210,42,.10,.065], spark: [3,90,32,.065,.19], warden: [4,235,30,.054,.13]
};
const names = {scout:'Scout',echo:'Echo',guard:'Guard',falcon:'Falcon',spark:'Spark',warden:'Warden'};
const arenas=['Rooftop District','Turquoise Bazaar','Schoolyard'];
const initial={coins:250,trophies:0,deck:['scout','echo','guard','falcon'],levels:{scout:1,echo:1,guard:1,falcon:1},arena:0,gift:''};
let profile;
try { profile=JSON.parse(localStorage.getItem('kings-profile')) || structuredClone(initial); }
catch { profile=JSON.parse(JSON.stringify(initial)); }
function save(){localStorage.setItem('kings-profile',JSON.stringify(profile));}
const main=document.querySelector('main'), bar=document.querySelector('header'), nav=document.querySelector('nav'), modal=document.querySelector('dialog');
let screen='Home', selected='echo', swap=null, fight=null, frame=0;
function button(label,fn,style=''){const b=document.createElement('button');b.textContent=label;b.className=style;b.onclick=fn;return b;}
function dialog(title,body,actions){modal.innerHTML='';const h=document.createElement('h2'),p=document.createElement('p');h.textContent=title;p.textContent=body;modal.append(h,p);for(const [label,fn] of actions)modal.append(button(label,()=>{modal.close();fn?.();}));if(!modal.open)modal.showModal();}
function header(){bar.innerHTML='<strong>♛ KING’S GAMBIT</strong><span>🏆 '+profile.trophies+'　🪙 '+profile.coins+'</span>';}
function show(page){screen=page;swap=null;header();main.innerHTML='';nav.hidden=false;nav.style.display='flex';nav.replaceChildren(...['Cards','Home','Shop'].map(p=>button(p,()=>show(p),page===p?'active':'')));
 if(page==='Home'){main.innerHTML='<section class="home"><div><h1>King’s Gambit</h1><small lang="fa">شاه‌کش</small></div><footer><label class="sr" for="arena">Arena</label><select id="arena"></select></footer></section>';const s=main.querySelector('select');arenas.forEach((a,i)=>s.add(new Option(a,i)));s.value=profile.arena;s.onchange=()=>{profile.arena=Number(s.value);save();};s.parentElement.append(button('Battle',start,'primary'));}else if(page==='Cards')cards();else shop();
}
function card(id,fn,on=false){const b=button('',fn,'card'+(on?' active':''));b.innerHTML='<img alt="" src="art/'+id+'.webp"><b>'+troops[id][0]+'</b>'+names[id];return b;}
function cards(){main.innerHTML='<section class="page"><h1>Cards</h1><h2>Battle Deck</h2><div class="grid deck"></div><h2>Collection</h2><div class="grid collection"></div><div class="panel detail"></div></section>';
 const deck=main.querySelector('.deck');profile.deck.forEach((id,i)=>deck.append(card(id,()=>{if(swap){profile.deck[i]=swap;save();swap=null;}selected=profile.deck[i];cards();})));
 for(const id in troops)main.querySelector('.collection').append(card(id,()=>{selected=id;swap=null;cards();},id===selected));
 const d=main.querySelector('.detail'),lv=profile.levels[selected];d.innerHTML='<h2>'+names[selected]+'</h2><p>'+(lv?'Level '+lv+' · '+Math.round(troops[selected][1]*scale(lv))+' HP':'Locked · Available in the shop')+'</p>';
 if(swap)d.append('Choose a Battle Deck slot to replace.');else if(lv && !profile.deck.includes(selected))d.append(button('Add to deck',()=>{swap=selected;cards();},'primary'));else if(!lv)d.append(button('Visit Shop',()=>show('Shop')));else d.append('In battle deck');
}
function scale(lv){return 1+.08*(lv-1);}
function shop(){main.innerHTML='<section class="page"><h1>Shop</h1><div class="panel"><img class="offer" src="art/chest.webp" alt="Ornate rooftop chest"><h2>Rooftop Chest</h2><p>One random fighter. Copies raise its level.</p><div id="chest"></div></div><h2>Card Packs</h2><div class="packs"></div><div class="panel gift"></div></section>';
 function purchase(id,cost){if(profile.coins<cost){dialog('More coins needed','Win battles or collect your daily gift.',[['Close']]);return;}const award=id || Object.keys(troops)[Math.floor(Math.random()*6)];profile.coins-=cost;profile.levels[award]=(profile.levels[award]||0)+1;save();show('Shop');dialog(names[award],'Added to your collection · Level '+profile.levels[award],[['Continue']]);}
 document.querySelector('#chest').append(button('Open · 🪙 150',()=>purchase(null,150),'primary'));
 for(const id of ['spark','warden']){const row=document.createElement('div');row.className='row panel';row.innerHTML='<img width="64" alt="" src="art/'+id+'.webp"><strong>'+names[id]+'</strong>';row.append(button('🪙 200',()=>purchase(id,200)));main.querySelector('.packs').append(row);}
 const day=()=>new Date().toLocaleDateString('en-CA');const g=main.querySelector('.gift');g.innerHTML='<h2>Daily Gift</h2>';const claim=button(profile.gift===day()?'Claimed':'Claim 75 coins',()=>{if(profile.gift!==day()){profile.gift=day();profile.coins+=75;save();show('Shop');}});claim.disabled=profile.gift===day();g.append(claim);
}
const art={};for(const key of [...Object.keys(troops),'arena0','arena1','arena2']){art[key]=new Image();art[key].src='art/'+key+'.webp';}
function start(){screen='Battle';nav.style.display='none';bar.innerHTML='<button id="pause">Ⅱ Pause</button><strong id="time"></strong><span>Practice AI</span>';main.innerHTML='<section class="battle"><div class="field"><canvas class="board" aria-label="Battle arena"></canvas></div><div class="hand"><div class="row"><strong id="energy"></strong><span class="hint">Pick a card, tap your half</span></div><div class="meter"><i></i></div><div class="grid deck"></div></div></section>';
 fight={time:120,mana:[5,5],units:[],towers:[],selected:profile.deck[0],ai:2,paused:false,last:0,arena:profile.arena};
 for(const team of [0,1])for(const lane of [0,1,2]){const base=lane===2;fight.towers.push({team,lane,x:[.24,.76,.5][lane],y:team?(base?.10:.18):(base?.89:.80),hp:base?650:390,max:base?650:390,cd:0});}
 const c=main.querySelector('canvas');c.onpointerdown=e=>{if(!fight||fight.paused)return;const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;if(y<.52){main.querySelector('.hint').textContent='Deploy on the lower half';return;}if(!deploy(0,fight.selected,x<.5?0:1,Math.min(.81,y))){main.querySelector('.hint').textContent='Waiting for energy';}else main.querySelector('.hint').textContent='Pick a card, tap your half';};
 bar.querySelector('button').onclick=pauseBattle;const hand=main.querySelector('.deck');profile.deck.forEach(id=>hand.append(card(id,()=>{fight.selected=id;hud();})));hud();frame=requestAnimationFrame(loop);
}
function deploy(team,id,lane,y){const [cost,hp,dmg,speed,range]=troops[id];if(fight.mana[team]<cost)return false;fight.mana[team]-=cost;const level=team?1:profile.levels[id];const max=hp*scale(level);
 fight.units.push({team,id,lane,x:lane?.76:.24,y,hp:max,max,dmg:dmg*scale(level),speed,range,cd:.3});return true;}
function update(dt){const f=fight;f.time-=dt;for(const t of [0,1])f.mana[t]=Math.min(10,f.mana[t]+dt*.92);f.ai-=dt;if(f.ai<=0){const ids=Object.keys(troops).filter(id=>troops[id][0]<=f.mana[1]);if(ids.length)deploy(1,ids[Math.floor(Math.random()*ids.length)],Math.floor(Math.random()*2),.21);f.ai=1.3+Math.random()*1.3;}
 const dist=(a,b)=>Math.hypot((a.x-b.x)*.7,a.y-b.y);
 for(const a of [...f.towers,...f.units]){if(a.hp<=0)continue;a.cd-=dt;const unit=!!a.id;let nearest=null,best=Infinity;for(const b of f.units){if(b.team===a.team||b.hp<=0)continue;const d=dist(a,b);if(d<best&&d<=(unit?a.range:.20)){best=d;nearest=b;}}
 const target=nearest||(unit&&(f.towers.find(t=>t.team!==a.team&&t.lane===a.lane&&t.hp>0)||f.towers.find(t=>t.team!==a.team&&t.lane===2)));if(!target)continue;
 if(dist(a,target)<=(unit?a.range:.20)){if(a.cd<=0){target.hp-=unit?a.dmg:24;a.cd=unit?.93:1.05;}}else if(unit){const dx=target.x-a.x,dy=target.y-a.y;const step=Math.min(1,a.speed*dt/Math.max(.001,Math.hypot(dx,dy)));a.x+=dx*step;a.y+=dy*step;}}
 f.units=f.units.filter(u=>u.hp>0);const base=f.towers.filter(t=>t.lane===2);if(base.some(t=>t.hp<=0)||f.time<=0){function score(team){const towers=f.towers.filter(t=>t.team===team);return towers.filter(t=>t.hp>0).length*2000+towers.reduce((s,t)=>s+Math.max(0,t.hp),0);}const diff=base[0].hp<=0?-1:base[1].hp<=0?1:score(0)-score(1);finish(Math.sign(diff));}}
function hud(){if(!fight)return;const f=fight,n=Math.ceil(Math.max(0,f.time));bar.querySelector('#time').textContent=Math.floor(n/60)+':'+String(n%60).padStart(2,'0');main.querySelector('#energy').textContent='◆ '+Math.floor(f.mana[0])+' / 10';main.querySelector('.meter i').style.width=(f.mana[0]*10)+'%';main.querySelectorAll('.card').forEach((b,i)=>{b.classList.toggle('active',profile.deck[i]===f.selected);b.disabled=troops[profile.deck[i]][0]>f.mana[0];});}
function draw(){const c=main.querySelector('canvas'),rect=c.getBoundingClientRect(),w=Math.round(rect.width*devicePixelRatio),h=Math.round(rect.height*devicePixelRatio);if(!w||!h)return;if(c.width!==w||c.height!==h){c.width=w;c.height=h;}const ctx=c.getContext('2d'),bg=art['arena'+fight.arena];ctx.clearRect(0,0,w,h);if(bg.naturalWidth)ctx.drawImage(bg,0,0,w,h);
 function health(o,width,y){ctx.fillStyle='#291729';ctx.fillRect(o.x*w-width/2,y,width,Math.max(4,w*.011));ctx.fillStyle=o.team?'#ef5770':'#4fe0dc';ctx.fillRect(o.x*w-width/2,y,width*Math.max(0,o.hp/o.max),Math.max(4,w*.011));}
 for(const t of fight.towers)health(t,w*.15,t.y*h);for(const u of fight.units){const r=w*.042,x=u.x*w,y=u.y*h;ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.clip();if(art[u.id].naturalWidth)ctx.drawImage(art[u.id],x-r*1.4,y-r,r*2.8,r*2);ctx.restore();ctx.strokeStyle=u.team?'#f15274':'#48e1d8';ctx.lineWidth=Math.max(2,w*.005);ctx.stroke();health(u,r*2,y-r-w*.017);}}
function loop(now){if(!fight||fight.paused)return;const dt=fight.last?Math.min((now-fight.last)/1000,.09):0;fight.last=now;update(dt);if(!fight)return;draw();hud();frame=requestAnimationFrame(loop);}
function pauseBattle(){if(!fight||fight.paused)return;fight.paused=true;cancelAnimationFrame(frame);dialog('Paused',arenas[fight.arena],[['Resume',resume],['Leave battle',()=>{fight=null;show('Home');}]]);}
function resume(){if(!fight)return;fight.paused=false;fight.last=0;frame=requestAnimationFrame(loop);}
function finish(result){fight=null;cancelAnimationFrame(frame);const coins=result===1?80:result===0?30:15;profile.coins+=coins;profile.trophies=Math.max(0,profile.trophies+(result===1?12:result===-1?-5:0));save();show('Home');dialog(result===1?'Victory':result===0?'Draw':'Defeat','Battle reward · '+coins+' coins',[['Home'],['Play again',start]]);}
function handleBack(){if(modal.open){modal.close();if(fight?.paused)resume();return true;}if(fight){pauseBattle();return true;}if(screen!=='Home'){show('Home');return true;}return false;}
modal.addEventListener('cancel',e=>{e.preventDefault();handleBack();});document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseBattle();});show('Home');
