# Mettre Horology Calendar en ligne

Compter environ 45 minutes la première fois. Tout est gratuit, sauf le nom de domaine.
Idéalement, créer les comptes avec une adresse de 289 Consulting, pour que le site appartienne à l'agence.

---

## Étape 1 — Supabase (la base de données)

1. Aller sur **supabase.com** → *Start your project* → se connecter (avec GitHub, c'est le plus simple).
2. *New project* (si l'organisation « 289 Consulting » existe déjà, créer le projet dedans : le plan gratuit permet 2 projets actifs par organisation) :
   - Name : `horology-calendar`
   - Database password : en générer un et **le garder** (gestionnaire de mots de passe)
   - Region : **Central EU (Zurich)** — les données restent en Suisse
   - *Create new project*, attendre 1 à 2 minutes.
3. Menu de gauche → **SQL Editor** → *New query* :
   - ouvrir le fichier `supabase/schema.sql`, tout copier, coller, cliquer **Run** → « Success ».
   - *New query* à nouveau, même chose avec `supabase/seed.sql` → les 76 événements sont chargés.
4. **Fermer les inscriptions publiques** : *Authentication* → *Sign In / Providers* → décocher **Allow new users to sign up** → *Save*.
5. **Créer ton compte admin** : *Authentication* → *Users* → *Add user* → *Create new user* :
   - ton email + un mot de passe solide, cocher *Auto Confirm User* → *Create user*.
   - cliquer sur ton utilisateur et copier son **UID** (une longue suite de chiffres et lettres).
   - *SQL Editor* → *New query* → coller la ligne suivante en remplaçant l'UID, puis **Run** :
     ```sql
     insert into public.admins (user_id) values ('COLLER-L-UID-ICI');
     ```
   - Pour ajouter quelqu'un d'autre plus tard (Marine, par exemple), refaire ces trois points avec son email.
6. Récupérer les clés : *Project Settings* → *API* (ou *Data API*) :
   - **Project URL** → c'est `VITE_SUPABASE_URL`
   - **anon public** key → c'est `VITE_SUPABASE_ANON_KEY`
   - ⚠️ ne jamais utiliser ni partager la clé *service_role*.

## Étape 2 — GitHub (le code)

1. Créer un compte sur **github.com** (ou une organisation « 289 Consulting »).
2. *New repository* → nom `horology-calendar` → **Public** (le site est open source) → *Create repository*.
3. Sur la page du dépôt vide : *uploading an existing file* → glisser **tout le contenu** du dossier `horology-calendar` (pas le dossier lui-même, et sans `node_modules` s'il existe) → *Commit changes*.

4. **Empêcher la mise en pause de la base** (Supabase met en pause les projets gratuits après une semaine sans activité) : dans le dépôt GitHub → *Settings* → *Secrets and variables* → *Actions* → *New repository secret*, ajouter `SUPABASE_URL` et `SUPABASE_ANON_KEY` (mêmes valeurs qu'à l'étape 1.6). Le fichier `.github/workflows/keep-alive.yml` fait alors une petite lecture chaque matin. Pour vérifier : onglet *Actions* → *Keep database awake* → *Run workflow*.

## Étape 3 — Vercel (l'hébergement)

1. Aller sur **vercel.com** → *Sign up* → *Continue with GitHub*.
2. *Add New…* → *Project* → choisir `horology-calendar` → *Import*.
3. Vercel reconnaît Vite tout seul. Ouvrir **Environment Variables** et ajouter :

   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | la Project URL de Supabase |
   | `VITE_SUPABASE_ANON_KEY` | la clé anon public |
   | `VITE_SITE_URL` | l'adresse du site (provisoirement celle donnée par Vercel, ex. `https://horology-calendar.vercel.app`) |
   | `VITE_CONTACT_EMAIL` | l'email de contact public |
   | `VITE_REPO_URL` | l'adresse du dépôt GitHub |

4. **Deploy**. Après une minute, le site est en ligne à l'adresse `….vercel.app`.
5. Tester : ouvrir le site, puis `/admin`, se connecter avec ton compte.

## Étape 4 — Le nom de domaine (quand le nom est validé)

1. Acheter le domaine (ex. chez Infomaniak pour un `.ch`/`.com`, ou directement dans Vercel → *Domains*).
2. Vercel → projet → *Settings* → *Domains* → ajouter le domaine et suivre les indications (deux lignes DNS à copier chez le vendeur du domaine).
3. Mettre à jour `VITE_SITE_URL` avec la nouvelle adresse → *Deployments* → *Redeploy*.
4. Déclarer le site dans **Google Search Console** et y soumettre `https://ton-domaine/sitemap.xml`.

---

## Au quotidien

- **Contenu** (événements, validation, badge Verified, masquer) : `/admin`, rien d'autre à faire, c'est en ligne immédiatement.
- **Newsletter** : dans `/admin`, bouton *Download newsletter list (CSV)* → importer dans Mailchimp pour l'envoi mensuel.
- **Modifier le design ou ajouter une fonction** : modifier les fichiers sur GitHub (ou me demander les fichiers modifiés et les remplacer). Chaque modification sur GitHub met le site à jour automatiquement en 1 à 2 minutes. En cas de problème : Vercel → *Deployments* → choisir la version précédente → *Promote to Production* (retour en arrière en un clic).
- **Ajouter des photos à un événement** : envoyer l'image dans `public/images/` sur GitHub, puis dans Supabase → *Table Editor* → `events` → remplir `image_url` (`/images/nom.jpg`), `image_credit` et `image_alt`.

## À compléter avant le lancement

- Page **Legal** : forme juridique et adresse de 289 Consulting (texte `[legal form and registered address]` dans `src/app.js`, fonction `pageLegal`).
- Vérifier avec Marine le texte légal et la mention de responsabilité.
