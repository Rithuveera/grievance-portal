# Deploying to Render

Two ways to do this — pick based on your budget:

| | Free ($0/month) | Paid (~$7.25/month) |
|---|---|---|
| Backend | Render free Web Service | Render Starter Web Service |
| Database | Turso (free, cloud SQLite) | Local SQLite on a persistent disk |
| Frontend | Render free Static Site | Render free Static Site |
| Tradeoff | ~30–60 second wake-up delay after 15 min of no traffic | Always-on, instant, no delay |
| Data safety | Safe either way — Turso stores it independently of Render | Safe — persistent disk survives restarts |

Both are covered below. Your data is never at risk in either option — the only
difference is the wake-up delay on the free path.

---

## Prerequisites (both options)
- A [Render account](https://render.com) — free to sign up
- Your project pushed to a GitHub (or GitLab/Bitbucket) repository — Render deploys from a connected repo

If you haven't pushed this project to GitHub yet:
```bash
cd grievance-tracker-app
git init
git add .
git commit -m "Initial commit"
```
Then create a repository on GitHub and push it (`git remote add origin ...`, `git push -u origin main`).

---

# Option A — Fully Free (Turso + Render free tier)

## Step 1 — Create your free Turso database

1. Go to [turso.tech](https://turso.tech) and sign up (free, no card needed)
2. Install the Turso CLI and log in — instructions are on their site — or use their
   web dashboard directly if you'd rather not use a CLI
3. Create a database (e.g. named `grievance-tracker`)
4. Get two values you'll need shortly:
   - **Database URL** (starts with `libsql://...`)
   - **Auth Token** (generate one from the database's settings page)

Keep these two values handy for Step 2.

## Step 2 — Deploy the backend as a free Web Service

1. In the Render Dashboard, click **New +** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free**
4. Under **Advanced**, add these environment variables:
   | Key | Value |
   |---|---|
   | `TURSO_DATABASE_URL` | the `libsql://...` URL from Step 1 |
   | `TURSO_AUTH_TOKEN` | the auth token from Step 1 |
   | `ANTHROPIC_API_KEY` | your Anthropic API key (optional — enables AI classification) |
   | `CORS_ORIGIN` | leave blank for now, you'll set this in Step 4 |
5. Click **Create Web Service**

Once live, copy its URL — it looks like `https://grievance-tracker-backend-xxxx.onrender.com`.

## Step 3 — Deploy the frontend as a free Static Site

1. Click **New +** → **Static Site**
2. Connect the same repository
3. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Under **Advanced**, add an environment variable:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | the backend URL from Step 2 |
5. Click **Create Static Site**

Copy this site's URL too — it looks like `https://grievance-tracker-frontend-xxxx.onrender.com`.
This is the link you'll share with people.

## Step 4 — Connect the two: update CORS_ORIGIN

1. Go back to your backend Web Service → **Environment**
2. Set `CORS_ORIGIN` to your frontend's URL from Step 3 (no trailing slash)
3. Save — triggers an automatic redeploy

## Step 5 — Test it

Open your frontend URL. The first load might take up to a minute if the backend was
asleep — that's expected on the free tier. After that, it responds normally until it
goes back to sleep from inactivity again.

**Optional: keep it awake.** If the wake-up delay bothers you, a free service like
[UptimeRobot](https://uptimerobot.com) or [cron-job.org](https://cron-job.org) can ping
your backend's `/api/health` endpoint every 10 minutes, which keeps it from sleeping —
still $0/month, just an extra small setup step.

---

# Option B — Paid, Always-On (~$7.25/month)

No Turso needed — SQLite lives on a persistent disk attached directly to your backend.

## Step 1 — Deploy the backend

1. **New +** → **Web Service**, connect your repo
2. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: **Starter** ($7/month)
3. Environment variables:
   | Key | Value |
   |---|---|
   | `ANTHROPIC_API_KEY` | your key (optional) |
   | `CORS_ORIGIN` | leave blank for now |
   | `DATA_DIR` | `/var/data` |
4. Under **Advanced**, click **Add Disk**: mount path `/var/data`, size 1 GB (~$0.25/month)
5. **Create Web Service**, then copy its URL

## Step 2 — Deploy the frontend
Same as Option A's Step 3 — Static Site, root `frontend`, build `npm install && npm run build`, publish `dist`, `VITE_API_URL` set to your backend URL.

## Step 3 — Update CORS_ORIGIN
Same as Option A's Step 4.

---

## Switching between options later
Both options use the exact same codebase — the only difference is which environment
variables are set (`TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` vs `DATA_DIR`). You can
start free and move to the paid option later (or vice versa) just by changing env vars
and instance type — no code changes needed. Note that data doesn't automatically move
between Turso and a local disk — if you switch, you'd need to export/import your
grievances.

## Keeping your data safe
- **Turso**: your data lives independently of Render entirely — nothing on the Render
  side can wipe it. Turso itself is a managed service with its own durability guarantees.
- **Persistent disk (Option B)**: Render automatically snapshots it every 24 hours,
  kept for at least 7 days.

## Using a custom domain (optional)
If you have a domain (e.g. `grievances.yourmlaoffice.in`), point it at your Static Site:
**Settings** → **Custom Domains**, and follow Render's instructions to add a DNS record.

## Updating your app later
Push new commits to your connected GitHub repo — Render automatically rebuilds and
redeploys both services.
