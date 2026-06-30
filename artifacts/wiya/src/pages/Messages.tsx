import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Send } from "lucide-react";
import { useStore } from "@/lib/store";

export default function ChatPage() {
  const [, params] = useRoute("/messages/:id");
  const [, navigate] = useLocation();
  const conversationId = params?.id;

  const { user, conversations, sendMessage, fetchMessages } = useStore();
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Charger les messages dès que l'ID de la conversation change
  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
    }
  }, [conversationId, fetchMessages]);

  const conversation = conversations.find((c) => c.id === conversationId);

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  // État de chargement si l'utilisateur n'est pas encore défini
  if (!user) {
    return (
      <div className="bg-[#F4F6F5] min-h-screen flex items-center justify-center p-4">
        <p className="text-gray-500">Connexion requise pour accéder aux messages.</p>
      </div>
    );
  }

  // État de chargement si la conversation n'est pas encore trouvée dans le store
  if (!conversation && conversationId) {
    return (
      <div className="bg-[#F4F6F5] min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-gray-500 mb-4">Chargement de votre discussion...</p>
        <button 
          onClick={() => navigate("/messages")} 
          className="px-4 py-2 bg-[#1B6B3A] text-white rounded-xl text-sm"
        >
          Retour aux messages
        </button>
      </div>
    );
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !conversation) return;
    
    const textToSend = inputText.trim();
    setInputText("");
    await sendMessage(conversation.id, textToSend);
  };

  return (
    <div className="bg-[#F4F6F5] min-h-screen flex flex-col pb-6">
      {/* Barre du haut */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate("/messages")} className="p-1 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="w-10 h-10 rounded-full bg-[#1B6B3A]/10 flex items-center justify-center overflow-hidden">
          {conversation?.listingImage ? (
            <img src={conversation.listingImage} alt="" className="w-10 h-10 object-cover" />
          ) : (
            "💬"
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-gray-900 truncate">{conversation?.listingTitle || "Discussion"}</h2>
          <p className="text-xs text-gray-400">
            {conversation?.otherUser?.name ? `Avec ${conversation.otherUser.name}` : "Messagerie"}
          </p>
        </div>
      </div>

      {/* Liste des messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {conversation?.messages && conversation.messages.length > 0 ? (
          conversation.messages.map((msg) => (
            <div key={msg.id} className={`max-w-[75%] ${msg.senderId === 'me' ? "self-end" : "self-start"}`}>
              <div className={`p-3 rounded-xl text-sm ${msg.senderId === 'me' ? "bg-[#1B6B3A] text-white" : "bg-white border border-gray-100 text-gray-900"}`}>
                {msg.text || msg.content}
              </div>
              <span className="text-[10px] text-gray-400 px-1">{msg.time}</span>
            </div>
          ))
        ) : (
          <p className="text-center text-xs text-gray-400 mt-4">Aucun message pour le moment.</p>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <form onSubmit={handleSend} className="px-4 py-2 bg-white border-t border-gray-100 flex items-center gap-2 sticky bottom-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Écrivez votre message..."
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
        />
        <button type="submit" className="p-2.5 bg-[#1B6B3A] text-white rounded-xl">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
