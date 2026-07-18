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
import Home from "@/pages/Home";
import SearchPage from "@/pages/Search";
import ListingDetail from "@/pages/ListingDetail";
import MessagesPage from "@/pages/Messages";
import ChatPage from "@/pages/Chat";
import FavoritesPage from "@/pages/Favorites";
import ProfilePage from "@/pages/Profile";
import AuthPage from "@/pages/Auth";
import PostListingPage from "@/pages/PostListing";
import SellerProfilePage from "@/pages/SellerProfile";
import BoostPage from "@/pages/Boost";
import MapPage from "@/pages/MapPage";
import NotificationsPage from "@/pages/Notifications";
import AdminPage from "@/pages/Admin";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function AppShell() {
  const { logout } = useStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) logout();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) logout();
    });

    return () => subscription.unsubscribe();
  }, [logout]);

  return (
    <div className="max-w-[430px] mx-auto relative bg-[#F4F6F5] min-h-[100dvh] pb-[calc(6rem+env(safe-area-inset-bottom))] shadow-2xl overflow-x-hidden">
      {/* Contenu principal */}
      <div className="pb-4">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/search" component={SearchPage} />
          <Route path="/listing/:id" component={ListingDetail} />
          <Route path="/messages" component={MessagesPage} />
          <Route path="/messages/:id" component={ChatPage} />
          <Route path="/favorites" component={FavoritesPage} />
          <Route path="/profile" component={ProfilePage} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/post" component={PostListingPage} />
          <Route path="/seller/:id" component={SellerProfilePage} />
          <Route path="/boost/:id" component={BoostPage} />
          <Route path="/map" component={MapPage} />
          <Route path="/notifications" component={NotificationsPage} />
          <Route path="/admin" component={AdminPage} />
          <Route component={NotFound} />
        </Switch>
      </div>

      {/* Barre de navigation fixée avec support pour le safe area */}
      <div className="fixed bottom-0 w-full max-w-[430px] z-[9999] bg-[#F4F6F5] pb-[env(safe-area-inset-bottom)] border-t border-gray-100">
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
