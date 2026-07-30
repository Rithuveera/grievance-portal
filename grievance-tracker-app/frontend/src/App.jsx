import { useState, useEffect, useMemo, useRef } from "react";
import {
  Send, Upload, ClipboardList, Building2, Search, BarChart3, CheckCircle2,
  Clock, AlertTriangle, RotateCcw, Loader2, MapPin, Inbox, TrendingUp, ChevronRight,
  MessageCircle, Trash2, Pencil, Plus, X, Users, Settings, FileText, Download, Printer
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { api } from "./api";

const PRIORITY_ORDER = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const PRIORITY_COLOR = { URGENT: "var(--coral)", HIGH: "var(--saffron)", MEDIUM: "var(--indigo)", LOW: "var(--ink-soft)" };

const STATUS_META = {
  SUBMITTED: { label: "Submitted", color: "var(--ink-soft)" },
  FORWARDED_TO_DEPT: { label: "Forwarded to Dept", color: "var(--indigo)" },
  RECEIVED_BY_DEPT: { label: "Received by Dept", color: "#7A5CB0" },
  IN_PROGRESS: { label: "In Progress", color: "var(--saffron)" },
  RESOLVED: { label: "Resolved", color: "var(--teal)" },
  VERIFIED_CLOSED: { label: "Verified & Closed", color: "var(--teal-dark)" },
  REOPENED: { label: "Reopened", color: "var(--coral)" },
  REJECTED: { label: "Rejected", color: "#8A8680" }
};

function TokenStub({ g }) {
  const meta = STATUS_META[g.status] || STATUS_META.SUBMITTED;
  return (
    <div className="stub" style={{ borderLeftColor: PRIORITY_COLOR[g.priority] }}>
      <div className="stub-perf" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{g.ref}</span>
          <span className="pill" style={{ background: meta.color }}>{meta.label}</span>
          <span className="pill-outline" style={{ borderColor: PRIORITY_COLOR[g.priority], color: PRIORITY_COLOR[g.priority] }}>
            {g.priority}
          </span>
        </div>
        <p style={{ margin: "6px 0 4px", fontSize: 14, lineHeight: 1.4 }}>
          {g.description.length > 140 ? g.description.slice(0, 140) + "…" : g.description}
        </p>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12.5, color: "var(--ink-soft)" }}>
          <span><MapPin size={12} style={{ display: "inline", marginRight: 3, verticalAlign: -1 }} />{g.ward || "—"}</span>
          <span>{g.category || "Uncategorized"}</span>
          <span>{g.source === "ONLINE" ? "Online" : "Camp / Offline"}</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 42, height: 42, borderRadius: 8, background: accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={20} color="#fff" />
      </div>
      <div>
        <div style={{ fontFamily: "var(--display)", fontSize: 26, lineHeight: 1 }}>{value ?? "—"}</div>
        <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 3 }}>{label}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [grievances, setGrievances] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [departmentContacts, setDepartmentContacts] = useState([]);
  const [view, setView] = useState("submit");
  const [refreshing, setRefreshing] = useState(false);
  const fileRef = useRef(null);

  async function refresh() {
    const [g, d, dc] = await Promise.all([api.listGrievances(), api.getDepartments(), api.listDepartmentContacts()]);
    setGrievances(g);
    setDepartments(d);
    setDepartmentContacts(dc);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
    // Auto-refresh in the background so the view never gets stuck stale —
    // e.g. if another staff member updates a grievance while you're looking at the queue.
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, []);

  const nav = [
    { id: "submit", label: "01 · Submit", icon: Send },
    { id: "upload", label: "02 · Camp Upload", icon: Upload },
    { id: "review", label: "03 · MLA Review", icon: ClipboardList },
    { id: "dept", label: "04 · Department", icon: Building2 },
    { id: "track", label: "05 · Track Status", icon: Search },
    { id: "analytics", label: "06 · Analytics", icon: BarChart3 },
    { id: "reports", label: "07 · Reports", icon: FileText }
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", gap: 10, color: "var(--ink-soft)" }}>
        <Loader2 className="spin" size={18} /> Loading portal…
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside className="sidebar no-print">
        <div style={{ marginBottom: 26, paddingLeft: 4 }}>
          <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, lineHeight: 1.15 }}>குறையுதவி</div>
          <div style={{ fontSize: 10.5, color: "#a9b0cc", marginTop: 1 }}>Kuraiyudhavi</div>
          <div style={{ fontSize: 11, color: "#a9b0cc", marginTop: 2 }}>Grievance Tracker Portal</div>
        </div>
        <div
          className="navitem"
          style={{ marginBottom: 14, fontSize: 12.5, color: refreshing ? "#fff" : "#cfd5e8" }}
          onClick={async () => { setRefreshing(true); await refresh(); setRefreshing(false); }}
        >
          <RotateCcw size={14} className={refreshing ? "spin" : ""} /> {refreshing ? "Refreshing…" : "Refresh"}
        </div>
        {nav.map((n) => (
          <div key={n.id} className={`navitem ${view === n.id ? "active" : ""}`} onClick={() => setView(n.id)}>
            <n.icon size={16} /> {n.label}
          </div>
        ))}
        <div style={{ height: 1, background: "rgba(255,255,255,0.12)", margin: "14px 4px" }} />
        <div className={`navitem ${view === "master" ? "active" : ""}`} onClick={() => setView("master")}>
          <Users size={16} /> Departments Master
        </div>
        <div className={`navitem ${view === "settings" ? "active" : ""}`} onClick={() => setView("settings")}>
          <Settings size={16} /> Settings
        </div>
      </aside>

      <div className="main">
        {view === "submit" && <SubmitView onDone={refresh} />}
        {view === "upload" && <UploadView fileRef={fileRef} onDone={refresh} />}
        {view === "review" && <ReviewView grievances={grievances} departmentContacts={departmentContacts} onDone={refresh} />}
        {view === "dept" && <DeptView grievances={grievances} departments={departments} departmentContacts={departmentContacts} onDone={refresh} />}
        {view === "track" && <TrackView onDone={refresh} />}
        {view === "analytics" && <AnalyticsView />}
        {view === "reports" && <ReportsView grievances={grievances} departmentContacts={departmentContacts} />}
        {view === "master" && <DepartmentMasterView onChange={refresh} />}
        {view === "settings" && <SettingsView />}
      </div>
    </div>
  );
}

