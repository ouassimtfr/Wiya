import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "./supabase";
import { Conversation, CONVERSATIONS } from "./data";

// ... (Garde tes interfaces User, BoostRequest, AppState, etc. telles quelles)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>(CONVERSATIONS);
  const [boostRequests, setBoostRequests] = useState<BoostRequest[]>([]);

  // MODIFICATION : Charger les conversations depuis Supabase au démarrage
  useEffect(() => {
    const fetchConversations = async () => {
      const { data, error } = await supabase.from("conversations").select("*");
      if (data) {
        // Ici, tu mappes tes données Supabase vers ton type Conversation
        setConversations(data); 
      }
    };
    fetchConversations();
  }, []);

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

  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("id, sender_id, content, created_at")
      .eq("listing_id", conversationId) // Assure-toi que ton message a bien cet ID
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

  // ... (Garde toutes tes autres fonctions : fetchBoostRequests, login, register, etc.)

  const sendMessage = async (conversationId: string, text: string) => {
    if (!user) return;

    // Insertion dans Supabase
    await supabase.from("messages").insert({
      listing_id: conversationId,
      sender_id: user.id,
      content: text,
    });

    // Mise à jour immédiate de l'interface
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== conversationId) return c;
        const newMsg = {
          id: `m${Date.now()}`,
          senderId: "me",
          text,
          time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        };
        return { ...c, messages: [...c.messages, newMsg], lastMessage: text };
      })
    );
  };

  // ... (Garde le reste du code intact jusqu'à la fin du fichier)

  return (
    <StoreContext.Provider value={{
      user, favorites, conversations, boostRequests,
      login, register, logout, toggleFavorite, isFavorite,
      sendMessage, fetchMessages, startConversation,
      submitBoostRequest, activateBoost, refuseBoost,
    }}>
      {children}
    </StoreContext.Provider>
  );
}
