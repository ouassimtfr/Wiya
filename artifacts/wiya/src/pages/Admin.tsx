import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Shield, Check, X, Clock, Zap, ChevronLeft, BarChart3, ImageIcon, RefreshCw, HardDrive, Hourglass, Flag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";

type Tab = "pending" | "active" | "ended" | "refused";
type Section = "boosts" | "subs";
type OrphanFile = { name: string; size_mb: number };
type Report = { id: string; listing_id: string; reason: string; created_at: string };

const DAY = 86400000;

// Un boost dure `days` jours à partir de son activation (à défaut : de la date de la demande).
// Un abonnement a directement sa date de fin (`_ends`).
const endsAt = (r: any) =>
  r._ends
    ? new Date(r._ends).getTime()
    : new Date(r.activated_at ?? r.submitted_at).getTime() + Number(r.days || 0) * DAY;
const isEnded = (r: any) => r.status === "active" && endsAt(r) < Date.now();

// Un abonnement est présenté avec la même carte qu'un boost
const mapSub = (s: any) => ({
  ...s,
  _sub: true,
  _ends: s.ends_at,
  listing_title: `Abonnement · ${s.plan_label}`,
  listing_image: null,
  type: "premium",
});

export default function AdminPage() {
  const [, navigate] = useLocation();
  const { user } = useStore();

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [section, setSection] = useState<Section>("boosts");
  const [tab, setTab] = useState<Tab>("pending");
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
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
    if (authed) init();
  }, [authed]);

  // À l'ouverture : on retire les boosts et annonces expirés, puis on charge les listes
  const init = async () => {
    await Promise.all([supabase.rpc("expire_boosts"), supabase.rpc("expire_listings")]);
    fetchRequests();
    fetchSubs();
    fetchReports();
  };

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

  const fetchSubs = async () => {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .order("submitted_at", { ascending: false });
    if (error) {
      console.error("Erreur chargement abonnements:", error);
      setActionError(`Chargement des abonnements impossible : ${error.message}`);
      return;
    }
    setSubs((data ?? []).map(mapSub));
  };

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Erreur chargement signalements:", error);
      return;
    }
    setReports((data ?? []) as Report[]);
  };

  const dismissReport = async (id: string) => {
    const { error } = await supabase.from("reports").delete().eq("id", id);
    if (error) {
      setActionError(`Suppression du signalement impossible : ${error.message}`);
      return;
    }
    setReports((prev) => prev.filter((r) => r.id !== id));
  };

  // ─── Abonnements ───
  const handleActivateSub = async (req: any) => {
    setActionError("");
    setBusyId(req.id);
    const now = new Date();

    // Si la personne a déjà un abonnement actif, la nouvelle durée s'ajoute à la fin de l'actuel
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("ends_at")
      .eq("user_id", req.user_id)
      .eq("status", "active");
    let start = now.getTime();
    (existing ?? []).forEach((r: any) => {
      const e = r.ends_at ? new Date(r.ends_at).getTime() : 0;
      if (e > start) start = e;
    });
    const ends = new Date(start + Number(req.days || 0) * DAY).toISOString();

    const { data: rows, error } = await supabase
      .from("subscriptions")
      .update({ status: "active", activated_at: now.toISOString(), ends_at: ends, receipt_image: null })
      .eq("id", req.id)
      .select("id, status");

    if (error) {
      console.error("Erreur activation abonnement:", error);
      setActionError(`Activation impossible : ${error.message}`);
      setBusyId(null);
      return;
    }
    if (!rows || rows.length === 0) {
      setActionError("L'abonnement n'a pas été modifié (droits insuffisants sur subscriptions).");
      setBusyId(null);
      return;
    }

    // Boost automatique sur toutes les annonces en ligne de cette personne
    const { error: boostErr } = await supabase
      .from("listings")
      .update({ is_boosted: true, boost_until: ends })
      .eq("user_id", req.user_id)
      .eq("is_active", true);
    if (boostErr) {
      console.error("Erreur boost auto:", boostErr);
      setActionError(`Abonnement activé, mais boost des annonces impossible : ${boostErr.message}`);
    }

    setBusyId(null);
    fetchSubs();
  };

  const handleRefuseSub = async (req: any) => {
    setActionError("");
    setBusyId(req.id);
    const { data: rows, error } = await supabase
      .from("subscriptions")
      .update({ status: "refused", receipt_image: null })
      .eq("id", req.id)
      .select("id, status");

    if (error) {
      setActionError(`Refus impossible : ${error.message}`);
      setBusyId(null);
      return;
    }
    if (!rows || rows.length === 0) {
      setActionError("La demande n'a pas été modifiée (droits insuffisants sur subscriptions).");
      setBusyId(null);
      return;
    }
    setBusyId(null);
    fetchSubs();
  };

  // ─── Boosts ───
  const handleActivate = async (req: any) => {
    if (req._sub) return handleActivateSub(req);

    setActionError("");
    setBusyId(req.id);
    const listingId = String(req.listing_id).trim();
    const now = new Date();
    const until = new Date(now.getTime() + Number(req.days || 0) * DAY).toISOString();

    // 1. On boost l'annonce (avec sa date de fin) et on vérifie que la ligne a vraiment changé
    const { data: listingRows, error: listingError } = await supabase
      .from("listings")
      .update({ is_boosted: true, boost_until: until })
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

    // 2. On passe la demande en "active", on garde la date d'activation et on efface le reçu (libère l'espace)
    const { data: reqRows, error: reqError } = await supabase
      .from("boost_requests")
      .update({ status: "active", activated_at: now.toISOString(), receipt_image: null })
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
    if (req._sub) return handleRefuseSub(req);

    setActionError("");
    setBusyId(req.id);

    const { data: rows, error } = await supabase
      .from("boost_requests")
      .update({ status: "refused", receipt_image: null })
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

  const source = section === "boosts" ? requests : subs;
  const pending = source.filter((r) => r.status === "pending");
  const active  = source.filter((r) => r.status === "active" && !isEnded(r));
  const ended   = source.filter((r) => isEnded(r));
  const refused = source.filter((r) => r.status === "refused");
  const current =
    tab === "pending" ? pending : tab === "active" ? active : tab === "ended" ? ended : refused;

  const pendingBoosts = requests.filter((r) => r.status === "pending").length;
  const pendingSubs = subs.filter((r) => r.status === "pending").length;

  const daysLeft = (r: any) => Math.max(1, Math.ceil((endsAt(r) - Date.now()) / DAY));
  const fmtDate = (ts: number) => new Date(ts).toLocaleDateString("fr-FR");

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

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "pending", label: "En attente", count: pending.length },
    { id: "active", label: "En cours", count: active.length },
    { id: "ended", label: "Terminés", count: ended.length },
    { id: "refused", label: "Refusés", count: refused.length },
  ];

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
          <button onClick={init} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <RefreshCw className={`w-4 h-4 text-white ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "En attente", count: pending.length, color: "bg-amber-400/20 text-amber-300", icon: Clock },
            { label: "En cours",   count: active.length,  color: "bg-green-400/20 text-green-300",  icon: Zap },
            { label: "Terminés",   count: ended.length,   color: "bg-sky-400/20 text-sky-300",      icon: Hourglass },
            { label: "Refusés",    count: refused.length, color: "bg-red-400/20 text-red-300",      icon: X },
          ].map((s) => (
            <div key={s.label} className={`${s.color} rounded-2xl p-2.5 text-center`}>
              <s.icon className="w-4 h-4 mx-auto mb-1 opacity-80" />
              <p className="text-xl font-black">{s.count}</p>
              <p className="text-[10px] font-semibold opacity-80">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Choix : Boosts ou Abonnements ─── */}
      <div className="mx-4 mt-3 flex bg-[#0f2818] border border-white/5 rounded-2xl p-1">
        {([
          { id: "boosts" as Section, label: "Boosts", count: pendingBoosts },
          { id: "subs" as Section, label: "Abonnements", count: pendingSubs },
        ]).map((s) => (
          <button
            key={s.id}
            onClick={() => { setSection(s.id); setTab("pending"); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              section === s.id ? "bg-[#1B6B3A] text-white" : "text-white/40"
            }`}
          >
            {s.label}
            {s.count > 0 && (
              <span className="ms-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-[#C8972B] text-white">{s.count}</span>
            )}
          </button>
        ))}
      </div>

      {actionError && (
        <div className="mx-4 mt-3 bg-red-900/40 border border-red-500/30 rounded-2xl px-4 py-3 flex items-start gap-2">
          <p className="flex-1 text-red-300 text-xs font-medium leading-snug">{actionError}</p>
          <button onClick={() => setActionError("")}><X className="w-4 h-4 text-red-300" /></button>
        </div>
      )}

      {/* ─── Signalements des annonces ─── */}
      {reports.length > 0 && (
        <div className="mx-4 mt-3 bg-[#0f2818] border border-red-500/20 rounded-3xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
              <Flag className="w-5 h-5 text-red-300" />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">Signalements</p>
              <p className="text-white/40 text-xs">{reports.length} annonce{reports.length > 1 ? "s" : ""} signalée{reports.length > 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="space-y-2">
            {reports.map((r) => (
              <div key={r.id} className="bg-white/5 rounded-2xl p-3">
                <p className="text-white text-sm font-semibold">{r.reason}</p>
                <p className="text-white/30 text-[11px] mt-0.5">{new Date(r.created_at).toLocaleDateString("fr-FR")}</p>
                <div className="flex gap-2 mt-2.5">
                  <button
                    onClick={() => navigate(`/listing/${r.listing_id}`)}
                    className="flex-1 py-2 bg-white/10 text-white rounded-xl text-xs font-bold"
                  >
                    Voir l'annonce
                  </button>
                  <button
                    onClick={() => dismissReport(r.id)}
                    className="flex-1 py-2 bg-green-900/40 text-green-300 rounded-xl text-xs font-bold"
                  >
                    Traité
                  </button>
                </div>
              </div>
            ))}
          </div>
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
            <p className="text-white/40 text-xs">Fichiers d'annonces supprimées ou expirées</p>
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
        {tabs.map((tb) => (
          <button key={tb.id} onClick={() => setTab(tb.id)} className={`flex-1 py-3 text-[11px] font-bold transition-all relative ${tab === tb.id ? "text-[#E8C84A]" : "text-white/40"}`}>
            {tb.label}
            {tb.count > 0 && <span className={`ms-1 px-1.5 py-0.5 rounded-full text-[9px] font-black ${tab === tb.id ? "bg-[#C8972B] text-white" : "bg-white/10 text-white/50"}`}>{tb.count}</span>}
            {tab === tb.id && <motion.div layoutId="tab-indicator" className="absolute bottom-0 start-0 end-0 h-0.5 bg-[#C8972B] rounded-full" />}
          </button>
        ))}
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
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    req.status === "pending" ? "bg-amber-400" : req.status === "refused" ? "bg-red-400" : isEnded(req) ? "bg-sky-400" : "bg-green-400"
                  }`} />
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
                      <p className="text-white/20 text-xs">
                        {req.status === "pending" ? "Aucun reçu" : "Reçu effacé pour libérer l'espace"}
                      </p>
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
                {req.status === "active" && !isEnded(req) && (
                  <div className="px-4 pb-4">
                    <div className="py-3 bg-green-900/30 border border-green-500/20 rounded-2xl text-center">
                      <p className="text-green-300 text-xs font-bold flex items-center justify-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 fill-green-300" />
                        {req._sub ? "Abonnement actif" : "Boost actif"} · encore {daysLeft(req)} j (fin le {fmtDate(endsAt(req))})
                      </p>
                    </div>
                  </div>
                )}
                {isEnded(req) && (
                  <div className="px-4 pb-4">
                    <div className="py-3 bg-sky-900/20 border border-sky-500/20 rounded-2xl text-center">
                      <p className="text-sky-300 text-xs font-bold flex items-center justify-center gap-1.5">
                        <Hourglass className="w-3.5 h-3.5" />
                        {req._sub ? "Abonnement terminé" : "Boost terminé"} le {fmtDate(endsAt(req))}
                      </p>
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
