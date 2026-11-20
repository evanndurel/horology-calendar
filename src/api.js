// Data access for World Watch Calendar.
// With VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set, everything goes to the
// Supabase database. Without them the site runs in "demo mode" from the bundled
// seed data, and changes are kept in the visitor's own browser only.
import { createClient } from '@supabase/supabase-js';
import SEED from './seed.json';

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const DEMO = !URL || !KEY;

// Past events are kept for 18 months (for the admin "Past" filter).
const since = () => new Date(Date.now() - 548 * 864e5).toISOString().slice(0, 10);

function supabaseApi() {
  const sb = createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true } });
  const ok = ({ data, error }) => { if (error) throw error; return data; };
  return {
    async listEvents() {
      return ok(await sb.from('events').select('*').gte('end_date', since()).order('start_date', { ascending: true }).limit(2000));
    },
    async addEvent(row, email, extra) {
      // Until supabase/update-2026-11-20-categories.sql has been run, the database only knows the old
      // categories and has no public_days column: fall back gracefully instead of rejecting the listing.
      let r = await sb.from('events').insert(row);
      if (r.error && /public_days/.test(r.error.message || '')) { const x = Object.assign({}, row); delete x.public_days; if (row.public_days) x.press_days = [row.press_days && 'Pro ' + row.press_days, 'Public ' + row.public_days].filter(Boolean).join(' · ').slice(0, 80); row = x; r = await sb.from('events').insert(row); }
      if (r.error && r.error.code === '23514' && /type/.test(r.error.message || '')) r = await sb.from('events').insert(Object.assign({}, row, { type: row.type === 'award' ? 'auction' : row.type === 'jewel' ? 'jewel' : row.trade_only ? 'trade' : 'public' }));
      ok(r);
      if (email) {
        const c = Object.assign({ event_id: row.id, email }, extra || {});
        let q = await sb.from('submission_contacts').insert(c);
        if (q.error && extra) q = await sb.from('submission_contacts').insert({ event_id: row.id, email: email + (extra.exhibitor_email ? ' (exhibitors: ' + extra.exhibitor_email + ')' : '') });
        if (q.error) console.warn('contact not saved', q.error.message);
      }
    },
    async updateEvent(id, patch) {
      const rows = ok(await sb.from('events').update(patch).eq('id', id).select('id'));
      if (!rows || !rows.length) throw new Error('not allowed');
    },
    async subscribe(email) {
      const { error } = await sb.from('subscribers').insert({ email: email.toLowerCase() });
      if (error && error.code !== '23505') throw error; // 23505 = already subscribed
    },
    async signIn(email, password) { ok(await sb.auth.signInWithPassword({ email, password })); },
    async signOut() { await sb.auth.signOut(); },
    async session() { const { data } = await sb.auth.getSession(); return data.session ? { email: data.session.user.email } : null; },
    async isAdmin() { const { data, error } = await sb.rpc('is_admin'); return !error && data === true; },
    async contacts() {
      let r = await sb.from('submission_contacts').select('event_id,email,exhibitor_email,role');
      if (r.error) r = await sb.from('submission_contacts').select('event_id,email');
      const o = {}; ok(r).forEach((x) => { o[x.event_id] = x; }); return o;
    },
    async subscribers() { return ok(await sb.from('subscribers').select('email,created_at').order('created_at')); },
  };
}

function demoApi() {
  const K = 'hc-demo-v1';
  const load = () => { try { return JSON.parse(localStorage.getItem(K)) || {}; } catch (x) { return {}; } };
  const save = (s) => { try { localStorage.setItem(K, JSON.stringify(s)); } catch (x) {} };
  const state = () => { const s = load(); s.added = s.added || []; s.patch = s.patch || {}; s.contacts = s.contacts || {}; s.subs = s.subs || []; return s; };
  const today = () => new Date().toISOString().slice(0, 10);
  let signed = (() => { try { return sessionStorage.getItem('hc-demo-admin') === '1'; } catch (x) { return false; } })();
  return {
    async listEvents() {
      const s = state();
      return SEED.concat(s.added).map((r) => Object.assign({}, r, s.patch[r.id] || {}))
        .filter((r) => (signed || !r.hidden) && r.end_date >= since()).sort((a, b) => (a.start_date < b.start_date ? -1 : 1));
    },
    async addEvent(row, email, extra) {
      const s = state();
      s.added.push(Object.assign({ verified: false, hidden: false, reviewed: signed, source: signed ? 'team' : 'organiser', submitted_at: new Date().toISOString(), updated_on: today(), gallery: [] }, row));
      if (email) s.contacts[row.id] = Object.assign({ email }, extra || {}); save(s);
    },
    async updateEvent(id, patch) { if (!signed) throw new Error('not allowed'); const s = state(); s.patch[id] = Object.assign(s.patch[id] || {}, patch, { updated_on: today() }); save(s); },
    async subscribe(email) { const s = state(); if (!s.subs.find((x) => x.email === email)) s.subs.push({ email, created_at: new Date().toISOString() }); save(s); },
    async signIn(email, password) { if (email !== 'demo@worldwatchcalendar.test' || password !== 'demo') throw new Error('Invalid login'); signed = true; try { sessionStorage.setItem('hc-demo-admin', '1'); } catch (x) {} },
    async signOut() { signed = false; try { sessionStorage.removeItem('hc-demo-admin'); } catch (x) {} },
    async session() { return signed ? { email: 'demo@worldwatchcalendar.test' } : null; },
    async isAdmin() { return signed; },
    async contacts() { return state().contacts; },
    async subscribers() { return state().subs; },
  };
}

export const api = DEMO ? demoApi() : supabaseApi();
