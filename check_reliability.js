// check_reliability.js — Calculate Cronbach's Alpha
import { PROFILES, generateResponse, pickProfile } from "./form-engine.js";

const N = 1000;
const LIKERT_MAP = {
  "Hoàn toàn không đồng ý": 1, "Không đồng ý": 2, "Bình thường": 3, "Đồng ý": 4, "Hoàn toàn đồng ý": 5
};

const CONSTRUCT_ENTRIES = {
  AUT: ["1764698874", "2136598877", "931868427", "988686715"],
  FLEX: ["1301169081", "1485311239", "509779734"],
  ALG_CTRL: ["1021667198", "1537238157", "1207423808", "1474139962", "1630132262", "1417037831", "246718828", "1496365804", "1284171530"],
  ALG_FAIR: ["1182523508", "145774646", "1029576934"],
  PREC: ["733550569", "1793251563", "1738812237", "2116710063", "1112359158", "583214913", "1616981919", "853946028", "540017196", "36317342", "1939707774"],
  INT: ["1744872684", "510666080", "1119873385"],
  SAT: ["136334252", "330638432", "1754896101"],
  TRN: ["1886414662", "1807026543", "1161203645"],
  UPS: ["926434420", "1273995650", "188967407"],
};

// Data matrix: data[construct][itemIndex][respondentIndex]
const data = {};
for (const c of Object.keys(CONSTRUCT_ENTRIES)) {
  data[c] = Array(CONSTRUCT_ENTRIES[c].length).fill(0).map(() => []);
}

for (let i = 0; i < N; i++) {
  const profile = pickProfile(PROFILES);
  const params = generateResponse(profile);
  const entries = [...params.entries()];
  const entryMap = {};
  for (const [k, v] of entries) {
    if (!entryMap[k]) entryMap[k] = [];
    entryMap[k].push(v);
  }

  for (const [construct, entryIds] of Object.entries(CONSTRUCT_ENTRIES)) {
    for (let j = 0; j < entryIds.length; j++) {
      const eid = entryIds[j];
      const valArr = entryMap[`entry.${eid}`];
      let score = 3; // default
      if (valArr && valArr.length > 0) {
        const v = LIKERT_MAP[valArr[0]];
        if (v !== undefined) score = v;
      }
      data[construct][j].push(score);
    }
  }
}

function variance(arr) {
  const m = arr.reduce((a,b)=>a+b,0)/arr.length;
  return arr.reduce((s,v)=>s+Math.pow(v-m,2),0)/(arr.length-1);
}

console.log("── CRONBACH'S ALPHA CHECK ──");
for (const c of Object.keys(CONSTRUCT_ENTRIES)) {
  const K = data[c].length;
  
  // Calculate variance of each item
  let sumItemVariances = 0;
  for (let j = 0; j < K; j++) {
    sumItemVariances += variance(data[c][j]);
  }
  
  // Calculate variance of the sum of items
  const sumScores = Array(N).fill(0);
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < K; j++) {
      sumScores[i] += data[c][j][i];
    }
  }
  const varTotal = variance(sumScores);
  
  // Alpha = (K / (K - 1)) * (1 - sum(var_i) / var_total)
  let alpha = 0;
  if (varTotal > 0 && K > 1) {
    alpha = (K / (K - 1)) * (1 - sumItemVariances / varTotal);
  }
  
  console.log(`${c.padEnd(10)} (K=${K}): ${alpha.toFixed(3)} ${alpha >= 0.7 ? "✅" : "❌ FAIL"}`);
}
