/* Mapa Grzybów v233 — Radar v4 viewport-gap fix
 * LOD policy:
 *   zoom <= 9 : keep existing lightweight 5 km/v3 national radar
 *   zoom 10   : Radar v4 1 km; radius >=50 km gets presentation-only continuity smoothing
 *   zoom 11   : Radar v4 1 km
 *   zoom 12   : Radar v4 500 m when present, otherwise 1 km
 *   zoom >=13 : exact local BDL layer (Radar v4 hidden)
 *
 * This file does NOT modify biological scoring, weather, observations, hotspot math,
 * national-prior math, or any existing local feature scores. It only replaces the
 * visual national-radar transport/render path at medium zooms.
 */
(function(){
'use strict';

const V233={
  version:'v233-radar-v4-viewport-gap-fix',
  baseUrl:'./data/radar_v4',
  calibrationUrl:'./data/radar_v4/calibration.json',
  enabled:true,
  ready:false,
  failed:false,
  error:'',
  manifest:null,
  calibration:null,
  loader:null,
  canvas:null,
  requestSeq:0,
  last:null,
  stats:{refreshes:0,fallbacks:0,cellsLoaded:0,cellsDrawn:0,lastFetchMs:0,lastDrawMs:0}
};
window.__radarV4V233=V233;
window.__radarV4V232=V233;

if(typeof window.RadarV4!=='function'){
  console.warn('V233 RADAR V4: RadarV4 loader missing; keeping previous radar.');
  return;
}
if(typeof map==='undefined'){
  console.warn('V233 RADAR V4: Leaflet map binding unavailable; keeping previous radar.');
  return;
}

const previousRefresh=(typeof refreshNationalRadar==='function')?refreshNationalRadar:null;
const previousAudit=(typeof auditNationalRadar==='function')?auditNationalRadar:null;

function clamp01(v){v=Number(v);return Math.max(0,Math.min(1,Number.isFinite(v)?v:0));}
function smoothstep(a,b,x){if(!(b>a))return x>=b?1:0;const t=clamp01((x-a)/(b-a));return t*t*(3-2*t);}
function havKm(a,b){
  if(typeof hav==='function')return hav(a,b);
  const R=6371,toRad=Math.PI/180;
  const p1=Number(a[0])*toRad,p2=Number(b[0])*toRad,dp=(Number(b[0])-Number(a[0]))*toRad,dl=(Number(b[1])-Number(a[1]))*toRad;
  const h=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
  return 2*R*Math.asin(Math.min(1,Math.sqrt(h)));
}
function mapBoundsObject(){
  const b=map.getBounds();
  return {west:b.getWest(),east:b.getEast(),south:b.getSouth(),north:b.getNorth()};
}

function viewportSignature(b){
  // v233: the visible subset depends on the exact viewport, not only on the
  // set of 64x64 source tiles. Quantisation avoids meaningless float jitter.
  return [b.west,b.south,b.east,b.north].map(v=>Number(v).toFixed(5)).join(',');
}
function paddedViewportBounds(b){
  // Keep a small geographic apron around the viewport. This prevents a blank
  // strip while the Leaflet pane is moving; moveend still refreshes exact state.
  const dx=Math.min(.16,Math.max(.025,(b.east-b.west)*.07));
  const dy=Math.min(.10,Math.max(.018,(b.north-b.south)*.07));
  return {west:b.west-dx,east:b.east+dx,south:b.south-dy,north:b.north+dy};
}
function inSelectedAnalysis(cell){
  if(typeof ANALYSIS_CENTERS==='undefined'||!Array.isArray(ANALYSIS_CENTERS)||!ANALYSIS_CENTERS.length)return true;
  const radius=(typeof RADIUS_KM!=='undefined'&&Number.isFinite(Number(RADIUS_KM)))?Number(RADIUS_KM):Infinity;
  const c=[(cell.bounds.south+cell.bounds.north)/2,(cell.bounds.west+cell.bounds.east)/2];
  const pad=(Number(cell.cellMeters)||1000)/1000*.8;
  return ANALYSIS_CENTERS.some(a=>Array.isArray(a?.point)&&havKm(a.point,c)<=radius+pad);
}
function targetNow(){
  try{if(typeof nationalRadarTarget==='function')return nationalRadarTarget();}catch(_){ }
  return {kind:'overview',type:''};
}
function speciesLabel(type){
  try{if(typeof nationalRadarSpeciesLabel==='function')return nationalRadarSpeciesLabel(type);}catch(_){ }
  return V233.manifest?.species?.find(x=>x.id===type)?.label||type||'';
}
function rawUnits(cell,target){
  if(target.kind==='diversity')return Math.max(0,Math.round(Number(cell.diversity)||0));
  return Math.max(0,Math.round((Number(cell.raw)||0)*100));
}
function calibrationEntry(cellMeters,target){
  const l=V233.calibration?.lods?.[`${cellMeters}m`];if(!l)return null;
  if(target.kind==='species')return l.species?.[target.type]||null;
  if(target.kind==='diversity')return l.diversity||null;
  return l.overview||null;
}
function percentileFromEntry(entry,units){
  if(!entry||!Array.isArray(entry.counts)||!entry.counts.length)return NaN;
  if(!entry._prefix){
    const p=new Float64Array(entry.counts.length+1);let s=0;
    for(let i=0;i<entry.counts.length;i++){p[i]=s;s+=Number(entry.counts[i])||0;}
    p[entry.counts.length]=s;entry._prefix=p;entry._total=s;
  }
  const n=Number(entry._total)||0;if(n<=0)return NaN;
  const i=Math.max(0,Math.min(entry.counts.length-1,Math.round(units)));
  const less=entry._prefix[i],count=Number(entry.counts[i])||0;
  if(n<=1)return 1;
  if(count>0)return (less+(count-1)/2)/(n-1);
  // A quantized value absent from the country histogram: insertion percentile.
  return Math.max(0,Math.min(1,less/(n-1)));
}
function absoluteStrength(raw,target){
  try{if(typeof nationalRadarAbsoluteStrength==='function')return nationalRadarAbsoluteStrength(raw,target);}catch(_){ }
  if(!Number.isFinite(raw))return 0;
  if(target.kind==='diversity')return clamp01(raw/15);
  return clamp01((raw-4.6)/(8.9-4.6));
}
function visualInfo(cell,target,cellMeters){
  const raw=target.kind==='diversity'?Number(cell.diversity):Number(cell.raw);
  if(!Number.isFinite(raw))return null;
  const entry=calibrationEntry(cellMeters,target),pct=percentileFromEntry(entry,rawUnits(cell,target));
  if(!Number.isFinite(pct))return null;
  const absolute=absoluteStrength(raw,target);
  const visual=clamp01(.88*pct+.12*absolute);
  const coverage=Number(cell.coverage)||0,forest=Number(cell.forestHa)||0;
  const coverageFactor=.42+.58*Math.sqrt(clamp01(coverage/.42));
  const forestFactor=.48+.52*Math.sqrt(clamp01(forest/900));
  const relevance=clamp01(visual*coverageFactor*.75+visual*forestFactor*.25);
  return {raw,percentile:pct,absolute,visual,relevance,coverage,forest};
}
function colorFor(v){
  try{if(typeof nationalRadarColorVisual==='function')return nationalRadarColorVisual(v);}catch(_){ }
  const bands=(typeof UNIFIED_COLOR_BANDS!=='undefined'&&Array.isArray(UNIFIED_COLOR_BANDS)&&UNIFIED_COLOR_BANDS.length)
    ?UNIFIED_COLOR_BANDS:['#f2efe8','#e8dfd2','#d5c2b0','#d7b39d','#c78f72','#ca8850','#ae6a32','#a39f46','#718c41','#54ab5d','#2a914d','#116f38'];
  const p=clamp01((v-.10)/.90),i=Math.max(0,Math.min(bands.length-1,Math.floor(p*bands.length)));
  return bands[i]||bands[bands.length-1];
}
function opacityForV4(x,regional=false){
  // v232: do NOT reuse the legacy 5 km opacity curve here. At 1 km it was
  // making weak-but-valid forest cells fully transparent, producing holes.
  const v=clamp01(x.visual);
  const forestShare=clamp01((Number(x.forest)||0)/100); // 1 km cell = 100 ha
  const coverage=clamp01(Number(x.coverage)||0);
  const support=clamp01(Math.max(forestShare,coverage));
  if(!(support>0))return 0;
  const floor=regional?.10:.065;
  const span=regional?.34:.36;
  let a=(floor+span*smoothstep(.02,.98,v))*(.40+.60*Math.sqrt(support));
  return Math.max(.018,Math.min(.44,a));
}
function regionalModeNow(z){
  const radius=(typeof RADIUS_KM!=='undefined'&&Number.isFinite(Number(RADIUS_KM)))?Number(RADIUS_KM):0;
  return z===10&&radius>=50;
}
function smoothRegionalVisual(items){
  // Presentation-only smoothing. It never creates a cell where BDL says there
  // is no forest; it only softens score jumps between existing neighbouring
  // 1 km forest cells at the broad regional zoom.
  const by=new Map(items.map(it=>[`${it.cell.row}|${it.cell.col}`,it]));
  for(const it of items){
    let sum=0,w=0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      if(!dx&&!dy)continue;
      const n=by.get(`${it.cell.row+dy}|${it.cell.col+dx}`);if(!n)continue;
      const ww=(dx===0||dy===0)?1:.65;sum+=n.vi.visual*ww;w+=ww;
    }
    const neigh=w?sum/w:it.vi.visual;
    it.displayVisual=clamp01(.72*it.vi.visual+.28*neigh);
  }
  return items;
}

class RadarCanvasV233{
  constructor(){this.el=null;this.rows=[];this._bound=()=>this.draw();}
  ensure(){
    if(this.el)return;
    const pane=(typeof nationalRadarGroup!=='undefined'&&map.getPane('nationalRadarPane'))?map.getPane('nationalRadarPane'):map.getPanes().overlayPane;
    const c=L.DomUtil.create('canvas','radar-v4-canvas-v232',pane);
    c.style.position='absolute';c.style.pointerEvents='none';c.style.opacity='1';
    this.el=c;
    map.on('resize',this._bound);
  }
  setRows(rows){this.rows=rows||[];this.draw();}
  clear(){this.rows=[];if(this.el){const ctx=this.el.getContext('2d');ctx.clearRect(0,0,this.el.width,this.el.height);}}
  draw(){
    this.ensure();if(!this.el)return;
    const t0=performance.now(),size=map.getSize(),dpr=Math.max(1,Math.min(2,window.devicePixelRatio||1));
    const w=Math.max(1,Math.round(size.x)),h=Math.max(1,Math.round(size.y));
    if(this.el.width!==Math.round(w*dpr)||this.el.height!==Math.round(h*dpr)){
      this.el.width=Math.round(w*dpr);this.el.height=Math.round(h*dpr);this.el.style.width=w+'px';this.el.style.height=h+'px';
    }
    L.DomUtil.setPosition(this.el,map.containerPointToLayerPoint([0,0]));
    const ctx=this.el.getContext('2d',{alpha:true});ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    let drawn=0;
    for(const r of this.rows){
      if(!(r.opacity>0))continue;
      const sw=map.latLngToContainerPoint([r.bounds.south,r.bounds.west]);
      const ne=map.latLngToContainerPoint([r.bounds.north,r.bounds.east]);
      const x=Math.floor(sw.x)-.75,y=Math.floor(ne.y)-.75,rw=Math.ceil(ne.x-sw.x)+1.5,rh=Math.ceil(sw.y-ne.y)+1.5;
      if(x>w||y>h||x+rw<0||y+rh<0)continue;
      ctx.globalAlpha=r.opacity;ctx.fillStyle=r.color;ctx.fillRect(x,y,Math.max(1,rw),Math.max(1,rh));drawn++;
    }
    ctx.globalAlpha=1;
    V233.stats.cellsDrawn=drawn;V233.stats.lastDrawMs=performance.now()-t0;
  }
}

async function initV233(){
  if(V233.ready)return true;if(V233.failed)return false;
  try{
    const loader=new RadarV4(V233.baseUrl,{maxCacheEntries:160});
    const [manifest,calResp]=await Promise.all([
      loader.init(),
      fetch(V233.calibrationUrl,{cache:'default'})
    ]);
    if(!calResp.ok)throw new Error(`calibration HTTP ${calResp.status}`);
    const calibration=await calResp.json();
    if(calibration?.format!=='MapaGrzybowRadarV4Calibration')throw new Error('nieprawidłowy calibration.json');
    if(calibration.modelDigest&&manifest.modelDigest&&calibration.modelDigest!==manifest.modelDigest)throw new Error('modelDigest manifest/calibration niezgodny');
    V233.loader=loader;V233.manifest=manifest;V233.calibration=calibration;V233.canvas=new RadarCanvasV233();V233.ready=true;V233.error='';
    console.info('V233 RADAR V4 READY',{lods:loader.availableLods(),modelDigest:manifest.modelDigest,species:manifest.species?.length||0});
    return true;
  }catch(e){
    V233.failed=true;V233.error=e?.message||String(e);console.warn('V233 RADAR V4 unavailable; fallback to previous radar.',e);return false;
  }
}
function wantedLod(){
  const z=map.getZoom();
  if(z<=9)return {kind:'legacy'};
  if(z>=13)return {kind:'exact'};
  const lods=V233.loader?.availableLods?.()||[];
  if(z===12&&lods.includes(500))return {kind:'v4',cellMeters:500};
  if(lods.includes(1000))return {kind:'v4',cellMeters:1000};
  if(lods.length)return {kind:'v4',cellMeters:Math.min(...lods)};
  return {kind:'legacy'};
}
function hideOldRadar(){try{if(typeof nationalRadarGroup!=='undefined')nationalRadarGroup.clearLayers();}catch(_){ }}
function hideV4(){try{V233.canvas?.clear();}catch(_){ }}
function applyLegend(target){try{if(typeof nationalRadarApplyLegend==='function')nationalRadarApplyLegend(target);}catch(_){ }}
function hideLegendAtExact(){try{if(typeof updateScoreLegend==='function')updateScoreLegend();}catch(_){ }}

async function refreshV233(){
  const seq=++V233.requestSeq,V233Start=performance.now();V233.stats.refreshes++;
  const z=map.getZoom();
  if(z<=9){
    hideV4();V233.last={mode:'legacy',zoom:z};
    if(previousRefresh)return previousRefresh();
    return;
  }
  if(z>=13){
    hideV4();hideOldRadar();V233.last={mode:'exact-bdl',zoom:z,cells:0};
    try{nationalRadarLastKey='';nationalRadarLastCount=0;nationalRadarLastStats=null;}catch(_){ }
    hideLegendAtExact();return;
  }
  const ok=await initV233();
  if(!ok){V233.stats.fallbacks++;if(previousRefresh)return previousRefresh();return;}
  const mode=wantedLod();
  if(mode.kind!=='v4'){V233.stats.fallbacks++;if(previousRefresh)return previousRefresh();return;}
  const target=targetNow();
  if(target.kind==='species'&&!V233.manifest.species?.some(s=>s.id===target.type)){
    // edge/grassland species are intentionally absent from the BDL-only radar.
    V233.stats.fallbacks++;hideV4();if(previousRefresh)return previousRefresh();return;
  }
  const viewport=mapBoundsObject(),loadBounds=paddedViewportBounds(viewport),tileKeys=V233.loader.tileKeysForBounds(loadBounds,mode.cellMeters);
  const viewportSig=viewportSignature(viewport);
  const key=`v233|${mode.cellMeters}|${target.kind}|${target.type||''}|z${z}|${tileKeys.map(t=>t.y+','+t.x).join(';')}|r${typeof RADIUS_KM!=='undefined'?RADIUS_KM:''}|b${viewportSig}`;
  // IMPORTANT v233: v232 keyed only by tile IDs. Panning inside the same tile set
  // reused a cell list clipped to the OLD viewport and could leave a straight blank strip.
  // We may skip only when the actual viewport signature is unchanged.
  try{if(key===nationalRadarLastKey&&nationalRadarLastCount>0){V233.canvas?.draw();applyLegend(target);return;}}catch(_){ }
  try{
    const f0=performance.now();
    const cells=await V233.loader.loadViewport({cellMeters:mode.cellMeters,bounds:loadBounds,speciesId:target.kind==='species'?target.type:null,overview:target.kind!=='species'});
    if(seq!==V233.requestSeq)return;
    V233.stats.lastFetchMs=performance.now()-f0;V233.stats.cellsLoaded=cells.length;
    const regional=regionalModeNow(z),items=[];let top10=0;
    for(const cell0 of cells){
      const cell={...cell0,cellMeters:mode.cellMeters};if(!inSelectedAnalysis(cell))continue;
      const vi=visualInfo(cell,target,mode.cellMeters);if(!vi)continue;
      items.push({cell,vi,displayVisual:vi.visual});if(vi.percentile>=.90)top10++;
    }
    if(regional)smoothRegionalVisual(items);
    const rows=[];
    for(const it of items){
      const shownVi={...it.vi,visual:it.displayVisual};
      const opacity=opacityForV4(shownVi,regional);if(!(opacity>0))continue;
      rows.push({bounds:it.cell.bounds,opacity,color:colorFor(it.displayVisual),...it.vi,displayVisual:it.displayVisual});
    }
    hideOldRadar();V233.canvas.setRows(rows);
    const stats={
      n:cells.length,shown:rows.length,top10,target:target.kind==='species'?target.type:target.kind,
      lodMeters:mode.cellMeters,tiles:tileKeys.length,viewportSig,viewportPadding:true,regionalContinuity:regional,fetchMs:V233.stats.lastFetchMs,drawMs:V233.stats.lastDrawMs,
      bytes:V233.loader.stats.bytes,requests:V233.loader.stats.requests,cacheHits:V233.loader.stats.cacheHits
    };
    try{
      nationalRadarLastKey=key;nationalRadarLastCount=rows.length;nationalRadarLastStats=stats;nationalRadarLastError='';
    }catch(_){ }
    V233.last={mode:'v4',zoom:z,target,lodMeters:mode.cellMeters,cells:cells.length,shown:rows.length,tiles:tileKeys.length,viewportSig,viewportPadding:true,regionalContinuity:regional,continuityRule:regional?'3x3 existing-forest smoothing + visible weak cells':'visible weak forest cells',totalMs:performance.now()-V233Start};
    applyLegend(target);
    console.debug('V233 RADAR V4 RENDER',V233.last);
  }catch(e){
    if(seq!==V233.requestSeq)return;
    V233.error=e?.message||String(e);V233.stats.fallbacks++;hideV4();
    console.warn('V233 RADAR V4 render failed; fallback to previous radar.',e);
    if(previousRefresh)return previousRefresh();
  }
}

async function auditV233(){
  const ok=await initV233();
  const report={
    version:V233.version,available:ok,error:V233.error,ready:V233.ready,
    lods:V233.loader?.availableLods?.()||[],modelDigest:V233.manifest?.modelDigest||null,
    species:V233.manifest?.species?.length||0,last:V233.last,loaderStats:V233.loader?{...V233.loader.stats,cacheEntries:V233.loader.cache.size}:null,
    stats:{...V233.stats},fallbackPreserved:!!previousRefresh,
    policy:'z<=9 legacy 5km; z10 v4 1km regional continuity for radius>=50km; z11 v4 1km; z12 v4 500m if available else 1km; z>=13 exact BDL; v233 viewport-key + padded viewport refresh',
    calibration:V233.calibration?{format:V233.calibration.format,version:V233.calibration.version,method:V233.calibration.method}:null,
    note:'v233 fixes a renderer/cache bug from v232: the visible cell subset was cached by tile IDs only, so a pan inside the same tile set could reuse cells clipped to the old viewport and leave a blank strip. v233 keys by viewport bounds and loads a small padded apron; tile binaries still come from cache. Biology, DZIŚ, observations, hotspot math and national-prior math are unchanged.'
  };
  console.info('V233 RADAR V4 AUDIT',report);return report;
}
window.auditRadarV4V233=auditV233;
window.auditRadarV4V232=auditV233;
window.auditRadarV4V231=auditV233;

// Rebind the existing scheduler target. Existing render()/species UI calls continue to work.
try{refreshNationalRadar=refreshV233;}catch(e){console.warn('V233: cannot rebind refreshNationalRadar',e);return;}
try{
  auditNationalRadar=function(){return auditV233();};
  window.auditNationalRadar=auditNationalRadar;
}catch(_){window.auditNationalRadar=auditV233;}

// The old code refreshed only after zoom changes. Tiled data must also follow pan/drag.
map.on('moveend',()=>{
  try{
    if(typeof scheduleNationalRadarRefresh==='function')scheduleNationalRadarRefresh();
    else refreshV233().catch(()=>{});
  }catch(_){ }
});

// Warm manifest/calibration after the page settles, without blocking first paint.
const warm=()=>initV233().then(()=>refreshV233()).catch(()=>{});
if('requestIdleCallback' in window)requestIdleCallback(warm,{timeout:1800});else setTimeout(warm,900);

})();
