document.documentElement.classList.add('js');
import { api, DEMO } from './api.js';
import MAP from './map.json';
import { geoNaturalEarth1 } from 'd3-geo';

const D = { map: { base: Object.values(MAP.c).join(''), hi: MAP.c }, box: MAP.box };
const BASE_PATHS = Object.values(MAP.c).map((d) => '<path d="' + d + '"/>').join('');
const PROJ = geoNaturalEarth1().fitExtent([[10, 10], [990, 490]], { type: 'Sphere' });
const SITE = (import.meta.env.VITE_SITE_URL || location.origin).replace(/\/$/, '');
const EV = [];
const byId = {};
let PINS = {};
const MS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const ML = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY = 864e5;
const T = (s) => Date.UTC(+s.slice(0,4), +s.slice(5,7)-1, +s.slice(8,10));
const ISO = (t) => new Date(t).toISOString().slice(0,10);
const today = () => ISO(Date.now());
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TY = {
  trade: ['Trade fairs','#0F1B2D','#FFFFFF','none'],
  public: ['Public fairs','#C9A86A','#0F1B2D','none'],
  jewel: ['Jewellery & watches','#4A6785','#FFFFFF','none'],
  vintage: ['Vintage & collectors','#7D5E45','#FFFFFF','none'],
  auction: ['Auctions & awards','#ECE7DD','#0E1116','inset 0 0 0 1px #C9BFAE']
};
const CN = Object.assign({}, MAP.names, { US: 'United States', GB: 'United Kingdom', HK: 'Hong Kong', CZ: 'Czechia', KR: 'South Korea', RU: 'Russia', TW: 'Taiwan', VN: 'Vietnam', AE: 'United Arab Emirates' });
const COUNTRY_LIST = Object.entries(CN).sort((a, b) => a[1].localeCompare(b[1]));
// Database row -> object used by the pages
function fromRow(r) {
  return { id: r.id, n: r.name, s: r.start_date, e: r.end_date, venue: r.venue || '', city: r.city, cityLabel: r.city_label || r.city, cc: r.country_code || '', country: r.country,
    t: r.type, tl: r.type_label, exh: r.exhibitors || '', tbc: !!r.dates_tbc, closed: !!r.trade_only, free: !!r.free_entry, site: r.website || '', org: r.organiser || '',
    desc: r.description || '', press: r.press_days || '', img: r.image_url || '', credit: r.image_credit || '', alt: r.image_alt || '', gal: r.gallery || [],
    lat: r.lat, lon: r.lon, ver: !!r.verified, hidden: !!r.hidden, reviewed: r.reviewed !== false, user: r.source === 'organiser', sub: r.submitted_at || '', upd: r.updated_on || '' };
}
function setEvents(rows) {
  EV.length = 0; Object.keys(byId).forEach((k) => { delete byId[k]; }); PINS = {};
  rows.forEach((r) => { const e = fromRow(r); EV.push(e); byId[e.id] = e; if (e.cc && !CN[e.cc]) CN[e.cc] = e.country; });
  EV.forEach((e) => { if (e.lat != null && e.lon != null && !PINS[e.city]) { const [x, y] = PROJ([e.lon, e.lat]); PINS[e.city] = [+x.toFixed(1), +y.toFixed(1), e.cc]; } });
}
async function loadEvents() { setEvents(await api.listEvents()); }
async function geocode(city, country) {
  try {
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 5000);
    const r = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&city=' + encodeURIComponent(city) + '&country=' + encodeURIComponent(country), { signal: ctl.signal, headers: { 'Accept-Language': 'en' } });
    clearTimeout(tm); const j = await r.json(); return j && j[0] ? { lat: +(+j[0].lat).toFixed(4), lon: +(+j[0].lon).toFixed(4) } : null;
  } catch (x) { return null; }
}
const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 110);
const mapOK = (e) => !!(PINS[e.city] && e.cc && D.box[e.cc]);
const activeCC = () => [...new Set(mapEvents().map((e) => e.cc))].filter((k) => D.map.hi[k]);
const mapEvents = () => upcoming().filter(mapOK);
const upcoming = () => EV.filter((e) => !e.hidden && e.e >= today()).sort((a,b) => a.s < b.s ? -1 : a.s > b.s ? 1 : 0);
const live = (e) => e.s <= today() && e.e >= today();
function range(s, e) {
  const a = new Date(T(s)), b = new Date(T(e));
  if (s === e) return a.getUTCDate() + ' ' + MS[a.getUTCMonth()] + ' ' + a.getUTCFullYear();
  if (a.getUTCMonth() === b.getUTCMonth()) return a.getUTCDate() + ' – ' + b.getUTCDate() + ' ' + MS[b.getUTCMonth()] + ' ' + b.getUTCFullYear();
  return a.getUTCDate() + ' ' + MS[a.getUTCMonth()] + ' – ' + b.getUTCDate() + ' ' + MS[b.getUTCMonth()] + ' ' + b.getUTCFullYear();
}
function dm(s, e) {
  const a = new Date(T(s)), b = new Date(T(e));
  const days = s === e ? '' + a.getUTCDate() : a.getUTCDate() + '–' + b.getUTCDate();
  const mon = a.getUTCMonth() === b.getUTCMonth() ? MS[a.getUTCMonth()] : MS[a.getUTCMonth()] + '–' + MS[b.getUTCMonth()];
  return { days, mon };
}
function whenOf(e) {
  const t = today();
  if (e.e < t) return 'Past event';
  if (e.s <= t) return 'Happening now';
  const d = Math.round((T(e.s) - T(t)) / DAY);
  return d === 1 ? 'Starts tomorrow' : 'Starts in ' + d + ' days';
}
const dur = (e) => { const d = Math.round((T(e.e) - T(e.s)) / DAY) + 1; return d === 1 ? '1 day' : d + ' days'; };
const place = (e) => (e.venue ? e.venue + ' · ' : '') + e.city + (e.city !== e.country ? ', ' + e.country : '');
const store = {
  get() { try { return JSON.parse(localStorage.getItem('hc-season') || '{}') || {}; } catch (x) { return {}; } },
  set(v) { try { localStorage.setItem('hc-season', JSON.stringify(v)); } catch (x) {} }
};
let saved = store.get();
function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 2200);
}
const ARR = '<svg class="arr" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const STAR = (on) => '<svg width="20" height="20" viewBox="0 0 24 24" fill="' + (on ? '#B8975A' : 'none') + '" stroke="' + (on ? '#B8975A' : '#8A909A') + '" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9z"/></svg>';

function header(active) {
  const l = (h, t, k) => '<a href="' + h + '" class="nl ul' + (active === k ? ' on' : '') + '"' + (active === k ? ' aria-current="page"' : '') + '>' + t + '</a>';
  return '<header class="hd"><div class="wrap-l hdi"><a href="/" class="logo">Horology Calendar</a><div class="hdr">'
    + '<button class="sbtn" data-act="search" aria-label="Search events (shortcut /)" title="Search (/)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg></button>'
    + '<button class="menu" data-act="menu" aria-label="Open menu" aria-expanded="false"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>'
    + '<nav class="nav" id="nav" aria-label="Main"><span class="clock" id="clock">Geneva --:--</span>' + l('/', 'Calendar', 'home') + l('/agenda', 'Agenda', 'agenda') + l('/map', 'Map', 'map') + l('/about', 'About', 'about')
    + '<a href="/add" class="pill' + (active === 'add' ? ' on' : '') + '">Add your event</a></nav></div></div></header>';
}
function footer(with289) {
  return '<footer class="ft"><div class="wrap ftg reveal"><div style="flex:1 1 280px;max-width:360px"><div class="serif" style="font-size:26px">Horology Calendar</div><p style="margin:14px 0 0;font-size:14px;line-height:1.65;color:var(--muted)">The free, open calendar of watch fairs and events worldwide.</p></div>'
    + '<nav aria-label="Explore"><span class="k" style="font-size:11px">Explore</span><a class="ul" href="/">Calendar</a><a class="ul" href="/agenda">Agenda</a><a class="ul" href="/map">World map</a><a class="ul" href="/add">Add your event</a></nav>'
    + '<nav aria-label="Information"><span class="k" style="font-size:11px">Information</span><a class="ul" href="/about">About</a><a class="ul" href="/legal">Legal &amp; privacy</a><a class="ul" href="' + (import.meta.env.VITE_REPO_URL || '/about') + '"' + (import.meta.env.VITE_REPO_URL ? ' target="_blank" rel="noopener"' : '') + '>Open source</a></nav></div>'
    + '<div class="wrap ftb"><span>© ' + new Date().getFullYear() + ' Horology Calendar · Open source · <a href="/admin" style="color:inherit;text-decoration:none;opacity:.6">Admin</a></span>' + (with289 ? '<span style="font-size:12px">An initiative of 289 Consulting</span>' : '') + '</div></footer>';
}

