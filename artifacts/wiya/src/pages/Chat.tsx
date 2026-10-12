import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Send, Mic, Play, Pause, X, MessageCircle, Check, CheckCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import ImageLightbox from "@/components/ImageLightbox";

const QUICK_REPLIES_FR = [
  "Bonjour, c'est toujours disponible ?",
  "Quel est votre dernier prix ?",
  "Où peut-on se voir ?",
  "Pouvez-vous m'envoyer plus de photos ?",
];

const QUICK_REPLIES_AR = [
  "مرحبا، هل ما زال متوفرا؟",
  "ما هو آخر سعر؟",
  "أين يمكننا اللقاء؟",
  "هل يمكنك إرسال المزيد من الصور؟",
];

const WAVE = [8, 14, 10, 18, 12, 22, 16, 10, 20, 14, 24, 12, 18, 8, 16, 22, 12, 18, 10, 14, 20, 12, 16, 8];

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function formatDateSeparator(iso: string, isRTL: boolean): string {
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return isRTL ? "اليوم" : "Aujourd'hui";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return isRTL ? "أمس" : "Hier";

  return date.toLocaleDateString(isRTL ? "ar-DZ" : "fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

// Choisit le format audio le plus compatible (mp4 d'abord : lisible partout, y compris iPhone)
function pickMimeType(): string {
  const candidates = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) return c;
  }
  return "";
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
      if (audio.duration && isFinite(audio.duration)) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };
    const onLoaded = () => {
      if (isFinite(audio.duration)) setDuration(audio.duration);
    };
    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("durationchange", onLoaded);
    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("durationchange", onLoaded);
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
    <div className="flex items-center gap-2.5 min-w-[200px]" dir="ltr">
      <audio ref={audioRef} src={src} preload="metadata" />
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
  const { isRTL } = useI18n();
  const tr = (fr: string, ar: string) => (isRTL ? ar : fr);
  const conversationId = params?.id;
  const QUICK_REPLIES = isRTL ? QUICK_REPLIES_AR : QUICK_REPLIES_FR;

  const { user, conversations, sendMessage, sendVoiceMessage, fetchMessages } = useStore();
  const [inputText, setInputText] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSendingVoice, setIsSendingVoice] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [viewport, setViewport] = useState<{ height: number; top: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;
    setLoadingMessages(true);
    Promise.resolve(fetchMessages(conversationId))
      .catch((err) => console.error("Erreur chargement messages:", err))
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId, fetchMessages]);

  // CORRECTIF CLAVIER iOS : on suit la vraie zone visible (visualViewport),
  // qui se réduit quand le clavier s'ouvre, contrairement à 100dvh sur iOS.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      setViewport({ height: vv.height, top: vv.offsetTop });
      if (vv.offsetTop !== 0) window.scrollTo(0, 0);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  const conversation = conversations.find((c) => c.id === conversationId);
  const messages = (conversation?.messages ?? []) as any[];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages, viewport?.height]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      const rec = mediaRecorderRef.current;
      if (rec && rec.state !== "inactive") {
        try { rec.stop(); } catch {}
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
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
      alert(
        tr(
          "Impossible d'accéder au micro. Vérifiez les autorisations dans les réglages.",
          "تعذر الوصول إلى الميكروفون. تحقق من الأذونات في الإعدادات."
        )
      );
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
        resolve(new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/mp4" }));
      };
      if (recorder.state !== "inactive") recorder.stop();
      else resolve(new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/mp4" }));
    });

    streamRef.current?.getTracks().forEach((t) => t.stop());
    mediaRecorderRef.current = null;

    if (send && conversation && finalSeconds >= 1) {
      setIsSendingVoice(true);
      try {
        await sendVoiceMessage(conversation.id, blob);
      } catch (err) {
        console.error("Envoi du vocal échoué :", err);
        alert(
          tr(
            "Le message vocal n'a pas pu être envoyé. Réessayez.",
            "تعذر إرسال الرسالة الصوتية. حاول مرة أخرى."
          )
        );
      } finally {
        setIsSendingVoice(false);
      }
    }
  };

  const containerStyle = viewport
    ? { height: viewport.height, top: viewport.top }
    : undefined;

  if (!user) {
    return (
      <div className="fixed inset-0 z-40 bg-background h-[100dvh] flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground">
          {tr("Connexion requise pour accéder aux messages.", "يجب تسجيل الدخول للوصول إلى الرسائل.")}
        </p>
      </div>
    );
  }

  if (!conversation && conversationId) {
    return (
      <div className="fixed inset-0 z-40 bg-background h-[100dvh] flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">
          {tr("Chargement de votre discussion...", "جاري تحميل المحادثة...")}
        </p>
        <button onClick={() => navigate("/messages")} className="px-4 py-2 bg-[#1B6B3A] text-white rounded-xl text-sm">
          {tr("Retour aux messages", "العودة إلى الرسائل")}
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

  const otherName = conversation?.otherUser?.name || tr("Utilisateur", "مستخدم");

  return (
    <div
      className="fixed inset-x-0 top-0 z-40 h-[100dvh] flex flex-col bg-background"
      style={containerStyle}
    >
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
          className="p-2 -ms-1 rounded-full active:bg-gray-100 transition-colors"
        >
          <ArrowLeft className={`w-5 h-5 text-gray-800 ${isRTL ? "rotate-180" : ""}`} />
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
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {conversation?.listingTitle || tr("Annonce", "إعلان")}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="relative flex-1 overflow-y-auto px-3 py-4 flex flex-col" dir="ltr">
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
                      {formatDateSeparator(msg.createdAt, isRTL)}
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
                      <p dir="auto" className="text-[15px] leading-snug whitespace-pre-wrap break-words">
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
        ) : loadingMessages ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#1B6B3A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4" dir={isRTL ? "rtl" : "ltr"}>
            <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
              <MessageCircle className="w-7 h-7 text-[#1B6B3A]" />
            </div>
            <p className="text-sm font-bold text-foreground">{tr("Démarrez la discussion", "ابدأ المحادثة")}</p>
            <p className="text-xs text-muted-foreground mt-1 mb-5">
              {tr("Écrivez un message ou choisissez une réponse rapide.", "اكتب رسالة أو اختر ردا سريعا.")}
            </p>
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
              <span className="text-sm font-semibold text-red-600 tabular-nums" dir="ltr">
                {Math.floor(recordSeconds / 60)}:{(recordSeconds % 60).toString().padStart(2, "0")}
              </span>
              <span className="text-xs text-red-400 truncate">
                {tr("Enregistrement en cours", "جاري التسجيل")}
              </span>
            </div>
            <button
              type="button"
              onClick={() => stopRecording(true)}
              className="w-11 h-11 rounded-full bg-[#1B6B3A] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform flex-shrink-0"
            >
              <Send className={`w-5 h-5 ${isRTL ? "-scale-x-100" : ""}`} />
            </button>
          </div>
        ) : isSendingVoice ? (
          <div className="flex items-center justify-center gap-2 py-3 text-sm text-gray-500">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1B6B3A] animate-pulse" />
            {tr("Envoi du vocal...", "جاري إرسال الرسالة الصوتية...")}
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              dir="auto"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onFocus={() => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 300)}
              enterKeyHint="send"
              placeholder={tr("Écrivez votre message...", "اكتب رسالتك...")}
              className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1B6B3A]/25 placeholder:text-gray-400"
            />
            {inputText.trim() ? (
              <motion.button
                whileTap={{ scale: 0.9 }}
                type="submit"
                className="w-11 h-11 rounded-full bg-[#1B6B3A] text-white flex items-center justify-center shadow-md flex-shrink-0"
              >
                <Send className={`w-5 h-5 ${isRTL ? "-scale-x-100" : ""}`} />
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
