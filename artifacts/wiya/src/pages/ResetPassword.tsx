import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const { isRTL } = useI18n();
  const tr = (fr: string, ar: string) => (isRTL ? ar : fr);

  const [ready, setReady] = useState(false);
  const [checked, setChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  // Le lien reçu par email ouvre cette page : Supabase crée une session de récupération
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const timer = setTimeout(() => setChecked(true), 2500);
    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError(tr("Le mot de passe doit contenir au moins 6 caractères.", "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل."));
      return;
    }
    if (password !== confirm) {
      setError(tr("Les deux mots de passe ne sont pas identiques.", "كلمتا المرور غير متطابقتين."));
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => navigate("/"), 1800);
  };

  const inputClass =
    "w-full bg-muted rounded-2xl px-4 py-3.5 text-base text-foreground outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <div className="min-h-[100dvh] bg-card flex flex-col justify-center px-5 py-10">
      <h1 dir="ltr" className="font-display text-[36px] font-extrabold tracking-tight text-center text-foreground">
        Wiya<span className="text-primary">.</span>
      </h1>

      {done ? (
        <div className="text-center mt-8">
          <p className="font-display text-[20px] font-extrabold text-foreground">
            {tr("Mot de passe modifié !", "تم تغيير كلمة المرور!")}
          </p>
          <p className="text-sm text-muted-foreground mt-1">{tr("Redirection...", "جاري التحويل...")}</p>
        </div>
      ) : ready ? (
        <form onSubmit={handleSubmit} className="space-y-4 mt-8">
          <h2 className="font-display text-[22px] font-extrabold text-foreground">
            {tr("Nouveau mot de passe", "كلمة مرور جديدة")}
          </h2>
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={tr("Nouveau mot de passe", "كلمة المرور الجديدة")}
              autoComplete="new-password"
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
          <input
            type={showPass ? "text" : "password"}
            dir="ltr"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={tr("Répétez le mot de passe", "أعد كتابة كلمة المرور")}
            autoComplete="new-password"
            className={inputClass}
          />
          {error && <p className="text-xs text-destructive font-medium">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-md disabled:opacity-60"
          >
            {loading ? tr("Chargement...", "جاري التحميل...") : tr("Enregistrer", "حفظ")}
          </button>
        </form>
      ) : checked ? (
        <div className="text-center mt-8">
          <p className="font-display text-[20px] font-extrabold text-foreground">
            {tr("Lien invalide ou expiré", "الرابط غير صالح أو منتهي")}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {tr("Demandez un nouveau lien depuis la page de connexion.", "اطلب رابطا جديدا من صفحة تسجيل الدخول.")}
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="mt-5 px-8 py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-sm"
          >
            {tr("Retour à la connexion", "العودة إلى تسجيل الدخول")}
          </button>
        </div>
      ) : (
        <div className="flex justify-center mt-10">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
