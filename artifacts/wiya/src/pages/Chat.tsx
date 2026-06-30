import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Send } from "lucide-react";
import { useStore } from "@/lib/store";
import AppHeader from "@/components/AppHeader";

export default function ChatPage() {
  const [, params] = useRoute("/messages/:id");
  const [, navigate] = useLocation();
  const conversationId = params?.id;

  // Récupération de fetchMessages depuis le store pour charger les données réelles
  const { user, conversations, sendMessage, fetchMessages } = useStore();
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Charger les messages depuis Supabase dès que l'ID de la conversation change
  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
    }
  }, [conversationId]);

  // Trouver la conversation actuelle dans le store
  const conversation = conversations.find((c) => c.id === conversationId);

  // Auto-scroll vers le bas quand un nouveau message arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  if (!user || !conversation) {
    return (
      <div className="bg-[#F4F6F5] min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-gray-500 text-sm mb-4">Conversation introuvable ou session expirée.</p>
        <button onClick={() => navigate("/messages")} className="px-4 py-2 bg-[#1B6B3A] text-white rounded-xl text-sm font-semibold">
          Retour aux messages
        </button>
      </div>
    );
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText(""); // Vide le champ instantanément

    await sendMessage(conversation.id, textToSend);
  };

  // Boutons de réponses rapides (les options "Toujours disponible ?" etc.)
  const quickReplies = [
    "Bonjour, est-ce toujours disponible ?",
    "Le prix est-il négociable ?",
    "Je suis disponible pour le récupérer aujourd'hui."
  ];

  return (
    <div className="bg-[#F4F6F5] min-h-screen flex flex-col pb-6">
      {/* Barre du haut */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate("/messages")} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="w-10 h-10 rounded-full bg-[#1B6B3A]/10 flex items-center justify-center text-xl overflow-hidden flex-shrink-0">
          {conversation.listingImage ? (
            <img src={conversation.listingImage} alt="" className="w-10 h-10 object-cover" />
          ) : (
            "💬"
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-gray-900 truncate">{conversation.listingTitle}</h2>
          <p className="text-xs text-gray-400 truncate">Avec {conversation.otherUser?.name || "Utilisateur"}</p>
        </div>
      </div>

      {/* Zone des messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {conversation.messages.length === 0 ? (
          <p className="text-center text-xs text-gray-400 my-auto">Aucun message. Envoyez le premier message !</p>
        ) : (
          conversation.messages.map((msg) => {
            const isMe = msg.senderId === "me";
            // L'affichage utilise maintenant msg.text qui reçoit le 'content' depuis le store corrigé
            return (
              <div key={msg.id} className={`flex flex-col max-w-[75%] ${isMe ? "self-end items-end" : "self-start items-start"}`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? "bg-[#1B6B3A] text-white rounded-br-none" : "bg-white text-gray-900 rounded-bl-none border border-gray-100"}`}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.time}</span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions de réponses rapides (si aucun ou peu de messages) */}
      {conversation.messages.length <= 1 && (
        <div className="px-4 py-2 flex flex-col gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
          <div className="flex gap-2">
            {quickReplies.map((reply, index) => (
              <button
                key={index}
                onClick={async () => {
                  await sendMessage(conversation.id, reply);
                }}
                className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-full font-medium transition-colors flex-shrink-0 shadow-sm"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Barre d'envoi de message */}
      <form onSubmit={handleSend} className="px-4 py-2 bg-white border-t border-gray-100 flex items-center gap-2 sticky bottom-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Écrivez votre message..."
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B6B3A] transition-colors"
        />
        <button type="submit" className="p-2.5 bg-[#1B6B3A] text-white rounded-xl hover:bg-[#15522c] transition-colors flex-shrink-0">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
