import { useState } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";

type Mode = "login" | "register" | "forgot";

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

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { t, isRTL } = useI18n();
  const tr = (fr: string, ar: string) => (isRTL ? ar : fr);

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

  const translateError = (message: string): string => {
    const m = message.toLowerCase();
    if (m.includes("invalid login credentials"))
      return tr("Email ou mot de passe incorrect.", "البريد الإلكتروني أو كلمة المرور غير صحيحة.");
    if (m.includes("email not confirmed"))
      return tr(
        "Confirmez d'abord votre adresse email (vérifiez votre boîte mail).",
        "يرجى تأكيد بريدك الإلكتروني أولا (تحقق من صندوق الوارد)."
      );
    if (m.includes("user already registered"))
      return tr("Un compte existe déjà avec cet email.", "يوجد حساب بهذا البريد الإلكتروني بالفعل.");
    if (m.includes("password should be at least"))
      return tr(
        "Le mot de passe doit contenir au moins 6 caractères.",
        "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل."
      );
    if (m.includes("unable to validate email"))
      return tr("Adresse email invalide.", "عنوان البريد الإلكتروني غير صالح.");
    if (m.includes("rate limit"))
      return tr(
        "Trop de tentatives. Réessayez dans quelques minutes.",
        "محاولات كثيرة. أعد المحاولة بعد دقائق."
      );
    return message || tr("Une erreur est survenue", "حدث خطأ");
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
    setInfo("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      if (mode === "forgot") {
        if (!email.trim()) {
          setError(tr("Entrez votre adresse email.", "أدخل بريدك الإلكتروني."));
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setInfo(
          tr(
            "Si un compte existe avec cet email, vous allez recevoir un lien pour choisir un nouveau mot de passe. Pensez à regarder dans les spams.",
            "إذا كان هناك حساب بهذا البريد، سيصلك رابط لاختيار كلمة مرور جديدة. تحقق أيضا من الرسائل غير المرغوب فيها."
          )
        );
      } else if (mode === "login") {
        if (!email || !password) {
          setError(tr("Veuillez remplir tous les champs", "يرجى ملء جميع الحقول"));
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
          setError(tr("Veuillez remplir tous les champs", "يرجى ملء جميع الحقول"));
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
          setInfo(
            tr(
              "Compte créé ! Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous.",
              "تم إنشاء الحساب! تحقق من بريدك الإلكتروني لتأكيد العنوان، ثم سجّل الدخول."
            )
          );
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
      setError(tr("Erreur connexion Google.", "خطأ في الاتصال عبر Google."));
      setSocialLoading(null);
    }
  };

  const inputClass =
    "w-full bg-muted rounded-2xl px-4 py-3.5 text-base text-foreground outline-none focus:ring-2 focus:ring-primary/40";
  const labelClass = "text-xs font-bold text-muted-foreground mb-1.5 block";

  return (
    <div className="min-h-[100dvh] bg-card flex flex-col px-5 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <button
        onClick={() => (mode === "forgot" ? switchMode("login") : navigate("/"))}
        aria-label="Retour"
        className="w-10 h-10 rounded-full bg-muted flex items-center justify-center active:scale-95 transition-transform"
      >
        <ArrowLeft className={`w-5 h-5 text-foreground ${isRTL ? "rotate-180" : ""}`} />
      </button>

      <div className="text-center mt-6 mb-7">
        <h1 dir="ltr" className="font-display text-[40px] font-extrabold tracking-tight leading-none text-foreground">
          Wiya<span className="text-primary">.</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-2">{t("tagline")}</p>
      </div>

      {mode !== "forgot" && (
        <>
          <div className="flex bg-muted rounded-2xl p-1 mb-5">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                {m === "login" ? t("login") : t("register")}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={socialLoading !== null}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-white border border-gray-300 rounded-2xl text-sm font-bold text-gray-800 shadow-sm disabled:opacity-50 active:scale-[0.99] transition-transform"
          >
            <GoogleLogo />
            {socialLoading === "google"
              ? tr("Redirection...", "جاري التحويل...")
              : tr("Continuer avec Google", "المتابعة عبر Google")}
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">{tr("ou", "أو")}</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        </>
      )}

      {mode === "forgot" && (
        <div className="mb-5">
          <h2 className="font-display text-[22px] font-extrabold text-foreground">
            {tr("Mot de passe oublié ?", "نسيت كلمة المرور؟")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            {tr(
              "Entrez votre email : nous vous envoyons un lien pour choisir un nouveau mot de passe.",
              "أدخل بريدك الإلكتروني: سنرسل لك رابطا لاختيار كلمة مرور جديدة."
            )}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <div>
            <label className={labelClass}>{t("name")}</label>
            <input
              type="text"
              dir="auto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tr("Karim Benali", "كريم بن علي")}
              autoComplete="name"
              className={inputClass}
            />
          </div>
        )}

        <div>
          <label className={labelClass}>{t("email")}</label>
          <input
            type="email"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="exemple@email.com"
            autoComplete="email"
            autoCapitalize="none"
            className={inputClass}
          />
        </div>

        {mode === "register" && (
          <div>
            <label className={labelClass}>{t("phone")}</label>
            <input
              type="tel"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="06 XX XX XX XX"
              autoComplete="tel"
              className={inputClass}
            />
          </div>
        )}

        {mode !== "forgot" && (
          <div>
            <label className={labelClass}>{t("password")}</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                aria-label="Afficher le mot de passe"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {mode === "login" && (
              <button
                type="button"
                onClick={() => switchMode("forgot")}
                className="mt-2 text-[13px] font-bold text-primary"
              >
                {tr("Mot de passe oublié ?", "نسيت كلمة المرور؟")}
              </button>
            )}
          </div>
        )}

        {error && <p className="text-xs text-destructive font-medium">{error}</p>}
        {info && <p className="text-[13px] text-primary font-semibold leading-snug">{info}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-md disabled:opacity-60 active:scale-[0.99] transition-transform"
        >
          {loading
            ? tr("Chargement...", "جاري التحميل...")
            : mode === "forgot"
            ? tr("Envoyer le lien", "إرسال الرابط")
            : mode === "login"
            ? t("login")
            : t("register")}
        </button>

        {mode === "forgot" && (
          <button type="button" onClick={() => switchMode("login")} className="w-full text-center text-sm font-bold text-muted-foreground">
            {tr("Retour à la connexion", "العودة إلى تسجيل الدخول")}
          </button>
        )}
      </form>

      <p className="text-[12px] text-muted-foreground text-center leading-relaxed mt-8">
        {tr("En continuant, vous acceptez nos ", "بالمتابعة، فإنك توافق على ")}
        <button onClick={() => navigate("/legal/terms")} className="font-bold text-foreground underline">
          {tr("Conditions d'utilisation", "شروط الاستخدام")}
        </button>
        {tr(" et notre ", " و")}
        <button onClick={() => navigate("/legal/privacy")} className="font-bold text-foreground underline">
          {tr("Politique de confidentialité", "سياسة الخصوصية")}
        </button>
        .
      </p>
    </div>
  );
}
