import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Send, Mic, Play, Pause, X, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import ImageLightbox from "@/components/ImageLightbox";

function VoiceBubble({ src, isMe }: { src: string; isMe: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.pause();
    else audio.play();
    setIsPlaying(!isPlaying);
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
    <div className={`flex items-center gap-2 min-w-[160px] ${isMe ? "text-white" : "text-gray-900"}`}>
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isMe ? "bg-white/20" : "bg-[#1B6B3A]/10"
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>
      <div className="flex-1 h-1 rounded-full bg-black/10 overflow-hidden">
        <div
          className={`h-full rounded-full ${isMe ? "bg-white" : "bg-[#1B6B3A]"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-[10px] opacity-80 flex-shrink-0">{formatTime(duration)}</span>
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

  return (
    <div className="fixed inset-0 z-40 bg-[#F4F6F5] h-[100dvh] flex flex-col">
      {/* Barre du haut */}
      <div className="bg-white border-b border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3 flex-shrink-0 pt-[env(safe-area-inset-top)]">
        <button onClick={() => navigate("/messages")} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <button
          onClick={() => conversation?.listingImage && setLightboxOpen(true)}
          className="w-10 h-10 rounded-full bg-[#1B6B3A]/10 ring-2 ring-[#1B6B3A]/20 flex items-center justify-center overflow-hidden flex-shrink-0"
        >
          {conversation?.listingImage ? (
            <img src={conversation.listingImage} alt="" className="w-10 h-10 object-cover" />
          ) : (
            "💬"
          )}
        </button>
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
          <AnimatePresence initial={false}>
            {conversation.messages.map((msg: any) => {
              const isMe = msg.senderId === "me";
              const isAudio = msg.type === "audio" && (msg.audioUrl || msg.audio_url);
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`max-w-[75%] ${isMe ? "self-end" : "self-start"}`}
                >
                  <div
                    className={`px-3 py-2.5 rounded-2xl text-sm shadow-sm ${
                      isMe
                        ? "bg-[#1B6B3A] text-white rounded-br-md"
                        : "bg-white border border-gray-100 text-gray-900 rounded-bl-md"
                    }`}
                  >
                    {isAudio ? (
                      <VoiceBubble src={msg.audioUrl || msg.audio_url} isMe={isMe} />
                    ) : (
                      msg.text || msg.content
                    )}
                  </div>
                  <span className={`text-[10px] text-gray-400 px-1 ${isMe ? "text-right block" : ""}`}>
                    {msg.time}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-400">
            <MessageCircle className="w-10 h-10 text-[#1B6B3A]/30" />
            <p className="text-sm">Aucun message pour l'instant.</p>
            <p className="text-xs">Dites bonjour 👋</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <div className="px-4 py-2 pb-[env(safe-area-inset-bottom)] bg-white border-t border-gray-100 flex-shrink-0">
        {isRecording ? (
          <div className="flex items-center gap-3 py-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            <span className="text-sm text-gray-700 flex-1">
              Enregistrement... {Math.floor(recordSeconds / 60)}:{(recordSeconds % 60).toString().padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={() => stopRecording(false)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => stopRecording(true)}
              className="p-2.5 bg-[#1B6B3A] text-white rounded-xl"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Écrivez votre message..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B6B3A]/20"
            />
            {inputText.trim() ? (
              <motion.button whileTap={{ scale: 0.9 }} type="submit" className="p-2.5 bg-[#1B6B3A] text-white rounded-xl">
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
                className="p-2.5 bg-gray-100 text-gray-600 rounded-xl active:bg-red-500 active:text-white transition-colors"
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
