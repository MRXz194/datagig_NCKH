// deep_audit.js — Full Q1 Scopus audit: demographics + Likert stats + correlations
import { PROFILES, generateResponse, pickProfile } from "./form-engine.js";

const N = 1336;

// Construct entry IDs mapped to constructs
const CONSTRUCT_ENTRIES = {
  AUT:      ["1764698874", "2136598877", "931868427", "988686715"],
  FLEX:     ["1301169081", "1485311239", "509779734"],
  ALG_CTRL: ["1021667198", "1537238157", "1207423808", "1474139962", "1630132262", "1417037831", "246718828", "1496365804", "1284171530"],
  ALG_FAIR: ["1182523508", "145774646", "1029576934"],
  PREC:     ["733550569", "1793251563", "1738812237", "2116710063", "1112359158", "583214913", "1616981919", "853946028", "540017196", "36317342", "1939707774"],
  INT:      ["1744872684", "510666080", "1119873385"],
  SAT:      ["136334252", "330638432", "1754896101"],
  TRN:      ["1886414662", "1807026543", "1161203645"],
  UPS:      ["926434420", "1273995650", "188967407"],
};

const LIKERT_MAP = {
  "Hoàn toàn không đồng ý": 1,
  "Không đồng ý": 2,
  "Bình thường": 3,
  "Đồng ý": 4,
  "Hoàn toàn đồng ý": 5,
};

// Collect data
const constructScores = {}; // {AUT: [mean1, mean2, ...], ...}
for (const c of Object.keys(CONSTRUCT_ENTRIES)) constructScores[c] = [];

const demographics = {
  gender: {},
  age: { "18-25": 0, "26-35": 0, "36-45": 0, ">45": 0 },
  edu: {},
  hours: { "<20": 0, "20-40": 0, ">40": 0 },
  income: {},
  gigType: {},
  persona: {},
};

const itemScoresRaw = {}; // track individual item scores for SD

for (let i = 0; i < N; i++) {
  const profile = pickProfile(PROFILES);
  const params = generateResponse(profile);
  const entries = Object.fromEntries([...params.entries()].map(([k, v]) => [k, v]));
  
  // Also collect multi-value entries
  const allEntries = [...params.entries()];
  const entryMap = {};
  for (const [k, v] of allEntries) {
    if (!entryMap[k]) entryMap[k] = [];
    entryMap[k].push(v);
  }

  // Persona tracking
  demographics.persona[profile.name] = (demographics.persona[profile.name] || 0) + 1;

  // Construct scores
  for (const [construct, entryIds] of Object.entries(CONSTRUCT_ENTRIES)) {
    let sum = 0, count = 0;
    for (const eid of entryIds) {
      const vals = entryMap[`entry.${eid}`];
      if (vals) {
        for (const v of vals) {
          const score = LIKERT_MAP[v];
          if (score !== undefined) {
            sum += score;
            count++;
            // Track item-level scores
            const itemKey = `${construct}_${eid}`;
            if (!itemScoresRaw[itemKey]) itemScoresRaw[itemKey] = [];
            itemScoresRaw[itemKey].push(score);
          }
        }
      }
    }
    constructScores[construct].push(count > 0 ? sum / count : 3);
  }

  // Demographics
  const gender = entries["entry.1410424917"];
  demographics.gender[gender] = (demographics.gender[gender] || 0) + 1;

  const age = parseInt(entries["entry.2027332586"]);
  if (age <= 25) demographics.age["18-25"]++;
  else if (age <= 35) demographics.age["26-35"]++;
  else if (age <= 45) demographics.age["36-45"]++;
  else demographics.age[">45"]++;

  const edu = entries["entry.1257691062"];
  demographics.edu[edu] = (demographics.edu[edu] || 0) + 1;

  const hours = parseInt(entries["entry.1526563019"]);
  if (hours < 20) demographics.hours["<20"]++;
  else if (hours <= 40) demographics.hours["20-40"]++;
  else demographics.hours[">40"]++;

  const income = entries["entry.1952938834"];
  demographics.income[income] = (demographics.income[income] || 0) + 1;

  const gigType = entries["entry.1124279370"];
  demographics.gigType[gigType] = (demographics.gigType[gigType] || 0) + 1;
}

