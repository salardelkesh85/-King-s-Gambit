'use strict';
const troops = {
 scout: [2,105,19,.095,.055], echo: [3,120,22,.070,.17], guard: [4,310,28,.044,.06],
 falcon: [5,210,42,.10,.065], spark: [3,90,32,.065,.19], warden: [4,235,30,.054,.13], bandit:[3,82,17,.095,.05], ram:[5,360,62,.056,.05], windcatcher:[3,280,14,0,.15], storm:[4,0,85,0,0], blast:[3,0,65,0,0]
};
const names = {scout:'Scout',echo:'Echo',guard:'Guard',falcon:'Falcon',spark:'Spark',warden:'Warden',bandit:'Dune Twins',ram:'Brass Ram',windcatcher:'Windcatcher',storm:'Tempest',blast:'Emberfall'};
const arenas=['Rooftop District','Turquoise Bazaar','Schoolyard'];
const initial={coins:250,trophies:0,deck:['scout','echo','guard','falcon'],levels:{scout:1,echo:1,guard:1,falcon:1},arena:0,gift:''};
let profile;
try { profile=JSON.parse(localStorage.getItem('kings-profile')) || structuredClone(initial); }
catch { profile=JSON.parse(JSON.stringify(initial)); }
const starters=['scout','echo','guard','falcon','bandit','warden','spark','ram'];
profile.deck=[...new Set([...profile.deck,...starters])].slice(0,8);
for(const id of starters)profile.levels[id]=Math.max(1,profile.levels[id]||0);
profile.levels.windcatcher=Math.max(1,profile.levels.windcatcher||0);
function save(){localStorage.setItem('kings-profile',JSON.stringify(profile));}
const main=document.querySelector('main'), bar=document.querySelector('header'), nav=document.querySelector('nav'), modal=document.querySelector('dialog');
let screen='Home', selected='echo', swap=null, fight=null, frame=0;
function button(label,fn,style=''){const b=document.createElement('button');b.textContent=label;b.className=style;b.onclick=fn;return b;}
function dialog(title,body,actions){modal.innerHTML='';const h=document.createElement('h2'),p=document.createElement('p');h.textContent=title;p.textContent=body;modal.append(h,p);for(const [label,fn] of actions)modal.append(button(label,()=>{modal.close();fn?.();}));if(!modal.open)modal.showModal();}
function header(){bar.innerHTML='<strong>♛ KING’S GAMBIT</strong><span>🏆 '+profile.trophies+'　🪙 '+profile.coins+'</span>';}
function show(page){screen=page;swap=null;header();main.innerHTML='';nav.hidden=false;nav.style.display='flex';nav.replaceChildren(...['Cards','Home','Shop'].map(p=>button(p,()=>show(p),page===p?'active':'')));
 if(page==='Home'){main.innerHTML='<section class="home"><div><h1>King’s Gambit</h1><small lang="fa">شاه‌کش</small></div><footer><label class="sr" for="arena">Arena</label><select id="arena"></select></footer></section>';const s=main.querySelector('select');arenas.forEach((a,i)=>s.add(new Option(a,i)));s.value=profile.arena;s.onchange=()=>{profile.arena=Number(s.value);save();};s.parentElement.append(button('Battle',()=>start(),'primary'),button('Ram defense drill',()=>start(true)));}else if(page==='Cards')cards();else shop();
}
function isSpell(id){return id==='storm'||id==='blast';}
function cardArt(id){return id==='windcatcher'?'art/windcatcher.svg':'art/'+portrait(id)+'.webp';}
function portrait(id){return id==='storm'?'warden':id==='blast'?'spark':id;}
function card(id,fn,on=false){const b=button('',fn,'card'+(on?' active':''));b.innerHTML='<img alt="" src="'+cardArt(id)+'"><b>'+troops[id][0]+'</b>'+names[id];return b;}
function cards(){main.innerHTML='<section class="page"><h1>Cards</h1><h2>Battle Deck</h2><div class="grid deck"></div><h2>Collection</h2><div class="grid collection"></div><div class="panel detail"></div></section>';
 const deck=main.querySelector('.deck');profile.deck.forEach((id,i)=>deck.append(card(id,()=>{if(swap){profile.deck[i]=swap;save();swap=null;}selected=profile.deck[i];cards();})));
 for(const id in troops)main.querySelector('.collection').append(card(id,()=>{selected=id;swap=null;cards();},id===selected));
 const d=main.querySelector('.detail'),lv=profile.levels[selected];d.innerHTML='<h2>'+names[selected]+'</h2><p>'+(lv?'Level '+lv+' · '+Math.round(troops[selected][1]*scale(lv))+(isSpell(selected)?' · Spell':' HP'):'Locked · Available in the shop')+'</p>';
 if(swap)d.append('Choose a Battle Deck slot to replace.');else if(lv && !profile.deck.includes(selected))d.append(button('Add to deck',()=>{swap=selected;cards();},'primary'));else if(!lv)d.append(button('Visit Shop',()=>show('Shop')));else d.append('In battle deck');
}
function scale(lv){return 1+.08*(lv-1);}
function shop(){main.innerHTML='<section class="page"><h1>Shop</h1><div class="panel"><img class="offer" src="art/chest.webp" alt="Ornate rooftop chest"><h2>Rooftop Chest</h2><p>One random fighter. Copies raise its level.</p><div id="chest"></div></div><h2>Card Packs</h2><div class="packs"></div><div class="panel gift"></div></section>';
 function purchase(id,cost){if(profile.coins<cost){dialog('More coins needed','Win battles or collect your daily gift.',[['Close']]);return;}const award=id || Object.keys(troops)[Math.floor(Math.random()*Object.keys(troops).length)];profile.coins-=cost;profile.levels[award]=(profile.levels[award]||0)+1;save();show('Shop');dialog(names[award],'Added to your collection · Level '+profile.levels[award],[['Continue']]);}
 document.querySelector('#chest').append(button('Open · 🪙 150',()=>purchase(null,150),'primary'));
 for(const id of ['storm','blast']){const row=document.createElement('div');row.className='row panel';row.innerHTML='<img width="64" alt="" src="'+cardArt(id)+'"><strong>'+names[id]+'</strong>';row.append(button('🪙 200',()=>purchase(id,200)));main.querySelector('.packs').append(row);}
 const day=()=>new Date().toLocaleDateString('en-CA');const g=main.querySelector('.gift');g.innerHTML='<h2>Daily Gift</h2>';const claim=button(profile.gift===day()?'Claimed':'Claim 75 coins',()=>{if(profile.gift!==day()){profile.gift=day();profile.coins+=75;save();show('Shop');}});claim.disabled=profile.gift===day();g.append(claim);
}
function pauseBattle(){if(!fight||fight.paused)return;fight.paused=true;BattleAudio.stop();cancelAnimationFrame(frame);dialog('Paused',arenas[fight.arena],[['Resume',resume],['Leave battle',()=>{fight=null;show('Home');}]]);}
function resume(){if(!fight)return;fight.paused=false;fight.last=0;frame=requestAnimationFrame(loop);}
function finish(result){if(fight.drill){const report=(fight.diverted?'Ram diverted':'Ram stayed on lane')+' · Towers fired: '+fight.drillShots.size+' · Tower damage: '+(760-fight.towers[0].hp);fight=null;cancelAnimationFrame(frame);show('Home');dialog('Ram defense drill',report,[['Home'],['Retry',()=>start(true)]]);return;}fight=null;cancelAnimationFrame(frame);const coins=result===1?80:result===0?30:15;profile.coins+=coins;profile.trophies=Math.max(0,profile.trophies+(result===1?12:result===-1?-5:0));save();show('Home');dialog(result===1?'Victory':result===0?'Draw':'Defeat','Battle reward · '+coins+' coins',[['Home'],['Play again',start]]);}
function handleBack(){if(modal.open){modal.close();if(fight?.paused)resume();return true;}if(fight){pauseBattle();return true;}if(screen!=='Home'){show('Home');return true;}return false;}
modal.addEventListener('cancel',e=>{e.preventDefault();handleBack();});document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseBattle();});
