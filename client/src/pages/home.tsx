import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import GameCard from "@/components/game-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Grid2X2, List, TableIcon, Gamepad2, CircleDot } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import type { Game } from "@shared/schema";

type ViewMode = "table" | "grid" | "list";

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatTime(date: Date) {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const time = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  }).toLowerCase().replace(' ', '');

  return `${dayName}, ${time}`;
}

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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold tracking-tight">Arcade Top Scores</h1>
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
              <TableHead>Top Score</TableHead>
              <TableHead>Top Score by</TableHead>
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
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <div className="inline-flex items-center justify-center p-1 bg-yellow-500/20 text-yellow-500 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                        <path d="M4 22h16"></path>
                        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                        <path d="M9 2v7.5"></path>
                        <path d="M15 2v7.5"></path>
                        <path d="M12 2v10"></path>
                        <path d="M12 12a4 4 0 0 0 4-4V6H8v2a4 4 0 0 0 4 4Z"></path>
                      </svg>
                    </div>
                    <span className="font-mono text-yellow-500 font-bold">
                      {(game.currentHighScore || 0).toLocaleString()}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{game.topScorerName || 'No scores yet'}</TableCell>
                <TableCell>
                  {game.topScoreDate ? (
                    <span>
                      {formatDate(new Date(game.topScoreDate))} 
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
        <div className="space-y-2">
          {games?.map((game) => (
            <div
              key={game.id}
              className="flex items-center justify-between p-4 bg-card rounded-lg"
            >
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
                    {(game.currentHighScore || 0).toLocaleString()}
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