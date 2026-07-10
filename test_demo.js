import { PROFILES, generateResponse } from './form-engine.js';
const N = 1000;
let counts = {
  gender: { Nam: 0, Nữ: 0, Khác: 0 },
  age: { '18-25': 0, '26-35': 0, '36-45': 0, '>45': 0 },
  edu: { 'Dưới THPT': 0, 'THPT': 0, 'TC/CĐ': 0, 'Đại học': 0, 'Sau ĐH': 0 },
  hours: { '<20': 0, '20-40': 0, '>40': 0 },
  income: { '<5': 0, '5-10': 0, '10-15': 0, '15-20': 0, '>20': 0 }
};

for (let i=0; i<N; i++) {
  const totalWeight = PROFILES.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * totalWeight;
  let profile = PROFILES[PROFILES.length - 1];
  for (const p of PROFILES) {
    r -= p.weight;
    if (r <= 0) { profile = p; break; }
  }
  
  const params = generateResponse(profile, 1.3);
  
  const age = parseInt(params.get('entry.2027332586'));
  if (age <= 25) counts.age['18-25']++;
  else if (age <= 35) counts.age['26-35']++;
  else if (age <= 45) counts.age['36-45']++;
  else counts.age['>45']++;
  
  const gender = params.get('entry.1410424917');
  if (gender.includes('Nam')) counts.gender.Nam++;
  else if (gender.includes('Nữ')) counts.gender.Nữ++;
  else counts.gender.Khác++;
  
  const edu = params.get('entry.1257691062');
  if (edu.includes('Dưới')) counts.edu['Dưới THPT']++;
  else if (edu.includes('Tốt nghiệp THPT')) counts.edu['THPT']++;
  else if (edu.includes('Trung cấp')) counts.edu['TC/CĐ']++;
  else if (edu.includes('Sau Đại học')) counts.edu['Sau ĐH']++;
  else counts.edu['Đại học']++;
  
  const hours = parseInt(params.get('entry.1526563019'));
  if (hours < 20) counts.hours['<20']++;
  else if (hours <= 40) counts.hours['20-40']++;
  else counts.hours['>40']++;
  
  const inc = params.get('entry.1952938834');
  if (inc.includes('Dưới 5')) counts.income['<5']++;
  else if (inc.includes('5 đến dưới 10')) counts.income['5-10']++;
  else if (inc.includes('10 đến dưới 15')) counts.income['10-15']++;
  else if (inc.includes('15 đến dưới 20')) counts.income['15-20']++;
  else counts.income['>20']++;
}

console.log('--- DEMOGRAPHICS (N=1000) ---');
for (const k in counts) {
  console.log(k.toUpperCase() + ':');
  for (const v in counts[k]) {
    console.log(`  ${v}: ${(counts[k][v]/N*100).toFixed(1)}%`);
  }
}
