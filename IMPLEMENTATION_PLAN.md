# XtraShield — Live Deployment & Universal API Key Plan

## Executive Summary

Make XtraShield production-ready using **100% free services** for hosting, database, and external APIs. Add a **Universal API Key** system (like Emergent) so users can access all security scanning features with a single key — no need to sign up for HIBP, VirusTotal, etc. separately.

---

## Phase 1: Bug Fixes (COMPLETED)

Fixed 10 critical/high-severity bugs:

| Bug | Severity | Fix |
|-----|----------|-----|
| HIBP API key mutated on every request (race condition) | CRITICAL | Removed `process.env` mutation; pass key as parameter |
| CORS wildcard `*` on scan upload endpoint | CRITICAL | Origin allowlist with fallback |
| `NEXT_PUBLIC_` prefix leaks API keys to client | HIGH | Removed `NEXT_PUBLIC_` from HIBP/VirusTotal env vars |
| `alertsCreated` always returns 0 | MEDIUM | Track count with `alertsCreatedCount` variable |
| SecurityScoreRing division-by-zero animation | LOW | Fixed with normalized step-based animation |
| Duplicate `getRiskLevel` in network page | LOW | Removed duplicate function |
| Dashboard sequential API calls | LOW | Parallelized with `Promise.all()` |
| Scan history unbounded query | MEDIUM | Added `take: 100` limit |
| Missing cascade deletes in schema | LOW | Added `onDelete: Cascade` to all relations |
| Password breach proxy URL leak | MEDIUM | Removed `NEXT_PUBLIC_VIRUSTOTAL_API_KEY` fallback |

---

## Phase 2: Free Services Stack

### Hosting: Vercel (Hobby Plan — Free)
- **Deploy:** `git push` → automatic build + deploy
- **Limits:** 100GB bandwidth, 100K function invocations/month, 10s function timeout
- **Domain:** Free `*.vercel.app` subdomain + custom domain support
- **Cron:** Up to 100 cron jobs per project (for dark web monitoring)

### Database: Turso (Free Tier)
- **500 databases free**, 9GB storage, 1B row reads/month
- Serverless SQLite — works with Prisma via `@libsql/client`
- Global edge replication for low latency
- **Setup:**
  ```bash
  turso db create xtrashield
  turso db tokens create xtrashield
  ```
  Set env vars: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
  Replace `better-sqlite3` adapter with `@prisma/adapter-libsql`

### External APIs (All Free)

| Service | Free Tier | API Key Required | Used For |
|---------|-----------|------------------|----------|
| **PwnedPasswords** | Unlimited | No | Password breach checks (k-anonymity) |
| **VirusTotal Public** | 500 req/day, 4 req/min | Yes (free signup) | Phishing URL detection |
| **HIBP** | Limited mock mode | No (mock fallback built-in) | Email breach checks |
| **ipapi.co** | 1K req/day | No | IP geolocation/reputation |
| **Emergent Universal Key** | Pay-per-use (~$0.01/750 words) | Yes ($10 min) | LLM-powered threat analysis (future) |

---

## Phase 3: Universal API Key System

### Concept
Like Emergent's Universal Key, provide users with a **single XtraShield API key** (`xtra_xxxx`) that:
1. Authenticates them to all XtraShield endpoints
2. Proxies external API calls (HIBP, VirusTotal) through our backend
3. Manages API quotas centrally — users don't need individual HIBP/VT accounts
4. Enables usage tracking and rate limiting per user

### Architecture

```
User → XtraShield API Key → Backend Proxy → External APIs
         (xtra_xxx)           (our server)    (HIBP, VT, etc.)
```

### Implementation

#### 3.1 API Key Already Exists
The `ApiKey` model and `generateApiKey()` function are already implemented. Keys are generated on registration and follow the `xtra_` prefix format.

#### 3.2 Proxy Layer for External APIs
Create a unified proxy system that handles:
- **Rate limiting** per user (e.g., 100 req/day for email scans)
- **API key management** — server holds HIBP/VT keys, users don't need them
- **Mock fallback** when no real API key is configured
- **Usage tracking** — log every external API call per user

#### 3.3 New API Routes

