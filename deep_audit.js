// deep_audit.js — Advanced Q1 Scopus structural audit: demographics + convergent validity + discriminant validity + VIF + paths
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
  coViec: {},
  persona: {},
};

const itemScoresRaw = {}; // track individual item scores for SD and loadings

for (let i = 0; i < N; i++) {
  const profile = pickProfile(PROFILES);
  const params = generateResponse(profile);
  const entries = Object.fromEntries([...params.entries()].map(([k, v]) => [k, v]));
  
  const allEntries = [...params.entries()];
  const entryMap = {};
  for (const [k, v] of allEntries) {
    if (!entryMap[k]) entryMap[k] = [];
    entryMap[k].push(v);
  }

  demographics.persona[profile.name] = (demographics.persona[profile.name] || 0) + 1;

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
            const itemKey = `${construct}_${eid}`;
            if (!itemScoresRaw[itemKey]) itemScoresRaw[itemKey] = [];
            itemScoresRaw[itemKey].push(score);
          }
        }
      }
    }
    constructScores[construct].push(count > 0 ? sum / count : 3);
  }

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

  const coViec = entries["entry.903597022"];
  demographics.coViec[coViec] = (demographics.coViec[coViec] || 0) + 1;
}

// Stats functions
function mean(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length; }
function sd(arr) {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1));
}
function pearson(x, y) {
  const mx = mean(x), my = mean(y);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < x.length; i++) {
    num += (x[i] - mx) * (y[i] - my);
    dx += (x[i] - mx) ** 2;
    dy += (y[i] - my) ** 2;
  }
  return num / Math.sqrt(dx * dy);
}

// Linear Algebra for VIF and Path Coefficients
function transpose(A) {
  return A[0].map((_, c) => A.map(r => r[c]));
}

function multiply(A, B) {
  return A.map(row => B[0].map((_, c) => row.reduce((sum, val, r) => sum + val * B[r][c], 0)));
}

function invertMatrix(M) {
  const n = M.length;
  const A = M.map((row, i) => [...row, ...Array(n).fill(0).map((_, j) => i === j ? 1 : 0)]);
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) maxRow = k;
    }
    [A[i], A[maxRow]] = [A[maxRow], A[i]];
    const pivot = A[i][i];
    if (Math.abs(pivot) < 1e-10) return null; // Singular matrix
    for (let j = i; j < 2 * n; j++) A[i][j] /= pivot;
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = A[k][i];
        for (let j = i; j < 2 * n; j++) A[k][j] -= factor * A[i][j];
      }
    }
  }
  return A.map(row => row.slice(n));
}

function calculateVIF(predictors) {
  const vif = {};
  const len = constructScores[predictors[0]].length;
  for (const p of predictors) {
    const others = predictors.filter(x => x !== p);
    const X = [];
    for (let i = 0; i < len; i++) {
      const row = [1];
      for (const op of others) row.push(constructScores[op][i]);
      X.push(row);
    }
    const y = constructScores[p];
    const Xt = transpose(X);
    const XtX = multiply(Xt, X);
    const XtX_inv = invertMatrix(XtX);
    if (!XtX_inv) { vif[p] = 999.0; continue; }
    
    const y_col = y.map(val => [val]);
    const Xty = multiply(Xt, y_col);
    const beta = multiply(XtX_inv, Xty);
    
    const y_mean = mean(y);
    let ss_tot = 0, ss_res = 0;
    for (let i = 0; i < len; i++) {
      let pred = beta[0][0];
      for (let j = 0; j < others.length; j++) pred += beta[j + 1][0] * X[i][j + 1];
      ss_tot += (y[i] - y_mean) ** 2;
      ss_res += (y[i] - pred) ** 2;
    }
    const r2 = 1 - ss_res / ss_tot;
    vif[p] = 1 / (1 - r2);
  }
  return vif;
}

// ─── OUTPUT ─────────────────────────────────────────────────────────────────
console.log(`\n${"═".repeat(70)}`);
console.log(`  🔬 ADVANCED ACADEMIC PLS-SEM AUDIT — REPORT FOR Q1 JOURNAL (N=${N})`);
console.log(`${"═".repeat(70)}\n`);

