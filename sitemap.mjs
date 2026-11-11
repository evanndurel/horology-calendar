// Builds public/sitemap.xml and public/robots.txt before each deployment.
// Reads the events from Supabase when the keys are set, otherwise from the seed.
import fs from 'fs';
const env = { ...process.env };
try { for (const l of fs.readFileSync('.env', 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m && !env[m[1]]) env[m[1]] = m[2]; } } catch (x) {}
const site = (env.VITE_SITE_URL || 'https://example.com').replace(/\/$/, '');
let events = [];
if (env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY) {
  try {
    const r = await fetch(env.VITE_SUPABASE_URL + '/rest/v1/events?select=id,updated_on,end_date&hidden=eq.false', { headers: { apikey: env.VITE_SUPABASE_ANON_KEY } });
    events = await r.json(); if (!Array.isArray(events)) throw new Error(JSON.stringify(events));
  } catch (x) { console.warn('sitemap: could not read Supabase, using seed', x.message); }
}
if (!events.length) events = JSON.parse(fs.readFileSync('src/seed.json', 'utf8'));
const today = new Date().toISOString().slice(0, 10);
const urls = ['/', '/agenda', '/map', '/add', '/about', '/legal'].map((p) => ({ loc: site + p }))
  .concat(events.filter((e) => e.end_date >= today).map((e) => ({ loc: site + '/event/' + e.id, lastmod: e.updated_on })));
fs.writeFileSync('public/sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  + urls.map((u) => '  <url><loc>' + u.loc + '</loc>' + (u.lastmod ? '<lastmod>' + u.lastmod + '</lastmod>' : '') + '</url>').join('\n') + '\n</urlset>\n');
fs.writeFileSync('public/robots.txt', 'User-agent: *\nDisallow: /admin\n\nSitemap: ' + site + '/sitemap.xml\n');
console.log('sitemap:', urls.length, 'pages');
