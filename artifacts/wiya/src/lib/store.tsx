import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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
  fetchConversations: () => Promise<void>;
  startConversation: (listingId: string, listingTitle: string, listingImage: string, sellerId: string, sellerName: string, sellerAvatar: string, firstMessage: string) => Promise<string>;
  submitBoostRequest: (req: Omit<BoostRequest, "id" | "status" | "submittedAt">) => Promise<void>;
  activateBoost: (requestId: string) => Promise<void>; refuseBoost: (requestId: string) => Promise<void>;
  updateAvatar: (file: File) => Promise<{ error: string | null }>;
  removeAvatar: () => Promise<{ error: string | null }>;
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

function rowToBoostRequest(r: any): BoostRequest {
  return {
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
  };
}

function parseConversationId(conversationId: string): { listingId: string; otherUserId: string } | null {
  const parts = conversationId.split("__");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return { listingId: parts[0], otherUserId: parts[1] };
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

  useEffect(() => {
    fetchBoostRequests();
  }, []);

  const fetchBoostRequests = async () => {
    const { data, error } = await supabase
      .from("boost_requests")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (error) { console.error("Erreur fetch boost_requests:", error); return; }
    if (data) setBoostRequests(data.map(rowToBoostRequest));
  };

  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!user) return;

    const parsed = parseConversationId(conversationId);
    if (!parsed) { console.error("ID de conversation invalide:", conversationId); return; }
    const { listingId, otherUserId } = parsed;

    const { data, error } = await supabase
      .from("messages")
      .select("id, sender_id, receiver_id, content, created_at")
      .eq("listing_id", listingId)
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });

    if (error) { console.error("Erreur fetch:", error); return; }

    // Marque comme lus tous les messages reçus dans cette conversation, puisqu'on
    // est justement en train de les afficher à l'écran. Sans ça le badge de
    // notification ne redescend jamais.
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("listing_id", listingId)
      .eq("sender_id", otherUserId)
      .eq("receiver_id", user.id)
      .eq("is_read", false);

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
  }, [user]);

  const fetchConversations = useCallback(async () => {
    if (!user) { setConversations([]); return; }

    const { data, error } = await supabase
      .from("messages")
      .select("id, listing_id, sender_id, receiver_id, content, created_at")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: true });

    if (error) { console.error("Erreur fetch conversations:", error); return; }

    const grouped = new Map<string, Conversation>();

    (data || []).forEach((m: any) => {
      const otherUserId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      if (!otherUserId) return;

      const conversationId = `${m.listing_id}__${otherUserId}`;
      const formattedMessage = {
        id: m.id,
        senderId: m.sender_id === user.id ? "me" : "other",
        text: m.content,
        time: new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      };

      const existing = grouped.get(conversationId);
      if (existing) {
        existing.messages.push(formattedMessage);
      } else {
        grouped.set(conversationId, {
          id: conversationId,
          listingTitle: "Conversation",
          listingImage: "",
          otherUser: { name: "Utilisateur" },
          messages: [formattedMessage],
        } as Conversation);
      }
    });

    setConversations(Array.from(grouped.values()));
  }, [user]);

  const sendMessage = useCallback(async (conversationId: string, text: string) => {
    if (!user) return;

    const parsed = parseConversationId(conversationId);
    if (!parsed) { console.error("ID de conversation invalide:", conversationId); return; }
    const { listingId, otherUserId } = parsed;

    const { error } = await supabase
      .from("messages")
      .insert({ listing_id: listingId, sender_id: user.id, receiver_id: otherUserId, content: text });

    if (error) {
      console.error("Erreur envoi message:", error);
      return;
    }

    await fetchMessages(conversationId);
  }, [user, fetchMessages]);

  const login = async (e: string, p: string) => { const { data, error } = await supabase.auth.signInWithPassword({ email: e, password: p }); return !error; };
  const register = async (n: string, e: string, p: string, ph: string) => { await supabase.auth.signUp({ email: e, password: p, options: { data: { name: n, phone: ph } } }); };
  const logout = async () => { await supabase.auth.signOut(); setUser(null); };
  const toggleFavorite = (id: string) => setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  const isFavorite = (id: string) => favorites.includes(id);

  const startConversation = useCallback(async (
    listingId: string,
    _listingTitle: string,
    _listingImage: string,
    sellerId: string,
    _sellerName: string,
    _sellerAvatar: string,
    firstMessage: string
  ): Promise<string> => {
    const conversationId = `${listingId}__${sellerId}`;
    if (!user) return conversationId;

    const { error } = await supabase
      .from("messages")
      .insert({
        listing_id: listingId,
        sender_id: user.id,
        receiver_id: sellerId,
        content: firstMessage,
      });

    if (error) {
      console.error("Erreur création conversation:", error);
    }

    return conversationId;
  }, [user]);

  const submitBoostRequest = async (req: Omit<BoostRequest, "id" | "status" | "submittedAt">) => {
    const { data, error } = await supabase
      .from("boost_requests")
      .insert({
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
        submitted_at: new Date().toISOString(),
        seller_name: req.sellerName,
      })
      .select()
      .single();

    if (error) {
      console.error("Erreur soumission boost:", error);
      throw error;
    }

    if (data) {
      setBoostRequests((prev) => [rowToBoostRequest(data), ...prev]);
    }
  };

  const activateBoost = async (requestId: string) => {
    const { data: reqRow, error: fetchErr } = await supabase
      .from("boost_requests")
      .select("listing_id")
      .eq("id", requestId)
      .single();

    if (fetchErr || !reqRow) { console.error("Erreur récupération demande de boost:", fetchErr); return; }

    const { error: updateReqErr } = await supabase
      .from("boost_requests")
      .update({ status: "active" })
      .eq("id", requestId);

    if (updateReqErr) { console.error("Erreur activation boost:", updateReqErr); return; }

    const { error: updateListingErr } = await supabase
      .from("listings")
      .update({ is_boosted: true })
      .eq("id", reqRow.listing_id);

    if (updateListingErr) { console.error("Erreur mise à jour is_boosted:", updateListingErr); return; }

    setBoostRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status: "active" } : r)));
  };

  const refuseBoost = async (requestId: string) => {
    const { error } = await supabase
      .from("boost_requests")
      .update({ status: "refused" })
      .eq("id", requestId);

    if (error) { console.error("Erreur refus boost:", error); return; }

    setBoostRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status: "refused" } : r)));
  };

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

  const removeAvatar = async (): Promise<{ error: string | null }> => {
    if (!user) return { error: "Non connecté" };

    const { data: files } = await supabase.storage.from("avatars").list(user.id);
    if (files && files.length > 0) {
      const paths = files.map((f) => `${user.id}/${f.name}`);
      await supabase.storage.from("avatars").remove(paths);
    }

    const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_url: null } });

    if (updateError) {
      console.error("Erreur suppression avatar:", updateError);
      return { error: updateError.message };
    }

    setUser((prev) => (prev ? { ...prev, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${prev.id}` } : prev));
    return { error: null };
  };

  return (
    <StoreContext.Provider value={{
      user, favorites, conversations, boostRequests, login, register, logout,
      toggleFavorite, isFavorite, sendMessage, fetchMessages, fetchConversations, startConversation,
      submitBoostRequest, activateBoost, refuseBoost, updateAvatar, removeAvatar,
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
