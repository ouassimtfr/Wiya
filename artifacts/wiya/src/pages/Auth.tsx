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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError("Email ou mot de passe incorrect");
      else navigate("/");
    } else {
      if (!name || !email || !password) {
        setError("Veuillez remplir tous les champs");
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, phone } }
      });
      if (error) setError(error.message);
      else navigate("/");
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
              className="w-full py-4 bg-[#1B6B3A] text-white rounded-2xl font-bold text-sm shadow-lg shadow-green-200 mt-2"
            >
              {mode === "login" ? t("login") : t("register")}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">{t("orContinueWith")}</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <div className="flex gap-3">
              {[
                { icon: "📱", label: "Google" },
                { icon: "📘", label: "Facebook" },
              ].map((s) => (
                <button
                  key={s.label}
                  type="button"
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-600"
                >
                  <span>{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
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