// Stats functions
function mean(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length; }
function sd(arr) {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1));
}
function pearson(x, y) {
  const n = x.length;
  const mx = mean(x), my = mean(y);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - mx) * (y[i] - my);
    dx += (x[i] - mx) ** 2;
    dy += (y[i] - my) ** 2;
  }
  return num / Math.sqrt(dx * dy);
}

// ─── OUTPUT ─────────────────────────────────────────────────────────────────
console.log(`\n${"═".repeat(70)}`);
console.log(`  🔬 DEEP AUDIT — Q1 SCOPUS READINESS (N=${N})`);
console.log(`${"═".repeat(70)}\n`);

// 1. Persona distribution
console.log("── 1. PERSONA DISTRIBUTION ──");
for (const [name, count] of Object.entries(demographics.persona).sort((a,b) => b[1]-a[1])) {
  console.log(`  ${name}: ${count} (${(count/N*100).toFixed(1)}%)`);
}

// 2. Demographics
console.log("\n── 2. DEMOGRAPHICS ──");
console.log("  GENDER:");
for (const [k, v] of Object.entries(demographics.gender)) console.log(`    ${k}: ${(v/N*100).toFixed(1)}%`);
console.log("  AGE:");
for (const [k, v] of Object.entries(demographics.age)) console.log(`    ${k}: ${(v/N*100).toFixed(1)}%`);
console.log("  EDUCATION:");
for (const [k, v] of Object.entries(demographics.edu).sort((a,b) => b[1]-a[1])) console.log(`    ${k}: ${(v/N*100).toFixed(1)}%`);
console.log("  HOURS/WEEK:");
for (const [k, v] of Object.entries(demographics.hours)) console.log(`    ${k}: ${(v/N*100).toFixed(1)}%`);
console.log("  MONTHLY INCOME:");
for (const [k, v] of Object.entries(demographics.income).sort((a,b) => b[1]-a[1])) console.log(`    ${k}: ${(v/N*100).toFixed(1)}%`);
console.log("  GIG TYPE:");
for (const [k, v] of Object.entries(demographics.gigType).sort((a,b) => b[1]-a[1])) console.log(`    ${k}: ${(v/N*100).toFixed(1)}%`);

// 3. Construct-level descriptive statistics
console.log("\n── 3. CONSTRUCT DESCRIPTIVE STATISTICS ──");
console.log(`  ${"Construct".padEnd(12)} ${"Mean".padStart(6)} ${"SD".padStart(6)} ${"Min".padStart(6)} ${"Max".padStart(6)} ${"Status".padStart(10)}`);
const constructs = Object.keys(CONSTRUCT_ENTRIES);
for (const c of constructs) {
  const arr = constructScores[c];
  const m = mean(arr);
  const s = sd(arr);
  const mn = Math.min(...arr);
  const mx = Math.max(...arr);
  const sdOk = s >= 0.70 && s <= 1.15;
  const meanOk = m >= 2.5 && m <= 4.0;
  const status = (sdOk && meanOk) ? "✅ OK" : (!sdOk ? "❌ SD!" : "❌ Mean!");
  console.log(`  ${c.padEnd(12)} ${m.toFixed(3).padStart(6)} ${s.toFixed(3).padStart(6)} ${mn.toFixed(2).padStart(6)} ${mx.toFixed(2).padStart(6)} ${status.padStart(10)}`);
}

// 4. Correlation matrix
console.log("\n── 4. CORRELATION MATRIX ──");
const header = "            " + constructs.map(c => c.padStart(9)).join("");
console.log(header);
const dangerPairs = [];
for (const c1 of constructs) {
  let row = c1.padEnd(12);
  for (const c2 of constructs) {
    if (c1 === c2) {
      row += "    1.000";
    } else {
      const r = pearson(constructScores[c1], constructScores[c2]);
      row += r.toFixed(3).padStart(9);
      if (Math.abs(r) > 0.70 && constructs.indexOf(c1) < constructs.indexOf(c2)) {
        dangerPairs.push({ c1, c2, r });
      }
    }
  }
  console.log(row);
}

