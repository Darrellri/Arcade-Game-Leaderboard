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
      {/* Header with venue name */}
      <div className="section-header px-5 py-4 rounded-lg mb-2 w-full">
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

      <div className="space-y-3 w-full">
          {processedGames?.map((game) => (
            <Link href={`/leaderboard/${game.id}`} key={game.id} className="block w-full">
              <div
                className="list-item flex items-center justify-between p-6 bg-card rounded-lg shadow-md hover:shadow-lg hover:bg-card/90 cursor-pointer transition-all duration-200 w-full"
              >
                <div className="flex-grow pr-4">
                  <div className="flex items-center gap-4">
                    <div className="w-[160px] h-[55px] relative overflow-hidden rounded-md flex-shrink-0 bg-black shadow-sm">
                      {game.imageUrl && (
                        <img 
                          src={game.imageUrl}
                          alt={game.name}
                          className="w-full h-full object-cover opacity-100 hover:opacity-90 transition-opacity"
                        />
                      )}
                      {!game.imageUrl && (
                        <div className="w-full h-full flex items-center justify-center bg-card/50">
                          <span className="text-xs text-muted-foreground">No image</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {game.type === 'pinball' ? (
                          <CircleDot className="h-5 w-5 text-primary" />
                        ) : (
                          <Gamepad2 className="h-5 w-5 text-primary" />
                        )}
                        <span className="text-xl font-bold uppercase tracking-wide letter-spacing-wide text-outline text-foreground">{game.name}</span>
                      </div>
                      {game.subtitle && <span className="subtitle block tracking-wider text-sm">{game.subtitle}</span>}
                    </div>
                  </div>
                  <div className="mt-3 text-base font-medium tracking-wide">
                    <span className="text-primary">Top Player:</span> {game.topScorerName || 'No scores yet'}
                  </div>
                  {game.topScoreDate && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {formatDate(new Date(game.topScoreDate))} 
                      <span className="italic ml-1">
                        ({formatTime(new Date(game.topScoreDate))})
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-6 flex-shrink-0 bg-accent/20 px-6 py-4 rounded-lg">
                  <div className="text-right">
                    <div className="flex items-center gap-3 justify-end mb-1">
                      <Trophy className="h-6 w-6 champion-badge" />
                      <div className="score-display text-2xl md:text-3xl font-bold champion-badge">
                        {(game.topScore || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="subtitle text-right uppercase tracking-widest">High Score</div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="shadow-sm hover:shadow-md font-medium transition-colors border bg-accent/30 hover:bg-accent/50 text-foreground h-full"
                    >
                      <span className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <rect width="18" height="18" x="3" y="3" rx="2" />
                          <path d="M3 9h18" />
                          <path d="M9 21V9" />
                        </svg>
                        View Scores
                      </span>
                    </Button>
                    <ShareScore 
                      game={game} 
                      variant="secondary" 
                      size="sm"
                      className="shadow-sm hover:shadow-md" 
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
    </div>
  );
}