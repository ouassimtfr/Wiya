import { useState } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";

type Mode = "login" | "register";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { t } = useI18n();
  const { login, register } = useStore();

  const [mode, setMode] = useState<Mode>("login");
  const [showPass, setShowPass] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "facebook" | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "login") {
      const success = await login(email, password);
      if (!success) setError("Email ou mot de passe incorrect");
      else navigate("/");
    } else {
      if (!name || !email || !password) {
        setError("Veuillez remplir tous les champs");
        setLoading(false);
        return;
      }
      await register(name, email, password, phone);
      navigate("/");
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setSocialLoading("google");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      setError("Erreur connexion Google. Réessaie.");
      setSocialLoading(null);
    }
  };

  const handleFacebookLogin = async () => {
    setSocialLoading("facebook");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      setError("Erreur connexion Facebook. Réessaie.");
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

        {/* Boutons sociaux EN HAUT */}
        <div className="flex gap-3 mb-5">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={socialLoading !== null}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white border-2 border-gray-200 rounded-2xl text-sm font-bold text-gray-700 shadow-sm active:bg-gray-50 disabled:opacity-50"
          >
            {socialLoading === "google" ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Google
          </button>
          <button
            type="button"
            onClick={handleFacebookLogin}
            disabled={socialLoading !== null}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#1877F2] rounded-2xl text-sm font-bold text-white shadow-sm active:bg-[#1565D8] disabled:opacity-50"
          >
            {socialLoading === "facebook" ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            )}
            Facebook
          </button>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400">{t("orContinueWith")}</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {mode === "register" && (
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{t("name")}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Karim Benali"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-[#1B6B3A] transition-colors"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{t("email")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@email.com"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-[#1B6B3A] transition-colors"
              />
            </div>

            {mode === "register" && (
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{t("phone")}</label>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-3.5">
                    <span className="text-base">🇩🇿</span>
                    <span className="text-sm text-gray-600">+213</span>
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="06 XX XX XX XX"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-[#1B6B3A] transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{t("password")}</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-[#1B6B3A] transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === "login" && (
              <button type="button" className="text-xs text-[#1B6B3A] font-semibold">
                {t("forgotPassword")}
              </button>
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-500 font-medium bg-red-50 px-3 py-2 rounded-xl"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#1B6B3A] text-white rounded-2xl font-bold text-sm shadow-lg shadow-green-200 mt-2 disabled:opacity-50"
            >
              {loading ? "Chargement..." : mode === "login" ? t("login") : t("register")}
            </button>
          </motion.form>
        </AnimatePresence>

        <p className="text-center text-xs text-gray-400 mt-6">
          {mode === "login" ? t("dontHaveAccount") : t("alreadyHaveAccount")}{" "}
          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-[#1B6B3A] font-bold"
          >
            {mode === "login" ? t("register") : t("login")}
          </button>
        </p>
      </div>
    </div>
  );
}
