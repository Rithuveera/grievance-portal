const express = require("express");
const { randomUUID } = require("crypto");
const { run, get, all } = require("../db");
const { wrap } = require("../utils");

const router = express.Router();

async function withContacts(dept) {
  const contacts = await all("SELECT * FROM department_contacts WHERE department_id = ? ORDER BY name ASC", [dept.id]);
  return { ...dept, contacts };
}

// List all departments, each with its list of contacts (name, designation, phone)
router.get("/", wrap(async (req, res) => {
  const depts = await all("SELECT * FROM departments ORDER BY name ASC");
  res.json(await Promise.all(depts.map(withContacts)));
}));

// Add a new department
router.post("/", wrap(async (req, res) => {
  const { name, tamil_name, email } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "name is required" });

  const existing = await get("SELECT id FROM departments WHERE name = ?", [name.trim()]);
  if (existing) return res.status(409).json({ error: "A department with this name already exists" });

  const id = randomUUID();
  await run(
    "INSERT INTO departments (id, name, tamil_name, contact_person, phone, email, created_at) VALUES (?,?,?,?,?,?,?)",
    [id, name.trim(), tamil_name || "", "", "", email || "", new Date().toISOString()]
  );

  const dept = await get("SELECT * FROM departments WHERE id = ?", [id]);
  res.json(await withContacts(dept));
}));

// Update a department's name/email
router.put("/:id", wrap(async (req, res) => {
  const dept = await get("SELECT * FROM departments WHERE id = ?", [req.params.id]);
  if (!dept) return res.status(404).json({ error: "Department not found" });

  const { name, tamil_name, email } = req.body;
  const newName = name !== undefined && name.trim() ? name.trim() : dept.name;

  if (newName !== dept.name) {
    const clash = await get("SELECT id FROM departments WHERE name = ? AND id != ?", [newName, dept.id]);
    if (clash) return res.status(409).json({ error: "A department with this name already exists" });
  }

  await run("UPDATE departments SET name = ?, tamil_name = ?, email = ? WHERE id = ?", [
    newName,
    tamil_name !== undefined ? tamil_name : dept.tamil_name,
    email !== undefined ? email : dept.email,
    dept.id
  ]);

  if (newName !== dept.name) {
    await run("UPDATE grievances SET department = ? WHERE department = ?", [newName, dept.name]);
    await run("UPDATE grievances SET category = ? WHERE category = ?", [newName, dept.name]);
  }

  const updated = await get("SELECT * FROM departments WHERE id = ?", [dept.id]);
  res.json(await withContacts(updated));
}));

// Remove a department
router.delete("/:id", wrap(async (req, res) => {
  const dept = await get("SELECT * FROM departments WHERE id = ?", [req.params.id]);
  if (!dept) return res.status(404).json({ error: "Department not found" });

  const inUse = (await get("SELECT COUNT(*) as c FROM grievances WHERE department = ?", [dept.name])).c;
  if (inUse > 0) {
    return res.status(409).json({ error: `Cannot delete — ${inUse} grievance(s) are assigned to this department` });
  }

  await run("DELETE FROM department_contacts WHERE department_id = ?", [dept.id]);
  await run("DELETE FROM departments WHERE id = ?", [dept.id]);
  res.json({ ok: true });
}));

// --- Contacts nested under a department (one department, many people) ---

// Add a contact person to a department
router.post("/:id/contacts", wrap(async (req, res) => {
  const dept = await get("SELECT * FROM departments WHERE id = ?", [req.params.id]);
  if (!dept) return res.status(404).json({ error: "Department not found" });

  const { name, designation, phone } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "Contact name is required" });
  if (!phone || !phone.trim()) return res.status(400).json({ error: "Phone number is required" });

  const id = randomUUID();
  await run(
    "INSERT INTO department_contacts (id, department_id, name, designation, phone, created_at) VALUES (?,?,?,?,?,?)",
    [id, dept.id, name.trim(), designation || "", phone.trim(), new Date().toISOString()]
  );

  res.json(await get("SELECT * FROM department_contacts WHERE id = ?", [id]));
}));

// Update a contact person
router.put("/:id/contacts/:contactId", wrap(async (req, res) => {
  const contact = await get(
    "SELECT * FROM department_contacts WHERE id = ? AND department_id = ?",
    [req.params.contactId, req.params.id]
  );
  if (!contact) return res.status(404).json({ error: "Contact not found" });

  const { name, designation, phone } = req.body;
  await run("UPDATE department_contacts SET name = ?, designation = ?, phone = ? WHERE id = ?", [
    name !== undefined && name.trim() ? name.trim() : contact.name,
    designation !== undefined ? designation : contact.designation,
    phone !== undefined && phone.trim() ? phone.trim() : contact.phone,
    contact.id
  ]);

  res.json(await get("SELECT * FROM department_contacts WHERE id = ?", [contact.id]));
}));

// Remove a contact person
router.delete("/:id/contacts/:contactId", wrap(async (req, res) => {
  const contact = await get(
    "SELECT * FROM department_contacts WHERE id = ? AND department_id = ?",
    [req.params.contactId, req.params.id]
  );
  if (!contact) return res.status(404).json({ error: "Contact not found" });

  await run("DELETE FROM department_contacts WHERE id = ?", [contact.id]);
  res.json({ ok: true });
}));

module.exports = router;
