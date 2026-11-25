'use strict';
// Directional textures share a foot pivot with the combat rig. The near surface
// of a curved ribbon supplies parallax between the four painted orientations.
const FighterArt = (() => {
  const sheets = new Map();
  for (const id of starters) {
    const views = {};
    for (const view of ['motion','facing']) {
      const image = new Image();
      image.src = 'art/'+view+'/'+id+'.webp';
      views[view] = image;
    }
    sheets.set(id, views);
  }

  function draw(c,u,time,size) {
    const views=sheets.get(u.id);
    if(!views)return false;
    const yaw=u.heading ?? (u.team?0:Math.PI);
    const quarter=Math.round(yaw/(Math.PI/2));
    const direction=((quarter%4)+4)%4;
    const side=direction===1 || direction===3;
    const atlas=side?views.motion:views.facing;
    if(!atlas.naturalWidth)return false;

    const gait=u.id==='falcon'?time*1.9+(u.phase||0):(u.travel||0)/(stride[u.id]||1);
    const moving=u.moving || u.id==='falcon';
    let frame=moving?Math.floor(gait*(side?4:2))%(side?4:2):1;
    let row=side?0:(direction===2?1:0);
    if(u.attack>0 || u.wind>0){
      if(side){
        row=1;
        if(u.attack>0)frame=u.attack>.10?2:3;
        else frame=u.wind<tacticsFor(u).windup*.45?0:1;
      }else frame=u.attack>0?3:2;
    }
    const sx=128*frame, sy=128*(row+u.team*2);
    const angle=yaw-quarter*Math.PI/2;
    const scale=Math.cos(angle);
    // Keep an anatomical left/right orientation, including asymmetric weapons.
    const mirror=direction===3?-1:1;
    c.save();c.scale(mirror,1);
    const lift=moving&&u.id!=='falcon'?Math.sin(gait*2*Math.PI)**2*size*.018:0;
    c.translate(0,-lift);
    if(Math.abs(angle)<.025){
      c.drawImage(atlas,sx,sy,128,128,-size/2,-size,size,size);
    }else{
      const skew=Math.sin(angle)*mirror;
      const edge=x=>size*(x*scale+.17*skew*(1-4*x*x));
      // Contiguous texture strips approximate the projected surface without
      // reading back the canvas, including on file-origin Android WebViews.
      for(let i=0;i<16;i++){
        const left=edge(i/16-.5),right=edge((i+1)/16-.5);
        c.drawImage(atlas,sx+i*8,sy,8,128,left,-size,right-left+.25,size);
      }
    }
    c.restore();return true;
  }
  return {draw};
})();
