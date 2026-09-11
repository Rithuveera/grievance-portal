# Seyal360 — One platform One Solution

A full application for tracking public grievances from submission (online or Excel batch
upload from field camps) through MLA review, department resolution, and citizen verification —
with AI-assisted classification and priority scoring.

```
grievance-tracker-app/
├── backend/     Node.js + Express API, SQLite database
└── frontend/    React + Vite + Tailwind portal UI
```

## 1. Prerequisites
- Node.js 18 or newer (needed for built-in `fetch`)
- npm

## 2. Quick start (recommended) — run everything with one command

First-time setup:
```bash
npm install
npm run install:all
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
(On Windows Command Prompt, use `copy` instead of `cp`)

Then every time you want to run the app:
```bash
npm run dev
```

This starts **both** the backend (port 4000) and frontend (port 5173) together in one
terminal, with colored logs labeled `BACKEND` / `FRONTEND`. Open `http://localhost:5173`
when it's ready. Press `Ctrl+C` to stop both.

Skip to Section 6 for the API reference, or Section 5 to deploy this for real use.

---

## 2b. Manual setup (run backend/frontend separately)

Use this if you want more control, e.g. running the backend on a server and frontend
elsewhere, or debugging one side independently.

### Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
- `ANTHROPIC_API_KEY` — get one from https://console.anthropic.com/ to enable AI
  classification of grievance category & priority. Without it, grievances still work,
  just default to "General Administration" / "MEDIUM" priority.
- `CORS_ORIGIN` — the frontend URL allowed to call this API (default `http://localhost:5173`)

Run it:
```bash
npm start          # production
npm run dev        # auto-restarts on file changes
```

The API runs on `http://localhost:4000` by default. A SQLite file `grievances.db` is
created automatically in the `backend/` folder — no separate database server needed.

### Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`. It talks to the backend via `VITE_API_URL`.

## 3. What's included

### Database storage
Locally, the app uses a plain SQLite file — no setup needed, works out of the box. In
production it can run against either:
- **Turso** (free, cloud-hosted, SQLite-compatible) — set `TURSO_DATABASE_URL` and
  `TURSO_AUTH_TOKEN` in `backend/.env`
- **A local file on a persistent disk** — set `DATA_DIR` to the disk's mount path instead

Leave both unset for local development; the code automatically falls back to a local
`grievances.db` file in the `backend` folder. See **[DEPLOY.md](./DEPLOY.md)** (Render)
or **[DEPLOY_ORACLE.md](./DEPLOY_ORACLE.md)** (free Oracle Cloud VPS) for the
full setup of either path.

| Feature | Where |
|---|---|
| Online grievance submission | `Submit` tab |
| Excel batch upload from field camps (preview → validate → import) | `Camp Upload` tab |
| AI category + priority classification | Automatic on submit/import, via Claude API |
| MLA review, department selection, then specific person selection | `MLA Review` tab |
| WhatsApp notify — department contact AND citizen — on forward | `MLA Review` tab, "Approve, Forward & Notify" button |
| Department confirms receipt ("Mark Received") before starting work | `Department` tab |
| Reject invalid/duplicate/out-of-scope grievances with a required reason | `MLA Review` tab, "Reject" button |
| WhatsApp notify to citizen on every status change (Received, In Progress, Resolved) | `Department` tab, automatic on each action |
| Multiple contact people per department (name, designation, phone) | `Departments Master` tab |
| Configurable grievance reference number format (e.g. `MLA/ME/0001`) | `Settings` tab |
| Custom MLA office signature note appended to department WhatsApp messages | `Settings` tab |
| Department status updates (In Progress / Resolved) | `Department` tab |
| Citizen status tracking + confirm/reopen | `Track Status` tab |
| Analytics dashboard (category, status, resolution time) | `Analytics` tab |
| Downloadable Reports — summary, department breakdown, detailed lists | `Reports` tab |

### Reports
A separate **Reports** menu (distinct from Analytics) gives you a clean, filterable
report. Choose any combination of:
- **From / To Date** — filters by submission date
- **Department** — see only grievances assigned to one department
- **Category** — see only grievances of one AI-classified category
- **Status** — see only one specific status (Submitted, Forwarded, Received, In
  Progress, Resolved, Verified & Closed, Reopened, or Rejected)

