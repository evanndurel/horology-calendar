// One-off: converts the prototype data (work/data.json) into the database seed.
// Usage: node tools/make-seed.mjs <path-to-prototype-data.json>
import fs from 'fs';
import { geoNaturalEarth1 } from 'd3-geo';
const src = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const proj = geoNaturalEarth1().fitExtent([[10, 10], [990, 490]], { type: 'Sphere' });
const ll = {};
for (const [city, [x, y]] of Object.entries(src.pins)) { const [lon, lat] = proj.invert([x, y]); ll[city] = [+lat.toFixed(4), +lon.toFixed(4)]; }
const img = (uri, name) => { if (!uri) return null; const b = Buffer.from(uri.split(',')[1], 'base64'); fs.writeFileSync('public/images/' + name, b); return '/images/' + name; };
const rows = src.events.map((e) => ({
  id: e.id, name: e.n, start_date: e.s, end_date: e.e, venue: e.venue || null, city: e.city, city_label: e.cityLabel !== e.city ? e.cityLabel : null,
  country_code: e.cc, country: e.country, type: e.t, type_label: e.tl, exhibitors: e.exh || null, dates_tbc: !!e.tbc, trade_only: !!e.closed, free_entry: !!e.free,
  website: e.site || null, organiser: e.org || null, description: e.desc || null, press_days: e.press || null,
  image_url: img(e.img, e.id + '.jpg'), image_credit: e.credit || null, image_alt: e.alt || null,
  gallery: e.gal ? e.gal.map((g, i) => ({ src: img(g.src, e.id + '-' + (i + 1) + '.jpg'), alt: g.alt })) : [],
  lat: ll[e.city] ? ll[e.city][0] : null, lon: ll[e.city] ? ll[e.city][1] : null,
  verified: false, hidden: false, reviewed: true, source: 'team', updated_on: e.upd || '2026-11-09',
}));
const miss = rows.filter((r) => r.lat == null).map((r) => r.city); if (miss.length) console.warn('no coordinates for', miss);
fs.writeFileSync('src/seed.json', JSON.stringify(rows));
const q = (v) => v == null ? 'null' : typeof v === 'boolean' ? String(v) : typeof v === 'number' ? String(v) : typeof v === 'object' ? "'" + JSON.stringify(v).replace(/'/g, "''") + "'::jsonb" : "'" + String(v).replace(/'/g, "''") + "'";
const cols = Object.keys(rows[0]);
let sql = '-- Horology Calendar: initial listings (' + rows.length + ' events). Run once, after schema.sql.\n';
sql += 'insert into public.events (' + cols.join(', ') + ') values\n' + rows.map((r) => '(' + cols.map((c) => q(r[c])).join(', ') + ')').join(',\n') + '\non conflict (id) do nothing;\n';
fs.writeFileSync('supabase/seed.sql', sql);
console.log(rows.length, 'events,', fs.readdirSync('public/images').length, 'images');
