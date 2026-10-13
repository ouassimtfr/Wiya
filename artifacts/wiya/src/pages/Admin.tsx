import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Shield, Check, X, Clock, Zap, ChevronLeft, BarChart3, ImageIcon, RefreshCw, HardDrive } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";

type Tab = "pending" | "active" | "refused";
type OrphanFile = { name: string; size_mb: number };

export default function AdminPage() {
  const [, navigate] = useLocation();
  const { user } = useStore();

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("pending");
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  // Nettoyage du stockage
  const [orphans, setOrphans] = useState<OrphanFile[] | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleanMsg, setCleanMsg] = useState("");

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    setCheckingAccess(true);
    if (!user) {
      setAuthed(false);
      setCheckingAccess(false);
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (error || !data?.is_admin) {
      setAuthed(false);
    } else {
      setAuthed(true);
    }
    setCheckingAccess(false);
  };

  useEffect(() => {
    if (authed) fetchRequests();
  }, [authed]);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("boost_requests")
      .select("*")
      .order("submitted_at", { ascending: false });
    if (error) {
      console.error("Erreur chargement demandes:", error);
      setActionError(`Chargement impossible : ${error.message}`);
    }
    if (data) setRequests(data);
    setLoading(false);
  };

  const handleActivate = async (req: any) => {
    setActionError("");
    setBusyId(req.id);
    const listingId = String(req.listing_id).trim();

    // 1. On boost l'annonce et on vérifie que la ligne a vraiment changé
    const { data: listingRows, error: listingError } = await supabase
      .from("listings")
      .update({ is_boosted: true })
      .eq("id", listingId)
      .select("id, is_boosted");

    if (listingError) {
      console.error("Erreur update listings.is_boosted:", listingError);
      setActionError(`Boost de l'annonce impossible : ${listingError.message}`);
      setBusyId(null);
      return;
    }
    if (!listingRows || listingRows.length === 0 || !listingRows[0].is_boosted) {
      setActionError(
        "L'annonce n'a pas été modifiée (annonce introuvable ou droits insuffisants). Vérifie les règles RLS sur listings."
      );
      setBusyId(null);
      return;
    }

    // 2. On passe la demande en "active" et on vérifie aussi
    const { data: reqRows, error: reqError } = await supabase
      .from("boost_requests")
      .update({ status: "active" })
      .eq("id", req.id)
      .select("id, status");

    if (reqError) {
      console.error("Erreur update boost_requests:", reqError);
      setActionError(`Annonce boostée, mais statut non mis à jour : ${reqError.message}`);
      setBusyId(null);
      return;
    }
    if (!reqRows || reqRows.length === 0) {
      setActionError(
        "Annonce boostée, mais la demande n'a pas été mise à jour (droits insuffisants sur boost_requests)."
      );
      setBusyId(null);
      return;
    }

    setBusyId(null);
    fetchRequests();
  };

  const handleRefuse = async (req: any) => {
    setActionError("");
    setBusyId(req.id);

    const { data: rows, error } = await supabase
      .from("boost_requests")
      .update({ status: "refused" })
      .eq("id", req.id)
      .select("id, status");

    if (error) {
      console.error("Erreur update refus boost:", error);
      setActionError(`Refus impossible : ${error.message}`);
      setBusyId(null);
      return;
    }
    if (!rows || rows.length === 0) {
      setActionError("La demande n'a pas été modifiée (droits insuffisants sur boost_requests).");
      setBusyId(null);
      return;
    }

    setBusyId(null);
    fetchRequests();
  };

  // ─── Nettoyage du stockage : fichiers que plus aucune annonce n'utilise ───
  const scanOrphans = async () => {
    setScanning(true);
    setCleanMsg("");
    const { data, error } = await supabase.rpc("orphan_listing_files");
    if (error) {
      console.error("Erreur recherche fichiers inutiles:", error);
      setCleanMsg(`Recherche impossible : ${error.message}`);
      setOrphans(null);
    } else {
      setOrphans((data ?? []) as OrphanFile[]);
    }
    setScanning(false);
  };

  const orphansTotalMb = orphans
    ? Math.round(orphans.reduce((sum, o) => sum + Number(o.size_mb || 0), 0) * 100) / 100
    : 0;

  const cleanOrphans = async () => {
    if (!orphans || orphans.length === 0) return;
    if (
      !confirm(
        `Supprimer définitivement ${orphans.length} fichier(s) (${orphansTotalMb} Mo) ? Cette action est irréversible.`
      )
    )
      return;

    setCleaning(true);
    setCleanMsg("");
    let deleted = 0;
    let failure = "";

    for (let i = 0; i < orphans.length; i += 50) {
      const chunk = orphans.slice(i, i + 50).map((o) => o.name);
      const { data, error } = await supabase.storage.from("listings").remove(chunk);
      if (error) {
        console.error("Erreur suppression fichiers:", error);
        failure = error.message;
        break;
      }
      deleted += data?.length ?? 0;
    }

    setCleaning(false);
    setOrphans(null);
    setCleanMsg(
      failure
        ? `Erreur : ${failure} (${deleted} fichier(s) supprimé(s) avant l'erreur).`
        : deleted === 0
        ? "Aucun fichier supprimé : les droits admin du SQL ne sont probablement pas actifs."
        : `${deleted} fichier(s) supprimé(s) sur ${orphans.length}. L'espace est libéré.`
    );
  };

  const pending = requests.filter((r) => r.status === "pending");
  const active  = requests.filter((r) => r.status === "active");
  const refused = requests.filter((r) => r.status === "refused");
  const current = tab === "pending" ? pending : tab === "active" ? active : refused;

  if (checkingAccess) {
    return (
      <div className="min-h-[100dvh] bg-[#0a150f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1B6B3A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-[100dvh] bg-[#0a150f] flex flex-col items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-6 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-white text-2xl font-black">Accès refusé</h1>
          <p className="text-white/40 text-sm">
            {user ? "Ton compte n'a pas les droits admin." : "Connecte-toi avec un compte admin pour accéder à cette page."}
          </p>
          {!user && (
            <button onClick={() => navigate("/auth")} className="w-full py-3.5 bg-white/10 text-white rounded-2xl font-bold text-sm">
              Se connecter
            </button>
          )}
          <button onClick={() => navigate("/")} className="w-full py-3.5 bg-[#1B6B3A] text-white rounded-2xl font-bold text-sm shadow-lg shadow-green-900">
            Retour à l'accueil
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a150f] min-h-[100dvh] pb-8">
      <div className="bg-[#1B6B3A] pt-[calc(3.5rem+env(safe-area-inset-top))] pb-5 px-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate("/")} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <Shield className="w-5 h-5 text-[#E8C84A]" />
            <h1 className="text-white font-black text-lg">Panel Admin</h1>
          </div>
          <button onClick={fetchRequests} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <RefreshCw className={`w-4 h-4 text-white ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
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

      {actionError && (
        <div className="mx-4 mt-3 bg-red-900/40 border border-red-500/30 rounded-2xl px-4 py-3 flex items-start gap-2">
          <p className="flex-1 text-red-300 text-xs font-medium leading-snug">{actionError}</p>
          <button onClick={() => setActionError("")}><X className="w-4 h-4 text-red-300" /></button>
        </div>
      )}

      {/* ─── Stockage : libérer l'espace des fichiers inutilisés ─── */}
      <div className="mx-4 mt-3 bg-[#0f2818] border border-white/5 rounded-3xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <HardDrive className="w-5 h-5 text-[#E8C84A]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">Stockage</p>
            <p className="text-white/40 text-xs">Fichiers d'annonces supprimées</p>
          </div>
          <button
            onClick={scanOrphans}
            disabled={scanning || cleaning}
            className="px-3.5 py-2 bg-white/10 text-white rounded-xl text-xs font-bold disabled:opacity-50"
          >
            {scanning ? "..." : "Chercher"}
          </button>
        </div>

        {orphans !== null && (
          <div className="mt-3">
            {orphans.length === 0 ? (
              <p className="text-green-300 text-xs font-semibold">Rien à nettoyer, tout est propre.</p>
            ) : (
              <>
                <p className="text-white text-sm font-bold">
                  {orphans.length} fichier{orphans.length > 1 ? "s" : ""} inutile{orphans.length > 1 ? "s" : ""}
                  <span className="text-[#E8C84A]"> · {orphansTotalMb} Mo</span>
                </p>
                <button
                  onClick={cleanOrphans}
                  disabled={cleaning}
                  className="mt-3 w-full py-3 bg-red-900/50 text-red-300 border border-red-500/20 rounded-2xl font-bold text-sm disabled:opacity-50"
                >
                  {cleaning ? "Suppression en cours..." : `Supprimer pour libérer ${orphansTotalMb} Mo`}
                </button>
              </>
            )}
          </div>
        )}

        {cleanMsg && <p className="mt-3 text-xs font-semibold text-white/80 leading-snug">{cleanMsg}</p>}
      </div>

      <div className="flex bg-[#0f1f14] border-b border-white/5 mt-3">
        {(["pending", "active", "refused"] as Tab[]).map((t) => {
          const counts = { pending: pending.length, active: active.length, refused: refused.length };
          const labels = { pending: "En attente", active: "Activés", refused: "Refusés" };
          return (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 text-xs font-bold transition-all relative ${tab === t ? "text-[#E8C84A]" : "text-white/40"}`}>
              {labels[t]}
              {counts[t] > 0 && <span className={`ms-1 px-1.5 py-0.5 rounded-full text-[9px] font-black ${tab === t ? "bg-[#C8972B] text-white" : "bg-white/10 text-white/50"}`}>{counts[t]}</span>}
              {tab === t && <motion.div layoutId="tab-indicator" className="absolute bottom-0 start-0 end-0 h-0.5 bg-[#C8972B] rounded-full" />}
            </button>
          );
        })}
      </div>

      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-[#1B6B3A] border-t-transparent rounded-full animate-spin" /></div>
        ) : current.length === 0 ? (
          <div className="text-center py-16">
            <BarChart3 className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm font-semibold">Aucune demande</p>
          </div>
        ) : (
          <AnimatePresence>
            {current.map((req, i) => (
              <motion.div key={req.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.05 }} className="bg-[#0f2818] border border-white/5 rounded-3xl overflow-hidden">
                <div className="flex items-center gap-3 p-4 border-b border-white/5">
                  {req.listing_image && <img src={req.listing_image} alt="" className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate leading-tight">{req.listing_title}</p>
                    <p className="text-green-300 text-xs mt-0.5">{req.seller_name}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${req.type === "premium" ? "bg-[#C8972B]/20 text-[#C8972B]" : "bg-green-900/50 text-green-300"}`}>{req.plan_label}</span>
                      <span className="text-[10px] font-bold text-[#E8C84A] bg-[#C8972B]/10 px-2 py-0.5 rounded-full">{req.price?.toLocaleString()} DA</span>
                      <span className="text-[10px] text-white/30">{new Date(req.submitted_at).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${req.status === "pending" ? "bg-amber-400" : req.status === "active" ? "bg-green-400" : "bg-red-400"}`} />
                </div>

                <div className="px-4 py-3">
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">Reçu de paiement</p>
                  {req.receipt_image ? (
                    <button onClick={() => setPreviewImg(req.receipt_image)} className="relative w-full rounded-2xl overflow-hidden border border-white/10">
                      <img src={req.receipt_image} alt="Reçu" className="w-full object-contain max-h-48" />
                    </button>
                  ) : (
                    <div className="w-full h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-2">
                      <ImageIcon className="w-4 h-4 text-white/20" />
                      <p className="text-white/20 text-xs">Aucun reçu</p>
                    </div>
                  )}
                </div>

                {req.status === "pending" && (
                  <div className="flex gap-2 px-4 pb-4">
                    <button onClick={() => handleActivate(req)} disabled={busyId === req.id} className="flex-1 py-3 bg-[#1B6B3A] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-green-900 disabled:opacity-50">
                      <Check className="w-4 h-4" /> {busyId === req.id ? "..." : "Activer"}
                    </button>
                    <button onClick={() => handleRefuse(req)} disabled={busyId === req.id} className="flex-1 py-3 bg-red-900/50 text-red-300 border border-red-500/20 rounded-2xl font-bold text-sm flex items-center justify-center gap-1.5 disabled:opacity-50">
                      <X className="w-4 h-4" /> Refuser
                    </button>
                  </div>
                )}
                {req.status === "active" && (
                  <div className="px-4 pb-4">
                    <div className="py-3 bg-green-900/30 border border-green-500/20 rounded-2xl text-center">
                      <p className="text-green-300 text-xs font-bold flex items-center justify-center gap-1.5"><Zap className="w-3.5 h-3.5 fill-green-300" /> Boost activé</p>
                    </div>
                  </div>
                )}
                {req.status === "refused" && (
                  <div className="px-4 pb-4">
                    <div className="py-3 bg-red-900/30 border border-red-500/20 rounded-2xl text-center">
                      <p className="text-red-400 text-xs font-bold flex items-center justify-center gap-1.5"><X className="w-3.5 h-3.5" /> Demande refusée</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {previewImg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewImg(null)} className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-sm">
              <img src={previewImg} alt="Reçu" className="w-full rounded-2xl object-contain max-h-[80vh]" />
              <button onClick={() => setPreviewImg(null)} className="absolute top-3 end-3 w-9 h-9 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center">
                <X className="w-4 h-4 text-white" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
