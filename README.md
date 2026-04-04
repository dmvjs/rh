# Neighborhood Portal

A self-hosted neighborhood web platform: classifieds, local news, weather, transit, property data, wildlife sightings, and more — all scoped to a specific geographic area. Built on Cloudflare Workers + D1 + KV (API) and Vite + S3 + CloudFront (frontend).

This repo was built for Ridgelea Hills in Falls Church, VA. Every geographic reference, address list, and coordinate is configurable — see [Adapting for Your Neighborhood](#adapting-for-your-neighborhood).

---

## Table of Contents

- [Architecture](#architecture)
- [Features](#features)
  - [Classifieds](#classifieds-listings)
  - [Authentication](#authentication)
  - [Admin Panel](#admin-panel)
  - [News](#news)
  - [Weather](#weather)
  - [Transit](#transit)
  - [Government](#government)
  - [Property Data](#property-data)
  - [Water Quality](#water-quality)
  - [Parks](#parks)
  - [Wildlife](#wildlife)
  - [Ads](#ads)
  - [Alerts](#alerts)
  - [Image Uploads](#image-uploads)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Environment Variables & Secrets](#environment-variables--secrets)
- [Database](#database)
- [Deploying](#deploying)
- [Adapting for Your Neighborhood](#adapting-for-your-neighborhood)
- [Authentication & User Model](#authentication--user-model)
- [Ads](#ads)

---

## Architecture

```
web/          Vite multi-page app (vanilla JS, no framework)
              Built to web/dist/, deployed to S3 + CloudFront

api/          Cloudflare Worker (Hono framework)
              Backed by D1 (SQLite) and KV (cache)
              Deployed via Wrangler
```

The frontend proxies `/api/*` to the Worker in development. In production, the Worker is on a separate subdomain and the frontend calls it directly via `VITE_API_URL`.

---

## Features

### Classifieds (listings)

Members can post in six categories: **For Sale**, **Free**, **Services**, **Lost & Found**, **Events**, and **Recommendations**. Listings support images (uploaded directly to S3 via presigned URLs), a contact email/phone, and optional price. Posts expire after 30 days. Owners can edit or delete their own posts; moderators can remove any post.

**Routes:** `GET/POST /api/listings`, `PATCH/DELETE /api/listings/:id`
**Auth:** Required for all write operations; read is public.

---

### Authentication

A full email-based auth system with registration gating:

1. User registers with name, address, and email.
2. A verification email is sent (via Resend). The link is valid for 24 hours.
3. After verification, the account is either auto-approved (if the email is on the trusted list) or held for admin review.
4. A Formspree notification fires to the admin email when a new account awaits approval.
5. Approved users receive a JWT (30-day expiry, HS256) stored in `localStorage`.

Password reset is also supported: `POST /api/auth/reset-request` sends a 1-hour reset link; `POST /api/auth/reset` applies it.

**Email privacy:** Emails are never stored in plaintext. Only a SHA-256 hash of the normalized email is stored in the database.

**Routes:** `/api/auth/register`, `/verify`, `/login`, `/logout`, `/me`, `/reset-request`, `/reset`, `/me` (DELETE)

---

### Admin Panel

Accessible to users with role `moderator` or `admin`. Features:

- **User queue:** Approve or reject pending registrations. Approving a user triggers background geocoding of their address via Nominatim (OpenStreetMap).
- **Role management:** Promote users to `moderator` or `admin` (admin only).
- **Listing moderation:** Remove any listing.
- **Trusted email list:** Add email addresses that skip the manual approval step (stored as hashes).
- **Ad management:** Create, toggle, and delete ads by size.

**Routes:** `/api/admin/*`

---

### News

Aggregates regional and local RSS feeds. Two feeds are available:

- **Regional** (`GET /api/news`): Pulls from WTOP, WAMU, NBC Washington, Fox 5, WUSA9, Fairfax Times, FFXNow, InsideNova, Annandale Today, and others. Filters by area keywords, deduplicates by title, caps at 3 articles per domain, returns the top 9.
- **Local** (`GET /api/news/local`): Narrower keyword filter (neighborhood names and specific streets). Also includes a local incident summary from the Fairfax County Police crime CSV.

Both feeds are KV-cached for 20 minutes. A Worker cron job re-warms both caches every 15 minutes.

**No external API key required.**

---

### Weather

A full weather dashboard at `/weather/` drawing from multiple sources simultaneously:

| Source | Data |
|---|---|
| Open-Meteo | Current conditions, 24-hour hourly, 7-day daily |
| Open-Meteo (3 models) | Multi-model consensus for 3-day temperature and precipitation |
| aviation weather | METAR from nearby airports (KDCA, KIAD) |
| NWS api.weather.gov | 6-period forecast text + active weather alerts |
| Open-Meteo Air Quality | AQI, PM2.5, PM10, ozone, NO2 |
| NWS Area Forecast Discussion | Latest meteorologist discussion text |

KV-cached 15 minutes. **No API key required** — all sources are free.

---

### Transit

Real-time Metro and bus data at `/transit/`:

- **Metro rail arrivals** for the two nearest stations (configurable stop IDs)
- **Metro incidents** affecting those lines
- **Bus arrivals** for the 6 nearest stops within 700m of the neighborhood center
- **Bus incidents** for routes serving those stops

KV-cached 60 seconds (real-time data).

**Requires:** `WMATA_KEY` — free developer key from [developer.wmata.com](https://developer.wmata.com).

> If your neighborhood is not in the DC metro area, replace or remove this route. The WMATA API is specific to WMATA.

---

### Government

Lists elected officials as a hardcoded static array in `api/src/routes/government.js`. Update the `OFFICIALS` array after each election cycle. KV-cached 12 hours. **No API key required.**

---

### Property Data

Pulls from Fairfax County's public ArcGIS/REST services — no API key required:

- **Home sales** (last 12 months, >$50k)
- **Building permits** (last 12 months, excluding routine mechanical/electrical/plumbing)
- **Tax assessments**
- **Zoning cases** (last 3 years)

The route fetches all parcel PINs within the neighborhood first, then enriches every record with a street address. KV-cached 1 hour.

**Fairfax County specific.** Other counties may have ArcGIS endpoints with similar data — see [Adapting for Your Neighborhood](#adapting-for-your-neighborhood).

---

### Water Quality

Aggregates five data sources for local water conditions:

| Source | Data |
|---|---|
| USGS NWIS | Stream gauge readings (discharge, stage, temperature) for nearby creeks |
| EPA ATTAINS | Water quality assessments for the local HUC8 watershed |
| USGS WaterWatch | Flood stage thresholds for each gauge |
| NWS Alerts | Active flood and hydrology alerts for the county |
| EPA SDWIS | Drinking water violation history for the local water utility |

Includes 30-day historical gauge data for sparkline charts. KV-cached 15 minutes. **No API key required.**

---

### Parks

Queries the **Overpass API** (OpenStreetMap) for parks, playgrounds, sports fields, and recreation areas within a configurable radius. Returns each feature with coordinates, hours, amenities (dogs, fees, wheelchair access, lighting), and website links.

The frontend renders a **Leaflet.js** map with numbered markers and a matching numbered list. Distance from the neighborhood center is computed client-side (Haversine). Directions links deep-link to Apple Maps on iOS and Google Maps elsewhere.

KV-cached 24 hours. **No API key required.**

---

### Wildlife

Queries the **iNaturalist API** for research-grade observations within a configurable radius. Results are organized into six taxonomic groups: Plants & Trees, Mammals, Insects, Reptiles & Amphibians, Fungi, and Birds. Each group shows up to 16 unique species with photos.

KV-cached 6 hours. **No API key required.**

---

### Ads

A simple ad-serving system. Ads are stored in D1 with size constraints (`970x66`, `160x600`, `320x50`, `300x250`). Active ads are served publicly at `GET /api/ads`. Ads are shown only to logged-out visitors; members see no ads. Managed via the admin panel.

---

### Alerts

Aggregates three Fairfax County government RSS feeds (emergency management, public works, parks) into a single feed. Filters items older than 14 days and deduplicates by title. KV-cached 15 minutes. **No API key required** (Fairfax County specific — swap the feed URLs for your jurisdiction).

---

### Image Uploads

Listing photos are uploaded directly from the browser to S3 using presigned PUT URLs. The Worker generates the presigned URL (AWS Signature V4, computed with Web Crypto — no SDK), the browser uploads directly, and the key is stored in the listing record. Images are served via a CloudFront distribution.

**Requires:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET`

---

## Prerequisites

- Node.js 18+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm install -g wrangler`)
- A Cloudflare account (free tier works)
- AWS account with an S3 bucket and CloudFront distribution for the frontend and image uploads
- A [Resend](https://resend.com) account for transactional email
- A [Formspree](https://formspree.io) endpoint for admin notifications

---

## Local Development

```bash
# Install dependencies
npm install

# Start the API Worker locally (port 8787)
cd api && npx wrangler dev

# In another terminal, start the frontend dev server (port 5173)
cd web && npm run dev
```

The Vite dev server proxies `/api/*` to `http://localhost:8787`. Open `http://localhost:5173`.

For local D1, run migrations first:

```bash
cd api && npx wrangler d1 migrations apply rh --local
```

Seed the first admin account:

```bash
ADMIN_EMAIL=you@example.com \
ADMIN_PASSWORD=yourpassword \
ADMIN_NAME="Your Name" \
ADMIN_ADDRESS="123 Main St" \
node api/scripts/seed-admin.js
```

This prints a `wrangler d1 execute` command to run — it does not execute anything itself.

---

## Environment Variables & Secrets

### Worker secrets (set via `wrangler secret put <NAME>`)

| Secret | Required | Description |
|---|---|---|
| `JWT_SECRET` | Yes | Random string used to sign JWTs |
| `RESEND_API_KEY` | Yes | Resend API key for transactional email |
| `FORMSPREE_URL` | Yes | Formspree POST endpoint for admin notifications |
| `AWS_ACCESS_KEY_ID` | Yes | AWS key for S3 presigned URLs |
| `AWS_SECRET_ACCESS_KEY` | Yes | AWS secret for S3 presigned URLs |
| `AWS_REGION` | Yes | AWS region (e.g. `us-east-1`) |
| `S3_BUCKET` | Yes | S3 bucket name for listing images |
| `WMATA_KEY` | If using transit | WMATA developer API key |
| `TOMTOM_KEY` | If using traffic incidents | Free key from [developer.tomtom.com](https://developer.tomtom.com) — 2,500 req/day on free tier |

### Worker vars (`api/wrangler.toml`)

| Var | Description |
|---|---|
| `WEB_ORIGIN` | Frontend URL (e.g. `https://yourdomain.com`) — used for CORS and email links |

### Frontend build vars (`.env` file in `web/`)

| Var | Description |
|---|---|
| `VITE_API_URL` | Full API URL in production (e.g. `https://rh-api.yourdomain.workers.dev`). Empty in dev (uses proxy). |
| `VITE_IMAGES_BASE_URL` | CloudFront or S3 base URL for listing images (e.g. `https://d1234abcd.cloudfront.net`) |

---

## Database

The schema is managed via numbered migrations in `api/migrations/`. Apply them with:

```bash
# Local
npx wrangler d1 migrations apply rh --local

# Production
npx wrangler d1 migrations apply rh --remote
```

**Final schema:**

| Table | Key columns |
|---|---|
| `users` | `id`, `name`, `email_hash`, `password_hash`, `address`, `approved`, `email_verified`, `role` (`user`/`moderator`/`admin`), `lat`, `lng` |
| `listings` | `id`, `user_id`, `category`, `title`, `body`, `price` (cents), `images` (JSON array of S3 keys), `contact_email`, `contact_phone`, `active`, `expires_at` |
| `trusted_emails` | `id`, `email_hash`, `address` — auto-approves matching registrations |
| `verification_tokens` | `id`, `user_id`, `token`, `created_at` — 24h TTL enforced in application code |
| `password_reset_tokens` | `id`, `user_id`, `token`, `created_at` — 1h TTL enforced in application code |
| `ads` | `id`, `size`, `image_url`, `link_url`, `active` |

---

## Deploying

```bash
bash deploy.sh
```

This runs five steps in order (exits on any failure):

1. Apply pending D1 migrations to production
2. Deploy the Worker (`wrangler deploy`)
3. Build the frontend (`vite build`)
4. Sync `web/dist/` to S3 (`aws s3 sync --delete`)
5. Invalidate the CloudFront distribution cache

The S3 sync and CloudFront invalidation use the AWS CLI — ensure it is configured with credentials that have the necessary permissions before running.

---

## Adapting for Your Neighborhood

The following files contain location-specific values that need to be updated:

### `wrangler.toml`

Before deploying, update these fields in `api/wrangler.toml`:

- `name` — your Worker's name (determines the `*.workers.dev` subdomain)
- `d1_databases[0].database_name` and `database_id` — create a new D1 database with `wrangler d1 create <name>` and paste the returned ID
- `kv_namespaces[0].id` — create a new KV namespace with `wrangler kv namespace create CACHE` and paste the returned ID

### Coordinates

All routes use a hardcoded `LAT`/`LNG` center point. Search for `38.8398` and `-77.2504` across `api/src/routes/` and update every occurrence to your neighborhood's center.

| File | What to update |
|---|---|
| `api/src/routes/weather.js` | `LAT`, `LNG` |
| `api/src/routes/transit.js` | `LAT`, `LNG`, WMATA station stop IDs |
| `api/src/routes/property.js` | `LAT`, `LNG`, ArcGIS street name filter list |
| `api/src/routes/water.js` | `LAT`, `LNG`, USGS gauge site IDs, NWS county zone |
| `api/src/routes/parks.js` | `LAT`, `LNG`, search radius |
| `api/src/routes/wildlife.js` | `LAT`, `LNG`, search radius |
| `api/src/routes/alerts.js` | RSS feed URLs (Fairfax County specific) |
| `api/src/routes/news.js` | `AREA_RE`/`LOCAL_RE` regexes, feed URLs, police CSV URL |
| `api/src/routes/government.js` | `OFFICIALS` array |

### Address list

`api/src/db/addresses.js` exports a hardcoded array of valid neighborhood street addresses used to validate registrations and flag unfamiliar addresses in admin notifications. Replace this with your neighborhood's streets.

The same list is mirrored in `web/src/addresses.js` with coordinates for frontend use (registration autocomplete, map features). Update both files.

### Property data

`api/src/routes/property.js` queries Fairfax County ArcGIS endpoints. If your county provides ArcGIS REST services, update the endpoint URLs and field name mappings. If it doesn't, remove or replace this route.

### Transit

`api/src/routes/transit.js` uses the WMATA API. If your neighborhood is served by a different transit agency, replace this route entirely with that agency's API. If there is no transit, remove the route and the `/transit/` page.

### Water

USGS NWIS and EPA ATTAINS are nationwide — update the gauge site IDs (`GAUGES` array) to the streams nearest your neighborhood. The NWS flood zone and county zone identifiers (`VAC059`) need to match your county in NWS's zone system.

### News

Update the RSS feed list and the `AREA_RE`/`LOCAL_RE` regular expressions in `api/src/routes/news.js` to match your region's news sources and place names. The Fairfax County police CSV URL is specific to that jurisdiction — replace or remove it.

### Frontend copy

Search `web/src/` for "Ridgelea Hills", "Ridglea Hills", and "Falls Church" to find display strings to update.

---

## Authentication & User Model

- **Roles:** `user`, `moderator`, `admin`. Moderators can approve/reject users and remove listings. Admins can additionally manage roles, delete users, and manage ads and trusted emails.
- **Registration gating:** By default all registrations require admin approval after email verification. Add emails to the `trusted_emails` table (via the admin panel) to auto-approve known neighbors.
- **JWT:** Stateless HS256 tokens stored in `localStorage`. Logout only clears the client-side token — there is no server-side revocation.
- **No plaintext emails:** The `email_hash` column stores a SHA-256 hash of the lowercased, trimmed email. Password reset and verification flows use single-use UUID tokens with TTLs enforced in application code.

---

## Ads

Ads are stored in D1 and managed via the admin panel. Four sizes are supported: `970x66` (leaderboard), `160x600` (skyscraper), `320x50` (mobile banner), `300x250` (mobile rectangle). Ads are served only to logged-out visitors. To disable ads entirely, remove the `GET /api/ads` call from `web/src/header.js` and the ad rendering logic.