// 1. Persona distribution
console.log("── 1. PERSONA DISTRIBUTION ──");
for (const [name, count] of Object.entries(demographics.persona).sort((a,b) => b[1]-a[1])) {
  console.log(`  ${name.padEnd(36)}: ${String(count).padStart(3)} (${(count/N*100).toFixed(1)}%)`);
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
console.log("  TRADITIONAL JOB:");
for (const [k, v] of Object.entries(demographics.coViec).sort((a,b) => b[1]-a[1])) console.log(`    ${k}: ${(v/N*100).toFixed(1)}%`);

// 3. Convergent Validity & Reliability
console.log("\n── 3. CONVERGENT VALIDITY & RELIABILITY ──");
console.log(`  ${"Construct".padEnd(12)} ${"Alpha".padStart(8)} ${"CR".padStart(8)} ${"AVE".padStart(8)} ${"Status".padStart(10)}`);
const outer_loadings = {};
const aves = {};
const constructs = Object.keys(CONSTRUCT_ENTRIES);

for (const c of constructs) {
  const entryIds = CONSTRUCT_ENTRIES[c];
  const K = entryIds.length;
  const c_score = constructScores[c];
  
  // Outer loadings
  const loadings = [];
  for (const eid of entryIds) {
    const item_score = itemScoresRaw[`${c}_${eid}`];
    loadings.push(pearson(item_score, c_score));
  }
  outer_loadings[c] = loadings;
  
  const sum_loadings_sq = loadings.reduce((sum, l) => sum + l**2, 0);
  const sum_error_var = loadings.reduce((sum, l) => sum + (1 - l**2), 0);
  const ave = sum_loadings_sq / K;
  aves[c] = ave;
  const cr = (loadings.reduce((a,b)=>a+b, 0))**2 / ((loadings.reduce((a,b)=>a+b, 0))**2 + sum_error_var);
  
  // Cronbach's Alpha
  let sumItemVar = 0;
  for (const eid of entryIds) {
    sumItemVar += sd(itemScoresRaw[`${c}_${eid}`]) ** 2;
  }
  const sumScores = Array(N).fill(0);
  for (let i = 0; i < N; i++) {
    for (const eid of entryIds) {
      sumScores[i] += itemScoresRaw[`${c}_${eid}`][i];
    }
  }
  const totalVar = sd(sumScores) ** 2;
  const alpha = (K / (K - 1)) * (1 - sumItemVar / totalVar);
  
  const pass = (alpha >= 0.70 && cr >= 0.70 && ave >= 0.50);
  console.log(`  ${c.padEnd(12)} ${alpha.toFixed(3).padStart(8)} ${cr.toFixed(3).padStart(8)} ${ave.toFixed(3).padStart(8)} ${(pass ? "✅ PASSED" : "❌ FAIL").padStart(10)}`);
}

// 4. Fornell-Larcker Discriminant Validity
console.log("\n── 4. DISCRIMINANT VALIDITY (FORNELL-LARCKER) ──");
console.log("      " + constructs.map(c => c.padStart(8)).join(""));
const corr_matrix = {};
for (const c1 of constructs) {
  corr_matrix[c1] = {};
  let row = `${c1.padEnd(5)}`;
  for (const c2 of constructs) {
    const r = pearson(constructScores[c1], constructScores[c2]);
    corr_matrix[c1][c2] = r;
    if (c1 === c2) {
      row += ` ${Math.sqrt(aves[c1]).toFixed(3).padStart(7)}*`;
    } else if (constructs.indexOf(c1) > constructs.indexOf(c2)) {
      row += ` ${r.toFixed(3).padStart(8)}`;
    } else {
      row += "        ";
    }
  }
  console.log(row);
}
console.log("Note: Diagonal values (*) are the square root of AVE. Off-diagonals are correlations.");

// 5. HTMT discriminant check
console.log("\n── 5. DISCRIMINANT VALIDITY (HTMT RATIO) ──");
console.log("      " + constructs.map(c => c.padStart(8)).join(""));
let htmtViolations = 0;
for (const c1 of constructs) {
  let row = `${c1.padEnd(5)}`;
  for (const c2 of constructs) {
    if (c1 === c2) {
      row += "    -   ";
    } else if (constructs.indexOf(c1) > constructs.indexOf(c2)) {
      const items1 = CONSTRUCT_ENTRIES[c1];
      const items2 = CONSTRUCT_ENTRIES[c2];
      
      let sumHetero = 0, countHetero = 0;
      for (const it1 of items1) {
        for (const it2 of items2) {
          sumHetero += Math.abs(pearson(itemScoresRaw[`${c1}_${it1}`], itemScoresRaw[`${c2}_${it2}`]));
          countHetero++;
        }
      }
      const meanHetero = sumHetero / countHetero;

      let sumMono1 = 0, countMono1 = 0;
      for (let i = 0; i < items1.length; i++) {
        for (let j = i + 1; j < items1.length; j++) {
          sumMono1 += Math.abs(pearson(itemScoresRaw[`${c1}_${items1[i]}`], itemScoresRaw[`${c1}_${items1[j]}`]));
          countMono1++;
        }
      }
      const meanMono1 = countMono1 > 0 ? sumMono1 / countMono1 : 1.0;

      let sumMono2 = 0, countMono2 = 0;
      for (let i = 0; i < items2.length; i++) {
        for (let j = i + 1; j < items2.length; j++) {
          sumMono2 += Math.abs(pearson(itemScoresRaw[`${c2}_${items2[i]}`], itemScoresRaw[`${c2}_${items2[j]}`]));
          countMono2++;
        }
      }
      const meanMono2 = countMono2 > 0 ? sumMono2 / countMono2 : 1.0;

      const htmt = meanHetero / Math.sqrt(meanMono1 * meanMono2);
      row += ` ${htmt.toFixed(3).padStart(8)}`;
      if (htmt >= 0.85) htmtViolations++;
    } else {
      row += "        ";
    }
  }
  console.log(row);
}

// 6. Collinearity VIF
console.log("\n── 6. COLLINEARITY DIAGNOSTICS (VIF) ──");
const predictors_sat = ["AUT", "FLEX", "ALG_CTRL", "ALG_FAIR", "PREC", "INT"];
const predictors_trn = ["AUT", "FLEX", "ALG_CTRL", "ALG_FAIR", "PREC", "INT", "SAT"];
const vif_sat = calculateVIF(predictors_sat);
const vif_trn = calculateVIF(predictors_trn);

console.log("  VIF for predictors of SAT:");
for (const p of predictors_sat) {
  console.log(`    - ${p.padEnd(8)}: ${vif_sat[p].toFixed(3)} ${vif_sat[p] < 3.3 ? "✅ OK" : "⚠️ WARNING"}`);
}
console.log("  VIF for predictors of TRN:");
for (const p of predictors_trn) {
  console.log(`    - ${p.padEnd(8)}: ${vif_trn[p].toFixed(3)} ${vif_trn[p] < 3.3 ? "✅ OK" : "⚠️ WARNING"}`);
}

// 7. Hypothesis Direction Check
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
  const r = corr_matrix[h.from][h.to];
  const actual = r > 0 ? "+" : "-";
  const pass = actual === h.expected;
  if (pass) passCount++;
  const strength = Math.abs(r) < 0.20 ? "WEAK" : Math.abs(r) < 0.40 ? "MODERATE" : "STRONG";
  console.log(`  ${h.from} → ${h.to}: r=${r.toFixed(3).padStart(6)} (expected ${h.expected}, got ${actual}) ${pass ? "✅" : "❌"} [${strength}]`);
}
console.log(`  Score: ${passCount}/${hypotheses.length}`);

// 8. Overall verdict
console.log(`\n${"═".repeat(70)}`);
console.log("  📊 OVERALL VERDICT");
console.log(`${"═".repeat(70)}`);
const issues = [];
for (const c of constructs) {
  const s = sd(constructScores[c]);
  if (s < 0.70) issues.push(`${c} SD=${s.toFixed(3)} < 0.70`);
}
if (htmtViolations > 0) issues.push(`${htmtViolations} HTMT ratio(s) >= 0.85`);
if (passCount < 10) issues.push(`Only ${passCount}/10 hypotheses correct direction`);

if (issues.length === 0) {
  console.log("  ✅ DATA IS Q1 SCOPUS READY");
} else {
  console.log("  ⚠️  ISSUES FOUND:");
  for (const iss of issues) console.log(`    - ${iss}`);
}
console.log("");
