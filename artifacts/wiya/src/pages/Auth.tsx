import { useState } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";

type Mode = "login" | "register";

function GoogleLogo() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function translateError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email ou mot de passe incorrect.";
  if (m.includes("email not confirmed")) return "Confirmez d'abord votre adresse email (vérifiez votre boîte mail).";
  if (m.includes("user already registered")) return "Un compte existe déjà avec cet email.";
  if (m.includes("password should be at least")) return "Le mot de passe doit contenir au moins 6 caractères.";
  if (m.includes("unable to validate email")) return "Adresse email invalide.";
  if (m.includes("rate limit")) return "Trop de tentatives. Réessayez dans quelques minutes.";
  return message || "Une erreur est survenue";
}

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
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      if (mode === "login") {
        if (!email || !password) {
          setError("Veuillez remplir tous les champs");
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        navigate("/");
      } else {
        if (!name || !email || !password) {
          setError("Veuillez remplir tous les champs");
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name, phone },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;

        // Si la confirmation par email est activée, aucune session n'est créée tout de suite
        if (!data.session) {
          setInfo("Compte créé ! Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous.");
          setMode("login");
          setPassword("");
        } else {
          navigate("/");
        }
      }
    } catch (err: any) {
      setError(translateError(err?.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setInfo("");
    setSocialLoading("google");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
        // Force l'écran « choisir un compte » au lieu de se connecter à un compte au hasard
        queryParams: { prompt: "select_account" },
      },
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
              onClick={() => {
                setMode(m);
                setError("");
              }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all
                ${mode === m ? "bg-white text-[#1B6B3A] shadow-sm" : "text-gray-500"}`}
            >
              {m === "login" ? t("login") : t("register")}
            </button>
          ))}
        </div>

        <div className="mb-5">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={socialLoading !== null}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-white border-2 border-gray-200 rounded-2xl text-sm font-bold text-gray-700 shadow-sm disabled:opacity-50"
          >
            <GoogleLogo />
            {socialLoading === "google" ? "Redirection..." : "Continuer avec Google"}
          </button>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">ou</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <AnimatePresence mode="wait">
          <motion.form key={mode} onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{t("name")}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Karim Benali"
                  autoComplete="name"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-base outline-none focus:border-[#1B6B3A]"
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
                autoComplete="email"
                autoCapitalize="none"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-base outline-none focus:border-[#1B6B3A]"
              />
            </div>
            {mode === "register" && (
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{t("phone")}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="06 XX XX XX XX"
                  autoComplete="tel"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-base outline-none focus:border-[#1B6B3A]"
                />
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
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-base outline-none focus:border-[#1B6B3A]"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
            {info && <p className="text-xs text-[#1B6B3A] font-medium">{info}</p>}
            <button type="submit" disabled={loading} className="w-full py-4 bg-[#1B6B3A] text-white rounded-2xl font-bold text-sm shadow-lg disabled:opacity-60">
              {loading ? "Chargement..." : mode === "login" ? t("login") : t("register")}
            </button>
          </motion.form>
        </AnimatePresence>
      </div>
    </div>
  );
}
