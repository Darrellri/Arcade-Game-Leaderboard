import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Game, VenueSettings } from "@shared/schema";
import { Button } from "@/components/ui/button";
import GameCard from "@/components/game-card";
import ShareScore from "@/components/share-score";
import { Skeleton } from "@/components/ui/skeleton";
import { Gamepad2, CircleDot, Trophy } from "lucide-react";

import { formatDate, formatTime } from "@/lib/formatters";

export default function Home() {
  const { data: games, isLoading: gamesLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });
  
  const { data: venueSettings, isLoading: settingsLoading } = useQuery<VenueSettings>({
    queryKey: ["/api/admin/settings"],
  });

  const isLoading = gamesLoading || settingsLoading;

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[300px]" />
        ))}
      </div>
    );
  }

  // Process games data to determine the top scores
  const processedGames = games?.map(game => {
    // Game already contains the information we need
    return {
      ...game,
      topScore: game.currentHighScore || 0,
      topScorerName: game.topScorerName || 'No scores yet',
      topScoreDate: game.topScoreDate
    };
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header with venue name and logo */}
      <div className="section-header px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg mb-2 w-full">
        <div className="flex items-center gap-4">
          {venueSettings?.logoUrl && (
            <div className="logo-container flex-shrink-0 overflow-hidden rounded-md shadow-md bg-card/70 border border-primary/20" 
                 style={{ width: '200px', height: '100px' }}>
              <img 
                src={venueSettings.logoUrl} 
                alt={venueSettings.name} 
                className="w-full h-full object-contain p-2" 
              />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-primary uppercase">
              {venueSettings?.name || "Arcade"}
            </h2>
            <h1 className="text-3xl font-black tracking-tight text-foreground uppercase letter-spacing-wide text-outline">
              TOP SCORES
            </h1>
          </div>
        </div>
      </div>
      
      {/* Smaller navigation buttons */}
      <div className="flex justify-end space-x-2 mb-4">
        <Button variant="outline" size="sm" asChild className="h-8 px-3">
          <Link href="/">Home</Link>
        </Button>
        <Button variant="outline" size="sm" asChild className="h-8 px-3">
          <Link href="/scan">Scan</Link>
        </Button>
        <Button variant="outline" size="sm" asChild className="h-8 px-3">
          <Link href="/admin">Admin</Link>
        </Button>
      </div>

      {/* Always use grid view */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {processedGames?.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}