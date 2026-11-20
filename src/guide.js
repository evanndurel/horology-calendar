/* ---------------- GUIDE ----------------
   A playful "find your way" block for the home page and a full /guide page.
   Illustrations are tiny inline SVGs animated with CSS (disabled for reduced motion). */

import MAP from './map.json';
import { geoNaturalEarth1 } from 'd3-geo';
const PROJ = geoNaturalEarth1().fitExtent([[10, 10], [990, 490]], { type: 'Sphere' });

const ARROW = '<svg class="arr" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

/* ---------- illustrations ---------- */
export function guideArt(kind) {
  if (kind === 'map') {
    // the real world map (same drawing and projection as the site's map), framed 16:9
    const has = ['US', 'GB', 'FR', 'DE', 'CH', 'IT', 'ES', 'JP', 'HK', 'SG', 'AE', 'IN', 'TH', 'CZ', 'GR', 'TR', 'BH'];
    const cities = [[6.14, 46.2, 1], [-74, 40.7, 1], [-115.1, 36.2, 0], [-80.2, 25.8, 0], [-0.13, 51.5, 0], [2.35, 48.86, 0], [11.58, 48.14, 0], [114.17, 22.3, 1], [139.7, 35.7, 0], [55.3, 25.2, 0], [103.8, 1.35, 0], [100.5, 13.75, 0], [72.88, 19.08, 0], [28.98, 41.0, 0], [23.73, 37.98, 0], [14.42, 50.08, 0]];
    const G = PROJ([6.14, 46.2]);
    return '<svg class="gart gmap" viewBox="40 -37 890 500" role="img" aria-label="Animated preview of the world map" style="--gx:' + G[0].toFixed(1) + 'px;--gy:' + G[1].toFixed(1) + 'px">'
      + '<rect x="0" y="-60" width="1000" height="560" fill="#0E1A2E"/>'
      + '<g fill="#1B2A44" stroke="#2C3D5C" stroke-width="1">' + Object.entries(MAP.c).filter(([cc]) => !has.includes(cc)).map(([, d]) => '<path d="' + d + '"/>').join('') + '</g>'
      + '<g fill="#4A3F28" stroke="#8A7446" stroke-width="1">' + has.filter((cc) => MAP.c[cc] && cc !== 'CH').map((cc) => '<path d="' + MAP.c[cc] + '"/>').join('') + '</g>'
      + (MAP.c.CH ? '<path class="gcty" d="' + MAP.c.CH + '" fill="#C9A86A" stroke="#E4CF9F" stroke-width="1"/>' : '')
      + cities.map(([lo, la, live], k) => { const [x, y] = PROJ([lo, la]); return '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')">' + (live ? '<circle class="gpulse" r="9" fill="none" stroke="#E4CF9F" stroke-width="2.4" style="animation-delay:' + k * 0.4 + 's"/>' : '') + '<circle r="7.5" fill="#E4CF9F" stroke="#0A1322" stroke-width="1.6"/></g>'; }).join('')
      + '<g class="gcur"><path transform="scale(2.2)" d="M0 0l0 22 6.4-6.4 4.8 11.2 4.8-1.6-4.8-11.2 9.6 0z" fill="#fff" stroke="#0E1A2E" stroke-width="1.2"/></g>'
      + '<g transform="translate(' + (G[0] - 160).toFixed(1) + ' ' + (G[1] - 118).toFixed(1) + ')"><g class="gpop"><rect width="320" height="70" rx="35" fill="#fff"/><text x="160" y="46" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="32" fill="#0E1116">Geneva · 3 events</text></g></g>'
      + '</svg>';
  }
  if (kind === 'cal') {
    const rows = [['APR', '14', 'Watches and Wonders', 'Geneva'], ['MAY', '02', 'Collector show', 'Paris'], ['JUN', '04', 'TimeFest', 'Bordeaux']];
    return '<svg class="gart gcal" viewBox="0 0 320 180" role="img" aria-label="Animated preview of the calendar list">'
      + '<rect width="320" height="180" rx="10" fill="#F6F6F4"/>'
      + '<g font-family="Inter,system-ui,sans-serif" font-size="9">'
      + '<rect x="16" y="14" width="40" height="18" rx="9" fill="#0F1B2D"/><text x="36" y="26" text-anchor="middle" fill="#fff">All</text>'
      + '<rect x="62" y="14" width="58" height="18" rx="9" fill="#fff" stroke="#DAD8D2"/><text x="91" y="26" text-anchor="middle" fill="#0E1116">Public fairs</text>'
      + '<g class="gchip"><rect x="126" y="14" width="62" height="18" rx="9" fill="#fff" stroke="#DAD8D2"/><text x="157" y="26" text-anchor="middle" fill="#0E1116">Switzerland</text></g>'
      + '<rect x="230" y="14" width="74" height="18" rx="9" fill="#fff" stroke="#DAD8D2"/><text x="267" y="26" text-anchor="middle" fill="#5A6170">Search…  /</text>'
      + rows.map(([m, d, n, c], i) => '<g class="grow" style="animation-delay:' + (0.2 + i * 0.25) + 's"><rect x="16" y="' + (44 + i * 44) + '" width="288" height="36" rx="5" fill="#fff" stroke="#E7E5E0"/>'
        + '<text x="34" y="' + (58 + i * 44) + '" text-anchor="middle" fill="#5A6170" font-size="7" letter-spacing="1">' + m + '</text><text x="34" y="' + (72 + i * 44) + '" text-anchor="middle" fill="#0E1116" font-size="14" font-family="Georgia,serif">' + d + '</text>'
        + '<text x="58" y="' + (59 + i * 44) + '" fill="#0E1116" font-size="10.5">' + n + '</text><text x="58" y="' + (72 + i * 44) + '" fill="#5A6170">' + c + '</text>'
        + '</g>').join('')
      + '</g></svg>';
  }
  // agenda
  const bars = [[0, 0, 3, '#0F1B2D'], [2, 1, 4, '#C9A86A'], [4, 0, 3, '#4A6785'], [1, 2, 2, '#7D5E45'], [3, 2, 4, '#0F1B2D'], [0, 3, 5, '#C9A86A'], [5, 3, 2, '#4A6785'], [2, 4, 3, '#0F1B2D']];
  let grid = '';
  for (let r = 0; r <= 3; r++) grid += '<line x1="16" x2="304" y1="' + (38 + r * 36) + '" y2="' + (38 + r * 36) + '" stroke="#E7E5E0"/>';
  for (let c = 0; c <= 7; c++) grid += '<line y1="38" y2="146" x1="' + (16 + c * 41.1) + '" x2="' + (16 + c * 41.1) + '" stroke="#E7E5E0"/>';
  return '<svg class="gart gag" viewBox="0 0 320 180" role="img" aria-label="Animated preview of the month agenda">'
    + '<rect width="320" height="180" rx="10" fill="#fff"/><rect x=".5" y=".5" width="319" height="179" rx="10" fill="none" stroke="#E7E5E0"/>'
    + '<g font-family="Inter,system-ui,sans-serif" font-size="8" fill="#5A6170">' + ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d, i) => '<text x="' + (36.5 + i * 41.1) + '" y="30" text-anchor="middle" letter-spacing="1">' + d + '</text>').join('') + '</g>'
    + grid
    + bars.map(([col, lane, span, color], i) => { const wk = lane < 2 ? 0 : lane < 4 ? 1 : 2; const ln = lane < 2 ? lane : lane < 4 ? lane - 2 : lane - 4; return '<rect class="gbar" style="animation-delay:' + (0.15 + i * 0.18) + 's" x="' + (19 + col * 41.1) + '" y="' + (44 + wk * 36 + ln * 14) + '" width="' + (span * 41.1 - 6) + '" height="10" rx="3" fill="' + color + '"/>'; }).join('')
    + '<g class="gbusy"><rect x="220" y="152" width="84" height="18" rx="9" fill="#FBF6EA" stroke="#E4CF9F"/><text x="262" y="164" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="9" fill="#7A5B1E">⚡ Busy week · 5</text></g>'
    + '</svg>';
}

