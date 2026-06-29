import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Send, ChevronLeft, Image as ImageIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useStore();
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [listing, setListing] = useState<any>(null);

  useEffect(() => {
    const initChat = async () => {
      if (!user || !params.id) return;
      const { data: l } = await supabase.from("listings").select("*").eq("id", params.id).single();
      setListing(l);
      const { data: m } = await supabase.from("messages").select("*").eq("listing_id", params.id).order("created_at", { ascending: true });
      setMessages(m || []);
    };
    initChat();
  }, [params.id, user]);

  const handleSend = async () => {
    if (!text.trim() || !user || !listing) return;
    
    // Logique corrigée pour identifier le receveur
    const receiverId = (listing.user_id === user.id) 
      ? (messages.length > 0 ? (messages[0].sender_id === user.id ? messages[0].receiver_id : messages[0].sender_id) : "") 
      : listing.user_id;

    if (!receiverId) return;

    const { data, error } = await supabase.from("messages").insert({
      listing_id: params.id,
      sender_id: user.id,
      receiver_id: receiverId,
      content: text.trim(),
    }).select().single();

    if (data) {
      setMessages([...messages, data]);
      setText("");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F0F2F0]">
      <div className="bg-[#1B6B3A] p-4 pt-12 flex items-center gap-3">
        <button onClick={() => navigate("/messages")}><ChevronLeft className="text-white" /></button>
        <p className="text-white font-bold">{listing?.title || "Messagerie"}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
            <div className={`p-3 rounded-xl ${m.sender_id === user?.id ? "bg-[#1B6B3A] text-white" : "bg-white"}`}>
              {m.content}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 border-t flex gap-2 items-center">
        <input className="flex-1 p-2 bg-gray-100 rounded-lg outline-none" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("typeMessage")} />
        <button onClick={handleSend} className="bg-[#1B6B3A] text-white p-2 rounded-lg"><Send size={18} /></button>
      </div>
    </div>
  );
}
