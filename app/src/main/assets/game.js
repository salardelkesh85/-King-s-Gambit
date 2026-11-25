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
const navArt={Cards:'▣',Home:'♜',Shop:'◆'};
const roles={scout:'Fast melee',echo:'Area damage',guard:'Heavy melee',falcon:'Flying attacker',spark:'Area damage',warden:'Ranged support',bandit:'Twin attackers',ram:'Building hunter',windcatcher:'Defense building',storm:'Area spell',blast:'Area spell'};
let collectionOpen=false;
function header(){
  bar.className='lobbybar';
  bar.innerHTML='<div class="identity"><img src="art/scout.webp" alt=""><span>King’s Gambit</span></div><div class="resources"><b aria-label="Trophies">🏆 '+profile.trophies+'</b><b aria-label="Coins"><i class="coin"></i>'+profile.coins+'</b></div>';
}
function show(page){
  screen=page;swap=null;main.scrollTop=0;header();main.innerHTML='';nav.style.display='flex';nav.className='dock';
  nav.replaceChildren(...['Cards','Home','Shop'].map(p=>{
    const b=button('',()=>show(p),p===page?'current':'');
    b.innerHTML='<i aria-hidden="true">'+navArt[p]+'</i><span>'+(p==='Home'?'Arena':p)+'</span>';
    b.setAttribute('aria-label',p);if(p===page)b.setAttribute('aria-current','page');return b;
  }));
  if(page==='Home')lobby();else if(page==='Cards')cards();else shop();
}
function lobby(){
  main.innerHTML='<section class="lobby"><div class="royal-title"><span aria-hidden="true">♛</span><h1>King’s Gambit</h1><small lang="fa">شاه‌کش</small></div><div class="arena-stage"><div class="orbit"></div><img class="diorama" alt=""></div><div class="arena-picker"></div><div class="lobby-actions"></div></section>';
  const picker=main.querySelector('.arena-picker'),left=button('‹',()=>advance(-1)),right=button('›',()=>advance(1));
  left.setAttribute('aria-label','Previous arena');right.setAttribute('aria-label','Next arena');
  const info=document.createElement('div');picker.append(left,info,right);
  function refresh(){
    main.querySelector('.diorama').src='art/lobby'+profile.arena+'.webp';
    info.innerHTML='<small>ARENA '+String(profile.arena+1).padStart(2,'0')+' / 03</small><h2>'+arenas[profile.arena]+'</h2>';
  }
  function advance(by){profile.arena=(profile.arena+by+arenas.length)%arenas.length;save();refresh();}
  refresh();main.querySelector('.lobby-actions').append(button('Battle',()=>start(),'battle-gold'),button('Ram defense drill',()=>start(true),'practice'));
}
function isSpell(id){return id==='storm'||id==='blast';}
function cardArt(id){return 'art/'+id+(id==='windcatcher'?'.svg':'.webp');}
function scale(lv){return 1+.08*(lv-1);}
function menuCard(id,fn){
  const lv=profile.levels[id]||0,b=button('',fn,'unit-card'+(!lv?' locked':''));
  b.setAttribute('aria-label',names[id]+(lv?' · Level '+lv:' · Locked'));
  b.innerHTML='<div class="portrait"><img src="'+cardArt(id)+'" alt=""></div><b class="cost">'+troops[id][0]+'</b><span>'+names[id]+'</span><small>'+(lv?'LV '+lv:'LOCKED')+'</small>';
  return b;
}
function inspect(id){
  const lv=profile.levels[id]||0, spell=isSpell(id);
  const actions=[['Close']];
  if(!lv)actions.push(['Open Shop',()=>show('Shop')]);
  else if(!profile.deck.includes(id))actions.push(['Use in deck',()=>{swap=id;collectionOpen=false;cards();main.scrollTop=0;}]);
  dialog(names[id],roles[id]+' · '+troops[id][0]+' elixir',actions);
  const stats=document.createElement('div');stats.className='card-stats';
  stats.innerHTML='<img src="'+cardArt(id)+'" alt=""><div><strong>'+(lv?'Level '+lv:'Locked')+'</strong><span>'+Math.round(troops[id][2]*scale(lv||1))+' damage</span>'+(spell?'':'<span>'+Math.round(troops[id][1]*scale(lv||1))+' HP</span>')+'</div>';
  modal.querySelector('p').after(stats);
}
function cards(){
  const owned=Object.keys(troops).filter(id=>profile.levels[id]).length;
  main.innerHTML='<section class="royal-page"><h1>Cards</h1><div class="segmented"></div><div class="deckbox"><div class="deck-heading"></div><div class="army-grid"></div></div></section>';
  const tabs=main.querySelector('.segmented');
  for(const [text,value] of [['Battle deck',false],['Collection',true]])tabs.append(button(text,()=>{collectionOpen=value;swap=null;cards();},value===collectionOpen?'selected':''));
  const heading=main.querySelector('.deck-heading'),grid=main.querySelector('.army-grid');
  if(collectionOpen){
    heading.innerHTML='<h2>Collection</h2><em>'+owned+' / '+Object.keys(troops).length+'</em>';
    for(const id of Object.keys(troops))grid.append(menuCard(id,()=>inspect(id)));
  }else{
    heading.innerHTML='<h2>'+(swap?'Replace a card':'Battle deck')+'</h2><em>♦ '+(profile.deck.reduce((sum,id)=>sum+troops[id][0],0)/profile.deck.length).toFixed(1)+' avg</em>';
    profile.deck.forEach((id,i)=>grid.append(menuCard(id,()=>{
      if(!swap){inspect(id);return;}
      profile.deck[i]=swap;swap=null;save();cards();
    })));
    if(swap)heading.after(button('Cancel replacement',()=>{swap=null;cards();},'cancel-swap'));
  }
}
function shop(){
  main.innerHTML='<section class="royal-page store"><h1>Shop</h1><article class="chest-feature"><img src="art/chest.webp" alt=""><div><small>FEATURED CHEST</small><h2>Rooftop Chest</h2><p>One random card. Copies raise its level.</p><div class="buy"></div></div></article><div class="section-title"><h2>Spell cards</h2></div><div class="offer-grid"></div><div class="daily"></div></section>';
  function buy(id,price){
    if(profile.coins<price){dialog('More coins needed','Collect your daily gift or earn coins in battle.',[['Close']]);return;}
    dialog(id?names[id]:'Rooftop Chest','Spend '+price+' coins?',[['Cancel'],['Confirm',()=>{
      if(profile.coins<price)return;
      const award=id||Object.keys(troops)[Math.floor(Math.random()*Object.keys(troops).length)];
      profile.coins-=price;profile.levels[award]=(profile.levels[award]||0)+1;save();show('Shop');
      dialog(names[award],'Added to your collection · Level '+profile.levels[award],[['Continue']]);
      const image=document.createElement('img');image.className='reward';image.src=cardArt(award);image.alt='';modal.prepend(image);
    }]]);
  }
  function priceButton(price,action){const b=button('',action,'price-btn');b.innerHTML='<i class="coin"></i>'+price;b.setAttribute('aria-label',price+' coins');return b;}
  main.querySelector('.buy').append(priceButton(150,()=>buy(null,150)));
  for(const id of ['storm','blast']){
    const el=document.createElement('article');el.className='spell-offer';
    el.innerHTML='<img src="'+cardArt(id)+'" alt=""><h3>'+names[id]+'</h3>';el.append(priceButton(200,()=>buy(id,200)));main.querySelector('.offer-grid').append(el);
  }
  const day=()=>new Date().toLocaleDateString('en-CA'),claimed=profile.gift===day();
  const gift=main.querySelector('.daily');gift.innerHTML='<i class="coin"></i><div><h3>Daily gift</h3><small>75 coins</small></div>';
  const claim=button(claimed?'Claimed':'Claim',()=>{if(profile.gift!==day()){profile.gift=day();profile.coins+=75;save();show('Shop');}},'claim');
  claim.disabled=claimed;gift.append(claim);
}
function pauseBattle(){if(!fight||fight.paused)return;fight.paused=true;BattleAudio.stop();cancelAnimationFrame(frame);dialog('Paused',arenas[fight.arena],[['Resume',resume],['Leave battle',()=>{fight=null;show('Home');}]]);}
function resume(){if(!fight)return;fight.paused=false;fight.last=0;frame=requestAnimationFrame(loop);}
function finish(result){if(fight.drill){const report=(fight.diverted?'Ram diverted':'Ram stayed on lane')+' · Towers fired: '+fight.drillShots.size+' · Tower damage: '+(760-fight.towers[0].hp);fight=null;cancelAnimationFrame(frame);show('Home');dialog('Ram defense drill',report,[['Home'],['Retry',()=>start(true)]]);return;}fight=null;cancelAnimationFrame(frame);const coins=result===1?80:result===0?30:15;profile.coins+=coins;profile.trophies=Math.max(0,profile.trophies+(result===1?12:result===-1?-5:0));save();show('Home');dialog(result===1?'Victory':result===0?'Draw':'Defeat','Battle reward · '+coins+' coins',[['Home'],['Play again',start]]);}
function handleBack(){if(modal.open){modal.close();if(fight?.paused)resume();return true;}if(fight){pauseBattle();return true;}if(screen!=='Home'){show('Home');return true;}return false;}
modal.addEventListener('cancel',e=>{e.preventDefault();handleBack();});document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseBattle();});
