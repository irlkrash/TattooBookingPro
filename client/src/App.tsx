import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { DesignConfigProvider } from "@/providers/design-config-provider";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import GalleryPage from "@/pages/gallery-page";
import AuthPage from "@/pages/auth-page";
import AdminDashboard from "@/pages/admin/dashboard";
import { ProtectedRoute } from "./lib/protected-route";
import Navbar from "./components/navbar";

function Router() {
  return (
    <>
      <Navbar />
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/gallery" component={GalleryPage} />
        <Route path="/auth" component={AuthPage} />
        <ProtectedRoute 
          path="/admin" 
          component={AdminDashboard} 
          requireAdmin={true} 
        />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DesignConfigProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </DesignConfigProvider>
    </QueryClientProvider>
  );
}

export default App;