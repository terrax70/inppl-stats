/* Mapa Grzybów v232 — Radar v4 regional continuity fix
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

const V232={
  version:'v232-radar-v4-regional-continuity',
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
window.__radarV4V232=V232;

if(typeof window.RadarV4!=='function'){
  console.warn('V232 RADAR V4: RadarV4 loader missing; keeping previous radar.');
  return;
}
if(typeof map==='undefined'){
  console.warn('V232 RADAR V4: Leaflet map binding unavailable; keeping previous radar.');
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
  return V232.manifest?.species?.find(x=>x.id===type)?.label||type||'';
}
function rawUnits(cell,target){
  if(target.kind==='diversity')return Math.max(0,Math.round(Number(cell.diversity)||0));
  return Math.max(0,Math.round((Number(cell.raw)||0)*100));
}
function calibrationEntry(cellMeters,target){
  const l=V232.calibration?.lods?.[`${cellMeters}m`];if(!l)return null;
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

class RadarCanvasV232{
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
    V232.stats.cellsDrawn=drawn;V232.stats.lastDrawMs=performance.now()-t0;
  }
}

async function initV232(){
  if(V232.ready)return true;if(V232.failed)return false;
  try{
    const loader=new RadarV4(V232.baseUrl,{maxCacheEntries:160});
    const [manifest,calResp]=await Promise.all([
      loader.init(),
      fetch(V232.calibrationUrl,{cache:'default'})
    ]);
    if(!calResp.ok)throw new Error(`calibration HTTP ${calResp.status}`);
    const calibration=await calResp.json();
    if(calibration?.format!=='MapaGrzybowRadarV4Calibration')throw new Error('nieprawidłowy calibration.json');
    if(calibration.modelDigest&&manifest.modelDigest&&calibration.modelDigest!==manifest.modelDigest)throw new Error('modelDigest manifest/calibration niezgodny');
    V232.loader=loader;V232.manifest=manifest;V232.calibration=calibration;V232.canvas=new RadarCanvasV232();V232.ready=true;V232.error='';
    console.info('V232 RADAR V4 READY',{lods:loader.availableLods(),modelDigest:manifest.modelDigest,species:manifest.species?.length||0});
    return true;
  }catch(e){
    V232.failed=true;V232.error=e?.message||String(e);console.warn('V232 RADAR V4 unavailable; fallback to previous radar.',e);return false;
  }
}
function wantedLod(){
  const z=map.getZoom();
  if(z<=9)return {kind:'legacy'};
  if(z>=13)return {kind:'exact'};
  const lods=V232.loader?.availableLods?.()||[];
  if(z===12&&lods.includes(500))return {kind:'v4',cellMeters:500};
  if(lods.includes(1000))return {kind:'v4',cellMeters:1000};
  if(lods.length)return {kind:'v4',cellMeters:Math.min(...lods)};
  return {kind:'legacy'};
}
function hideOldRadar(){try{if(typeof nationalRadarGroup!=='undefined')nationalRadarGroup.clearLayers();}catch(_){ }}
function hideV4(){try{V232.canvas?.clear();}catch(_){ }}
function applyLegend(target){try{if(typeof nationalRadarApplyLegend==='function')nationalRadarApplyLegend(target);}catch(_){ }}
function hideLegendAtExact(){try{if(typeof updateScoreLegend==='function')updateScoreLegend();}catch(_){ }}

async function refreshV232(){
  const seq=++V232.requestSeq,V232Start=performance.now();V232.stats.refreshes++;
  const z=map.getZoom();
  if(z<=9){
    hideV4();V232.last={mode:'legacy',zoom:z};
    if(previousRefresh)return previousRefresh();
    return;
  }
  if(z>=13){
    hideV4();hideOldRadar();V232.last={mode:'exact-bdl',zoom:z,cells:0};
    try{nationalRadarLastKey='';nationalRadarLastCount=0;nationalRadarLastStats=null;}catch(_){ }
    hideLegendAtExact();return;
  }
  const ok=await initV232();
  if(!ok){V232.stats.fallbacks++;if(previousRefresh)return previousRefresh();return;}
  const mode=wantedLod();
  if(mode.kind!=='v4'){V232.stats.fallbacks++;if(previousRefresh)return previousRefresh();return;}
  const target=targetNow();
  if(target.kind==='species'&&!V232.manifest.species?.some(s=>s.id===target.type)){
    // edge/grassland species are intentionally absent from the BDL-only radar.
    V232.stats.fallbacks++;hideV4();if(previousRefresh)return previousRefresh();return;
  }
  const bounds=mapBoundsObject(),tileKeys=V232.loader.tileKeysForBounds(bounds,mode.cellMeters);
  const key=`v232|${mode.cellMeters}|${target.kind}|${target.type||''}|z${z}|${tileKeys.map(t=>t.y+','+t.x).join(';')}|r${typeof RADIUS_KM!=='undefined'?RADIUS_KM:''}`;
  try{if(key===nationalRadarLastKey&&nationalRadarLastCount>0){V232.canvas?.draw();applyLegend(target);return;}}catch(_){ }
  try{
    const f0=performance.now();
    const cells=await V232.loader.loadViewport({cellMeters:mode.cellMeters,bounds,speciesId:target.kind==='species'?target.type:null,overview:target.kind!=='species'});
    if(seq!==V232.requestSeq)return;
    V232.stats.lastFetchMs=performance.now()-f0;V232.stats.cellsLoaded=cells.length;
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
    hideOldRadar();V232.canvas.setRows(rows);
    const stats={
      n:cells.length,shown:rows.length,top10,target:target.kind==='species'?target.type:target.kind,
      lodMeters:mode.cellMeters,tiles:tileKeys.length,regionalContinuity:regional,fetchMs:V232.stats.lastFetchMs,drawMs:V232.stats.lastDrawMs,
      bytes:V232.loader.stats.bytes,requests:V232.loader.stats.requests,cacheHits:V232.loader.stats.cacheHits
    };
    try{
      nationalRadarLastKey=key;nationalRadarLastCount=rows.length;nationalRadarLastStats=stats;nationalRadarLastError='';
    }catch(_){ }
    V232.last={mode:'v4',zoom:z,target,lodMeters:mode.cellMeters,cells:cells.length,shown:rows.length,tiles:tileKeys.length,regionalContinuity:regional,continuityRule:regional?'3x3 existing-forest smoothing + visible weak cells':'visible weak forest cells',totalMs:performance.now()-V232Start};
    applyLegend(target);
    console.debug('V232 RADAR V4 RENDER',V232.last);
  }catch(e){
    if(seq!==V232.requestSeq)return;
    V232.error=e?.message||String(e);V232.stats.fallbacks++;hideV4();
    console.warn('V232 RADAR V4 render failed; fallback to previous radar.',e);
    if(previousRefresh)return previousRefresh();
  }
}

async function auditV232(){
  const ok=await initV232();
  const report={
    version:V232.version,available:ok,error:V232.error,ready:V232.ready,
    lods:V232.loader?.availableLods?.()||[],modelDigest:V232.manifest?.modelDigest||null,
    species:V232.manifest?.species?.length||0,last:V232.last,loaderStats:V232.loader?{...V232.loader.stats,cacheEntries:V232.loader.cache.size}:null,
    stats:{...V232.stats},fallbackPreserved:!!previousRefresh,
    policy:'z<=9 legacy 5km; z10 v4 1km regional continuity for radius>=50km; z11 v4 1km; z12 v4 500m if available else 1km; z>=13 exact BDL',
    calibration:V232.calibration?{format:V232.calibration.format,version:V232.calibration.version,method:V232.calibration.method}:null,
    note:'v232 changes only presentation of the static v4 radar: weak valid forest cells stay visible and broad z10/radius>=50km uses neighbour smoothing among existing forest cells only. No cells are invented outside BDL forest support. Biology, DZIŚ, observations, hotspot math and national-prior math are unchanged.'
  };
  console.info('V232 RADAR V4 AUDIT',report);return report;
}
window.auditRadarV4V232=auditV232;
window.auditRadarV4V231=auditV232;

// Rebind the existing scheduler target. Existing render()/species UI calls continue to work.
try{refreshNationalRadar=refreshV232;}catch(e){console.warn('V232: cannot rebind refreshNationalRadar',e);return;}
try{
  auditNationalRadar=function(){return auditV232();};
  window.auditNationalRadar=auditNationalRadar;
}catch(_){window.auditNationalRadar=auditV232;}

// The old code refreshed only after zoom changes. Tiled data must also follow pan/drag.
map.on('moveend',()=>{
  try{
    if(typeof scheduleNationalRadarRefresh==='function')scheduleNationalRadarRefresh();
    else refreshV232().catch(()=>{});
  }catch(_){ }
});

// Warm manifest/calibration after the page settles, without blocking first paint.
const warm=()=>initV232().then(()=>refreshV232()).catch(()=>{});
if('requestIdleCallback' in window)requestIdleCallback(warm,{timeout:1800});else setTimeout(warm,900);

})();
