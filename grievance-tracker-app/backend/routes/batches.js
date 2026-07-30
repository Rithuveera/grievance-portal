const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const { randomUUID } = require("crypto");
const { run, all } = require("../db");
const { classifyGrievance } = require("../services/classify");
const { nextRef } = require("../services/refGenerator");
const { wrap } = require("../utils");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

async function departmentNames() {
  const rows = await all("SELECT name FROM departments ORDER BY name ASC");
  return rows.map((r) => r.name);
}

function normalizeRow(row) {
  const get = (...keys) => {
    for (const k of Object.keys(row)) {
      if (keys.includes(k.trim().toLowerCase())) return String(row[k] ?? "").trim();
    }
    return "";
  };
  return {
    name: get("name", "citizen name", "citizen_name"),
    phone: get("phone", "contact", "contact number", "phone number", "mobile"),
    ward: get("ward", "locality", "ward/locality", "ward_locality"),
    address: get("address"),
    description: get("description", "grievance", "grievance description", "issue"),
    campLocation: get("camp location", "camp_location", "camp"),
    campDate: get("camp date", "camp_date"),
    collectedBy: get("collected by", "collected_by", "field staff")
  };
}

// Step 1: upload file, get back parsed + validated rows (nothing saved yet)
router.post("/preview", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "file is required" });

  try {
    const wb = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    const rows = json.map(normalizeRow).map((r) => ({
      ...r,
      valid: Boolean(r.name && r.phone && r.description)
    }));
    res.json({ fileName: req.file.originalname, rows });
  } catch (err) {
    res.status(400).json({ error: "Could not parse file. Make sure it is a valid .xlsx/.xls/.csv" });
  }
});

// Step 2: confirm import of the (possibly edited) valid rows
router.post("/confirm", wrap(async (req, res) => {
  const { fileName, rows } = req.body;
  const validRows = (rows || []).filter((r) => r.valid);
  if (validRows.length === 0) return res.status(400).json({ error: "No valid rows to import" });

  const batchId = randomUUID();
  const imported = [];
  const names = await departmentNames();

  for (const r of validRows) {
    const ai = await classifyGrievance(r.description, names);
    const id = randomUUID();
    const ref = await nextRef();
    const submittedAt = new Date().toISOString();

    await run(
      `INSERT INTO grievances
       (id, ref, source, batch_id, name, phone, ward, address, description, category, priority, department, status, camp_location, camp_date, collected_by, submitted_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, ref, "OFFLINE_CAMP", batchId, r.name, r.phone, r.ward || "", r.address || "",
       r.description, ai.category, ai.priority, ai.category, "SUBMITTED",
       r.campLocation || "", r.campDate || "", r.collectedBy || "", submittedAt]
    );

    await run(
      "INSERT INTO status_history (grievance_id, status, note, actor, at) VALUES (?,?,?,?,?)",
      [id, "SUBMITTED", `Imported from camp batch (${r.campLocation || "field"})`, r.collectedBy || "Field staff", submittedAt]
    );

    imported.push({ id, ref });
  }

  await run(
    "INSERT INTO batches (id, file_name, uploaded_at, total_rows, valid_rows, rejected_rows) VALUES (?,?,?,?,?,?)",
    [batchId, fileName || "", new Date().toISOString(), (rows || []).length, validRows.length, (rows || []).length - validRows.length]
  );

  res.json({ batchId, imported: imported.length, rows: imported });
}));

router.get("/", wrap(async (req, res) => {
  res.json(await all("SELECT * FROM batches ORDER BY uploaded_at DESC"));
}));

module.exports = router;