Nothing is shown until you click **Generate Report** — this keeps the page clean and
makes sure what you're looking at always matches your chosen filters, not a stale
default view. The report includes:
- Summary cards (Total, Resolved, Pending, Rejected, Avg. Resolution Time) for the
  filtered set
- Department-wise breakdown table
- A full grievance list matching your filters, with category, department, status, and
  days taken/pending

Two ways to take it with you:
- **Download CSV** — opens cleanly in Excel/Google Sheets, respects your active filters
- **Print / Save as PDF** — uses your browser's print dialog; choose "Save as PDF" as
  the destination (the sidebar and filter controls are automatically hidden in print)

### Category classification without an API key
If `ANTHROPIC_API_KEY` isn't set (or the API call fails), grievances no longer all
default to "General Administration." A keyword-based fallback checks the grievance
description against common terms for each department — e.g. "pothole," "road" →
Roads & Infrastructure; "water," "pipe," "leak" → Water Supply; "garbage," "drainage" →
Sanitation — and picks the best match. Words like "emergency," "fire," or "accident"
also bump the priority to Urgent automatically. This only applies to the *default* set
of department names — if you rename departments in Departments Master, add matching
keywords, or set up the Anthropic API key for full AI classification instead.

### Reference number format
By default grievances are numbered `MLA/ME/0001`, `MLA/ME/0002`, etc. Change the prefix
anytime in **Settings** — e.g. set it to `MLA/KLM` for a Kollam constituency, and all
grievances submitted after that use the new prefix. Existing reference numbers don't change.

### Multiple people per department
Each department (Water Supply, Roads, etc.) can have several contact people — e.g. an
Assistant Engineer and a Junior Engineer both under Water Supply. Manage this under
**Departments Master** → "Manage Contacts" for each department. When forwarding a
grievance in **MLA Review**, staff first pick the department, then pick the specific
person within that department to notify — the dropdown shows each person's name and
phone number.

### MLA office signature note (department messages only)
Under **Settings**, there's a "Department WhatsApp Signature Note" field — this text is
appended after the grievance details in the WhatsApp message sent to the **department**
contact, formatted like a formal forwarding note (e.g. in Tamil, with the MLA's name,
designation, and a contact number to report back to). It defaults to a ready-to-use
template but you can edit it anytime. **This note is never included in the citizen's
message** — citizens only get the plain status update described above.

### Rejecting invalid grievances
Not every grievance should go to a department — duplicates, out-of-jurisdiction
complaints, spam, or ones missing key information. In **MLA Review**, click **Reject**
instead of forwarding, pick a reason from the dropdown (or choose "Other" and type your
own), and confirm. This:
- Marks the grievance `REJECTED` with the reason permanently logged in its timeline
- Opens WhatsApp to notify the citizen in Tamil, explaining why it wasn't forwarded
- Removes it from the MLA Review queue and from department/analytics "pending" counts,
  while still keeping a full record — nothing is silently deleted

Rejected grievances show up in **Analytics** as their own count, separate from
resolved/pending, so you can track how many complaints are invalid vs. genuinely
unresolved.

### Keeping the citizen informed
The citizen doesn't have to keep checking the tracker — they get a WhatsApp update in
Tamil, automatically opened for staff to send at each meaningful step:
- **Forwarded** — grievance received and forwarded to the department
- **Received** — the department confirms they've seen it
- **In Progress** — work has started
- **Resolved** — the department marks it done

All four use the department's Tamil name (set in **Departments Master**) and the
citizen's name and reference number, pulled automatically from the grievance. Example —
the Forwarded message:

> வணக்கம் வீரமணி,
> உங்கள் சாலை மற்றும் உள்கட்டமைப்பு தொடர்பான குறைதீர் மனு (MLA/ME/0001) வெற்றிகரமாக பெறப்பட்டுள்ளது.
> இந்த மனு சாலை மற்றும் உள்கட்டமைப்பு துறைக்கு அனுப்பப்பட்டுள்ளது. எங்கள் குழு விரைவில் இதனை ஆய்வு செய்து தேவையான நடவடிக்கைகளை மேற்கொள்ளும்.
> தயவுசெய்து சிறிது நேரம் காத்திருக்கவும். உங்கள் ஒத்துழைப்பிற்கு நன்றி.

