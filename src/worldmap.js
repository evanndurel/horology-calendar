// WebGL world map (MapLibre GL). Loaded only on the map page.
// The map is drawn by the graphics card, so zooming stays smooth on any device.
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { feature } from 'topojson-client';

const WORLD = [[-168, -50], [190, 74]];
const C = { sea: '#0E1A2E', land: '#152338', line: '#26364E', has: '#4A4130', hasLine: '#8A7448', dimHas: '#2A2E2C', dimLine: '#4A4636', on: '#5C4E2E', onLine: '#E4CF9F', gold: '#E4CF9F' };

export function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (x) { return false; }
}

let topoCache = null;
// Countries crossing the 180° line (Russia, Fiji…) would draw a line across the whole map:
// move their far-east parts past 180° so each polygon stays in one piece.
function fixDateline(fc) {
  // unwrap each ring so that consecutive points never jump by more than 180° of longitude
  fc.features.forEach((f) => {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    polys.forEach((p) => p.forEach((r) => { for (let i = 1; i < r.length; i++) { let x = r[i][0]; const px = r[i - 1][0]; while (x - px > 180) x -= 360; while (x - px < -180) x += 360; r[i][0] = x; } }));
  });
  return fc;
}
async function loadCountries() {
  if (!topoCache) topoCache = fetch('/countries.topo.json').then((r) => r.json()).then((t) => fixDateline(feature(t, t.objects.countries)));
  return topoCache;
}

