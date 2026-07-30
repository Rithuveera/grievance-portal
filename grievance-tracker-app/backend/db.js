const { createClient } = require("@libsql/client");
const path = require("path");
const fs = require("fs");
const { randomUUID } = require("crypto");

// In production, set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (from turso.tech) and the
// app stores data in your free Turso database — safe even on Render's free tier, which
// wipes local disk on every restart. Without those set, it falls back to a local SQLite
// file for zero-config local development.
let url = process.env.TURSO_DATABASE_URL;
let authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  const dataDir = process.env.DATA_DIR || __dirname;
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  url = `file:${path.join(dataDir, "grievances.db")}`;
}

const db = createClient({ url, authToken });

async function run(sql, args = []) {
  return db.execute({ sql, args });
}

async function get(sql, args = []) {
  const result = await db.execute({ sql, args });
  return result.rows[0] || null;
}

async function all(sql, args = []) {
  const result = await db.execute({ sql, args });
  return result.rows;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS grievances (
  id TEXT PRIMARY KEY,
  ref TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('ONLINE','OFFLINE_CAMP')),
  batch_id TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  ward TEXT,
  address TEXT,
  description TEXT NOT NULL,
  category TEXT,
  priority TEXT DEFAULT 'MEDIUM',
  department TEXT,
  status TEXT NOT NULL DEFAULT 'SUBMITTED',
  camp_location TEXT,
  camp_date TEXT,
  collected_by TEXT,
  submitted_at TEXT NOT NULL,
  resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  grievance_id TEXT NOT NULL REFERENCES grievances(id),
  status TEXT NOT NULL,
  note TEXT,
  actor TEXT,
  at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY,
  file_name TEXT,
  uploaded_at TEXT NOT NULL,
  total_rows INTEGER,
  valid_rows INTEGER,
  rejected_rows INTEGER
);

CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  tamil_name TEXT,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS department_contacts (
  id TEXT PRIMARY KEY,
  department_id TEXT NOT NULL REFERENCES departments(id),
  name TEXT NOT NULL,
  designation TEXT,
  phone TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_grievances_status ON grievances(status);
CREATE INDEX IF NOT EXISTS idx_grievances_department ON grievances(department);
CREATE INDEX IF NOT EXISTS idx_history_grievance ON status_history(grievance_id);
CREATE INDEX IF NOT EXISTS idx_contacts_department ON department_contacts(department_id);
`;

const DEFAULT_DEPARTMENTS = [
  ["Roads & Infrastructure", "சாலை மற்றும் உள்கட்டமைப்பு"],
  ["Water Supply", "குடிநீர் விநியோகம்"],
  ["Electricity", "மின்சாரம்"],
  ["Health", "சுகாதாரம்"],
  ["Education", "கல்வி"],
  ["Land & Revenue", "நிலம் மற்றும் வருவாய்"],
  ["Sanitation", "சுகாதார பராமரிப்பு"],
  ["Public Safety", "பொது பாதுகாப்பு"],
  ["General Administration", "பொது நிர்வாகம்"]
];

const DEFAULT_FOOTER =
  "பொதுமக்களிடமிருந்து பெறப்பட்டுள்ள இணைப்பிலுள்ள புகார் மனுவை தங்களின் கனிவான பார்வைக்கு அனுப்பி வைத்துள்ளேன்.\n" +
  "மேற்கண்ட மனு மீது உரிய ஆய்வு மேற்கொண்டு, தகுந்த நடவடிக்கை எடுத்து, அதன் விவரத்தை கீழ்க்கண்ட எண்ணிற்கு தெரிவித்திடுமாறு அன்புடன் கேட்டுக் கொள்கிறேன்.\n" +
  "📞 +91 8667493061\n" +
  "நன்றி.\n" +
  "அன்புடன்,\n" +
  "திரு. சோ. கார்த்திகேயன், M.A., LL.B.,\n" +
  "சட்டமன்ற உறுப்பினர்\n" +
  "மதுரை கிழக்கு சட்டமன்றத் தொகுதி";

async function init() {
  await db.executeMultiple(SCHEMA);

  // Migrate older databases created before tamil_name existed
  const cols = await all("PRAGMA table_info(departments)");
  if (!cols.some((c) => c.name === "tamil_name")) {
    await run("ALTER TABLE departments ADD COLUMN tamil_name TEXT");
  }

  const deptCount = (await get("SELECT COUNT(*) as c FROM departments")).c;
  if (deptCount === 0) {
    const now = new Date().toISOString();
    for (const [name, tamilName] of DEFAULT_DEPARTMENTS) {
      await run(
        "INSERT INTO departments (id, name, tamil_name, contact_person, phone, email, created_at) VALUES (?,?,?,?,?,?,?)",
        [randomUUID(), name, tamilName, "", "", "", now]
      );
    }
  }

  const prefixCount = (await get("SELECT COUNT(*) as c FROM settings WHERE key = 'ref_prefix'")).c;
  if (prefixCount === 0) {
    await run("INSERT INTO settings (key, value) VALUES ('ref_prefix', 'MLA/ME')");
  }

  const footerCount = (await get("SELECT COUNT(*) as c FROM settings WHERE key = 'dept_message_footer'")).c;
  if (footerCount === 0) {
    await run("INSERT INTO settings (key, value) VALUES ('dept_message_footer', ?)", [DEFAULT_FOOTER]);
  }
}

module.exports = { db, run, get, all, init };
