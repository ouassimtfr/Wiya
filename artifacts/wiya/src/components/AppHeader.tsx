import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Props {
  title?: string;
  showBack?: boolean;
  right?: React.ReactNode;
  transparent?: boolean;
}

export default function AppHeader({ title, showBack = false, right, transparent = false }: Props) {
  const { isRTL } = useI18n();

  return (
    <header
      className={`sticky top-0 z-40 flex items-center gap-3 px-4 pt-[env(safe-area-inset-top)] h-[calc(3.5rem+env(safe-area-inset-top))]
        ${transparent ? "bg-transparent" : "bg-background/85 backdrop-blur-xl border-b border-border/60"}`}
    >
      {showBack && (
        <button
          onClick={() => window.history.back()}
          aria-label="Retour"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-card ring-1 ring-border/70 shadow-sm active:scale-95 transition-transform"
        >
          <ArrowLeft className={`w-5 h-5 text-foreground ${isRTL ? "rotate-180" : ""}`} />
        </button>
      )}
      {title && (
        <h1 className="flex-1 font-display text-[19px] font-extrabold text-foreground truncate">{title}</h1>
      )}
      {right && <div className="ms-auto">{right}</div>}
    </header>
  );
}
