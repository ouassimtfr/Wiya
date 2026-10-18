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
  const [linkError, setLinkError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  // Le lien reçu par email ouvre cette page. Selon la configuration, il contient un « code »,
  // un « token_hash » ou des jetons dans l'adresse : on gère les trois, puis on vérifie la session.
  useEffect(() => {
    let cancelled = false;
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const queryParams = new URLSearchParams(window.location.search);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" && !cancelled) {
        setReady(true);
        setChecked(true);
      }
    });

    const run = async () => {
      const urlError = hashParams.get("error_description") || queryParams.get("error_description");
      if (urlError) {
        if (!cancelled) {
          setLinkError(urlError.replace(/\+/g, " "));
          setChecked(true);
        }
        return;
      }

      try {
        const code = queryParams.get("code");
        const tokenHash = queryParams.get("token_hash");
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
          if (error) throw error;
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        }
      } catch (err: any) {
        // Le client a peut-être déjà traité le lien tout seul : on vérifie la session juste après
        console.error("Lien de récupération :", err);
        if (!cancelled && err?.message) setLinkError(err.message);
      }

      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        setReady(true);
        setLinkError("");
      }
      setChecked(true);
      // Efface les jetons de la barre d'adresse
      try {
        window.history.replaceState(null, "", window.location.pathname);
      } catch {}
    };

    run();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const translateError = (message: string): string => {
    const m = message.toLowerCase();
    if (m.includes("different from the old"))
      return tr("Choisissez un mot de passe différent de l'ancien.", "اختر كلمة مرور مختلفة عن القديمة.");
    if (m.includes("at least"))
      return tr("Le mot de passe doit contenir au moins 6 caractères.", "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.");
    if (m.includes("session"))
      return tr("Le lien a expiré. Demandez-en un nouveau.", "انتهت صلاحية الرابط. اطلب رابطا جديدا.");
    return message;
  };

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
      setError(translateError(error.message));
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
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {tr(
              "Un lien ne marche qu'une seule fois. Demandez-en un nouveau et ouvrez-le dans le même navigateur (Safari ou Chrome) que celui où vous avez fait la demande.",
              "الرابط يعمل مرة واحدة فقط. اطلب رابطا جديدا وافتحه في نفس المتصفح (Safari أو Chrome) الذي طلبته منه."
            )}
          </p>
          {linkError && (
            <p className="text-[11px] text-muted-foreground/70 mt-3 break-words" dir="ltr">{linkError}</p>
          )}
          <button
            onClick={() => navigate("/auth")}
            className="mt-5 px-8 py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-sm"
          >
            {tr("Demander un nouveau lien", "طلب رابط جديد")}
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