function SubmitView({ onDone }) {
  const [form, setForm] = useState({ name: "", phone: "", ward: "", address: "", description: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState("");

  async function submit() {
    if (!form.name || !form.phone || !form.description) return;
    setBusy(true);
    setError("");
    try {
      const result = await api.submitGrievance(form);
      setDone({ ...form, ...result, source: "ONLINE" });
      setForm({ name: "", phone: "", ward: "", address: "", description: "" });
      onDone();
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  }

  return (
    <div>
      <h1 style={{ fontSize: 24 }}>Submit a Grievance</h1>
      <p style={{ color: "var(--ink-soft)", fontSize: 14, marginTop: 6, marginBottom: 22 }}>
        Describe your issue below. AI will suggest a category and priority for the MLA office to review.
      </p>

      <div className="card" style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label className="field-label">Full Name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Priya Menon" />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label className="field-label">Phone Number</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
          </div>
          <div style={{ flex: 1 }}>
            <label className="field-label">Ward / Locality</label>
            <input className="input" value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })} placeholder="e.g. Ward 12" />
          </div>
        </div>
        <div>
          <label className="field-label">Address</label>
          <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="House / street" />
        </div>
        <div>
          <label className="field-label">Grievance Description</label>
          <textarea className="input" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the issue in detail…" />
        </div>
        {error && <div style={{ color: "var(--coral)", fontSize: 13 }}>{error}</div>}
        <button className="btn btn-primary" disabled={busy} onClick={submit} style={{ alignSelf: "flex-start" }}>
          {busy ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
          {busy ? "Classifying with AI…" : "Submit Grievance"}
        </button>
      </div>

      {done && (
        <div style={{ marginTop: 22, maxWidth: 560 }}>
          <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle2 size={14} color="var(--teal)" /> Submitted — keep this reference number to track status
          </div>
          <TokenStub g={{ ...done, status: "SUBMITTED" }} />
        </div>
      )}
    </div>
  );
}

function UploadView({ fileRef, onDone }) {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError("");
    try {
      const result = await api.previewBatch(file);
      setFileName(result.fileName);
      setRows(result.rows);
    } catch (err) {
      setError(err.message);
    }
  }

  async function confirmImport() {
    setImporting(true);
    setError("");
    try {
      await api.confirmBatch(fileName, rows);
      setRows([]);
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
      onDone();
    } catch (err) {
      setError(err.message);
    }
    setImporting(false);
  }

  return (
    <div>
      <h1 style={{ fontSize: 24 }}>Camp / Offline Batch Upload</h1>
      <p style={{ color: "var(--ink-soft)", fontSize: 14, marginTop: 6, marginBottom: 22 }}>
        Upload an Excel sheet collected at a grievance camp. Expected columns: Name, Phone, Ward, Address, Description, Camp Location, Camp Date, Collected By.
      </p>

      <div className="card" style={{ maxWidth: 640 }}>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{ fontSize: 13.5 }} />
      </div>

      {error && <div style={{ color: "var(--coral)", fontSize: 13, marginTop: 10 }}>{error}</div>}

      {rows.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <h3 style={{ fontSize: 16 }}>
              Preview — {rows.length} rows ({rows.filter((r) => r.valid).length} ready, {rows.filter((r) => !r.valid).length} flagged)
            </h3>
            <button className="btn btn-primary" disabled={importing} onClick={confirmImport}>
              {importing ? <Loader2 size={14} className="spin" /> : <Upload size={14} />}
              {importing ? "Importing…" : "Confirm & Import"}
            </button>
          </div>
          <div className="card" style={{ padding: 0, overflow: "auto", maxHeight: 380 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: "var(--bg)", textAlign: "left" }}>
                  {["", "Name", "Phone", "Ward", "Description"].map((h) => (
                    <th key={h} style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "7px 10px" }}>
                      {r.valid ? <CheckCircle2 size={14} color="var(--teal)" /> : <AlertTriangle size={14} color="var(--coral)" />}
                    </td>
                    <td style={{ padding: "7px 10px" }}>{r.name || "—"}</td>
                    <td style={{ padding: "7px 10px" }}>{r.phone || "—"}</td>
                    <td style={{ padding: "7px 10px" }}>{r.ward || "—"}</td>
                    <td style={{ padding: "7px 10px", maxWidth: 260 }}>{r.description || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function sanitizePhone(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

function openWhatsApp(phone, message) {
  const clean = sanitizePhone(phone);
  if (!clean) return false;
  window.open(`https://wa.me/${clean}?text=${encodeURIComponent(message)}`, "_blank");
  return true;
}

const CITIZEN_STATUS_MESSAGES = {
  FORWARDED_TO_DEPT: (g, deptLabel) =>
    `வணக்கம் ${g.name},\n` +
    `உங்கள் ${deptLabel} தொடர்பான குறைதீர் மனு (${g.ref}) வெற்றிகரமாக பெறப்பட்டுள்ளது.\n` +
    `இந்த மனு ${deptLabel} துறைக்கு அனுப்பப்பட்டுள்ளது. எங்கள் குழு விரைவில் இதனை ஆய்வு செய்து தேவையான நடவடிக்கைகளை மேற்கொள்ளும்.\n` +
    `தயவுசெய்து சிறிது நேரம் காத்திருக்கவும். உங்கள் ஒத்துழைப்பிற்கு நன்றி.`,
  RECEIVED_BY_DEPT: (g, deptLabel) =>
    `வணக்கம் ${g.name},\n` +
    `உங்கள் குறைதீர் மனு (${g.ref}) ${deptLabel} துறையால் பெறப்பட்டுள்ளது. விரைவில் இதன் மீது நடவடிக்கை எடுக்கப்படும்.\n` +
    `தயவுசெய்து சிறிது நேரம் காத்திருக்கவும். உங்கள் ஒத்துழைப்பிற்கு நன்றி.`,
  IN_PROGRESS: (g, deptLabel) =>
    `வணக்கம் ${g.name},\n` +
    `உங்கள் குறைதீர் மனு (${g.ref}) தொடர்பாக ${deptLabel} துறையினரால் பணிகள் தற்போது நடைபெற்று வருகின்றன.\n` +
    `உங்கள் பொறுமைக்கு நன்றி.`,
  RESOLVED: (g, deptLabel) =>
    `வணக்கம் ${g.name},\n` +
    `மகிழ்ச்சியான செய்தி! உங்கள் குறைதீர் மனு (${g.ref}) ${deptLabel} துறையால் தீர்க்கப்பட்டுள்ளது.\n` +
    `தயவுசெய்து சரிபார்த்து உறுதிப்படுத்தவும், அல்லது பிரச்சனை தொடர்ந்தால் எங்களுக்குத் தெரியப்படுத்தவும். நன்றி.`,
  REJECTED: (g, reason) =>
    `வணக்கம் ${g.name},\n` +
    `உங்கள் குறைதீர் மனு (${g.ref}) ஆய்வு செய்யப்பட்டது. துரதிர்ஷ்டவசமாக, பின்வரும் காரணத்தால் இதை தொடர்ந்து செயல்படுத்த இயலவில்லை:\n` +
    `${reason}\n` +
    `மேலும் தகவல் தேவைப்பட்டால் அல்லது இது தவறு எனில், எங்களை தொடர்பு கொள்ளவும். நன்றி.`
};

function buildWhatsAppMessage(g, department, contactName, footer) {
  const base =
    `*New Grievance Forwarded*\n` +
    `To: ${contactName}\n` +
    `Ref: ${g.ref}\n` +
    `Department: ${department}\n` +
    `Priority: ${g.priority}\n` +
    `Ward: ${g.ward || "—"}\n` +
    `Citizen: ${g.name} (${g.phone})\n\n` +
    `Description: ${g.description}`;
  return footer ? `${base}\n\n${footer}` : base;
}

const REJECT_REASONS = [
  "நகல் புகார் (Duplicate grievance)",
  "இந்த தொகுதிக்கு உட்படாதது (Not under this constituency)",
  "போதிய தகவல் இல்லை (Insufficient information)",
  "தவறான / உண்மைக்குப் புறம்பான புகார் (Invalid / spam grievance)",
  "மற்றவை (Other — specify below)"
];

function ReviewView({ grievances, departmentContacts, onDone }) {
  const [selectedDept, setSelectedDept] = useState({});   // grievanceId -> department name
  const [selectedContact, setSelectedContact] = useState({}); // grievanceId -> contact id
  const [status, setStatus] = useState({}); // grievanceId -> { type: 'success'|'warn', text }
  const [footer, setFooter] = useState("");
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0]);
  const [rejectCustom, setRejectCustom] = useState("");

  useEffect(() => {
    api.getSettings().then((s) => setFooter(s.dept_message_footer || ""));
  }, []);

  const pending = grievances
    .filter((g) => g.status === "SUBMITTED")
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  function contactsFor(deptName) {
    const dept = departmentContacts.find((d) => d.name === deptName);
    return dept ? dept.contacts : [];
  }

  function deptFor(g) {
    const chosen = selectedDept[g.id] ?? g.category;
    const validNames = departmentContacts.map((d) => d.name);
    if (validNames.includes(chosen)) return chosen;
    return validNames[0] || chosen;
  }

  async function forwardAndNotify(g) {
    const department = deptFor(g);
    const contacts = contactsFor(department);
    const contactId = selectedContact[g.id] || (contacts[0] && contacts[0].id);
    const contact = contacts.find((c) => c.id === contactId);

    await api.forwardGrievance(g.id, department, "MLA Office");

    const parts = [];

    if (contact) {
      // Footer (MLA office signature note) goes to the department message only — never the citizen message
      openWhatsApp(contact.phone, buildWhatsAppMessage(g, department, contact.name, footer));
      parts.push(`department contact ${contact.name}`);
    }

    const deptObj = departmentContacts.find((d) => d.name === department);
    const deptLabelForCitizen = (deptObj && deptObj.tamil_name) ? deptObj.tamil_name : department;
    const citizenSent = openWhatsApp(g.phone, CITIZEN_STATUS_MESSAGES.FORWARDED_TO_DEPT(g, deptLabelForCitizen));
    if (citizenSent) parts.push(`citizen ${g.name}`);

    if (parts.length === 0) {
      setStatus({ ...status, [g.id]: { type: "warn", text: `No contact person on file for ${department}, and citizen phone is missing. Add a contact in Departments Master.` } });
    } else {
      setStatus({ ...status, [g.id]: { type: "success", text: `WhatsApp opened for ${parts.join(" and ")} — hit send in each tab to notify them.` } });
    }
    onDone();
  }

  function startReject(g) {
    setRejectingId(g.id);
    setRejectReason(REJECT_REASONS[0]);
    setRejectCustom("");
  }

  async function confirmReject(g) {
    const reason = rejectReason === REJECT_REASONS[REJECT_REASONS.length - 1] && rejectCustom.trim()
      ? rejectCustom.trim()
      : rejectReason;

    await api.rejectGrievance(g.id, reason, "MLA Office");

    const sent = openWhatsApp(g.phone, CITIZEN_STATUS_MESSAGES.REJECTED(g, reason));
    setStatus({
      ...status,
      [g.id]: sent
        ? { type: "warn", text: `Rejected. WhatsApp opened to notify ${g.name} of the reason.` }
        : { type: "warn", text: `Rejected. ${g.name} has no valid phone number on file to notify.` }
    });
    setRejectingId(null);
    onDone();
  }

  return (
    <div>
      <h1 style={{ fontSize: 24 }}>MLA Review Queue</h1>
      <p style={{ color: "var(--ink-soft)", fontSize: 14, marginTop: 6, marginBottom: 22 }}>
        {pending.length} grievance{pending.length !== 1 ? "s" : ""} awaiting review, sorted by AI-suggested priority.
      </p>
      {pending.length === 0 && (
        <div className="empty"><Inbox size={30} style={{ marginBottom: 8 }} /><div>Queue is clear.</div></div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {pending.map((g) => {
          const dept = deptFor(g);
          const contacts = contactsFor(dept);
          const contactId = selectedContact[g.id] || (contacts[0] && contacts[0].id) || "";
          return (
            <div key={g.id} className="card">
              <TokenStub g={g} />
              <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>Department:</span>
                <select
                  className="input"
                  style={{ width: 200 }}
                  value={dept}
                  onChange={(e) => setSelectedDept({ ...selectedDept, [g.id]: e.target.value })}
                >
                  {departmentContacts.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>

                <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>Send to:</span>
                <select
                  className="input"
                  style={{ width: 240 }}
                  value={contactId}
                  onChange={(e) => setSelectedContact({ ...selectedContact, [g.id]: e.target.value })}
                  disabled={contacts.length === 0}
                >
                  {contacts.length === 0 && <option value="">No contacts added</option>}
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
                  ))}
                </select>

                <button className="btn btn-primary" onClick={() => forwardAndNotify(g)}>
                  <MessageCircle size={14} /> Approve, Forward &amp; Notify
                </button>
                <button
                  className="btn btn-outline"
                  style={{ color: "var(--coral)", borderColor: "var(--coral)" }}
                  onClick={() => (rejectingId === g.id ? setRejectingId(null) : startReject(g))}
                >
                  <X size={14} /> Reject
                </button>
              </div>

              {rejectingId === g.id && (
                <div style={{ marginTop: 10, padding: 12, background: "var(--bg)", borderRadius: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                  <label className="field-label" style={{ marginBottom: 0 }}>Reason for rejection</label>
                  <select className="input" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}>
                    {REJECT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {rejectReason === REJECT_REASONS[REJECT_REASONS.length - 1] && (
                    <input
                      className="input"
                      placeholder="Type the specific reason…"
                      value={rejectCustom}
                      onChange={(e) => setRejectCustom(e.target.value)}
                    />
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-primary" style={{ background: "var(--coral)" }} onClick={() => confirmReject(g)}>
                      <AlertTriangle size={14} /> Confirm Rejection
                    </button>
                    <button className="btn btn-outline" onClick={() => setRejectingId(null)}>Cancel</button>
                  </div>
                </div>
              )}
              {status[g.id] && (
                <div style={{ marginTop: 8, fontSize: 12.5, color: status[g.id].type === "success" ? "var(--teal)" : "var(--coral)", display: "flex", alignItems: "center", gap: 5 }}>
                  {status[g.id].type === "success" ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />} {status[g.id].text}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DeptView({ grievances, departments, departmentContacts, onDone }) {
  const [dept, setDept] = useState(departments[0] || "");
  const [remarks, setRemarks] = useState({});
  const [status, setStatus] = useState({});
  const items = grievances.filter((g) => g.department === dept && ["FORWARDED_TO_DEPT", "RECEIVED_BY_DEPT", "IN_PROGRESS"].includes(g.status));

  async function advance(g, toStatus) {
    const defaults = {
      RECEIVED_BY_DEPT: "Grievance received by department",
      IN_PROGRESS: "Work started",
      RESOLVED: "Marked resolved"
    };
    const note = remarks[g.id] || defaults[toStatus] || toStatus;
    await api.updateStatus(g.id, toStatus, note, dept);

    const messageBuilder = CITIZEN_STATUS_MESSAGES[toStatus];
    if (messageBuilder) {
      const deptObj = departmentContacts.find((d) => d.name === dept);
      const deptLabel = (deptObj && deptObj.tamil_name) ? deptObj.tamil_name : dept;
      const sent = openWhatsApp(g.phone, messageBuilder(g, deptLabel));
      setStatus({
        ...status,
        [g.id]: sent
          ? { type: "success", text: `WhatsApp opened to notify ${g.name} — hit send there.` }
          : { type: "warn", text: `Status updated, but ${g.name} has no valid phone number on file to notify.` }
      });
    }
    onDone();
  }

  return (
    <div>
      <h1 style={{ fontSize: 24 }}>Department Workbench</h1>
      <div style={{ margin: "14px 0 22px", maxWidth: 300 }}>
        <label className="field-label">Department</label>
        <select className="input" value={dept} onChange={(e) => setDept(e.target.value)}>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      {items.length === 0 && (
        <div className="empty"><Building2 size={30} style={{ marginBottom: 8 }} /><div>No open grievances for {dept}.</div></div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((g) => (
          <div key={g.id} className="card">
            <TokenStub g={g} />
            <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
              <input
                className="input"
                style={{ flex: 1, minWidth: 200 }}
                placeholder="Remarks (optional)"
                value={remarks[g.id] || ""}
                onChange={(e) => setRemarks({ ...remarks, [g.id]: e.target.value })}
              />
              {g.status === "FORWARDED_TO_DEPT" && (
                <button className="btn btn-primary" onClick={() => advance(g, "RECEIVED_BY_DEPT")}>
                  <CheckCircle2 size={14} /> Mark Received
                </button>
              )}
              {g.status === "RECEIVED_BY_DEPT" && (
                <button className="btn btn-outline" onClick={() => advance(g, "IN_PROGRESS")}>
                  <Clock size={14} /> Mark In Progress
                </button>
              )}
              {(g.status === "RECEIVED_BY_DEPT" || g.status === "IN_PROGRESS") && (
                <button className="btn btn-primary" onClick={() => advance(g, "RESOLVED")}>
                  <CheckCircle2 size={14} /> Mark Resolved
                </button>
              )}
            </div>
            {status[g.id] && (
              <div style={{ marginTop: 8, fontSize: 12.5, color: status[g.id].type === "success" ? "var(--teal)" : "var(--coral)", display: "flex", alignItems: "center", gap: 5 }}>
                {status[g.id].type === "success" ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />} {status[g.id].text}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactRow({ contact, deptId, onSaved, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: contact.name, designation: contact.designation || "", phone: contact.phone });
  const [error, setError] = useState("");

  async function save() {
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Name and phone are required");
      return;
    }
    try {
      await api.updateContact(deptId, contact.id, form);
      setEditing(false);
      onSaved();
    } catch (e) {
      setError(e.message);
    }
  }

  if (editing) {
    return (
      <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 0", flexWrap: "wrap" }}>
        <input className="input" style={{ width: 150 }} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" />
        <input className="input" style={{ width: 150 }} value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="Designation" />
        <input className="input" style={{ width: 150 }} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" />
        <CheckCircle2 size={16} style={{ cursor: "pointer", color: "var(--teal)" }} onClick={save} />
        <X size={16} style={{ cursor: "pointer", color: "var(--ink-soft)" }} onClick={() => setEditing(false)} />
        {error && <span style={{ color: "var(--coral)", fontSize: 12 }}>{error}</span>}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "6px 0", fontSize: 13 }}>
      <span style={{ fontWeight: 600, minWidth: 130 }}>{contact.name}</span>
      <span style={{ color: "var(--ink-soft)", minWidth: 140 }}>{contact.designation || "—"}</span>
      <span className="mono">{contact.phone}</span>
      <Pencil size={14} style={{ cursor: "pointer", color: "var(--indigo)", marginLeft: "auto" }} onClick={() => setEditing(true)} />
      <Trash2 size={14} style={{ cursor: "pointer", color: "var(--coral)" }} onClick={onDeleted} />
    </div>
  );
}

function AddContactForm({ deptId, onAdded }) {
  const [form, setForm] = useState({ name: "", designation: "", phone: "" });
  const [error, setError] = useState("");

  async function add() {
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Name and phone are required");
      return;
    }
    try {
      await api.addContact(deptId, form);
      setForm({ name: "", designation: "", phone: "" });
      setError("");
      onAdded();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 0", flexWrap: "wrap" }}>
      <input className="input" style={{ width: 150 }} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" />
      <input className="input" style={{ width: 150 }} value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="Designation (optional)" />
      <input className="input" style={{ width: 150 }} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone e.g. +91 98765 43210" />
      <button className="btn btn-outline" onClick={add}><Plus size={13} /> Add Person</button>
      {error && <span style={{ color: "var(--coral)", fontSize: 12 }}>{error}</span>}
    </div>
  );
}

function DepartmentMasterView({ onChange }) {
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTamilName, setNewTamilName] = useState("");
  const [editingDept, setEditingDept] = useState(null); // dept id being edited
  const [editForm, setEditForm] = useState({ name: "", tamil_name: "" });
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setDepts(await api.listDepartmentContacts());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addDepartment() {
    if (!newName.trim()) { setError("Department name is required"); return; }
    try {
      await api.addDepartment({ name: newName, tamil_name: newTamilName });
      setNewName("");
      setNewTamilName("");
      setAdding(false);
      setError("");
      await load();
      onChange();
    } catch (e) {
      setError(e.message);
    }
  }

  function startEditDept(d) {
    setEditingDept(d.id);
    setEditForm({ name: d.name, tamil_name: d.tamil_name || "" });
  }

  async function saveEditDept(d) {
    try {
      await api.updateDepartment(d.id, editForm);
      setEditingDept(null);
      await load();
      onChange();
    } catch (e) {
      alert(e.message);
    }
  }

  async function removeDepartment(d) {
    if (!window.confirm(`Delete "${d.name}"? This cannot be undone.`)) return;
    try {
      await api.deleteDepartment(d.id);
      await load();
      onChange();
    } catch (e) {
      alert(e.message);
    }
  }

  async function refreshAndNotify() {
    await load();
    onChange();
  }

  return (
    <div>
      <h1 style={{ fontSize: 24 }}>Departments Master</h1>
      <p style={{ color: "var(--ink-soft)", fontSize: 14, marginTop: 6, marginBottom: 22 }}>
        Each department can have multiple contact people. The Tamil name is used in the
        citizen's WhatsApp update message so it reads naturally.
      </p>

      {!adding && (
        <button className="btn btn-primary" onClick={() => setAdding(true)} style={{ marginBottom: 16 }}>
          <Plus size={14} /> Add Department
        </button>
      )}
      {adding && (
        <div className="card" style={{ maxWidth: 480, marginBottom: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Department name (English)" />
            <X size={16} style={{ cursor: "pointer", color: "var(--ink-soft)" }} onClick={() => { setAdding(false); setError(""); }} />
          </div>
          <input className="input" value={newTamilName} onChange={(e) => setNewTamilName(e.target.value)} placeholder="தமிழ் பெயர் (Tamil name, optional)" />
          <button className="btn btn-primary" style={{ alignSelf: "flex-start" }} onClick={addDepartment}><CheckCircle2 size={14} /> Save</button>
          {error && <span style={{ color: "var(--coral)", fontSize: 12 }}>{error}</span>}
        </div>
      )}
      {error && !adding && <div style={{ color: "var(--coral)", fontSize: 13, marginBottom: 10 }}>{error}</div>}

      {loading ? (
        <div className="empty"><Loader2 className="spin" size={20} /></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {depts.map((d) => (
            <div key={d.id} className="card">
              {editingDept === d.id ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <input className="input" style={{ width: 200 }} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Department name" />
                  <input className="input" style={{ width: 220 }} value={editForm.tamil_name} onChange={(e) => setEditForm({ ...editForm, tamil_name: e.target.value })} placeholder="தமிழ் பெயர்" />
                  <CheckCircle2 size={18} style={{ cursor: "pointer", color: "var(--teal)" }} onClick={() => saveEditDept(d)} />
                  <X size={18} style={{ cursor: "pointer", color: "var(--ink-soft)" }} onClick={() => setEditingDept(null)} />
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{d.name}</span>
                    {d.tamil_name && <span style={{ color: "var(--ink-soft)", fontSize: 13 }}>({d.tamil_name})</span>}
                    <span className="pill-outline" style={{ borderColor: "var(--line)", color: "var(--ink-soft)" }}>
                      {d.contacts.length} contact{d.contacts.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <Pencil size={16} style={{ cursor: "pointer", color: "var(--indigo)" }} onClick={() => startEditDept(d)} />
                    <button className="btn btn-outline" onClick={() => setExpanded(expanded === d.id ? null : d.id)}>
                      {expanded === d.id ? "Hide" : "Manage Contacts"}
                    </button>
                    <Trash2 size={16} style={{ cursor: "pointer", color: "var(--coral)" }} onClick={() => removeDepartment(d)} />
                  </div>
                </div>
              )}

              {expanded === d.id && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
                  {d.contacts.length === 0 && <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 6 }}>No contacts yet — add one below.</div>}
                  {d.contacts.map((c) => (
                    <ContactRow
                      key={c.id}
                      contact={c}
                      deptId={d.id}
                      onSaved={refreshAndNotify}
                      onDeleted={async () => { await api.deleteContact(d.id, c.id); refreshAndNotify(); }}
                    />
                  ))}
                  <div style={{ borderTop: "1px dashed var(--line)", marginTop: 6 }}>
                    <AddContactForm deptId={d.id} onAdded={refreshAndNotify} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsView() {
  const [settings, setSettings] = useState({});
  const [prefix, setPrefix] = useState("");
  const [footer, setFooter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    api.getSettings().then((s) => {
      setSettings(s);
      setPrefix(s.ref_prefix || "MLA/ME");
      setFooter(s.dept_message_footer || "");
      setLoading(false);
    });
  }, []);

  async function savePrefix() {
    await api.updateSetting("ref_prefix", prefix);
    setSaved("prefix");
    setTimeout(() => setSaved(""), 2500);
  }

  async function saveFooter() {
    await api.updateSetting("dept_message_footer", footer);
    setSaved("footer");
    setTimeout(() => setSaved(""), 2500);
  }

  if (loading) return <div className="empty"><Loader2 className="spin" size={20} /></div>;

  return (
    <div>
      <h1 style={{ fontSize: 24 }}>Settings</h1>
      <p style={{ color: "var(--ink-soft)", fontSize: 14, marginTop: 6, marginBottom: 22 }}>
        Configure the grievance reference number format and the MLA office signature note.
      </p>

      <div className="card" style={{ maxWidth: 500, display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
        <div>
          <label className="field-label">Reference Prefix</label>
          <input className="input" value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="e.g. MLA/ME" />
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 6 }}>
            Preview: <span className="mono">{prefix || "MLA/ME"}/0001</span>, <span className="mono">{prefix || "MLA/ME"}/0002</span> …
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="btn btn-primary" onClick={savePrefix}><CheckCircle2 size={14} /> Save</button>
          {saved === "prefix" && <span style={{ color: "var(--teal)", fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}><CheckCircle2 size={14} /> Saved</span>}
        </div>
      </div>

      <div className="card" style={{ maxWidth: 500, display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label className="field-label">Department WhatsApp Signature Note</label>
          <textarea
            className="input"
            rows={9}
            style={{ fontFamily: "inherit" }}
            value={footer}
            onChange={(e) => setFooter(e.target.value)}
            placeholder="Signature note appended after grievance details in the department WhatsApp message"
          />
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 6 }}>
            This is appended after the grievance details in the WhatsApp message sent to the <strong>department</strong> only — it is never sent to the citizen.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="btn btn-primary" onClick={saveFooter}><CheckCircle2 size={14} /> Save</button>
          {saved === "footer" && <span style={{ color: "var(--teal)", fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}><CheckCircle2 size={14} /> Saved</span>}
        </div>
      </div>

      <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 14, maxWidth: 500 }}>
        Note: these changes only affect new WhatsApp messages and grievances going forward — anything already sent or numbered won't change.
      </div>
    </div>
  );
}

function TrackView({ onDone }) {
  const [query, setQuery] = useState("");
  const [found, setFound] = useState(null);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);

  async function search() {
    if (!query.trim()) return;
    setBusy(true);
    setSearched(true);
    try {
      const g = await api.getByRef(query.trim());
      setFound(g);
    } catch {
      setFound(null);
    }
    setBusy(false);
  }

  async function verify(ok) {
    await api.updateStatus(
      found.id,
      ok ? "VERIFIED_CLOSED" : "REOPENED",
      ok ? "Citizen confirmed resolution" : "Citizen reported issue not resolved",
      found.name
    );
    const refreshed = await api.getByRef(found.ref);
    setFound(refreshed);
    onDone();
  }

  return (
    <div>
      <h1 style={{ fontSize: 24 }}>Track a Grievance</h1>
      <div className="card" style={{ maxWidth: 480, display: "flex", gap: 8, marginTop: 18 }}>
        <input className="input" placeholder="e.g. GRV-2026-000001" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} />
        <button className="btn btn-primary" onClick={search} disabled={busy}>
          {busy ? <Loader2 size={14} className="spin" /> : <Search size={14} />} Search
        </button>
      </div>

      {searched && !found && !busy && (
        <p style={{ marginTop: 16, color: "var(--ink-soft)", fontSize: 14 }}>No grievance found with that reference.</p>
      )}

      {found && (
        <div style={{ marginTop: 22, maxWidth: 560 }}>
          <TokenStub g={found} />
          <div className="card" style={{ marginTop: 14 }}>
            <h3 style={{ fontSize: 14, marginBottom: 12 }}>Timeline</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {found.history.map((h, i) => (
                <div key={i} style={{ display: "flex", gap: 10, fontSize: 13 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_META[h.status]?.color || "var(--ink-soft)", marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{STATUS_META[h.status]?.label || h.status}</div>
                    <div style={{ color: "var(--ink-soft)" }}>{h.note} — {h.actor}</div>
                    <div style={{ color: "var(--ink-soft)", fontSize: 11.5 }}>{new Date(h.at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
            {found.status === "RESOLVED" && (
              <div style={{ display: "flex", gap: 10, marginTop: 16, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
                <button className="btn btn-primary" onClick={() => verify(true)}><CheckCircle2 size={14} /> Confirm Resolved</button>
                <button className="btn btn-outline" onClick={() => verify(false)}><RotateCcw size={14} /> Reopen</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyticsView() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.getAnalytics().then(setData);
  }, []);

  if (!data) return <div className="empty"><Loader2 className="spin" size={20} /></div>;

  const byCategory = Object.entries(data.byCategory).map(([name, count]) => ({ name, count }));
  const byStatus = Object.entries(data.byStatus).map(([key, value]) => ({ key, name: STATUS_META[key]?.label || key, value }));
  const COLORS = ["#2B3A67", "#D98A2B", "#2F6F5E", "#BE4A2B", "#5B655F", "#1F4B40"];

  return (
    <div>
      <h1 style={{ fontSize: 24 }}>Analytics</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, margin: "20px 0 26px" }}>
        <StatCard label="Total Grievances" value={data.total} icon={Inbox} accent="var(--indigo)" />
        <StatCard label="Resolved" value={data.resolved} icon={CheckCircle2} accent="var(--teal)" />
        <StatCard label="Pending" value={data.pending} icon={Clock} accent="var(--saffron)" />
        <StatCard label="Rejected" value={data.rejected ?? 0} icon={X} accent="#8A8680" />
        <StatCard label="Avg. Resolution (days)" value={data.avgDays ?? "—"} icon={TrendingUp} accent="var(--coral)" />
      </div>

      {data.total === 0 ? (
        <div className="empty"><BarChart3 size={30} style={{ marginBottom: 8 }} /><div>No data yet — submit or import grievances to see analytics.</div></div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
          <div className="card">
            <h3 style={{ fontSize: 14, marginBottom: 14 }}>By Category</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byCategory} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--indigo)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 style={{ fontSize: 14, marginBottom: 14 }}>By Status</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label={({ value }) => `${value}`}>
                  {byStatus.map((entry, i) => <Cell key={entry.key} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div style={{ marginTop: 18, fontSize: 12.5, color: "var(--ink-soft)" }}>
        {data.bySource.ONLINE} online · {data.bySource.OFFLINE_CAMP} offline
      </div>
    </div>
  );
}

function daysBetween(start, end) {
  if (!start || !end) return null;
  const ms = new Date(end) - new Date(start);
  return Math.max(0, Math.round(ms / 86400000));
}

function csvEscape(value) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadCSV(filename, rows) {
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const ALL_STATUSES = [
  "SUBMITTED", "FORWARDED_TO_DEPT", "RECEIVED_BY_DEPT", "IN_PROGRESS",
  "RESOLVED", "VERIFIED_CLOSED", "REOPENED", "REJECTED"
];

function ReportsView({ grievances, departmentContacts }) {
  const generatedAt = new Date().toLocaleString();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [department, setDepartment] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [generated, setGenerated] = useState(false);

  const departmentNames = useMemo(() => departmentContacts.map((d) => d.name).sort(), [departmentContacts]);
  const categoryNames = useMemo(() => {
    const set = new Set(grievances.map((g) => g.category).filter(Boolean));
    return Array.from(set).sort();
  }, [grievances]);

  const filtered = useMemo(() => {
    return grievances.filter((g) => {
      const submitted = new Date(g.submitted_at);
      if (dateFrom && submitted < new Date(dateFrom + "T00:00:00")) return false;
      if (dateTo && submitted > new Date(dateTo + "T23:59:59")) return false;
      if (department !== "ALL" && g.department !== department) return false;
      if (category !== "ALL" && g.category !== category) return false;
      if (status !== "ALL" && g.status !== status) return false;
      return true;
    });
  }, [grievances, dateFrom, dateTo, department, category, status]);

  const resolvedCount = filtered.filter((g) => ["RESOLVED", "VERIFIED_CLOSED"].includes(g.status)).length;
  const pendingCount = filtered.filter((g) => ["SUBMITTED", "FORWARDED_TO_DEPT", "RECEIVED_BY_DEPT", "IN_PROGRESS", "REOPENED"].includes(g.status)).length;
  const rejectedCount = filtered.filter((g) => g.status === "REJECTED").length;

  const avgResolutionDays = useMemo(() => {
    const withRes = filtered.filter((g) => g.resolved_at && ["RESOLVED", "VERIFIED_CLOSED"].includes(g.status));
    if (withRes.length === 0) return null;
    const sum = withRes.reduce((s, g) => s + daysBetween(g.submitted_at, g.resolved_at), 0);
    return (sum / withRes.length).toFixed(1);
  }, [filtered]);

  const departmentRows = useMemo(() => {
    return departmentNames.map((name) => {
      const inDept = filtered.filter((g) => g.department === name);
      return {
        name,
        total: inDept.length,
        resolved: inDept.filter((g) => ["RESOLVED", "VERIFIED_CLOSED"].includes(g.status)).length,
        pending: inDept.filter((g) => ["FORWARDED_TO_DEPT", "RECEIVED_BY_DEPT", "IN_PROGRESS", "REOPENED"].includes(g.status)).length,
        rejected: inDept.filter((g) => g.status === "REJECTED").length
      };
    }).filter((r) => r.total > 0);
  }, [filtered, departmentNames]);

  const sortedRows = useMemo(
    () => filtered.slice().sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)),
    [filtered]
  );

  function reasonFor(g) {
    return g.status === "REJECTED" && g.latest_note ? g.latest_note : "—";
  }

  function resetFilters() {
    setDateFrom("");
    setDateTo("");
    setDepartment("ALL");
    setCategory("ALL");
    setStatus("ALL");
    setGenerated(false);
  }

  function exportCSV() {
    const rows = [];
    rows.push(["Grievance Report — Generated", generatedAt]);
    const filterNotes = [];
    if (dateFrom || dateTo) filterNotes.push(`Date: ${dateFrom || "start"} to ${dateTo || "now"}`);
    if (department !== "ALL") filterNotes.push(`Department: ${department}`);
    if (category !== "ALL") filterNotes.push(`Category: ${category}`);
    if (status !== "ALL") filterNotes.push(`Status: ${STATUS_META[status]?.label || status}`);
    if (filterNotes.length) rows.push(["Filters", filterNotes.join(" | ")]);
    rows.push([]);
    rows.push(["Summary"]);
    rows.push(["Total", "Resolved", "Pending", "Rejected", "Avg Resolution (days)"]);
    rows.push([filtered.length, resolvedCount, pendingCount, rejectedCount, avgResolutionDays ?? "—"]);
    rows.push([]);
    rows.push(["Department-wise Breakdown"]);
    rows.push(["Department", "Total", "Resolved", "Pending", "Rejected"]);
    departmentRows.forEach((r) => rows.push([r.name, r.total, r.resolved, r.pending, r.rejected]));
    rows.push([]);
    rows.push(["Grievances"]);
    rows.push(["Ref", "Name", "Ward", "Category", "Department", "Status", "Submitted", "Resolved", "Days", "Reject Reason"]);
    sortedRows.forEach((g) => {
      const isResolved = ["RESOLVED", "VERIFIED_CLOSED"].includes(g.status);
      const days = isResolved && g.resolved_at
        ? daysBetween(g.submitted_at, g.resolved_at)
        : daysBetween(g.submitted_at, new Date().toISOString());
      rows.push([
        g.ref, g.name, g.ward || "", g.category || "", g.department || "",
        STATUS_META[g.status]?.label || g.status,
        new Date(g.submitted_at).toLocaleDateString(),
        g.resolved_at ? new Date(g.resolved_at).toLocaleDateString() : "",
        days,
        reasonFor(g)
      ]);
    });

    downloadCSV(`grievance-report-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24 }}>Grievance Report</h1>
          <p style={{ color: "var(--ink-soft)", fontSize: 13, marginTop: 6 }}>Generated on {generatedAt}</p>
        </div>
        {generated && (
          <div className="no-print" style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-outline" onClick={() => window.print()}><Printer size={14} /> Print / Save as PDF</button>
            <button className="btn btn-primary" onClick={exportCSV}><Download size={14} /> Download CSV</button>
          </div>
        )}
      </div>

      <div className="card no-print" style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div>
            <label className="field-label">From Date</label>
            <input type="date" className="input" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setGenerated(false); }} />
          </div>
          <div>
            <label className="field-label">To Date</label>
            <input type="date" className="input" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setGenerated(false); }} />
          </div>
          <div>
            <label className="field-label">Department</label>
            <select className="input" style={{ width: 200 }} value={department} onChange={(e) => { setDepartment(e.target.value); setGenerated(false); }}>
              <option value="ALL">All Departments</option>
              {departmentNames.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Category</label>
            <select className="input" style={{ width: 200 }} value={category} onChange={(e) => { setCategory(e.target.value); setGenerated(false); }}>
              <option value="ALL">All Categories</option>
              {categoryNames.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Status</label>
            <select className="input" style={{ width: 190 }} value={status} onChange={(e) => { setStatus(e.target.value); setGenerated(false); }}>
              <option value="ALL">All Statuses</option>
              {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s]?.label || s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-primary" onClick={() => setGenerated(true)}><FileText size={14} /> Generate Report</button>
          <button className="btn btn-outline" onClick={resetFilters}>Reset Filters</button>
        </div>
      </div>

      {!generated && (
        <div className="empty" style={{ marginTop: 30 }}>
          <FileText size={30} style={{ marginBottom: 8 }} />
          <div>Choose your filters above and click <strong>Generate Report</strong> to view results.</div>
        </div>
      )}

      {generated && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, margin: "22px 0 26px" }}>
            <StatCard label="Total Grievances" value={filtered.length} icon={Inbox} accent="var(--indigo)" />
            <StatCard label="Resolved" value={resolvedCount} icon={CheckCircle2} accent="var(--teal)" />
            <StatCard label="Pending" value={pendingCount} icon={Clock} accent="var(--saffron)" />
            <StatCard label="Rejected" value={rejectedCount} icon={X} accent="#8A8680" />
            <StatCard label="Avg. Resolution (days)" value={avgResolutionDays ?? "—"} icon={TrendingUp} accent="var(--coral)" />
          </div>

          <h3 style={{ fontSize: 15, marginBottom: 10 }}>Department-wise Breakdown</h3>
          <div className="card" style={{ padding: 0, overflow: "auto", marginBottom: 26 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--bg)", textAlign: "left" }}>
                  {["Department", "Total", "Resolved", "Pending", "Rejected"].map((h) => (
                    <th key={h} style={{ padding: "9px 12px", borderBottom: "1px solid var(--line)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {departmentRows.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: 14, textAlign: "center", color: "var(--ink-soft)" }}>No grievances match these filters</td></tr>
                )}
                {departmentRows.map((r) => (
                  <tr key={r.name} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 600 }}>{r.name}</td>
                    <td style={{ padding: "8px 12px" }}>{r.total}</td>
                    <td style={{ padding: "8px 12px", color: "var(--teal)" }}>{r.resolved}</td>
                    <td style={{ padding: "8px 12px", color: "var(--saffron)" }}>{r.pending}</td>
                    <td style={{ padding: "8px 12px", color: "var(--coral)" }}>{r.rejected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 style={{ fontSize: 15, marginBottom: 10 }}>Grievances ({sortedRows.length})</h3>
          <div className="card" style={{ padding: 0, overflow: "auto", maxHeight: 420 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: "var(--bg)", textAlign: "left" }}>
                  {["Ref", "Name", "Ward", "Category", "Department", "Status", "Submitted", "Resolved", "Days"].map((h) => (
                    <th key={h} style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRows.length === 0 && (
                  <tr><td colSpan={9} style={{ padding: 14, textAlign: "center", color: "var(--ink-soft)" }}>No grievances match these filters</td></tr>
                )}
                {sortedRows.map((g) => {
                  const isResolved = ["RESOLVED", "VERIFIED_CLOSED"].includes(g.status);
                  const days = isResolved && g.resolved_at
                    ? daysBetween(g.submitted_at, g.resolved_at)
                    : daysBetween(g.submitted_at, new Date().toISOString());
                  return (
                    <tr key={g.id} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td className="mono" style={{ padding: "7px 10px" }}>{g.ref}</td>
                      <td style={{ padding: "7px 10px" }}>{g.name}</td>
                      <td style={{ padding: "7px 10px" }}>{g.ward || "—"}</td>
                      <td style={{ padding: "7px 10px" }}>{g.category || "—"}</td>
                      <td style={{ padding: "7px 10px" }}>{g.department || "—"}</td>
                      <td style={{ padding: "7px 10px" }}>
                        <span className="pill" style={{ background: STATUS_META[g.status]?.color || "var(--ink-soft)" }}>
                          {STATUS_META[g.status]?.label || g.status}
                        </span>
                      </td>
                      <td style={{ padding: "7px 10px" }}>{new Date(g.submitted_at).toLocaleDateString()}</td>
                      <td style={{ padding: "7px 10px" }}>{g.resolved_at ? new Date(g.resolved_at).toLocaleDateString() : "—"}</td>
                      <td style={{ padding: "7px 10px" }}>{days}{isResolved ? "" : " (ongoing)"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
