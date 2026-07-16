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
  { id: "gâteau", icon: "🍰", color: "#ec4899" },
  { id: "pièces détachées", icon: "⚙️", color: "#64748b" },
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