// Bounding box of a country's main landmass (ignores far-away islands and territories)
function mainBox(f) {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  let best = null, bestA = -1;
  for (const p of polys) {
    let x0 = 180, y0 = 90, x1 = -180, y1 = -90;
    for (const [x, y] of p[0]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const a = (x1 - x0) * (y1 - y0); if (a > bestA) { bestA = a; best = [[x0, y0], [x1, y1]]; }
  }
  return best;
}

export async function createWorldMap(el, { onCountry, onCity, onReady, onMove }) {
  const fc = await loadCountries();
  const boxes = {}; fc.features.forEach((f, i) => { f.id = i + 1; const cc = f.properties.cc; if (cc && !boxes[cc]) boxes[cc] = mainBox(f); });
  const map = new maplibregl.Map({
    container: el,
    style: { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': C.sea } }] },
    bounds: WORLD, fitBoundsOptions: { padding: 10 }, renderWorldCopies: false, attributionControl: false,
    dragRotate: false, pitchWithRotate: false, touchPitch: false, scrollZoom: true, doubleClickZoom: true, boxZoom: false, keyboard: true,
    // one finger keeps scrolling the page on phones; two fingers pinch and move the map
    dragPan: !matchMedia('(pointer: coarse)').matches,
    cooperativeGestures: false, maxZoom: 9, minZoom: 0, fadeDuration: 0,
  });
  map.touchZoomRotate.disableRotation();
  const st = { has: new Set(), country: '', markers: [], pulses: [] };
  await new Promise((r) => map.on('load', r));
  map.setMinZoom(Math.max(0, map.getZoom() - 0.3));
  map.scrollZoom.setWheelZoomRate(1 / 300);
  map.addSource('countries', { type: 'geojson', data: fc, promoteId: undefined });
  map.addSource('pins', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  const caseState = (on, has, dim, base) => ['case', ['boolean', ['feature-state', 'on'], false], on, ['boolean', ['feature-state', 'has'], false], ['case', ['boolean', ['feature-state', 'dim'], false], dim, has], base];
  map.addLayer({ id: 'land', type: 'fill', source: 'countries', paint: { 'fill-color': caseState(C.on, C.has, C.dimHas, C.land), 'fill-color-transition': { duration: 500 } } });
  map.addLayer({ id: 'borders', type: 'line', source: 'countries', paint: { 'line-color': caseState(C.onLine, C.hasLine, C.dimLine, C.line), 'line-width': ['case', ['boolean', ['feature-state', 'on'], false], 1.6, 0.7] } });
  map.addLayer({ id: 'pin-hit', type: 'circle', source: 'pins', paint: { 'circle-radius': ['+', ['get', 'r'], 9], 'circle-opacity': 0 } });
  map.addLayer({ id: 'pins', type: 'circle', source: 'pins', paint: {
    'circle-radius': ['get', 'r'], 'circle-color': ['case', ['get', 'act'], '#FFFFFF', C.gold], 'circle-stroke-color': '#0A1322', 'circle-stroke-width': 1.2,
    'circle-opacity': ['case', ['get', 'dim'], 0.2, 1], 'circle-stroke-opacity': ['case', ['get', 'dim'], 0.2, 1],
    'circle-radius-transition': { duration: 400 }, 'circle-opacity-transition': { duration: 400 } } });

  map.on('click', (e) => {
    const p = map.queryRenderedFeatures(e.point, { layers: ['pin-hit'] });
    if (p.length) { onCity(p[0].properties.city); return; }
    const c = map.queryRenderedFeatures(e.point, { layers: ['land'] });
    if (c.length && st.has.has(c[0].properties.cc)) onCountry(c[0].properties.cc);
  });
  map.on('mousemove', (e) => {
    const p = map.queryRenderedFeatures(e.point, { layers: ['pin-hit'] });
    const c = p.length ? p : map.queryRenderedFeatures(e.point, { layers: ['land'] }).filter((f) => st.has.has(f.properties.cc));
    map.getCanvas().style.cursor = c.length ? 'pointer' : '';
  });
  // labels appear for every city once the visitor zooms in far enough
  const syncLabels = () => el.classList.toggle('zl', map.getZoom() >= 3.2);
  map.on('zoom', syncLabels);
  map.on('movestart', (e) => { if (e.originalEvent) st.key = null; });
  map.on('move', (e) => { if (onMove) onMove(!!e.originalEvent); });
  // never let the world slide out of the frame
  map.on('moveend', (e) => { if (!e.originalEvent) return; const c = map.getCenter(); const lng = Math.max(-130, Math.min(160, c.lng)), lat = Math.max(-45, Math.min(65, c.lat)); if (lng !== c.lng || lat !== c.lat) map.easeTo({ center: [lng, lat], duration: 400 }); });
  map.on('mouseout', () => { map.getCanvas().style.cursor = ''; });
  new ResizeObserver(() => map.resize()).observe(el);

  const api = {
    map, boxes,
    project(lon, lat) { const p = map.project([lon, lat]); return { x: p.x, y: p.y, w: el.clientWidth, h: el.clientHeight }; },
    // view: { hasCountries:Set, country, cities:[{city, cc, lon, lat, count, live, act}], bounds }
    update(view, done) {
      st.has = view.hasCountries;
      fc.features.forEach((f) => {
        const cc = f.properties.cc;
        map.setFeatureState({ source: 'countries', id: f.id }, { has: st.has.has(cc), on: !!view.country && cc === view.country, dim: !!view.country && cc !== view.country });
      });
      const zoomed = !!view.country;
      const z = zoomed ? map.getZoom() : 0;
      map.getSource('pins').setData({ type: 'FeatureCollection', features: view.cities.map((c) => ({
        type: 'Feature', geometry: { type: 'Point', coordinates: [c.lon, c.lat] },
        properties: { city: c.city, r: (3 + Math.min(c.count, 7) * 0.6) * (zoomed ? 1.6 : 1) * (c.act ? 1.25 : 1), dim: zoomed && c.cc !== view.country, act: !!c.act } })) });
      // pulsing rings for events happening now, and city labels when zoomed (HTML, animated by the GPU)
      st.markers.forEach((m) => m.remove()); st.markers = [];
      view.cities.forEach((c) => {
        if (c.live && (!zoomed || c.cc === view.country)) { const d = document.createElement('div'); d.innerHTML = '<span class="glpulse"></span>'; st.markers.push(new maplibregl.Marker({ element: d }).setLngLat([c.lon, c.lat]).addTo(map)); }
        { const d = document.createElement('div'); d.className = 'gllabel' + (zoomed && c.cc === view.country ? ' on' : '') + (zoomed && c.cc !== view.country ? ' dim' : ''); d.textContent = c.city + (c.count > 1 ? ' · ' + c.count : ''); st.markers.push(new maplibregl.Marker({ element: d, anchor: 'left', offset: [10, 0] }).setLngLat([c.lon, c.lat]).addTo(map)); }
      });
      syncLabels();
      const target = view.bounds || WORLD;
      const key = JSON.stringify(target);
      if (key !== st.key) {
        st.key = key;
        map.once('moveend', () => done && done());
        map.fitBounds(target, { padding: zoomed ? { top: 60, bottom: 50, left: 40, right: 40 } : 10, maxZoom: 7, duration: 1100, essential: true });
      } else if (done) done();
    },
    destroy() { map.remove(); },
  };
  if (onReady) onReady(api);
  return api;
}
