import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Send, MoreVertical, ChevronLeft, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  listing_id: string;
}

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { t, isRTL } = useI18n();
  const { user } = useStore();
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [listing, setListing] = useState<any>(null);
  const [otherUserId, setOtherUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversation();
    const cleanup = setupRealtime();
    return () => { cleanup.then(fn => fn?.()); };
  }, [params.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const fetchConversation = async () => {
    if (!user) return;
    setLoading(true);

    const { data: listingData } = await supabase
      .from("listings")
      .select("*")
      .eq("id", params.id)
      .single();

    if (listingData) {
      setListing(listingData);
      // Logique initiale : si je suis acheteur, le vendeur est le receiver par défaut
      if (listingData.user_id !== user.id) {
        setOtherUserId(listingData.user_id);
      }
    }

    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("listing_id", params.id)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: true });

    if (msgs && msgs.length > 0) {
      setMessages(msgs);
      // Si je suis vendeur, j'extrais l'ID de l'acheteur depuis les messages
      const firstMsg = msgs[0];
      const participantId = firstMsg.sender_id === user.id ? firstMsg.receiver_id : firstMsg.sender_id;
      setOtherUserId(participantId);
    } else if (msgs) {
      setMessages(msgs);
    }

    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("listing_id", params.id)
      .eq("receiver_id", user.id);

    setLoading(false);
  };

  const setupRealtime = async () => {
    const subscription = supabase
      .channel(`chat:${params.id}:${user?.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `listing_id=eq.${params.id}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        if (newMsg.sender_id !== user?.id && newMsg.receiver_id !== user?.id) return;
        setMessages((prev) => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  };

  const handleSend = async (customText?: string) => {
    const msgText = customText ?? text.trim();
    if (!msgText || !user || !listing) return;

    // CORRECTION CRUCIALE : on s'assure d'avoir un receiverId valide
    const receiverId = (listing.user_id === user.id) ? otherUserId : listing.user_id;
    
    if (!receiverId) {
      console.error("Impossible d'envoyer : Destinataire inconnu");
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const newMsg: Message = {
      id: tempId,
      sender_id: user.id,
      receiver_id: receiverId,
      content: msgText,
      created_at: new Date().toISOString(),
      listing_id: params.id,
    };

    setMessages((prev) => [...prev, newMsg]);
    setText("");

    const { data, error } = await supabase.from("messages").insert({
      listing_id: params.id,
      sender_id: user.id,
      receiver_id: receiverId,
      content: msgText,
      is_read: false,
    }).select().single();

    if (!error && data) {
      setMessages((prev) => prev.map(m => m.id === tempId ? data : m));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isVendeur = listing?.user_id === user?.id;

  return (
    <div className="bg-[#F0F2F0] flex flex-col h-screen">
      <div className="bg-[#1B6B3A] px-4 pt-12 pb-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate("/messages")} className="w-8 h-8 flex items-center justify-center">
          <ChevronLeft className={`w-5 h-5 text-white ${isRTL ? "rotate-180" : ""}`} />
        </button>
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
          {listing?.images?.[0] ? <img src={listing.images[0]} alt="" className="w-full h-full object-cover" /> : <span className="text-white text-sm font-bold">{listing?.title?.[0] ?? "?"}</span>}
        </div>
        <div className="flex-1">
          <p className="text-white text-sm font-bold leading-tight">{isVendeur ? "Acheteur" : "Vendeur"}</p>
          <p className="text-green-200 text-[11px] truncate">{listing?.title ?? "Annonce"}</p>
        </div>
        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20">
          <MoreVertical className="w-4 h-4 text-white" />
        </button>
      </div>

      {listing && (
        <div onClick={() => navigate(`/listing/${listing.id}`)} className="bg-white border-b border-gray-100 px-4 py-2.5 flex items-center gap-3 cursor-pointer">
          {listing.images?.[0] && <img src={listing.images[0]} alt="" className="w-10 h-10 rounded-xl object-cover" />}
          <div>
            <p className="text-xs font-semibold text-gray-900">{listing.title}</p>
            <p className="text-[11px] text-[#1B6B3A] font-medium">Voir l'annonce →</p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-[#1B6B3A] border-t-transparent rounded-full animate-spin" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">Aucun message — commencez la conversation !</p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {["Toujours dispo ?", "Quel est votre meilleur prix ?", "Je suis intéressé !"].map((q) => (
                <button key={q} onClick={() => handleSend(q)} className="text-xs font-medium text-[#1B6B3A] bg-green-50 border border-green-100 rounded-xl py-2 px-3">
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm ${isMe ? "bg-[#1B6B3A] text-white rounded-br-sm" : "bg-white text-gray-900 rounded-bl-sm"}`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? "text-green-200" : "text-gray-400"} text-end`}>
                    {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="bg-white border-t border-gray-100 px-4 pt-3 pb-safe flex items-center gap-2 flex-shrink-0" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}>
        <button className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100">
          <ImageIcon className="w-4 h-4 text-gray-500" />
        </button>
        <div className="flex-1 flex items-center bg-gray-100 rounded-2xl px-4 py-2.5">
          <input
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
            placeholder={t("typeMessage")}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button
          onClick={() => handleSend()}
          disabled={!text.trim()}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${text.trim() ? "bg-[#1B6B3A] shadow-md" : "bg-gray-200"}`}
        >
          <Send className={`w-4 h-4 ${text.trim() ? "text-white" : "text-gray-400"}`} />
        </button>
      </div>
    </div>
  );
}
