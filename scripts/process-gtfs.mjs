#!/usr/bin/env node
/**
 * Pre-process SPTrans GTFS shapes into per-route JSON files.
 *
 * Usage:
 *   node scripts/process-gtfs.mjs /tmp/gtfs_sptrans
 *
 * Output: public/shapes/{ROUTE_ID}.json
 * Each file: [[lng,lat], ...] (GeoJSON coordinate order)
 *
 * Mapping: GTFS route_short_name (e.g. "875A-10") == Olho Vivo letreiro completo (c field).
 * Trips link route_id → shape_id with direction_id (0 or 1).
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const gtfsDir = process.argv[2];
if (!gtfsDir) {
  console.error("Usage: node scripts/process-gtfs.mjs <gtfs-directory>");
  process.exit(1);
}

function parseCsv(file) {
  const lines = readFileSync(join(gtfsDir, file), "utf-8").replace(/\r/g, "").trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.replace(/"/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.replace(/"/g, ""));
    return Object.fromEntries(headers.map((h, i) => [h, values[i]]));
  });
}

// 1. Parse trips: route_id → { direction_id, shape_id }
console.log("Parsing trips...");
const trips = parseCsv("trips.txt");
const routeShapes = new Map(); // route_id -> { "0": shape_id, "1": shape_id }
for (const t of trips) {
  if (!routeShapes.has(t.route_id)) routeShapes.set(t.route_id, {});
  routeShapes.get(t.route_id)[t.direction_id] = t.shape_id;
}
console.log(`  ${routeShapes.size} routes with shapes`);

// 2. Collect all needed shape_ids
const neededShapes = new Set();
for (const dirs of routeShapes.values()) {
  for (const sid of Object.values(dirs)) neededShapes.add(sid);
}
console.log(`  ${neededShapes.size} unique shapes to extract`);

// 3. Parse shapes.txt (large file, stream line-by-line)
console.log("Parsing shapes.txt (this may take a moment)...");
const shapesRaw = readFileSync(join(gtfsDir, "shapes.txt"), "utf-8").replace(/\r/g, "");
const shapeLines = shapesRaw.split("\n");
const shapePoints = new Map(); // shape_id -> [[lng, lat], ...]

for (let i = 1; i < shapeLines.length; i++) {
  const line = shapeLines[i];
  if (!line) continue;
  const parts = line.split(",").map((v) => v.replace(/"/g, ""));
  const [shapeId, lat, lng, seq] = parts;
  if (!neededShapes.has(shapeId)) continue;

  if (!shapePoints.has(shapeId)) shapePoints.set(shapeId, []);
  shapePoints.get(shapeId).push({
    seq: parseInt(seq),
    coord: [parseFloat(lng), parseFloat(lat)], // GeoJSON order: [lng, lat]
  });
}

// Sort each shape by sequence
for (const [id, points] of shapePoints) {
  points.sort((a, b) => a.seq - b.seq);
  shapePoints.set(id, points.map((p) => p.coord));
}
console.log(`  ${shapePoints.size} shapes loaded`);

// 4. Simplify: use Ramer-Douglas-Peucker to reduce point count
function rdpSimplify(points, epsilon) {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIdx = 0;
  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDist(points[i], start, end);
    if (d > maxDist) {
      maxDist = d;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = rdpSimplify(points.slice(0, maxIdx + 1), epsilon);
    const right = rdpSimplify(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [start, end];
}

function perpendicularDist(point, lineStart, lineEnd) {
  const [x, y] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(x - x1, y - y1);
  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}

// Epsilon in degrees; ~0.00002° ≈ ~2m at São Paulo's latitude
const EPSILON = 0.00003;

// 5. Write output files
const outDir = join(process.cwd(), "public", "shapes");
mkdirSync(outDir, { recursive: true });

let totalOriginal = 0;
let totalSimplified = 0;
let filesWritten = 0;

for (const [routeId, dirs] of routeShapes) {
  const output = {};

  for (const [dirId, shapeId] of Object.entries(dirs)) {
    const pts = shapePoints.get(shapeId);
    if (!pts || pts.length === 0) continue;

    totalOriginal += pts.length;
    const simplified = rdpSimplify(pts, EPSILON);
    totalSimplified += simplified.length;

    // Round to 6 decimal places to save space
    output[dirId] = simplified.map(([lng, lat]) => [
      Math.round(lng * 1e6) / 1e6,
      Math.round(lat * 1e6) / 1e6,
    ]);
  }

  if (Object.keys(output).length > 0) {
    writeFileSync(join(outDir, `${routeId}.json`), JSON.stringify(output));
    filesWritten++;
  }
}

console.log(`\nDone!`);
console.log(`  ${filesWritten} shape files written to public/shapes/`);
console.log(`  Points: ${totalOriginal} → ${totalSimplified} (${Math.round((totalSimplified / totalOriginal) * 100)}% after simplification)`);
