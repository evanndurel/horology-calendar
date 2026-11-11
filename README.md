# Horology Calendar

The free, open calendar of watch fairs and events worldwide: trade fairs, collector shows, auctions and watch weeks, each linked to its official source.

An initiative of 289 Consulting. Released under the MIT licence.

## How it works

- **Website**: a single-page app (plain JavaScript, built with [Vite](https://vitejs.dev)). Pages: calendar, agenda, world map, event pages, "Add your event", about, legal, admin.
- **Database**: [Supabase](https://supabase.com) (PostgreSQL). Organisers publish their events directly; the team reviews, verifies, edits or hides them from the admin desk (`/admin`).
- **Hosting**: any static host. [Vercel](https://vercel.com) is configured in `vercel.json`.

Security is enforced in the database (`supabase/schema.sql`): visitors can only read visible listings, add a new listing (always flagged as an unverified organiser listing) and subscribe to the newsletter. Only accounts listed in the `admins` table can edit, verify, hide or read contact emails.

## Run locally

```bash
npm install
cp .env.example .env   # fill in your Supabase keys (optional)
npm run dev
```

Without Supabase keys the site runs in **demo mode** from `src/seed.json`; changes are kept in your browser only. Demo admin login: `demo@horologycalendar.test` / `demo`.

## Project structure

```
index.html              page shell, meta tags
src/app.js              all pages and interactions
src/api.js              database access (Supabase, or demo mode)
src/style.css           styles
src/map.json            world map outlines (Natural Earth, public domain)
src/seed.json           initial listings (demo mode)
public/                 images, favicon, share image; sitemap.xml and robots.txt are generated at build
scripts/sitemap.mjs     builds sitemap.xml from the database before each deploy
supabase/schema.sql     tables, security rules
supabase/seed.sql       initial listings for the database
```

## Environment variables

| Name | What |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon public key (safe to expose) |
| `VITE_SITE_URL` | Public address, e.g. `https://www.example.com` |
| `VITE_CONTACT_EMAIL` | Contact email shown on About and Legal |
| `VITE_REPO_URL` | Link to this repository (footer "Open source") |
