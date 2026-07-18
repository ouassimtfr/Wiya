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
  { id: "cake", icon: "🍰", color: "#ec4899" },
  { id: "spare_parts", icon: "⚙️", color: "#64748b" },
  { id: "computers", icon: "💻", color: "#4f46e5" },
  { id: "phones", icon: "📞", color: "#0ea5e9" },
  { id: "baby_kids", icon: "🧸", color: "#f472b6" },
  { id: "beauty_health", icon: "💄", color: "#db2777" },
  { id: "sports_leisure", icon: "⚽", color: "#f59e0b" },
  { id: "multimedia_games", icon: "🎮", color: "#7c3aed" },
  { id: "books_supplies", icon: "📚", color: "#a16207" },
  { id: "agriculture", icon: "🚜", color: "#4d7c0f" },
  { id: "livestock", icon: "🐐", color: "#854d0e" },
  { id: "wedding_events", icon: "🎉", color: "#e11d48" },
  { id: "music_instruments", icon: "🎸", color: "#b45309" },
  { id: "travel", icon: "✈️", color: "#0284c7" },
  { id: "professional_equipment", icon: "🏢", color: "#475569" },
  { id: "antiques_art", icon: "🖼️", color: "#a855f7" },
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

export const LISTINGS: Listing[] = [];

export const CONVERSATIONS: Conversation[] = [];
