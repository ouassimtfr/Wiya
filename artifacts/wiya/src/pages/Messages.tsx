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

  // Charger les messages à chaque changement de conversation
  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
    }
  }, [conversationId, fetchMessages]);

  const conversation = conversations.find((c) => c.id === conversationId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  if (!user || !conversation) {
    return (
      <div className="bg-[#F4F6F5] min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-gray-500 text-sm mb-4">Conversation introuvable.</p>
        <button onClick={() => navigate("/messages")} className="px-4 py-2 bg-[#1B6B3A] text-white rounded-xl text-sm">
          Retour
        </button>
      </div>
    );
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const textToSend = inputText.trim();
    setInputText("");
    await sendMessage(conversation.id, textToSend);
  };

  return (
    <div className="bg-[#F4F6F5] min-h-screen flex flex-col">
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/messages")}><ArrowLeft /></button>
        <h2 className="font-bold">{conversation.listingTitle}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {conversation.messages.map((msg) => (
          <div key={msg.id} className={`max-w-[75%] ${msg.senderId === 'me' ? "self-end" : "self-start"}`}>
            <div className={`p-3 rounded-xl ${msg.senderId === 'me' ? "bg-[#1B6B3A] text-white" : "bg-white border"}`}>
              {msg.text || msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 bg-white border-t flex gap-2">
        <input value={inputText} onChange={(e) => setInputText(e.target.value)} className="flex-1 border rounded-lg p-2" />
        <button type="submit" className="bg-[#1B6B3A] text-white p-2 rounded-lg"><Send /></button>
      </form>
    </div>
  );
}
