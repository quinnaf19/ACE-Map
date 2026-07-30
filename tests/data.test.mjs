import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("map data reconciles all records and outcome totals", async () => {
  const rows=JSON.parse(await readFile(new URL("../public/data/stops.json",import.meta.url),"utf8"));
  assert.ok(rows.length>0);
  assert.equal(rows.reduce((sum,row)=>sum+row.records,0),1566130);
  assert.equal(rows.reduce((sum,row)=>sum+row.violations,0),765297);
  assert.equal(rows.reduce((sum,row)=>sum+row.nonissued,0),800833);
  assert.equal(rows.reduce((sum,row)=>sum+row.exemptions,0),501795);
  assert.equal(rows.reduce((sum,row)=>sum+row.technical,0),171648);
  assert.equal(rows.reduce((sum,row)=>sum+row.dmv,0),127390);
  assert.ok(rows.every(row=>row.records===row.violations+row.nonissued));
  assert.ok(rows.every(row=>row.nonissued===row.exemptions+row.technical+row.dmv));
  assert.ok(rows.every(row=>row.route&&row.stop&&row.nta&&Number.isFinite(row.latitude)&&Number.isFinite(row.longitude)));
});

test("canonical all-record intersection totals match the online report", async () => {
  const rows=JSON.parse(await readFile(new URL("../public/data/stops.json",import.meta.url),"utf8"));
  const totals=new Map();
  for (const row of rows) totals.set(row.stop,(totals.get(row.stop)??0)+row.records);
  const expected={
    "MALCOLM X BLVD / W 125 ST":35893,
    "CATHERINE ST / MADISON ST":27219,
    "SAINT NICHOLAS AV / W 125 ST":26097,
    "AMSTERDAM AV / W 161 ST":20023,
    "2 AV / E 125 ST":19372,
    "3 AV / E 86 ST":18700,
    "2 AV / E 78 ST":18143,
  };
  for (const [stop,total] of Object.entries(expected)) assert.equal(totals.get(stop),total,stop);
});

test("rows sharing a canonical intersection use one canonical coordinate", async () => {
  const rows=JSON.parse(await readFile(new URL("../public/data/stops.json",import.meta.url),"utf8"));
  const coordinates=new Map();
  for (const row of rows) {
    const coordinate=`${row.longitude},${row.latitude}`;
    if (!coordinates.has(row.stop)) coordinates.set(row.stop,coordinate);
    assert.equal(coordinate,coordinates.get(row.stop),row.stop);
  }
});

test("Manhattan NTA boundaries are available", async () => {
  const geo=JSON.parse(await readFile(new URL("../public/data/manhattan-ntas.geojson",import.meta.url),"utf8"));
  assert.equal(geo.type,"FeatureCollection");
  assert.ok(geo.features.length>=30);
  assert.ok(geo.features.every(feature=>feature.properties.ntaname));
});

test("interface offers all requested outcome filters", async () => {
  const source=await readFile(new URL("../app/MapExplorer.tsx",import.meta.url),"utf8");
  for (const label of [
    "All ACE records",
    "Issued violations",
    "All non-issued records",
    "Exempt records",
    "Technical rejections",
    "DMV rejections",
  ]) assert.match(source,new RegExp(label));
});
