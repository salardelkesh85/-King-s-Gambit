'use strict';
// Directional textures share a foot pivot with the combat rig. The near surface
// of a curved ribbon supplies parallax between the four painted orientations.
const FighterArt = (() => {
  const sheets = new Map();
  const cell=104;
  function getSheet(id,view){
    const key=id+'/'+view;
    if(!sheets.has(key)){
      const image=new Image();
      image.src='art/cycles/'+view+'/'+id+'.webp';
      sheets.set(key,image);
    }
    return sheets.get(key);
  }
  function draw(c,u,time,size) {
    const yaw=u.heading ?? (u.team?0:Math.PI);
    const quarter=Math.round(yaw/(Math.PI/2));
    const direction=((quarter%4)+4)%4;
    const side=direction===1 || direction===3;
    const atlas=getSheet(u.id,side?'side':direction===2?'back':'front');
    if(!atlas.naturalWidth)return false;

    const gait=u.id==='falcon'?time*1.9+(u.phase||0):(u.travel||0)/(stride[u.id]||1);
    const moving=u.moving || u.id==='falcon';
    let frame=moving?Math.floor(gait*16)%16:(side?4:8);
    let row=u.team*4;
    if(u.attack>0 || u.wind>0){
      row+=2;
      if(u.attack>0)frame=8+Math.min(7,Math.floor(8*(1-u.attack/.23)));
      else frame=Math.min(7,Math.floor(8*u.wind/tacticsFor(u).windup));
    }
    const sx=cell*(frame%8),sy=cell*(row+Math.floor(frame/8));
    const angle=yaw-quarter*Math.PI/2;
    const scale=Math.cos(angle);
    // Keep an anatomical left/right orientation, including asymmetric weapons.
    const mirror=direction===3?-1:1;
    c.save();c.scale(mirror,1);
    const lift=moving&&u.id!=='falcon'?Math.sin(gait*2*Math.PI)**2*size*.018:0;
    c.translate(0,-lift);
    if(Math.abs(angle)<.025){
      c.drawImage(atlas,sx,sy,cell,cell,-size/2,-size,size,size);
    }else{
      const skew=Math.sin(angle)*mirror;
      const edge=x=>size*(x*scale+.17*skew*(1-4*x*x));
      // Contiguous texture strips approximate the projected surface without
      // reading back the canvas, including on file-origin Android WebViews.
      for(let i=0;i<13;i++){
        const left=edge(i/13-.5),right=edge((i+1)/13-.5);
        c.drawImage(atlas,sx+i*8,sy,8,cell,left,-size,right-left+.25,size);
      }
    }
    c.restore();return true;
  }
  return {draw};
})();
