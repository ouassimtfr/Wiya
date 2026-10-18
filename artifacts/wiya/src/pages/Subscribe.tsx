import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Check, CheckCheck, Copy, Crown, Video, Zap, Images, Upload, ImageIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useSubscription } from "@/lib/subscription";

type PlanId = "sub1" | "sub6" | "sub12";

const PLANS: { id: PlanId; days: number; price: number; label: string; months: number; best?: boolean }[] = [
  { id: "sub1", days: 30, price: 1500, label: "Abonnement 1 mois", months: 1 },
  { id: "sub6", days: 180, price: 7500, label: "Abonnement 6 mois", months: 6 },
  { id: "sub12", days: 365, price: 12000, label: "Abonnement 12 mois", months: 12, best: true },
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

export default function SubscribePage() {
  const [, navigate] = useLocation();
  const { t, isRTL } = useI18n();
  const tr = (fr: string, ar: string) => (isRTL ? ar : fr);
  const { user } = useStore();
  const sub = useSubscription(user?.id);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selected, setSelected] = useState<PlanId | null>("sub12");
  const [copied, setCopied] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [receiptName, setReceiptName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user]);

  if (!user) return null;

  const plan = PLANS.find((p) => p.id === selected);
  const planName = (p: { months: number }) =>
    p.months === 12
      ? tr("12 mois", "12 شهرا")
      : p.months === 6
      ? tr("6 mois", "6 أشهر")
      : tr("1 mois", "شهر واحد");

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(CCP_NUMBER); } catch { }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setReceiptName(file.name);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const raw = ev.target?.result as string;
      setReceipt(await compressImage(raw));
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!receipt || !plan) return;
    setSubmitting(true);
    setSubmitError("");
    const { error } = await supabase.from("subscriptions").insert({
      user_id: user.id,
      seller_name: user.name ?? "Vendeur",
      plan_id: plan.id,
      plan_label: plan.label,
      price: plan.price,
      days: plan.days,
      receipt_image: receipt,
      status: "pending",
    });
    setSubmitting(false);
    if (error) {
      console.error("Erreur demande d'abonnement:", error);
      setSubmitError(`${tr("Échec de l'envoi de la demande.", "فشل إرسال الطلب.")} (${error.message})`);
      return;
    }
    sub.refresh();
    setStep(4);
  };

  const paySteps = plan
    ? [
        tr("Ouvrez l'application BaridiMob", "افتح تطبيق بريدي موب"),
        tr("Appuyez sur « Virement vers CCP »", "اضغط على «تحويل إلى CCP»"),
        tr("Saisissez le numéro CCP ci-dessus", "أدخل رقم CCP أعلاه"),
        tr(`Entrez le montant : ${plan.price.toLocaleString()} DA`, `أدخل المبلغ: ${plan.price.toLocaleString()} دج`),
        tr("Motif : Abonnement Wiya", "السبب: اشتراك Wiya"),
        tr("Confirmez avec votre code secret", "أكّد برمزك السري"),
        tr("Prenez une capture d'écran du reçu ✅", "التقط صورة شاشة للوصل ✅"),
      ]
    : [];

  if (step === 4) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-[100dvh] bg-[#1B6B3A] flex flex-col items-center justify-center px-8 text-center gap-5">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5, delay: 0.15 }} className="w-24 h-24 bg-[#C8972B] rounded-full flex items-center justify-center shadow-2xl">
          <CheckCheck className="w-12 h-12 text-white" />
        </motion.div>
        <div>
          <h2 className="text-white text-2xl font-black mb-2">{tr("Demande envoyée !", "تم إرسال الطلب!")}</h2>
          <p className="text-green-200 text-sm leading-relaxed">
            {tr("Votre reçu a bien été reçu.", "تم استلام وصلك.")}<br />
            {tr("Nous vérifions votre paiement et activons votre abonnement sous peu.", "سنتحقق من دفعك ونفعّل اشتراكك قريبا.")}
          </p>
          <div className="mt-4 bg-white/10 rounded-2xl px-5 py-3">
            <p className="text-green-100 text-xs">{tr("Formule", "العرض")}: <strong className="text-white">{plan ? planName(plan) : ""}</strong></p>
          </div>
        </div>
        <button onClick={() => navigate("/")} className="mt-4 px-8 py-3.5 bg-white text-[#1B6B3A] rounded-2xl font-bold text-sm shadow-lg">
          {tr("Retour à l'accueil", "العودة إلى الرئيسية")}
        </button>
      </motion.div>
    );
  }

  const steps = [
    tr("Choisir une formule", "اختر العرض"),
    tr("Paiement BaridiMob", "الدفع عبر بريدي موب"),
    tr("Envoyer le reçu", "إرسال الوصل"),
  ];

  const perks = [
    {
      icon: Video,
      bg: "bg-blue-50",
      color: "text-blue-600",
      text: tr("Vidéo de 30 secondes sur vos annonces", "فيديو مدته 30 ثانية على إعلاناتك"),
    },
    {
      icon: Zap,
      bg: "bg-amber-50",
      color: "text-[#C8972B]",
      text: tr("Boost automatique sur toutes vos annonces", "تعزيز تلقائي لجميع إعلاناتك"),
    },
    {
      icon: Images,
      bg: "bg-green-50",
      color: "text-[#1B6B3A]",
      text: tr("12 photos par annonce au lieu de 6", "12 صورة لكل إعلان بدل 6"),
    },
  ];

  return (
    <div className="bg-[#F4F6F5] min-h-[100dvh]" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 190px)" }}>
      <div className="bg-[#1B6B3A] pt-[calc(3rem+env(safe-area-inset-top))] pb-5 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"><div className="absolute -bottom-4 right-4 w-32 h-32 rounded-full bg-[#C8972B]" /></div>
        <div className="relative">
          <button onClick={() => (step > 1 ? setStep((s) => (s - 1) as 1 | 2 | 3) : window.history.back())} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 mb-4">
            <ArrowLeft className={`w-4 h-4 text-white ${isRTL ? "rotate-180" : ""}`} />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-5 h-5 text-[#E8C84A] fill-[#E8C84A]" />
            <h1 className="text-white font-black text-lg">{tr("Abonnement Wiya", "اشتراك Wiya")}</h1>
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
            <span className="text-green-200 text-xs ms-1">{steps[step - 1]}</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {sub.active && sub.endsAt && (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
            <p className="text-sm font-bold text-[#1B6B3A]">
              {tr("Abonnement actif jusqu'au", "اشتراكك فعّال حتى")} {new Date(sub.endsAt).toLocaleDateString("fr-FR")}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{tr("Si vous prolongez, la durée s'ajoute à la fin de l'abonnement actuel.", "إذا مددت، تضاف المدة إلى نهاية اشتراكك الحالي.")}</p>
          </div>
        )}
        {sub.pending && (
          <div className="bg-amber-50 border border-[#C8972B]/30 rounded-2xl px-4 py-3">
            <p className="text-xs font-semibold text-amber-700">{tr("Une demande d'abonnement est déjà en cours de vérification.", "يوجد طلب اشتراك قيد التحقق بالفعل.")}</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
                <p className="text-sm font-black text-gray-900">{tr("Ce que vous obtenez", "ما تحصل عليه")}</p>
                {perks.map((p) => (
                  <div key={p.text} className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${p.bg} flex items-center justify-center flex-shrink-0`}>
                      <p.icon className={`w-4 h-4 ${p.color}`} />
                    </div>
                    <p className="text-sm text-gray-700">{p.text}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5">
                {PLANS.map((p) => (
                  <motion.button
                    key={p.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelected(p.id)}
                    className={`w-full text-start p-4 rounded-2xl border-2 transition-all relative bg-white ${selected === p.id ? "border-[#1B6B3A]" : "border-gray-100"}`}
                  >
                    {p.best && (
                      <span className="absolute -top-2 end-4 bg-[#C8972B] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        {tr("⭐ Meilleure offre", "⭐ أفضل عرض")}
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-black text-gray-900">{planName(p)}</p>
                        <p className="text-xs text-gray-400">{Math.round(p.price / p.months).toLocaleString()} {t("da")} / {tr("mois", "شهر")}</p>
                      </div>
                      <div className="text-end">
                        <p className="text-xl font-black text-[#1B6B3A]">{p.price.toLocaleString()} {t("da")}</p>
                      </div>
                    </div>
                    {selected === p.id && (
                      <div className="absolute top-3 start-3 w-4 h-4 bg-[#1B6B3A] rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && plan && (
            <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
              <div className="bg-white rounded-3xl shadow-md overflow-hidden border border-green-100">
                <div className="bg-gradient-to-r from-[#1B6B3A] to-[#25924F] px-5 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-xl">🏦</div>
                  <div>
                    <p className="text-white font-black text-base">{tr("Paiement BaridiMob", "الدفع عبر بريدي موب")}</p>
                    <p className="text-green-200 text-xs">{tr("Virement CCP sécurisé", "تحويل CCP آمن")}</p>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{tr("Numéro CCP destinataire", "رقم CCP المستلم")}</p>
                    <div className="flex items-center gap-2 bg-gray-50 rounded-2xl p-3 border border-gray-200">
                      <p dir="ltr" className="flex-1 font-mono text-base font-black text-gray-900 tracking-wider break-all">{CCP_NUMBER}</p>
                      <button onClick={handleCopy} className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${copied ? "bg-green-500 text-white" : "bg-[#1B6B3A] text-white"}`}>
                        {copied ? <><CheckCheck className="w-3.5 h-3.5" /> {tr("Copié", "تم النسخ")}</> : <><Copy className="w-3.5 h-3.5" /> {tr("Copier", "نسخ")}</>}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{tr("Montant à virer", "المبلغ المطلوب تحويله")}</p>
                    <div className="bg-amber-50 border border-[#C8972B]/30 rounded-2xl p-3 text-center">
                      <p className="text-2xl font-black text-[#C8972B]">{plan.price.toLocaleString()} {t("da")}</p>
                      <p className="text-xs text-amber-600 mt-0.5">{tr("Abonnement", "اشتراك")} {planName(plan)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{tr("Étapes à suivre", "الخطوات")}</p>
                    <div className="space-y-2.5">
                      {paySteps.map((s, i) => (
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
            <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
              <div className="bg-white rounded-3xl shadow-md p-5 space-y-4">
                <div>
                  <h3 className="text-base font-black text-gray-900 mb-1">{tr("Envoyez votre reçu", "أرسل وصلك")}</h3>
                  <p className="text-sm text-gray-500">{tr("Prenez une capture d'écran du reçu BaridiMob et importez-la ici.", "التقط صورة شاشة لوصل بريدي موب وارفعها هنا.")}</p>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                {!receipt ? (
                  <button onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-[#1B6B3A]/30 rounded-2xl py-10 flex flex-col items-center gap-3 bg-green-50/50">
                    {uploading ? (
                      <div className="w-10 h-10 rounded-full border-2 border-[#1B6B3A] border-t-transparent animate-spin" />
                    ) : (
                      <>
                        <div className="w-14 h-14 rounded-2xl bg-[#1B6B3A]/10 flex items-center justify-center"><Upload className="w-7 h-7 text-[#1B6B3A]" /></div>
                        <p className="text-sm font-bold text-[#1B6B3A]">{tr("Importer la capture d'écran", "رفع لقطة الشاشة")}</p>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="relative rounded-2xl overflow-hidden border border-green-200 shadow-sm">
                      <img src={receipt} alt={tr("Reçu", "الوصل")} className="w-full object-contain max-h-72" />
                      <button onClick={() => { setReceipt(null); setReceiptName(""); }} className="absolute top-2 end-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center"><X className="w-4 h-4 text-white" /></button>
                      <div className="absolute bottom-0 start-0 end-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                        <div className="flex items-center gap-2"><ImageIcon className="w-3.5 h-3.5 text-white" /><span className="text-white text-xs font-medium truncate">{receiptName || "receipt.jpg"}</span></div>
                      </div>
                    </div>
                    <button onClick={() => fileRef.current?.click()} className="w-full py-2 text-sm text-[#1B6B3A] font-semibold border border-[#1B6B3A]/30 rounded-2xl">{tr("Changer l'image", "تغيير الصورة")}</button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 inset-x-0 max-w-[430px] mx-auto bg-white border-t border-gray-100 px-4 pt-3 shadow-lg z-40" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 96px)" }}>
        {step === 1 && (
          <>
            {plan && <p className="text-center text-xs text-gray-500 mb-2">{tr("Formule choisie", "العرض المختار")}: <strong className="text-gray-800">{planName(plan)} — {plan.price.toLocaleString()} {t("da")}</strong></p>}
            <button onClick={() => setStep(2)} disabled={!selected} className="w-full py-4 bg-gradient-to-r from-[#1B6B3A] to-[#25924F] text-white rounded-2xl font-bold text-sm shadow-lg shadow-green-200 disabled:opacity-40 flex items-center justify-center gap-2">
              <Crown className="w-4 h-4" />{tr("Continuer vers le paiement", "المتابعة إلى الدفع")}
            </button>
          </>
        )}
        {step === 2 && (
          <button onClick={() => setStep(3)} className="w-full py-4 bg-gradient-to-r from-[#1B6B3A] to-[#25924F] text-white rounded-2xl font-bold text-sm shadow-lg shadow-green-200">
            {tr("J'ai effectué le virement →", "لقد أجريت التحويل ←")}
          </button>
        )}
        {step === 3 && (
          <>
            {submitError && <p className="text-xs text-red-500 font-medium text-center mb-2">{submitError}</p>}
            <button onClick={handleSubmit} disabled={!receipt || uploading || submitting} className="w-full py-4 bg-gradient-to-r from-[#1B6B3A] to-[#25924F] text-white rounded-2xl font-bold text-sm shadow-lg shadow-green-200 disabled:opacity-40 flex items-center justify-center gap-2">
              {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><CheckCheck className="w-4 h-4" />{tr("Soumettre la demande", "إرسال الطلب")}</>}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
