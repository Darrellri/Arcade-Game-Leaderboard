import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { Game, VenueSettings } from "@shared/schema";
import { Button } from "@/components/ui/button";
import GameCard from "@/components/game-card";
import ShareScore from "@/components/share-score";
import { Skeleton } from "@/components/ui/skeleton";
import { Gamepad2, Grid2X2, List, CircleDot, Trophy } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";

import { formatDate, formatTime } from "@/lib/formatters";

type ViewMode = "grid" | "list";

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const { data: games, isLoading: gamesLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });
  
  const { data: venueSettings, isLoading: settingsLoading } = useQuery<VenueSettings>({
    queryKey: ["/api/admin/settings"],
  });

  // Update venue settings mutation
  const updateSettings = useMutation({
    mutationFn: async (data: Partial<VenueSettings>) => {
      const res = await apiRequest("PATCH", "/api/admin/settings", data);
      return res.json() as Promise<VenueSettings>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
  });

  // Function to cycle through color schemes
  const cycleColorScheme = () => {
    if (!venueSettings?.themePresets) return;
    
    const currentTheme = venueSettings.theme;
    const presets = venueSettings.themePresets;
    
    // Find current theme index
    const currentIndex = presets.findIndex(preset => preset.primary === currentTheme.primary);
    
    // Get next theme (cycle back to 0 if at end)
    const nextIndex = (currentIndex + 1) % presets.length;
    const nextTheme = presets[nextIndex];
    
    // Update the theme
    updateSettings.mutate({
      theme: nextTheme
    });
  };

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
      {/* Header with venue name and view mode controls */}
      <div className="themed-header px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg mb-2 w-full">
        <div className="flex items-center gap-4">
          {(venueSettings?.animatedLogoUrl || venueSettings?.logoUrl) && (
            <div 
              className="logo-container flex-shrink-0 overflow-hidden rounded-md shadow-md border border-primary/20 cursor-pointer hover:opacity-80 transition-opacity" 
              style={{ 
                width: '200px', 
                height: '100px',
                backgroundColor: 
                  venueSettings.logoBackgroundColor === 'white' ? '#ffffff' :
                  venueSettings.logoBackgroundColor === 'black' ? '#000000' :
                  venueSettings.logoBackgroundColor === 'theme' ? 'hsl(var(--primary))' :
                  'rgba(var(--card), 0.7)'
              }}
              onClick={cycleColorScheme}
              title="Click to cycle through color schemes"
            >
              {venueSettings.animatedLogoUrl ? (
                <video 
                  src={venueSettings.animatedLogoUrl} 
                  autoPlay 
                  loop 
                  muted
                  className="w-full h-full object-contain p-2" 
                />
              ) : (
                <img 
                  src={venueSettings.logoUrl} 
                  alt={venueSettings.name} 
                  className="w-full h-full object-contain p-2" 
                />
              )}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground uppercase text-outline" style={{ letterSpacing: '2px' }}>
              {venueSettings?.leaderboardName || "THE LEADERBOARD"}
            </h1>
            <h2 className="text-lg md:text-2xl font-bold tracking-tight text-primary uppercase" style={{ letterSpacing: '4px' }}>
              {venueSettings?.name || "Arcade"}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 sm:mt-0">
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Grid2X2 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="shadow-sm hover:shadow-md transition-all duration-200"
            >
              <List className="h-4 w-4" />
            </Button>
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

      {viewMode === "grid" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {processedGames?.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="space-y-1 w-full">
          {processedGames?.map((game) => (
            <Link href={`/leaderboard/${game.id}`} key={game.id} className="block w-full">
              <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 section-background rounded-2xl hover:bg-primary/15 transition-all duration-300 w-full group cursor-pointer">
                
                {/* Left side - Game info */}
                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                  <img 
                    src="/badge.png" 
                    alt="Champion Badge" 
                    className="w-8 h-8 md:w-10 md:h-10 object-contain opacity-80 flex-shrink-0" 
                  />
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      {game.type === 'pinball' ? (
                        <CircleDot className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                      ) : (
                        <Gamepad2 className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                      )}
                      <div className="font-medium text-sm md:text-lg text-foreground group-hover:text-primary transition-colors duration-200 uppercase tracking-wide truncate">
                        {game.name}
                      </div>
                    </div>
                    <div className="text-xs md:text-sm text-muted-foreground/80 truncate">
                      {game.topScorerName || 'No champion yet'} • {game.topScoreDate ? formatDate(new Date(game.topScoreDate)) : 'No date'}
                    </div>
                  </div>
                </div>

                {/* Center - Top scorer name and marquee image */}
                <div className="flex md:hidden flex-col items-center gap-1 mx-2 flex-1">
                  <div className="text-sm font-bold text-primary truncate max-w-full text-center">
                    {game.topScorerName || 'No champion'}
                  </div>
                  <div className="text-xs text-muted-foreground/60">
                    Champion
                  </div>
                </div>
                
                <div className="hidden md:flex items-center justify-center gap-6 mx-8 flex-1 max-w-80">
                  <div className="flex flex-col items-center min-w-0 flex-1">
                    <div className="text-base md:text-xl font-bold text-primary truncate max-w-full text-center px-2">
                      {game.topScorerName || 'No champion'}
                    </div>
                    <div className="text-xs text-muted-foreground/60">
                      Champion
                    </div>
                  </div>
                  <div className="w-24 h-8 relative overflow-hidden rounded-lg bg-black/20 flex-shrink-0">
                    {game.imageUrl ? (
                      <img 
                        src={game.imageUrl}
                        alt={`${game.name} marquee`}
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xs text-muted-foreground/60">No image</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side - Score only */}
                <div className="flex items-center flex-shrink-0">
                  <div className="text-lg md:text-2xl font-semibold text-foreground tabular-nums min-w-32 text-right">
                    {(game.currentHighScore || 0).toLocaleString().padStart(8, '\u00A0')}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}