/* ---------- home block: three ways to explore ---------- */
const CARDS = [
  ['map', '/map', '01', 'The map', 'Spin around the watch world.', ['Click a gold country to fly in', 'Pick a city to see what is on', 'Scroll to zoom, drag to explore'], 'Try the map'],
  ['ag', '/agenda', '02', 'The agenda', 'The whole year, like your own diary.', ['Each bar is an event, its length is its duration', 'Spot the busy weeks ⚡ at a glance', 'Click a bar, add it to your calendar'], 'Try the agenda'],
  ['cal', '/#calendar', '03', 'The list', 'Every event in one list, filtered your way.', ['Search a fair, a city, an organiser', 'Filter by type, country or size', 'Open any event for every detail'], 'Try the list']
];
export function homeGuide() {
  return '<section class="gband" id="guide"><div class="wrap gd">'
    + '<div class="eyebrow reveal">Three ways to explore</div>'
    + '<div class="reveal" style="margin-top:4px;display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:20px"><h2 class="sec">One calendar, <em class="g">three ways to see it.</em></h2>'
    + '<p style="margin:0;max-width:340px;color:var(--muted);font-size:16px;line-height:1.6">Click around, zoom in, filter, save. Nothing can break, so go ahead and play.</p></div>'
    + '<div class="ways">' + CARDS.map(([k, href, n, t, d, steps, cta], i) => '<a href="' + href + '" class="way reveal" data-w="' + k + '" style="--d:' + (i * 120) + 'ms"' + (href === '/#calendar' ? ' data-act="scroll"' : '') + '>'
      + '<div class="wart">' + guideArt(k) + '</div>'
      + '<div class="wbody"><div class="wn">' + n + '</div><h3>' + t + '</h3><p>' + d + '</p>'
      + '<ol>' + steps.map((x) => '<li>' + x + '</li>').join('') + '</ol>'
      + '<span class="btn btn-navy wgo">' + cta + ' ' + ARROW + '</span></div></a>').join('') + '</div>'
    + '<div class="extras reveal">'
    + extra('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>', 'Sync', 'Add any event to Google, Apple or Outlook.')
    + extra('<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13"/>', 'Share', 'Send it on LinkedIn, WhatsApp or by link.')
    + extra('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>', 'Quick search', 'Press <kbd>/</kbd> anywhere to search.')
    + '</div>'
    + '<div class="reveal gcta"><span>New here? Let us show you around.</span><button class="btn btn-gold" data-act="tour">Take the 30-second tour ' + ARROW + '</button></div>'
    + '</div></section>';
}
function extra(icon, t, d) {
  return '<div class="xtra"><span class="xi"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + icon + '</svg></span><div><b>' + t + '</b><span>' + d + '</span></div></div>';
}

