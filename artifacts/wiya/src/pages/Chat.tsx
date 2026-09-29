import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Send, Mic, Play, Pause, X, MessageCircle, Check, CheckCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import ImageLightbox from "@/components/ImageLightbox";

const QUICK_REPLIES = [
  "Bonjour, c'est toujours disponible ?",
  "Quel est votre dernier prix ?",
  "Où peut-on se voir ?",
  "Pouvez-vous m'envoyer plus de photos ?",
];

const WAVE = [8, 14, 10, 18, 12, 22, 16, 10, 20, 14, 24, 12, 18, 8, 16, 22, 12, 18, 10, 14, 20, 12, 16, 8];

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function formatDateSeparator(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Aujourd'hui";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Hier";

  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function VoiceBubble({ src, isMe }: { src: string; isMe: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.error("Erreur lecture audio:", err);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updateProgress = () => {
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };
    const onLoaded = () => setDuration(audio.duration);
    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("loadedmetadata", onLoaded);
    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("loadedmetadata", onLoaded);
    };
  }, []);

  const formatTime = (s: number) => {
    if (!isFinite(s) || !s) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const filled = Math.round((progress / 100) * WAVE.length);

  return (
    <div className="flex items-center gap-2.5 min-w-[200px]">
      <audio ref={audioRef} src={src} preload="auto" />
      <button
        type="button"
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform ${
          isMe ? "bg-white/25" : "bg-[#1B6B3A]"
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 ml-0.5 text-white" />}
      </button>
      <div className="flex-1 flex items-center gap-[2px] h-7">
        {WAVE.map((h, i) => (
          <span
            key={i}
            className={`w-[3px] rounded-full ${
              i < filled
                ? isMe ? "bg-white" : "bg-[#1B6B3A]"
                : isMe ? "bg-white/40" : "bg-gray-300"
            }`}
            style={{ height: `${h}px` }}
          />
        ))}
      </div>
      <span className={`text-[11px] flex-shrink-0 ${isMe ? "text-white/80" : "text-gray-400"}`}>
        {formatTime(duration)}
      </span>
    </div>
  );
}

export default function ChatPage() {
  const [, params] = useRoute("/messages/:id");
  const [, navigate] = useLocation();
  const conversationId = params?.id;

  const { user, conversations, sendMessage, sendVoiceMessage, fetchMessages } = useStore();
  const [inputText, setInputText] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
    }
  }, [conversationId, fetchMessages]);

  const conversation = conversations.find((c) => c.id === conversationId);
  const messages = (conversation?.messages ?? []) as any[];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch (err) {
      console.error("Micro inaccessible :", err);
      alert("Impossible d'accéder au micro. Vérifiez les autorisations dans les réglages.");
    }
  };

  const stopRecording = async (send: boolean) => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    if (timerRef.current) clearInterval(timerRef.current);
    const finalSeconds = recordSeconds;
    setIsRecording(false);

    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        resolve(new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" }));
      };
      recorder.stop();
    });

    streamRef.current?.getTracks().forEach((t) => t.stop());

    if (send && conversation && finalSeconds >= 1) {
      await sendVoiceMessage(conversation.id, blob);
    }
  };

  if (!user) {
    return (
      <div className="fixed inset-0 z-40 bg-[#F4F6F5] h-[100dvh] flex flex-col items-center justify-center p-4">
        <p className="text-gray-500">Connexion requise pour accéder aux messages.</p>
      </div>
    );
  }

  if (!conversation && conversationId) {
    return (
      <div className="fixed inset-0 z-40 bg-[#F4F6F5] h-[100dvh] flex flex-col items-center justify-center p-4">
        <p className="text-gray-500 mb-4">Chargement de votre discussion...</p>
        <button onClick={() => navigate("/messages")} className="px-4 py-2 bg-[#1B6B3A] text-white rounded-xl text-sm">
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

  const sendQuick = async (text: string) => {
    if (!conversation) return;
    await sendMessage(conversation.id, text);
  };

  const otherName = conversation?.otherUser?.name || "Utilisateur";

  return (
    <div className="fixed inset-0 z-40 h-[100dvh] flex flex-col bg-[#ECF0EC]">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.25]"
        style={{
          backgroundImage: "radial-gradient(circle, #1B6B3A33 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* En-tête */}
      <div className="relative bg-white border-b border-gray-100 px-3 pb-3 pt-[calc(env(safe-area-inset-top)+10px)] flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => navigate("/messages")}
          className="p-2 -ml-1 rounded-full active:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </button>

        <button
          onClick={() => conversation?.listingImage && setLightboxOpen(true)}
          className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-[#1B6B3A]/20 to-[#C8972B]/20 overflow-hidden flex items-center justify-center flex-shrink-0"
        >
          {conversation?.listingImage ? (
            <img src={conversation.listingImage} alt="" className="w-11 h-11 object-cover" />
          ) : (
            <MessageCircle className="w-5 h-5 text-[#1B6B3A]" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] font-bold text-gray-900 truncate leading-tight">{otherName}</h2>
          <p className="text-xs text-gray-500 truncate mt-0.5">{conversation?.listingTitle || "Annonce"}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="relative flex-1 overflow-y-auto px-3 py-4 flex flex-col">
        {messages.length > 0 ? (
          messages.map((msg, index) => {
            const isMe = msg.senderId === "me";
            const isAudio = msg.type === "audio" && (msg.audioUrl || msg.audio_url);
            const prev = messages[index - 1];
            const next = messages[index + 1];

            const showDateSeparator = !prev || !isSameDay(prev.createdAt, msg.createdAt);

            const sameGroupAsPrev =
              prev &&
              prev.senderId === msg.senderId &&
              isSameDay(prev.createdAt, msg.createdAt) &&
              Math.abs(new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime()) < 5 * 60 * 1000;

            const sameGroupAsNext =
              next &&
              next.senderId === msg.senderId &&
              isSameDay(next.createdAt, msg.createdAt) &&
              Math.abs(new Date(next.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 5 * 60 * 1000;

            const corners = isMe
              ? `${sameGroupAsPrev ? "rounded-tr-md" : ""} ${sameGroupAsNext ? "rounded-br-md" : "rounded-br-sm"}`
              : `${sameGroupAsPrev ? "rounded-tl-md" : ""} ${sameGroupAsNext ? "rounded-bl-md" : "rounded-bl-sm"}`;

            return (
              <div key={msg.id} className="flex flex-col">
                {showDateSeparator && (
                  <div className="flex justify-center my-4">
                    <span className="bg-white/90 text-[11px] font-semibold text-gray-500 px-3 py-1 rounded-full shadow-sm">
                      {formatDateSeparator(msg.createdAt)}
                    </span>
                  </div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`max-w-[80%] ${isMe ? "self-end" : "self-start"} ${sameGroupAsPrev ? "mt-0.5" : "mt-2"}`}
                >
                  <div
                    className={`px-3.5 pt-2 pb-1.5 rounded-2xl shadow-sm ${corners} ${
                      isMe ? "bg-[#1B6B3A] text-white" : "bg-white text-gray-900"
                    }`}
                  >
                    {isAudio ? (
                      <VoiceBubble src={msg.audioUrl || msg.audio_url} isMe={isMe} />
                    ) : (
                      <p className="text-[15px] leading-snug whitespace-pre-wrap break-words">
                        {msg.text || msg.content}
                      </p>
                    )}
                    <div className={`flex items-center justify-end gap-1 mt-0.5 ${isMe ? "text-white/70" : "text-gray-400"}`}>
                      <span className="text-[10px]">{msg.time}</span>
                      {isMe &&
                        (msg.isRead ? (
                          <CheckCheck className="w-3.5 h-3.5 text-[#F2D27A]" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
              <MessageCircle className="w-7 h-7 text-[#1B6B3A]" />
            </div>
            <p className="text-sm font-bold text-gray-700">Démarrez la discussion</p>
            <p className="text-xs text-gray-400 mt-1 mb-5">Écrivez un message ou choisissez une réponse rapide.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  onClick={() => sendQuick(q)}
                  className="bg-white text-[13px] text-[#1B6B3A] font-medium px-3.5 py-2 rounded-full shadow-sm active:scale-95 transition-transform"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Barre de saisie */}
      <div className="relative bg-white border-t border-gray-100 px-3 pt-2.5 pb-[max(env(safe-area-inset-bottom),10px)] flex-shrink-0">
        {isRecording ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => stopRecording(false)}
              className="p-2.5 rounded-full bg-gray-100 text-gray-500 active:scale-95 transition-transform"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex-1 flex items-center gap-2.5 bg-red-50 rounded-full px-4 py-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
              <span className="text-sm font-semibold text-red-600 tabular-nums">
                {Math.floor(recordSeconds / 60)}:{(recordSeconds % 60).toString().padStart(2, "0")}
              </span>
              <span className="text-xs text-red-400 truncate">Enregistrement en cours</span>
            </div>
            <button
              type="button"
              onClick={() => stopRecording(true)}
              className="w-11 h-11 rounded-full bg-[#1B6B3A] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onFocus={() => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 300)}
              enterKeyHint="send"
              placeholder="Écrivez votre message..."
              className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1B6B3A]/25 placeholder:text-gray-400"
            />
            {inputText.trim() ? (
              <motion.button
                whileTap={{ scale: 0.9 }}
                type="submit"
                className="w-11 h-11 rounded-full bg-[#1B6B3A] text-white flex items-center justify-center shadow-md flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="w-11 h-11 rounded-full bg-[#1B6B3A]/10 text-[#1B6B3A] flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </form>
        )}
      </div>

      {lightboxOpen && conversation?.listingImage && (
        <ImageLightbox images={[conversation.listingImage]} onClose={() => setLightboxOpen(false)} />
      )}
    </div>
  );
}