/* ---------------- HOME ---------------- */
const F = { q: '', country: '', month: '', size: '', type: 'all', open: false, free: false, mine: false, autoMonth: true };
function miniMap() {
  const up = mapEvents(); const cnt = {}, lv = {};
  up.forEach((e) => { cnt[e.city] = (cnt[e.city] || 0) + 1; if (live(e)) lv[e.city] = 1; });
  let pins = '', pulses = '';
  Object.keys(cnt).forEach((c, j) => {
    const [x, y] = PINS[c]; const r = (2.4 + Math.min(cnt[c], 7) * 0.5).toFixed(2);
    if (lv[c]) pulses += '<circle class="pulse" cx="' + x + '" cy="' + y + '" r="' + r + '" fill="none" stroke="#E4CF9F" style="animation-delay:' + (j * 170 % 2400) + 'ms"/>';
    pins += '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#E4CF9F" stroke="#0A1322"/>';
  });
  let hi = ''; activeCC().forEach((k) => { hi += '<path d="' + D.map.hi[k] + '" fill="#4A4130" stroke="#8A7448" stroke-width="0.8" vector-effect="non-scaling-stroke"/>'; });
  return '<svg viewBox="150 50 720 250" style="position:absolute;inset:0;width:100%;height:100%" aria-hidden="true"><path d="' + D.map.base + '" fill="#152338" stroke="#26364E" stroke-width="0.6" vector-effect="non-scaling-stroke"/>' + hi + pins + '</svg>' + (pulses ? '<svg viewBox="150 50 720 250" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none" aria-hidden="true">' + pulses + '</svg>' : '');
}
function pageHome() {
  const up = upcoming(); const next = up[0];
  const countries = new Set(up.map((e) => e.country)).size;
  const hl = ['watches-and-wonders-geneva-2027-2027-04', 'time-on-show-paris-2027-2027-02', 'inhorgenta-munich-2027-2027-02'].map((id) => byId[id]).filter(Boolean);
  const months = [...new Set(up.map((e) => e.s.slice(0, 7)))];
  const ctys = [...new Set(up.map((e) => e.country))].sort();
  return '<section class="dark">' + header('home')
    + '<div class="wrap herogrid"><div class="herotext"><div class="eyebrow in">The international watch fair calendar</div>'
    + '<h1 class="big in d1">Every watch fair,<br><em class="g">in one place.</em></h1>'
    + '<p class="lead in d2">Trade fairs, collector shows, auctions and watch weeks around the world, each linked to its official source. Free and open to everyone.</p>'
    + '<div class="in d3" style="margin-top:40px;display:flex;flex-wrap:wrap;gap:14px"><a href="/#calendar" class="btn btn-gold" data-act="scroll">Browse the calendar ' + ARR + '</a><a href="/add" class="btn btn-ghost">Add your event</a></div>'
    + (next ? '<div class="in d4"><a class="nextup" href="/event/' + next.id + '"><span class="dot"></span><span>Next up · <b>' + esc(next.n) + '</b> · ' + whenOf(next).replace('Starts in', 'in').toLowerCase() + '</span></a></div>' : '')
    + '</div><div class="dial in d2 big">' + heroArt() + '</div></div>'
    + '<div class="stats"><div class="wrap statsg">'
    + '<div class="stat reveal" style="--d:0ms"><div class="n" data-count="' + up.length + '">' + up.length + '</div><div class="l">Upcoming events</div></div>'
    + '<div class="stat reveal" style="--d:130ms"><div class="n" data-count="' + countries + '">' + countries + '</div><div class="l">Countries</div></div>'
    + '<div class="stat reveal" style="--d:260ms"><div class="n"><span data-count="100">100</span>%</div><div class="l">Linked to official sources</div></div>'
    + '<div class="stat reveal" style="--d:390ms"><div class="n">Free</div><div class="l">For visitors &amp; organisers</div></div></div></div></section>'
    + '<section class="dark" style="border-top:1px solid var(--line-d)"><div class="wrap" style="padding-top:96px;padding-bottom:104px"><div class="eyebrow reveal">Explore by country</div>'
    + '<div class="reveal" style="margin-top:4px;display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:24px"><h2 class="sec">Where the watch world <em class="g">meets.</em></h2><a href="/map" class="ul" style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold)">Open the world map</a></div>'
    + '<a href="/map" class="mapcard reveal z" style="margin-top:44px" aria-label="Open the interactive world map">' + miniMap() + '<span class="btn btn-gold cta" style="min-height:42px;padding:0 18px;font-size:12px;letter-spacing:.14em;text-transform:uppercase">Explore the map ' + ARR + '</span></a></div></section>'
    + '<section class="wrap" style="padding-top:112px"><div style="display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:24px"><div><div class="eyebrow reveal">Highlights</div><h2 class="sec reveal">The season’s key dates</h2></div><a href="/#calendar" data-act="scroll" class="ul" style="font-size:12px;letter-spacing:.16em;text-transform:uppercase">See all events</a></div>'
    + '<div class="cards">' + hl.map((e, i) => { const x = dm(e.s, e.e); return '<a href="/event/' + e.id + '" class="card reveal" style="--d:' + i * 140 + 'ms"><div class="k">' + esc(e.tl) + ' · ' + esc(e.city) + '</div><div class="serif" style="margin-top:28px;font-size:56px;line-height:1">' + x.days + '</div><div class="k" style="margin-top:6px;font-size:14px">' + ML[+e.s.slice(5, 7) - 1] + ' ' + e.s.slice(0, 4) + '</div><div style="margin-top:auto;padding-top:20px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:flex-end;gap:16px"><span style="font-size:19px;font-weight:600;line-height:1.35;padding-top:20px">' + esc(e.n) + '</span>' + ARR + '</div></a>'; }).join('') + '</div></section>'
    + '<section class="wrap" id="calendar" style="padding-top:120px;padding-bottom:120px;scroll-margin-top:20px"><div class="eyebrow reveal">Calendar</div>'
    + '<div style="margin-top:4px;display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:16px"><h2 class="sec reveal">Upcoming events</h2><div style="display:flex;flex-wrap:wrap;align-items:center;gap:20px"><p id="count" style="margin:0;font-size:14px;color:var(--muted)"></p><a href="/agenda" class="btn btn-line" style="min-height:44px;padding:0 20px;font-size:13px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>Agenda view</a></div></div>'
    + '<div class="filters reveal" style="--d:120ms"><div class="frow">'
    + '<label style="flex:2 1 280px;position:relative"><span class="sr">Search</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5A6170" stroke-width="1.6" stroke-linecap="round" aria-hidden="true" style="position:absolute;left:16px;top:15px"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input class="field" data-f="q" type="search" placeholder="Search an event, a city or an organiser" style="padding-left:46px" value="' + esc(F.q) + '"></label>'
    + '<label style="flex:1 1 150px"><span class="sr">Country</span><select class="field" data-f="country"><option value="">All countries</option>' + ctys.map((c) => '<option' + (F.country === c ? ' selected' : '') + '>' + esc(c) + '</option>').join('') + '</select></label>'
        + '<label style="flex:1 1 150px"><span class="sr">Exhibitors</span><select class="field" data-f="size"><option value="">Any size</option><option value="s"' + (F.size === 's' ? ' selected' : '') + '>Under 50 exhibitors</option><option value="m"' + (F.size === 'm' ? ' selected' : '') + '>50 – 200 exhibitors</option><option value="l"' + (F.size === 'l' ? ' selected' : '') + '>200+ exhibitors</option></select></label></div>'
    + '<div class="tabs" role="group" aria-label="Event type" id="tabs"></div><div class="frow" role="group" aria-label="More filters" id="togs"></div></div>'
    + '<div class="mtabs-wrap"><div class="mtabs" id="mtabs" role="tablist" aria-label="Months"></div></div><div id="list"></div></section>'
    + '<section class="wrap" style="padding-bottom:120px"><div class="reveal" style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:40px;padding:clamp(28px,5vw,56px);border:1px solid var(--line);border-radius:4px"><div style="flex:1 1 380px"><div class="eyebrow">Monthly digest</div><h2 class="sec" style="font-size:44px">This month in <em style="font-style:italic">watch events</em></h2><p style="margin:14px 0 0;font-size:16px;line-height:1.65;color:var(--muted)">One email at the start of each month with every fair, auction and watch week ahead. Unsubscribe anytime.</p></div>'
    + '<form id="nlf" style="flex:1 1 360px" novalidate><div style="display:flex;flex-wrap:wrap;gap:10px"><label style="flex:1 1 220px"><span class="sr">Email address</span><input class="field" type="email" required placeholder="Your email address" style="height:54px;border-radius:999px;padding:0 18px"></label><button class="btn btn-navy" type="submit">Subscribe</button></div><p style="margin:12px 0 0 18px;font-size:12px;color:var(--muted)">Free. No spam.</p></form></div></section>'
    + '<section class="dark"><div class="reveal" style="max-width:760px;margin:0 auto;padding:112px 24px;text-align:center"><div class="k" style="color:var(--gold3)">For organisers</div><h2 class="sec">Organising a watch event?</h2><p style="margin:20px auto 0;font-size:17px;line-height:1.65;color:var(--muted-d);max-width:520px">Add it to the calendar in a few minutes and reach brands, press and collectors worldwide. It’s free.</p><a href="/add" class="btn btn-gold" style="margin-top:40px">Add your event ' + ARR + '</a></div></section>'
    + footer(false);
}
function exhNum(e) { const m = (e.exh || '').match(/\d+/); return m ? +m[0] : null; }
function renderList() {
  let list;
  const box = document.getElementById('list'); if (!box) return;
  const tabs = [['all', 'All events'], ['trade', 'Trade fairs'], ['public', 'Public fairs'], ['jewel', 'Jewellery & watches'], ['vintage', 'Vintage & collectors'], ['auction', 'Auctions & awards']];
  document.getElementById('tabs').innerHTML = tabs.map(([k, l]) => '<button class="tab' + (F.type === k ? ' on' : '') + '" data-act="type" data-v="' + k + '" aria-pressed="' + (F.type === k) + '">' + l + '</button>').join('');
  const ck = '<span class="box"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>';
  const ns = Object.keys(saved).length;
  document.getElementById('togs').innerHTML = [['open', 'Open to the public'], ['free', 'Free entry'], ['mine', '★ My season (' + ns + ')']].map(([k, l]) => '<button class="tog' + (F[k] ? ' on' : '') + '" data-act="tog" data-v="' + k + '" aria-pressed="' + F[k] + '">' + ck + l + '</button>').join('');
  const q = F.q.trim().toLowerCase();
  list = upcoming().filter((e) => (F.type === 'all' || e.t === F.type)
    && (!q || (e.n + ' ' + e.city + ' ' + e.country + ' ' + e.org + ' ' + e.venue).toLowerCase().includes(q))
    && (!F.country || e.country === F.country)
    && (!F.size || ((n) => n != null && (F.size === 's' ? n < 50 : F.size === 'm' ? n >= 50 && n <= 200 : n > 200))(exhNum(e)))
    && (!F.open || !e.closed) && (!F.free || e.free) && (!F.mine || saved[e.id]));
  document.getElementById('count').textContent = list.length + (list.length === 1 ? ' upcoming event' : ' upcoming events');
  const allMonths = [...new Set(upcoming().map((e) => e.s.slice(0, 7)))].sort();
  const mc = {}; list.forEach((e) => { const k = e.s.slice(0, 7); mc[k] = (mc[k] || 0) + 1; });
  if (!allMonths.includes(F.month) || (!mc[F.month] && list.length && F.autoMonth)) { F.month = allMonths.find((k) => mc[k]) || allMonths[0]; F.autoMonth = true; }
  document.getElementById('mtabs').innerHTML = allMonths.map((k) => { const on = k === F.month; const n = mc[k] || 0; return '<button role="tab" class="mt' + (on ? ' on' : '') + (n ? '' : ' zero') + '" data-act="mtab" data-v="' + k + '" aria-selected="' + on + '"><span class="y">' + k.slice(0, 4) + '</span><span class="mn">' + MS[+k.slice(5) - 1] + '</span><span class="c">' + n + (n === 1 ? ' event' : ' events') + '</span></button>'; }).join('');
  const act = document.querySelector('.mt.on'); if (act && act.scrollIntoView) { const p = act.parentNode; p.scrollLeft = act.offsetLeft - p.offsetWidth / 2 + act.offsetWidth / 2; }
  const full = list;
  list = list.filter((e) => e.s.slice(0, 7) === F.month);
  const mi = allMonths.indexOf(F.month);
  const prevM = allMonths.slice(0, mi).reverse().find((k) => mc[k]), nextM = allMonths.slice(mi + 1).find((k) => mc[k]);
  const mname = (k) => ML[+k.slice(5) - 1] + ' ' + k.slice(0, 4);
  const mnav = '<div class="mnav">' + (prevM ? '<button class="btn btn-line" data-act="mtab" data-v="' + prevM + '" data-top="1"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>' + mname(prevM) + '</button>' : '<span></span>') + (nextM ? '<button class="btn btn-navy" data-act="mtab" data-v="' + nextM + '" data-top="1">Next: ' + mname(nextM) + ' · ' + mc[nextM] + (mc[nextM] === 1 ? ' event ' : ' events ') + ARR + '</button>' : '') + '</div>';
  if (full.length && !list.length) { box.innerHTML = '<div class="empty">No event in ' + mname(F.month) + ' with these filters.' + (nextM ? ' <button class="ul" data-act="mtab" data-v="' + nextM + '" style="border:0;background:none;cursor:pointer;color:var(--navy)">See ' + mname(nextM) + '</button>' : '') + '</div>' + mnav; return; }
  if (!list.length) { box.innerHTML = '<div class="empty">No event matches these filters. <button class="ul" data-act="reset" style="border:0;background:none;cursor:pointer;color:var(--navy)">Reset filters</button></div>'; return; }
  const groups = {};
  list.forEach((e) => { (groups[e.s.slice(0, 7)] = groups[e.s.slice(0, 7)] || []).push(e); });
  box.innerHTML = Object.keys(groups).map((m) => '<section class="month reveal"><div class="mhead"><h3 class="serif" style="margin:0;font-size:34px">' + ML[+m.slice(5) - 1] + ' ' + m.slice(0, 4) + '</h3><span class="k">' + groups[m].length + (groups[m].length === 1 ? ' event' : ' events') + '</span></div>'
    + groups[m].map((e, i) => { const x = dm(e.s, e.e); const on = !!saved[e.id];
      return '<div class="row reveal" style="--d:' + Math.min(i, 8) * 70 + 'ms"><a class="rowa" href="/event/' + e.id + '"><div class="date"><div class="d">' + x.days + '</div><div class="m">' + x.mon + '</div></div>'
        + '<div style="flex:999 1 300px;min-width:0"><div style="font-size:18px;font-weight:600">' + esc(e.n) + '</div><div style="margin-top:6px;font-size:14px;color:var(--muted)">' + esc(place(e)) + '</div></div>'
        + '<div style="flex:1 1 190px;display:flex;flex-direction:column;gap:6px"><span class="tag" style="color:#3A414D">' + esc(e.tl) + '</span>'
        + (e.tbc ? '<span class="tag" style="color:#8A3F06">Dates to be confirmed</span>' : '')
        + (live(e) ? '<span class="tag" style="display:inline-flex;align-items:center;gap:8px;color:#7A5A1E"><span class="dot" style="width:7px;height:7px;background:#B8975A"></span>Happening now</span>' : '')
        + (e.free ? '<span class="tag" style="color:#2F6B4F">Free entry</span>' : '') + (e.closed ? '<span class="tag" style="color:var(--muted)">Trade / invitation only</span>' : '') + '</div>'
        + '<div style="flex:0 0 140px;font-size:14px;color:var(--muted)">' + esc(e.exh || '—') + '</div>' + ARR + '</a>'
        + '<button class="star" data-act="star" data-id="' + e.id + '" aria-pressed="' + on + '" aria-label="' + (on ? 'Remove from' : 'Save to') + ' My season" title="' + (on ? 'Remove from' : 'Save to') + ' My season">' + STAR(on) + '</button></div>'; }).join('') + '</section>').join('') + mnav;
  observe();
}

/* ---------------- EVENT ---------------- */
function gcal(e) { return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(e.n) + '&dates=' + e.s.replace(/-/g, '') + '/' + ISO(T(e.e) + DAY).replace(/-/g, '') + '&location=' + encodeURIComponent(place(e)) + '&details=' + encodeURIComponent(e.site || ''); }
function outlook(e) { return 'https://outlook.live.com/calendar/0/deeplink/compose?subject=' + encodeURIComponent(e.n) + '&startdt=' + e.s + '&enddt=' + ISO(T(e.e) + DAY) + '&allday=true&location=' + encodeURIComponent(place(e)); }
function pageEvent(id) {
  const e = byId[id];
  if (!e) return header('') + '<main class="wrap" style="padding:120px 24px"><h1 class="big">Event not found</h1><p><a href="/" class="ul">Back to the calendar</a></p></main>' + footer(false);
  const on = !!saved[e.id];
  const more = upcoming().filter((x) => x.id !== e.id && x.t === e.t).slice(0, 3);
  const desc = e.desc || (e.n + ' takes place ' + (e.venue ? 'at ' + e.venue + ' ' : '') + 'in ' + e.city + ', ' + e.country + '. Dates, tickets and access conditions are published by the organiser on the official website.');
  const shareUrl = encodeURIComponent(location.href);
  return '<section class="dark">' + header('home') + '<div class="wrap" style="padding-top:48px;padding-bottom:' + (e.img ? 128 : 88) + 'px">'
    + '<a href="/" class="in" style="display:inline-flex;align-items:center;gap:10px;min-height:44px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted-d);text-decoration:none"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>Back to calendar</a>'
    + '<div class="eyebrow in d1" style="margin-top:40px">' + esc(e.tl) + ' · ' + esc(e.city) + ' · ' + esc(e.country) + '</div>'
    + '<h1 class="big in d2" style="max-width:920px">' + esc(e.n) + '</h1>'
    + '<p class="in d3" style="margin:22px 0 0;font-size:19px;color:var(--muted-d)">' + range(e.s, e.e) + (e.venue ? ' · ' + esc(e.venue) : '') + '</p>'
    + (e.tbc ? '<p class="in d3 tag" style="margin:12px 0 0;color:#E8A15C">Dates to be confirmed</p>' : '')
    + '<div class="in d3" style="margin-top:18px;display:flex;flex-wrap:wrap;align-items:center;gap:10px 18px;font-size:13px;color:var(--muted-d2)">' + (e.ver ? '<span style="display:inline-flex;align-items:center;gap:8px;min-height:30px;padding:0 12px;border-radius:999px;background:rgba(201,168,106,.14);border:1px solid var(--gold2);color:var(--gold)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>Verified listing</span><span>Checked with the organiser.</span>' : '<span style="display:inline-flex;align-items:center;gap:8px;min-height:30px;padding:0 12px;border-radius:999px;border:1px dashed #4A5A72;color:var(--muted-d)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z"/></svg>Not yet verified by the organiser</span><span>Listed from official sources. <a href="/add" class="ul" style="color:var(--gold)">Are you the organiser? Verify this listing</a></span>') + (e.upd ? '<span>Last updated ' + range(e.upd, e.upd) + '</span>' : '') + '</div>'
    + '<div class="in d4" style="margin-top:52px;display:flex;flex-wrap:wrap;align-items:flex-end;gap:32px"><div class="cd" id="cd" data-start="' + e.s + '" role="timer" aria-label="Time until the event opens"></div><div style="display:inline-flex;align-items:center;gap:10px;padding-bottom:6px;font-size:13px;color:var(--muted-d)"><span class="dot"></span>' + whenOf(e) + '</div></div></div></section>'
    + (e.img ? '<div class="wrap cover-wrap"><figure class="cover reveal z"><img data-act="zoom" data-cover="1" data-id="' + e.id + '" data-i="0" style="cursor:zoom-in" src="' + e.img + '" alt="' + esc(e.alt || e.n) + '" loading="lazy"><figcaption>Photo ' + esc(e.credit || '') + '</figcaption></figure>' + (e.gal && e.gal.length ? '<div class="gal">' + e.gal.map((g, i) => '<button class="galb reveal" style="--d:' + i * 120 + 'ms" data-act="zoom" data-id="' + e.id + '" data-i="' + i + '" aria-label="Enlarge photo: ' + esc(g.alt) + '"><img src="' + g.src + '" alt="' + esc(g.alt) + '" loading="lazy"></button>').join('') + '</div>' : '') + '</div>' : '')
    + '<main class="wrap" style="padding-top:' + (e.img ? 72 : 96) + 'px;padding-bottom:40px"><div style="display:flex;flex-wrap:wrap;gap:64px;align-items:flex-start">'
    + '<div class="reveal l" style="flex:999 1 520px;min-width:0"><div class="eyebrow">About the event</div><p class="serif" style="margin:26px 0 0;font-size:30px;line-height:1.35">' + esc(desc) + '</p>'
    + '<div style="margin-top:44px;padding:24px 28px;background:var(--surface);border-radius:4px;font-size:14px;line-height:1.65;color:var(--muted)">This listing is published from the organiser’s official information. The organiser is responsible for its content. Always confirm dates and access conditions on the official website. <a href="/add" class="ul">Report an error</a></div>'
    + '<section aria-labelledby="press" class="reveal" style="margin-top:56px;border:1px solid var(--navy);border-radius:4px;overflow:hidden"><div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;padding:22px 28px;background:var(--navy);color:#fff"><h2 id="press" class="serif" style="margin:0;display:flex;align-items:center;gap:12px;font-size:28px"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E4CF9F" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h6M7 13h10M7 16h7"/></svg>For press</h2><span class="k" style="color:var(--gold3);font-size:11px">Journalists &amp; media</span></div>'
    + '<dl class="facts" style="margin:0;padding:8px 28px 24px">' + (e.press ? '<div><dt>Trade &amp; press days</dt><dd>' + esc(e.press) + '</dd></div>' : '')
    + '<div><dt>Press accreditation</dt><dd>' + (e.site ? '<a class="ul" href="' + esc(e.site) + '" target="_blank" rel="noopener">Via the official website ↗</a>' : 'Contact the organiser') + '</dd></div><div><dt>Press contact</dt><dd>' + esc(e.org || 'The organiser') + '</dd></div></dl></section></div>'
    + '<aside aria-label="Key facts" class="reveal r" style="--d:150ms;"flex:1 1 340px;border:1px solid var(--line);border-radius:4px;padding:36px"><div class="k">Key facts</div><dl class="facts">'
    + '<div><dt>Dates</dt><dd>' + range(e.s, e.e) + '</dd></div><div><dt>Duration</dt><dd>' + dur(e) + '</dd></div><div><dt>Venue</dt><dd>' + esc(e.venue || '—') + '</dd></div><div><dt>City</dt><dd>' + esc(e.city + ', ' + e.country) + '</dd></div><div><dt>Type</dt><dd>' + esc(e.tl) + '</dd></div><div><dt>Exhibitors</dt><dd>' + esc(e.exh || '—') + '</dd></div><div><dt>Open to</dt><dd>' + (e.closed ? 'Trade / invitation' : 'Public') + (e.free ? ' · free entry' : '') + '</dd></div><div><dt>Organiser</dt><dd>' + esc(e.org || '—') + '</dd></div></dl>'
    + (e.site ? '<a href="' + esc(e.site) + '" target="_blank" rel="noopener" class="btn btn-navy" style="margin-top:28px;width:100%;justify-content:center">Visit official website <svg class="arr" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"/></svg></a>' : '')
    + '<button class="btn btn-line" data-act="star" data-id="' + e.id + '" aria-pressed="' + on + '" style="margin-top:12px;width:100%;justify-content:center;' + (on ? 'border-color:#B8975A;background:#FBF6EA' : '') + '">' + STAR(on).replace('#8A909A', '#0E1116') + (on ? 'Saved to My season' : 'Save to My season') + '</button>'
    + '<div style="margin-top:28px;padding-top:24px;border-top:1px solid var(--line)"><div class="k" style="font-size:11px">Add to my calendar</div><div style="margin-top:12px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px"><a class="act" target="_blank" rel="noopener" href="' + esc(gcal(e)) + '">Google</a><button class="act" data-act="ics" data-id="' + e.id + '">Apple</button><a class="act" target="_blank" rel="noopener" href="' + esc(outlook(e)) + '">Outlook</a></div></div>'
    + '<div style="margin-top:24px;padding-top:24px;border-top:1px solid var(--line)"><div class="k" style="font-size:11px">Share</div><div style="margin-top:12px;display:flex;gap:8px">'
    + '<a class="act round" target="_blank" rel="noopener" aria-label="Share on LinkedIn" href="https://www.linkedin.com/sharing/share-offsite/?url=' + shareUrl + '"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/></svg></a>'
    + '<a class="act round" target="_blank" rel="noopener" aria-label="Share on WhatsApp" href="https://wa.me/?text=' + encodeURIComponent(e.n + ' – ' + range(e.s, e.e) + ' ') + shareUrl + '"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/></svg></a>'
    + '<button class="act" data-act="copy" style="flex:1 1 auto;border-radius:999px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>Copy link</button></div></div></aside></div>'
    + (more.length ? '<section class="reveal" style="margin-top:120px"><div style="display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:16px"><h2 class="sec" style="margin:0;font-size:44px">You may also like</h2><a href="/" class="ul k">All events</a></div><div style="margin-top:36px;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px">'
      + more.map((x, i) => '<a href="/event/' + x.id + '" class="card reveal" style="--d:' + i * 120 + 'ms;min-height:0;padding:28px;gap:10px"><div class="k" style="font-size:11px">' + range(x.s, x.e) + ' · ' + esc(x.city) + '</div><div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><span style="font-size:18px;font-weight:600">' + esc(x.n) + '</span>' + ARR + '</div></a>').join('') + '</div></section>' : '')
    + '</main><div style="height:80px"></div>' + footer(false);
}
function tickCountdown() {
  const el = document.getElementById('cd'); if (!el) return;
  let t = Math.max(0, Math.floor((T(el.dataset.start) - 2 * 3600e3 + 9 * 3600e3 - Date.now()) / 1000));
  if (t <= 0) { el.innerHTML = ''; return; }
  const pad = (x) => (x < 10 ? '0' : '') + x;
  const d = Math.floor(t / 86400); t -= d * 86400; const h = Math.floor(t / 3600); t -= h * 3600; const m = Math.floor(t / 60); const s = t - m * 60;
  el.innerHTML = '<div><b>' + d + '</b><span>Days</span></div><div><b>' + pad(h) + '</b><span>Hours</span></div><div><b>' + pad(m) + '</b><span>Minutes</span></div><div><b>' + pad(s) + '</b><span>Seconds</span></div>';
}

