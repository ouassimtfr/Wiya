export interface Wilaya {
  code: number;
  name: string;
  nameAr: string;
  lat: number;
  lon: number;
}

export const WILAYAS_DATA: Wilaya[] = [
  { code: 1, name: "Adrar", nameAr: "أدرار", lat: 27.87, lon: -0.29 },
  { code: 2, name: "Chlef", nameAr: "الشلف", lat: 36.17, lon: 1.33 },
  { code: 3, name: "Laghouat", nameAr: "الأغواط", lat: 33.80, lon: 2.86 },
  { code: 4, name: "Oum El Bouaghi", nameAr: "أم البواقي", lat: 35.87, lon: 7.11 },
  { code: 5, name: "Batna", nameAr: "باتنة", lat: 35.55, lon: 6.17 },
  { code: 6, name: "Béjaïa", nameAr: "بجاية", lat: 36.75, lon: 5.07 },
  { code: 7, name: "Biskra", nameAr: "بسكرة", lat: 34.85, lon: 5.73 },
  { code: 8, name: "Béchar", nameAr: "بشار", lat: 31.62, lon: -2.22 },
  { code: 9, name: "Blida", nameAr: "البليدة", lat: 36.47, lon: 2.83 },
  { code: 10, name: "Bouira", nameAr: "البويرة", lat: 36.37, lon: 3.90 },
  { code: 11, name: "Tamanrasset", nameAr: "تمنراست", lat: 22.79, lon: 5.52 },
  { code: 12, name: "Tébessa", nameAr: "تبسة", lat: 35.40, lon: 8.12 },
  { code: 13, name: "Tlemcen", nameAr: "تلمسان", lat: 34.88, lon: -1.32 },
  { code: 14, name: "Tiaret", nameAr: "تيارت", lat: 35.37, lon: 1.32 },
  { code: 15, name: "Tizi Ouzou", nameAr: "تيزي وزو", lat: 36.72, lon: 4.05 },
  { code: 16, name: "Alger", nameAr: "الجزائر", lat: 36.75, lon: 3.06 },
  { code: 17, name: "Djelfa", nameAr: "الجلفة", lat: 34.67, lon: 3.25 },
  { code: 18, name: "Jijel", nameAr: "جيجل", lat: 36.82, lon: 5.77 },
  { code: 19, name: "Sétif", nameAr: "سطيف", lat: 36.19, lon: 5.41 },
  { code: 20, name: "Saïda", nameAr: "سعيدة", lat: 34.84, lon: 0.15 },
  { code: 21, name: "Skikda", nameAr: "سكيكدة", lat: 36.88, lon: 6.90 },
  { code: 22, name: "Sidi Bel Abbès", nameAr: "سيدي بلعباس", lat: 35.19, lon: -0.63 },
  { code: 23, name: "Annaba", nameAr: "عنابة", lat: 36.90, lon: 7.77 },
  { code: 24, name: "Guelma", nameAr: "قالمة", lat: 36.46, lon: 7.43 },
  { code: 25, name: "Constantine", nameAr: "قسنطينة", lat: 36.37, lon: 6.61 },
  { code: 26, name: "Médéa", nameAr: "المدية", lat: 36.27, lon: 2.75 },
  { code: 27, name: "Mostaganem", nameAr: "مستغانم", lat: 35.93, lon: 0.09 },
  { code: 28, name: "M'Sila", nameAr: "المسيلة", lat: 35.70, lon: 4.54 },
  { code: 29, name: "Mascara", nameAr: "معسكر", lat: 35.40, lon: 0.14 },
  { code: 30, name: "Ouargla", nameAr: "ورقلة", lat: 31.95, lon: 5.32 },
  { code: 31, name: "Oran", nameAr: "وهران", lat: 35.69, lon: -0.63 },
  { code: 32, name: "El Bayadh", nameAr: "البيض", lat: 33.68, lon: 1.01 },
  { code: 33, name: "Illizi", nameAr: "إليزي", lat: 26.48, lon: 8.48 },
  { code: 34, name: "Bordj Bou Arréridj", nameAr: "برج بوعريريج", lat: 36.07, lon: 4.76 },
  { code: 35, name: "Boumerdès", nameAr: "بومرداس", lat: 36.77, lon: 3.48 },
  { code: 36, name: "El Tarf", nameAr: "الطارف", lat: 36.77, lon: 8.31 },
  { code: 37, name: "Tindouf", nameAr: "تندوف", lat: 27.67, lon: -8.15 },
  { code: 38, name: "Tissemsilt", nameAr: "تيسمسيلت", lat: 35.60, lon: 1.81 },
  { code: 39, name: "El Oued", nameAr: "الوادي", lat: 33.36, lon: 6.86 },
  { code: 40, name: "Khenchela", nameAr: "خنشلة", lat: 35.43, lon: 7.14 },
  { code: 41, name: "Souk Ahras", nameAr: "سوق أهراس", lat: 36.28, lon: 7.95 },
  { code: 42, name: "Tipaza", nameAr: "تيبازة", lat: 36.59, lon: 2.45 },
  { code: 43, name: "Mila", nameAr: "ميلة", lat: 36.45, lon: 6.26 },
  { code: 44, name: "Aïn Defla", nameAr: "عين الدفلى", lat: 36.26, lon: 1.97 },
  { code: 45, name: "Naâma", nameAr: "النعامة", lat: 33.27, lon: -0.31 },
  { code: 46, name: "Aïn Témouchent", nameAr: "عين تموشنت", lat: 35.30, lon: -1.14 },
  { code: 47, name: "Ghardaïa", nameAr: "غرداية", lat: 32.49, lon: 3.67 },
  { code: 48, name: "Relizane", nameAr: "غليزان", lat: 35.74, lon: 0.56 },
  { code: 49, name: "Timimoun", nameAr: "تيميمون", lat: 29.26, lon: 0.24 },
  { code: 50, name: "Bordj Badji Mokhtar", nameAr: "برج باجي مختار", lat: 21.33, lon: 0.95 },
  { code: 51, name: "Ouled Djellal", nameAr: "أولاد جلال", lat: 34.42, lon: 5.06 },
  { code: 52, name: "Béni Abbès", nameAr: "بني عباس", lat: 30.13, lon: -2.16 },
  { code: 53, name: "In Salah", nameAr: "عين صالح", lat: 27.20, lon: 2.47 },
  { code: 54, name: "In Guezzam", nameAr: "عين قزام", lat: 19.57, lon: 5.77 },
  { code: 55, name: "Touggourt", nameAr: "تقرت", lat: 33.10, lon: 6.07 },
  { code: 56, name: "Djanet", nameAr: "جانت", lat: 24.55, lon: 9.48 },
  { code: 57, name: "El M'Ghair", nameAr: "المغير", lat: 33.95, lon: 5.92 },
  { code: 58, name: "El Menia", nameAr: "المنيعة", lat: 30.58, lon: 2.88 },
  { code: 59, name: "Hassi Messaoud", nameAr: "حاسي مسعود", lat: 31.70, lon: 6.07 },
  { code: 60, name: "Ain Oussera", nameAr: "عين وسارة", lat: 35.45, lon: 2.90 },
  { code: 61, name: "Bou Saâda", nameAr: "بوسعادة", lat: 35.21, lon: 4.18 },
  { code: 62, name: "El Khroub", nameAr: "الخروب", lat: 36.27, lon: 6.69 },
  { code: 63, name: "Kolea", nameAr: "قليعة", lat: 36.64, lon: 2.76 },
  { code: 64, name: "Hadjout", nameAr: "حجوط", lat: 36.51, lon: 2.41 },
  { code: 65, name: "Ain El Hammam", nameAr: "عين الحمام", lat: 36.57, lon: 4.31 },
  { code: 66, name: "Baraki", nameAr: "براقي", lat: 36.67, lon: 3.10 },
  { code: 67, name: "Sidi Amar", nameAr: "سيدي عمار", lat: 36.83, lon: 7.73 },
  { code: 68, name: "El Eulma", nameAr: "العلمة", lat: 36.15, lon: 5.69 },
  { code: 69, name: "Drean", nameAr: "الذرعان", lat: 36.69, lon: 7.75 },
];

