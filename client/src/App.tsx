import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import LibraryPage from "@/pages/library";
import VaultPage from "@/pages/vault";
import AITutor from "@/pages/ai-tutor";
import CommunityPage from "@/pages/community";
import HelpPage from "@/pages/help";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={() => {
          // Redirect unauthenticated users to landing for any other route
          window.location.href = "/";
          return null;
        }} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/library" component={LibraryPage} />
      <Route path="/vault" component={VaultPage} />
      <Route path="/ai-tutor" component={AITutor} />
      <Route path="/community" component={CommunityPage} />
      <Route path="/help" component={HelpPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