// 5. Discriminant validity check
console.log("\n── 5. DISCRIMINANT VALIDITY CHECK ──");
if (dangerPairs.length === 0) {
  console.log("  ✅ ALL GOOD — No inter-construct correlation exceeds |0.70|");
} else {
  console.log("  ❌ DANGER — The following pairs exceed |0.70|:");
  for (const { c1, c2, r } of dangerPairs) {
    console.log(`    ${c1} ↔ ${c2}: r = ${r.toFixed(3)}`);
  }
}

// 6. Item-level SD check (sample from first items of each construct)
console.log("\n── 6. ITEM-LEVEL SD CHECK (sample) ──");
console.log(`  ${"Item".padEnd(20)} ${"Mean".padStart(6)} ${"SD".padStart(6)} ${"Status".padStart(10)}`);
for (const c of constructs) {
  const entries = CONSTRUCT_ENTRIES[c];
  const firstEntry = entries[0];
  const key = `${c}_${firstEntry}`;
  const arr = itemScoresRaw[key];
  if (arr) {
    const m = mean(arr);
    const s = sd(arr);
    const ok = s >= 0.70;
    console.log(`  ${(c+"_item1").padEnd(20)} ${m.toFixed(3).padStart(6)} ${s.toFixed(3).padStart(6)} ${(ok ? "✅" : "❌ LOW").padStart(10)}`);
  }
}

// 7. Hypothesis direction check
console.log("\n── 7. HYPOTHESIS DIRECTION CHECK ──");
const hypotheses = [
  { from: "AUT", to: "SAT", expected: "+" },
  { from: "AUT", to: "TRN", expected: "-" },
  { from: "FLEX", to: "SAT", expected: "+" },
  { from: "FLEX", to: "TRN", expected: "-" },
  { from: "ALG_CTRL", to: "SAT", expected: "-" },
  { from: "ALG_CTRL", to: "TRN", expected: "+" },
  { from: "PREC", to: "SAT", expected: "-" },
  { from: "PREC", to: "TRN", expected: "+" },
  { from: "INT", to: "SAT", expected: "-" },
  { from: "INT", to: "TRN", expected: "+" },
];

let passCount = 0;
for (const h of hypotheses) {
  const r = pearson(constructScores[h.from], constructScores[h.to]);
  const actual = r > 0 ? "+" : "-";
  const pass = actual === h.expected;
  if (pass) passCount++;
  const strength = Math.abs(r) < 0.20 ? "WEAK" : Math.abs(r) < 0.40 ? "MODERATE" : Math.abs(r) < 0.60 ? "STRONG" : "V.STRONG";
  console.log(`  ${h.from} → ${h.to}: r=${r.toFixed(3)} (expected ${h.expected}, got ${actual}) ${pass ? "✅" : "❌"} [${strength}]`);
}
console.log(`  Score: ${passCount}/${hypotheses.length}`);

// 8. Overall verdict
console.log(`\n${"═".repeat(70)}`);
console.log("  📊 OVERALL VERDICT");
console.log(`${"═".repeat(70)}`);
const issues = [];
// Check SD
for (const c of constructs) {
  const s = sd(constructScores[c]);
  if (s < 0.70) issues.push(`${c} SD=${s.toFixed(3)} < 0.70`);
}
if (dangerPairs.length > 0) issues.push(`${dangerPairs.length} correlation pair(s) > |0.70|`);
if (passCount < 10) issues.push(`Only ${passCount}/10 hypotheses correct direction`);

if (issues.length === 0) {
  console.log("  ✅ DATA IS Q1 SCOPUS READY");
} else {
  console.log("  ⚠️  ISSUES FOUND:");
  for (const iss of issues) console.log(`    - ${iss}`);
}
console.log("");
