import { useState } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";

type Mode = "login" | "register";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { t } = useI18n();

  const [mode, setMode] = useState<Mode>("login");
  const [showPass, setShowPass] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        if (!name || !email || !password) {
          setError("Veuillez remplir tous les champs");
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name, phone } }
        });
        if (error) throw error;
      }
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSocialLoading("google");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) {
      setError("Erreur connexion Google.");
      setSocialLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-[#1B6B3A] pt-12 pb-10 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#C8972B]" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white" />
        </div>
        <div className="relative">
          <button onClick={() => navigate("/")} className="mb-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/20">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-white text-3xl font-black">
              <span className="text-[#E8C84A]">W</span>iya
            </h1>
          </div>
          <p className="text-green-200 text-sm">{t("tagline")}</p>
        </div>
      </div>

      <div className="flex-1 px-5 pt-6 pb-8">
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
          {(["login", "register"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all
                ${mode === m ? "bg-white text-[#1B6B3A] shadow-sm" : "text-gray-500"}`}
            >
              {m === "login" ? t("login") : t("register")}
            </button>
          ))}
        </div>

        <div className="mb-5">
          <button type="button" onClick={handleGoogleLogin} disabled={socialLoading !== null} className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border-2 border-gray-200 rounded-2xl text-sm font-bold text-gray-700 shadow-sm disabled:opacity-50">
            Google
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.form key={mode} onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{t("name")}</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Karim Benali" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-[#1B6B3A]" />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{t("email")}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="exemple@email.com" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-[#1B6B3A]" />
            </div>
            {mode === "register" && (
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{t("phone")}</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06 XX XX XX XX" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-[#1B6B3A]" />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{t("password")}</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-[#1B6B3A]" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
            <button type="submit" disabled={loading} className="w-full py-4 bg-[#1B6B3A] text-white rounded-2xl font-bold text-sm shadow-lg">
              {loading ? "Chargement..." : mode === "login" ? t("login") : t("register")}
            </button>
          </motion.form>
        </AnimatePresence>
      </div>
    </div>
  );
}
