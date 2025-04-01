import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { Game } from "@shared/schema";
import { Button } from "@/components/ui/button";
import GameCard from "@/components/game-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Gamepad2, Grid2X2, List, CircleDot } from "lucide-react";

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
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold tracking-tight">Arcade Top Scores</h1>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid2X2 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {processedGames?.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {processedGames?.map((game) => (
            <div
              key={game.id}
              className="flex items-center justify-between p-4 bg-card rounded-lg"
            >
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-[80px] h-[21px] relative overflow-hidden rounded flex-shrink-0">
                    <div className="absolute inset-0 bg-black"></div>
                    <img 
                      src={game.imageUrl}
                      alt={game.name}
                      className="w-auto h-full max-w-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      {game.type === 'pinball' ? (
                        <CircleDot className="h-4 w-4 text-primary flex-shrink-0" />
                      ) : (
                        <Gamepad2 className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                      <span className="font-medium uppercase truncate max-w-[180px]">{game.name}</span>
                    </div>
                    {game.subtitle && <span className="text-xs text-muted-foreground ml-6">{game.subtitle}</span>}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Top Score by: {game.topScorerName || 'No scores yet'}
                </div>
                {game.topScoreDate && (
                  <div className="text-sm text-muted-foreground">
                    {formatDate(new Date(game.topScoreDate))} 
                    <span className="italic">
                      ({formatTime(new Date(game.topScoreDate))})
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-mono">
                    {(game.topScore || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Top Score</div>
                </div>
                <Button variant="secondary" asChild>
                  <Link href={`/leaderboard/${game.id}`}>View Scores</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}