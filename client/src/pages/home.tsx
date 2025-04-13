import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { Game } from "@shared/schema";
import { Button } from "@/components/ui/button";
import GameCard from "@/components/game-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Gamepad2, Grid2X2, List, CircleDot, Trophy } from "lucide-react";

import { formatDate, formatTime } from "@/lib/formatters";

type ViewMode = "grid" | "list";

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const { data: games, isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

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
    <div className="space-y-8">
      <div className="section-header px-4 py-3 flex items-center justify-between rounded-lg mb-4 w-full">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Arcade Top Scores</h1>
        <div className="flex items-center gap-4">
          <div className="font-medium hidden md:block text-muted-foreground">View Mode</div>
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
      
      {/* Navigation buttons at the top */}
      <div className="flex space-x-2 mb-6">
        <Button variant="outline" asChild className="flex-1">
          <Link href="/">Home</Link>
        </Button>
        <Button variant="outline" asChild className="flex-1">
          <Link href="/scan">Scan</Link>
        </Button>
        <Button variant="outline" asChild className="flex-1">
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
        <div className="space-y-3 w-full">
          {processedGames?.map((game) => (
            <Link href={`/leaderboard/${game.id}`} key={game.id} className="block w-full">
              <div
                className="list-item flex items-center justify-between p-4 bg-card rounded-lg shadow-sm hover:shadow-md hover:bg-card/90 cursor-pointer transition-all duration-200 w-full"
              >
                <div className="flex-grow">
                  <div className="flex items-center gap-3">
                    <div className="w-[120px] h-[40px] relative overflow-hidden rounded flex-shrink-0 bg-black">
                      <img 
                        src={game.imageUrl}
                        alt={game.name}
                        className="w-full h-full object-cover opacity-100 hover:opacity-90 transition-opacity"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {game.type === 'pinball' ? (
                          <CircleDot className="h-4 w-4 text-primary" />
                        ) : (
                          <Gamepad2 className="h-4 w-4 text-primary" />
                        )}
                        <span className="font-bold uppercase tracking-wide letter-spacing-wide text-outline text-foreground">{game.name}</span>
                      </div>
                      {game.subtitle && <span className="subtitle block tracking-wider">{game.subtitle}</span>}
                    </div>
                  </div>
                  <div className="subtitle mt-2">
                    Top Score by: {game.topScorerName || 'No scores yet'}
                  </div>
                  {game.topScoreDate && (
                    <div className="text-sm text-muted-foreground">
                      {formatDate(new Date(game.topScoreDate))} 
                      <span className="italic ml-1">
                        ({formatTime(new Date(game.topScoreDate))})
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Trophy className="h-4 w-4 champion-badge" />
                      <div className="score-display text-lg champion-badge">
                        {(game.topScore || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="subtitle text-right">Top Score</div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="shadow-sm hover:shadow-md font-medium transition-colors border bg-accent/30 hover:bg-accent/50 text-foreground"
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
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}