| Route | Purpose |
|-------|---------|
| `POST /api/proxy/breach/email` | Proxied HIBP email check (uses server's key) |
| `POST /api/proxy/breach/password` | Proxied PwnedPasswords check |
| `POST /api/proxy/phishing/check` | Proxied VirusTotal URL check |
| `GET /api/user/usage` | User's API usage stats |

#### 3.4 Rate Limiting Strategy
```
FREE plan:  10 email scans/day,  50 password checks/day,  20 phishing checks/day
PRO plan:   100 email scans/day, 500 password checks/day, 200 phishing checks/day
```

---

## Phase 4: Database Migration (SQLite → Turso)

### 4.1 Install Dependencies
```bash
npm install @libsql/client @prisma/adapter-libsql
```

### 4.2 Update Prisma Config
```ts
// prisma.config.ts
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSQL({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
```

### 4.3 Update `src/lib/db.ts`
Replace `PrismaBetterSqlite3` with `PrismaLibSQL` adapter for production, keep SQLite for local dev.

### 4.4 Run Migrations
```bash
npx prisma migrate deploy
```

---

## Phase 5: Vercel Deployment

### 5.1 Environment Variables
```env
# Database (Turso)
TURSO_DATABASE_URL=libsql://xtrashield-[org].turso.io
TURSO_AUTH_TOKEN=eyJ...

# Auth
NEXTAUTH_SECRET=<generated>
NEXTAUTH_URL=https://xtrashield.vercel.app

# External APIs (optional — mock mode works without them)
VIRUSTOTAL_API_KEY=xxxxxxxx
HIBP_API_KEY=xxxxxxxx

# App
NEXT_PUBLIC_APP_URL=https://xtrashield.vercel.app
```

### 5.2 Deployment Steps
```bash
# 1. Push to GitHub
git remote add origin https://github.com/youruser/xtrashield.git
git push -u origin main

# 2. Deploy to Vercel
npx vercel --prod

# 3. Set environment variables in Vercel dashboard
# 4. Run initial migration on Turso
npx prisma migrate deploy
```

### 5.3 Cron Jobs (Dark Web Monitor)
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/darkweb-monitor",
    "schedule": "0 * * * *"
  }]
}
```

---

## Phase 6: Security Hardening

### 6.1 Rate Limiting (Implemented via Middleware)
Use `@upstash/ratelimit` (free tier: 10K req/month) or simple in-memory counter:
```ts
// src/middleware.ts — add rate limit check
```

### 6.2 Input Validation
Add Zod schemas to all API routes that currently accept unvalidated JSON:
- `/api/scan/upload` — validate all fields
- `/api/network/port-scan` — validate host/ports
- `/api/monitored-emails` — already validated ✅

### 6.3 CORS Restriction
Already fixed — now uses origin allowlist instead of `*`.

### 6.4 Environment Variable Cleanup
Remove `NEXT_PUBLIC_` prefixes from all server-side API keys (HIBP, VirusTotal).

---

## Phase 7: Polish & Launch

### 7.1 Remove Demo Credentials
Gate the `admin@xtrashield.io` / `password123` display behind `NODE_ENV !== 'production'`.

### 7.2 Fix Dead Links
Replace `href="#"` in footer with actual URLs.

### 7.3 Add Loading States
Replace "Loading..." text in scanner page with skeleton components.

### 7.4 Settings Page
Wire profile save to actual API endpoint.

### 7.5 Dashboard Quick Actions
Wire "Verify Hashes" and "Export Log" buttons to real functionality.

---

## Cost Summary

| Service | Cost |
|---------|------|
| Vercel Hosting | **Free** (Hobby) |
| Turso Database | **Free** (500 DBs, 9GB) |
| PwnedPasswords API | **Free** (unlimited) |
| VirusTotal API | **Free** (500/day) |
| HIBP API | **Free** (mock mode) / $3.50/mo (real) |
| ipapi.co | **Free** (1K/day) |
| Emergent Universal Key | **~$0.01/750 words** (pay per use) |
| **Total** | **$0 — $3.50/month** |

---

## File Changes Required

### New Files
- `src/app/api/cron/darkweb-monitor/route.ts` — Vercel cron endpoint
- `src/app/api/proxy/breach/email/route.ts` — proxied email breach check
- `src/app/api/proxy/breach/password/route.ts` — proxied password check
- `src/app/api/proxy/phishing/check/route.ts` — proxied phishing check
- `src/app/api/user/usage/route.ts` — usage stats endpoint
- `src/lib/rate-limit.ts` — rate limiting utility

### Modified Files
- `src/lib/db.ts` — Turso adapter support
- `src/lib/breach.ts` — accept server-side API key parameter
- `src/middleware.ts` — add rate limiting + more protected routes
- `prisma/schema.prisma` — already fixed (cascade deletes)
- `package.json` — add `@libsql/client`, `@prisma/adapter-libsql`
- `next.config.ts` — no changes needed
- `src/app/login/page.tsx` — hide demo creds in production
- `src/app/page.tsx` — fix dead footer links

### Removed Files
- None
