const express = require("express");
const { run, get, all } = require("../db");
const { wrap } = require("../utils");

const router = express.Router();

router.get("/", wrap(async (req, res) => {
  const rows = await all("SELECT key, value FROM settings");
  const settings = {};
  rows.forEach((r) => { settings[r.key] = r.value; });
  res.json(settings);
}));

router.put("/:key", wrap(async (req, res) => {
  const { value } = req.body;
  if (value === undefined || value === null) return res.status(400).json({ error: "value is required" });

  const existing = await get("SELECT key FROM settings WHERE key = ?", [req.params.key]);
  if (existing) {
    await run("UPDATE settings SET value = ? WHERE key = ?", [String(value), req.params.key]);
  } else {
    await run("INSERT INTO settings (key, value) VALUES (?, ?)", [req.params.key, String(value)]);
  }
  res.json({ key: req.params.key, value: String(value) });
}));

module.exports = router;