/* ---------------- AGENDA ---------------- */
const A = { mi: 0, sel: '', hidden: {} };
function agMonths() { return [...new Set(upcoming().map((e) => e.s.slice(0, 7)))].sort(); }
function pageAgenda() {
  return '<section class="dark">' + header('agenda') + '<div class="wrap-l" style="padding-top:72px;padding-bottom:56px"><div class="eyebrow in">Agenda</div><h1 class="big in d1">The season, <em class="g">at a glance.</em></h1><div id="aghead"></div></div></section><main class="wrap-l" style="padding-top:48px;padding-bottom:120px" id="agbody"></main>' + footer(false);
}
function renderAgenda() {
  const months = agMonths(); A.mi = Math.max(0, Math.min(months.length - 1, A.mi));
  const ym = months[A.mi]; const y = +ym.slice(0, 4), m = +ym.slice(5, 7);
  const ms = Date.UTC(y, m - 1, 1), me = Date.UTC(y, m, 0);
  const vis = (e) => !A.hidden[e.t];
  const up = upcoming();
  const inM = up.filter((e) => T(e.s) <= me && T(e.e) >= ms && vis(e));
  if (!A.sel || !inM.some((e) => e.id === A.sel)) A.sel = inM[0] ? inM[0].id : '';
  const counts = months.map((k) => up.filter((e) => e.s.slice(0, 7) === k && vis(e)).length);
  const mx = Math.max(1, ...counts);
  document.getElementById('aghead').innerHTML = '<div style="margin-top:52px;display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:24px"><div style="display:flex;align-items:center;gap:18px"><button class="navb" data-act="agprev" aria-label="Previous month"' + (A.mi === 0 ? ' disabled' : '') + '><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button><h2 aria-live="polite" class="serif" style="margin:0;min-width:min(330px,52vw);text-align:center;font-size:clamp(34px,5vw,56px);line-height:1;color:var(--gold)">' + ML[m - 1] + ' ' + y + '</h2><button class="navb" data-act="agnext" aria-label="Next month"' + (A.mi === months.length - 1 ? ' disabled' : '') + '><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button></div><p style="margin:0;font-size:14px;color:var(--muted-d)">' + inM.length + (inM.length === 1 ? ' event this month' : ' events this month') + '</p></div>'
    + '<div class="strip" role="group" aria-label="Jump to a month">' + months.map((k, j) => { const mm = +k.slice(5); return '<button class="sm' + (j === A.mi ? ' on' : '') + '" data-act="agm" data-v="' + j + '" aria-pressed="' + (j === A.mi) + '" aria-label="' + ML[mm - 1] + ' ' + k.slice(0, 4) + ', ' + counts[j] + ' events"><span style="height:72px;width:100%;display:flex;align-items:flex-end;justify-content:center"><span class="h" style="height:' + Math.max(4, Math.round(counts[j] / mx * 68)) + 'px;animation-delay:' + j * 60 + 'ms"></span></span><span class="serif" style="font-size:22px;line-height:1">' + counts[j] + '</span><span style="font-size:11px;letter-spacing:.14em;text-transform:uppercase">' + MS[mm - 1] + (mm === 1 || j === 0 ? ' ’' + k.slice(2, 4) : '') + '</span></button>'; }).join('') + '</div>';
  const dowI = (new Date(ms).getUTCDay() + 6) % 7; let ws = ms - dowI * DAY; let weeks = '';
  const t0 = today();
  while (ws <= me) {
    const we = ws + 6 * DAY; let bg = '';
    for (let k = 0; k < 7; k++) { const t = ws + k * DAY; const dt = new Date(t); const out = dt.getUTCMonth() !== m - 1; const isT = ISO(t) === t0; bg += '<div class="' + (out ? 'out' : k >= 5 ? 'we' : '') + (isT ? ' today' : '') + '"><span>' + dt.getUTCDate() + '</span>' + (isT ? '<span style="margin-left:8px;width:auto;height:auto;background:none;color:#8A6A2E;font-size:10px;letter-spacing:.16em;text-transform:uppercase">Today</span>' : '') + '</div>'; }
    const lst = up.filter((e) => T(e.s) <= we && T(e.e) >= ws && vis(e)).sort((a, b) => (T(a.s) - T(b.s)) || (T(b.e) - T(a.e)));
    const laneEnd = [];
    const bars = lst.map((e, n) => {
      const s = Math.max(T(e.s), ws), en = Math.min(T(e.e), we);
      let lane = laneEnd.findIndex((x) => x < s); if (lane < 0) { lane = laneEnd.length; laneEnd.push(en); } else laneEnd[lane] = en;
      const col = Math.round((s - ws) / DAY) + 1, span = Math.round((en - s) / DAY) + 1; const c = TY[e.t];
      const cl = T(e.s) < ws, cr = T(e.e) > we; const isS = e.id === A.sel;
      return '<button class="ebar" data-act="agsel" data-id="' + e.id + '" title="' + esc(e.n + ', ' + range(e.s, e.e)) + '" style="grid-column:' + col + ' / span ' + span + ';grid-row:' + (lane + 1) + ';margin:0 ' + (cr ? 0 : 4) + 'px 0 ' + (cl ? 0 : 4) + 'px;border-radius:' + (cl ? 0 : 6) + 'px ' + (cr ? 0 : 6) + 'px ' + (cr ? 0 : 6) + 'px ' + (cl ? 0 : 6) + 'px;background:' + c[1] + ';color:' + c[2] + ';animation-delay:' + n * 40 + 'ms;box-shadow:' + (isS ? '0 0 0 2px #fff,0 0 0 4px #B8975A' : c[3]) + (e.tbc ? ';background-image:repeating-linear-gradient(135deg,transparent 0 8px,rgba(255,255,255,.18) 8px 12px)' : '') + '">' + (cl ? '← ' : '') + esc(e.n) + '</button>';
    }).join('');
    weeks += '<div class="wk">' + (lst.length >= 4 ? '<span class="busy"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>Busy week · ' + lst.length + ' events</span>' : '') + '<div class="wkbg" aria-hidden="true">' + bg + '</div><div class="wkfg" style="min-height:' + Math.max(130, 60 + laneEnd.length * 35) + 'px">' + bars + '</div></div>';
    ws += 7 * DAY;
  }
  const se = byId[A.sel];
  const legend = Object.keys(TY).map((k) => '<button class="leg' + (A.hidden[k] ? ' off' : '') + '" data-act="agleg" data-v="' + k + '" aria-pressed="' + !A.hidden[k] + '"><span class="sw" style="background:' + TY[k][1] + ';box-shadow:' + TY[k][3] + '"></span>' + TY[k][0] + '</button>').join('');
  document.getElementById('agbody').innerHTML = '<div role="group" aria-label="Show event types" style="display:flex;flex-wrap:wrap;gap:10px;align-items:center"><span class="k" style="font-size:11px;margin-right:8px">Show</span>' + legend + '</div>'
    + '<div style="margin-top:32px;display:flex;flex-wrap:wrap;gap:40px;align-items:flex-start"><div style="flex:999 1 720px;min-width:0;overflow-x:auto"><div class="cal"><div class="dow" aria-hidden="true">' + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => '<div>' + d + '</div>').join('') + '</div>' + weeks + '</div></div>'
    + '<aside aria-label="Event details" style="flex:1 1 300px;display:flex;flex-direction:column;gap:32px">'
    + (se ? '<div class="pane"><span style="display:inline-flex;align-items:center;min-height:28px;padding:0 12px;border-radius:999px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;background:' + TY[se.t][1] + ';color:' + TY[se.t][2] + ';box-shadow:' + TY[se.t][3] + '">' + esc(se.tl) + '</span><h3 class="serif" style="margin:20px 0 0;font-size:32px;line-height:1.1">' + esc(se.n) + '</h3><p style="margin:12px 0 0;font-size:16px;font-weight:600">' + range(se.s, se.e) + '</p><div style="margin-top:14px;display:inline-flex;align-items:center;gap:10px;font-size:13px;color:var(--muted)"><span class="dot" style="width:7px;height:7px;background:#B8975A"></span>' + whenOf(se) + '</div>'
      + '<dl class="facts"><div><dt>Duration</dt><dd>' + dur(se) + '</dd></div><div><dt>Where</dt><dd>' + esc(place(se)) + '</dd></div><div><dt>Exhibitors</dt><dd>' + esc(se.exh || '—') + '</dd></div></dl>' + (se.tbc ? '<p class="tag" style="margin:16px 0 0;color:#8A3F06">Dates to be confirmed</p>' : '')
      + '<a href="/event/' + se.id + '" class="btn btn-navy" style="margin-top:24px;width:100%;justify-content:center;min-height:50px;font-size:14px">View event ' + ARR + '</a><a href="' + esc(gcal(se)) + '" target="_blank" rel="noopener" class="btn btn-line" style="margin-top:10px;width:100%;justify-content:center;min-height:46px;font-size:13px">Add to my calendar</a></div>' : '<div class="pane" style="color:var(--muted)">No event this month for the selected types.</div>')
    + '<div><div class="k" style="font-size:11px;padding-bottom:12px;border-bottom:1px solid var(--ink)">In ' + ML[m - 1] + ' ' + y + '</div>'
    + inM.map((e) => '<button class="li' + (e.id === A.sel ? ' on' : '') + '" data-act="agsel" data-id="' + e.id + '"><span style="flex:0 0 auto;width:8px;height:8px;border-radius:2px;background:' + TY[e.t][1] + ';box-shadow:' + TY[e.t][3] + '"></span><span style="flex:0 0 52px;font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums">' + dm(e.s, e.e).days + ' ' + dm(e.s, e.e).mon.split('–')[0] + '</span><span style="flex:1 1 auto;min-width:0;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(e.n) + '</span></button>').join('') + '</div></aside></div>';
}

