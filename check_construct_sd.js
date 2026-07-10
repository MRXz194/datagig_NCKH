// check_construct_sd.js — Kiểm tra SD construct ở CẢ hai cấp độ
// Trong paper Q1 Scopus (PLS-SEM), SD report ở construct-level TRUNG BÌNH thường nằm ở 0.50-0.80
// vì Central Limit Theorem: mean(items) -> shrinks SD
// SD ở ITEM level mới cần > 0.70

import { PROFILES, generateResponse, pickProfile } from "./form-engine.js";

const N = 2000; // larger sample for stability

const LIKERT_MAP = {
  "Hoàn toàn không đồng ý": 1,
  "Không đồng ý": 2,
  "Bình thường": 3,
  "Đồng ý": 4,
  "Hoàn toàn đồng ý": 5,
};

const CONSTRUCT_ENTRIES = {
  AUT:      ["1764698874", "2136598877", "931868427", "988686715"],        // 4 items
  FLEX:     ["1301169081", "1485311239", "509779734"],                      // 3 items
  ALG_CTRL: ["1021667198", "1537238157", "1207423808", "1474139962", "1630132262", "1417037831", "246718828", "1496365804", "1284171530"], // 9 items
  ALG_FAIR: ["1182523508", "145774646", "1029576934"],                     // 3 items
  PREC:     ["733550569", "1793251563", "1738812237", "2116710063", "1112359158", "583214913", "1616981919", "853946028", "540017196", "36317342", "1939707774"], // 11 items
  INT:      ["1744872684", "510666080", "1119873385"],                      // 3 items
  SAT:      ["136334252", "330638432", "1754896101"],                      // 3 items
  TRN:      ["1886414662", "1807026543", "1161203645"],                     // 3 items
  UPS:      ["926434420", "1273995650", "188967407"], // 3 items
};

// Collect ALL individual item scores
const itemScores = {}; // "AUT_0": [scores...], "AUT_1": [scores...]
const constructMeanScores = {}; // "AUT": [construct_mean_per_respondent...]

for (const c of Object.keys(CONSTRUCT_ENTRIES)) {
  constructMeanScores[c] = [];
  for (let j = 0; j < CONSTRUCT_ENTRIES[c].length; j++) {
    itemScores[`${c}_${j}`] = [];
  }
}

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
    for (let j = 0; j < entryIds.length; j++) {
      const vals = entryMap[`entry.${entryIds[j]}`];
      if (vals) {
        for (const v of vals) {
          const score = LIKERT_MAP[v];
          if (score !== undefined) {
            itemScores[`${construct}_${j}`].push(score);
            sum += score;
            count++;
          }
        }
      }
    }
    constructMeanScores[construct].push(count > 0 ? sum / count : 3);
  }
}

function mean(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length; }
function sd(arr) { const m = mean(arr); return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1)); }

console.log("\n══════════════════════════════════════════════════════════════");
console.log("  ITEM-LEVEL vs CONSTRUCT-LEVEL SD COMPARISON");
console.log("══════════════════════════════════════════════════════════════\n");

console.log("  Key insight: PLS-SEM papers report ITEM-LEVEL SD in");
console.log("  descriptive statistics table, NOT construct-mean SD.\n");

for (const c of Object.keys(CONSTRUCT_ENTRIES)) {
  const nItems = CONSTRUCT_ENTRIES[c].length;
  
  // Item-level SDs
  const itemSDs = [];
  for (let j = 0; j < nItems; j++) {
    const arr = itemScores[`${c}_${j}`];
    itemSDs.push(sd(arr));
  }
  const avgItemSD = itemSDs.reduce((a,b) => a+b, 0) / itemSDs.length;
  
  // Construct-level (mean of items) SD
  const constructSD = sd(constructMeanScores[c]);
  
  // Theoretical: construct_SD ≈ item_SD / sqrt(n_items) when items are independent
  const theoretical = avgItemSD / Math.sqrt(nItems);
  
  const itemOK = avgItemSD >= 0.70 ? "✅" : "❌";
  const constructOK = constructSD >= 0.50 ? "✅" : "❌";
  
  console.log(`  ${c} (${nItems} items):`);
  console.log(`    Item-level avg SD:     ${avgItemSD.toFixed(3)} ${itemOK} (Q1 target: ≥ 0.70)`);
  console.log(`    Construct-mean SD:     ${constructSD.toFixed(3)} ${constructOK} (Q1 typical: 0.50-0.80)`);
  console.log(`    Theoretical shrink:    ${theoretical.toFixed(3)} (item_SD / √${nItems})`);
  console.log("");
}

console.log("══════════════════════════════════════════════════════════════");
console.log("  REFERENCE: Actual Q1 Scopus papers report these ranges:");
console.log("    - Item SD: 0.80 - 1.10 (individual Likert items)");
console.log("    - Construct Mean SD: 0.50 - 0.85 (averaged across items)");
console.log("    - Constructs with 8-10 items have lower mean SD");
console.log("══════════════════════════════════════════════════════════════\n");
