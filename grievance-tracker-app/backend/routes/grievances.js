const express = require("express");
const { randomUUID } = require("crypto");
const { run, get, all } = require("../db");
const { classifyGrievance } = require("../services/classify");
const { nextRef } = require("../services/refGenerator");
const { wrap } = require("../utils");

const router = express.Router();

async function addHistory(grievanceId, status, note, actor) {
  await run(
    "INSERT INTO status_history (grievance_id, status, note, actor, at) VALUES (?,?,?,?,?)",
    [grievanceId, status, note, actor, new Date().toISOString()]
  );
}

async function departmentNames() {
  const rows = await all("SELECT name FROM departments ORDER BY name ASC");
  return rows.map((r) => r.name);
}

// List department names only (for dropdowns) — full contact details are under /api/departments
router.get("/meta/departments", wrap(async (req, res) => {
  res.json(await departmentNames());
}));

// List grievances, optional ?status= & ?department= filters
router.get("/", wrap(async (req, res) => {
  const { status, department } = req.query;
  let query = `
    SELECT g.*, (
      SELECT note FROM status_history sh
      WHERE sh.grievance_id = g.id
      ORDER BY sh.at DESC LIMIT 1
    ) as latest_note
    FROM grievances g WHERE 1=1`;
  const params = [];
  if (status) {
    query += " AND g.status = ?";
    params.push(status);
  }
  if (department) {
    query += " AND g.department = ?";
    params.push(department);
  }
  query += " ORDER BY g.submitted_at DESC";
  res.json(await all(query, params));
}));

// Track a single grievance by public reference, with full history
router.get("/ref/:ref", wrap(async (req, res) => {
  const g = await get("SELECT * FROM grievances WHERE ref = ?", [req.params.ref]);
  if (!g) return res.status(404).json({ error: "Grievance not found" });
  const history = await all("SELECT * FROM status_history WHERE grievance_id = ? ORDER BY at ASC", [g.id]);
  res.json({ ...g, history });
}));

// Citizen submits a grievance online
router.post("/", wrap(async (req, res) => {
  const { name, phone, ward, address, description } = req.body;
  if (!name || !phone || !description) {
    return res.status(400).json({ error: "name, phone, and description are required" });
  }

  const names = await departmentNames();
  const ai = await classifyGrievance(description, names);
  const id = randomUUID();
  const ref = await nextRef();
  const submittedAt = new Date().toISOString();

  await run(
    `INSERT INTO grievances
     (id, ref, source, name, phone, ward, address, description, category, priority, department, status, submitted_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, ref, "ONLINE", name, phone, ward || "", address || "", description, ai.category, ai.priority, ai.category, "SUBMITTED", submittedAt]
  );

  await addHistory(id, "SUBMITTED", "Grievance submitted online", name);

  res.json({ id, ref, category: ai.category, priority: ai.priority, status: "SUBMITTED" });
}));

// MLA office reviews and forwards to a department
router.post("/:id/forward", wrap(async (req, res) => {
  const { department, actor } = req.body;
  if (!department) return res.status(400).json({ error: "department is required" });

  const g = await get("SELECT * FROM grievances WHERE id = ?", [req.params.id]);
  if (!g) return res.status(404).json({ error: "Grievance not found" });

  await run("UPDATE grievances SET department = ?, status = ? WHERE id = ?", [department, "FORWARDED_TO_DEPT", g.id]);
  await addHistory(g.id, "FORWARDED_TO_DEPT", `Reviewed by MLA office, forwarded to ${department}`, actor || "MLA Office");

  res.json({ ok: true });
}));

// MLA office rejects an invalid/duplicate/out-of-scope grievance instead of forwarding it
router.post("/:id/reject", wrap(async (req, res) => {
  const { reason, actor } = req.body;
  if (!reason || !reason.trim()) return res.status(400).json({ error: "A rejection reason is required" });

  const g = await get("SELECT * FROM grievances WHERE id = ?", [req.params.id]);
  if (!g) return res.status(404).json({ error: "Grievance not found" });

  await run("UPDATE grievances SET status = ? WHERE id = ?", ["REJECTED", g.id]);
  await addHistory(g.id, "REJECTED", reason.trim(), actor || "MLA Office");

  res.json({ ok: true });
}));

// Department (or citizen, for verify/reopen) updates status
router.post("/:id/status", wrap(async (req, res) => {
  const { status, note, actor } = req.body;
  const allowed = ["RECEIVED_BY_DEPT", "IN_PROGRESS", "RESOLVED", "VERIFIED_CLOSED", "REOPENED"];
  if (!allowed.includes(status)) return res.status(400).json({ error: "invalid status" });

  const g = await get("SELECT * FROM grievances WHERE id = ?", [req.params.id]);
  if (!g) return res.status(404).json({ error: "Grievance not found" });

  const resolvedAt = status === "RESOLVED" ? new Date().toISOString() : g.resolved_at;
  await run("UPDATE grievances SET status = ?, resolved_at = ? WHERE id = ?", [status, resolvedAt, g.id]);
  await addHistory(g.id, status, note || status, actor || "System");

  res.json({ ok: true });
}));

// MLA staff manually override the AI-suggested priority
router.put("/:id/priority", wrap(async (req, res) => {
  const { priority, actor } = req.body;
  // URGENT stays valid server-side so existing AI-classified records display correctly —
  // the UI only offers HIGH/MEDIUM/LOW for new manual selections.
  const allowed = ["LOW", "MEDIUM", "HIGH", "URGENT"];
  if (!allowed.includes(priority)) return res.status(400).json({ error: "invalid priority" });

  const g = await get("SELECT * FROM grievances WHERE id = ?", [req.params.id]);
  if (!g) return res.status(404).json({ error: "Grievance not found" });

  await run("UPDATE grievances SET priority = ? WHERE id = ?", [priority, g.id]);
  await addHistory(g.id, g.status, `Priority manually set to ${priority}`, actor || "MLA Office");

  res.json({ ok: true });
}));

module.exports = router;
