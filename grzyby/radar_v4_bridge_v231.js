/* Mapa Grzybów v231 — Radar v4 official bridge
 * LOD policy:
 *   zoom <= 9 : keep existing lightweight 5 km/v3 national radar
 *   zoom 10-11: Radar v4 1 km
 *   zoom 12   : Radar v4 500 m when present, otherwise 1 km
 *   zoom >=13 : exact local BDL layer (Radar v4 hidden)
 *
 * This file does NOT modify biological scoring, weather, observations, hotspot math,
 * national-prior math, or any existing local feature scores. It only replaces the
 * visual national-radar transport/render path at medium zooms.
 */
(function(){
'use strict';

const V231={
  version:'v231-radar-v4-lod',
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
window.__radarV4V231=V231;

if(typeof window.RadarV4!=='function'){
  console.warn('V231 RADAR V4: RadarV4 loader missing; keeping previous radar.');
  return;
}
if(typeof map==='undefined'){
  console.warn('V231 RADAR V4: Leaflet map binding unavailable; keeping previous radar.');
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
  return V231.manifest?.species?.find(x=>x.id===type)?.label||type||'';
}
function rawUnits(cell,target){
  if(target.kind==='diversity')return Math.max(0,Math.round(Number(cell.diversity)||0));
  return Math.max(0,Math.round((Number(cell.raw)||0)*100));
}
function calibrationEntry(cellMeters,target){
  const l=V231.calibration?.lods?.[`${cellMeters}m`];if(!l)return null;
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
function opacityFor(x){
  try{if(typeof nationalRadarOpacityVisual==='function')return nationalRadarOpacityVisual(x);}catch(_){ }
  const v=x.visual;if(!Number.isFinite(v)||v<.20)return 0;
  let a=.03+.48*smoothstep(.20,.98,v);
  a*=.45+.55*Math.sqrt(clamp01(x.coverage/.40));
  a*=.55+.45*Math.sqrt(clamp01(x.forest/850));
  return Math.max(0,Math.min(.42,a));
}

class RadarCanvasV231{
  constructor(){this.el=null;this.rows=[];this._bound=()=>this.draw();}
  ensure(){
    if(this.el)return;
    const pane=(typeof nationalRadarGroup!=='undefined'&&map.getPane('nationalRadarPane'))?map.getPane('nationalRadarPane'):map.getPanes().overlayPane;
    const c=L.DomUtil.create('canvas','radar-v4-canvas-v231',pane);
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
      const x=Math.floor(sw.x)-.35,y=Math.floor(ne.y)-.35,rw=Math.ceil(ne.x-sw.x)+.7,rh=Math.ceil(sw.y-ne.y)+.7;
      if(x>w||y>h||x+rw<0||y+rh<0)continue;
      ctx.globalAlpha=r.opacity;ctx.fillStyle=r.color;ctx.fillRect(x,y,Math.max(1,rw),Math.max(1,rh));drawn++;
    }
    ctx.globalAlpha=1;
    V231.stats.cellsDrawn=drawn;V231.stats.lastDrawMs=performance.now()-t0;
  }
}

async function initV231(){
  if(V231.ready)return true;if(V231.failed)return false;
  try{
    const loader=new RadarV4(V231.baseUrl,{maxCacheEntries:160});
    const [manifest,calResp]=await Promise.all([
      loader.init(),
      fetch(V231.calibrationUrl,{cache:'default'})
    ]);
    if(!calResp.ok)throw new Error(`calibration HTTP ${calResp.status}`);
    const calibration=await calResp.json();
    if(calibration?.format!=='MapaGrzybowRadarV4Calibration')throw new Error('nieprawidłowy calibration.json');
    if(calibration.modelDigest&&manifest.modelDigest&&calibration.modelDigest!==manifest.modelDigest)throw new Error('modelDigest manifest/calibration niezgodny');
    V231.loader=loader;V231.manifest=manifest;V231.calibration=calibration;V231.canvas=new RadarCanvasV231();V231.ready=true;V231.error='';
    console.info('V231 RADAR V4 READY',{lods:loader.availableLods(),modelDigest:manifest.modelDigest,species:manifest.species?.length||0});
    return true;
  }catch(e){
    V231.failed=true;V231.error=e?.message||String(e);console.warn('V231 RADAR V4 unavailable; fallback to previous radar.',e);return false;
  }
}
function wantedLod(){
  const z=map.getZoom();
  if(z<=9)return {kind:'legacy'};
  if(z>=13)return {kind:'exact'};
  const lods=V231.loader?.availableLods?.()||[];
  if(z===12&&lods.includes(500))return {kind:'v4',cellMeters:500};
  if(lods.includes(1000))return {kind:'v4',cellMeters:1000};
  if(lods.length)return {kind:'v4',cellMeters:Math.min(...lods)};
  return {kind:'legacy'};
}
function hideOldRadar(){try{if(typeof nationalRadarGroup!=='undefined')nationalRadarGroup.clearLayers();}catch(_){ }}
function hideV4(){try{V231.canvas?.clear();}catch(_){ }}
function applyLegend(target){try{if(typeof nationalRadarApplyLegend==='function')nationalRadarApplyLegend(target);}catch(_){ }}
function hideLegendAtExact(){try{if(typeof updateScoreLegend==='function')updateScoreLegend();}catch(_){ }}

async function refreshV231(){
  const seq=++V231.requestSeq,V231Start=performance.now();V231.stats.refreshes++;
  const z=map.getZoom();
  if(z<=9){
    hideV4();V231.last={mode:'legacy',zoom:z};
    if(previousRefresh)return previousRefresh();
    return;
  }
  if(z>=13){
    hideV4();hideOldRadar();V231.last={mode:'exact-bdl',zoom:z,cells:0};
    try{nationalRadarLastKey='';nationalRadarLastCount=0;nationalRadarLastStats=null;}catch(_){ }
    hideLegendAtExact();return;
  }
  const ok=await initV231();
  if(!ok){V231.stats.fallbacks++;if(previousRefresh)return previousRefresh();return;}
  const mode=wantedLod();
  if(mode.kind!=='v4'){V231.stats.fallbacks++;if(previousRefresh)return previousRefresh();return;}
  const target=targetNow();
  if(target.kind==='species'&&!V231.manifest.species?.some(s=>s.id===target.type)){
    // edge/grassland species are intentionally absent from the BDL-only radar.
    V231.stats.fallbacks++;hideV4();if(previousRefresh)return previousRefresh();return;
  }
  const bounds=mapBoundsObject(),tileKeys=V231.loader.tileKeysForBounds(bounds,mode.cellMeters);
  const key=`v231|${mode.cellMeters}|${target.kind}|${target.type||''}|z${z}|${tileKeys.map(t=>t.y+','+t.x).join(';')}|r${typeof RADIUS_KM!=='undefined'?RADIUS_KM:''}`;
  try{if(key===nationalRadarLastKey&&nationalRadarLastCount>0){V231.canvas?.draw();applyLegend(target);return;}}catch(_){ }
  try{
    const f0=performance.now();
    const cells=await V231.loader.loadViewport({cellMeters:mode.cellMeters,bounds,speciesId:target.kind==='species'?target.type:null,overview:target.kind!=='species'});
    if(seq!==V231.requestSeq)return;
    V231.stats.lastFetchMs=performance.now()-f0;V231.stats.cellsLoaded=cells.length;
    const rows=[];let top10=0;
    for(const cell0 of cells){
      const cell={...cell0,cellMeters:mode.cellMeters};if(!inSelectedAnalysis(cell))continue;
      const vi=visualInfo(cell,target,mode.cellMeters);if(!vi)continue;
      const opacity=opacityFor(vi);if(!(opacity>0))continue;
      rows.push({bounds:cell.bounds,opacity,color:colorFor(vi.visual),...vi});if(vi.percentile>=.90)top10++;
    }
    hideOldRadar();V231.canvas.setRows(rows);
    const stats={
      n:cells.length,shown:rows.length,top10,target:target.kind==='species'?target.type:target.kind,
      lodMeters:mode.cellMeters,tiles:tileKeys.length,fetchMs:V231.stats.lastFetchMs,drawMs:V231.stats.lastDrawMs,
      bytes:V231.loader.stats.bytes,requests:V231.loader.stats.requests,cacheHits:V231.loader.stats.cacheHits
    };
    try{
      nationalRadarLastKey=key;nationalRadarLastCount=rows.length;nationalRadarLastStats=stats;nationalRadarLastError='';
    }catch(_){ }
    V231.last={mode:'v4',zoom:z,target,lodMeters:mode.cellMeters,cells:cells.length,shown:rows.length,tiles:tileKeys.length,totalMs:performance.now()-V231Start};
    applyLegend(target);
    console.debug('V231 RADAR V4 RENDER',V231.last);
  }catch(e){
    if(seq!==V231.requestSeq)return;
    V231.error=e?.message||String(e);V231.stats.fallbacks++;hideV4();
    console.warn('V231 RADAR V4 render failed; fallback to previous radar.',e);
    if(previousRefresh)return previousRefresh();
  }
}

async function auditV231(){
  const ok=await initV231();
  const report={
    version:V231.version,available:ok,error:V231.error,ready:V231.ready,
    lods:V231.loader?.availableLods?.()||[],modelDigest:V231.manifest?.modelDigest||null,
    species:V231.manifest?.species?.length||0,last:V231.last,loaderStats:V231.loader?{...V231.loader.stats,cacheEntries:V231.loader.cache.size}:null,
    stats:{...V231.stats},fallbackPreserved:!!previousRefresh,
    policy:'z<=9 legacy 5km; z10-11 v4 1km; z12 v4 500m if available else 1km; z>=13 exact BDL',
    calibration:V231.calibration?{format:V231.calibration.format,version:V231.calibration.version,method:V231.calibration.method}:null,
    note:'Radar v4 affects only the visual static national radar. Local biological scoring, DZIŚ, observations, hotspot math and national-prior math are unchanged.'
  };
  console.info('V231 RADAR V4 AUDIT',report);return report;
}
window.auditRadarV4V231=auditV231;

// Rebind the existing scheduler target. Existing render()/species UI calls continue to work.
try{refreshNationalRadar=refreshV231;}catch(e){console.warn('V231: cannot rebind refreshNationalRadar',e);return;}
try{
  auditNationalRadar=function(){return auditV231();};
  window.auditNationalRadar=auditNationalRadar;
}catch(_){window.auditNationalRadar=auditV231;}

// The old code refreshed only after zoom changes. Tiled data must also follow pan/drag.
map.on('moveend',()=>{
  try{
    if(typeof scheduleNationalRadarRefresh==='function')scheduleNationalRadarRefresh();
    else refreshV231().catch(()=>{});
  }catch(_){ }
});

// Warm manifest/calibration after the page settles, without blocking first paint.
const warm=()=>initV231().then(()=>refreshV231()).catch(()=>{});
if('requestIdleCallback' in window)requestIdleCallback(warm,{timeout:1800});else setTimeout(warm,900);

})();
