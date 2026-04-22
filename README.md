# Publer AI Scheduler

AI-powered Google Business Post scheduler. Enter client/property info → Claude AI writes the posts → schedules them directly in Publer.

## Stack

- **Next.js 14** (App Router)
- **Anthropic SDK** (claude-sonnet-4, server-side only)
- **Publer API** (proxied through Next.js API routes)
- Deployable to **Vercel** in one command

---

## Local setup

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/publer-scheduler.git
cd publer-scheduler
npm install
```

### 2. Set environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Get your key at [console.anthropic.com](https://console.anthropic.com).

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

### Option A: Vercel CLI (fastest)

```bash
npm i -g vercel
vercel
```

Follow the prompts. Then add your environment variable:

```bash
vercel env add ANTHROPIC_API_KEY
```

### Option B: GitHub + Vercel dashboard

1. Push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/publer-scheduler.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) → Import project → select your repo

3. In Vercel project settings → Environment Variables → add:
   - `ANTHROPIC_API_KEY` = your Anthropic key

4. Deploy — done.

---

## How to use

1. **Publer connection** — Enter your Publer API key (Settings → API in Publer) and the Google Business profile ID (found in the URL when you click the profile in Connected Accounts)

2. **Client info** — Property name, city, description, any promos, and the CTA destination URL

3. **Post settings** — Number of posts, start date, posting time, tone, and CTA button type. Posts are spread evenly across 28 days from the start date.

4. **Photos** — Paste Dropbox share links. They're auto-converted to direct download URLs. If fewer photos than posts, they cycle.

5. **Generate** → Review posts → **Schedule all in Publer**

---

## Security notes

- Your Anthropic API key lives only in `.env.local` / Vercel env vars — never in the browser
- Publer API calls are proxied through `/api/schedule-posts` so the key stays server-side
- `.env.local` is in `.gitignore` — it will never be committed

---

## Project structure

```
src/
  app/
    api/
      generate-posts/route.ts   # Calls Anthropic API (server-side)
      schedule-posts/route.ts   # Proxies to Publer API
    globals.css
    layout.tsx
    page.tsx                    # Main UI
    page.module.css
```
