import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NavMenu from "@/components/ui/nav-menu";
import Home from "@/pages/home";
import Scan from "@/pages/scan";
import SubmitScore from "@/pages/submit-score";
import Leaderboard from "@/pages/leaderboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="container mx-auto px-4 py-8 flex-grow pb-24 md:pb-8">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/scan" component={Scan} />
          <Route path="/submit-score/:gameId" component={SubmitScore} />
          <Route path="/leaderboard/:gameId" component={Leaderboard} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <NavMenu />
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  );
}

export default App;