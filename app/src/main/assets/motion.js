'use strict';
const stride = {scout:1.5, guard:1.1, ram:1.8, echo:1.25, spark:1.2, bandit:1.45, warden:1.12};
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
