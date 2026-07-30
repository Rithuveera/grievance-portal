const express = require("express");
const { all } = require("../db");
const { wrap } = require("../utils");

const router = express.Router();

router.get("/", wrap(async (req, res) => {
  const grievances = await all("SELECT * FROM grievances");
  const total = grievances.length;
  const resolved = grievances.filter((g) => ["RESOLVED", "VERIFIED_CLOSED"].includes(g.status)).length;
  const rejected = grievances.filter((g) => g.status === "REJECTED").length;
  const pending = total - resolved - rejected;

  const withResolution = grievances.filter((g) => g.resolved_at);
  const avgDays = withResolution.length
    ? (
        withResolution.reduce((sum, g) => sum + (new Date(g.resolved_at) - new Date(g.submitted_at)) / 86400000, 0) /
        withResolution.length
      ).toFixed(1)
    : null;

  const byCategory = {};
  grievances.forEach((g) => {
    byCategory[g.category || "Uncategorized"] = (byCategory[g.category || "Uncategorized"] || 0) + 1;
  });

  const byStatus = {};
  grievances.forEach((g) => {
    byStatus[g.status] = (byStatus[g.status] || 0) + 1;
  });

  const bySource = {
    ONLINE: grievances.filter((g) => g.source === "ONLINE").length,
    OFFLINE_CAMP: grievances.filter((g) => g.source === "OFFLINE_CAMP").length
  };

  res.json({ total, resolved, pending, rejected, avgDays, byCategory, byStatus, bySource });
}));

module.exports = router;
