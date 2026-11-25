'use strict';
// Original, short combat cues mixed locally; no streaming or network latency.
const BattleAudio=(()=>{
  const clips=new Map(),active=new Set(),last=new Map();
  let context,bus,muted=localStorage.getItem('kg-muted')==='1';
  const tau=Math.PI*2;
  function open(){
    try{
      if(!context){
        context=new AudioContext();
        const limiter=context.createDynamicsCompressor();
        bus=context.createGain();bus.gain.value=muted?0:.48;
        limiter.threshold.value=-15;limiter.ratio.value=6;
        bus.connect(limiter);limiter.connect(context.destination);
      }
      context.resume().catch(()=>{});
    }catch{}
  }
  // [fundamental, duration, metallic partial, air/noise, decay, pitch drop]
  const voices={
    guard:[108,.27,3.81,.32,12,.48], ram:[67,.31,2.61,.46,11,.52],
    scout:[660,.13,1.63,.73,21,.59], bandit:[860,.14,1.77,.81,24,.58],
    falcon:[910,.16,1.22,.52,19,.38], echo:[207,.32,2,.12,6,.12],
    spark:[388,.23,2.7,.63,12,.46], warden:[470,.30,1.50,.08,8,-.16],
    tower:[153,.12,3.43,.71,24,.31], windcatcher:[324,.20,1.47,.48,11,-.15],
    impact:[114,.12,3.16,.56,27,.55], wall:[82,.23,2.78,.70,17,.43],
    collapse:[55,.60,2.42,.80,6,.72], deploy:[390,.13,1.5,.04,18,-.2],
    storm:[120,.38,2.37,.83,9,.57], blast:[76,.36,2.91,.89,10,.58]
  };
  function buffer(name){
    if(clips.has(name))return clips.get(name);
    const [hz,seconds,partial,air,decay,drop]=voices[name];
    const rate=22050,b=context.createBuffer(1,Math.ceil(rate*seconds),rate),samples=b.getChannelData(0);
    let phase=0,seed=12345,filtered=0;
    for(let i=0;i<samples.length;i++){
      const t=i/rate,p=t/seconds;
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;
      const noise=seed/2147483648-1;filtered+=.23*(noise-filtered);
      phase+=tau*hz*(1-drop*p)/rate;
      let tone=Math.sin(phase)+.40*Math.sin(phase*partial)*Math.exp(-5*t);
      if(name==='echo')tone+=.43*Math.sin(3*phase)+.19*Math.sin(4*phase);
      const breath=name==='scout'||name==='bandit'||name==='falcon'?noise-filtered:filtered*2;
      const envelope=Math.min(1,t/.006)*Math.exp(-decay*t)*Math.min(1,(seconds-t)/.025);
      samples[i]=envelope*((1-air)*tone*.65+air*breath);
    }
    clips.set(name,b);return b;
  }
  function play(name,x=9,level=1){
    if(!context||context.state!=='running'||muted||!voices[name]||document.hidden)return;
    const now=context.currentTime;
    if(now-(last.get(name)??-1)<.038||active.size>=16)return;
    last.set(name,now);
    const src=context.createBufferSource(),amp=context.createGain();
    src.buffer=buffer(name);src.playbackRate.value=.96+Math.random()*.08; amp.gain.value=level;
    const pan=context.createStereoPanner?.();src.connect(amp);
    if(pan){pan.pan.value=Math.max(-.7,Math.min(.7,(x-9)/13));amp.connect(pan);pan.connect(bus);}else amp.connect(bus);
    active.add(src);src.onended=()=>{active.delete(src);src.disconnect();amp.disconnect();pan?.disconnect();};src.start();
  }
  function stop(){for(const src of active)src.stop();last.clear();}
  function toggle(){muted=!muted;localStorage.setItem('kg-muted',muted?'1':'0');open();if(bus)bus.gain.value=muted?0:.48;if(muted)stop();else play('deploy');}
  return {open,play,stop,toggle,get muted(){return muted;}};
})();
