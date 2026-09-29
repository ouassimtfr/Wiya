import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { MessageCircle, Mic, Search, X, Check, CheckCheck } from "lucide-react";
import { useStore } from "@/lib/store";

function formatListTime(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Hier";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

export default function MessagesPage() {
  const [, navigate] = useLocation();
  const { user, conversations, fetchConversations } = useStore();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "unread">("all");

  useEffect(() => {
    if (user) fetchConversations();
  }, [user, fetchConversations]);

  const all = useMemo(() => {
    return [...(conversations as any[])]
      .filter((c) => c.messages && c.messages.length > 0)
      .sort((a, b) => {
        const la = a.messages[a.messages.length - 1]?.createdAt ?? "";
        const lb = b.messages[b.messages.length - 1]?.createdAt ?? "";
        return new Date(lb).getTime() - new Date(la).getTime();
      });
  }, [conversations]);

  const totalUnread = all.reduce((sum, c) => sum + (c.unread || 0), 0);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((c) => {
      if (tab === "unread" && !(c.unread > 0)) return false;
      if (!q) return true;
      return (
        (c.listingTitle || "").toLowerCase().includes(q) ||
        (c.otherUser?.name || "").toLowerCase().includes(q)
      );
    });
  }, [all, query, tab]);

  if (!user) {
    return (
      <div className="min-h-[100dvh] bg-white flex flex-col items-center justify-center p-6 pb-28">
        <div className="w-16 h-16 rounded-full bg-[#1B6B3A]/10 flex items-center justify-center mb-4">
          <MessageCircle className="w-7 h-7 text-[#1B6B3A]" />
        </div>
        <p className="text-gray-600 text-center text-sm">Connectez-vous pour voir vos messages.</p>
        <button
          onClick={() => navigate("/auth")}
          className="mt-4 px-6 py-3 bg-[#1B6B3A] text-white rounded-2xl text-sm font-semibold shadow-md active:scale-95 transition-transform"
        >
          Se connecter
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-white pb-28">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md pt-[calc(env(safe-area-inset-top)+14px)]">
        <div className="px-5 flex items-end justify-between">
          <h1 className="text-[28px] leading-none font-extrabold tracking-tight text-gray-900">Messages</h1>
          {totalUnread > 0 && (
            <span className="text-xs font-semibold text-[#1B6B3A] bg-[#1B6B3A]/10 px-2.5 py-1 rounded-full">
              {totalUnread} non lu{totalUnread > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="px-5 mt-4">
          <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-3.5 py-2.5">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une annonce ou une personne"
              className="flex-1 bg-transparent text-base focus:outline-none placeholder:text-gray-400"
            />
            {query && (
              <button onClick={() => setQuery("")} className="p-0.5">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        <div className="px-5 mt-3 flex gap-6 border-b border-gray-100">
          {[
            { id: "all" as const, label: "Tous" },
            { id: "unread" as const, label: "Non lus" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`pb-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                tab === t.id ? "border-[#1B6B3A] text-[#1B6B3A]" : "border-transparent text-gray-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center text-center px-10 pt-24">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1B6B3A]/12 to-[#C8972B]/15 flex items-center justify-center mb-5">
            <MessageCircle className="w-9 h-9 text-[#1B6B3A]" />
          </div>
          <p className="text-base font-bold text-gray-800">
            {all.length === 0 ? "Aucune conversation" : "Aucun résultat"}
          </p>
          <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
            {all.length === 0
              ? "Ouvrez une annonce et contactez le vendeur pour démarrer une discussion."
              : "Essayez un autre mot ou changez d'onglet."}
          </p>
        </div>
      ) : (
        <ul>
          {list.map((c) => {
            const last = c.messages[c.messages.length - 1];
            const isAudio = last?.type === "audio";
            const isMine = last?.senderId === "me";
            const preview = isAudio ? "Message vocal" : last?.text || "";
            const hasUnread = c.unread > 0;
            const name = c.otherUser?.name || "Utilisateur";

            return (
              <li key={c.id}>
                <button
                  onClick={() => navigate(`/messages/${c.id}`)}
                  className="w-full flex items-center gap-3.5 px-5 py-3.5 text-left active:bg-gray-50 transition-colors"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1B6B3A]/20 to-[#C8972B]/20 overflow-hidden flex items-center justify-center">
                      {c.listingImage ? (
                        <img src={c.listingImage} alt="" className="w-14 h-14 object-cover" />
                      ) : (
                        <MessageCircle className="w-6 h-6 text-[#1B6B3A]" />
                      )}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#1B6B3A] text-white text-[11px] font-bold ring-2 ring-white flex items-center justify-center">
                      {name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 border-b border-gray-100 pb-3.5 -mb-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-[15px] truncate ${hasUnread ? "font-extrabold text-gray-900" : "font-semibold text-gray-800"}`}>
                        {name}
                      </p>
                      <span className={`text-[11px] flex-shrink-0 ${hasUnread ? "text-[#1B6B3A] font-bold" : "text-gray-400"}`}>
                        {formatListTime(last?.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] font-medium text-[#8A6414] bg-[#C8972B]/12 rounded-md px-1.5 py-0.5 mt-0.5 inline-block max-w-full truncate align-top">
                      {c.listingTitle}
                    </p>

                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={`text-sm truncate flex items-center gap-1 min-w-0 ${hasUnread ? "text-gray-900 font-medium" : "text-gray-400"}`}>
                        {isMine &&
                          (last?.isRead ? (
                            <CheckCheck className="w-4 h-4 text-[#1B6B3A] flex-shrink-0" />
                          ) : (
                            <Check className="w-4 h-4 flex-shrink-0" />
                          ))}
                        {isAudio && <Mic className="w-3.5 h-3.5 flex-shrink-0" />}
                        <span className="truncate">{preview}</span>
                      </p>
                      {hasUnread && (
                        <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#1B6B3A] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
