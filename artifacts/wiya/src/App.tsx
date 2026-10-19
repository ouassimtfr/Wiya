import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import { StoreProvider } from "@/lib/store";
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
import ResetPasswordPage from "@/pages/ResetPassword";
import LegalPage from "@/pages/Legal";
import PostListingPage from "@/pages/PostListing";
import SellerProfilePage from "@/pages/SellerProfile";
import BoostPage from "@/pages/Boost";
import SubscribePage from "@/pages/Subscribe";
import MapPage from "@/pages/MapPage";
import NotificationsPage from "@/pages/Notifications";
import AdminPage from "@/pages/Admin";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function AppShell() {
  return (
    <div className="max-w-[430px] mx-auto relative bg-background min-h-[100dvh] shadow-2xl overflow-x-hidden">
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/search" component={SearchPage} />
        <Route path="/listing/:id" component={ListingDetail} />
        <Route path="/messages" component={MessagesPage} />
        <Route path="/messages/:id" component={ChatPage} />
        <Route path="/favorites" component={FavoritesPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />
        <Route path="/legal/:page" component={LegalPage} />
        <Route path="/post" component={PostListingPage} />
        <Route path="/seller/:id" component={SellerProfilePage} />
        <Route path="/boost/:id" component={BoostPage} />
        <Route path="/subscribe" component={SubscribePage} />
        <Route path="/subscription" component={SubscribePage} />
        <Route path="/subscriptions" component={SubscribePage} />
        <Route path="/abonnement" component={SubscribePage} />
        <Route path="/abonnements" component={SubscribePage} />
        <Route path="/mes-abonnements" component={SubscribePage} />
        <Route path="/map" component={MapPage} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route path="/admin" component={AdminPage} />
        <Route component={NotFound} />
      </Switch>

      <Switch>
        <Route path="/auth" component={() => null} />
        <Route path="/reset-password" component={() => null} />
        <Route path="/messages/:id" component={() => null} />
        <Route path="/listing/:id" component={() => null} />
        <Route path="/map" component={() => null} />
        <Route path="/admin" component={() => null} />
        <Route component={BottomNav} />
      </Switch>

      <NotificationToast />
    </div>
  );
}

function App() {
  useEffect(() => {
    const { hash, search, pathname } = window.location;
    const isRecovery = hash.includes("type=recovery") || search.includes("type=recovery");
    if (isRecovery && !pathname.endsWith("/reset-password")) {
      window.location.replace(`/reset-password${search}${hash}`);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" && !window.location.pathname.endsWith("/reset-password")) {
        window.location.replace("/reset-password");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

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
