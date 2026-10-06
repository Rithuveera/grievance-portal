const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  listGrievances: () => fetch(`${BASE}/api/grievances`).then(handle),
  getDepartments: () => fetch(`${BASE}/api/grievances/meta/departments`).then(handle),
  submitGrievance: (data) =>
    fetch(`${BASE}/api/grievances`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(handle),
  forwardGrievance: (id, department, actor) =>
    fetch(`${BASE}/api/grievances/${id}/forward`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ department, actor })
    }).then(handle),
  rejectGrievance: (id, reason, actor) =>
    fetch(`${BASE}/api/grievances/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, actor })
    }).then(handle),
  updatePriority: (id, priority, actor) =>
    fetch(`${BASE}/api/grievances/${id}/priority`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority, actor })
    }).then(handle),
  deleteGrievance: (id) =>
    fetch(`${BASE}/api/grievances/${id}`, { method: "DELETE" }).then(handle),
  updateStatus: (id, status, note, actor) =>
    fetch(`${BASE}/api/grievances/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note, actor })
    }).then(handle),
  getByRef: (ref) => fetch(`${BASE}/api/grievances/ref/${encodeURIComponent(ref)}`).then(handle),
  previewBatch: (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return fetch(`${BASE}/api/batches/preview`, { method: "POST", body: fd }).then(handle);
  },
  confirmBatch: (fileName, rows) =>
    fetch(`${BASE}/api/batches/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName, rows })
    }).then(handle),
  listBatches: () => fetch(`${BASE}/api/batches`).then(handle),
  getAnalytics: () => fetch(`${BASE}/api/analytics`).then(handle),

  listDepartmentContacts: () => fetch(`${BASE}/api/departments`).then(handle),
  addDepartment: (data) =>
    fetch(`${BASE}/api/departments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(handle),
  updateDepartment: (id, data) =>
    fetch(`${BASE}/api/departments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(handle),
  deleteDepartment: (id) => fetch(`${BASE}/api/departments/${id}`, { method: "DELETE" }).then(handle),

  addContact: (deptId, data) =>
    fetch(`${BASE}/api/departments/${deptId}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(handle),
  updateContact: (deptId, contactId, data) =>
    fetch(`${BASE}/api/departments/${deptId}/contacts/${contactId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(handle),
  deleteContact: (deptId, contactId) =>
    fetch(`${BASE}/api/departments/${deptId}/contacts/${contactId}`, { method: "DELETE" }).then(handle),

  getSettings: () => fetch(`${BASE}/api/settings`).then(handle),
  updateSetting: (key, value) =>
    fetch(`${BASE}/api/settings/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value })
    }).then(handle)
};
