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
      className={`sticky top-0 z-40 flex items-center gap-3 px-4 h-14
        ${transparent ? "bg-transparent" : "bg-card/90 backdrop-blur-md border-b border-border"}`}
    >
      {showBack && (
        <button
          onClick={() => window.history.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-muted active:scale-95 transition-transform"
        >
          <ArrowLeft className={`w-5 h-5 text-foreground ${isRTL ? "rotate-180" : ""}`} />
        </button>
      )}
      {title && (
        <h1 className="flex-1 text-lg font-bold text-foreground truncate">{title}</h1>
      )}
      {right && <div className="ms-auto">{right}</div>}
    </header>
  );
}
