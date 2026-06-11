import React, { createContext, useContext, useState } from "react";
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
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string, phone: string) => void;
  logout: () => void;
  toggleFavorite: (listingId: string) => void;
  isFavorite: (listingId: string) => boolean;
  sendMessage: (conversationId: string, text: string) => void;
  startConversation: (listingId: string, listingTitle: string, listingImage: string, sellerId: string, sellerName: string, sellerAvatar: string, firstMessage: string) => string;
  submitBoostRequest: (req: Omit<BoostRequest, "id" | "status" | "submittedAt">) => void;
  activateBoost: (requestId: string) => void;
  refuseBoost: (requestId: string) => void;
}

const StoreContext = createContext<AppState | null>(null);

const DEMO_USER: User = {
  id: "me",
  name: "Amine Messaoud",
  email: "amine@example.com",
  phone: "+213 770 000 001",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amine",
  wilaya: "Alger",
  memberSince: "2023",
  rating: 4.7,
  reviews: 18,
  verified: true,
};

const BOOST_KEY = "wiya_boost_requests";

function loadBoosts(): BoostRequest[] {
  try { return JSON.parse(localStorage.getItem(BOOST_KEY) ?? "[]"); } catch { return []; }
}

function saveBoosts(reqs: BoostRequest[]) {
  try { localStorage.setItem(BOOST_KEY, JSON.stringify(reqs)); } catch { /* storage full */ }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<string[]>(["1", "5"]);
  const [conversations, setConversations] = useState<Conversation[]>(CONVERSATIONS);
  const [boostRequests, setBoostRequests] = useState<BoostRequest[]>(loadBoosts);

  const login = (email: string, _password: string) => {
    if (email) { setUser({ ...DEMO_USER, email }); return true; }
    return false;
  };

  const register = (name: string, email: string, _password: string, phone: string) => {
    setUser({ ...DEMO_USER, name, email, phone });
  };

  const logout = () => setUser(null);

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

  const submitBoostRequest = (req: Omit<BoostRequest, "id" | "status" | "submittedAt">) => {
    const newReq: BoostRequest = {
      ...req,
      id: `boost_${Date.now()}`,
      status: "pending",
      submittedAt: new Date().toLocaleString("fr-FR"),
    };
    setBoostRequests((prev) => {
      const updated = [newReq, ...prev];
      saveBoosts(updated);
      return updated;
    });
  };

  const activateBoost = (requestId: string) => {
    setBoostRequests((prev) => {
      const updated = prev.map((r) => r.id === requestId ? { ...r, status: "active" as const } : r);
      saveBoosts(updated);
      return updated;
    });
  };

  const refuseBoost = (requestId: string) => {
    setBoostRequests((prev) => {
      const updated = prev.map((r) => r.id === requestId ? { ...r, status: "refused" as const } : r);
      saveBoosts(updated);
      return updated;
    });
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
