import { readFile, writeFile } from "node:fs/promises";

const summaryPath = new URL("../../stop_summary.csv", import.meta.url);
const mapPath = new URL("../public/data/stops.json", import.meta.url);

function parseCsvLine(line) {
  const fields = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        field += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      fields.push(field);
      field = "";
    } else {
      field += char;
    }
  }
  fields.push(field);
  return fields;
}

const csv = await readFile(summaryPath, "utf8");
const [headerLine, ...lines] = csv.trim().split(/\r?\n/);
const headers = parseCsvLine(headerLine);
const indexes = Object.fromEntries(headers.map((header, index) => [header, index]));
const coordinates = new Map();

for (const line of lines) {
  const fields = parseCsvLine(line);
  coordinates.set(fields[indexes.stop_canonical], {
    longitude: Number(fields[indexes.longitude]),
    latitude: Number(fields[indexes.latitude]),
  });
}

const rows = JSON.parse(await readFile(mapPath, "utf8"));
for (const row of rows) {
  const coordinate = coordinates.get(row.stop);
  if (!coordinate) throw new Error(`Missing canonical coordinate for ${row.stop}`);
  row.longitude = coordinate.longitude;
  row.latitude = coordinate.latitude;
}

await writeFile(mapPath, `${JSON.stringify(rows)}\n`);
console.log(`Reconciled ${rows.length} map rows against ${coordinates.size} canonical stops.`);