/* ---------------- MAP ---------------- */
const M = { country: '', city: '', ev: '', all: false };
function pageMap() {
  let hi = '';
  let glow = '';
  activeCC().forEach((k) => { hi += '<path class="cty" data-act="mc" data-v="' + k + '" data-cc="' + k + '" d="' + D.map.hi[k] + '" vector-effect="non-scaling-stroke" stroke-linejoin="round"><title>' + CN[k] + '</title></path>'; glow += '<path d="' + D.map.hi[k] + '" fill="#8A7448"/>'; });
  const cnt = {}; mapEvents().forEach((e) => { cnt[e.city] = (cnt[e.city] || 0) + 1; });
  let pins = '';
  Object.keys(cnt).forEach((c, j) => {
    const [x, y] = PINS[c];
    pins += '<g class="pin" data-act="mcity" data-v="' + esc(c) + '" data-city="' + esc(c) + '"><title>' + esc(c) + ' – ' + cnt[c] + (cnt[c] === 1 ? ' event' : ' events') + '</title><circle class="pr pulse" cx="' + x + '" cy="' + y + '" fill="none" stroke="#E4CF9F" style="animation-delay:' + (j * 170 % 2400) + 'ms"/><circle class="ph" cx="' + x + '" cy="' + y + '" fill="#000" fill-opacity="0"/><circle class="pc" cx="' + x + '" cy="' + y + '" fill="#E4CF9F" stroke="#0A1322"/><text class="lbl" font-family="Inter,sans-serif" font-weight="600" fill="#fff" paint-order="stroke" stroke="#0A1322">' + esc(c) + (cnt[c] > 1 ? ' · ' + cnt[c] : '') + '</text></g>';
  });
  return '<div class="dark" style="min-height:100vh">' + header('map') + '<main class="wrap-l" style="padding-top:64px;padding-bottom:96px"><div class="eyebrow in">World map</div>'
    + '<div class="in d1" style="margin-top:4px;display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:24px"><h1 class="big">The watch world, <em class="g">mapped.</em></h1><p style="margin:0;font-size:15px;color:var(--muted-d);max-width:380px;line-height:1.6">Choose a country, then a gold point to see what is happening there.</p></div>'
    + '<div class="in d2" style="margin-top:44px;display:flex;flex-wrap:wrap;gap:32px;align-items:stretch"><div style="flex:999 1 720px;min-width:0;display:flex;flex-direction:column;gap:18px">'
    + '<nav aria-label="Map breadcrumb" id="crumbs" style="display:flex;flex-wrap:wrap;align-items:center;gap:10px;min-height:32px"></nav>'
    + '<div class="mapwrap"><div class="mapbox" id="mapbox"><svg class="ml" viewBox="0 0 1000 500" aria-hidden="true"><g class="zg"><g fill="#152338" stroke="#26364E" stroke-width="0.7" vector-effect="non-scaling-stroke" stroke-linejoin="round" class="nss">' + BASE_PATHS + '</g>' + hi + '</g></svg><svg class="ml glow" viewBox="0 0 1000 500" aria-hidden="true"><g class="zg">' + glow + '</g></svg><svg class="ml pl" viewBox="0 0 1000 500" aria-hidden="true"><g class="zg">' + pins + '</g></svg><div class="hint" aria-hidden="true" style="left:' + (PINS.Geneva[0] / 10) + '%;top:' + (PINS.Geneva[1] / 5) + '%"><span class="tap"></span><span class="tap t2"></span><svg class="hpoint" width="30" height="30" viewBox="0 0 24 24" fill="#FFFFFF" stroke="#0A1322" stroke-width="1.2" stroke-linejoin="round"><path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10l.5-.1a1.5 1.5 0 0 1 2.5 1.1l.3-.1a1.4 1.4 0 0 1 2.2 1.1l.2 0a1.4 1.4 0 0 1 2 1.3V17a5 5 0 0 1-5 5h-1.6a5 5 0 0 1-4-2l-3.1-4.2a1.4 1.4 0 0 1 2.1-1.8L9 15z"/></svg><span class="hbub">Start here · <b>Geneva</b> · ' + (cnt.Geneva || 0) + ' events</span></div>'
    + '<div class="hint2" aria-hidden="true"><span class="dot"></span>Click a gold country or point to explore</div>'
    + '<div id="callout"></div><button id="worldbtn" data-act="mworld" class="btn btn-ghost" style="display:none;position:absolute;top:16px;right:16px;min-height:40px;padding:0 16px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;background:rgba(10,19,34,.85);z-index:4">World view</button></div>'
    + '<div class="mleg" style="position:absolute;left:18px;bottom:16px;display:flex;flex-wrap:wrap;gap:14px;font-size:11px;color:var(--muted-d2);pointer-events:none"><span style="display:inline-flex;align-items:center;gap:8px"><span style="width:12px;height:8px;border-radius:2px;background:#4A4130;box-shadow:inset 0 0 0 1px #8A7448"></span>Country with events</span><span style="display:inline-flex;align-items:center;gap:8px"><span style="width:8px;height:8px;border-radius:50%;background:#E4CF9F"></span>City</span><span style="display:inline-flex;align-items:center;gap:8px"><span class="dot"></span>Event happening now</span></div></div>'
    + '<div role="group" aria-label="Choose a country" id="chips" style="display:flex;flex-wrap:wrap;gap:8px"></div></div>'
    + '<aside aria-label="Details" aria-live="polite" id="mpanel" style="flex:1 1 340px;border:1px solid var(--line-d);border-radius:6px;padding:32px;background:var(--navy2)"></aside></div></main>'
    + footer(false).replace('<footer class="ft">', '<footer class="ft" style="border-color:var(--line-d)">').replace(/color:var\(--ink\)/g, 'color:#C5CCD6').replace('class="ftb"', 'class="ftb" style="border-color:var(--line-d)"') + '</div>';
}
function updateMap() {
  const up = mapEvents(); const byC = {}, byCity = {};
  up.forEach((e) => { (byC[e.cc] = byC[e.cc] || []).push(e); (byCity[e.city] = byCity[e.city] || []).push(e); });
  let k = 1, tx = 0, ty = 0;
  if (M.country) {
    let [[x0, y0], [x1, y1]] = D.box[M.country];
    Object.keys(byCity).filter((n) => PINS[n][2] === M.country).forEach((n) => { const [px, py] = PINS[n]; x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py); });
    const bw = Math.max(18, (x1 - x0) * 1.35), bh = Math.max(9, (y1 - y0) * 1.35);
    k = Math.max(1, Math.min(40, Math.min(1000 / bw, 500 / bh)));
    tx = Math.min(0, Math.max(1000 - 1000 * k, 500 - k * (x0 + x1) / 2));
    ty = Math.min(0, Math.max(500 - 500 * k, 250 - k * (y0 + y1) / 2));
  }
  const zgs = document.querySelectorAll('#mapbox .zg'); if (!zgs.length) return;
  document.getElementById('mapbox').classList.toggle('idle', !M.country && !M.touched);
  const nt = 'translate(' + tx + 'px,' + ty + 'px) scale(' + k + ')';
  if (zgs[0].style.transform && zgs[0].style.transform !== nt) { const mbx = document.getElementById('mapbox'); mbx.classList.remove('swap'); void mbx.offsetWidth; mbx.classList.add('swap'); }
  zgs.forEach((g) => { g.style.transform = nt; });
  document.querySelectorAll('.cty').forEach((p) => {
    const c = p.dataset.cc, has = !!byC[c], on = c === M.country;
    p.classList.toggle('has', has);
    p.setAttribute('fill', on ? '#5C4E2E' : has ? (M.country ? '#2A2E2C' : '#4A4130') : '#152338');
    p.setAttribute('stroke', on ? '#E4CF9F' : has ? (M.country ? '#4A4636' : '#8A7448') : '#26364E');
    p.setAttribute('stroke-width', on ? '1.6' : '0.8');
  });
  document.querySelectorAll('.pin').forEach((g) => {
    const n = g.dataset.city, [x, y, c] = PINS[n], cnt = (byCity[n] || []).length;
    const mine = !M.country || c === M.country, act = n === M.city;
    const r = (3 + Math.min(cnt, 7) * 0.6) / (M.country ? Math.pow(k, 0.92) : 1) * (act ? 1.25 : 1);
    g.style.opacity = mine ? 1 : 0.2; g.style.transition = 'opacity .6s';
    const pr = g.querySelector('.pr'); pr.style.r = r + 'px'; pr.style.strokeWidth = (1.2 / k) + 'px';
    pr.style.display = (byCity[n] || []).some(live) ? '' : 'none';
    g.querySelector('.ph').style.r = (r + (M.country ? 10 / k : 6)) + 'px';
    const pc = g.querySelector('.pc'); pc.style.r = r + 'px'; pc.style.strokeWidth = (1.2 / k) + 'px'; pc.setAttribute('fill', act ? '#fff' : '#E4CF9F');
    const t = g.querySelector('.lbl'); t.setAttribute('x', x + r + 4 / k); t.setAttribute('y', y + 4 / k); t.setAttribute('font-size', 13 / k); t.setAttribute('stroke-width', 3 / k); t.style.opacity = M.country && c === M.country ? 1 : 0;
  });
  document.getElementById('worldbtn').style.display = M.country ? 'inline-flex' : 'none';
  const crumb = (txt, act, on) => '<button class="crumb' + (on ? ' on' : '') + '" data-act="' + act + '">' + esc(txt) + '</button>';
  const se = byId[M.ev];
  document.getElementById('crumbs').innerHTML = crumb('World', 'mworld', !M.country) + (M.country ? '<span aria-hidden="true" style="color:#4A5A72">/</span>' + crumb(CN[M.country], 'mback', !se) : '') + (se ? '<span aria-hidden="true" style="color:#4A5A72">/</span><span class="k" style="color:var(--gold);font-size:12px">' + esc(se.n) + '</span>' : '');
  const codes = Object.keys(byC).sort((a, b) => byC[b].length - byC[a].length || CN[a].localeCompare(CN[b]));
  document.getElementById('chips').innerHTML = codes.map((c) => '<button class="chip' + (c === M.country ? ' on' : '') + '" data-act="mc" data-v="' + c + '" aria-pressed="' + (c === M.country) + '">' + CN[c] + '<i>' + byC[c].length + '</i></button>').join('');
  const co = document.getElementById('callout');
  if (M.city && byCity[M.city] && !M.all) {
    const [x, y] = PINS[M.city]; const left = (k * x + tx) / 10, top = (k * y + ty) / 5; const below = top < 50; const list = byCity[M.city];
    co.innerHTML = '<div class="callout' + (below ? ' below' : '') + '" role="dialog" aria-label="' + esc(M.city) + '" style="left:' + Math.max(14, Math.min(86, left)) + '%;top:' + top + '%;max-height:calc(' + (below ? 100 - top : top) + '% - 34px)">'
      + '<div style="flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px 10px;border-bottom:1px solid #EFEDE8"><div><div class="k" style="font-size:10px;color:#8A6A2E">' + list.length + (list.length === 1 ? ' event here' : ' events here') + '</div><div class="serif" style="margin-top:4px;font-size:24px;line-height:1">' + esc(M.city) + '</div></div><button data-act="mclose" aria-label="Close" style="width:32px;height:32px;border:0;border-radius:50%;background:#F3F2EE;cursor:pointer;display:inline-flex;align-items:center;justify-content:center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>'
      + '<div style="flex:1 1 auto;min-height:0;overflow-y:auto;padding:6px 0">' + list.slice(0, 3).map((e) => '<button class="cev' + (e.id === M.ev ? ' on' : '') + '" data-act="mev" data-v="' + e.id + '"><span style="flex:0 0 auto;width:3px;align-self:stretch;border-radius:2px;background:' + (e.t === 'auction' ? '#9A8F7A' : TY[e.t][1]) + '"></span><span style="display:flex;flex-direction:column;gap:3px"><span style="font-size:14px;font-weight:600;line-height:1.3">' + esc(e.n) + '</span><span style="font-size:12px;color:var(--muted)">' + range(e.s, e.e) + (e.venue ? ' · ' + esc(e.venue) : '') + '</span></span></button>').join('') + '</div>'
      + (list.length > 3 ? '<button data-act="mall" style="flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;min-height:46px;padding:0 16px;border:0;border-top:1px solid #EFEDE8;border-radius:0 0 6px 6px;background:#FAF9F7;font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--navy);cursor:pointer">See all ' + list.length + ' events ' + ARR + '</button>' : '')
      + '<span aria-hidden="true" style="position:absolute;left:50%;' + (below ? 'top:-7px' : 'bottom:-7px') + ';width:14px;height:14px;margin-left:-7px;background:#fff;transform:rotate(45deg)"></span></div>';
  } else co.innerHTML = '';
  const panel = document.getElementById('mpanel');
  if (se) {
    panel.innerHTML = '<div class="pane" style="border:0;padding:0"><button class="crumb" data-act="mback" style="display:inline-flex;align-items:center;gap:8px">← ' + esc(CN[M.country]) + '</button><div style="margin-top:18px"><span style="display:inline-flex;align-items:center;min-height:26px;padding:0 12px;border-radius:999px;font-size:10px;letter-spacing:.16em;text-transform:uppercase;background:' + (se.t === 'auction' ? '#9A8F7A' : TY[se.t][1]) + ';color:#fff">' + esc(se.tl) + '</span></div><h2 class="serif" style="margin:18px 0 0;font-size:36px;line-height:1.08">' + esc(se.n) + '</h2><p style="margin:12px 0 0;font-size:16px;font-weight:600;color:var(--gold)">' + range(se.s, se.e) + '</p><div style="margin-top:12px;display:inline-flex;align-items:center;gap:10px;font-size:13px;color:var(--muted-d)"><span class="dot"></span>' + whenOf(se) + '</div>'
      + '<dl class="facts" style="--line:var(--line-d)"><div style="border-color:var(--line-d)"><dt style="color:var(--muted-d2)">Where</dt><dd>' + esc((se.venue ? se.venue + ', ' : '') + se.city) + '</dd></div><div style="border-color:var(--line-d)"><dt style="color:var(--muted-d2)">Duration</dt><dd>' + dur(se) + '</dd></div><div style="border-color:var(--line-d)"><dt style="color:var(--muted-d2)">Exhibitors</dt><dd>' + esc(se.exh || '—') + '</dd></div></dl>'
      + '<a href="/event/' + se.id + '" class="btn btn-gold" style="margin-top:24px;width:100%;justify-content:center;font-size:14px">View event page ' + ARR + '</a></div>';
  } else if (M.country) {
    const showCity = M.all && M.city; const lst = showCity ? byCity[M.city] : byC[M.country] || [];
    panel.innerHTML = '<div class="pane" style="border:0;padding:0">' + (showCity ? '<button class="crumb" data-act="mback" style="margin-bottom:14px">← All of ' + esc(CN[M.country]) + '</button>' : '') + '<div class="k" style="font-size:11px;color:var(--gold3)">' + esc(showCity ? CN[M.country] : [...new Set(lst.map((e) => e.city))].join(' · ')) + '</div><h2 class="serif" style="margin:14px 0 0;font-size:48px;line-height:1">' + esc(showCity ? M.city : CN[M.country]) + '</h2><p style="margin:12px 0 0;font-size:14px;color:var(--muted-d)">' + lst.length + (lst.length === 1 ? ' upcoming event' : ' upcoming events') + '</p><div style="margin-top:24px;border-top:1px solid var(--line-d)">'
      + lst.map((e) => { const x = dm(e.s, e.e); return '<button class="drow" data-act="mev" data-v="' + e.id + '"><span style="flex:0 0 58px"><span class="serif" style="display:block;font-size:24px;line-height:1;color:var(--gold)">' + x.days + '</span><span style="display:block;margin-top:4px;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted-d2)">' + x.mon + ' ' + e.s.slice(0, 4) + '</span></span><span style="flex:1 1 auto;min-width:0"><span style="display:block;font-size:14px;font-weight:600;line-height:1.35">' + esc(e.n) + '</span><span style="display:block;margin-top:4px;font-size:12px;color:var(--muted-d2)">' + esc(e.city + ' · ' + e.tl) + '</span></span>' + ARR + '</button>'; }).join('') + '</div></div>';
  } else {
    const mx = Math.max(...codes.map((c) => byC[c].length));
    panel.innerHTML = '<div class="pane" style="border:0;padding:0"><div class="k" style="font-size:11px;color:var(--gold3)">Worldwide</div><h2 class="serif" style="margin:14px 0 0;font-size:40px;line-height:1.05">' + up.length + ' events in ' + codes.length + ' countries</h2><p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:var(--muted-d)">Select a country on the map to zoom in.</p><div style="margin-top:28px;display:flex;flex-direction:column;gap:2px">'
      + codes.slice(0, 9).map((c) => '<button class="drow" data-act="mc" data-v="' + c + '" style="padding:0 8px;min-height:44px;border:0;border-radius:4px"><span style="flex:0 0 128px;font-size:14px">' + CN[c] + '</span><span style="flex:1 1 auto;height:4px;border-radius:2px;background:var(--line-d);position:relative;overflow:hidden"><span style="position:absolute;left:0;top:0;bottom:0;width:' + Math.round(byC[c].length / mx * 100) + '%;background:var(--gold2)"></span></span><span class="serif" style="flex:0 0 24px;text-align:right;font-size:20px;color:var(--gold)">' + byC[c].length + '</span></button>').join('') + '</div></div>';
  }
}

