import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import GameCard from "@/components/game-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Grid2X2, List, TableIcon, Gamepad2, CircleDot } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Game } from "@shared/schema";

type ViewMode = "table" | "grid" | "list";

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  }).toLowerCase().replace(' ', '');
}

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>("table");

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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold tracking-tight">Arcade High Scores</h1>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("table")}
          >
            <TableIcon className="h-4 w-4" />
          </Button>
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
          {games?.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : viewMode === "table" ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Game</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>High Score</TableHead>
              <TableHead>Top Player</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {games?.map((game) => (
              <TableRow key={game.id}>
                <TableCell className="uppercase">{game.name}</TableCell>
                <TableCell>
                  {game.type === 'pinball' ? (
                    <CircleDot className="h-4 w-4 text-primary" />
                  ) : (
                    <Gamepad2 className="h-4 w-4 text-primary" />
                  )}
                </TableCell>
                <TableCell>{(game.currentHighScore || 0).toLocaleString()}</TableCell>
                <TableCell>{game.topScorerName || 'No scores yet'}</TableCell>
                <TableCell>
                  {game.topScoreDate ? (
                    <span>
                      {new Date(game.topScoreDate).toLocaleDateString()} 
                      <span className="text-muted-foreground italic">
                        ({formatTime(new Date(game.topScoreDate))})
                      </span>
                    </span>
                  ) : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="secondary" asChild>
                    <Link href={`/leaderboard/${game.id}`}>View Scores</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="space-y-4">
          {games?.map((game) => (
            <div
              key={game.id}
              className="flex flex-col md:flex-row bg-card rounded-lg overflow-hidden border"
            >
              {/* Game image */}
              <div className="w-full md:w-1/3 flex justify-center items-center p-4 bg-muted/30">
                <img 
                  src={game.imageUrl} 
                  alt={game.name}
                  className="max-h-[100px] max-w-full object-contain"
                  onError={(e) => {
                    // Handle image loading errors
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              
              {/* Game info */}
              <div className="flex-1 flex items-center justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    {game.type === 'pinball' ? (
                      <CircleDot className="h-4 w-4 text-primary" />
                    ) : (
                      <Gamepad2 className="h-4 w-4 text-primary" />
                    )}
                    <span className="font-medium uppercase">{game.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Top Player: {game.topScorerName || 'No scores yet'}
                  </div>
                  {game.topScoreDate && (
                    <div className="text-sm text-muted-foreground">
                      {new Date(game.topScoreDate).toLocaleDateString()} 
                      <span className="italic">
                        ({formatTime(new Date(game.topScoreDate))})
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
                  <div className="text-right">
                    <div className="font-mono font-bold text-lg">
                      {(game.currentHighScore || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Top Score</div>
                  </div>
                  <Button variant="secondary" asChild>
                    <Link href={`/leaderboard/${game.id}`}>View Scores</Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}