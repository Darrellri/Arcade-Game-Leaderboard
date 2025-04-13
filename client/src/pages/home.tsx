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
      <div className="section-header px-4 py-3 flex items-center justify-between rounded-lg mb-4 bg-gradient-to-r from-primary-100 to-transparent">
        <h1 className="text-4xl font-bold tracking-tight text-primary-700">Arcade Top Scores</h1>
        <div className="flex items-center gap-4">
          <div className="font-medium hidden md:block text-primary-600">View Mode</div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className={`shadow-sm hover:shadow-md transition-all duration-200 ${viewMode === "grid" ? "bg-primary-500 hover:bg-primary-600" : "border-primary-200 text-primary-700"}`}
            >
              <Grid2X2 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
              className={`shadow-sm hover:shadow-md transition-all duration-200 ${viewMode === "list" ? "bg-primary-500 hover:bg-primary-600" : "border-primary-200 text-primary-700"}`}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {processedGames?.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {processedGames?.map((game) => (
            <Link href={`/leaderboard/${game.id}`} key={game.id} className="block">
              <div
                className="list-item flex items-center justify-between p-4 bg-card rounded-lg shadow-sm hover:shadow-md hover:bg-card/90 cursor-pointer transition-all duration-200"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-[80px] h-[21px] relative overflow-hidden rounded flex-shrink-0 bg-black">
                      <img 
                        src={game.imageUrl}
                        alt={game.name}
                        className="w-auto h-full max-w-full object-contain opacity-100 hover:opacity-90 transition-opacity"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {game.type === 'pinball' ? (
                          <CircleDot className="h-4 w-4 text-primary-400" />
                        ) : (
                          <Gamepad2 className="h-4 w-4 text-primary-400" />
                        )}
                        <span className="font-medium uppercase truncate max-w-[180px] text-primary-600">{game.name}</span>
                      </div>
                      {game.subtitle && <span className="subtitle block text-primary-300">{game.subtitle}</span>}
                    </div>
                  </div>
                  <div className="subtitle mt-2 text-primary-300">
                    Top Score by: {game.topScorerName || 'No scores yet'}
                  </div>
                  {game.topScoreDate && (
                    <div className="text-sm text-primary-200">
                      {formatDate(new Date(game.topScoreDate))} 
                      <span className="italic">
                        ({formatTime(new Date(game.topScoreDate))})
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
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
                    variant="secondary" 
                    className="shadow-sm hover:shadow-md font-medium transition-colors bg-primary-100 hover:bg-primary-200 text-primary-700 border-primary-200"
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