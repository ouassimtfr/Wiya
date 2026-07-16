export interface Listing {
  id: string;
  title: string;
  titleAr: string;
  price: number;
  negotiable: boolean;
  category: string;
  wilaya: string;
  city: string;
  condition: "new" | "used";
  description: string;
  descriptionAr: string;
  images: string[];
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  sellerPhone: string;
  sellerRating: number;
  sellerReviews: number;
  sellerSince: string;
  postedAt: string;
  views: number;
  isBoosted: boolean;
  isUrgent: boolean;
}

export interface Conversation {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  otherUser: { id: string; name: string; avatar: string };
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  messages: { id: string; senderId: string; text: string; time: string }[];
}

export const CATEGORIES = [
  { id: "real_estate", icon: "🏠", color: "#16a34a" },
  { id: "vehicles", icon: "🚗", color: "#dc2626" },
  { id: "electronics", icon: "📱", color: "#2563eb" },
  { id: "clothing", icon: "👕", color: "#9333ea" },
  { id: "home_garden", icon: "🛋️", color: "#ea580c" },
  { id: "jobs", icon: "💼", color: "#0891b2" },
  { id: "services", icon: "🔧", color: "#78716c" },
  { id: "animals", icon: "🐾", color: "#65a30d" },
  { id: "cakes", icon: "🍰", color: "#ec4899" },
  { id: "appliances_parts", icon: "⚙️", color: "#64748b" },
];

export const WILAYAS = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa",
  "Biskra", "Béchar", "Blida", "Bouira", "Tamanrasset", "Tébessa",
  "Tlemcen", "Tiaret", "Tizi Ouzou", "Alger", "Djelfa", "Jijel",
  "Sétif", "Saïda", "Skikda", "Sidi Bel Abbès", "Annaba", "Guelma",
  "Constantine", "Médéa", "Mostaganem", "M'Sila", "Mascara", "Ouargla",
  "Oran", "El Bayadh", "Illizi", "Bordj Bou Arréridj", "Boumerdès",
  "El Tarf", "Tindouf", "Tissemsilt", "El Oued", "Khenchela",
  "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma", "Aïn Témouchent",
  "Ghardaïa", "Relizane",
  "Timimoun", "Bordj Badji Mokhtar", "Ouled Djellal", "Béni Abbès",
  "In Salah", "In Guezzam", "Touggourt", "Djanet", "El M'Ghair", "El Menia",
  "Hassi Messaoud", "Ain Oussera", "Bou Saâda", "El Khroub", "Kolea",
  "Hadjout", "Ain El Hammam", "Baraki", "Sidi Amar", "El Eulma", "Drean",
];

export const LISTINGS: Listing[] = [
  {
    id: "1",
    title: "iPhone 14 Pro 256GB – Excellent état",
    titleAr: "آيفون 14 برو 256 جيغا – حالة ممتازة",
    price: 145000,
    negotiable: true,
    category: "electronics",
    wilaya: "Alger",
    city: "Hydra",
    condition: "used",
    description: "iPhone 14 Pro 256GB Space Black. Utilisé 6 mois, aucune rayure. Vient avec boîte originale, chargeur et coque de protection. Batterie à 96%.",
    descriptionAr: "آيفون 14 برو 256 جيغابايت لون أسود. مستعمل 6 أشهر، بدون خدوش. يأتي مع العلبة الأصلية والشاحن وغطاء الحماية. البطارية 96%.",
    images: [
      "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=500&q=80",
      "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&q=80",
    ],
    sellerId: "u1",
    sellerName: "Karim Benali",
    sellerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Karim",
    sellerPhone: "+213 555 123 456",
    sellerRating: 4.8,
    sellerReviews: 34,
    sellerSince: "2022",
    postedAt: "15 Jan 2024",
    views: 342,
    isBoosted: true,
    isUrgent: false,
  },
  {
    id: "2",
    title: "Appartement F3 à louer – Oran Centre",
    titleAr: "شقة F3 للإيجار – وسط وهران",
    price: 35000,
    negotiable: false,
    category: "real_estate",
    wilaya: "Oran",
    city: "Centre-ville",
    condition: "used",
    description: "Beau F3 de 85m² au 3ème étage avec ascenseur. Proche de tous les commerces. Cuisine équipée, 2 chambres, salon. Disponible immédiatement.",
    descriptionAr: "شقة F3 جميلة بمساحة 85 متر مربع في الطابق الثالث مع مصعد. قريبة من جميع المحلات. مطبخ مجهز، غرفتان، صالون. متاحة فوراً.",
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&q=80",
    ],
    sellerId: "u2",
    sellerName: "Nadia Khelifi",
    sellerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nadia",
    sellerPhone: "+213 661 234 567",
    sellerRating: 4.5,
    sellerReviews: 12,
    sellerSince: "2021",
    postedAt: "14 Jan 2024",
    views: 891,
    isBoosted: true,
    isUrgent: false,
  },
  {
    id: "3",
    title: "Renault Clio 4 – 2019 – 65 000 km",
    titleAr: "رينو كليو 4 – 2019 – 65 ألف كم",
    price: 285000,
    negotiable: true,
    category: "vehicles",
    wilaya: "Constantine",
    city: "El Khroub",
    condition: "used",
    description: "Renault Clio 4 essence, 1.2L, climatisation, vitres électriques. Entretien régulier, carnet de révision à jour. Première main.",
    descriptionAr: "رينو كليو 4 بنزين، 1.2 لتر، تكييف هواء، نوافذ كهربائية. صيانة منتظمة، كتيب المراجعة محدث. مالك أول.",
    images: [
      "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=500&q=80",
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=500&q=80",
    ],
    sellerId: "u3",
    sellerName: "Yacine Amrani",
    sellerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Yacine",
    sellerPhone: "+213 770 345 678",
    sellerRating: 4.9,
    sellerReviews: 67,
    sellerSince: "2020",
    postedAt: "13 Jan 2024",
    views: 1243,
    isBoosted: false,
    isUrgent: true,
  },
];

export const CONVERSATIONS: Conversation[] = [
  {
    id: "c1",
    listingId: "1",
    listingTitle: "iPhone 14 Pro 256GB",
    listingImage: "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=100&q=80",
    otherUser: { id: "u1", name: "Karim Benali", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Karim" },
    lastMessage: "Est-ce que le prix est ferme ?",
    lastMessageTime: "14:23",
    unread: 2,
    messages: [
      { id: "m1", senderId: "me", text: "Bonjour, est-ce que l'iPhone est encore disponible ?", time: "14:00" },
      { id: "m2", senderId: "u1", text: "Oui, il est toujours disponible ! Vous êtes intéressé ?", time: "14:15" },
      { id: "m3", senderId: "me", text: "Est-ce que le prix est ferme ?", time: "14:23" },
    ],
  },
];
