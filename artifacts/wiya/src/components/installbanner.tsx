import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallBanner() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    
    if (isStandalone) return;

    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    
    if (ios) {
      setIsIOS(true);
      setShow(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    setDeferredPrompt(null);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
      borderTop: "1px solid rgba(255,255,255,0.1)",
      padding: "14px 16px",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      boxShadow: "0 -4px 20px rgba(0,0,0,0.4)",
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: "linear-gradient(135deg, #6c63ff, #48cfad)",
        display: "flex", alignItems: "center",
        justifyContent: "center", flexShrink: 0, fontSize: 22,
      }}>🛍️</div>

      <div style={{ flex: 1 }}>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>
          Installe Wiya sur ton téléphone
        </div>
        {isIOS && (
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 }}>
            Appuie sur <strong style={{ color: "#fff" }}>⬆️</strong> puis <strong style={{ color: "#fff" }}>"Sur l'écran d'accueil"</strong>
          </div>
        )}
        {!isIOS && (
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 }}>
            Accès rapide sans navigateur
          </div>
        )}
      </div>

      {!isIOS && deferredPrompt && (
        <button onClick={handleInstall} style={{
          background: "linear-gradient(135deg, #6c63ff, #48cfad)",
          color: "#fff", border: "none", borderRadius: 8,
          padding: "8px 14px", fontSize: 13, fontWeight: 700,
          cursor: "pointer", flexShrink: 0,
        }}>Installer</button>
      )}

      <button onClick={() => setShow(false)} style={{
        background: "transparent", border: "none",
        color: "rgba(255,255,255,0.5)", fontSize: 24,
        cursor: "pointer", flexShrink: 0, padding: "0 4px",
      }}>×</button>
    </div>
  );
}
