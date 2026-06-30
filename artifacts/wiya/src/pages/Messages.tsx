import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "./supabase";
import { Conversation, CONVERSATIONS } from "./data";

export interface User {
  id: string; name: string; email: string; phone: string; avatar: string;
  wilaya: string; memberSince: string; rating: number; reviews: number; verified: boolean;
}

export interface BoostRequest {
  id: string; listingId: string; listingTitle: string; listingImage: string;
  planId: string; planLabel: string; price: number; days: number;
  type: "basic" | "premium"; receiptImage: string; status: "pending" | "active" | "refused";
  submittedAt: string; sellerName: string;
}

interface AppState {
  user: User | null; favorites: string[]; conversations: Conversation[]; boostRequests: BoostRequest[];
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, phone: string) => Promise<void>;
  logout: () => void; toggleFavorite: (listingId: string) => void; isFavorite: (listingId: string) => boolean;
  sendMessage: (conversationId: string, text: string) => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  startConversation: (listingId: string, listingTitle: string, listingImage: string, sellerId: string, sellerName: string, sellerAvatar: string, firstMessage: string) => string;
  submitBoostRequest: (req: Omit<BoostRequest, "id" | "status" | "submittedAt">) => Promise<void>;
  activateBoost: (requestId: string) => void; refuseBoost: (requestId: string) => void;
}

const StoreContext = createContext<AppState | null>(null);

function supabaseUserToUser(sbUser: any): User {
  return {
    id: sbUser.id,
    name: sbUser.user_metadata?.name ?? sbUser.email?.split("@")[0] ?? "Utilisateur",
    email: sbUser.email ?? "",
    phone: sbUser.user_metadata?.phone ?? "",
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${sbUser.id}`,
    wilaya: sbUser.user_metadata?.wilaya ?? "Algérie",
    memberSince: new Date(sbUser.created_at).getFullYear().toString(),
    rating: 0, reviews: 0, verified: sbUser.email_confirmed_at != null,
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>(CONVERSATIONS);
  const [boostRequests, setBoostRequests] = useState<BoostRequest[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setUser(supabaseUserToUser(session.user)); fetchBoostRequests(session.user.id); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) { setUser(supabaseUserToUser(session.user)); fetchBoostRequests(session.user.id); }
      else { setUser(null); setBoostRequests([]); }
    });
    return () => subscription.unsubscribe();
  }, []);

  // --- CORRECTION : FetchMessages maintenant complet et fonctionnel ---
  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("id, sender_id, content, created_at")
      .eq("listing_id", conversationId)
      .order("created_at", { ascending: true });

    if (data) {
      const formattedMessages = data.map((m: any) => ({
        id: m.id,
        senderId: m.sender_id === user?.id ? "me" : "other",
        text: m.content,
        time: new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      }));
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, messages: formattedMessages } : c))
      );
    }
  };

  // ... (Garde toutes tes fonctions : fetchBoostRequests, login, register, logout, toggleFavorite, isFavorite)
  const fetchBoostRequests = async (userId: string) => { /* Ton code original */ };
  const login = async (e: string, p: string) => { /* Ton code original */ return true; };
  const register = async (n: string, e: string, p: string, ph: string) => { /* Ton code original */ };
  const logout = async () => { /* Ton code original */ };
  const toggleFavorite = (id: string) => { /* Ton code original */ };
  const isFavorite = (id: string) => favorites.includes(id);

  const sendMessage = async (conversationId: string, text: string) => {
    if (!user) return;
    await supabase.from("messages").insert({ listing_id: conversationId, sender_id: user.id, content: text });
    await fetchMessages(conversationId); // Recharge automatiquement
  };

  // ... (Garde startConversation, submitBoostRequest, activateBoost, refuseBoost)
  const startConversation = (...args: any[]) => { /* Ton code original */ return "c1"; };
  const submitBoostRequest = async (req: any) => { /* Ton code original */ };
  const activateBoost = async (id: string) => { /* Ton code original */ };
  const refuseBoost = async (id: string) => { /* Ton code original */ };

  return (
    <StoreContext.Provider value={{
      user, favorites, conversations, boostRequests, login, register, logout,
      toggleFavorite, isFavorite, sendMessage, fetchMessages, startConversation,
      submitBoostRequest, activateBoost, refuseBoost,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
