'use strict';
// Distances use board tiles, durations use simulation seconds.
const rules = {
  scout: {sight:4.2, windup:.16, interval:.76},
  bandit:{sight:4.2, windup:.19, interval:.84},
  guard: {sight:4.8, windup:.46, interval:1.18},
  ram:   {sight:4.25, windup:.70, interval:1.62},
  falcon:{sight:5.2, windup:.22, interval:.95},
  echo:  {sight:5.6, windup:.44, interval:1.28},
  spark: {sight:5.4, windup:.50, interval:1.36},
  warden:{sight:5.3, windup:.38, interval:1.14},
  windcatcher:{sight:4.3, windup:.34, interval:1.18},
  outpost:{sight:7.9, windup:.25, interval:.96},
  palace:{sight:5.8, windup:.52, interval:1.24}
};
function tacticsFor(actor){return rules[actor.id || (actor.lane===2?'palace':'outpost')];}
function structure(actor){return actor.id==='windcatcher'||actor.lane!==undefined;}
function canHit(actor, target){
  if(target.hp<=0 || target.team===actor.team || target.spawn>0)return false;
  if(actor.id==='ram')return structure(target);
  return target.id!=='falcon'||!['scout','guard','bandit'].includes(actor.id);
}
function nearestTo(actor,list,radius){
  let best=null;
  for(const target of list){
    if(!canHit(actor,target))continue;
    const d=distance(actor,target);
    if(d<=radius && (!best || d<distance(actor,best)))best=target;
  }
  return best;
}
function aim(actor){
  const ruleset=tacticsFor(actor), old=actor.target;
  const anchored=structure(actor);
  if(old && canHit(actor,old)){
    if(old.lane===undefined && distance(actor,old)<=ruleset.sight+(anchored?0:1.4))return old;
    if(old.lane!==undefined && distance(actor,old)<=attackReach(actor,old))return old;
  }
  const nearby=nearestTo(actor,fight.units,ruleset.sight);
  if(nearby)return nearby;
  if(anchored)return null;
  return nearestTo(actor,fight.towers,Infinity);
}
function attackReach(actor,target){
  return (structure(actor)?tacticsFor(actor).sight:actor.range)+(structure(target)&&!structure(actor)?.72:0);
}
function combatStep(actor,dt){
  if(actor.hp<=0)return;
  actor.flash=Math.max(0,actor.flash-dt);actor.attack=Math.max(0,(actor.attack||0)-dt);
  actor.cd=Math.max(0,actor.cd-dt);actor.moving=false;
  if(actor.spawn>0){actor.spawn-=dt;return;}
  if(actor.id==='windcatcher'){
    actor.life-=dt;
    if(actor.life<=0){hit(actor,actor.hp);return;}
  }
  if(actor.lane===2&&!actor.awake)return;
  const target=aim(actor);
  if(target!==actor.target){actor.target=target;actor.wind=0;}
  if(!target)return;
  if(fight.drill&&actor.id==='ram'&&target.id==='windcatcher')fight.diverted=true;
  if(distance(actor,target)>attackReach(actor,target)){
    actor.wind=0;
    if(!structure(actor))move(actor,target,dt);
    return;
  }
  if(!structure(actor))Figures.turn(actor,target.x-actor.x,target.y-actor.y,dt);
  if(actor.cd>0)return;
  actor.wind=(actor.wind||0)+dt;
  if(actor.wind>=tacticsFor(actor).windup){attack(actor,target);actor.wind=0;}
}
function aiTurn(){
  const f=fight, mana=f.mana[1], hand=f.hands[1];
  const invaders=f.units.filter(u=>!u.team&&u.hp>0&&!structure(u)&&u.y<20).sort((a,b)=>a.y-b.y);
  const threat=invaders[0];
  if(!threat && mana<6.5)return;
  const support=f.units.find(u=>u.team===1&&u.hp>0&&!structure(u)&&u.y>10);
  const invested=[0,0];
  for(const u of f.units)if(!u.team&&u.hp>0)invested[u.x<9?0:1]+=troops[u.id][0];
  const lane=invested[0]>invested[1]?13:5;
  const choices=[];
  for(let slot=0;slot<4;slot++){
    const id=hand[slot],cost=troops[id][0];if(cost>mana)continue;
    let score=0,p;
    if(threat){
      const air=threat.id==='falcon', antiAir=['warden','echo','spark','falcon'].includes(id);
      if(id==='ram')continue;
      score=air?(antiAir?8:0):(id==='guard'?6:4);
      if(invaders.length>=2 && ['echo','spark'].includes(id))score+=4;
      if(id==='windcatcher'){
        score=threat.id==='ram'?12:3;
        p={x:threat.x<9?8.5:9.5,y:10.5};
      }else p={x:clamp(threat.x,2,16),y:antiAir?9.5:12.5};
    }else{
      if(id==='windcatcher')continue;
      score=support?(['echo','spark','warden'].includes(id)?7:3):(id==='ram'?8:cost);
      if(invested[0]+invested[1]>=5 && id==='scout')score+=5;
      p={x:support?support.x:lane,y:support?10.5:13.5};
    }
    if(legal(1,id,p))choices.push({slot,p,score:score-cost*.08});
  }
  choices.sort((a,b)=>b.score-a.score);
  if(choices.length)play(1,choices[0].slot,choices[0].p);
}
