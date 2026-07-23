"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type * as Leaflet from "leaflet";

type StopRow = {route:string;stop:string;nta:string;violations:number;longitude:number;latitude:number};
type MapPoint = StopRow & {routes:string[]};
const fmt=new Intl.NumberFormat("en-US");

export default function MapExplorer(){
  const [rows,setRows]=useState<StopRow[]>([]); const [geo,setGeo]=useState<any>(null);
  const [route,setRoute]=useState("All routes"); const [nta,setNta]=useState("All neighborhoods");
  const [query,setQuery]=useState(""); const [min,setMin]=useState(1);
  const [selected,setSelected]=useState<MapPoint|null>(null); const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const [leaflet,setLeaflet]=useState<typeof import("leaflet")|null>(null);
  const mapNode=useRef<HTMLDivElement|null>(null); const mapRef=useRef<Leaflet.Map|null>(null); const pointsLayer=useRef<Leaflet.LayerGroup|null>(null); const ntaLayer=useRef<Leaflet.GeoJSON|null>(null);

  const loadData=()=>{setLoading(true);setError("");Promise.all([fetch("/data/stops.json").then(r=>{if(!r.ok)throw new Error("Stops data request failed");return r.json()}),fetch("/data/manhattan-ntas.geojson").then(r=>{if(!r.ok)throw new Error("Neighborhood data request failed");return r.json()})]).then(([s,g])=>{setRows(s);setGeo(g);setLoading(false)}).catch(()=>{setLoading(false);setError("Map data could not be loaded. Check your connection and try again.")});};
  useEffect(()=>{loadData()},[]);
  useEffect(()=>{import("leaflet").then(setLeaflet)},[]);
  const routes=useMemo(()=>["All routes",...Array.from(new Set(rows.map(r=>r.route))).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}))],[rows]);
  const ntas=useMemo(()=>["All neighborhoods",...Array.from(new Set(rows.map(r=>r.nta))).sort()],[rows]);
  const stopNames=useMemo(()=>Array.from(new Set(rows.map(r=>r.stop))).sort(),[rows]);
  const points=useMemo(()=>{
    const m=new Map<string,MapPoint>(); const q=query.trim().toLowerCase();
    rows.filter(r=>(route==="All routes"||r.route===route)&&(nta==="All neighborhoods"||r.nta===nta)&&(!q||r.stop.toLowerCase().includes(q))).forEach(r=>{
      const key=`${r.stop}|${r.nta}`; const x=m.get(key);
      if(x){x.violations+=r.violations;if(!x.routes.includes(r.route))x.routes.push(r.route)}
      else m.set(key,{...r,routes:[r.route]});
    });
    return [...m.values()].filter(x=>x.violations>=min).sort((a,b)=>b.violations-a.violations);
  },[rows,route,nta,query,min]);
  const total=useMemo(()=>points.reduce((sum,x)=>sum+x.violations,0),[points]);

  useEffect(()=>{if(!mapNode.current||mapRef.current||!leaflet)return;const map=leaflet.map(mapNode.current,{zoomControl:false,minZoom:10,maxZoom:19}).setView([40.783,-73.971],12);leaflet.control.zoom({position:"bottomright"}).addTo(map);leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'&copy; OpenStreetMap contributors',maxZoom:19}).addTo(map);pointsLayer.current=leaflet.layerGroup().addTo(map);mapRef.current=map;setTimeout(()=>map.invalidateSize(),100);return()=>{map.remove();mapRef.current=null}},[leaflet]);
  useEffect(()=>{if(!mapRef.current||!geo||!leaflet)return;if(ntaLayer.current)ntaLayer.current.remove();ntaLayer.current=leaflet.geoJSON(geo,{style:(f:any)=>({color:f?.properties?.ntaname===nta?"#111827":"#64748b",weight:f?.properties?.ntaname===nta?2.5:.7,fillColor:"#f8fafc",fillOpacity:(f?.properties?.ntaname===nta ? .18 : .045)}),onEachFeature:(f,l)=>{l.bindTooltip(f.properties.ntaname,{sticky:true,className:"nta-tip"});l.on("click",()=>setNta(f.properties.ntaname))}}).addTo(mapRef.current);ntaLayer.current.bringToBack()},[geo,nta,leaflet]);
  useEffect(()=>{const layer=pointsLayer.current;if(!layer||!leaflet)return;layer.clearLayers();const max=Math.max(1,...points.map(x=>x.violations));for(const p of points){const t=Math.sqrt(p.violations/max);const marker=leaflet.circleMarker([p.latitude,p.longitude],{radius:4+t*18,weight:1,color:"#7f1d1d",fillColor:`hsl(${22-18*t} 86% ${58-16*t}%)`,fillOpacity:.38+t*.48});marker.bindTooltip(`<b>${p.stop}</b><br>${p.nta}<br>Issued violations: ${fmt.format(p.violations)}`,{direction:"top"});marker.on("click",()=>setSelected(p));marker.addTo(layer)}} ,[points,leaflet]);
  const focus=(p:MapPoint)=>{setSelected(p);mapRef.current?.flyTo([p.latitude,p.longitude],16,{duration:.7})};
  const reset=()=>{setRoute("All routes");setNta("All neighborhoods");setQuery("");setMin(1);setSelected(null);mapRef.current?.flyTo([40.783,-73.971],12)};

  return <main className="app-shell">
    <header className="topbar"><div><span className="eyebrow">NYC AUTOMATED CAMERA ENFORCEMENT</span><h1>Manhattan Violation Explorer</h1></div><div className="period"><span>Issued violations · study period</span><strong>Jun 20, 2024 — Jun 15, 2026</strong></div></header>
    <section className="workspace">
      <aside className="sidebar">
        <div className="side-head"><div><span className="step">FILTER THE MAP</span><h2>Find a hotspot</h2></div><button className="reset" onClick={reset}>Reset</button></div>
        <div className="filter-grid"><label>Bus route<select value={route} onChange={e=>setRoute(e.target.value)}>{routes.map(x=><option key={x}>{x}</option>)}</select></label><label>Neighborhood<select value={nta} onChange={e=>setNta(e.target.value)}>{ntas.map(x=><option key={x}>{x}</option>)}</select></label></div>
        <label>Stop or intersection<div className="search"><span>⌕</span><input list="stop-options" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search Broadway, W 125 ST…"/><datalist id="stop-options">{stopNames.map(x=><option key={x} value={x}/>)}</datalist></div></label>
        <label className="range-label"><span>Minimum issued violations</span><strong>{fmt.format(min)}</strong><input type="range" min="1" max="1000" step="25" value={min} onChange={e=>setMin(Number(e.target.value))}/></label>
        <div className="kpis"><div><span>Mapped violations</span><strong>{fmt.format(total)}</strong></div><div><span>Visible stops</span><strong>{fmt.format(points.length)}</strong></div><div><span>Routes visible</span><strong>{fmt.format(new Set(points.flatMap(p=>p.routes)).size)}</strong></div></div>
        <div className="hotspots"><div className="list-title"><span>TOP VISIBLE HOTSPOTS</span><small>Issued violations</small></div>{points.slice(0,8).map((p,i)=><button key={`${p.stop}-${p.nta}`} onClick={()=>focus(p)}><span className="rank">{String(i+1).padStart(2,"0")}</span><span className="place"><strong>{p.stop}</strong><small>{p.nta}</small></span><b>{fmt.format(p.violations)}</b></button>)}</div>
        <p className="method">Circles aggregate issued violations at standardized stops. Size and color represent violation counts. Neighborhoods use NYC DCP 2020 NTAs; click a boundary to filter.</p>
      </aside>
      <div className="map-wrap"><div ref={mapNode} className="map" aria-label="Interactive map of Manhattan ACE issued violations"/>{loading&&<div className="loading" role="status">Preparing 765,297 issued violations…</div>}{error&&<div className="loading error-state" role="alert"><strong>{error}</strong><button onClick={loadData}>Try again</button></div>}<div className="legend"><span>FEWER</span><i></i><i></i><i></i><i></i><span>MORE</span></div>{selected&&<article className="detail"><button aria-label="Close details" onClick={()=>setSelected(null)}>×</button><span className="detail-label">SELECTED STOP</span><h3>{selected.stop}</h3><p>{selected.nta}</p><div className="route-pills">{selected.routes.map(r=><span key={r}>{r}</span>)}</div><dl className="issued-only"><div><dt>Issued violations</dt><dd>{fmt.format(selected.violations)}</dd></div><div><dt>Routes at location</dt><dd>{selected.routes.length}</dd></div></dl></article>}</div>
    </section>
  </main>
}
