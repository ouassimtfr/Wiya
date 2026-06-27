import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "./supabase";
import { Conversation, CONVERSATIONS } from "./data";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  wilaya: string;
  memberSince: string;
  rating: number;
  reviews: number;
  verified: boolean;
}

export interface BoostRequest {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  planId: string;
  planLabel: string;
  price: number;
  days: number;
  type: "basic" | "premium";
  receiptImage: string;
  status: "pending" | "active" | "refused";
  submittedAt: string;
  sellerName: string;
}

interface AppState {
  user: User | null;
  favorites: string[];
  conversations: Conversation[];
  boostRequests: BoostRequest[];
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, phone: string) => Promise<void>;
  logout: () => void;
  toggleFavorite: (listingId: string) => void;
  isFavorite: (listingId: string) => boolean;
  sendMessage: (conversationId: string, text: string) => void;
  startConversation: (listingId: string, listingTitle: string, listingImage: string, sellerId: string, sellerName: string, sellerAvatar: string, firstMessage: string) => string;
  submitBoostRequest: (req: Omit<BoostRequest, "id" | "status" | "submittedAt">) => Promise<void>;
  activateBoost: (requestId: string) => void;
  refuseBoost: (requestId: string) => void;
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
    rating: 0,
    reviews: 0,
    verified: sbUser.email_confirmed_at != null,
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>(CONVERSATIONS);
  const [boostRequests, setBoostRequests] = useState<BoostRequest[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(supabaseUserToUser(session.user));
        fetchBoostRequests(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(supabaseUserToUser(session.user));
        fetchBoostRequests(session.user.id);
      } else {
        setUser(null);
        setBoostRequests([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchBoostRequests = async (userId: string) => {
    const { data } = await supabase
      .from("boost_requests")
      .select("*")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false });

    if (data) {
      setBoostRequests(data.map((r: any) => ({
        id: r.id,
        listingId: r.listing_id,
        listingTitle: r.listing_title,
        listingImage: r.listing_image,
        planId: r.plan_id,
        planLabel: r.plan_label,
        price: r.price,
        days: r.days,
        type: r.type,
        receiptImage: r.receipt_image,
        status: r.status,
        submittedAt: r.submitted_at,
        sellerName: r.seller_name,
      })));
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return false;
    setUser(supabaseUserToUser(data.user));
    return true;
  };

  const register = async (name: string, email: string, password: string, phone: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone } }
    });
    if (!error && data.user) setUser(supabaseUserToUser(data.user));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setBoostRequests([]);
  };

  const toggleFavorite = (listingId: string) => {
    setFavorites((prev) =>
      prev.includes(listingId) ? prev.filter((id) => id !== listingId) : [...prev, listingId]
    );
  };

  const isFavorite = (listingId: string) => favorites.includes(listingId);

  const sendMessage = (conversationId: string, text: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== conversationId) return c;
        const newMsg = {
          id: `m${Date.now()}`,
          senderId: "me",
          text,
          time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        };
        return { ...c, messages: [...c.messages, newMsg], lastMessage: text, lastMessageTime: newMsg.time, unread: 0 };
      })
    );
  };

  const startConversation = (
    listingId: string, listingTitle: string, listingImage: string,
    sellerId: string, sellerName: string, sellerAvatar: string, firstMessage: string
  ): string => {
    const existing = conversations.find((c) => c.listingId === listingId);
    if (existing) { sendMessage(existing.id, firstMessage); return existing.id; }
    const newConv: Conversation = {
      id: `c${Date.now()}`,
      listingId, listingTitle, listingImage,
      otherUser: { id: sellerId, name: sellerName, avatar: sellerAvatar },
      lastMessage: firstMessage,
      lastMessageTime: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      unread: 0,
      messages: [{
        id: `m${Date.now()}`, senderId: "me", text: firstMessage,
        time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      }],
    };
    setConversations((prev) => [newConv, ...prev]);
    return newConv.id;
  };

  // FIX: Sauvegarde dans Supabase au lieu de localStorage
  const submitBoostRequest = async (req: Omit<BoostRequest, "id" | "status" | "submittedAt">) => {
    if (!user) return;

    const { data, error } = await supabase.from("boost_requests").insert({
      listing_id: req.listingId,
      listing_title: req.listingTitle,
      listing_image: req.listingImage,
      plan_id: req.planId,
      plan_label: req.planLabel,
      price: req.price,
      days: req.days,
      type: req.type,
      receipt_image: req.receiptImage,
      status: "pending",
      seller_name: req.sellerName,
      user_id: user.id,
    }).select().single();

    if (!error && data) {
      const newReq: BoostRequest = {
        id: data.id,
        listingId: data.listing_id,
        listingTitle: data.listing_title,
        listingImage: data.listing_image,
        planId: data.plan_id,
        planLabel: data.plan_label,
        price: data.price,
        days: data.days,
        type: data.type,
        receiptImage: data.receipt_image,
        status: data.status,
        submittedAt: data.submitted_at,
        sellerName: data.seller_name,
      };
      setBoostRequests((prev) => [newReq, ...prev]);
    }
  };

  const activateBoost = async (requestId: string) => {
    await supabase.from("boost_requests").update({ status: "active" }).eq("id", requestId);
    setBoostRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, status: "active" as const } : r));
  };

  const refuseBoost = async (requestId: string) => {
    await supabase.from("boost_requests").update({ status: "refused" }).eq("id", requestId);
    setBoostRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, status: "refused" as const } : r));
  };

  return (
    <StoreContext.Provider value={{
      user, favorites, conversations, boostRequests,
      login, register, logout, toggleFavorite, isFavorite,
      sendMessage, startConversation,
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
