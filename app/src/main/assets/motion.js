'use strict';
const clips = {};
// A sheet has two four-frame clips per team. All frames share a ground pivot.
for (const id of starters) {
  const sheet = new Image();
  sheet.src = 'art/motion/' + id + '.webp';
  clips[id] = sheet;
}
const stride = {scout:1.5, guard:1.1, ram:1.8, echo:1.25, spark:1.2, bandit:1.45, warden:1.12};
function pose(unit, time) {
  if(unit.attack>0){
    const elapsed=.23-unit.attack;
    if(unit.id==='scout')return elapsed<.07?5:elapsed<.16?6:7;
    return elapsed<.14?6:7;
  }
  if(unit.wind>0)return unit.id==='scout'||unit.wind<tacticsFor(unit).windup*.46?4:5;
  if(unit.id==='falcon')return Math.floor(time*8+unit.phase)%4;
  if(unit.moving)return Math.floor((unit.travel||0)*4/stride[unit.id])%4;
  return 3;
}
function paintFighter(c,unit,frame,size){
  const sheet=clips[unit.id];
  const row=Math.floor(frame/4)+2*unit.team;
  c.drawImage(sheet,frame%4*128,row*128,128,128,-size/2,-size,size,size);
}
function drawMissile(c,shot,px,py){
  const x=shot.x*px,y=(shot.y-.3)*py;
  c.save();c.translate(x,y);
  c.rotate(Math.atan2((shot.t.y-shot.y)*py,(shot.t.x-shot.x)*px));
  if(shot.id==='echo'){
    c.strokeStyle='#ffc8ff';c.lineWidth=2;
    for(let i=0;i<3;i++){c.beginPath();c.ellipse(-i*px*.18,0,px*.16,(.26+i*.08)*px,0,-1.18,1.18);c.stroke();}
  }else{
    const warm=shot.id==='spark';
    const trail=c.createLinearGradient(-px*.87,0,0,0);
    trail.addColorStop(0,'transparent');
    trail.addColorStop(1,warm?'#ff9031':shot.id==='warden'?'#72ffed':'#eac78b');
    c.fillStyle=trail;c.beginPath();c.moveTo(-px,0);c.lineTo(0,-px*.13);c.lineTo(0,px*.13);c.fill();
    c.fillStyle=warm?'#fff499':shot.id==='warden'?'#d8ffff':'#fff2c6';
    c.beginPath();c.ellipse(0,0,px*.19,px*(warm?.15:.075),0,0,Math.PI*2);c.fill();
  }
  c.restore();
}
