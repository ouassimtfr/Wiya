import { useState } from "react";
import { useLocation } from "wouter";
import { Shield, Eye, EyeOff, Check, X, Clock, Zap, ChevronLeft, BarChart3, ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { useNotifications } from "@/lib/notifications";

const ADMIN_PASSWORD = "Yanisimo2006";

type Tab = "pending" | "active" | "refused";

export default function AdminPage() {
  const [, navigate] = useLocation();
  const { boostRequests, activateBoost, refuseBoost } = useStore();
  const { pushNotification } = useNotifications();

  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState(false);
  const [tab, setTab] = useState<Tab>("pending");
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  const handleLogin = () => {
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true);
      setPwError(false);
    } else {
      setPwError(true);
      setTimeout(() => setPwError(false), 2000);
    }
  };

  const pending  = boostRequests.filter((r) => r.status === "pending");
  const active   = boostRequests.filter((r) => r.status === "active");
  const refused  = boostRequests.filter((r) => r.status === "refused");
  const current  = tab === "pending" ? pending : tab === "active" ? active : refused;

  /* ── Password gate ── */
  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0a150f] flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-6"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-[#1B6B3A] rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-green-900">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-white text-2xl font-black">Panel Admin</h1>
            <p className="text-green-400 text-sm mt-1">Accès réservé</p>
          </div>

          <div className="space-y-3">
            <div className={`flex items-center gap-3 bg-white/5 border rounded-2xl px-4 py-3 transition-colors
              ${pwError ? "border-red-500/50 bg-red-500/5" : "border-white/10"}`}>
              <Shield className="w-4 h-4 text-green-400 flex-shrink-0" />
              <input
                type={showPw ? "text" : "password"}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="Mot de passe"
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/30"
                autoFocus
              />
              <button onClick={() => setShowPw((v) => !v)} className="text-white/40">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <AnimatePresence>
              {pwError && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-red-400 text-xs text-center font-semibold"
                >
                  Mot de passe incorrect
                </motion.p>
              )}
            </AnimatePresence>

            <button
              onClick={handleLogin}
              className="w-full py-3.5 bg-[#1B6B3A] text-white rounded-2xl font-bold text-sm shadow-lg shadow-green-900"
            >
              Accéder au panel
            </button>

            <button
              onClick={() => navigate("/")}
              className="w-full py-2 text-white/30 text-sm"
            >
              Retour à l'accueil
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── Admin panel ── */
  return (
    <div className="bg-[#0a150f] min-h-screen pb-8">
      {/* Header */}
      <div className="bg-[#1B6B3A] pt-14 pb-5 px-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate("/")}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
          >
            <ChevronLeft className="w-4.5 h-4.5 text-white" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <Shield className="w-5 h-5 text-[#E8C84A]" />
            <h1 className="text-white font-black text-lg">Panel Admin</h1>
          </div>
          <button
            onClick={() => setAuthed(false)}
            className="text-green-200 text-xs font-semibold px-3 py-1.5 bg-white/10 rounded-xl"
          >
            Déconnexion
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "En attente", count: pending.length, color: "bg-amber-400/20 text-amber-300", icon: Clock },
            { label: "Activés",    count: active.length,  color: "bg-green-400/20 text-green-300",  icon: Zap },
            { label: "Refusés",    count: refused.length, color: "bg-red-400/20 text-red-300",      icon: X },
          ].map((s) => (
            <div key={s.label} className={`${s.color} rounded-2xl p-3 text-center`}>
              <s.icon className="w-4 h-4 mx-auto mb-1 opacity-80" />
              <p className="text-xl font-black">{s.count}</p>
              <p className="text-[10px] font-semibold opacity-80">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#0f1f14] border-b border-white/5">
        {(["pending", "active", "refused"] as Tab[]).map((t) => {
          const counts = { pending: pending.length, active: active.length, refused: refused.length };
          const labels = { pending: "En attente", active: "Activés", refused: "Refusés" };
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-xs font-bold transition-all relative
                ${tab === t ? "text-[#E8C84A]" : "text-white/40"}`}
            >
              {labels[t]}
              {counts[t] > 0 && (
                <span className={`ms-1 px-1.5 py-0.5 rounded-full text-[9px] font-black
                  ${tab === t ? "bg-[#C8972B] text-white" : "bg-white/10 text-white/50"}`}>
                  {counts[t]}
                </span>
              )}
              {tab === t && (
                <motion.div layoutId="tab-indicator" className="absolute bottom-0 start-0 end-0 h-0.5 bg-[#C8972B] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Cards */}
      <div className="px-4 pt-4 space-y-3">
        {current.length === 0 ? (
          <div className="text-center py-16">
            <BarChart3 className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm font-semibold">Aucune demande</p>
          </div>
        ) : (
          <AnimatePresence>
            {current.map((req, i) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[#0f2818] border border-white/5 rounded-3xl overflow-hidden"
              >
                {/* Listing info */}
                <div className="flex items-center gap-3 p-4 border-b border-white/5">
                  <img src={req.listingImage} alt="" className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate leading-tight">{req.listingTitle}</p>
                    <p className="text-green-300 text-xs mt-0.5">{req.sellerName}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                        ${req.type === "premium" ? "bg-[#C8972B]/20 text-[#C8972B]" : "bg-green-900/50 text-green-300"}`}>
                        {req.planLabel}
                      </span>
                      <span className="text-[10px] font-bold text-[#E8C84A] bg-[#C8972B]/10 px-2 py-0.5 rounded-full">
                        {req.price.toLocaleString()} DA
                      </span>
                      <span className="text-[10px] text-white/30">{req.submittedAt}</span>
                    </div>
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0
                    ${req.status === "pending" ? "bg-amber-400" : req.status === "active" ? "bg-green-400" : "bg-red-400"}`}
                  />
                </div>

                {/* Receipt */}
                <div className="px-4 py-3">
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">Reçu de paiement</p>
                  {req.receiptImage ? (
                    <button
                      onClick={() => setPreviewImg(req.receiptImage)}
                      className="relative w-full rounded-2xl overflow-hidden border border-white/10 group"
                    >
                      <img src={req.receiptImage} alt="Reçu" className="w-full object-contain max-h-48" />
                      <div className="absolute inset-0 bg-black/0 group-active:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-active:opacity-100 transition-opacity bg-black/60 rounded-full px-4 py-2">
                          <p className="text-white text-xs font-bold">Voir en grand</p>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div className="w-full h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-2">
                      <ImageIcon className="w-4 h-4 text-white/20" />
                      <p className="text-white/20 text-xs">Aucun reçu</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {req.status === "pending" && (
                  <div className="flex gap-2 px-4 pb-4">
                    <button
                      onClick={() => {
                        activateBoost(req.id);
                        pushNotification({
                          listingId: req.listingId,
                          listingTitle: req.listingTitle,
                          listingImage: req.listingImage,
                          listingPrice: req.price,
                          wilaya: req.planLabel,
                          category: "boost",
                          matchedAlert: "⚡ Boost activé",
                          read: false,
                        });
                      }}
                      className="flex-1 py-3 bg-[#1B6B3A] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-green-900"
                    >
                      <Check className="w-4 h-4" /> Activer
                    </button>
                    <button
                      onClick={() => {
                        refuseBoost(req.id);
                        pushNotification({
                          listingId: req.listingId,
                          listingTitle: req.listingTitle,
                          listingImage: req.listingImage,
                          listingPrice: req.price,
                          wilaya: req.planLabel,
                          category: "boost",
                          matchedAlert: "❌ Boost refusé",
                          read: false,
                        });
                      }}
                      className="flex-1 py-3 bg-red-900/50 text-red-300 border border-red-500/20 rounded-2xl font-bold text-sm flex items-center justify-center gap-1.5"
                    >
                      <X className="w-4 h-4" /> Refuser
                    </button>
                  </div>
                )}
                {req.status === "active" && (
                  <div className="px-4 pb-4">
                    <div className="py-3 bg-green-900/30 border border-green-500/20 rounded-2xl text-center">
                      <p className="text-green-300 text-xs font-bold flex items-center justify-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 fill-green-300" /> Boost activé
                      </p>
                    </div>
                  </div>
                )}
                {req.status === "refused" && (
                  <div className="px-4 pb-4">
                    <div className="py-3 bg-red-900/30 border border-red-500/20 rounded-2xl text-center">
                      <p className="text-red-400 text-xs font-bold flex items-center justify-center gap-1.5">
                        <X className="w-3.5 h-3.5" /> Demande refusée
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Receipt fullscreen preview */}
      <AnimatePresence>
        {previewImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImg(null)}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm"
            >
              <img src={previewImg} alt="Reçu" className="w-full rounded-2xl object-contain max-h-[80vh]" />
              <button
                onClick={() => setPreviewImg(null)}
                className="absolute top-3 end-3 w-9 h-9 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center"
              >
                <X className="w-4.5 h-4.5 text-white" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
