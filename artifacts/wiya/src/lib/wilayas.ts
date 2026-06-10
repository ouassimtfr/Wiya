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
];

export function toSVG(lon: number, lat: number, w: number, h: number) {
  const LON_MIN = -9.5;
  const LON_MAX = 12.5;
  const LAT_MIN = 17.5;
  const LAT_MAX = 38.2;
  const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * w;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * h;
  return { x, y };
}

export const ALGERIA_PATH = `
  M 135,79
  L 148,62
  L 163,49
  L 181,38
  L 200,30
  L 222,27
  L 240,24
  L 258,22
  L 275,22
  L 293,22
  L 310,26
  L 322,23
  L 328,29
  L 328,45
  L 330,68
  L 332,95
  L 338,130
  L 345,160
  L 356,192
  L 370,224
  L 382,270
  L 388,310
  L 390,357
  L 388,375
  L 368,392
  L 348,420
  L 330,450
  L 313,472
  L 290,483
  L 263,488
  L 240,490
  L 216,488
  L 195,480
  L 177,468
  L 163,452
  L 152,430
  L 137,408
  L 117,390
  L 100,375
  L 86,358
  L 74,338
  L 61,316
  L 50,294
  L 40,274
  L 29,258
  L 18,248
  L 12,230
  L 11,208
  L 11,185
  L 11,162
  L 15,148
  L 25,142
  L 50,140
  L 80,138
  L 107,136
  L 120,128
  L 124,115
  L 124,100
  L 128,89
  Z
`;
