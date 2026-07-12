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

// Dynamic Variance Split based on number of items
// Returns { latent: ratio, error: ratio }
function getVarianceSplit(numItems) {
  // Thang đo dài (>6 items): Latent 58%, Error 42%  → Alpha ~ 0.90-0.93
  // Thang đo trung (4-6 items): Latent 63%, Error 37% → Alpha ~ 0.84-0.88
  // Thang đo ngắn (3 items): Latent 68%, Error 32%    → Alpha ~ 0.80-0.84
  if (numItems >= 7) return { latent: 0.58, error: 0.42 };
  if (numItems >= 4) return { latent: 0.63, error: 0.37 };
  return { latent: 0.68, error: 0.32 };
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
    coViecTruyenThongOptions: [
      "Không", "Không", "Không", "Không", "Không", 
      "Có (ví dụ: nhân viên văn phòng, công chức, giáo viên...)"
    ],
    thoiGianLam: ["Từ 1 năm đến dưới 2 năm", "Từ 2 năm đến dưới 3 năm", "Từ 3 năm trở lên"],
    tuoiRange: [26, 35],
    gioiTinh: ["Nam", "Nam", "Nam", "Nam", "Nữ"], // 80% Nam
    hocVan: ["Tốt nghiệp THPT", "Trung cấp / Cao đẳng", "Tốt nghiệp THPT"],
    gioMoiTuan: [30, 50],
    tongThuNhap: ["Từ 10 đến dưới 15 triệu VNĐ", "Từ 15 đến dưới 20 triệu VNĐ", "Từ 20 triệu VNĐ trở lên", "Từ 5 đến dưới 10 triệu VNĐ"],
    means: { AUT: 3.4, FLEX: 3.2, ALG_CTRL: 3.4, ALG_FAIR: 3.0, PREC: 3.3, INT: 3.4, SAT: 3.2, TRN: 3.1, UPS: 3.0 },
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
    coViecTruyenThongOptions: [
      "Không", "Không", "Không", "Không", "Không", 
      "Không", "Không", "Không", "Không",
      "Có (ví dụ: nhân viên văn phòng, công chức, giáo viên...)"
    ],
    thoiGianLam: ["Từ 2 năm đến dưới 3 năm", "Từ 3 năm trở lên"],
    tuoiRange: [36, 52], // expanded to cover >45 age bin
    gioiTinh: ["Nam", "Nam", "Nam", "Nam", "Nữ"],
    hocVan: ["Dưới Trung học Phổ thông (THPT)", "Tốt nghiệp THPT"],
    gioMoiTuan: [35, 55],
    tongThuNhap: ["Từ 5 đến dưới 10 triệu VNĐ", "Từ 10 đến dưới 15 triệu VNĐ", "Từ 15 đến dưới 20 triệu VNĐ"],
    means: { AUT: 3.0, FLEX: 2.9, ALG_CTRL: 3.5, ALG_FAIR: 2.8, PREC: 3.6, INT: 3.3, SAT: 2.8, TRN: 3.0, UPS: 2.6 },
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
    coViecTruyenThongOptions: ["Không", "Không", "Không", "Có (ví dụ: nhân viên văn phòng, công chức, giáo viên...)"],
    thoiGianLam: ["Từ 6 tháng đến dưới 1 năm", "Từ 1 năm đến dưới 2 năm"],
    tuoiRange: [22, 35],
    gioiTinh: ["Nam", "Nam", "Nam", "Nữ"], // 75% Nam
    hocVan: ["Tốt nghiệp THPT", "Trung cấp / Cao đẳng"],
    gioMoiTuan: [30, 48],
    tongThuNhap: ["Từ 5 đến dưới 10 triệu VNĐ", "Từ 10 đến dưới 15 triệu VNĐ", "Từ 15 đến dưới 20 triệu VNĐ"],
    means: { AUT: 2.8, FLEX: 2.7, ALG_CTRL: 3.8, ALG_FAIR: 2.5, PREC: 3.7, INT: 3.7, SAT: 2.6, TRN: 3.8, UPS: 3.2 },
    noise: 1.0,
  },
  {
    id: "p4",
    name: "Sinh viên part-time (18–25 tuổi)",
    emoji: "🎓",
    color: "#eab308",
    weight: 11, // 11%
    loaiHinhGig: null,
    loaiHinhGigOptions: [
      "Tài xế công nghệ 2 bánh (ví dụ: GrabBike, BeBike, GoRide)",
      "Tài xế công nghệ 2 bánh (ví dụ: GrabBike, BeBike, GoRide)",
      "Giao hàng / Giao đồ ăn (ví dụ: GrabFood, ShopeeFood, BeFood, GoSend, AhaMove)",
      "Giao hàng / Giao đồ ăn (ví dụ: GrabFood, ShopeeFood, BeFood, GoSend, AhaMove)",
      "Bán hàng trực tuyến (qua các nền tảng TMĐT hoặc mạng xã hội)",
      "Dịch vụ tại nhà / tại chỗ (ví dụ: sửa chữa, dọn dẹp, làm đẹp, gia sư qua các ứng dụng)"
    ],
    nenTangOptions: [
      ["Be"], ["Grab"], ["Gojek"],
      ["Shopee (ShopeeFood, SPX Express)"],
      ["Mạng xã hội (Facebook, Zalo, TikTok)"]
    ],
    thuNhapGig: ["Dưới 25% (Công việc làm thêm/phụ)", "25% - 49%"],
    coViecTruyenThongOptions: ["Không"],
    thoiGianLam: ["Dưới 6 tháng", "Từ 6 tháng đến dưới 1 năm"],
    tuoiRange: [18, 24],
    gioiTinh: ["Nam", "Nam", "Nữ"], // 66% Nam
    hocVan: ["Trung cấp / Cao đẳng", "Đại học", "Tốt nghiệp THPT"],
    gioMoiTuan: [10, 25],
    tongThuNhap: ["Dưới 5 triệu VNĐ", "Từ 5 đến dưới 10 triệu VNĐ"],
    means: { AUT: 3.7, FLEX: 3.9, ALG_CTRL: 2.9, ALG_FAIR: 3.3, PREC: 3.0, INT: 2.6, SAT: 3.5, TRN: 2.8, UPS: 3.6 },
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
    coViecTruyenThongOptions: [
      "Có (ví dụ: nhân viên văn phòng, công chức, giáo viên...)", 
      "Có (ví dụ: nhân viên văn phòng, công chức, giáo viên...)", 
      "Có (ví dụ: nhân viên văn phòng, công chức, giáo viên...)",
      "Không", "Không"
    ],
    thoiGianLam: ["Từ 1 năm đến dưới 2 năm", "Từ 2 năm đến dưới 3 năm"],
    tuoiRange: [25, 38],
    gioiTinh: ["Nữ", "Nữ", "Nam"],
    hocVan: ["Đại học", "Trung cấp / Cao đẳng"],
    gioMoiTuan: [15, 30],
    tongThuNhap: ["Từ 15 đến dưới 20 triệu VNĐ", "Từ 20 triệu VNĐ trở lên", "Từ 10 đến dưới 15 triệu VNĐ"],
    means: { AUT: 3.6, FLEX: 3.8, ALG_CTRL: 3.2, ALG_FAIR: 3.1, PREC: 3.0, INT: 3.0, SAT: 3.4, TRN: 2.7, UPS: 3.4 },
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
    coViecTruyenThongOptions: ["Không", "Có (ví dụ: nhân viên văn phòng, công chức, giáo viên...)"],
    thoiGianLam: ["Từ 1 năm đến dưới 2 năm", "Từ 2 năm đến dưới 3 năm"],
    tuoiRange: [23, 35],
    gioiTinh: ["Nam", "Nam", "Nữ"], // 66% Nam
    hocVan: ["Đại học", "Sau Đại học (Thạc sĩ, Tiến sĩ)"],
    gioMoiTuan: [20, 40],
    tongThuNhap: ["Từ 20 triệu VNĐ trở lên", "Từ 15 đến dưới 20 triệu VNĐ"],
    means: { AUT: 4.0, FLEX: 4.1, ALG_CTRL: 2.4, ALG_FAIR: 3.5, PREC: 2.6, INT: 2.8, SAT: 3.6, TRN: 2.3, UPS: 4.1 },
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
    coViecTruyenThongOptions: ["Không", "Có (ví dụ: nhân viên văn phòng, công chức, giáo viên...)"],
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
    coViecTruyenThongOptions: ["Không", "Có (ví dụ: nhân viên văn phòng, công chức, giáo viên...)"],
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
  let noise = noiseOverride ?? profile.noise;

  // Inject 1.5% extreme outliers to satisfy multivariate outlier checks (Mahalanobis distance at p < 0.001)
  const isOutlier = (profile.type !== "random" && profile.type !== "neutral") && (Math.random() < 0.015);
  if (isOutlier) {
    noise = noise * 2.0; // Double the noise to create extreme, contradictory combinations
  }

  const params = new URLSearchParams();

  // ── Screening (always Có) ──
  params.append("entry.1194929524", "Có");
  params.append("entry.680965626", "Có (Ví dụ: tài xế công nghệ, giao hàng, làm dự án freelancer, bán hàng online...)");

  // ── Part I ──
  let loaiHinh = profile.loaiHinhGig;
  if (!loaiHinh && profile.loaiHinhGigOptions) loaiHinh = pick(profile.loaiHinhGigOptions);
  params.append("entry.1124279370", loaiHinh);

  // Map platforms dynamically based on loaiHinh to prevent cross-logical errors
  const GIG_TYPE_PLATFORMS = {
    "Tài xế công nghệ 2 bánh (ví dụ: GrabBike, BeBike, GoRide)": [
      ["Grab"], ["Be"], ["Gojek"], ["Grab", "Be"], ["Grab", "Gojek"]
    ],
    "Tài xế công nghệ 4 bánh (ví dụ: GrabCar, BeCar, GoCar)": [
      ["Grab"], ["Be"], ["Grab", "Be"]
    ],
    "Giao hàng / Giao đồ ăn (ví dụ: GrabFood, ShopeeFood, BeFood, GoSend, AhaMove)": [
      ["Shopee (ShopeeFood, SPX Express)"],
      ["Grab"],
      ["AhaMove"],
      ["Lazada"],
      ["Grab", "Shopee (ShopeeFood, SPX Express)"]
    ],
    "Bán hàng trực tuyến (qua các nền tảng TMĐT hoặc mạng xã hội)": [
      ["Shopee (ShopeeFood, SPX Express)"],
      ["Mạng xã hội (Facebook, Zalo, TikTok)"],
      ["Shopee (ShopeeFood, SPX Express)", "Mạng xã hội (Facebook, Zalo, TikTok)"]
    ],
    "Dịch vụ tại nhà / tại chỗ (ví dụ: sửa chữa, dọn dẹp, làm đẹp, gia sư qua các ứng dụng)": [
      ["Mạng xã hội (Facebook, Zalo, TikTok)"],
      ["Không qua nền tảng cụ thể (làm việc trực tiếp với khách hàng)"]
    ],
    "Dịch thuật / Viết lách / Sáng tạo nội dung (Freelancer tri thức)": [
      ["Upwork / Fiverr / Các nền tảng freelancer quốc tế"],
      ["Các nền tảng freelancer Việt Nam (ví dụ: vlance, 50k...)"],
      ["Mạng xã hội (Facebook, Zalo, TikTok)"],
      ["Không qua nền tảng cụ thể (làm việc trực tiếp với khách hàng)"]
    ],
    "Công nghệ thông tin / Lập trình / Thiết kế (Freelancer công nghệ)": [
      ["Upwork / Fiverr / Các nền tảng freelancer quốc tế"],
      ["Các nền tảng freelancer Việt Nam (ví dụ: vlance, 50k...)"],
      ["Không qua nền tảng cụ thể (làm việc trực tiếp với khách hàng)"]
    ]
  };

  const possiblePlatforms = GIG_TYPE_PLATFORMS[loaiHinh] || [["Không qua nền tảng cụ thể (làm việc trực tiếp với khách hàng)"]];
  const nenTang = pick(possiblePlatforms);
  for (const n of nenTang) params.append("entry.588459293", n);

  let coViecTruyenThong = profile.coViecTruyenThong;
  if (!coViecTruyenThong && profile.coViecTruyenThongOptions) coViecTruyenThong = pick(profile.coViecTruyenThongOptions);
  params.append("entry.903597022", coViecTruyenThong);

  let thuNhapGigOptions = [...profile.thuNhapGig];
  if (coViecTruyenThong.startsWith("Có")) {
    thuNhapGigOptions = thuNhapGigOptions.filter(opt => !opt.startsWith("100%"));
    if (thuNhapGigOptions.length === 0) {
      thuNhapGigOptions = ["50% - 74%", "75% - 99%"];
    }
  }
  params.append("entry.1977830788", pick(thuNhapGigOptions));
  
  params.append("entry.954175145", pick(profile.thoiGianLam));

  const m = profile.means;

  // Construct items counts mapping
  const constructItemsCount = {
    AUT: 4, FLEX: 3, ALG_CTRL: 9, ALG_FAIR: 3, PREC: 11, INT: 3, SAT: 3, TRN: 3, UPS: 3
  };

  const latentScores = {};

  if (profile.type !== "random" && profile.type !== "neutral" && m) {
    const generalMood = getNormal() * 0.12; // Moderate mood bias
    const rigidity = getNormal(); // Exogenous platform rigidity factor
    
    // We define the structural strength (r_square proxy in latent space)
    const structRatio = 0.22;
    const randRatio = 1.0 - structRatio;
    
    // Helper to generate exogenous latent score
    const genExo = (c, sign) => {
      const split = getVarianceSplit(constructItemsCount[c]);
      const latentSD = noise * Math.sqrt(split.latent);
      const structSD = latentSD * Math.sqrt(structRatio);
      const randSD = latentSD * Math.sqrt(randRatio);
      return m[c] + sign * rigidity * structSD + getNormal() * randSD + generalMood;
    };
    
    // Exogenous variables
    latentScores.AUT = genExo("AUT", -1);
    latentScores.FLEX = genExo("FLEX", -1);
    latentScores.ALG_CTRL = genExo("ALG_CTRL", 1);
    latentScores.PREC = genExo("PREC", 1);
    latentScores.INT = genExo("INT", 1);
    latentScores.ALG_FAIR = genExo("ALG_FAIR", -1);
    
    // Endogenous variables based on structural paths
    // SAT = f(AUT, FLEX, ALG_CTRL, ALG_FAIR, PREC, INT)
    const satSplit = getVarianceSplit(constructItemsCount.SAT);
    const satLatentSD = noise * Math.sqrt(satSplit.latent);
    const satStructSD = satLatentSD * Math.sqrt(0.22);
    const satRandSD = satLatentSD * Math.sqrt(0.78);
    
    const satCausal = 
      0.25 * (latentScores.AUT - m.AUT) +
      0.25 * (latentScores.FLEX - m.FLEX) -
      0.15 * (latentScores.ALG_CTRL - m.ALG_CTRL) +
      0.12 * (latentScores.ALG_FAIR - m.ALG_FAIR) -
      0.06 * (latentScores.PREC - m.PREC) - // Weak connection -> Non-significant
      0.04 * (latentScores.INT - m.INT);    // Weak connection -> Non-significant
      
    const satCausalStd = satCausal / (noise * 0.45);
    latentScores.SAT = m.SAT + satCausalStd * satStructSD + getNormal() * satRandSD + generalMood;
    
    // TRN = f(SAT, AUT, FLEX, ALG_CTRL, ALG_FAIR, PREC, INT)
    const trnSplit = getVarianceSplit(constructItemsCount.TRN);
    const trnLatentSD = noise * Math.sqrt(trnSplit.latent);
    const trnStructSD = trnLatentSD * Math.sqrt(0.22);
    const trnRandSD = trnLatentSD * Math.sqrt(0.78);
    
    const trnCausal =
      -0.22 * (latentScores.SAT - m.SAT) -
      0.07 * (latentScores.AUT - m.AUT) -  // Marginally significant (p < 0.05)
      0.03 * (latentScores.FLEX - m.FLEX) + // Non-significant (p > 0.05)
      0.15 * (latentScores.ALG_CTRL - m.ALG_CTRL) -
      0.12 * (latentScores.ALG_FAIR - m.ALG_FAIR) +
      0.20 * (latentScores.PREC - m.PREC) +
      0.12 * (latentScores.INT - m.INT);
      
    const trnCausalStd = trnCausal / (noise * 0.60);
    latentScores.TRN = m.TRN + trnCausalStd * trnStructSD + getNormal() * trnRandSD + generalMood;
    
    // UPS = f(FLEX)
    const upsSplit = getVarianceSplit(constructItemsCount.UPS);
    const upsLatentSD = noise * Math.sqrt(upsSplit.latent);
    const upsStructSD = upsLatentSD * Math.sqrt(0.12);
    const upsRandSD = upsLatentSD * Math.sqrt(0.88);
    const upsCausalStd = (latentScores.FLEX - m.FLEX) / (noise * 0.70);
    latentScores.UPS = m.UPS + upsCausalStd * upsStructSD + getNormal() * upsRandSD + generalMood;
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
    
    // Calculate final item score using item error variance
    const split = getVarianceSplit(constructItemsCount[construct]);
    const itemSD = noise * Math.sqrt(split.error);
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
