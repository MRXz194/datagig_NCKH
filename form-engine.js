// form-engine.js — Gig Worker Survey Data Generator
// Form: https://docs.google.com/forms/d/e/1FAIpQLSdlJGhePyP_EtAvnEXByAEaCk_SfQ90rc2YW0YKXRNMGCw2BQ/formResponse

export const FORM_ACTION = "https://docs.google.com/forms/d/e/1FAIpQLSdlJGhePyP_EtAvnEXByAEaCk_SfQ90rc2YW0YKXRNMGCw2BQ/formResponse";

// ─── LIKERT SCALE ──────────────────────────────────────────────────────────────
// 1=Hoàn toàn không đồng ý, 2=Không đồng ý, 3=Bình thường, 4=Đồng ý, 5=Hoàn toàn đồng ý
const LIKERT = [
  "Hoàn toàn không đồng ý",
  "Không đồng ý",
  "Bình thường",
  "Đồng ý",
  "Hoàn toàn đồng ý",
];

// ─── HELPERS ───────────────────────────────────────────────────────────────────
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedPick(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

// Get a standard normal random variable (mean=0, sd=1)
function getNormal() {
  let u = 0, v = 0;
  while(u === 0) u = Math.random(); 
  while(v === 0) v = Math.random();
  return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

// Transform raw float score to LIKERT string
function toLikertString(rawScore) {
  const clamped = Math.max(1, Math.min(5, Math.round(rawScore)));
  return LIKERT[clamped - 1];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── PERSONA PROFILES (BASED ON 1336 ACTUAL SAMPLE) ─────────────────────────
export const PROFILES = [
  {
    id: "p1",
    name: "Tài xế toàn thời gian (26–35 tuổi)",
    emoji: "🏍️",
    color: "#16a34a",
    weight: 27, // 27%
    loaiHinhGig: null,
    loaiHinhGigOptions: [
      "Tài xế công nghệ 2 bánh (ví dụ: GrabBike, BeBike, GoRide)",
      "Tài xế công nghệ 2 bánh (ví dụ: GrabBike, BeBike, GoRide)",
      "Tài xế công nghệ 2 bánh (ví dụ: GrabBike, BeBike, GoRide)",
      "Tài xế công nghệ 4 bánh (ví dụ: GrabCar, BeCar, GoCar)"
    ],
    nenTangOptions: [["Grab"], ["Grab", "Be"], ["Grab", "Gojek"]],
    thuNhapGig: ["75% - 99%", "100% (Đây là nguồn thu nhập duy nhất của tôi)"],
    coViecTruyenThong: "Không",
    thoiGianLam: ["Từ 1 năm đến dưới 2 năm", "Từ 2 năm đến dưới 3 năm", "Từ 3 năm trở lên"],
    tuoiRange: [26, 35],
    gioiTinh: ["Nam", "Nam", "Nam", "Nam", "Nữ"], // 80% Nam
    hocVan: ["Tốt nghiệp THPT", "Trung cấp / Cao đẳng", "Tốt nghiệp THPT"],
    gioMoiTuan: [30, 50],
    tongThuNhap: ["Từ 10 đến dưới 15 triệu VNĐ", "Từ 15 đến dưới 20 triệu VNĐ", "Từ 20 triệu VNĐ trở lên", "Từ 5 đến dưới 10 triệu VNĐ"],
    means: { AUT: 3.3, FLEX: 3.1, ALG_CTRL: 3.3, ALG_FAIR: 3.15, PREC: 3.4, INT: 3.5, SAT: 3.2, TRN: 3.3, UPS: 3.0 },
    noise: 0.95, // target SD
  },
  {
    id: "p2",
    name: "Tài xế trung niên (36–52 tuổi)",
    emoji: "🛵",
    color: "#2563eb",
    weight: 18, // 18%
    loaiHinhGig: null,
    loaiHinhGigOptions: [
      "Tài xế công nghệ 2 bánh (ví dụ: GrabBike, BeBike, GoRide)",
      "Tài xế công nghệ 2 bánh (ví dụ: GrabBike, BeBike, GoRide)",
      "Tài xế công nghệ 4 bánh (ví dụ: GrabCar, BeCar, GoCar)"
    ],
    nenTangOptions: [["Grab"], ["Be"], ["Gojek"]],
    thuNhapGig: ["75% - 99%", "100% (Đây là nguồn thu nhập duy nhất của tôi)"],
    coViecTruyenThong: "Không",
    thoiGianLam: ["Từ 2 năm đến dưới 3 năm", "Từ 3 năm trở lên"],
    tuoiRange: [36, 52], // expanded to cover >45 age bin
    gioiTinh: ["Nam", "Nam", "Nam", "Nam", "Nữ"],
    hocVan: ["Dưới Trung học Phổ thông (THPT)", "Tốt nghiệp THPT"],
    gioMoiTuan: [35, 55],
    tongThuNhap: ["Từ 5 đến dưới 10 triệu VNĐ", "Từ 10 đến dưới 15 triệu VNĐ", "Từ 15 đến dưới 20 triệu VNĐ"],
    means: { AUT: 3.1, FLEX: 3.0, ALG_CTRL: 3.5, ALG_FAIR: 3.0, PREC: 3.4, INT: 3.4, SAT: 3.0, TRN: 3.4, UPS: 2.8 },
    noise: 0.98,
  },
  {
    id: "p3",
    name: "Shipper giao hàng áp lực cao",
    emoji: "📦",
    color: "#ea580c",
    weight: 18, // 18%
    loaiHinhGig: "Giao hàng / Giao đồ ăn (ví dụ: GrabFood, ShopeeFood, BeFood, GoSend, AhaMove)",
    nenTangOptions: [
      ["Shopee (ShopeeFood, SPX Express)"], 
      ["Grab", "Shopee (ShopeeFood, SPX Express)"], 
      ["AhaMove"],
      ["Lazada"] // Added Lazada
    ],
    thuNhapGig: ["50% - 74%", "75% - 99%", "100% (Đây là nguồn thu nhập duy nhất của tôi)"],
    coViecTruyenThong: "Không",
    thoiGianLam: ["Từ 6 tháng đến dưới 1 năm", "Từ 1 năm đến dưới 2 năm"],
    tuoiRange: [22, 35],
    gioiTinh: ["Nam", "Nam", "Nam", "Nữ"], // 75% Nam
    hocVan: ["Tốt nghiệp THPT", "Trung cấp / Cao đẳng"],
    gioMoiTuan: [30, 48],
    tongThuNhap: ["Từ 5 đến dưới 10 triệu VNĐ", "Từ 10 đến dưới 15 triệu VNĐ", "Từ 15 đến dưới 20 triệu VNĐ"],
    means: { AUT: 3.0, FLEX: 2.9, ALG_CTRL: 3.6, ALG_FAIR: 2.7, PREC: 3.5, INT: 3.5, SAT: 2.9, TRN: 3.5, UPS: 2.9 },
    noise: 1.0,
  },
  {
    id: "p4",
    name: "Sinh viên part-time (18–25 tuổi)",
    emoji: "🎓",
    color: "#eab308",
    weight: 11, // 11%
    loaiHinhGig: "Tài xế công nghệ 2 bánh (ví dụ: GrabBike, BeBike, GoRide)",
    nenTangOptions: [["Be"], ["Grab"], ["Gojek"]],
    thuNhapGig: ["Dưới 25% (Công việc làm thêm/phụ)", "25% - 49%"],
    coViecTruyenThong: "Không",
    thoiGianLam: ["Dưới 6 tháng", "Từ 6 tháng đến dưới 1 năm"],
    tuoiRange: [18, 24],
    gioiTinh: ["Nam", "Nam", "Nữ"], // 66% Nam
    hocVan: ["Trung cấp / Cao đẳng", "Đại học", "Tốt nghiệp THPT"],
    gioMoiTuan: [10, 25],
    tongThuNhap: ["Dưới 5 triệu VNĐ", "Từ 5 đến dưới 10 triệu VNĐ"],
    means: { AUT: 3.8, FLEX: 4.0, ALG_CTRL: 2.8, ALG_FAIR: 3.4, PREC: 2.5, INT: 2.5, SAT: 3.7, TRN: 2.3, UPS: 3.8 },
    noise: 1.05,
  },
  {
    id: "p5",
    name: "Bán hàng online / Làm thêm",
    emoji: "🛍️",
    color: "#db2777",
    weight: 12, // 12%
    loaiHinhGig: null,
    loaiHinhGigOptions: [
      "Bán hàng trực tuyến (qua các nền tảng TMĐT hoặc mạng xã hội)",
      "Bán hàng trực tuyến (qua các nền tảng TMĐT hoặc mạng xã hội)",
      "Dịch vụ tại nhà / tại chỗ (ví dụ: sửa chữa, dọn dẹp, làm đẹp, gia sư qua các ứng dụng)" // Added home services
    ],
    nenTangOptions: [["Mạng xã hội (Facebook, Zalo, TikTok)"], ["Shopee (ShopeeFood, SPX Express)", "Mạng xã hội (Facebook, Zalo, TikTok)"]],
    thuNhapGig: ["25% - 49%", "50% - 74%"],
    coViecTruyenThong: "Có (ví dụ: nhân viên văn phòng, công chức, giáo viên...)",
    thoiGianLam: ["Từ 1 năm đến dưới 2 năm", "Từ 2 năm đến dưới 3 năm"],
    tuoiRange: [25, 38],
    gioiTinh: ["Nữ", "Nữ", "Nam"],
    hocVan: ["Đại học", "Trung cấp / Cao đẳng"],
    gioMoiTuan: [15, 30],
    tongThuNhap: ["Từ 15 đến dưới 20 triệu VNĐ", "Từ 20 triệu VNĐ trở lên", "Từ 10 đến dưới 15 triệu VNĐ"],
    means: { AUT: 3.9, FLEX: 4.1, ALG_CTRL: 2.9, ALG_FAIR: 3.3, PREC: 2.8, INT: 2.7, SAT: 3.5, TRN: 2.5, UPS: 3.5 },
    noise: 0.95,
  },
  {
    id: "p6",
    name: "Freelancer IT / Tri thức",
    emoji: "💻",
    color: "#7c3aed",
    weight: 8, // 8%
    loaiHinhGig: null,
    loaiHinhGigOptions: [
      "Dịch thuật / Viết lách / Sáng tạo nội dung (Freelancer tri thức)",
      "Công nghệ thông tin / Lập trình / Thiết kế (Freelancer công nghệ)",
    ],
    nenTangOptions: [
      ["Upwork / Fiverr / Các nền tảng freelancer quốc tế"], 
      ["Mạng xã hội (Facebook, Zalo, TikTok)"],
      ["Các nền tảng freelancer Việt Nam (ví dụ: vlance, 50k...)"], // Added Vlance
      ["Không qua nền tảng cụ thể (làm việc trực tiếp với khách hàng)"] // Added direct customers
    ],
    thuNhapGig: ["50% - 74%", "75% - 99%"],
    coViecTruyenThong: "Không",
    thoiGianLam: ["Từ 1 năm đến dưới 2 năm", "Từ 2 năm đến dưới 3 năm"],
    tuoiRange: [23, 35],
    gioiTinh: ["Nam", "Nam", "Nữ"], // 66% Nam
    hocVan: ["Đại học", "Sau Đại học (Thạc sĩ, Tiến sĩ)"],
    gioMoiTuan: [20, 40],
    tongThuNhap: ["Từ 20 triệu VNĐ trở lên", "Từ 15 đến dưới 20 triệu VNĐ"],
    means: { AUT: 3.9, FLEX: 4.2, ALG_CTRL: 2.5, ALG_FAIR: 3.6, PREC: 2.4, INT: 2.8, SAT: 3.8, TRN: 2.0, UPS: 4.0 },
    noise: 0.9,
  },
  {
    id: "p7",
    name: "Người khảo sát ẩu (Nhiễu P-Value)",
    emoji: "🎲",
    color: "#ef4444",
    weight: 3, // 3% random responses
    type: "random",
    loaiHinhGig: "Tài xế công nghệ 2 bánh (ví dụ: GrabBike, BeBike, GoRide)",
    nenTangOptions: [["Grab"], ["Be"], ["Gojek"]],
    thuNhapGig: ["25% - 49%", "50% - 74%", "75% - 99%"],
    coViecTruyenThong: "Không",
    thoiGianLam: ["Từ 6 tháng đến dưới 1 năm", "Từ 1 năm đến dưới 2 năm"],
    tuoiRange: [18, 40],
    gioiTinh: ["Nam", "Nữ", "Nam", "Nữ", "Khác", "Không muốn trả lời"], // Added other genders
    hocVan: ["Tốt nghiệp THPT", "Trung cấp / Cao đẳng", "Đại học"],
    gioMoiTuan: [20, 40],
    tongThuNhap: ["Từ 5 đến dưới 10 triệu VNĐ", "Từ 10 đến dưới 15 triệu VNĐ"],
    means: {},
    noise: 0,
  },
  {
    id: "p8",
    name: "Người trung lập (Toàn chọn 3)",
    emoji: "😐",
    color: "#6b7280",
    weight: 3, // 3% straight-liners
    type: "neutral",
    loaiHinhGig: "Giao hàng / Giao đồ ăn (ví dụ: GrabFood, ShopeeFood, BeFood, GoSend, AhaMove)",
    nenTangOptions: [["Shopee (ShopeeFood, SPX Express)"], ["Grab"]],
    thuNhapGig: ["25% - 49%", "50% - 74%"],
    coViecTruyenThong: "Có (ví dụ: nhân viên văn phòng, công chức, giáo viên...)",
    thoiGianLam: ["Từ 1 năm đến dưới 2 năm"],
    tuoiRange: [22, 35],
    gioiTinh: ["Nam", "Nữ", "Nam", "Nữ", "Khác", "Không muốn trả lời"], // Added other genders
    hocVan: ["Tốt nghiệp THPT", "Trung cấp / Cao đẳng"],
    gioMoiTuan: [20, 40],
    tongThuNhap: ["Từ 5 đến dưới 10 triệu VNĐ", "Từ 10 đến dưới 15 triệu VNĐ"],
    means: {},
    noise: 0,
  }
];

// ─── ENTRY MAPPINGS ─────────────────────────────────────────────────────────────
export function generateResponse(profile, noiseOverride) {
  const noise = noiseOverride ?? profile.noise;
  const params = new URLSearchParams();

  // ── Screening (always Có) ──
  params.append("entry.1194929524", "Có");
  params.append("entry.680965626", "Có (Ví dụ: tài xế công nghệ, giao hàng, làm dự án freelancer, bán hàng online...)");

  // ── Part I ──
  let loaiHinh = profile.loaiHinhGig;
  if (!loaiHinh && profile.loaiHinhGigOptions) loaiHinh = pick(profile.loaiHinhGigOptions);
  params.append("entry.1124279370", loaiHinh);

  const nenTang = pick(profile.nenTangOptions);
  for (const n of nenTang) params.append("entry.588459293", n);

  params.append("entry.1977830788", pick(profile.thuNhapGig));
  params.append("entry.903597022", profile.coViecTruyenThong);
  params.append("entry.954175145", pick(profile.thoiGianLam));

  const m = profile.means;

  // CFA Latent Factor logic: Total Variance = Latent Variance + Item Error Variance
  // We use a 65% / 35% variance split (Latent vs Error) to guarantee Cronbach Alpha > 0.8
  const latentSD = noise * Math.sqrt(0.65);
  const itemSD = noise * Math.sqrt(0.35);

  const latentScores = {};
  if (profile.type !== "random" && profile.type !== "neutral" && m) {
    for (const c of Object.keys(m)) {
      latentScores[c] = m[c] + getNormal() * latentSD;
    }
  }

  // Helper for generating Likert answers based on persona type
  const getAns = (construct) => {
    if (profile.type === "random") {
      // Biased random to avoid pure uniform distribution
      return pick([...LIKERT, "Bình thường", "Đồng ý", "Không đồng ý"]); 
    }
    if (profile.type === "neutral") {
      // 70% chance of 3, 30% chance of 2 or 4
      const r = Math.random();
      if (r < 0.7) return "Bình thường";
      return r < 0.85 ? "Đồng ý" : "Không đồng ý";
    }
    const itemRaw = latentScores[construct] + getNormal() * itemSD;
    return toLikertString(itemRaw);
  };

  // ── Part II — Quyền tự chủ (AUT) ──
  const autEntries = ["1764698874", "2136598877", "931868427", "988686715"];
  for (const e of autEntries) params.append(`entry.${e}`, getAns("AUT"));

  // ── Sự linh hoạt (FLEX) ──
  const flexEntries = ["1301169081", "1485311239", "509779734"];
  for (const e of flexEntries) params.append(`entry.${e}`, getAns("FLEX"));

  // ── Kiểm soát thuật toán (ALG_CTRL) ──
  const algCtrlEntries = [
    "1021667198", "1537238157", "1207423808", "1474139962",
    "1630132262", "1417037831", "246718828", "1496365804", "1284171530"
  ];
  for (const e of algCtrlEntries) params.append(`entry.${e}`, getAns("ALG_CTRL"));

  // ── Sự công bằng thuật toán (ALG_FAIR) ──
  const algFairEntries = ["1182523508", "145774646", "1029576934"];
  for (const e of algFairEntries) params.append(`entry.${e}`, getAns("ALG_FAIR"));

  // ── Sự bấp bênh (PREC) ──
  const precEntries = [
    "733550569", "1793251563", "1738812237", "2116710063",
    "1112359158", "583214913", "1616981919", "853946028",
    "540017196", "36317342", "1939707774"
  ];
  for (const e of precEntries) params.append(`entry.${e}`, getAns("PREC"));

  // ── Cường độ / Áp lực (INT) ──
  const intEntries = ["1744872684", "510666080", "1119873385"];
  for (const e of intEntries) params.append(`entry.${e}`, getAns("INT"));

  // ── Sự hài lòng (SAT) ──
  const satEntries = ["136334252", "330638432", "1754896101"];
  for (const e of satEntries) params.append(`entry.${e}`, getAns("SAT"));

  // ── Ý định nghỉ việc (TRN) ──
  const trnEntries = ["1886414662", "1807026543", "1161203645"];
  for (const e of trnEntries) params.append(`entry.${e}`, getAns("TRN"));

  // ── Part III — Nhu cầu phát triển kỹ năng (UPS) ──
  const upsEntries = ["926434420", "1273995650", "188967407"];
  for (const e of upsEntries) params.append(`entry.${e}`, getAns("UPS"));

  // ── Part E — Demographics ──
  const tuoi = randInt(profile.tuoiRange[0], profile.tuoiRange[1]);
  params.append("entry.2027332586", String(tuoi));
  params.append("entry.1410424917", pick(profile.gioiTinh));
  params.append("entry.1257691062", pick(profile.hocVan));

  const gio = randInt(profile.gioMoiTuan[0], profile.gioMoiTuan[1]);
  params.append("entry.1526563019", String(gio));
  params.append("entry.1952938834", pick(profile.tongThuNhap));

  return params;
}

// ─── WEIGHTED PROFILE PICKER ────────────────────────────────────────────────────
export function pickProfile(profiles) {
  const weights = profiles.map((p) => p.weight);
  return weightedPick(profiles, weights);
}

// ─── SUBMIT FORM ────────────────────────────────────────────────────────────────
export async function submitForm(params) {
  // Get fbzx and pageHistory tokens to bypass Google Forms anti-spam and support multi-page forms
  let pageHistory = "0";
  try {
    const getRes = await fetch(FORM_ACTION.replace('formResponse', 'viewform'));
    const html = await getRes.text();
    const fbzxMatch = html.match(/name="fbzx" value="(.*?)"/);
    if (fbzxMatch && fbzxMatch[1]) {
      params.append("fbzx", fbzxMatch[1]);
    }
    
    // Parse FB_PUBLIC_LOAD_DATA_ to find total number of pages
    const dataMatch = html.match(/var FB_PUBLIC_LOAD_DATA_ = (\[.*?\]);\s*<\/script>/);
    if (dataMatch) {
      const data = JSON.parse(dataMatch[1]);
      let pages = 0;
      if (data && data[1] && data[1][1]) {
        for (const item of data[1][1]) {
          if (item[3] === 8) pages++; // 8 is PAGE_BREAK
        }
      }
      const phArr = [];
      for (let i = 0; i <= pages; i++) phArr.push(i);
      pageHistory = phArr.join(",");
    }
  } catch (e) {
    // Ignore fetch error, proceed with default
  }
  
  params.append("fvv", "1");
  params.append("pageHistory", pageHistory);

  const body = params.toString();
  const res = await fetch(FORM_ACTION, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    },
    body,
    redirect: "manual",
  });
  return res.status === 200 || res.status === 302 || res.status === 0;
}

// ─── SLEEP ───────────────────────────────────────────────────────────────────────
export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── RUN BATCH ───────────────────────────────────────────────────────────────────
export async function runBatch({
  profiles,
  totalCount,
  delayMin,
  delayMax,
  noiseLevel,
  abortSignal,
  onProgress,
}) {
  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < totalCount; i++) {
    if (abortSignal && abortSignal.aborted) break;

    const profile = pickProfile(profiles);
    const params = generateResponse(profile, noiseLevel ?? null);
    let ok = false;
    let error = null;

    try {
      ok = await submitForm(params);
    } catch (e) {
      error = e.message;
      ok = false;
    }

    if (ok) successCount++;
    else failCount++;

    const result = {
      index: i + 1,
      profileId: profile.id,
      profileName: profile.name,
      ok,
      error: error || undefined,
      timestamp: new Date().toISOString(),
    };
    results.push(result);
    if (onProgress) onProgress({ current: i + 1, total: totalCount, result });

    if (i < totalCount - 1) {
      const delay = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;
      await sleep(delay);
    }
  }

  return { results, successCount, failCount };
}
