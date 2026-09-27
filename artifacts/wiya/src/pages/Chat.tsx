import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Send, Mic, Play, Pause, X, MessageCircle, Check, CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import ImageLightbox from "@/components/ImageLightbox";

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
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`flex items-center gap-2.5 min-w-[175px] ${isMe ? "text-white" : "text-gray-900"}`}>
      <audio ref={audioRef} src={src} preload="auto" />
      <button
        type="button"
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isMe ? "bg-white/20" : "bg-[#1B6B3A]"
        }`}
      >
        {isPlaying ? (
          <Pause className="w-3.5 h-3.5 text-white" />
        ) : (
          <Play className="w-3.5 h-3.5 ml-0.5 text-white" />
        )}
      </button>
      <div className="flex-1 h-1 rounded-full bg-black/10 overflow-hidden">
        <div
          className={`h-full rounded-full ${isMe ? "bg-white" : "bg-[#1B6B3A]"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-[10px] opacity-70 flex-shrink-0 tabular-nums">{formatTime(duration)}</span>
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
      <div className="fixed inset-0 z-[10000] bg-white h-[100dvh] flex flex-col items-center justify-center p-4">
        <p className="text-gray-500">Connexion requise pour accéder aux messages.</p>
      </div>
    );
  }

  if (!conversation && conversationId) {
    return (
      <div className="fixed inset-0 z-[10000] bg-white h-[100dvh] flex flex-col items-center justify-center p-4">
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

  return (
    <div className="fixed inset-0 z-[10000] h-[100dvh] flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 px-4 py-3 flex items-center gap-3 flex-shrink-0 pt-[env(safe-area-inset-top)]">
        <button onClick={() => navigate("/messages")} className="p-1 -ml-1">
          <ArrowLeft className="w-5 h-5 text-gray-700" strokeWidth={2.2} />
        </button>
        <button
          onClick={() => conversation?.listingImage && setLightboxOpen(true)}
          className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0"
        >
          {conversation?.listingImage ? (
            <img src={conversation.listingImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <MessageCircle className="w-4 h-4 text-gray-300" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] font-bold text-gray-900 truncate">{conversation?.listingTitle || "Discussion"}</h2>
          <p className="text-xs text-gray-400">
            {conversation?.otherUser?.name ? conversation.otherUser.name : "Messagerie"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col">
        {messages.length > 0 ? (
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => {
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

              const isLastInGroup = !sameGroupAsNext;

              return (
                <div key={msg.id}>
                  {showDateSeparator && (
                    <div className="flex justify-center my-4">
                      <span className="text-[11px] font-semibold text-gray-400">
                        {formatDateSeparator(msg.createdAt)}
                      </span>
                    </div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`max-w-[75%] ${isMe ? "self-end ml-auto" : "self-start"} ${sameGroupAsPrev ? "mt-0.5" : "mt-2.5"}`}
                  >
                    <div
                      className={`px-3.5 py-2.5 text-[14px] leading-snug ${
                        isMe
                          ? "bg-[#1B6B3A] text-white rounded-2xl rounded-br-md"
                          : "bg-gray-50 text-gray-900 rounded-2xl rounded-bl-md"
                      }`}
                    >
                      {isAudio ? (
                        <VoiceBubble src={msg.audioUrl || msg.audio_url} isMe={isMe} />
                      ) : (
                        msg.text || msg.content
                      )}
                    </div>
                    {isLastInGroup && (
                      <div className={`flex items-center gap-1 px-1 mt-1 ${isMe ? "justify-end" : ""}`}>
                        <span className="text-[10px] text-gray-400">{msg.time}</span>
                        {isMe && (
                          msg.isRead ? (
                            <CheckCheck className="w-3.5 h-3.5 text-[#1B6B3A]" strokeWidth={2.2} />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-gray-300" strokeWidth={2.2} />
                          )
                        )}
                      </div>
                    )}
                  </motion.div>
                </div>
              );
            })}
          </AnimatePresence>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-400">
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-1">
              <MessageCircle className="w-5 h-5 text-gray-300" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-gray-600">Aucun message pour l'instant</p>
            <p className="text-xs">Dites bonjour 👋</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-gray-100 px-3 pb-[env(safe-area-inset-bottom)] pt-2.5 flex-shrink-0">
        {isRecording ? (
          <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-2.5 mx-1 mb-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            <span className="text-sm text-gray-600 flex-1 tabular-nums">
              {Math.floor(recordSeconds / 60)}:{(recordSeconds % 60).toString().padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={() => stopRecording(false)}
              className="p-2 text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => stopRecording(true)}
              className="p-2.5 bg-[#1B6B3A] text-white rounded-full"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-center gap-2 mx-1 mb-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Écrivez votre message..."
              className="flex-1 bg-gray-50 rounded-full px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-gray-200 transition-colors"
            />
            {inputText.trim() ? (
              <motion.button whileTap={{ scale: 0.9 }} type="submit" className="p-2.5 bg-[#1B6B3A] text-white rounded-full flex-shrink-0">
                <Send className="w-4 h-4" />
              </motion.button>
            ) : (
              <button
                type="button"
                onMouseDown={startRecording}
                onMouseUp={() => stopRecording(true)}
                onMouseLeave={() => isRecording && stopRecording(false)}
                onTouchStart={(e) => {
                  e.preventDefault();
                  startRecording();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  stopRecording(true);
                }}
                className="p-2.5 bg-gray-50 text-gray-500 rounded-full active:bg-red-500 active:text-white transition-colors flex-shrink-0"
              >
                <Mic className="w-4 h-4" />
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
