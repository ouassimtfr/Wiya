import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Zap, Check, ArrowLeft, Star, TrendingUp, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { LISTINGS } from "@/lib/data";

type BoostPlan = "basic7" | "basic30" | "premium7" | "premium30";

const PLANS: { id: BoostPlan; days: number; price: number; type: "basic" | "premium"; popular?: boolean }[] = [
  { id: "basic7", days: 7, price: 500, type: "basic" },
  { id: "basic30", days: 30, price: 1500, type: "basic", popular: true },
  { id: "premium7", days: 7, price: 1200, type: "premium" },
  { id: "premium30", days: 30, price: 3500, type: "premium", popular: false },
];

export default function BoostPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { t, isRTL } = useI18n();
  const [selected, setSelected] = useState<BoostPlan | null>(null);
  const [paid, setPaid] = useState(false);

  const listing = LISTINGS.find((l) => l.id === params.id) ?? LISTINGS[0];

  const handlePay = () => {
    if (!selected) return;
    setPaid(true);
    setTimeout(() => navigate("/profile"), 2500);
  };

  if (paid) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-[#1B6B3A] flex flex-col items-center justify-center px-8 text-center gap-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
          className="w-20 h-20 bg-[#C8972B] rounded-full flex items-center justify-center shadow-xl"
        >
          <Zap className="w-10 h-10 text-white fill-white" />
        </motion.div>
        <h2 className="text-white text-xl font-black">Annonce boostée !</h2>
        <p className="text-green-200 text-sm">Votre annonce a plus de visibilité maintenant 🚀</p>
      </motion.div>
    );
  }

  return (
    <div className="bg-[#F4F6F5] min-h-screen pb-28">
      {/* Header */}
      <div className="bg-[#1B6B3A] pt-12 pb-6 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -bottom-4 right-4 w-32 h-32 rounded-full bg-[#C8972B]" />
        </div>
        <div className="relative">
          <button onClick={() => window.history.back()} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 mb-4">
            <ArrowLeft className={`w-4.5 h-4.5 text-white ${isRTL ? "rotate-180" : ""}`} />
          </button>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#E8C84A] fill-[#E8C84A]" />
            <h1 className="text-white font-black text-lg">{t("boostTitle")}</h1>
          </div>
          <p className="text-green-200 text-sm mt-1">{t("boostDesc")}</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Listing preview */}
        <div className="bg-white rounded-2xl p-3 flex items-center gap-3 shadow-sm">
          <img src={listing.images[0]} alt="" className="w-14 h-14 rounded-xl object-cover" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{listing.title}</p>
            <p className="text-sm font-bold text-[#1B6B3A]">{listing.price.toLocaleString()} DA</p>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Eye, label: "+5x vues", color: "bg-blue-50 text-blue-600" },
            { icon: TrendingUp, label: "Top résultats", color: "bg-green-50 text-[#1B6B3A]" },
            { icon: Star, label: "Badge vedette", color: "bg-amber-50 text-[#C8972B]" },
          ].map((b) => (
            <div key={b.label} className={`${b.color.split(" ")[0]} rounded-2xl p-3 text-center`}>
              <b.icon className={`w-5 h-5 ${b.color.split(" ")[1]} mx-auto mb-1`} />
              <p className={`text-[11px] font-bold ${b.color.split(" ")[1]}`}>{b.label}</p>
            </div>
          ))}
        </div>

        {/* Plans */}
        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-3">Choisissez un plan</h3>
          <div className="space-y-2.5">
            {/* Basic */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">{t("basicBoost")} — {t("basicBoostDesc")}</p>
              </div>
              <div className="flex gap-2 p-3">
                {PLANS.filter((p) => p.type === "basic").map((plan) => (
                  <motion.button
                    key={plan.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelected(plan.id)}
                    className={`flex-1 p-3 rounded-2xl border-2 transition-all relative
                      ${selected === plan.id ? "border-[#1B6B3A] bg-green-50" : "border-gray-100"}`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#C8972B] text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                        ⭐ Populaire
                      </span>
                    )}
                    <p className="text-lg font-black text-gray-900">{plan.days}j</p>
                    <p className="text-sm font-bold text-[#1B6B3A]">{plan.price} DA</p>
                    <p className="text-[10px] text-gray-400">{Math.round(plan.price / plan.days)} DA{t("perDay")}</p>
                    {selected === plan.id && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-[#1B6B3A] rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Premium */}
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl shadow-sm overflow-hidden border border-[#C8972B]/20">
              <div className="px-4 py-2 bg-[#C8972B]/10 border-b border-[#C8972B]/20 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#C8972B] fill-[#C8972B]" />
                <p className="text-xs font-bold text-[#C8972B] uppercase tracking-wide">{t("premiumBoost")} — {t("premiumBoostDesc")}</p>
              </div>
              <div className="flex gap-2 p-3">
                {PLANS.filter((p) => p.type === "premium").map((plan) => (
                  <motion.button
                    key={plan.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelected(plan.id)}
                    className={`flex-1 p-3 rounded-2xl border-2 transition-all relative
                      ${selected === plan.id ? "border-[#C8972B] bg-amber-100/60" : "border-[#C8972B]/20 bg-white/60"}`}
                  >
                    <p className="text-lg font-black text-gray-900">{plan.days}j</p>
                    <p className="text-sm font-bold text-[#C8972B]">{plan.price} DA</p>
                    <p className="text-[10px] text-gray-400">{Math.round(plan.price / plan.days)} DA{t("perDay")}</p>
                    {selected === plan.id && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-[#C8972B] rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pay button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3">
        {selected && (
          <p className="text-center text-xs text-gray-500 mb-2">
            Plan sélectionné: <strong className="text-gray-800">{PLANS.find(p => p.id === selected)?.price} DA</strong>
          </p>
        )}
        <button
          onClick={handlePay}
          disabled={!selected}
          className="w-full py-4 bg-gradient-to-r from-[#1B6B3A] to-[#25924F] text-white rounded-2xl font-bold text-sm shadow-lg shadow-green-200 disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4 fill-white" />
          {t("chooseBoost")}
        </button>
      </div>
    </div>
  );
}