### Department Tamil names
Each department can have a Tamil name set in **Departments Master** (e.g. "Roads &
Infrastructure" → "சாலை மற்றும் உள்கட்டமைப்பு") — this is what appears in the citizen's
Tamil message instead of the English department name. All default departments come
pre-filled with a Tamil name; edit it anytime by clicking the pencil icon next to a
department.

### About the WhatsApp notification
This uses `wa.me` click-to-chat links — no WhatsApp Business API account, approval, or
per-message cost required. When MLA staff click "Approve, Forward & Notify", it opens
WhatsApp (web or app) with the selected person's number and a pre-filled message (their
name, grievance ref, priority, ward, citizen details, description); staff just hit send.
Because this is a free click-to-send link (not the paid Business API), the app can
confirm the link opened successfully, but cannot confirm actual delivery — that requires
the recipient to hit send themselves, and only Meta's paid API provides delivery receipts.

Every grievance — whether submitted online or imported from an Excel batch — shares the
same ID sequence, status pipeline, and history log:

`SUBMITTED → FORWARDED_TO_DEPT → RECEIVED_BY_DEPT → IN_PROGRESS → RESOLVED → VERIFIED_CLOSED`
(or `REOPENED` if the citizen isn't satisfied, looping back for more work)

The **Received** step exists because WhatsApp click-to-send links can't confirm delivery
on their own — this gives you a clear, explicit signal that a real person at the
department has actually seen the grievance, not just that a message was sent.

## 4. Deploying it for real use

This is a genuine, runnable application — but before putting it in front of the public,
add the following:

**Authentication & roles** — currently anyone with the URL can act as MLA staff or
department officer. Add login (e.g. email/OTP or SSO) and restrict the Review/Department
views by role before going live.

**Move off SQLite for scale** — SQLite is great for getting started and moderate traffic,
but for a high-volume public portal, switch to PostgreSQL. The `backend/db.js` schema
maps directly onto the fuller Postgres schema already discussed — swap `better-sqlite3`
for `pg`, keep the same table/column names.

**File storage for attachments** — if citizens should attach photos, add an object storage
provider (S3-compatible) rather than storing files on the server disk.

**Hosting** — three ways to deploy, all covered step-by-step:
- **[DEPLOY.md](./DEPLOY.md)** — Render, either free (Turso + Render free tier, ~30–60s
  wake-up delay after inactivity) or paid always-on (~$7.25/month, no delay)
- **[DEPLOY_ORACLE.md](./DEPLOY_ORACLE.md)** — a free-forever Oracle Cloud VPS running
  everything (backend + frontend + database) on one server, $0/month, no sleep delay,
  but more hands-on server setup than Render
The backend already supports both — see "Database storage" below.

**Notifications** — wire up an SMS/WhatsApp provider to notify citizens on status changes,
using the same status-update endpoints.

## 5. API reference (backend)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/grievances` | List all grievances (filter with `?status=` `?department=`) |
| GET | `/api/grievances/ref/:ref` | Get one grievance + full history by public ID |
| POST | `/api/grievances` | Citizen submits online (`name`, `phone`, `ward`, `address`, `description`) |
| POST | `/api/grievances/:id/forward` | MLA forwards to a department |
| POST | `/api/grievances/:id/reject` | MLA rejects with a required reason (`reason`, `actor`) |
| POST | `/api/grievances/:id/status` | Update status (`IN_PROGRESS`, `RESOLVED`, `VERIFIED_CLOSED`, `REOPENED`) |
| GET | `/api/grievances/meta/departments` | List of departments |
| POST | `/api/batches/preview` | Upload Excel file, get parsed + validated rows back |
| POST | `/api/batches/confirm` | Import validated rows as new grievances |
| GET | `/api/batches` | List past batch uploads |
| GET | `/api/analytics` | Aggregate stats for the dashboard |
| GET | `/api/departments` | List departments with contacts array (name, designation, phone) |
| POST | `/api/departments` | Add a department (`name`, `email`) |
| PUT | `/api/departments/:id` | Update a department's name/email |
| DELETE | `/api/departments/:id` | Remove a department (blocked if grievances reference it) |
| POST | `/api/departments/:id/contacts` | Add a contact person (`name`, `designation`, `phone`) |
| PUT | `/api/departments/:id/contacts/:contactId` | Update a contact person |
| DELETE | `/api/departments/:id/contacts/:contactId` | Remove a contact person |
| GET | `/api/settings` | Get all settings (e.g. `ref_prefix`) |
| PUT | `/api/settings/:key` | Update a setting (e.g. `ref_prefix`) |
