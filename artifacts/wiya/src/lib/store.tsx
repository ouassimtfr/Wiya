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
  updateAvatar: (file: File) => Promise<{ error: string | null }>;
}

const StoreContext = createContext<AppState | null>(null);

function supabaseUserToUser(sbUser: any): User {
  return {
    id: sbUser.id,
    name: sbUser.user_metadata?.name ?? sbUser.email?.split("@")[0] ?? "Utilisateur",
    email: sbUser.email ?? "",
    phone: sbUser.user_metadata?.phone ?? "",
    avatar: sbUser.user_metadata?.avatar_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${sbUser.id}`,
    wilaya: sbUser.user_metadata?.wilaya ?? "Algérie",
    memberSince: new Date(sbUser.created_at).getFullYear().toString(),
    rating: 0, reviews: 0, verified: sbUser.email_confirmed_at != null,
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [boostRequests, setBoostRequests] = useState<BoostRequest[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setUser(supabaseUserToUser(session.user)); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) { setUser(supabaseUserToUser(session.user)); }
      else { setUser(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchMessages = async (conversationId: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from("messages")
      .select("id, sender_id, content, created_at")
      .eq("listing_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) { console.error("Erreur fetch:", error); return; }

    const formattedMessages = data.map((m: any) => ({
      id: m.id,
      senderId: m.sender_id === user.id ? "me" : "other",
      text: m.content,
      time: new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    }));

    setConversations((prev) => {
      const exists = prev.find((c) => c.id === conversationId);
      if (exists) {
        return prev.map((c) => (c.id === conversationId ? { ...c, messages: formattedMessages } : c));
      }
      return [...prev, { id: conversationId, listingTitle: "Conversation", listingImage: "", otherUser: { name: "Vendeur" }, messages: formattedMessages } as Conversation];
    });
  };

  const sendMessage = async (conversationId: string, text: string) => {
    if (!user) return;
    const { error } = await supabase.from("messages").insert({ listing_id: conversationId, sender_id: user.id, content: text });
    if (!error) await fetchMessages(conversationId);
  };

  const login = async (e: string, p: string) => { const { data, error } = await supabase.auth.signInWithPassword({ email: e, password: p }); return !error; };
  const register = async (n: string, e: string, p: string, ph: string) => { await supabase.auth.signUp({ email: e, password: p, options: { data: { name: n, phone: ph } } }); };
  const logout = async () => { await supabase.auth.signOut(); setUser(null); };
  const toggleFavorite = (id: string) => setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  const isFavorite = (id: string) => favorites.includes(id);
  const startConversation = () => "c1"; 
  const submitBoostRequest = async () => {};
  const activateBoost = async () => {};
  const refuseBoost = async () => {};

  const updateAvatar = async (file: File): Promise<{ error: string | null }> => {
    if (!user) return { error: "Non connecté" };

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error("Erreur upload avatar:", uploadError);
      return { error: uploadError.message };
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const avatarUrl = `${data.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } });

    if (updateError) {
      console.error("Erreur mise à jour profil:", updateError);
      return { error: updateError.message };
    }

    setUser((prev) => (prev ? { ...prev, avatar: avatarUrl } : prev));
    return { error: null };
  };

  return (
    <StoreContext.Provider value={{
      user, favorites, conversations, boostRequests, login, register, logout,
      toggleFavorite, isFavorite, sendMessage, fetchMessages, startConversation,
      submitBoostRequest, activateBoost, refuseBoost, updateAvatar,
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
