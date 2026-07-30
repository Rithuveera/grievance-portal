require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { init } = require("./db");

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",");
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "5mb" }));

app.use("/api/grievances", require("./routes/grievances"));
app.use("/api/batches", require("./routes/batches"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/departments", require("./routes/departments"));
app.use("/api/settings", require("./routes/settings"));

app.get("/api/health", (req, res) => res.json({ ok: true, service: "grievance-tracker-backend" }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 4000;

async function start() {
  await init();
  app.listen(PORT, () => {
    console.log(`Grievance Tracker API running on http://localhost:${PORT}`);
    console.log(process.env.TURSO_DATABASE_URL ? "Using Turso database." : "Using local SQLite file (set TURSO_DATABASE_URL for production).");
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn("ANTHROPIC_API_KEY not set — AI classification will use the keyword fallback.");
    }
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
