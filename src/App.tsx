import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import SocialFeed from "@/pages/SocialFeed";
import ClientProfile from "@/pages/ClientProfile";
import DemandsFeed from "@/pages/DemandsFeed";
import ProviderProfile from "@/pages/ProviderProfile";
import AuthPage from "@/pages/auth-page";
import Messages from "@/pages/Messages";
import ServicePage from "@/pages/ServicePage";
import LandingLayout from "@/components/layouts/LandingLayout";
import ApplicationLayout from "@/components/layouts/ApplicationLayout";
import ServicesFeed from "@/pages/ServicesFeed.tsx";
import Profile from "@/pages/Profile";

const LANDING_ROUTES = ["/", "/auth"];

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/profile" component={Profile} />
      <Route path="/home" component={SocialFeed} />
      <Route path="/home/demands" component={DemandsFeed} />
      <Route path="/home/viewService" component={ServicePage} />
      <Route path="/home/services" component={ServicesFeed} />
      <Route path="/providers/:provider_id" component={ProviderProfile} />
      <Route path="/user/:user_id" component={ClientProfile} />
      <Route path="/messages/:userId?" component={Messages} />
      <Route component={NotFound} />
    </Switch>
  );
}
function AppContent() {
  const [location, navigate] = useLocation();
  const { isLoggedIn, isInitialized } = useAuth();

  const isPublic = LANDING_ROUTES.includes(location);
  const isLandingPage = isPublic;
  const Layout = isLandingPage ? LandingLayout : (ApplicationLayout as any);

  useEffect(() => {
    if (!isInitialized) return;

    if (!isLoggedIn && !isPublic) {
      navigate("/auth");
    }
  }, [isInitialized, isLoggedIn, isPublic, navigate]);

  useEffect(() => {
    sessionStorage.setItem("last_route", location);
  }, [location]);

  return (
    <Layout>
      <Router />
    </Layout>
  );
}
function App() {
    return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
