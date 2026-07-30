# Deploying to Oracle Cloud (Free VPS)

This runs your whole app — backend and frontend — on one free-forever Oracle Cloud
server, using plain SQLite (no Turso, no Render needed). Total cost: **$0/month**.

You'll be doing real server administration here — it's more hands-on than Render, but
you get full control and nothing ever sleeps or wakes up slowly.

---

## Part 1 — Create your Oracle Cloud account

1. Go to [oracle.com/cloud/free](https://www.oracle.com/cloud/free/) and sign up
2. You'll need a phone number and a credit card for identity verification (you will
   not be charged unless you manually choose to upgrade — see our earlier discussion)
3. Complete verification and log in to the **OCI Console**

If your account gets flagged during signup (a known Oracle quirk), their support chat
can usually resolve it — don't panic if it takes a retry or two.

---

## Part 2 — Create your VM instance

1. In the OCI Console, go to **Compute** → **Instances** → **Create Instance**
2. **Name**: `grievance-tracker` (or anything you like)
3. **Image and shape**:
   - Click **Edit** next to "Image and shape"
   - Choose **Ubuntu** (22.04 or newer) as the image
   - Under **Shape**, select **Ampere (Arm-based)** → `VM.Standard.A1.Flex`
   - Set **2 OCPUs** and **12 GB memory** (or whatever your current Always Free
     allowance shows — check the "Always Free eligible" label to be sure you're not
     provisioning anything paid)
4. **Networking**: Leave defaults (create a new VCN if prompted) — just make sure
   **"Assign a public IPv4 address"** is switched **ON**. Without this, your server
   won't be reachable from the internet.
5. **Add SSH keys**: Select "Generate a key pair for me" and **download both the
   public and private key files** — you'll need the private key to connect. Keep it
   safe; anyone with it can access your server.