/* ---------- guided tour (header "?" button) ---------- */
const TOUR = [
  ['map', 'The map', 'Fly around the watch world. Gold countries have events: click one, pick a city, and every fair there is right in front of you. Scroll to zoom, drag to move.', '/map', 'Try the map'],
  ['ag', 'The agenda', 'The whole year as a diary. Each bar is an event, from its first to its last day. Busy weeks are flagged ⚡ and the colour legend shows or hides each type.', '/agenda', 'Try the agenda'],
  ['cal', 'The list', 'Every upcoming event in one list. Search, filter by type, country or free entry, and browse month by month.', '/#calendar', 'Try the list'],
  ['event', 'Keep and share', 'Add any event to Google, Apple or Outlook in one click, or share it with a friend on LinkedIn or WhatsApp.', null, null],
  ['add', 'Organising an event?', 'List it for free in about three minutes. It appears straight away in the calendar, the agenda and on the map.', '/add', 'Add your event']
];
export const TOUR_LEN = TOUR.length;
export function tourHTML(i) {
  const [art, t, d, href, cta] = TOUR[i];
  const last = i === TOUR.length - 1;
  const vis = art === 'event' ? eventMock() : art === 'add' ? addMock() : guideArt(art);
  return '<div class="tcard" role="document"><button class="tx" data-act="tclose" aria-label="Close the tour"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>'
    + '<div class="tvis' + (art === 'event' || art === 'add' ? ' tmock' : '') + '">' + vis + '</div>'
    + '<div class="tbody"><div class="tstep">' + (i + 1) + ' / ' + TOUR.length + '</div><h2 id="ttitle">' + t + '</h2><p>' + d + '</p>' + (last && href ? '<a href="' + href + '" class="ul tinl" data-act="tgo">' + cta + ' ' + ARROW + '</a>' : '')
    + '<div class="tdots" aria-hidden="true">' + TOUR.map((_, j) => '<span' + (j === i ? ' class="on"' : '') + '></span>').join('') + '</div>'
    + '<div class="tnav">' + (i > 0 ? '<button class="btn btn-line" data-act="tprev">Back</button>' : '<span></span>')
    + '<div style="display:flex;gap:10px;align-items:center;justify-content:flex-end">' + (href && !last ? '<a href="' + href + '" class="btn btn-line" data-act="tgo">' + cta + '</a>' : '')
    + (i < TOUR.length - 1 ? '<button class="btn btn-navy" data-act="tnext">Next ' + ARROW + '</button>' : '<a href="/guide" class="ul tfull" data-act="tgo">Full guide</a><button class="btn btn-navy" data-act="tclose">Got it, thanks</button>') + '</div></div>'
    + '</div></div>';
}

