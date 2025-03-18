import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import GameCard from "@/components/game-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Grid2X2, List, TableIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Game } from "@shared/schema";

type ViewMode = "table" | "grid" | "list";

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
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {games?.map((game) => (
              <TableRow key={game.id}>
                <TableCell>{game.name}</TableCell>
                <TableCell className="capitalize">{game.type}</TableCell>
                <TableCell>{(game.currentHighScore || 0).toLocaleString()}</TableCell>
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
                <div className="font-medium">{game.name}</div>
                <div className="text-sm text-muted-foreground capitalize">
                  {game.type}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-mono">
                    {(game.currentHighScore || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">High Score</div>
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