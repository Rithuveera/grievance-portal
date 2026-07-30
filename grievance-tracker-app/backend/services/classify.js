const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const FALLBACK_DEPARTMENT = "General Administration";

// Keyword hints for common default department names — used when there's no API key,
// or the API call fails, so grievances still get a sensible category instead of
// always landing in General Administration.
const KEYWORD_MAP = {
  "Roads & Infrastructure": ["road", "pothole", "street light", "streetlight", "footpath", "bridge", "highway", "pavement", "tar road", "culvert"],
  "Water Supply": ["water", "pipe", "pipeline", "leak", "tap", "borewell", "drinking water", "overhead tank", "water tank"],
  "Electricity": ["power cut", "electricity", "current", "transformer", "wire", "voltage", "power supply", "meter box", "short circuit"],
  "Health": ["hospital", "doctor", "medicine", "health", "clinic", "ambulance", "phc", "nurse"],
  "Education": ["school", "teacher", "college", "student", "education", "exam", "classroom", "midday meal"],
  "Land & Revenue": ["land", "patta", "survey number", "revenue", "property", "boundary", "encroachment", "certificate"],
  "Sanitation": ["garbage", "waste", "drainage", "sewage", "toilet", "cleaning", "drain", "dustbin", "trash"],
  "Public Safety": ["crime", "police", "accident", "safety", "theft", "violence", "harassment", "streetlight safety"],
  "General Administration": []
};

const URGENT_WORDS = ["emergency", "urgent", "fire", "accident", "danger", "death", "died", "serious", "collapse", "electrocution"];

function keywordFallback(description, names) {
  const text = (description || "").toLowerCase();

  let best = null;
  let bestScore = 0;
  for (const [defName, keywords] of Object.entries(KEYWORD_MAP)) {
    if (!names.includes(defName)) continue;
    const score = keywords.filter((k) => text.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      best = defName;
    }
  }

  const category = best || (names.includes(FALLBACK_DEPARTMENT) ? FALLBACK_DEPARTMENT : names[0]);
  const priority = URGENT_WORDS.some((w) => text.includes(w)) ? "URGENT" : "MEDIUM";
  return { category, priority };
}

async function classifyGrievance(description, departmentNames) {
  const names = departmentNames && departmentNames.length ? departmentNames : [FALLBACK_DEPARTMENT];

  if (!process.env.ANTHROPIC_API_KEY) {
    return keywordFallback(description, names);
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: `Classify this citizen grievance into one department and a priority level.
Departments: ${names.join(", ")}.
Priority: ${PRIORITIES.join(", ")} (URGENT = safety risk or health emergency).
Grievance: "${description}"
Respond ONLY with raw JSON, no markdown fences, exact format: {"category":"...","priority":"..."}`
          }
        ]
      })
    });

    if (!response.ok) {
      console.error("Anthropic API error:", response.status, await response.text());
      return keywordFallback(description, names);
    }

    const data = await response.json();
    const text = (data.content || []).map((b) => b.text || "").join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    if (!names.includes(parsed.category)) {
      return keywordFallback(description, names);
    }
    const priority = PRIORITIES.includes((parsed.priority || "").toUpperCase())
      ? parsed.priority.toUpperCase()
      : "MEDIUM";

    return { category: parsed.category, priority };
  } catch (err) {
    console.error("Classification failed:", err.message);
    return keywordFallback(description, names);
  }
}

module.exports = { classifyGrievance, PRIORITIES };