/* ---------- full guide page ---------- */
const SECTIONS = [
  ['map', 'The world map', 'Where the watch world meets.', 'map', [
    ['Start from the world', 'Every country in gold has at least one upcoming event. Hover to see its name, click it to zoom in.'],
    ['Pick a city', 'Each dot is a city. Click it to open the list of its events, then choose one to see its details.'],
    ['Move around freely', 'Scroll to zoom and drag to move. On a phone, use two fingers. <b>World view</b> takes you back to the start.']
  ], ['A softly pulsing dot means an event is happening right now.', 'City names appear once you zoom in on a country.'], ['/map', 'Open the map']],
  ['agenda', 'The agenda', 'The whole month, like your own diary.', 'ag', [
    ['Read the month', 'Each coloured bar is an event: where it starts, where it ends and how long it lasts.'],
    ['Move through the months', 'Use the arrows or the month strip. The strip shows how busy each month is.'],
    ['Focus', 'Hide or show event types with the colour legend. Click a bar to see the details on the side.']
  ], ['Weeks with four events or more are flagged ⚡ <b>Busy week</b>.', 'From the side panel, add the event to Google Calendar in one click.'], ['/agenda', 'Open the agenda']],
  ['calendar', 'The list', 'Every upcoming event, filtered your way.', 'cal', [
    ['Search', 'Type a fair, a city or an organiser in the search field. From any page, press <kbd>/</kbd> to search straight away.'],
    ['Filter', 'Choose a type (trade fairs, public fairs, jewellery, vintage, auctions), a country or a size.'],
    ['Browse by month', 'Swipe through the month tabs: the number shows how many events each month holds.']
  ], ['Open any event to see its key facts and a link to the official website.'], ['/#calendar', 'Browse the list']],
  ['event', 'Event pages', 'Everything you need, and the official source.', null, [
    ['Key facts', 'Dates, duration, venue, type, number of exhibitors, who can attend and who organises it.'],
    ['Official website', 'Every event links to its organiser’s website: always check final details there.'],
    ['Keep and share', 'Add it to Google, Apple or Outlook calendar, or share it on LinkedIn, WhatsApp or by link.']
  ], ['“Dates to be confirmed” means the organiser has announced the event but not its final dates yet.'], null],
  ['organisers', 'For organisers', 'List your event for free.', null, [
    ['Fill in the form', 'Name, dates, city, venue, type and the official website. It takes about three minutes.'],
    ['Online straight away', 'Your event appears in the calendar, the agenda and on the map.'],
    ['Stay in control', 'The contact email you give is never published. Write to us anytime to update or remove your event.']
  ], ['Each organiser is responsible for the information they publish.'], ['/add', 'Add your event']]
];
const FAQ = [
  ['Is it free?', 'Yes, for everyone: visitors and organisers. There is no account to create.'],
  ['Where does the information come from?', 'From the organisers themselves and their official websites. Each event links to its source.'],
  ['Does it work on my phone?', 'Yes. The whole site works on phones, tablets and computers.'],
  ['Do I need an account?', 'No. Everything is open: there is nothing to sign up for.']
];
export function pageGuideBody(header, footer) {
  return '<section class="dark">' + header('guide') + '<div class="wrap" style="padding-top:72px;padding-bottom:72px"><div class="eyebrow in">How it works</div>'
    + '<h1 class="big in d1">Your guide to <em class="g">World Watch Calendar.</em></h1>'
    + '<p class="lead in d2" style="max-width:620px">Three ways to explore, a few handy extras, nothing to install and no account to create. Here is everything in two minutes.</p>'
    + '<nav class="gnav in d3" aria-label="Guide sections">' + SECTIONS.map(([id, t]) => '<a href="#' + id + '" data-act="gjump" data-v="' + id + '">' + t + '</a>').join('') + '<a href="#faq" data-act="gjump" data-v="faq">Questions</a></nav>'
    + '</div></section>'
    + '<main class="wrap gpage">' + SECTIONS.map(([id, t, sub, art, steps, tips, cta], i) => '<section class="gsec reveal" id="' + id + '">'
      + '<div class="gtext"><div class="wn">' + String(i + 1).padStart(2, '0') + '</div><h2 class="sec" style="margin-top:8px">' + t + '</h2><p class="gsub">' + sub + '</p>'
      + '<ol class="gsteps">' + steps.map(([h, d]) => '<li><b>' + h + '</b><span>' + d + '</span></li>').join('') + '</ol>'
      + (tips.length ? '<div class="gtips">' + tips.map((x) => '<p><span aria-hidden="true">✦</span> ' + x + '</p>').join('') + '</div>' : '')
      + (cta ? '<a href="' + cta[0] + '" class="btn btn-navy" style="margin-top:28px">' + cta[1] + ' ' + ARROW + '</a>' : '')
      + '</div>' + (art ? '<div class="gvis">' + guideArt(art) + '</div>' : '<div class="gvis gfacts">' + (id === 'event' ? eventMock() : addMock()) + '</div>')
      + '</section>').join('')
    + '<section class="gsec gfaq reveal" id="faq"><div style="flex:1 1 100%"><div class="wn">FAQ</div><h2 class="sec" style="margin-top:8px">Questions</h2>'
    + '<div class="faq">' + FAQ.map(([q, a]) => '<details><summary>' + q + '</summary><p>' + a + '</p></details>').join('') + '</div></div></section>'
    + '</main>' + footer(false);
}
function eventMock() {
  return '<div class="emock"><span class="tag" style="display:inline-flex;align-items:center;min-height:24px;padding:0 10px;border-radius:999px;background:#0F1B2D;color:#fff;font-size:10px">Trade fair</span>'
    + '<div class="serif" style="font-size:26px;margin-top:12px;line-height:1.1">Your favourite fair</div><dl class="facts"><div><dt>Dates</dt><dd>14 – 20 April</dd></div><div><dt>Venue</dt><dd>Palexpo, Geneva</dd></div><div><dt>Open to</dt><dd>Public · free entry</dd></div></dl>'
    + '<div class="emb">Visit official website</div><div class="emrow"><span>Google</span><span>Apple</span><span>Outlook</span></div></div>';
}
function addMock() {
  return '<div class="emock"><div class="k" style="font-size:10px">Add your event</div>'
    + ['Event name', 'Dates', 'City & venue', 'Official website'].map((l, i) => '<div class="amf" style="animation-delay:' + (i * 0.35) + 's"><span>' + l + '</span><i></i></div>').join('')
    + '<div class="emb" style="margin-top:16px">Publish my event</div></div>';
}
