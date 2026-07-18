import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import { StoreProvider, useStore } from "@/lib/store";
import { NotificationsProvider } from "@/lib/notifications";
import { ThemeProvider } from "@/lib/theme";
import { supabase } from "@/lib/supabase";
import NotificationToast from "@/components/NotificationToast";
import BottomNav from "@/components/BottomNav";
// ... (tes autres imports de pages restent identiques)

const queryClient = new QueryClient();

function AppShell() {
  const { logout } = useStore();

  useEffect(() => {
    // Calcul de la hauteur réelle du viewport pour mobile
    const setRealVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    window.addEventListener('resize', setRealVh);
    setRealVh();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) logout();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) logout();
    });

    return () => {
      window.removeEventListener('resize', setRealVh);
      subscription.unsubscribe();
    };
  }, [logout]);

  return (
    /* 
       h-[calc(var(--vh,1vh)*100)] : Utilise la hauteur calculée par le script (plus fiable que 100vh)
       pb-[calc(4rem+env(safe-area-inset-bottom))] : Espace dynamique en bas
    */
    <div className="max-w-[430px] mx-auto relative bg-[#F4F6F5] h-[calc(var(--vh,1vh)*100)] pb-[calc(4rem+env(safe-area-inset-bottom))] shadow-2xl overflow-x-hidden">
      
      <div className="h-full overflow-y-auto pb-10">
        <Switch>
          <Route path="/" component={Home} />
          {/* ... tes autres routes ... */}
          <Route path="/profile" component={ProfilePage} />
          <Route component={NotFound} />
        </Switch>
      </div>

      {/* Barre de navigation fixée */}
      <div className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-[430px] z-[9999] bg-[#F4F6F5] pb-[env(safe-area-inset-bottom)] border-t border-gray-200">
        <Switch>
          <Route path="/auth" component={() => null} />
          <Route path="/admin" component={() => null} />
          <Route component={BottomNav} />
        </Switch>
      </div>

      <NotificationToast />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <StoreProvider>
            <NotificationsProvider>
              <TooltipProvider>
                <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                  <AppShell />
                </WouterRouter>
                <Toaster />
              </TooltipProvider>
            </NotificationsProvider>
          </StoreProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
