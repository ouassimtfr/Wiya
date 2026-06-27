import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Zap, Check, ArrowLeft, Star, TrendingUp, Eye, Copy, CheckCheck, Upload, ImageIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";

type BoostPlan = "basic7" | "basic30" | "premium7" | "premium30";

const PLANS: { id: BoostPlan; days: number; price: number; type: "basic" | "premium"; label: string; popular?: boolean }[] = [
  { id: "basic7",    days: 7,  price: 500,  type: "basic",   label: "Standard 7j" },
  { id: "basic30",   days: 30, price: 1500, type: "basic",   label: "Standard 30j", popular: true },
  { id: "premium7",  days: 7,  price: 1200, type: "premium", label: "Premium 7j" },
  { id: "premium30", days: 30, price: 3500, type: "premium", label: "Premium 30j" },
];

const CCP_NUMBER = "00799999004303446334";

async function compressImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 900;
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export default function BoostPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { t, isRTL } = useI18n();
  const { user, submitBoostRequest } = useStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selected, setSelected] = useState<BoostPlan | null>(null);
  const [copied, setCopied] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [receiptName, setReceiptName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [listing, setListing] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchListing();
  }, [params.id]);

  const fetchListing = async () => {
    const { data } = await supabase.from("listings").select("*").eq("id", params.id).single();
    if (data) setListing(data);
  };

  const plan = PLANS.find((p) => p.id === selected);

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(CCP_NUMBER); } catch { }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setReceiptName(file.name);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const raw = ev.target?.result as string;
      const compressed = await compressImage(raw);
      setReceipt(compressed);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!receipt || !plan || !listing) return;
    submitBoostRequest({
      listingId: listing.id,
      listingTitle: listing.title,
      listingImage: listing.images?.[0] ?? "",
      planId: plan.id,
      planLabel: plan.label,
      price: plan.price,
      days: plan.days,
      type: plan.type,
      receiptImage: receipt,
      sellerName: user?.name ?? "Vendeur",
    });
    setStep(4);
  };

  if (step === 4) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#1B6B3A] flex flex-col items-center justify-center px-8 text-center gap-5">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5, delay: 0.15 }} className="w-24 h-24 bg-[#C8972B] rounded-full flex items-center justify-center shadow-2xl">
          <CheckCheck className="w-12 h-12 text-white" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <h2 className="text-white text-2xl font-black mb-2">Demande envoyée !</h2>
          <p className="text-green-200 text-sm leading-relaxed">Votre reçu est en cours de vérification.<br />Le boost sera activé sous <strong className="text-white">24h</strong>.</p>
          <div className="mt-4 bg-white/10 rounded-2xl px-5 py-3">
            <p className="text-green-100 text-xs">Plan: <strong className="text-white">{plan?.label}</strong></p>
            <p className="text-green-100 text-xs mt-0.5">Annonce: <strong className="text-white">{listing?.title}</strong></p>
          </div>
        </motion.div>
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} onClick={() => navigate("/")} className="mt-4 px-8 py-3.5 bg-white text-[#1B6B3A] rounded-2xl font-bold text-sm shadow-lg">
          Retour à l'accueil
        </motion.button>
      </motion.div>
    );
  }

  if (!listing) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#1B6B3A] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="bg-[#F4F6F5] min-h-screen" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 100px)" }}>
      <div className="bg-[#1B6B3A] pt-12 pb-5 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"><div className="absolute -bottom-4 right-4 w-32 h-32 rounded-full bg-[#C8972B]" /></div>
        <div className="relative">
          <button onClick={() => step > 1 ? setStep((s) => (s - 1) as 1 | 2 | 3) : window.history.back()} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 mb-4">
            <ArrowLeft className={`w-4 h-4 text-white ${isRTL ? "rotate-180" : ""}`} />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-[#E8C84A] fill-[#E8C84A]" />
            <h1 className="text-white font-black text-lg">{t("boostTitle")}</h1>
          </div>
          <div className="flex items-center gap-2 mt-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${step >= s ? "bg-[#C8972B] text-white" : "bg-white/20 text-white/50"}`}>
                  {step > s ? <Check className="w-3.5 h-3.5" /> : s}
                </div>
                {s < 3 && <div className={`w-8 h-0.5 rounded-full ${step > s ? "bg-[#C8972B]" : "bg-white/20"}`} />}
              </div>
            ))}
            <span className="text-green-200 text-xs ms-1">{step === 1 ? "Choisir un plan" : step === 2 ? "Paiement BaridiMob" : "Envoyer le reçu"}</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Annonce preview */}
        <div className="bg-white rounded-2xl p-3 flex items-center gap-3 shadow-sm">
          {listing.images?.[0] ? (
            <img src={listing.images[0]} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-2xl">📦</div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{listing.title}</p>
            <p className="text-sm font-bold text-[#1B6B3A]">
              {listing.price ? `${listing.price.toLocaleString()} DA` : "Prix non défini"}
            </p>
          </div>
          {plan && step > 1 && (
            <div className={`px-2.5 py-1 rounded-xl text-xs font-bold ${plan.type === "premium" ? "bg-amber-50 text-[#C8972B]" : "bg-green-50 text-[#1B6B3A]"}`}>
              {plan.label}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[{ icon: Eye, label: "+5x vues", color: "bg-blue-50 text-blue-600" }, { icon: TrendingUp, label: "Top résultats", color: "bg-green-50 text-[#1B6B3A]" }, { icon: Star, label: "Badge vedette", color: "bg-amber-50 text-[#C8972B]" }].map((b) => (
                  <div key={b.label} className={`${b.color.split(" ")[0]} rounded-2xl p-3 text-center`}>
                    <b.icon className={`w-5 h-5 ${b.color.split(" ")[1]} mx-auto mb-1`} />
                    <p className={`text-[11px] font-bold ${b.color.split(" ")[1]}`}>{b.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">{t("basicBoost")} — {t("basicBoostDesc")}</p>
                </div>
                <div className="flex gap-2 p-3">
                  {PLANS.filter((p) => p.type === "basic").map((plan) => (
                    <motion.button key={plan.id} whileTap={{ scale: 0.97 }} onClick={() => setSelected(plan.id)} className={`flex-1 p-3 rounded-2xl border-2 transition-all relative ${selected === plan.id ? "border-[#1B6B3A] bg-green-50" : "border-gray-100"}`}>
                      {plan.popular && <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#C8972B] text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">⭐ Populaire</span>}
                      <p className="text-lg font-black text-gray-900">{plan.days}j</p>
                      <p className="text-sm font-bold text-[#1B6B3A]">{plan.price.toLocaleString()} DA</p>
                      <p className="text-[10px] text-gray-400">{Math.round(plan.price / plan.days)} DA{t("perDay")}</p>
                      {selected === plan.id && <div className="absolute top-2 end-2 w-4 h-4 bg-[#1B6B3A] rounded-full flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" /></div>}
                    </motion.button>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl shadow-sm overflow-hidden border border-[#C8972B]/20">
                <div className="px-4 py-2 bg-[#C8972B]/10 border-b border-[#C8972B]/20 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#C8972B] fill-[#C8972B]" />
                  <p className="text-xs font-bold text-[#C8972B] uppercase tracking-wide">{t("premiumBoost")} — {t("premiumBoostDesc")}</p>
                </div>
                <div className="flex gap-2 p-3">
                  {PLANS.filter((p) => p.type === "premium").map((plan) => (
                    <motion.button key={plan.id} whileTap={{ scale: 0.97 }} onClick={() => setSelected(plan.id)} className={`flex-1 p-3 rounded-2xl border-2 transition-all relative ${selected === plan.id ? "border-[#C8972B] bg-amber-100/60" : "border-[#C8972B]/20 bg-white/60"}`}>
                      <p className="text-lg font-black text-gray-900">{plan.days}j</p>
                      <p className="text-sm font-bold text-[#C8972B]">{plan.price.toLocaleString()} DA</p>
                      <p className="text-[10px] text-gray-400">{Math.round(plan.price / plan.days)} DA{t("perDay")}</p>
                      {selected === plan.id && <div className="absolute top-2 end-2 w-4 h-4 bg-[#C8972B] rounded-full flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" /></div>}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && plan && (
            <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
              <div className="bg-white rounded-3xl shadow-md overflow-hidden border border-green-100">
                <div className="bg-gradient-to-r from-[#1B6B3A] to-[#25924F] px-5 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-xl">🏦</div>
                  <div><p className="text-white font-black text-base">Paiement BaridiMob</p><p className="text-green-200 text-xs">Virement CCP sécurisé</p></div>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Numéro CCP destinataire</p>
                    <div className="flex items-center gap-2 bg-gray-50 rounded-2xl p-3 border border-gray-200">
                      <p className="flex-1 font-mono text-base font-black text-gray-900 tracking-wider break-all">{CCP_NUMBER}</p>
                      <button onClick={handleCopy} className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${copied ? "bg-green-500 text-white" : "bg-[#1B6B3A] text-white"}`}>
                        {copied ? <><CheckCheck className="w-3.5 h-3.5" /> Copié</> : <><Copy className="w-3.5 h-3.5" /> Copier</>}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Montant à virer</p>
                    <div className="bg-amber-50 border border-[#C8972B]/30 rounded-2xl p-3 text-center">
                      <p className="text-2xl font-black text-[#C8972B]">{plan.price.toLocaleString()} DA</p>
                      <p className="text-xs text-amber-600 mt-0.5">{plan.label} — {plan.days} jours</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Étapes à suivre</p>
                    <div className="space-y-2.5">
                      {["Ouvrez l'application BaridiMob", "Appuyez sur « Virement vers CCP »", `Saisissez le numéro CCP ci-dessus`, `Entrez le montant : ${plan.price.toLocaleString()} DA`, `Motif : Boost Wiya #${listing.id}`, "Confirmez avec votre code secret", "Prenez une capture d'écran du reçu ✅"].map((s, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-[#1B6B3A] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
                          <p className="text-sm text-gray-700 leading-snug">{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
              <div className="bg-white rounded-3xl shadow-md p-5 space-y-4">
                <div>
                  <h3 className="text-base font-black text-gray-900 mb-1">Envoyez votre reçu</h3>
                  <p className="text-sm text-gray-500">Prenez une capture d'écran du reçu BaridiMob et importez-la ici.</p>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                {!receipt ? (
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-[#1B6B3A]/30 rounded-2xl py-10 flex flex-col items-center gap-3 bg-green-50/50">
                    {uploading ? (
                      <div className="w-10 h-10 rounded-full border-2 border-[#1B6B3A] border-t-transparent animate-spin" />
                    ) : (
                      <>
                        <div className="w-14 h-14 rounded-2xl bg-[#1B6B3A]/10 flex items-center justify-center">
                          <Upload className="w-7 h-7 text-[#1B6B3A]" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-[#1B6B3A]">Importer la capture d'écran</p>
                          <p className="text-xs text-gray-400 mt-0.5">JPG, PNG — max 10 Mo</p>
                        </div>
                      </>
                    )}
                  </motion.button>
                ) : (
                  <div className="space-y-3">
                    <div className="relative rounded-2xl overflow-hidden border border-green-200 shadow-sm">
                      <img src={receipt} alt="Reçu" className="w-full object-contain max-h-72" />
                      <button onClick={() => { setReceipt(null); setReceiptName(""); }} className="absolute top-2 end-2 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <X className="w-4 h-4 text-white" />
                      </button>
                      <div className="absolute bottom-0 start-0 end-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-3.5 h-3.5 text-white" />
                          <span className="text-white text-xs font-medium truncate">{receiptName || "reçu.jpg"}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => fileRef.current?.click()} className="w-full py-2 text-sm text-[#1B6B3A] font-semibold border border-[#1B6B3A]/30 rounded-2xl">
                      Changer l'image
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FIX: Bouton fixed avec padding safe-area pour iPhone */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-3 shadow-lg"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 100px)" }}
      >
        {step === 1 && (
          <>
            {selected && (
              <p className="text-center text-xs text-gray-500 mb-2">
                Plan sélectionné: <strong className="text-gray-800">{plan?.price.toLocaleString()} DA — {plan?.days} jours</strong>
              </p>
            )}
            <button
              onClick={() => setStep(2)}
              disabled={!selected}
              className="w-full py-4 bg-gradient-to-r from-[#1B6B3A] to-[#25924F] text-white rounded-2xl font-bold text-sm shadow-lg shadow-green-200 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-white" />Continuer vers le paiement
            </button>
          </>
        )}
        {step === 2 && (
          <button
            onClick={() => setStep(3)}
            className="w-full py-4 bg-gradient-to-r from-[#1B6B3A] to-[#25924F] text-white rounded-2xl font-bold text-sm shadow-lg shadow-green-200 flex items-center justify-center gap-2"
          >
            J'ai effectué le virement →
          </button>
        )}
        {step === 3 && (
          <button
            onClick={handleSubmit}
            disabled={!receipt || uploading}
            className="w-full py-4 bg-gradient-to-r from-[#1B6B3A] to-[#25924F] text-white rounded-2xl font-bold text-sm shadow-lg shadow-green-200 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <CheckCheck className="w-4 h-4" />Soumettre la demande
          </button>
        )}
      </div>
    </div>
  );
}
