import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import SocialFeed from "@/pages/SocialFeed";
import ClientProfile from "@/pages/ClientProfile";
import Marketplace from "@/pages/Marketplace";
import DemandsFeed from "@/pages/DemandsFeed";
import ProviderProfile from "@/pages/ProviderProfile";
import SearchResults from "@/pages/SearchResults";
import AuthPage from "@/pages/auth-page";
import AdminDashboard from "@/pages/AdminDashboard";
import Messages from "@/pages/Messages";
import TestAuth from "@/pages/TestAuth";
import AdminBootstrap from "@/pages/AdminBootstrap";
import ServicePage from "@/pages/ServicePage";
import LandingLayout from "@/components/layouts/LandingLayout";
import ApplicationLayout from "@/components/layouts/ApplicationLayout";
import ServicesFeed from "@/pages/ServicesFeed.tsx";
import Profile from "@/pages/Profile";
// ProtectedRoutes that should use the landing page layout
const LANDING_ROUTES = ["/", "/auth"];

function ProtectedRouter() {
  return (
    <Switch>
      {/* ProtectedRoutes that should use the landing page layout */}
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      {/* ProtectedRoutes that should use the application layout */}
      <ProtectedRoute path="/profile" component={Profile} guestAllowed />
      <ProtectedRoute path="/home" component={SocialFeed} guestAllowed />
      <ProtectedRoute path="/marketplace" component={Marketplace} guestAllowed />
      <ProtectedRoute path="/home/demands" component={DemandsFeed} guestAllowed />
      <ProtectedRoute path="/home/viewService" component={ServicePage} guestAllowed />
      <ProtectedRoute path="/home/services" component={ServicesFeed} guestAllowed />
      <ProtectedRoute path="/providers/:provider_id" component={ProviderProfile} guestAllowed />
      <ProtectedRoute path="/user/:user_id" component={ClientProfile} guestAllowed />
      <ProtectedRoute path="/search" component={SearchResults} guestAllowed />
      <ProtectedRoute path="/test-auth" component={TestAuth} guestAllowed />
      <ProtectedRoute path="/messages" component={Messages} />
      {/* Admin routes */}
      <ProtectedRoute path="/admin-bootstrap" component={AdminBootstrap} guestAllowed={false} />
      <ProtectedRoute path="/admin" component={AdminDashboard} guestAllowed={false} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isLandingPage = LANDING_ROUTES.includes(location);
  const Layout = isLandingPage ? LandingLayout : ApplicationLayout;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Layout>
          <ProtectedRouter />
        </Layout>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
