const { get } = require("../db");

async function getRefPrefix() {
  const row = await get("SELECT value FROM settings WHERE key = 'ref_prefix'");
  return row ? row.value : "MLA/ME";
}

// Produces e.g. "MLA/ME/0001" — sequence based on total grievances so far, zero-padded to 4 digits
async function nextRef() {
  const prefix = await getRefPrefix();
  const count = (await get("SELECT COUNT(*) as c FROM grievances")).c;
  return `${prefix}/${String(count + 1).padStart(4, "0")}`;
}

module.exports = { nextRef, getRefPrefix };
