import { ArrowLeft, MoreVertical } from "lucide-react";
import { useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";

interface Props {
  title?: string;
  showBack?: boolean;
  right?: React.ReactNode;
  transparent?: boolean;
}

export default function AppHeader({ title, showBack = false, right, transparent = false }: Props) {
  const [, navigate] = useLocation();
  const { isRTL } = useI18n();

  return (
    <header
      className={`sticky top-0 z-40 flex items-center gap-3 px-4 h-14
        ${transparent ? "bg-transparent" : "bg-white border-b border-gray-100 shadow-sm"}`}
    >
      {showBack && (
        <button
          onClick={() => window.history.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
        >
          <ArrowLeft className={`w-5 h-5 text-gray-700 ${isRTL ? "rotate-180" : ""}`} />
        </button>
      )}
      {title && (
        <h1 className="flex-1 text-base font-bold text-gray-900 truncate">{title}</h1>
      )}
      {right && <div className="ms-auto">{right}</div>}
    </header>
  );
}