/* ---------------- ADD ---------------- */
function pageAdd() {
  return '<section class="dark">' + header('add') + '<div class="wrap" style="padding-top:88px;padding-bottom:80px"><div class="eyebrow in">For organisers</div><h1 class="big in d1">Add your <em class="g">event</em></h1><p class="lead in d2">Listing is free. Your event is published straight away and links visitors to your official website.</p>'
    + '<ol class="in d3" style="margin:48px 0 0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:12px 48px;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted-d)"><li style="display:flex;align-items:center;gap:12px"><span class="serif" style="font-size:22px;letter-spacing:0;color:var(--gold)">01</span>The event</li><li style="display:flex;align-items:center;gap:12px"><span class="serif" style="font-size:22px;letter-spacing:0;color:var(--gold)">02</span>Location</li><li style="display:flex;align-items:center;gap:12px"><span class="serif" style="font-size:22px;letter-spacing:0;color:var(--gold)">03</span>Organiser</li></ol></div></section>'
    + '<main style="max-width:820px;margin:0 auto;padding:96px 24px 120px" id="addroot"><form id="addf" novalidate style="display:flex;flex-direction:column;gap:72px">'
    + '<fieldset style="margin:0;padding:0;border:0;display:flex;flex-direction:column;gap:22px"><legend class="serif" style="padding:0;margin-bottom:28px;font-size:36px"><span style="font-size:20px;color:var(--gold2);margin-right:14px">01</span>The event</legend>'
    + '<label class="lbl2">Event name *<input class="field" name="name" required placeholder="e.g. Geneva Watch Days 2027"></label>'
    + '<div class="frow" style="gap:20px"><label class="lbl2" style="flex:1 1 220px">Start date *<input class="field" type="date" name="start" required></label><label class="lbl2" style="flex:1 1 220px">End date *<input class="field" type="date" name="end" required></label></div>'
    + '<div class="frow" style="gap:20px"><label class="lbl2" style="flex:1 1 220px">Type<select class="field" name="type"><option>Trade fair</option><option>Public fair</option><option>Watch week</option><option>Jewellery &amp; watches</option><option>Vintage &amp; collectors</option><option>Auction</option><option>Other</option></select></label><label class="lbl2" style="flex:1 1 220px">Number of exhibitors<input class="field" type="number" min="0" name="exh" placeholder="e.g. 60"></label></div>'
    + '<fieldset style="margin:0;padding:0;border:0"><legend style="padding:0;margin-bottom:10px;font-size:13px;font-weight:500">Open to</legend><div style="display:flex;flex-wrap:wrap;gap:10px"><label class="chipr"><input type="radio" name="aud" style="accent-color:#0F1B2D;margin:0">Trade only</label><label class="chipr"><input type="radio" name="aud" style="accent-color:#0F1B2D;margin:0">Public</label><label class="chipr"><input type="radio" name="aud" checked style="accent-color:#0F1B2D;margin:0">Trade &amp; public</label><label class="chipr"><input type="checkbox" name="free" style="accent-color:#0F1B2D;margin:0">Free entry</label></div></fieldset>'
    + '<label class="lbl2">Short description<textarea class="field" rows="4" maxlength="300" name="desc" placeholder="One or two sentences about the event"></textarea><span id="cc" style="align-self:flex-end;font-size:12px;font-weight:400;color:var(--muted)">0 / 300</span></label></fieldset>'
    + '<fieldset class="reveal" style="margin:0;padding:0;border:0;display:flex;flex-direction:column;gap:22px"><legend class="serif" style="padding:0;margin-bottom:28px;font-size:36px"><span style="font-size:20px;color:var(--gold2);margin-right:14px">02</span>Location</legend><label class="lbl2">Venue<input class="field" name="venue" placeholder="e.g. Palexpo"></label><div class="frow" style="gap:20px"><label class="lbl2" style="flex:1 1 220px">City *<input class="field" name="city" required></label><label class="lbl2" style="flex:1 1 220px">Country *<select class="field" name="country" required><option value="">Select a country</option>' + COUNTRY_LIST.map(([k, c]) => '<option value="' + k + '">' + esc(c) + '</option>').join('') + '</select></label></div></fieldset>'
    + '<fieldset class="reveal" style="margin:0;padding:0;border:0;display:flex;flex-direction:column;gap:22px"><legend class="serif" style="padding:0;margin-bottom:28px;font-size:36px"><span style="font-size:20px;color:var(--gold2);margin-right:14px">03</span>Organiser</legend><div class="frow" style="gap:20px"><label class="lbl2" style="flex:1 1 220px">Organiser name *<input class="field" name="org" required></label><label class="lbl2" style="flex:1 1 220px">Contact email *<input class="field" type="email" name="email" required placeholder="Not shown publicly"></label></div><label class="lbl2">Official website *<input class="field" type="url" name="site" required placeholder="https://"></label><label class="lbl2">Press days (optional)<input class="field" name="press" maxlength="80" placeholder="e.g. 5 – 6 April, press only"></label><label class="hp" aria-hidden="true">Leave empty<input name="website2" tabindex="-1" autocomplete="off"></label></fieldset>'
    + '<div class="reveal" style="display:flex;flex-direction:column;gap:24px"><div style="padding:28px;background:var(--surface);border-radius:4px"><label style="display:flex;align-items:flex-start;gap:14px;font-size:14px;line-height:1.65;cursor:pointer"><input type="checkbox" name="ok" required style="width:18px;height:18px;margin:3px 0 0;flex:0 0 auto;accent-color:#0F1B2D"><span>I represent the organiser of this event. I confirm the information is accurate and accept that the organiser is responsible for the content published.</span></label><p style="margin:12px 0 0 32px;font-size:13px;line-height:1.6;color:var(--muted)">Horology Calendar reviews new listings and may edit or remove those that are inaccurate or unrelated to watchmaking.</p></div>'
    + '<p class="err" id="adderr" role="alert" style="margin:0"></p><button class="btn btn-navy" type="submit" id="addbtn" style="align-self:flex-start;min-height:56px;padding:0 34px">Publish event ' + ARR + '</button><p style="margin:0;font-size:13px;line-height:1.6;color:var(--muted)">By publishing, you agree to our <a class="ul" href="/legal">terms and privacy notice</a>. Your email is only used to contact you about this listing.</p></div></form></main>' + footer(false);
}
async function saveSub(f) {
  const TM = { 'Trade fair': ['trade', 'Trade fair'], 'Public fair': ['public', 'Public fair'], 'Watch week': ['public', 'Watch week'], 'Jewellery & watches': ['jewel', 'Jewellery & watches'], 'Vintage & collectors': ['vintage', 'Vintage & collectors'], 'Auction': ['auction', 'Auction'], 'Other': ['public', 'Watch event'] };
  const cc = f.country.value; const country = CN[cc] || cc;
  const aud = [...f.querySelectorAll('input[name=aud]')].findIndex((x) => x.checked);
  const ty = TM[f.type.value] || TM.Other; const n = f.name.value.trim(); const city = f.city.value.trim();
  const pos = await geocode(city, country);
  const row = { id: slugify(n + ' ' + f.start.value.slice(0, 7)) + '-' + Math.random().toString(36).slice(2, 6),
    name: n, start_date: f.start.value, end_date: f.end.value, venue: f.venue.value.trim() || null, city, country_code: cc, country,
    type: ty[0], type_label: ty[1], exhibitors: f.exh.value ? f.exh.value + ' exhibitors' : null, trade_only: aud === 0, free_entry: f.free.checked,
    website: f.site.value.trim(), organiser: f.org.value.trim(), description: f.desc.value.trim() || null, press_days: f.press.value.trim() || null,
    lat: pos ? pos.lat : null, lon: pos ? pos.lon : null };
  await api.addEvent(row, f.email.value.trim());
  await loadEvents();
  return byId[row.id] || fromRow(row);
}
function addDone(ev0) {
  const name = ev0.n;
  document.getElementById('addroot').innerHTML = '<div class="in" style="padding:72px 40px;border:1px solid var(--line);border-radius:4px;text-align:center"><svg width="72" height="72" viewBox="0 0 64 64" fill="none" aria-hidden="true" style="margin:0 auto"><circle class="ck-c" cx="32" cy="32" r="28" stroke="#B8975A" stroke-width="1.5"/><path class="ck-p" d="M21 33l7.5 7.5L44 25" stroke="#0F1B2D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><h2 class="serif in d3" style="margin:28px 0 0;font-size:48px">Thank you</h2><p class="in d4" style="margin:14px auto 0;font-size:16px;line-height:1.65;color:var(--muted);max-width:460px">“' + esc(name) + '” is now live in the calendar. Our team reviews every new listing and may contact you if something needs checking.</p><div style="margin-top:36px;display:flex;flex-wrap:wrap;justify-content:center;gap:12px">' + (ev0.id ? '<a href="/event/' + ev0.id + '" class="btn btn-navy">See your listing ' + ARR + '</a>' : '') + '<a href="/add" data-act="reload" class="btn btn-line">Add another event</a></div></div>';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------------- ABOUT ---------------- */
function pageAbout() {
  return '<section class="dark" style="overflow:hidden">' + header('about') + '<div class="wrap" style="padding-top:96px;padding-bottom:104px;display:flex;flex-wrap:wrap;align-items:center;gap:56px"><div style="flex:999 1 520px;min-width:0"><div class="eyebrow in">About</div><h1 class="big in d1">A free, open calendar for the <em class="g">watch world.</em></h1><p class="lead in d2">Watch fairs, collector shows and watch weeks are spread across dozens of websites. Horology Calendar brings them together in one simple place, for brands, press, retailers and collectors.</p></div>'
    + '<div class="in d2" style="flex:1 1 260px;display:flex;justify-content:center"><svg viewBox="0 0 400 400" style="width:100%;max-width:330px" aria-hidden="true"><defs><path id="ar" d="M200,200 m-170,0 a170,170 0 1,1 340,0 a170,170 0 1,1 -340,0"/></defs><circle cx="200" cy="200" r="190" fill="none" stroke="#1F2E45"/><circle cx="200" cy="200" r="150" fill="none" stroke="#1F2E45"/><g class="ring" style="animation-duration:200s"><text font-family="Inter,sans-serif" font-size="11" letter-spacing="4.4" fill="#B8975A"><textPath href="#ar">BRANDS · PRESS · RETAILERS · COLLECTORS · ORGANISERS · BRANDS · PRESS · RETAILERS · COLLECTORS · </textPath></text></g><text x="200" y="196" text-anchor="middle" font-family="Instrument Serif,Georgia,serif" font-size="64" fill="#E4CF9F">One</text><text x="200" y="228" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" letter-spacing="3.5" fill="#B8C0CC">CALENDAR FOR ALL</text></svg></div></div></section>'
    + '<main class="wrap" style="padding-top:112px;padding-bottom:40px"><div class="eyebrow reveal">How it works</div><h2 class="sec reveal">Simple by design</h2><div style="margin-top:48px;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px">'
    + [['01', 'Listed', 'Events from around the world, filterable by country, date, type and size.'], ['02', 'Linked to the source', 'Every listing points to the event’s official website for tickets and registration.'], ['03', 'Open to organisers', 'Organisers add their own events for free, in a few minutes.']].map(([n, t, d], i) => '<div class="step reveal" style="--d:' + i * 150 + 'ms"><div class="serif" style="font-size:48px;line-height:1;color:var(--gold2)">' + n + '</div><h3 style="margin:28px 0 0;font-size:19px;font-weight:600">' + t + '</h3><p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:var(--muted)">' + d + '</p></div>').join('')
    + '</div><div class="eyebrow reveal" style="margin-top:128px">Our principles</div><h2 class="sec reveal">What you can count on</h2><div style="margin-top:48px;display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:40px 32px">'
    + [['Official sources', 'Each event links to its organiser’s own website.'], ['Neutral', 'No advertising and no paid placement. Every event is shown the same way.'], ['Open', 'The code is public and free to reuse.'], ['Free', 'For visitors and for organisers, always.']].map(([t, d], i) => '<div class="reveal" style="--d:' + i * 120 + 'ms;padding-top:28px;border-top:1px solid var(--line)"><h3 class="serif" style="margin:0;font-size:26px">' + t + '</h3><p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:var(--muted)">' + d + '</p></div>').join('')
    + '</div><section class="reveal z" style="margin-top:128px;padding:clamp(28px,5vw,56px);background:var(--surface);border-radius:4px;display:flex;flex-wrap:wrap;gap:48px"><div style="flex:1 1 360px"><h2 class="serif" style="margin:0;font-size:36px">Responsibility</h2><p style="margin:16px 0 0;font-size:16px;line-height:1.75;color:#3A414D">Event information is published by each organiser, who remains responsible for its content. We may edit or remove listings that are inaccurate. Always check dates and access conditions on the official website before travelling.</p></div><div style="flex:1 1 360px"><h2 class="serif" style="margin:0;font-size:36px">Contact</h2><p style="margin:16px 0 0;font-size:16px;line-height:1.75;color:#3A414D">Spotted an error or a missing event? Write to us at ' + (import.meta.env.VITE_CONTACT_EMAIL ? '<a class="ul" href="mailto:' + import.meta.env.VITE_CONTACT_EMAIL + '">' + import.meta.env.VITE_CONTACT_EMAIL + '</a>' : '[contact email]') + '.</p></div></section></main>'
    + '<section class="dark" style="margin-top:112px"><div class="reveal" style="max-width:760px;margin:0 auto;padding:104px 24px;text-align:center"><h2 class="sec" style="margin:0">Organising a watch event?</h2><a href="/add" class="btn btn-gold" style="margin-top:36px">Add your event ' + ARR + '</a></div></section>' + footer(true);
}

/* ---------------- LEGAL ---------------- */
function pageLegal() {
  const sec = (t, h) => '<section class="reveal" style="padding-top:40px;margin-top:40px;border-top:1px solid var(--line)"><h2 class="serif" style="margin:0;font-size:32px">' + t + '</h2><div class="legal">' + h + '</div></section>';
  const C = import.meta.env.VITE_CONTACT_EMAIL || '[contact email]';
  return '<section class="dark">' + header('') + '<div class="wrap" style="padding-top:88px;padding-bottom:72px"><div class="eyebrow in">Legal</div><h1 class="big in d1">Legal notice &amp; <em class="g">privacy</em></h1><p class="lead in d2">Last updated ' + range('2026-11-11', '2026-11-11') + '.</p></div></section>'
    + '<main style="max-width:820px;margin:0 auto;padding:40px 24px 120px">'
    + sec('Publisher', '<p>Horology Calendar is published by 289 Consulting, [legal form and registered address], Switzerland. Contact: <a class="ul" href="mailto:' + C + '">' + C + '</a>.</p><p>The website is hosted by Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, United States. Event data is stored with Supabase Inc. in a European data centre.</p>')
    + sec('Listings and responsibility', '<p>Horology Calendar is a free, independent calendar. Event information is published by each organiser, or compiled by our team from official sources. The organiser remains responsible for the content of their listing.</p><p>We review new listings and may edit or remove any listing that is inaccurate, misleading, unrelated to watchmaking or that infringes third-party rights. Dates, venues and access conditions can change: always check the official website before travelling.</p><p>Names, logos and images belong to their respective owners and are shown for information only, with credit, or with the organiser’s permission.</p>')
    + sec('Personal data', '<p><strong>Organisers.</strong> When you add an event, we store the contact email you give us. It is never published and is only used to contact you about your listing. We keep it as long as the listing is online, then delete it.</p><p><strong>Newsletter.</strong> If you subscribe, we store your email to send you a monthly overview of upcoming events. You can unsubscribe at any time with the link in each email or by writing to us.</p><p><strong>Visitors.</strong> We do not use advertising or tracking cookies. Events you save to “My season” are stored only in your own browser.</p><p>You can ask us to access, correct or delete your data at any time by writing to <a class="ul" href="mailto:' + C + '">' + C + '</a>. Our processing follows the Swiss Federal Act on Data Protection (FADP) and, for visitors in the European Union, the GDPR.</p>')
    + sec('Maps', '<p>Country outlines come from Natural Earth (public domain). City coordinates are looked up with OpenStreetMap Nominatim (© OpenStreetMap contributors).</p>')
    + '</main>' + footer(true);
}
function pageNotFound() {
  return '<section class="dark">' + header('') + '<div class="wrap" style="padding-top:120px;padding-bottom:140px;text-align:center"><div class="eyebrow in">404</div><h1 class="big in d1">This page is not on the <em class="g">calendar.</em></h1><p class="lead in d2" style="margin-left:auto;margin-right:auto">The event may have been removed or the link may be wrong.</p><a href="/" class="btn btn-gold in d3" style="margin-top:36px">Back to the calendar ' + ARR + '</a></div></section>' + footer(false);
}

/* ---------------- SEARCH ---------------- */
const S = { i: 0, items: [] };
const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function mark(text, q) {
  if (!q) return esc(text);
  const i = norm(text).indexOf(q); if (i < 0) return esc(text);
  return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
}
function openSearch() {
  let o = document.getElementById('srch');
  if (!o) {
    o = document.createElement('div'); o.id = 'srch'; o.className = 'srch'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', 'Search');
    o.innerHTML = '<div class="srch-in"><div class="srow"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><label for="sq" class="sr">Search</label><input id="sq" type="search" autocomplete="off" placeholder="Search events, cities, countries, organisers"><button data-act="sclose" aria-label="Close search">Esc</button></div><div id="sres" role="listbox" aria-label="Results"></div><div class="sfoot"><span><kbd>↑</kbd> <kbd>↓</kbd> to move</span><span><kbd>↵</kbd> to open</span><span><kbd>Esc</kbd> to close</span></div></div>';
    document.body.appendChild(o);
    o.addEventListener('click', (e) => { if (e.target === o) closeSearch(); });
  }
  o.hidden = false; document.body.style.overflow = 'hidden';
  const inp = document.getElementById('sq'); inp.value = ''; renderSearch(''); inp.focus(); setTimeout(() => inp.focus(), 30);
}
function closeSearch() { const o = document.getElementById('srch'); if (o) o.hidden = true; document.body.style.overflow = ''; }
function renderSearch(raw) {
  const q = norm(raw).trim(); const up = upcoming(); let html = ''; S.items = [];
  const item = (k, v, inner) => { S.items.push({ k, v }); return '<button class="sitem" role="option" data-act="sgo" data-k="' + k + '" data-v="' + esc(v) + '" data-i="' + (S.items.length - 1) + '">' + inner + '</button>'; };
  const evItem = (e) => { const x = dm(e.s, e.e); return item('event', e.id, '<span class="sd">' + x.days + '<small>' + x.mon + ' ' + e.s.slice(2, 4) + '</small></span><span class="st"><b>' + mark(e.n, q) + '</b><span>' + mark(place(e), q) + ' · ' + esc(e.tl) + '</span></span>' + (live(e) ? '<span class="dot" style="width:7px;height:7px"></span>' : '')); };
  const pinIc = '<span class="ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg></span>';
  if (!q) {
    html += '<div class="sgrp">Coming up</div>' + up.slice(0, 5).map(evItem).join('');
    const cs = {}; up.filter(mapOK).forEach((e) => { cs[e.cc] = (cs[e.cc] || 0) + 1; });
    html += '<div class="sgrp">Explore by country</div>' + Object.keys(cs).sort((a, b) => cs[b] - cs[a]).slice(0, 4).map((c) => item('country', c, pinIc + '<span class="st"><b>' + CN[c] + '</b><span>' + cs[c] + ' upcoming events · view on the map</span></span>')).join('');
  } else {
    const sc = (e) => { const n = norm(e.n); let s = 0; if (n.startsWith(q)) s += 6; else if (n.split(/[^a-z0-9]+/).some((w) => w.startsWith(q))) s += 4; else if (n.includes(q)) s += 3; if (norm(e.city).startsWith(q) || norm(e.country).startsWith(q)) s += 2.5; else if (norm(e.city + ' ' + e.country).includes(q)) s += 1.5; if (norm(e.venue + ' ' + e.org + ' ' + e.tl).includes(q)) s += 1; return s; };
    const evs = up.map((e) => [sc(e), e]).filter((x) => x[0] > 0).sort((a, b) => b[0] - a[0] || (a[1].s < b[1].s ? -1 : 1)).slice(0, 7).map((x) => x[1]);
    const places = {};
    up.filter(mapOK).forEach((e) => { if (norm(e.country).includes(q)) places['country|' + e.cc] = (places['country|' + e.cc] || 0) + 1; if (norm(e.city).includes(q) && norm(e.city) !== norm(e.country)) places['city|' + e.city] = (places['city|' + e.city] || 0) + 1; });
    const pk = Object.keys(places).slice(0, 4);
    if (pk.length) html += '<div class="sgrp">Places</div>' + pk.map((k) => { const [kind, v] = k.split('|'); const name = kind === 'country' ? CN[v] : v; return item(kind, v, pinIc + '<span class="st"><b>' + mark(name, q) + '</b><span>' + (kind === 'city' ? esc(byCityCountry(v)) + ' · ' : '') + places[k] + (places[k] === 1 ? ' upcoming event' : ' upcoming events') + ' · view on the map</span></span>'); }).join('');
    if (evs.length) html += '<div class="sgrp">Events</div>' + evs.map(evItem).join('');
    if (!pk.length && !evs.length) html = '<div class="sempty">No result for “' + esc(raw.trim()) + '”. Try a fair name, a city or a country.<br><a href="/add" class="ul" data-act="sclose">Organising this event? Add it to the calendar</a></div>';
  }
  document.getElementById('sres').innerHTML = html; S.i = 0; markActive();
}
function byCityCountry(c) { const e = EV.find((x) => x.city === c); return e ? e.country : ''; }
function markActive() { document.querySelectorAll('#sres .sitem').forEach((n, i) => { n.classList.toggle('on', i === S.i); n.setAttribute('aria-selected', i === S.i); if (i === S.i) n.scrollIntoView({ block: 'nearest' }); }); }
function goSearch(k, v) {
  closeSearch();
  if (k === 'event') { go('/event/' + v); return; }
  if (k === 'country') Object.assign(M, { country: v, city: '', ev: '', all: false, touched: true });
  if (k === 'city') { const lst = upcoming().filter((e) => e.city === v); Object.assign(M, { country: PINS[v][2], city: v, ev: lst.length === 1 ? lst[0].id : '', all: false, touched: true }); }
  if (location.pathname === '/map') updateMap(); else go('/map');
}
document.addEventListener('keydown', (ev) => {
  const o = document.getElementById('srch'); const open = o && !o.hidden;
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((ev.target.tagName || ''));
  if (!open && ((ev.key === '/' && !typing) || ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k'))) { ev.preventDefault(); openSearch(); return; }
  if (!open) { if (ev.key === 'Escape') { const o = document.getElementById('admedit'); if (o) o.remove(); document.querySelectorAll('.lbx').forEach((x) => x.remove()); } return; }
  if (ev.key === 'Escape') { ev.preventDefault(); closeSearch(); return; }
  if (ev.key === 'ArrowDown') { ev.preventDefault(); S.i = Math.min(S.items.length - 1, S.i + 1); markActive(); }
  if (ev.key === 'ArrowUp') { ev.preventDefault(); S.i = Math.max(0, S.i - 1); markActive(); }
  if (ev.key === 'Enter' && S.items[S.i]) { ev.preventDefault(); goSearch(S.items[S.i].k, S.items[S.i].v); }
});

/* ---------------- ADMIN ---------------- */
const ADMF = { q: '', f: 'all' };
const AUTH = { ok: false, email: '', contacts: {}, checked: false };
function admUnlocked() { return AUTH.ok; }
async function admSet(id, patch) {
  const row = {}; const map = { ver: 'verified', hid: 'hidden', rev: 'reviewed' };
  Object.keys(patch).forEach((k) => { if (map[k]) row[map[k]] = patch[k]; });
  if (patch.edit) { const E = patch.edit; Object.assign(row, { name: E.n, start_date: E.s, end_date: E.e, venue: E.venue || null, city: E.city, city_label: null, organiser: E.org || null, exhibitors: E.exh || null, website: E.site || null, description: E.desc || null, dates_tbc: E.tbc, free_entry: E.free, trade_only: E.closed, lat: E.lat, lon: E.lon }); }
  try { await api.updateEvent(id, row); await loadEvents(); } catch (x) { toast('Could not save: ' + (x && x.message ? x.message : 'error')); throw x; }
}
function pageAdmin() {
  const head = '<section class="dark">' + header('') + '<div class="wrap-l" style="padding-top:72px;padding-bottom:64px"><div class="eyebrow in">Admin</div><h1 class="big in d1">Listings <em class="g">desk</em></h1>';
  if (!admUnlocked()) return head + '<form id="admlog" class="in d2" style="margin-top:36px;display:flex;flex-direction:column;gap:10px;max-width:420px"><label><span class="sr">Email</span><input class="field" type="email" name="email" placeholder="Email" autocomplete="username" required style="height:54px;border-radius:999px;padding:0 20px"></label><label><span class="sr">Password</span><input class="field" type="password" name="pw" placeholder="Password" autocomplete="current-password" required style="height:54px;border-radius:999px;padding:0 20px"></label><button class="btn btn-gold" type="submit" style="align-self:flex-start">Sign in</button></form>' + (DEMO ? '<p class="in d3" style="margin:14px 0 0;font-size:13px;color:var(--gold)">Demo mode (no database connected): sign in with demo@horologycalendar.test / demo</p>' : '') + '<p class="in d3" style="margin:14px 0 0;font-size:13px;color:var(--muted-d2)">Restricted to the Horology Calendar team.</p><p class="err" id="admerr" role="alert" style="margin:10px 0 0"></p></div></section>' + footer(false);
  const all = EV.slice().sort((a, b) => a.s < b.s ? -1 : 1);
  const todo = all.filter((e) => e.user && !e.reviewed && !e.hidden).sort((a, b) => a.sub < b.sub ? 1 : -1);
  const live = all.filter((e) => !e.hidden && e.e >= today());
  const k = [[todo.length, 'New to review'], [live.length, 'Live listings'], [all.filter((e) => e.ver).length, 'Verified'], [all.filter((e) => e.hidden).length, 'Hidden']];
  return head + '<p class="lead in d2">New events go live as soon as an organiser publishes them. Review them here, verify the ones you have checked, and edit or hide anything inaccurate.</p>'
    + '<div class="adm-k in d3">' + k.map(([n, l]) => '<div><b>' + n + '</b><span>' + l + '</span></div>').join('') + '</div></div></section>'
    + '<main class="wrap-l" style="padding-top:72px;padding-bottom:120px">'
    + '<div class="eyebrow">New submissions</div><h2 class="sec" style="font-size:40px">To review</h2>'
    + '<div style="margin-top:28px;display:flex;flex-direction:column;gap:16px">' + (todo.length ? todo.map(admCard).join('') : '<p style="margin:0;padding:28px;border:1px dashed var(--line);border-radius:4px;color:var(--muted)">Nothing to review. New events added through “Add your event” will appear here.</p>') + '</div>'
    + '<div style="margin-top:88px;display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:20px"><div><div class="eyebrow">Every listing</div><h2 class="sec" style="font-size:40px">All events</h2></div>'
    + '<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center"><label><span class="sr">Filter listings</span><input class="field" id="admq" type="search" placeholder="Filter by name, city, organiser" value="' + esc(ADMF.q) + '" style="height:44px;border-radius:999px;padding:0 18px;min-width:240px"></label></div></div>'
    + '<div class="tabs" role="group" aria-label="Status" style="margin-top:20px">' + [['all', 'All'], ['unv', 'Not verified'], ['ver', 'Verified'], ['sub', 'From organisers'], ['hid', 'Hidden'], ['past', 'Past']].map(([v, l]) => '<button class="tab' + (ADMF.f === v ? ' on' : '') + '" data-act="admf" data-v="' + v + '" aria-pressed="' + (ADMF.f === v) + '">' + l + '</button>').join('') + '</div>'
    + '<div class="ascroll" style="margin-top:20px"><table class="atable"><thead><tr><th>Dates</th><th>Event</th><th class="hm">City</th><th class="hm">Updated</th><th>Status</th><th><span class="sr">Actions</span></th></tr></thead><tbody id="admrows"></tbody></table></div>'
    + '<div style="margin-top:56px;display:flex;flex-wrap:wrap;gap:10px"><a class="abtn pri" href="/add">Add an event</a><button class="abtn" data-act="admsubs">Download newsletter list (CSV)</button><button class="abtn" data-act="admout">Sign out</button></div>'
    + '<p style="margin:16px 0 0;font-size:13px;color:var(--muted)">Signed in as ' + esc(AUTH.email) + '. Changes are live for everyone as soon as you save them.' + (DEMO ? ' Demo mode: changes stay in this browser.' : '') + '</p></main>' + footer(false);
}
function admCard(e) {
  return '<article class="adm-card"><div style="flex:1 1 380px;min-width:0"><span class="as n">New · ' + esc(e.sub ? range(e.sub.slice(0, 10), e.sub.slice(0, 10)) : '') + '</span><h3 style="margin-top:12px">' + esc(e.n) + '</h3>'
    + '<dl><dt>Dates</dt><dd>' + range(e.s, e.e) + '</dd><dt>Place</dt><dd>' + esc([e.venue, e.city, e.country].filter(Boolean).join(', ')) + (mapOK(e) ? '' : ' <span class="as u">not on map yet</span>') + '</dd><dt>Type</dt><dd>' + esc(e.tl) + (e.exh ? ' · ' + esc(e.exh) : '') + (e.free ? ' · Free entry' : '') + (e.closed ? ' · Trade only' : '') + '</dd>'
    + '<dt>Organiser</dt><dd>' + esc(e.org) + (AUTH.contacts[e.id] ? ' · <a class="ul" href="mailto:' + esc(AUTH.contacts[e.id]) + '">' + esc(AUTH.contacts[e.id]) + '</a>' : '') + '</dd><dt>Website</dt><dd><a class="ul" href="' + esc(e.site) + '" target="_blank" rel="noopener">' + esc(e.site) + '</a></dd>' + (e.desc ? '<dt>Description</dt><dd>' + esc(e.desc) + '</dd>' : '') + '</dl></div>'
    + '<div class="adm-act" style="flex:0 1 auto"><button class="abtn pri" data-act="admrev" data-id="' + e.id + '">Looks good</button><button class="abtn gold" data-act="admver" data-id="' + e.id + '">Verify</button><button class="abtn" data-act="admedit" data-id="' + e.id + '">Edit</button><a class="abtn" href="/event/' + e.id + '">View</a><button class="abtn warn" data-act="admhide" data-id="' + e.id + '">Hide</button></div></article>';
}
function renderAdmRows() {
  const b = document.getElementById('admrows'); if (!b) return;
  const q = norm(ADMF.q).trim();
  const rows = EV.slice().sort((a, c) => a.s < c.s ? -1 : 1).filter((e) => {
    const past = e.e < today();
    if (ADMF.f === 'past') { if (!past) return false; } else if (past) return false;
    if (ADMF.f === 'unv' && (e.ver || e.hidden)) return false;
    if (ADMF.f === 'ver' && !e.ver) return false;
    if (ADMF.f === 'sub' && !e.user) return false;
    if (ADMF.f === 'hid' && !e.hidden) return false;
    return !q || norm(e.n + ' ' + e.city + ' ' + e.country + ' ' + e.org).includes(q);
  });
  b.innerHTML = rows.length ? rows.map((e) => '<tr class="' + (e.hidden ? 'hid' : '') + '"><td style="white-space:nowrap">' + range(e.s, e.e) + '</td><td><a class="ul" href="/event/' + e.id + '" style="font-weight:600">' + esc(e.n) + '</a>' + (e.user ? ' <span class="as n">organiser</span>' : '') + '</td><td class="hm">' + esc(e.city) + '</td><td class="hm" style="white-space:nowrap;color:var(--muted)">' + (e.upd ? range(e.upd, e.upd) : '–') + '</td>'
    + '<td>' + (e.hidden ? '<span class="as h">Hidden</span>' : e.ver ? '<span class="as v">Verified</span>' : '<span class="as u">Not verified</span>') + (e.tbc ? ' <span class="as u">TBC</span>' : '') + '</td>'
    + '<td><div class="adm-act" style="justify-content:flex-end;flex-wrap:nowrap"><button class="abtn" data-act="admver" data-id="' + e.id + '">' + (e.ver ? 'Unverify' : 'Verify') + '</button><button class="abtn" data-act="admedit" data-id="' + e.id + '">Edit</button><button class="abtn warn" data-act="admhide" data-id="' + e.id + '">' + (e.hidden ? 'Restore' : 'Hide') + '</button></div></td></tr>').join('')
    : '<tr><td colspan="6" style="color:var(--muted)">No listing matches.</td></tr>';
}
function admEdit(id) {
  const e = byId[id]; if (!e) return;
  const fld = (k, l, type, extra) => '<label class="lbl2" style="flex:1 1 220px">' + l + '<input class="field" name="' + k + '" type="' + (type || 'text') + '" value="' + esc(e[k] || '') + '"' + (extra || '') + '></label>';
  const ck = (k, l) => '<label class="chipr"><input type="checkbox" name="' + k + '"' + (e[k] ? ' checked' : '') + ' style="accent-color:#0F1B2D;margin:0">' + l + '</label>';
  const o = document.createElement('div'); o.className = 'adm-edit'; o.id = 'admedit';
  o.innerHTML = '<form id="admef" data-id="' + id + '" role="dialog" aria-modal="true" aria-label="Edit listing"><div style="display:flex;justify-content:space-between;align-items:center;gap:16px"><h2 class="serif" style="margin:0;font-size:30px">Edit listing</h2><button type="button" class="abtn" data-act="admclose">Close</button></div>'
    + '<div class="frow" style="gap:16px">' + fld('n', 'Event name') + '</div><div class="frow" style="gap:16px">' + fld('s', 'Start', 'date') + fld('e', 'End', 'date') + '</div>'
    + '<div class="frow" style="gap:16px">' + fld('venue', 'Venue') + fld('city', 'City') + '</div><div class="frow" style="gap:16px">' + fld('org', 'Organiser') + fld('exh', 'Exhibitors') + '</div>'
    + '<div class="frow" style="gap:16px">' + fld('site', 'Official website', 'url') + '</div>'
    + '<div class="frow" style="gap:16px;align-items:flex-end">' + fld('lat', 'Latitude (map)', 'number', ' step="any"') + fld('lon', 'Longitude (map)', 'number', ' step="any"') + '<button type="button" class="abtn" data-act="admgeo" style="margin-bottom:4px">Find from city</button></div>'
    + '<label class="lbl2">Description<textarea class="field" name="desc" rows="3" maxlength="300">' + esc(e.desc || '') + '</textarea></label>'
    + '<div style="display:flex;flex-wrap:wrap;gap:10px">' + ck('tbc', 'Dates to be confirmed') + ck('free', 'Free entry') + ck('closed', 'Trade only') + '</div>'
    + '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px"><button type="button" class="abtn" data-act="admclose">Cancel</button><button type="submit" class="abtn pri">Save changes</button></div></form>';
  document.body.appendChild(o); o.addEventListener('click', (x) => { if (x.target === o) o.remove(); });
  setTimeout(() => o.querySelector('input').focus(), 30);
}
async function admLoad() {
  const s = await api.session(); AUTH.checked = true;
  if (!s) { Object.assign(AUTH, { ok: false, email: '', contacts: {} }); return; }
  AUTH.email = s.email || ''; AUTH.ok = await api.isAdmin();
  if (AUTH.ok) { await loadEvents(); try { AUTH.contacts = await api.contacts(); } catch (x) { AUTH.contacts = {}; } }
}
function admRefresh() { const y = window.scrollY; route(); window.scrollTo(0, y); }

/* ---------------- HERO ART ---------------- */
function heroArt() { return sketchSVG(); }
function sketchSVG() {
  const C = 200, Y = 250, now = new Date(), P = '#E9DFC6', G = '#D4B77E', L = '#3E5070';
  let d = 0; const D = (s) => { const v = d; d += s; return v; };
  const ci = (cx, cy, r, w, op, dl, col) => '<circle class="sk" pathLength="1" cx="' + cx + '" cy="' + cy + '" r="' + r + '" stroke="' + (col || P) + '" stroke-width="' + w + '" stroke-opacity="' + op + '" fill="none" style="--d:' + dl + 'ms"/>';
  const dbl = (cx, cy, r, w, dl, col) => ci(cx, cy, r, w, .9, dl, col) + ci(cx + .7, cy - .5, r + .6, w * .6, .4, dl + 140, col);
  const ln = (x1, y1, x2, y2, w, op, dl, col, extra) => '<line class="sk" pathLength="1" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + (col || P) + '" stroke-width="' + w + '" stroke-opacity="' + op + '" style="--d:' + dl + 'ms"' + (extra || '') + '/>';
  const tx = (x, y, s, fs, dl, extra) => '<text class="skt" x="' + x + '" y="' + y + '" text-anchor="middle" dominant-baseline="central" font-size="' + fs + '" fill="' + P + '" style="--d:' + dl + 'ms"' + (extra || '') + '>' + s + '</text>';
  const pol = (cx, cy, r, a) => [cx + r * Math.sin(a * Math.PI / 180), cy - r * Math.cos(a * Math.PI / 180)].map((v) => +v.toFixed(2));
  let o = '';
  // construction lines (technical drawing)
  const g0 = D(0);
  o += '<g stroke-dasharray="2 5">' + ln(C, 6, C, 470, .8, .9, g0, L).replace('class="sk"', 'class="skt"') + ln(4, Y, 396, Y, .8, .9, g0, L).replace('class="sk"', 'class="skt"') + '</g>';
  o += ci(C, Y, 196, .7, .5, D(150), L);
  // bow + pendant
  o += dbl(C, 40, 22, 1.6, D(120)) + dbl(C, 40, 15, 1, D(80));
  o += '<path class="sk" pathLength="1" d="M190 62 L188 74 L212 74 L210 62" stroke="' + P + '" stroke-width="1.4" fill="url(#hat)" style="--d:' + D(120) + 'ms"/>';
  o += '<path class="sk" pathLength="1" d="M186 74 h28 v-0 l2 4 h-32 z M184 78 h32 v4 h-32 z" stroke="' + P + '" stroke-width="1.2" fill="none" style="--d:' + D(120) + 'ms"/>';
  // case
  o += dbl(C, Y, 180, 2, D(260)) + dbl(C, Y, 172, 1.2, D(200));
  o += '<path d="M' + pol(C, Y, 176, 60).join(' ') + ' A176 176 0 0 1 ' + pol(C, Y, 176, 230).join(' ') + '" stroke="url(#hat)" stroke-width="8" fill="none" class="sk" pathLength="1" style="--d:' + D(200) + 'ms"/>';
  // month ring
  const mo = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  o += ci(C, Y, 160, 1, .7, D(160)) + ci(C, Y, 140, 1, .7, D(160));
  let mt = ''; const md = D(0);
  for (let i = 0; i < 12; i++) { const a = i * 30, [x1, y1] = pol(C, Y, 140, a + 15), [x2, y2] = pol(C, Y, 160, a + 15); mt += ln(x1, y1, x2, y2, .8, .6, md + i * 40); const [x, y] = pol(C, Y, 150, a); mt += tx(x, y, mo[i], 7.4, md + 300 + i * 50, ' letter-spacing="1.2" transform="rotate(' + a + ' ' + x + ' ' + y + ')"' + (i === now.getMonth() ? ' fill="' + G + '"' : '')); }
  o += mt; D(500);
  const ma = now.getMonth() * 30; const [pa, pb] = pol(C, Y, 166, ma), [pc, pd] = pol(C, Y, 161, ma - 2.6), [pe, pf] = pol(C, Y, 161, ma + 2.6);
  o += '<path class="sk" pathLength="1" d="M' + pa + ' ' + pb + ' L' + pc + ' ' + pd + ' L' + pe + ' ' + pf + ' Z" stroke="' + G + '" fill="' + G + '" fill-opacity=".5" stroke-width="1.2" style="--d:' + D(120) + 'ms"/>';
  // chapter ring with roman numerals
  o += ci(C, Y, 134, .8, .5, D(120)) + ci(C, Y, 112, .8, .5, D(120));
  const rn = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']; let rt = ''; const rd = D(0);
  for (let i = 0; i < 60; i++) { const [x1, y1] = pol(C, Y, 134, i * 6), [x2, y2] = pol(C, Y, i % 5 ? 130 : 127, i * 6); rt += ln(x1, y1, x2, y2, i % 5 ? .6 : 1, .7, rd + i * 12); }
  for (let i = 0; i < 12; i++) { if (i === 3 || i === 9 || i === 6) continue; const [x, y] = pol(C, Y, 120, i * 30); rt += tx(x, y, rn[i], 11, rd + 500 + i * 60, ' font-family="Instrument Serif,Georgia,serif" transform="rotate(' + i * 30 + ' ' + x + ' ' + y + ')"'); }
  o += rt; D(900);
  // moon phase aperture (top)
  const ph = (((Date.now() / 864e5 - 10962.76) % 29.530589) + 29.530589) % 29.530589 / 29.530589;
  const mx = C, my = 186, mr = 19, k = Math.cos(2 * Math.PI * ph), wax = ph < .5;
  const lit = 'M' + mx + ' ' + (my - mr) + ' A' + mr + ' ' + mr + ' 0 0 ' + (wax ? 1 : 0) + ' ' + mx + ' ' + (my + mr) + ' A' + (Math.abs(k) * mr).toFixed(2) + ' ' + mr + ' 0 0 ' + ((wax ? (ph < .25 ? 0 : 1) : (ph < .75 ? 0 : 1))) + ' ' + mx + ' ' + (my - mr) + ' Z';
  o += '<path class="sk" pathLength="1" d="M' + (C - 40) + ' 202 A40 40 0 0 1 ' + (C + 40) + ' 202 Z" stroke="' + P + '" stroke-width="1.2" fill="none" style="--d:' + D(160) + 'ms"/>';
  o += '<circle cx="' + mx + '" cy="' + my + '" r="' + mr + '" fill="url(#hat)" class="skt" style="--d:' + D(0) + 'ms"/>' + ci(mx, my, mr, 1, .9, D(140), G);
  o += '<path d="' + lit + '" fill="' + G + '" fill-opacity=".85" class="skt" style="--d:' + D(200) + 'ms"/>';
  o += '<g class="skt" style="--d:' + D(0) + 'ms" fill="' + P + '"><circle cx="' + (C - 30) + '" cy="194" r="1.2"/><circle cx="' + (C + 29) + '" cy="192" r="1"/><circle cx="' + (C - 24) + '" cy="178" r=".8"/><circle cx="' + (C + 24) + '" cy="176" r="1.1"/></g>';
  o += tx(C, 210, 'LUNA', 5.4, D(80), ' letter-spacing="2.4"');
  // day subdial (left) and date subdial (right)
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const sub = (cx, n, lab, cur, title) => { let s = dbl(cx, Y, 34, 1.1, D(160)) + ci(cx, Y, 25, .6, .5, D(80)); const b = D(0);
    for (let i = 0; i < n; i++) { const a = i * 360 / n, [x1, y1] = pol(cx, Y, 34, a), [x2, y2] = pol(cx, Y, 30, a); s += ln(x1, y1, x2, y2, .7, .7, b + i * 18); }
    lab.forEach(([i, l]) => { const a = i * 360 / n, [x, y] = pol(cx, Y, 18.5, a); s += tx(x, y, l, n > 7 ? 6 : 5.4, b + 400 + i * 20, ' letter-spacing=".6"'); });
    D(n * 18 + 200);
    const a = cur * 360 / n, [hx, hy] = pol(cx, Y, 29, a);
    s += ln(cx, Y, hx, hy, 1.4, 1, D(160), G) + '<circle cx="' + cx + '" cy="' + Y + '" r="2.4" fill="' + G + '" class="skt" style="--d:' + d + 'ms"/>';
    s += tx(cx, Y + 44, title, 5.4, D(60), ' letter-spacing="2" fill-opacity=".7"'); return s; };
  o += sub(C - 72, 7, days.map((l, i) => [i, l]), now.getDay(), 'DIES');
  o += sub(C + 72, 31, [[0, '1'], [4, '5'], [9, '10'], [14, '15'], [19, '20'], [24, '25'], [30, '31']], now.getDate() - 1, 'DATUM');
  // sky chart (bottom)
  o += dbl(C, 322, 32, 1.1, D(180));
  const st = [[-14, -18], [-6, -22], [3, -19], [10, -12], [16, -4], [22, 4], [12, 8], [-20, 2], [-12, 12], [-2, 20], [8, 22], [-24, -8], [18, -16], [0, -6], [-8, 4], [6, 2], [26, -2], [-16, 22]];
  o += '<g class="sky"><g class="skt" style="--d:' + D(120) + 'ms">' + st.map(([x, y], i) => '<circle cx="' + (C + x) + '" cy="' + (322 + y) + '" r="' + (i % 4 ? .9 : 1.5) + '" fill="' + P + '"/>').join('') + '</g>'
    + '<path class="sk" pathLength="1" d="M' + (C - 14) + ' 304 L' + (C - 6) + ' 300 L' + (C + 3) + ' 303 L' + (C + 10) + ' 310 L' + (C + 16) + ' 318 L' + (C + 22) + ' 326 L' + (C + 12) + ' 330 Z" stroke="' + G + '" stroke-width=".8" stroke-opacity=".8" fill="none" style="--d:' + D(200) + 'ms"/></g>';
  o += tx(C, 362, 'COELUM', 5.4, D(60), ' letter-spacing="2" fill-opacity=".7"');
  o += tx(C, 228, 'Horology', 13, D(80), ' font-family="Instrument Serif,Georgia,serif" font-style="italic"');
  // relief: hatched inner shadows (light from top-left) + domed crystal highlight
  const arcBand = (cx, cy, r1, r2, a1, a2) => { const [x1, y1] = pol(cx, cy, r2, a1), [x2, y2] = pol(cx, cy, r2, a2), [x3, y3] = pol(cx, cy, r1, a2), [x4, y4] = pol(cx, cy, r1, a1); return 'M' + x1 + ' ' + y1 + ' A' + r2 + ' ' + r2 + ' 0 0 1 ' + x2 + ' ' + y2 + ' L' + x3 + ' ' + y3 + ' A' + r1 + ' ' + r1 + ' 0 0 0 ' + x4 + ' ' + y4 + ' Z'; };
  const sh = D(120);
  o += '<g class="skt" style="--d:' + sh + 'ms" fill="url(#hat)">'
    + '<path d="' + arcBand(C, Y, 106, 112, 70, 250) + '"/>'
    + '<path d="' + arcBand(C - 72, Y, 29, 34, 70, 250) + '"/><path d="' + arcBand(C + 72, Y, 29, 34, 70, 250) + '"/><path d="' + arcBand(C, 322, 27, 32, 70, 250) + '"/>'
    + '<path d="' + arcBand(C, Y, 160, 166, 80, 240) + '"/></g>';
  o += '<path class="sk" pathLength="1" d="M' + pol(C, Y, 150, 282).join(' ') + ' A150 150 0 0 1 ' + pol(C, Y, 150, 342).join(' ') + '" stroke="#fff" stroke-opacity=".28" stroke-width="3" fill="none" style="--d:' + D(160) + 'ms"/>';
  o += '<path class="sk" pathLength="1" d="M' + pol(C, Y, 143, 290).join(' ') + ' A143 143 0 0 1 ' + pol(C, Y, 143, 318).join(' ') + '" stroke="#fff" stroke-opacity=".18" stroke-width="1.6" fill="none" style="--d:' + D(120) + 'ms"/>';
  o += '<path class="sk" pathLength="1" d="M' + pol(C, Y, 178, 290).join(' ') + ' A178 178 0 0 1 ' + pol(C, Y, 178, 350).join(' ') + '" stroke="#fff" stroke-opacity=".7" stroke-width="2.2" fill="none" style="--d:' + D(120) + 'ms"/>';
  // breguet hands, real Geneva time
  o += '<g filter="url(#hs)"><g class="wh2" id="hh"><g class="skt" style="--d:' + D(200) + 'ms" stroke="' + G + '" fill="none" stroke-linecap="round"><path d="M200 266 L200 199 M200 186 L200 172" stroke-width="2.6"/><circle cx="200" cy="192.5" r="6.5" stroke-width="2"/></g></g>';
  o += '<g class="wh2" id="mh"><g class="skt" style="--d:' + D(120) + 'ms" stroke="' + G + '" fill="none" stroke-linecap="round"><path d="M200 270 L200 160 M200 148 L200 128" stroke-width="2"/><circle cx="200" cy="154" r="5.5" stroke-width="1.7"/></g></g></g>';
  o += '<circle cx="200" cy="250" r="4" fill="' + G + '" class="skt" style="--d:' + d + 'ms"/><circle cx="200" cy="250" r="1.4" fill="#0F1B2D" class="skt" style="--d:' + d + 'ms"/>';
  // crown at 3 o'clock? (pendant at top already) + dimension note
  const nd = D(200);
  o += '<g stroke="' + L + '" stroke-width=".8">' + ln(20, 450, 380, 450, .8, 1, nd, L) + ln(20, 444, 20, 456, .8, 1, nd, L) + ln(380, 444, 380, 456, .8, 1, nd, L) + '</g>';
  o += '<text class="skt" x="200" y="463" text-anchor="middle" font-size="9" font-style="italic" font-family="Instrument Serif,Georgia,serif" fill="#8C9AB0" style="--d:' + (nd + 300) + 'ms">Fig. 1 — Astronomical calendar · Ø 46 mm</text>';
  return '<svg class="skw" viewBox="0 0 400 470" role="img" aria-label="Pencil drawing of an astronomical calendar watch showing the time in Geneva, the day, date, month and moon phase"><defs>'
    + '<filter id="pen" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" xChannelSelector="R" yChannelSelector="G" result="d"/><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed="3" result="g"/><feColorMatrix in="g" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -0.9 1.2" result="ga"/><feComposite in="d" in2="ga" operator="in"/></filter>'
    + '<filter id="hs" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="3" dy="4" stdDeviation="1.6" flood-color="#000" flood-opacity=".75"/></filter><pattern id="hat" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><line x1="0" y1="0" x2="0" y2="4" stroke="' + P + '" stroke-opacity=".38" stroke-width="1"/></pattern></defs>'
    + '<g filter="url(#pen)" stroke-linecap="round" font-family="Inter,sans-serif">' + o + '</g></svg>';
}
function heroStart() {}

/* ---------------- ROUTER & BEHAVIOUR ---------------- */
let io;
function observe() {
  if (!introDone) { setTimeout(observe, 200); return; }
  if (io) io.disconnect();
  if (!('IntersectionObserver' in window)) { document.querySelectorAll('.reveal').forEach((n) => n.classList.add('vis')); return; }
  io = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('vis'); io.unobserve(x.target); } }), { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach((n) => io.observe(n));
}
function countUp() {
  const els = [...document.querySelectorAll('[data-count]')]; if (!els.length) return;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  els.forEach((el) => { el.textContent = '0'; });
  const run = () => {
    const t0 = performance.now();
    const step = (now) => { const p = Math.min(1, (now - t0) / 2000); const k = 1 - Math.pow(1 - p, 3); els.forEach((el) => { el.textContent = Math.round(+el.dataset.count * k); }); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  const go = () => { if (!introDone) { setTimeout(go, 200); return; } setTimeout(run, 250); };
  const box = els[0].closest('.stats') || els[0];
  if (!('IntersectionObserver' in window)) { go(); return; }
  const o = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) { o.disconnect(); go(); } }, { threshold: 0.6 });
  o.observe(box);
}
function tickClock() {
  const parts = {};
  try { new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Zurich', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date()).forEach((p) => { parts[p.type] = p.value; }); } catch (x) { const d = new Date(); parts.hour = String(d.getHours()).padStart(2, '0'); parts.minute = String(d.getMinutes()).padStart(2, '0'); }
  const c = document.getElementById('clock'); if (c) c.textContent = 'Geneva ' + parts.hour + ':' + parts.minute;
  const hh = document.getElementById('hh'), mh = document.getElementById('mh');
  if (hh && mh) { const h = +parts.hour % 12, m = +parts.minute, s = new Date().getSeconds(); hh.style.transform = 'rotate(' + (h * 30 + m * 0.5) + 'deg)'; mh.style.transform = 'rotate(' + (m * 6 + s * 0.1) + 'deg)'; }
}
function setMeta(title, desc) {
  document.title = title;
  const m = document.querySelector('meta[name="description"]'); if (m && desc) m.setAttribute('content', desc);
  let c = document.querySelector('link[rel="canonical"]'); if (!c) { c = document.createElement('link'); c.rel = 'canonical'; document.head.appendChild(c); }
  c.href = SITE + location.pathname;
  const old = document.getElementById('ldjson'); if (old) old.remove();
}
function eventJsonLd(e) {
  const s = document.createElement('script'); s.type = 'application/ld+json'; s.id = 'ldjson';
  s.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Event', name: e.n, startDate: e.s, endDate: e.e, eventStatus: 'https://schema.org/EventScheduled', eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: { '@type': 'Place', name: e.venue || e.city, address: { '@type': 'PostalAddress', addressLocality: e.cityLabel || e.city, addressCountry: e.cc || e.country } },
    description: e.desc || (e.tl + ' in ' + e.city + ', ' + e.country), url: SITE + '/event/' + e.id, image: e.img ? [SITE + e.img] : [SITE + '/og.png'],
    organizer: e.org ? { '@type': 'Organization', name: e.org, url: e.site || undefined } : undefined, isAccessibleForFree: e.free || undefined }).replace(/</g, '\\u003c');
  document.head.appendChild(s);
}
function go(path) { if (path !== location.pathname + location.hash) history.pushState({}, '', path); route(); }
function route() {
  const p = location.pathname.replace(/\/+$/, '') || '/';
  const app = document.getElementById('app');
  const H = 'Horology Calendar';
  if (p.startsWith('/event/')) { const id = decodeURIComponent(p.slice(7)); const e = byId[id]; app.innerHTML = pageEvent(id); setMeta((e ? e.n + ' · ' : 'Event not found · ') + H, e ? e.n + ': ' + range(e.s, e.e) + ', ' + place(e) + '. ' + (e.desc || 'Dates, venue and official website.') : ''); if (e) eventJsonLd(e); tickCountdown(); }
  else if (p === '/agenda') { app.innerHTML = pageAgenda(); renderAgenda(); setMeta('Agenda · ' + H, 'Month-by-month agenda of watch fairs, collector shows, auctions and watch weeks worldwide.'); }
  else if (p === '/map') { app.innerHTML = pageMap(); updateMap(); setMeta('World map · ' + H, 'Explore watch fairs and events around the world on an interactive map.'); }
  else if (p === '/add') { app.innerHTML = pageAdd(); window.__addT = Date.now(); setMeta('Add your event · ' + H, 'Organisers: list your watch fair or event for free in a few minutes.'); }
  else if (p === '/about') { app.innerHTML = pageAbout(); setMeta('About · ' + H, 'A free, open calendar for the watch world. An initiative of 289 Consulting.'); }
  else if (p === '/legal') { app.innerHTML = pageLegal(); setMeta('Legal & privacy · ' + H, 'Legal notice, terms of publication and privacy policy of Horology Calendar.'); }
  else if (p === '/admin') { if (!AUTH.checked) { AUTH.checked = true; admLoad().then(() => { if (AUTH.ok) route(); }); } app.innerHTML = pageAdmin(); renderAdmRows(); setMeta('Admin · ' + H); }
  else if (p === '/') { app.innerHTML = pageHome(); heroStart(); renderList(); setMeta(H + ' · The international watch fair calendar', 'The free, open calendar of watch fairs and events worldwide: trade fairs, collector shows, auctions and watch weeks, each linked to its official source.'); countUp(); }
  else { app.innerHTML = pageNotFound(); setMeta('Page not found · ' + H); }
  if (!firstLoad) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  tickClock(); observe();
  firstLoad = false;
  if (location.hash === '#calendar') { const c = document.getElementById('calendar'); if (c) setTimeout(() => c.scrollIntoView({ behavior: 'smooth' }), 60); }
}
let firstLoad = true;
let introDone = true;
document.addEventListener('click', (ev) => {
  const ln = ev.target.closest('a[href^="/"]');
  if (ln && !ev.defaultPrevented && ev.button === 0 && !ev.metaKey && !ev.ctrlKey && !ev.shiftKey && !ev.altKey && !ln.target && !ln.hasAttribute('download') && !ln.closest('[data-act]:not(a)')) {
    const href = ln.getAttribute('href');
    if (!/\.(xml|txt|png|jpg|ics|csv)$/.test(href)) {
      ev.preventDefault(); const n = document.getElementById('nav'); if (n) n.classList.remove('open');
      if (href === '/#calendar' && location.pathname === '/') { history.replaceState({}, '', '/#calendar'); const c = document.getElementById('calendar'); if (c) c.scrollIntoView({ behavior: 'smooth' }); return; }
      if (ln.dataset.act === 'reload') { route(); return; }
      go(href); return;
    }
  }
  const t = ev.target.closest('[data-act]'); if (!t) return;
  const a = t.dataset.act, v = t.dataset.v;
  if (a === 'search') { openSearch(); return; }
  if (a === 'zoom') { const e = byId[t.dataset.id], gl = [{ src: e.img, alt: e.alt }].concat(e.gal || []), g = gl[+t.dataset.i + (t.dataset.cover ? 0 : 1)]; const o = document.createElement('div'); o.className = 'lbx'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', g.alt); o.innerHTML = '<img src="' + g.src + '" alt="' + esc(g.alt) + '"><p>Photo ' + esc(e.credit || '') + ' · click to close</p>'; o.addEventListener('click', () => o.remove()); document.body.appendChild(o); return; }
  if (a === 'admf') { ADMF.f = v; document.querySelectorAll('[data-act=admf]').forEach((b) => { b.classList.toggle('on', b.dataset.v === v); b.setAttribute('aria-pressed', b.dataset.v === v); }); renderAdmRows(); return; }
  if (a === 'admrev') { admSet(t.dataset.id, { rev: true }).then(() => { toast('Marked as reviewed'); admRefresh(); }, () => {}); return; }
  if (a === 'admver') { const e = byId[t.dataset.id], was = e.ver; admSet(e.id, { ver: !was, rev: true }).then(() => { toast(was ? 'Verification removed' : 'Listing verified'); admRefresh(); }, () => {}); return; }
  if (a === 'admhide') { const e = byId[t.dataset.id], was = e.hidden; admSet(e.id, { hid: !was, rev: true }).then(() => { toast(was ? 'Listing restored' : 'Listing hidden from the site'); admRefresh(); }, () => {}); return; }
  if (a === 'admedit') { admEdit(t.dataset.id); return; }
  if (a === 'admclose') { const o = document.getElementById('admedit'); if (o) o.remove(); return; }
  if (a === 'admsubs') { api.subscribers().then((list) => { const csv = 'email,signed_up\n' + list.map((s) => s.email + ',' + (s.created_at || '').slice(0, 10)).join('\n'); const u = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); const l = document.createElement('a'); l.href = u; l.download = 'horology-calendar-newsletter.csv'; document.body.appendChild(l); l.click(); l.remove(); toast(list.length + ' subscribers exported'); }, () => toast('Could not load the list')); return; }
  if (a === 'admout') { api.signOut().then(() => { Object.assign(AUTH, { ok: false, email: '', contacts: {} }); return loadEvents(); }).then(() => route()); return; }
  if (a === 'admgeo') { const f = document.getElementById('admef'); toast('Looking up ' + f.city.value + '…'); geocode(f.city.value, (byId[f.dataset.id] || {}).country || '').then((p) => { if (p) { f.lat.value = p.lat; f.lon.value = p.lon; toast('Coordinates found'); } else toast('City not found, enter coordinates manually'); }); return; }
  if (a === 'sclose') { closeSearch(); return; }
  if (a === 'sgo') { goSearch(t.dataset.k, t.dataset.v); return; }
  if (a === 'menu') { const n = document.getElementById('nav'); const o = n.classList.toggle('open'); t.setAttribute('aria-expanded', o); return; }
  if (a === 'scroll') { ev.preventDefault(); const c = document.getElementById('calendar'); if (c) c.scrollIntoView({ behavior: 'smooth' }); return; }
  if (a === 'type') { F.type = v; F.autoMonth = true; renderList(); return; }
  if (a === 'mtab') { F.month = v; F.autoMonth = false; renderList(); if (t.dataset.top) { const w = document.querySelector('.mtabs-wrap'); if (w) window.scrollTo({ top: w.getBoundingClientRect().top + window.scrollY - 8, behavior: 'smooth' }); } return; }
  if (a === 'tog') { F[v] = !F[v]; F.autoMonth = true; renderList(); return; }
  if (a === 'reset') { Object.assign(F, { q: '', country: '', month: '', size: '', type: 'all', open: false, free: false, mine: false, autoMonth: true }); route(); return; }
  if (a === 'star') { const id = t.dataset.id; if (saved[id]) delete saved[id]; else saved[id] = 1; store.set(saved); toast(saved[id] ? 'Saved to My season' : 'Removed from My season'); if (document.getElementById('list')) renderList(); else route(); return; }
  if (a === 'copy') { try { navigator.clipboard.writeText(location.href).then(() => toast('Link copied'), () => toast('Copy the address from your browser bar')); } catch (x) { toast('Copy the address from your browser bar'); } return; }
  if (a === 'ics') { const e = byId[t.dataset.id]; const txt = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Horology Calendar//EN', 'BEGIN:VEVENT', 'UID:' + e.id + '@horology-calendar', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z', 'DTSTART;VALUE=DATE:' + e.s.replace(/-/g, ''), 'DTEND;VALUE=DATE:' + ISO(T(e.e) + DAY).replace(/-/g, ''), 'SUMMARY:' + e.n.replace(/,/g, '\\,'), 'LOCATION:' + place(e).replace(/,/g, '\\,'), 'URL:' + (e.site || ''), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n'); const url = URL.createObjectURL(new Blob([txt], { type: 'text/calendar' })); const l = document.createElement('a'); l.href = url; l.download = e.id + '.ics'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500); return; }
  if (a === 'agprev') { A.mi--; A.sel = ''; renderAgenda(); return; }
  if (a === 'agnext') { A.mi++; A.sel = ''; renderAgenda(); return; }
  if (a === 'agm') { A.mi = +v; A.sel = ''; renderAgenda(); return; }
  if (a === 'agsel') { A.sel = t.dataset.id; renderAgenda(); return; }
  if (a === 'agleg') { A.hidden[v] = !A.hidden[v]; A.sel = ''; renderAgenda(); return; }
  if (/^m(c|city|ev|world|back|close|all)$/.test(a)) M.touched = true;
  if (a === 'mc') { Object.assign(M, { country: v, city: '', ev: '', all: false }); updateMap(); return; }
  if (a === 'mcity') { const c = t.dataset.city; const lst = upcoming().filter((e) => e.city === c); const small = document.getElementById('mapbox').clientWidth < 560; Object.assign(M, { country: PINS[c][2], city: c, ev: lst.length === 1 ? lst[0].id : '', all: small && lst.length > 1 }); updateMap(); if (small) setTimeout(() => document.getElementById('mpanel').scrollIntoView({ behavior: 'smooth', block: 'start' }), 300); return; }
  if (a === 'mev') { const e = byId[v]; Object.assign(M, { country: e.cc, city: e.city, ev: e.id }); updateMap(); return; }
  if (a === 'mworld') { Object.assign(M, { country: '', city: '', ev: '', all: false }); updateMap(); return; }
  if (a === 'mback') { Object.assign(M, { city: '', ev: '', all: false }); updateMap(); return; }
  if (a === 'mclose') { Object.assign(M, { city: '', ev: '', all: false }); updateMap(); return; }
  if (a === 'mall') { Object.assign(M, { all: true, ev: '' }); updateMap(); return; }
  if (a === 'reload') { ev.preventDefault(); route(); return; }
});
document.addEventListener('input', (ev) => {
  const f = ev.target.dataset && ev.target.dataset.f;
  if (f) { F[f] = ev.target.value; F.autoMonth = true; renderList(); }
  if (ev.target.id === 'sq') { renderSearch(ev.target.value); return; }
  if (ev.target.id === 'admq') { ADMF.q = ev.target.value; renderAdmRows(); return; }
  if (ev.target.name === 'desc') { const c = document.getElementById('cc'); if (c) c.textContent = ev.target.value.length + ' / 300'; }
});
document.addEventListener('change', (ev) => { const f = ev.target.dataset && ev.target.dataset.f; if (f) { F[f] = ev.target.value; F.autoMonth = true; renderList(); } });
document.addEventListener('submit', (ev) => {
  ev.preventDefault();
  if (ev.target.id === 'nlf') { const i = ev.target.querySelector('input'); if (!i.value || !i.checkValidity()) { i.focus(); toast('Please enter a valid email'); return; } const nf = ev.target; api.subscribe(i.value.trim()).then(() => { nf.innerHTML = '<div style="display:flex;align-items:center;gap:16px;padding:20px 24px;border-radius:4px;background:var(--surface)"><svg width="36" height="36" viewBox="0 0 64 64" fill="none" aria-hidden="true"><circle class="ck-c" cx="32" cy="32" r="28" stroke="#B8975A" stroke-width="2"/><path class="ck-p" d="M21 33l7.5 7.5L44 25" stroke="#0F1B2D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg><div><div style="font-size:16px;font-weight:600">You’re on the list.</div><div style="margin-top:4px;font-size:14px;color:var(--muted)">We’ll send you the next monthly overview.</div></div></div>'; }).catch(() => toast('Sorry, please try again later')); return; }
  if (ev.target.id === 'admlog') { const f = ev.target; document.getElementById('admerr').textContent = ''; api.signIn(f.email.value.trim(), f.pw.value).then(admLoad).then(() => { if (!AUTH.ok) { api.signOut(); document.getElementById('admerr').textContent = 'This account is not on the team list.'; } else route(); }, (x) => { document.getElementById('admerr').textContent = 'Wrong email or password.'; f.pw.select(); }); return; }
  if (ev.target.id === 'admef') { const f = ev.target, id = f.dataset.id, ed = {}; ['n', 's', 'e', 'venue', 'city', 'org', 'exh', 'site', 'desc'].forEach((k) => { ed[k] = f[k].value.trim(); }); ed.lat = f.lat.value === '' ? null : +f.lat.value; ed.lon = f.lon.value === '' ? null : +f.lon.value; ['tbc', 'free', 'closed'].forEach((k) => { ed[k] = f[k].checked; }); if (!ed.n || !ed.s || !ed.e || ed.e < ed.s) { toast('Check the name and dates'); return; } ed.cityLabel = ed.city; admSet(id, { edit: ed, rev: true }).then(() => { const o = document.getElementById('admedit'); if (o) o.remove(); toast('Listing updated'); admRefresh(); }, () => {}); return; }
  if (ev.target.id === 'addf') { const f = ev.target; const bad = [...f.querySelectorAll('[required]')].find((x) => x.type === 'checkbox' ? !x.checked : !x.value || !x.checkValidity()); if (bad) { document.getElementById('adderr').textContent = 'Please complete the required fields (*) and confirm you represent the organiser.'; bad.focus(); return; } if (f.end.value < f.start.value) { document.getElementById('adderr').textContent = 'The end date must be after the start date.'; f.end.focus(); return; } if (f.website2.value || Date.now() - (window.__addT || 0) < 4000) { addDone({ n: f.name.value, id: '' }); return; } // bots: honeypot filled or form sent too fast
    const btn = document.getElementById('addbtn'); btn.disabled = true; btn.style.opacity = .6; document.getElementById('adderr').textContent = '';
    saveSub(f).then(addDone).catch((x) => { btn.disabled = false; btn.style.opacity = 1; document.getElementById('adderr').textContent = 'Sorry, the event could not be published (' + (x && x.message ? x.message : 'network error') + '). Please check the dates and website, then try again.'; }); }
});
window.addEventListener('popstate', () => route());
window.addEventListener('scroll', () => { const h = document.documentElement; const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight); document.getElementById('prog').style.width = (p * 100) + '%'; }, { passive: true });
setInterval(() => { tickClock(); tickCountdown(); }, 1000);
async function boot() {
  // Start the intro straight away (first visit of the home page), while the events load underneath.
  let seen = false; try { seen = sessionStorage.getItem('hc-intro') === '1'; sessionStorage.setItem('hc-intro', '1'); } catch (x) {}
  const intro = !seen && location.pathname === '/';
  const t0 = Date.now(); let l = null;
  if (intro) {
    const word = 'Horology Calendar'.split('').map((c, i) => c === ' ' ? '<span>&#160;</span>' : '<span class="ch" style="animation-delay:' + (200 + i * 100) + 'ms">' + c + '</span>').join('');
    l = document.createElement('div'); l.className = 'ld'; l.setAttribute('role', 'status'); l.setAttribute('aria-label', 'Loading Horology Calendar');
    l.innerHTML = '<div class="bar"></div><div style="padding:0 16px"><div class="word" aria-hidden="true">' + word + '</div><div class="sub">The international watch fair calendar</div></div>';
    introDone = false; document.documentElement.classList.add('intro'); document.body.appendChild(l);
  }
  try { await loadEvents(); } catch (x) { if (l) l.remove(); document.documentElement.classList.remove('intro'); document.getElementById('app').innerHTML = '<div style="padding:120px 24px;text-align:center;font-family:Inter,sans-serif"><h1 style="font-weight:500">Horology Calendar</h1><p>The calendar could not be loaded. Please refresh the page in a moment.</p></div>'; return; }
  if (location.pathname === '/admin') { try { await admLoad(); } catch (x) {} }
  if (!intro) { firstLoad = false; route(); return; }
  route();
  setTimeout(() => { l.classList.add('out'); document.documentElement.classList.remove('intro'); introDone = true; setTimeout(() => l.remove(), 800); }, Math.max(0, 2900 - (Date.now() - t0)));
}
boot();
