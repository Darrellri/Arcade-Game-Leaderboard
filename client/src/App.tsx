import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/home";
import SubmitScore from "@/pages/submit-score";
import Leaderboard from "@/pages/leaderboard";
import Admin from "@/pages/admin";
import AdminGames from "@/pages/admin-games";
import AdminScores from "@/pages/admin-scores";
import AdminColorSchemes from "@/pages/admin-color-schemes";
import AdminDisplayOptions from "@/pages/admin-display-options";
import AdminVenueSettings from "@/pages/admin-venue-settings";
import AdminNotes from "@/pages/admin-notes";
import NotFound from "@/pages/not-found";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";

function Router() {
  // Force the router to re-render when theme changes
  const { theme } = useTheme();
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="container mx-auto px-4 py-8 flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/submit-score/:gameId" component={SubmitScore} />
          <Route path="/leaderboard/:gameId" component={Leaderboard} />
          <Route path="/admin" component={Admin} />
          <Route path="/admin/games" component={AdminGames} />
          <Route path="/admin/scores" component={AdminScores} />
          <Route path="/admin/color-schemes" component={AdminColorSchemes} />
          <Route path="/admin/display-options" component={AdminDisplayOptions} />
          <Route path="/admin/venue-settings" component={AdminVenueSettings} />
          <Route path="/admin/notes" component={AdminNotes} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;