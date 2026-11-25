// Articulated local-space meshes. Forward is +Z, the arena camera looks down from +Z.
const Figures = (() => {
  const TAU=Math.PI*2, cell=96, cache=new Map(), rigs=new Map();
  const gold=0xe6ae4f, dark=0x342737, steel=0xb9d2d3, bronze=0xb87e40, skin=0xe4ac79;
  const I=[1,0,0,0,1,0,0,0,1,0,0,0];
  function matrix(x,y,z,rx=0,ry=0,rz=0){
    const a=Math.cos(rx),b=Math.sin(rx),c=Math.cos(ry),d=Math.sin(ry),e=Math.cos(rz),f=Math.sin(rz);
    return [e*c,e*d*b-f*a,e*d*a+f*b,f*c,f*d*b+e*a,f*d*a-e*b,-d,c*b,c*a,x,y,z];
  }
  function combine(a,b){
    const m=[];
    for(let r=0;r<3;r++)for(let c=0;c<3;c++)m[r*3+c]=a[r*3]*b[c]+a[r*3+1]*b[c+3]+a[r*3+2]*b[c+6];
    for(let r=0;r<3;r++)m[9+r]=a[9+r]+a[3*r]*b[9]+a[3*r+1]*b[10]+a[3*r+2]*b[11];
    return m;
  }
  function surface(rings,n=12){
    const points=[],faces=[];
    for(const [y,rad] of rings)for(let i=0;i<n;i++){const a=TAU*i/n;points.push([Math.sin(a)*rad,y,Math.cos(a)*rad]);}
    for(let j=1;j<rings.length;j++)for(let i=0;i<n;i++){
      const a=(j-1)*n+i,b=(j-1)*n+(i+1)%n;
      faces.push([a,b,a+n],[b,b+n,a+n]);
    }
    return {points,faces};
  }
  const orb=surface(Array.from({length:8},(_,i)=>{const a=Math.PI*i/7;return [-Math.cos(a),Math.sin(a)];}));
  const tube=surface([[-1,0],[-.99,.84],[-.78,1],[.78,1],[.99,.84],[1,0]]);
  const cone=surface([[-1,0],[-.96,1],[1,.025]]);
  const bell=surface([[-1,0],[-1,.21],[-.2,.34],[.55,.61],[.94,1],[1,.94],[.60,.64],[.1,.21]]);
  function makeRig(id,team){
    const nodes=[],parts=[];
    function joint(parent,x,y,z,name=''){nodes.push({parent,x,y,z,name});return nodes.length-1;}
    function part(node,geo,x,y,z,sx,sy,sz,color,rx=0,ry=0,rz=0){
      const m=matrix(x,y,z,rx,ry,rz);
      const pts=geo.points.map(([a,b,c])=>[x+m[0]*a*sx+m[1]*b*sy+m[2]*c*sz,y+m[3]*a*sx+m[4]*b*sy+m[5]*c*sz,z+m[6]*a*sx+m[7]*b*sy+m[8]*c*sz]);
      parts.push({node,pts,faces:geo.faces,color});
    }
    const o=(...v)=>part(v[0],orb,...v.slice(1)), t=(...v)=>part(v[0],tube,...v.slice(1)), k=(...v)=>part(v[0],cone,...v.slice(1));
    const cloth=team?0xbc374a:({spark:0xa42f70,warden:0x218b88,bandit:0xd49938,echo:0x8648a7}[id]||0x275baa);
    const accent=team?0xf18561:0x48cad4;
    const root=joint(-1,0,0,0,'root');
    if(id==='falcon'){
      o(root,0,1,0,.25,.28,.54,0xd9ac65);o(root,0,1.23,.40,.23,.24,.24,0xffe5a3);
      k(root,0,1.18,.64,.12,.18,.12,gold,Math.PI/2);
      for(const side of [-1,1]){
        o(root,side*.16,1.28,.54,.052,.050,.04,dark);
        const wing=joint(root,side*.16,1.13,0,'wing'+side);
        o(wing,side*.28,0,0,.42,.10,.34,cloth);
        for(let i=0;i<5;i++)o(wing,side*(.48+i*.09),-.035,i*.094-.29,.46-i*.023,.058,.09,i%2?0xe5c782:0xffedb6,0,side*(.2+i*.12));
        k(root,side*.10,.78,.09,.055,.12,.055,gold,Math.PI);
      }
      for(let i=-1;i<=1;i++)o(root,i*.09,.95,-.52,.11,.05,.35,0xa27445,0,i*.15);
    }else if(id==='ram'){
      o(root,0,.83,-.04,.44,.41,.69,bronze);o(root,0,1.04,-.11,.42,.28,.54,cloth);
      const head=joint(root,0,1,.47,'head');
      o(head,0,.10,.16,.36,.32,.34,bronze);o(head,0,-.03,.43,.25,.18,.21,0x72513e);
      for(const s of [-1,1]){
        for(let i=0;i<8;i++){const a=i*.47;o(head,s*(.30+.11*Math.sin(a)),.18+.22*Math.cos(a),.10+.25*Math.sin(a),.11-i*.006,.12-i*.006,.115-i*.006,i%2?accent:gold);}
        o(head,s*.22,.14,.40,.056,.050,.04,0xffda62);
        for(const fore of [-1,1]){
          const leg=joint(root,s*.27,.68,fore*.37,'leg'+(s*fore));
          t(leg,0,-.18,0,.095,.22,.10,bronze);
          o(leg,0,-.36,0,.12,.11,.12,gold);
          t(leg,0,-.51,0,.083,.16,.087,dark);o(leg,0,-.64,.04,.12,.075,.14,bronze);
        }
      }
    }else{
      const stout=id==='guard'?1.21:1,body=joint(root,0,.79,0,'body');
      for(const s of [-1,1]){
        const leg=joint(root,s*.18,.81,0,'leg'+s);
        o(leg,0,-.16,0,.16,.24,.17,0x926b51);
        const shin=joint(leg,0,-.34,0,'knee'+s);
        t(shin,0,-.14,0,.126,.17,.13,0x674635);
        o(shin,0,-.29,.06,.145,.095,.205,0x553c36);
      }
      k(body,0,.13,0,.41*stout,.34,.32,cloth);
      o(body,0,.38,0,.40*stout,.37,.27,cloth);t(body,0,.16,0,.38*stout,.064,.285,0x694733);
      o(body,0,.16,.293,.086,.069,.025,gold);
      // Gold-edged cloak gives the rear view a different silhouette from the breastplate.
      o(body,0,.29,-.24,.38*stout,.49,.10,gold,-.19);
      o(body,0,.31,-.266,.35*stout,.46,.10,cloth,-.19);
      // A heraldic lozenge and two bands remain readable on the cape at phone scale.
      o(body,0,.33,-.365,.105,.13,.024,gold);
      o(body,0,.34,-.385,.055,.074,.012,accent);
      for(const s of [-1,1])o(body,s*.13,.03,-.317,.13,.024,.021,gold,0,0,s*.22);
      const head=joint(body,0,.78,0,'head');
      o(head,0,.045,.015,.335,.35,.306,skin);
      o(head,0,.07,-.094,.34,.32,.248,id==='echo'?0x57bda7:dark);
      o(head,0,.018,.299,.063,.076,.072,skin);
      for(const s of [-1,1]){
        o(head,s*.135,.076,.278,.069,.044,.029,0xfff0dc);
        o(head,s*.135,.075,.303,.030,.035,.019,dark);
        o(head,s*.139,.14,.274,.095,.028,.036,dark,0,0,s*.13);
      }
      if(id==='warden'||id==='guard')k(head,0,-.141,.16,.25,.20,.17,id==='warden'?0xeee4c9:dark,Math.PI);
      o(head,0,.31,-.015,.372,.23,.335,id==='echo'?0x6dceb5:cloth);
      t(head,0,.254,0,.357,.043,.324,gold,0,0,.10);
      o(head,-.09,.35,-.04,.29,.074,.30,cloth,0,0,.24);
      o(head,0,-.096,.27,.065,.018,.023,0x925b46);
      o(head,0,.31,.327,.073,.10,.035,accent);
      if(id==='echo')o(head,-.18,.12,-.24,.16,.25,.16,0x66d1b1);
      if(id==='spark'||id==='warden')k(head,0,.48,-.054,.29,.25,.26,cloth,-.26);
      if(id==='guard'||id==='scout')o(head,0,.55,-.10,.084,.26,.10,accent,-.55);
      for(const s of [-1,1]){
        const arm=joint(body,s*.36*stout,.58,0,'arm'+s);
        o(arm,0,-.08,0,.168,.19,.16,id==='guard'?gold:cloth);
        if(id==='guard')o(arm,s*.02,-.04,.023,.177,.11,.17,cloth);
        const elbow=joint(arm,0,-.23,0,'elbow'+s);
        t(elbow,0,-.10,0,.09,.13,.095,skin);
        t(elbow,0,-.14,0,.105,.042,.106,gold);
        o(elbow,0,-.23,.022,.118,.111,.118,skin);
        if(s===-1&&id==='guard'){
          o(elbow,-.015,-.17,.17,.29,.335,.075,gold);
          o(elbow,-.015,-.17,.209,.25,.29,.061,cloth);o(elbow,-.015,-.17,.274,.09,.11,.05,gold);
          for(let i=0;i<8;i++){const a=TAU*i/8;o(elbow,-.015+.178*Math.cos(a),-.17+.22*Math.sin(a),.25,.027,.033,.018,gold);}
        }
        if(s===1||id==='bandit'){
          if(id==='echo'){
            part(elbow,bell,.02,-.20,.31,.29,.37,.29,gold,Math.PI/2);
            o(elbow,.02,-.2,.64,.22,.22,.036,0x774b2b);
          }else if(id==='warden'){
            t(elbow,.015,-.15,.11,.043,.69,.043,bronze);o(elbow,.015,.55,.11,.13,.18,.13,accent);
          }else if(id==='spark'){
            o(elbow,0,-.21,.19,.12,.15,.12,0xff962d);k(elbow,0,-.075,.19,.09,.14,.09,0xffdc62);
          }else{
            t(elbow,0,-.21,.20,.046,.20,.046,bronze,Math.PI/2);
            if(id==='guard')o(elbow,0,-.21,.46,.149,.15,.18,gold);
            else {t(elbow,0,-.21,.28,.15,.025,.04,gold,Math.PI/2);k(elbow,0,-.20,.53,.10,.26,.03,steel,Math.PI/2);}
          }
        }
      }
    }
    return {nodes,parts};
  }
  const depth=new Float32Array(cell*cell);
  function bake(rig,angle,phase,mode,id){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=cell;
    const ctx=canvas.getContext('2d'),img=ctx.createImageData(cell,cell),rgba=img.data;
    depth.fill(-Infinity);
    const matrices=[],cycle=phase*TAU,walk=mode==='walk'?Math.sin(cycle):0;
    const swing=mode==='strike'?Math.sin(Math.PI*phase):0;
    const ready=mode==='wind'?phase:0;
    for(const joint of rig.nodes){
      const {name}=joint,s=name.endsWith('-1')?-1:1;
      let rx=0,ry=0,rz=0,dy=0;
      if(name==='root'){ry=angle;dy=mode==='walk'?.055*Math.abs(walk):0;rx=.08*swing;}
      if(name.startsWith('leg'))rx=s*walk*.57;
      if(name.startsWith('knee'))rx=.10+Math.max(0,-s*walk)*.53;
      if(name==='body'){ry=-.10*walk+.43*ready-.52*swing;rx=-.13*ready+.17*swing;}
      if(name==='head')rx=id==='ram'?-.14*ready+.44*swing:-.07*swing;
      if(name.startsWith('arm')){rx=-s*walk*.43;rz=s*.12;
        if(id==='echo'||id==='warden')rx-=.36;
        if(s===1||id==='bandit')rx+=.86*ready-1.45*swing;
        else if(id==='guard')rx-=.35+.43*ready;
      }
      if(name.startsWith('elbow'))rx=-.29-.22*Math.max(0,s*walk)-.60*ready;
      if(name.startsWith('wing'))rz=s*(mode==='wind'?.95*ready:mode==='strike'?-.86*swing:.68*Math.sin(cycle));
      matrices.push(combine(joint.parent<0?I:matrices[joint.parent],matrix(joint.x,joint.y+dy,joint.z,rx,ry,rz)));
    }
    const scale=id==='falcon'?35:id==='ram'?39:34;
    for(const part of rig.parts){
      const m=matrices[part.node];
      const pts=part.pts.map(([a,b,c])=>{
        const x=m[0]*a+m[1]*b+m[2]*c+m[9],y=m[3]*a+m[4]*b+m[5]*c+m[10],z=m[6]*a+m[7]*b+m[8]*c+m[11];
        return [48+scale*x,84-scale*(.91*y-.415*z),scale*(.415*y+.91*z)];
      });
      const color=part.color;
      for(const [i,j,k] of part.faces){
        const [ax,ay,az]=pts[i],[bx,by,bz]=pts[j],[cx,cy,cz]=pts[k];
        const ux=bx-ax,uy=by-ay,uz=bz-az,vx=cx-ax,vy=cy-ay,vz=cz-az;
        const area=ux*vy-uy*vx;if(area>=-.003)continue;
        const nx=uz*vy-uy*vz,ny=ux*vz-uz*vx,nz=-area;
        const len=Math.sqrt(nx*nx+ny*ny+nz*nz);
        const light=.59+.49*Math.max(0,(-.45*nx-.70*ny+.55*nz)/len)+.07*nz/len;
        const red=((color>>16)&255)*light,green=((color>>8)&255)*light,blue=(color&255)*light;
        const left=Math.max(0,Math.ceil(Math.min(ax,bx,cx))),right=Math.min(95,Math.floor(Math.max(ax,bx,cx)));
        const top=Math.max(0,Math.ceil(Math.min(ay,by,cy))),bottom=Math.min(95,Math.floor(Math.max(ay,by,cy)));
        const inv=1/area;
        for(let row=top;row<=bottom;row++){
          for(let col=left;col<=right;col++){
            const dx=col-ax,dy=row-ay,u=(dx*vy-dy*vx)*inv,v=(ux*dy-uy*dx)*inv;
            if(u<0||v<0||u+v>1)continue;
            const d=az+u*uz+v*vz,index=row*cell+col;if(d<=depth[index])continue;
            depth[index]=d;const p=index*4;rgba[p]=red;rgba[p+1]=green;rgba[p+2]=blue;rgba[p+3]=255;
          }
        }
      }
    }
    ctx.putImageData(img,0,0);return canvas;
  }
  function draw(c,u,time,size){
    if(FighterArt.draw(c,u,time,size))return;
    const dir=((Math.round((u.heading??(u.team?0:Math.PI))*16/TAU)%16)+16)%16;
    let mode='idle',phase=0;
    if(u.attack>0){mode='strike';phase=1-u.attack/.23;}
    else if(u.wind>0){mode='wind';phase=u.wind/tacticsFor(u).windup;}
    else if(u.moving||u.id==='falcon'){mode='walk';phase=u.id==='falcon'?time*1.8+u.phase:(u.travel||0)/(stride[u.id]||1);}
    const step=mode==='walk'?Math.floor(phase*8)%8:Math.min(7,Math.max(0,Math.round(phase*7)));
    const model=u.id+u.team,key=model+':'+dir+':'+mode+step;
    let frame=cache.get(key);
    if(!frame){
      if(!rigs.has(model))rigs.set(model,makeRig(u.id,u.team));
      frame=bake(rigs.get(model),dir*TAU/16,mode==='walk'?step/8:step/7,mode,u.id);
      if(cache.size>=320)cache.delete(cache.keys().next().value);cache.set(key,frame);
    }
    c.drawImage(frame,-size*.5,-size*84/cell,size,size);
  }
  function turn(u,dx,dy,dt){
    if(Math.hypot(dx,dy)<.001)return;
    const desired=Math.atan2(dx,dy),current=u.heading??(u.team?0:Math.PI);
    const delta=Math.atan2(Math.sin(desired-current),Math.cos(desired-current));
    u.heading=current+Math.max(-dt*10,Math.min(dt*10,delta));
  }
  return {draw,turn};
})();
