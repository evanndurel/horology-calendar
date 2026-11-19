/* ---------------- GUIDE ----------------
   A playful "find your way" block for the home page and a full /guide page.
   Illustrations are tiny inline SVGs animated with CSS (disabled for reduced motion). */

const ARROW = '<svg class="arr" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

/* ---------- illustrations ---------- */
export function guideArt(kind) {
  if (kind === 'map') {
    const dots = [[86, 70, 0], [150, 62, 1], [158, 74, 0], [176, 68, 0], [214, 96, 0], [262, 92, 1], [252, 120, 0], [98, 96, 0]];
    return '<svg class="gart gmap" viewBox="0 0 320 180" role="img" aria-label="Animated preview of the world map">'
      + '<rect width="320" height="180" rx="10" fill="#0E1A2E"/>'
      + '<g fill="#1B2A44"><path d="M40 52c18-14 52-16 70-6 10 6 8 18 18 26 6 6 2 18-8 22-14 6-20 22-34 22-16 0-18-16-30-24-12-8-30-26-16-40z"/><path d="M132 44c16-8 40-8 56 0 14 6 34 4 48 10 16 6 34 6 44 18 8 10-4 22-18 22-12 0-18 12-30 14-14 2-22-10-34-8-10 2-12 14-22 12-12-2-8-18-18-24-10-6-28-2-32-14-4-10 0-24 6-30z"/><path d="M226 112c10-6 26-4 34 4 6 6 2 18-8 20-10 2-22 0-28-8-4-6-4-12 2-16z"/></g>'
      + '<path class="gcty" d="M138 52c10-5 24-5 32 0 6 4 4 14-4 18-8 4-20 4-26-2-6-5-6-12-2-16z" fill="#3A3424" stroke="#B8975A" stroke-width="1"/>'
      + dots.map(([x, y, live], i) => '<g transform="translate(' + x + ' ' + y + ')">' + (live ? '<circle class="gpulse" r="4" fill="none" stroke="#E4CF9F" stroke-width="1.2" style="animation-delay:' + i * 0.3 + 's"/>' : '') + '<circle r="3" fill="#E4CF9F"/></g>').join('')
      + '<g class="gcur"><path d="M0 0l0 14 4-4 3 7 3-1-3-7 6 0z" fill="#fff" stroke="#0E1A2E" stroke-width="1"/></g>'
      + '<g class="gpop"><rect x="104" y="20" width="104" height="26" rx="13" fill="#fff"/><text x="156" y="37" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="11" fill="#0E1116">Geneva · 3 events</text></g>'
      + '</svg>';
  }
  if (kind === 'cal') {
    const rows = [['APR', '14', 'Watches and Wonders', 'Geneva'], ['MAY', '02', 'Collector show', 'Paris'], ['JUN', '04', 'TimeFest', 'Bordeaux']];
    return '<svg class="gart gcal" viewBox="0 0 320 180" role="img" aria-label="Animated preview of the calendar list">'
      + '<rect width="320" height="180" rx="10" fill="#F6F6F4"/>'
      + '<g font-family="Inter,system-ui,sans-serif" font-size="9">'
      + '<rect x="16" y="14" width="40" height="18" rx="9" fill="#0F1B2D"/><text x="36" y="26" text-anchor="middle" fill="#fff">All</text>'
      + '<rect x="62" y="14" width="58" height="18" rx="9" fill="#fff" stroke="#DAD8D2"/><text x="91" y="26" text-anchor="middle" fill="#0E1116">Public fairs</text>'
      + '<g class="gchip"><rect x="126" y="14" width="62" height="18" rx="9" fill="#fff" stroke="#DAD8D2"/><text x="157" y="26" text-anchor="middle" fill="#0E1116">Free entry</text></g>'
      + '<rect x="230" y="14" width="74" height="18" rx="9" fill="#fff" stroke="#DAD8D2"/><text x="267" y="26" text-anchor="middle" fill="#5A6170">Search…  /</text>'
      + rows.map(([m, d, n, c], i) => '<g class="grow" style="animation-delay:' + (0.2 + i * 0.25) + 's"><rect x="16" y="' + (44 + i * 44) + '" width="288" height="36" rx="5" fill="#fff" stroke="#E7E5E0"/>'
        + '<text x="34" y="' + (58 + i * 44) + '" text-anchor="middle" fill="#5A6170" font-size="7" letter-spacing="1">' + m + '</text><text x="34" y="' + (72 + i * 44) + '" text-anchor="middle" fill="#0E1116" font-size="14" font-family="Georgia,serif">' + d + '</text>'
        + '<text x="58" y="' + (59 + i * 44) + '" fill="#0E1116" font-size="10.5">' + n + '</text><text x="58" y="' + (72 + i * 44) + '" fill="#5A6170">' + c + '</text>'
        + '<path class="' + (i === 0 ? 'gstar' : '') + '" transform="translate(280 ' + (55 + i * 44) + ') scale(.6)" d="M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.6 5.7 21l1.5-7L2 9.3l7-.8z" fill="none" stroke="#8A909A" stroke-width="1.6" stroke-linejoin="round"/></g>').join('')
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

/* ---------- who are you? ---------- */
export const PERSONAS = [
  ['lover', 'Watch lover', 'cal', 'Tick <b>Open to the public</b> and <b>Free entry</b> in the calendar to find fairs you can simply walk into.'],
  ['collector', 'Collector', 'cal', 'Pick <b>Vintage &amp; collectors</b> in the calendar, then tap ★ to build your own season.'],
  ['journalist', 'Journalist', 'ag', 'Plan your coverage month by month in the <b>Agenda</b>: busy weeks are flagged ⚡.'],
  ['brand', 'Brand or retailer', 'map', 'Open the <b>Map</b> to see where the trade meets, country by country and city by city.'],
  ['traveller', 'Traveller', 'map', 'Going abroad? Click a country on the <b>Map</b> to see what is on while you are there.'],
  ['organiser', 'Organiser', 'add', 'List your event for free: it is online in a few minutes and stays yours to update.']
];
const WAYS = {
  map: ['/map', 'Open the map'],
  cal: ['/#calendar', 'Browse the calendar'],
  ag: ['/agenda', 'Open the agenda'],
  add: ['/add', 'Add your event']
};
export function personaTip(key) {
  const p = PERSONAS.find((x) => x[0] === key) || PERSONAS[0];
  const w = WAYS[p[2]];
  return '<span>' + p[3] + '</span><a href="' + w[0] + '" class="ul whogo"' + (w[0] === '/#calendar' ? ' data-act="scroll"' : '') + '>' + w[1] + ' ' + ARROW + '</a>';
}
export function personaWay(key) { const p = PERSONAS.find((x) => x[0] === key); return p ? p[2] : ''; }

/* ---------- home block ---------- */
const CARDS = [
  ['map', '01', 'The map', 'See the watch world at a glance.', ['Click a gold country to zoom in', 'Pick a city to see its events', 'A pulsing dot means it is happening now']],
  ['cal', '02', 'The calendar', 'Every upcoming event, filtered your way.', ['Search by name, city or organiser', 'Filter by type, country, free entry…', 'Tap ★ to save it to My season']],
  ['ag', '03', 'The agenda', 'The whole month, like your own diary.', ['Each bar is an event and its length', 'Spot the busy weeks in a second', 'Add any event to your calendar']]
];
export function homeGuide(persona) {
  const rec = personaWay(persona);
  return '<section class="wrap gd" id="guide" style="padding-top:112px;padding-bottom:24px;scroll-margin-top:20px">'
    + '<div class="eyebrow reveal">Made for everyone</div>'
    + '<h2 class="sec reveal">Whoever you are, <em class="g">start here.</em></h2>'
    + '<div class="who reveal" style="--d:100ms" role="group" aria-label="Who are you?"><span class="whol">I’m a…</span>'
    + PERSONAS.map(([k, l]) => '<button class="whoc' + (k === persona ? ' on' : '') + '" data-act="persona" data-v="' + k + '" aria-pressed="' + (k === persona) + '">' + l + '</button>').join('')
    + '</div><p class="whotip reveal" style="--d:160ms" id="whotip" aria-live="polite">' + personaTip(persona) + '</p>'
    + '<div class="ways">' + CARDS.map(([k, n, t, d, steps], i) => {
      const w = WAYS[k];
      return '<article class="way reveal' + (k === rec ? ' rec' : '') + '" data-w="' + k + '" style="--d:' + (i * 120) + 'ms">'
        + '<div class="wart">' + guideArt(k) + '</div>'
        + '<div class="wbody"><div class="wn">' + n + '<span class="wrec" aria-hidden="' + (k !== rec) + '">Best for you</span></div><h3>' + t + '</h3><p>' + d + '</p>'
        + '<ol>' + steps.map((s) => '<li>' + s + '</li>').join('') + '</ol>'
        + '<a href="' + w[0] + '" class="btn btn-line wgo"' + (w[0] === '/#calendar' ? ' data-act="scroll"' : '') + '>' + w[1] + ' ' + ARROW + '</a></div></article>';
    }).join('') + '</div>'
    + '<div class="extras reveal">'
    + extra('<path d="M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.6 5.7 21l1.5-7L2 9.3l7-.8z"/>', 'My season', 'Save events with ★, no account needed.')
    + extra('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>', 'Sync', 'Add any event to Google, Apple or Outlook.')
    + extra('<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13"/>', 'Share', 'Send it on LinkedIn, WhatsApp or by link.')
    + extra('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>', 'Quick search', 'Press <kbd>/</kbd> anywhere to search.')
    + '</div>'
    + '<div class="reveal" style="margin-top:36px;text-align:center"><a href="/guide" class="btn btn-navy" style="min-height:48px">Read the full guide ' + ARROW + '</a></div>'
    + '</section>';
}
function extra(icon, t, d) {
  return '<div class="xtra"><span class="xi"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + icon + '</svg></span><div><b>' + t + '</b><span>' + d + '</span></div></div>';
}

/* ---------- full guide page ---------- */
const SECTIONS = [
  ['map', 'The world map', 'Where the watch world meets.', 'map', [
    ['Start from the world', 'Every country in gold has at least one upcoming event. Hover to see its name, click it to zoom in.'],
    ['Pick a city', 'Each dot is a city. Click it to open the list of its events, then choose one to see its details.'],
    ['Move around freely', 'Scroll to zoom and drag to move. On a phone, use two fingers. <b>World view</b> takes you back to the start.']
  ], ['A softly pulsing dot means an event is happening right now.', 'City names appear once you zoom in on a country.'], ['/map', 'Open the map']],
  ['calendar', 'The calendar', 'Every upcoming event, filtered your way.', 'cal', [
    ['Search', 'Type a fair, a city or an organiser in the search field. From any page, press <kbd>/</kbd> to search straight away.'],
    ['Filter', 'Choose a type (trade fairs, public fairs, jewellery, vintage, auctions), a country or a size, and tick <b>Open to the public</b> or <b>Free entry</b>.'],
    ['Browse by month', 'Swipe through the month tabs: the number shows how many events each month holds.']
  ], ['Tap ★ on any event to keep it in <b>My season</b>, then use the ★ filter to see only your picks.'], ['/#calendar', 'Browse the calendar']],
  ['agenda', 'The agenda', 'The whole month, like your own diary.', 'ag', [
    ['Read the month', 'Each coloured bar is an event: where it starts, where it ends and how long it lasts.'],
    ['Move through the season', 'Use the arrows or the month strip. The strip shows how busy each month is.'],
    ['Focus', 'Hide or show event types with the colour legend. Click a bar to see the details on the side.']
  ], ['Weeks with four events or more are flagged ⚡ <b>Busy week</b>.', 'From the side panel, add the event to Google Calendar in one click.'], ['/agenda', 'Open the agenda']],
  ['event', 'Event pages', 'Everything you need, and the official source.', null, [
    ['Key facts', 'Dates, duration, venue, type, number of exhibitors, who can attend and who organises it.'],
    ['Official website', 'Every event links to its organiser’s website: always check final details there.'],
    ['Keep and share', 'Add it to Google, Apple or Outlook calendar, save it to My season, or share it on LinkedIn, WhatsApp or by link.']
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
  ['Where is My season saved?', 'On your device, in your browser. Nothing is sent to us.']
];
export function pageGuideBody(header, footer) {
  return '<section class="dark">' + header('guide') + '<div class="wrap" style="padding-top:72px;padding-bottom:72px"><div class="eyebrow in">How it works</div>'
    + '<h1 class="big in d1">Your guide to <em class="g">the watch season.</em></h1>'
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
    + '<div class="emb">Visit official website</div><div class="emb line">★ Save to My season</div><div class="emrow"><span>Google</span><span>Apple</span><span>Outlook</span></div></div>';
}
function addMock() {
  return '<div class="emock"><div class="k" style="font-size:10px">Add your event</div>'
    + ['Event name', 'Dates', 'City & venue', 'Official website'].map((l, i) => '<div class="amf" style="animation-delay:' + (i * 0.35) + 's"><span>' + l + '</span><i></i></div>').join('')
    + '<div class="emb" style="margin-top:16px">Publish my event</div></div>';
}
