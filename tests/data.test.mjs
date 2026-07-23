import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("map data contains the reconciled issued-violation total", async () => {
  const rows=JSON.parse(await readFile(new URL("../public/data/stops.json",import.meta.url),"utf8"));
  assert.ok(rows.length>0);
  assert.equal(rows.reduce((sum,row)=>sum+row.violations,0),765297);
  assert.ok(rows.every(row=>row.route&&row.stop&&row.nta&&Number.isFinite(row.latitude)&&Number.isFinite(row.longitude)));
});

test("Manhattan NTA boundaries are available", async () => {
  const geo=JSON.parse(await readFile(new URL("../public/data/manhattan-ntas.geojson",import.meta.url),"utf8"));
  assert.equal(geo.type,"FeatureCollection");
  assert.ok(geo.features.length>=30);
  assert.ok(geo.features.every(feature=>feature.properties.ntaname));
});
