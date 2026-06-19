import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallBanner() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const standalone = window.matchMedia("(display-mode: standalone)").matches;

    if (standalone) return;

    if (ios) {
      setIsIOS(true);
      setShow(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-green-700 text-white rounded-xl p-4 shadow-lg z-50 flex items-start gap-3">
      <span className="text-2xl">📲</span>
      <div className="flex-1">
        <p className="font-semibold text-sm">Installe Wiya sur ton téléphone</p>
        {isIOS ? (
          <p className="text-xs mt-1 opacity-90">
            Appuie sur <span className="font-bold">⬆️ Partager</span> puis{" "}
            <span className="font-bold">"Sur l'écran d'accueil"</span>
          </p>
        ) : (
          <button
            onClick={handleAndroidInstall}
            className="text-xs mt-2 bg-white text-green-700 font-bold px-3 py-1 rounded-full"
          >
            Installer maintenant
          </button>
        )}
      </div>
      <button onClick={() => setShow(false)} className="text-white text-lg font-bold">✕</button>
    </div>
  );
}