6. **Boot volume**: Toggle "Specify a custom boot volume size" and set it to **200 GB**
   to use your full free storage allowance (optional — 50GB default is already plenty
   for this app, but there's no cost difference within Always Free limits)
7. Click **Create**. Wait a minute or two for it to reach "Running" state.
8. Copy the instance's **Public IP address** from the instance details page — you'll
   need it for everything below.

---

## Part 3 — Open the firewall (the step everyone forgets)

Oracle blocks incoming traffic by default at the **cloud network level**, separately
from the server's own firewall. You need to open ports here too, or nothing will be
reachable no matter what you do on the server itself.

1. On your instance's details page, click the **subnet** link under "Primary VNIC"
2. Click the **default security list**
3. Click **Add Ingress Rules**, and add two rules:
   - Source CIDR `0.0.0.0/0`, IP Protocol `TCP`, Destination Port `80` (HTTP)
   - Source CIDR `0.0.0.0/0`, IP Protocol `TCP`, Destination Port `443` (HTTPS)
4. Save

(Port 22 for SSH is usually open by default — check it's there too.)

---

## Part 4 — Connect and set up the server

Open a terminal on your own computer and connect via SSH (replace with your actual key
path and IP):

```bash
chmod 400 /path/to/your-downloaded-key.key
ssh -i /path/to/your-downloaded-key.key ubuntu@YOUR_PUBLIC_IP
```

Once connected, update the system and install what you need:

```bash
sudo apt update && sudo apt upgrade -y

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx

# PM2 — keeps your backend running permanently, restarts it if it crashes
sudo npm install -g pm2

# Confirm versions
node -v
npm -v
```

---

## Part 5 — Get your code onto the server

**Option A — from GitHub (recommended, makes future updates easy):**
```bash
git clone https://github.com/YOUR_USERNAME/grievance-tracker-app.git
cd grievance-tracker-app
```

**Option B — upload the zip directly from your computer** (run this on your *own*
machine, not the server):
```bash
scp -i /path/to/your-key.key grievance-tracker-app.zip ubuntu@YOUR_PUBLIC_IP:~
```
Then back on the server:
```bash
sudo apt install -y unzip
unzip grievance-tracker-app.zip
cd grievance-tracker-app
```

---

## Part 6 — Set up the backend

```bash
cd ~/grievance-tracker-app/backend
npm install
cp .env.example .env
nano .env
```

In the `.env` file, set:
```
PORT=4000
ANTHROPIC_API_KEY=your_key_here        # optional
CORS_ORIGIN=http://YOUR_PUBLIC_IP      # or https://yourdomain.com once you have one
```
Leave `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, and `DATA_DIR` **blank** — the app will
automatically use a local SQLite file right there in the `backend` folder, which lives
permanently on your VPS's own disk.

Save and exit (`Ctrl+O`, Enter, `Ctrl+X` in nano).

**If `npm install` fails on native modules** (rare, but possible on ARM):
```bash
sudo apt install -y build-essential python3
npm install
```

Test it runs:
```bash
node server.js
```
You should see `Grievance Tracker API running on http://localhost:4000`. Press `Ctrl+C`
to stop — we'll let PM2 manage it properly next.

---

## Part 7 — Set up the frontend

```bash
cd ~/grievance-tracker-app/frontend
npm install
cp .env.example .env
nano .env
```
Set:
```
VITE_API_URL=http://YOUR_PUBLIC_IP/api
```
(Note: since Nginx will proxy `/api` on the same domain, this points at the same
server — no separate backend URL needed.)

Build it:
```bash
npm run build
```
This creates a `dist` folder with the production-ready frontend files.

---

## Part 8 — Start the backend with PM2

```bash
cd ~/grievance-tracker-app
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup
```
The last command prints a `sudo env PATH=...` line — copy and run that exact line it
gives you. This makes PM2 (and your app) start automatically if the server reboots.

Check it's running:
```bash
pm2 status
pm2 logs grievance-tracker-backend
```

---

## Part 9 — Set up Nginx

```bash
sudo cp ~/grievance-tracker-app/deploy/nginx.conf.example /etc/nginx/sites-available/grievance-tracker
sudo nano /etc/nginx/sites-available/grievance-tracker
```
Replace `YOUR_DOMAIN_OR_IP` with your public IP (or domain, if you have one), and
double-check the `root` path matches where you actually cloned the project (adjust
`/home/ubuntu/grievance-tracker-app/frontend/dist` if your folder name differs).

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/grievance-tracker /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

`nginx -t` should say "syntax is ok" / "test is successful" — if not, fix whatever it
flags before restarting.

---

## Part 10 — Test it

Open `http://YOUR_PUBLIC_IP` in a browser. You should see the portal, fully working —
submit a test grievance and confirm it goes through.

---

## Part 11 — Add HTTPS (optional but recommended)

If you have a domain name pointed at your server's IP (an A record), you can get free
HTTPS with Let's Encrypt:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```
Follow the prompts. Certbot automatically edits your Nginx config and sets up
auto-renewal. Afterwards, update `CORS_ORIGIN` in `backend/.env` and `VITE_API_URL` in
`frontend/.env` to use `https://yourdomain.com`, rebuild the frontend (`npm run build`),
and restart the backend (`pm2 restart grievance-tracker-backend`).

---

## Part 12 — Back up your database automatically

```bash
chmod +x ~/grievance-tracker-app/deploy/backup.sh
crontab -e
```
Add this line to run a backup every day at 2 AM:
```
0 2 * * * /home/ubuntu/grievance-tracker-app/deploy/backup.sh >> /home/ubuntu/backup.log 2>&1
```
This keeps the last 14 daily backups in `~/db-backups`. Since Oracle's free tier has no
automatic backups (unlike Render's persistent disk), this step matters — don't skip it.

For extra safety, periodically download a backup to your own computer too:
```bash
scp -i /path/to/your-key.key ubuntu@YOUR_PUBLIC_IP:~/db-backups/grievances-*.db ./
```

---

## Updating your app later

```bash
cd ~/grievance-tracker-app
git pull                              # if you used the GitHub method
cd backend && npm install && cd ..
cd frontend && npm install && npm run build && cd ..
pm2 restart grievance-tracker-backend
```

---

## Quick troubleshooting

| Problem | Likely cause |
|---|---|
| Can't reach the site at all | Check Part 3 — the Oracle-level firewall (security list) is the #1 cause |
| "502 Bad Gateway" in browser | Backend isn't running — check `pm2 status` and `pm2 logs` |
| Nginx won't restart | Run `sudo nginx -t` to see the exact config error |
| Changes not showing after `git pull` | Did you rebuild the frontend (`npm run build`) and restart PM2? |
| Server unreachable after a reboot | Did you run `pm2 startup` and follow its printed instructions? |