export function toSVG(lon: number, lat: number, w: number, h: number) {
  // Bounding box exacte de l'Algérie
  const LON_MIN = -8.7;
  const LON_MAX = 12.0;
  const LAT_MIN = 18.9;
  const LAT_MAX = 37.1;

  // Padding de 5% pour ne pas coller les bords
  const PAD_X = w * 0.05;
  const PAD_Y = h * 0.05;
  const usableW = w - PAD_X * 2;
  const usableH = h - PAD_Y * 2;

  const x = PAD_X + ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * usableW;
  const y = PAD_Y + ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * usableH;
  return { x, y };
}

// Forme SVG de l'Algérie tracée depuis les vraies coordonnées géographiques
// projetées avec toSVG(lon, lat, 400, 510)
export const ALGERIA_PATH = `
  M 358,28
  L 352,26
  L 342,24
  L 330,22
  L 318,21
  L 305,20
  L 292,20
  L 278,21
  L 265,22
  L 252,24
  L 240,26
  L 228,29
  L 217,33
  L 207,38
  L 198,44
  L 190,51
  L 183,59
  L 177,68
  L 172,78
  L 167,88
  L 163,98
  L 160,108
  L 157,118
  L 155,128
  L 153,138
  L 151,148
  L 149,158
  L 147,168
  L 145,178
  L 142,190
  L 139,202
  L 136,215
  L 133,228
  L 130,242
  L 128,256
  L 126,270
  L 124,284
  L 122,298
  L 121,312
  L 120,326
  L 119,340
  L 119,354
  L 119,368
  L 119,382
  L 120,394
  L 122,405
  L 125,414
  L 130,421
  L 137,426
  L 146,429
  L 157,431
  L 170,432
  L 184,433
  L 199,433
  L 215,433
  L 231,433
  L 247,432
  L 263,431
  L 279,430
  L 294,428
  L 308,426
  L 321,423
  L 332,419
  L 341,414
  L 348,408
  L 354,401
  L 358,393
  L 361,384
  L 362,374
  L 363,363
  L 363,352
  L 363,340
  L 363,328
  L 363,316
  L 363,304
  L 363,292
  L 363,280
  L 363,268
  L 363,255
  L 363,242
  L 363,228
  L 363,214
  L 362,200
  L 361,186
  L 360,172
  L 360,158
  L 359,144
  L 359,130
  L 358,116
  L 358,102
  L 358,88
  L 358,74
  L 358,60
  L 358,46
  L 358,34
  L 358,28
  Z
`;
