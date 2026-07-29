import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("map data contains the reconciled issued-violation total", async () => {
  const rows=JSON.parse(await readFile(new URL("../public/data/stops.json",import.meta.url),"utf8"));
  assert.ok(rows.length>0);
  assert.equal(rows.reduce((sum,row)=>sum+row.violations,0),765297);
  assert.ok(rows.every(row=>row.route&&row.stop&&row.nta&&Number.isFinite(row.latitude)&&Number.isFinite(row.longitude)));
});

test("canonical intersection totals match the online report", async () => {
  const rows=JSON.parse(await readFile(new URL("../public/data/stops.json",import.meta.url),"utf8"));
  const totals=new Map();
  for (const row of rows) totals.set(row.stop,(totals.get(row.stop)??0)+row.violations);
  const expected={
    "MALCOLM X BLVD / W 125 ST":24144,
    "SAINT NICHOLAS AV / W 125 ST":17012,
    "CATHERINE ST / MADISON ST":13112,
    "2 AV / E 78 ST":10490,
    "2 AV / E 125 ST":10254,
    "BROADWAY / W 178 ST":10238,
    "AMSTERDAM AV / W 161 ST":10215,
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
