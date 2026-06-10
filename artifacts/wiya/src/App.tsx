import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import { StoreProvider } from "@/lib/store";
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
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function AppShell() {
  return (
    <div className="max-w-[430px] mx-auto relative bg-[#F4F6F5] min-h-screen shadow-2xl overflow-x-hidden">
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
        <Route component={NotFound} />
      </Switch>

      {/* Hide bottom nav on auth and chat pages */}
      <Switch>
        <Route path="/auth" component={() => null} />
        <Route path="/messages/:id" component={() => null} />
        <Route component={BottomNav} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <StoreProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AppShell />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </StoreProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
