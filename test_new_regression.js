// test_new_regression.js
import { PROFILES, generateResponse, pickProfile } from "./form-engine.js";

const N = 1336;
const LIKERT_MAP = {
  "Hoàn toàn không đồng ý": 1, "Không đồng ý": 2, "Bình thường": 3, "Đồng ý": 4, "Hoàn toàn đồng ý": 5
};

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

const constructScores = {};
for (const c of Object.keys(CONSTRUCT_ENTRIES)) constructScores[c] = [];
const itemScoresRaw = {};

for (let i = 0; i < N; i++) {
  const profile = pickProfile(PROFILES);
  const params = generateResponse(profile);
  const allEntries = [...params.entries()];
  const entryMap = {};
  for (const [k, v] of allEntries) {
    if (!entryMap[k]) entryMap[k] = [];
    entryMap[k].push(v);
  }

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
}

function mean(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length; }
function sd(arr) {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1));
}

// Matrix operations
function transpose(A) { return A[0].map((_, c) => A.map(r => r[c])); }
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
    if (Math.abs(pivot) < 1e-10) return null;
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

// Standardize scores
const stdScores = {};
for (const c of Object.keys(CONSTRUCT_ENTRIES)) {
  const m = mean(constructScores[c]);
  const s = sd(constructScores[c]);
  stdScores[c] = constructScores[c].map(val => (val - m) / s);
}

function runRegression(yVar, xVars) {
  const X = [];
  for (let i = 0; i < N; i++) {
    const row = [];
    for (const xv of xVars) row.push(stdScores[xv][i]);
    X.push(row);
  }
  const y = stdScores[yVar].map(val => [val]);
  const Xt = transpose(X);
  const XtX = multiply(Xt, X);
  const XtX_inv = invertMatrix(XtX);
  if (!XtX_inv) return null;
  const Xty = multiply(Xt, y);
  const beta = multiply(XtX_inv, Xty);
  
  // Calculate Standard Error and T-value
  const betas = beta.map(r => r[0]);
  const residuals = [];
  let rss = 0;
  for (let i = 0; i < N; i++) {
    let y_pred = 0;
    for (let j = 0; j < xVars.length; j++) {
      y_pred += betas[j] * X[i][j];
    }
    const res = y[i][0] - y_pred;
    residuals.push(res);
    rss += res ** 2;
  }
  const df = N - xVars.length;
  const s2 = rss / df;
  
  const se = [];
  for (let j = 0; j < xVars.length; j++) {
    se.push(Math.sqrt(s2 * XtX_inv[j][j]));
  }
  
  return xVars.map((xv, j) => {
    const b = betas[j];
    const s_err = se[j];
    const t = Math.abs(b / s_err);
    // Two-tailed p-value approximation
    const p = 2 * (1 - erf(t / Math.sqrt(2)) / 2 - 0.5);
    return { path: `${xv} -> ${yVar}`, beta: b, se: s_err, t, p: Math.max(0, Math.min(1, p)) };
  });
}

function erf(x) {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

console.log("\n── TEST RUN PATH ESTIMATIONS (N=1336) ──");
const pathsSat = runRegression("SAT", ["AUT", "FLEX", "ALG_CTRL", "ALG_FAIR", "PREC", "INT"]);
const pathsTrn = runRegression("TRN", ["AUT", "FLEX", "ALG_CTRL", "ALG_FAIR", "PREC", "INT", "SAT"]);

const allPaths = [...pathsSat, ...pathsTrn];
console.log(`${"Path".padEnd(20)} ${"Beta".padStart(8)} ${"t-value".padStart(8)} ${"p-value".padStart(8)} ${"Status"}`);
for (const p of allPaths) {
  const p_str = p.p < 0.001 ? "< 0.001" : p.p.toFixed(3);
  const status = p.p < 0.05 ? "✅ Signif" : "❌ Non-Signif";
  console.log(`${p.path.padEnd(20)} ${p.beta.toFixed(3).padStart(8)} ${p.t.toFixed(3).padStart(8)} ${p_str.padStart(8)} ${status}`);
}
