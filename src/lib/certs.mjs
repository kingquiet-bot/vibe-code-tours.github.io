// Single source of truth for Anthropic Skilljar certifications.
// Imported by: src/content.config.ts (schema), src/components/BuilderCard.astro
// (render), scripts/verify-certs.mjs (CI reachability), scripts/validate-builders.mjs.
//
// Builders declare earned certs as a `certs:` map in frontmatter:
//   certs:
//     claude_101:      293x3v9qydhx
//     claude_code_101: https://verify.skilljar.com/c/sbdx5cwzjhec
// Value may be the bare Skilljar code OR the full verify URL — both normalize
// to the bare code. Unknown cert ids still render (with a default label/level).

export const SKILLJAR_VERIFY_BASE = "https://verify.skilljar.com/c/";

// Catalog of certs relevant to THIS bootcamp (the Claude Code / MCP / agents
// developer path) — not the full Anthropic Skilljar catalog. id = snake_case slug.
// level drives the badge color. order controls left-to-right display.
// Unknown ids a builder adds still render (default label/level) — see certMeta().
export const CERT_CATALOG = {
  claude_101: { label: "Claude 101", level: "beginner", order: 1 },
  claude_code_101: { label: "Claude Code 101", level: "beginner", order: 2 },
  mcp_intro: { label: "Intro to MCP", level: "beginner", order: 3 },
  agent_skills_intro: { label: "Intro to Agent Skills", level: "intermediate", order: 4 },
  subagents_intro: { label: "Intro to Subagents", level: "intermediate", order: 5 },
  claude_code_in_action: { label: "Claude Code in Action", level: "intermediate", order: 6 },
  mcp_advanced: { label: "MCP: Advanced Topics", level: "advanced", order: 7 },
  building_claude_api: { label: "Building with the Claude API", level: "advanced", order: 8 },
};

// Always-shown core slots (rendered grey when not earned).
export const CORE_CERTS = ["claude_101", "claude_code_101"];

// Level → badge color. Warm amber→gold ramp by rigor; specialized = orange accent.
export const LEVEL_COLORS = {
  foundational: "#d97706", // deep amber (entry)
  beginner: "#f59e0b", // amber
  intermediate: "#fbbf24", // amber-bright
  advanced: "#fde047", // gold (highest rigor)
  specialized: "#f97316", // orange (side track)
};
export const CERT_GREY = "#3f3f46"; // unearned

// Skilljar verification codes seen so far are ~12 lowercase alphanumerics.
// Be tolerant: 6–24 alphanumerics.
const CODE_RE = /^[A-Za-z0-9]{6,24}$/;

// Extract the bare verification code from a code, a verify URL, or a [md](url).
export function normalizeSkilljar(v) {
  if (v == null) return "";
  let t = String(v).trim();
  if (!t) return "";
  const link = t.match(/^\[[^\]]*\]\(([^)]*)\)$/); // [text](url)
  if (link) t = link[1].trim();
  const m = t.match(/skilljar\.com\/c\/([A-Za-z0-9]+)/i); // full verify URL
  if (m) t = m[1];
  t = t.replace(/\/+$/, "");
  return CODE_RE.test(t) ? t : "";
}

export const skilljarUrl = (code) => SKILLJAR_VERIFY_BASE + code;

export function certMeta(id) {
  return (
    CERT_CATALOG[id] || {
      label: id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      level: "beginner",
      order: 99,
    }
  );
}

export const certColor = (level) => LEVEL_COLORS[level] || LEVEL_COLORS.beginner;

// Normalize a raw `certs` frontmatter value into { id: code } with valid codes only.
export function normalizeCerts(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const out = {};
  for (const [id, val] of Object.entries(raw)) {
    const code = normalizeSkilljar(val);
    if (code) out[String(id).trim()] = code;
  }
  return Object.keys(out).length ? out : undefined;
}

// Ordered display list: core certs first (earned or grey), then any extra earned.
// Returns [{ id, label, level, color, code, url, earned }].
export function certDisplayList(certs) {
  const earned = certs && typeof certs === "object" ? certs : {};
  const ids = [...CORE_CERTS];
  for (const id of Object.keys(earned)) if (!ids.includes(id)) ids.push(id);
  // keep extras in catalog order
  const extras = ids.slice(CORE_CERTS.length).sort((a, b) => certMeta(a).order - certMeta(b).order);
  const ordered = [...CORE_CERTS, ...extras];
  return ordered.map((id) => {
    const meta = certMeta(id);
    const code = earned[id];
    return {
      id,
      label: meta.label,
      level: meta.level,
      earned: !!code,
      code: code || null,
      color: code ? certColor(meta.level) : CERT_GREY,
      url: code ? skilljarUrl(code) : null,
    };
  });
}
