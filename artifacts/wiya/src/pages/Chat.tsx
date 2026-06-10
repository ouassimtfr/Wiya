import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Send, Phone, MoreVertical, ChevronLeft, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { t, isRTL } = useI18n();
  const { conversations, sendMessage, user } = useStore();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const conv = conversations.find((c) => c.id === params.id);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conv?.messages.length]);

  if (!conv) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Conversation introuvable</p>
    </div>
  );

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(conv.id, text.trim());
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-[#F0F2F0] flex flex-col h-screen">
      {/* Header */}
      <div className="bg-[#1B6B3A] px-4 pt-12 pb-3 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => navigate("/messages")}
          className="w-8 h-8 flex items-center justify-center"
        >
          <ChevronLeft className={`w-5 h-5 text-white ${isRTL ? "rotate-180" : ""}`} />
        </button>
        <img
          src={conv.otherUser.avatar}
          alt={conv.otherUser.name}
          className="w-9 h-9 rounded-full bg-white/20"
        />
        <div className="flex-1">
          <p className="text-white text-sm font-bold leading-tight">{conv.otherUser.name}</p>
          <p className="text-green-200 text-[11px] truncate">{conv.listingTitle}</p>
        </div>
        <a href="tel:+213555000000" className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20">
          <Phone className="w-4 h-4 text-white" />
        </a>
        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20">
          <MoreVertical className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Listing preview */}
      <div
        onClick={() => navigate(`/listing/${conv.listingId}`)}
        className="bg-white border-b border-gray-100 px-4 py-2.5 flex items-center gap-3 cursor-pointer"
      >
        <img src={conv.listingImage} alt="" className="w-10 h-10 rounded-xl object-cover" />
        <div>
          <p className="text-xs font-semibold text-gray-900">{conv.listingTitle}</p>
          <p className="text-[11px] text-[#1B6B3A] font-medium">Voir l'annonce →</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {conv.messages.map((msg, i) => {
          const isMe = msg.senderId === "me";
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              {!isMe && (
                <img
                  src={conv.otherUser.avatar}
                  alt=""
                  className="w-7 h-7 rounded-full me-2 mt-auto flex-shrink-0 bg-gray-200"
                />
              )}
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm
                  ${isMe
                    ? "bg-[#1B6B3A] text-white rounded-br-sm rtl:rounded-br-2xl rtl:rounded-bl-sm"
                    : "bg-white text-gray-900 rounded-bl-sm rtl:rounded-bl-2xl rtl:rounded-br-sm"
                  }`}
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <p className={`text-[10px] mt-1 ${isMe ? "text-green-200" : "text-gray-400"} text-end`}>
                  {msg.time}
                </p>
              </div>
            </motion.div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-2 flex-shrink-0">
        <button className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100">
          <ImageIcon className="w-4.5 h-4.5 text-gray-500" />
        </button>
        <div className="flex-1 flex items-center bg-gray-100 rounded-2xl px-4 py-2.5 min-h-[42px]">
          <input
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
            placeholder={t("typeMessage")}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all
            ${text.trim() ? "bg-[#1B6B3A] shadow-md" : "bg-gray-200"}`}
        >
          <Send className={`w-4 h-4 ${text.trim() ? "text-white" : "text-gray-400"}`} />
        </button>
      </div>
    </div>
  );
}
