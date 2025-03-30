import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Grid2X2, List, TableIcon } from "lucide-react";
import { useState } from "react";
import type { Game, Score } from "@shared/schema";
import ShareScore from "@/components/share-score";

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

export default function Leaderboard() {
  const { gameId } = useParams();
  const id = parseInt(gameId || "0");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  // Always sort by score in descending order for individual game pages

  const { data: game } = useQuery<Game>({
    queryKey: [`/api/games/${id}`],
  });

  const { data: scores, isLoading } = useQuery<Score[]>({
    queryKey: [`/api/games/${id}/scores`],
  });

  if (!game) return null;

  // Always sort by score (highest to lowest)
  const sortedScores = [...(scores || [])].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight uppercase">{game.name}</h1>
          <p className="text-muted-foreground mt-2">Top Scores</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/">
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              Back
            </span>
          </Link>
        </Button>
      </div>

      <div className="flex gap-2 mb-4">
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

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : viewMode === "table" ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Player</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedScores.map((score, index) => (
              <TableRow key={score.id}>
                <TableCell className="font-bold">#{index + 1}</TableCell>
                <TableCell>{score.playerName}</TableCell>
                <TableCell>{score.score.toLocaleString()}</TableCell>
                <TableCell>
                  {formatDate(new Date(score.submittedAt!))}
                  <span className="text-muted-foreground italic ml-2">
                    ({formatTime(new Date(score.submittedAt!))})
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <ShareScore game={game} score={score} size="sm" variant="outline" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedScores.map((score, index) => (
            <Card key={score.id}>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold mb-2">#{index + 1}</div>
                <div className="text-xl">{score.playerName}</div>
                <div className="text-3xl font-mono mt-2">
                  {score.score.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {formatDate(new Date(score.submittedAt!))}
                  <span className="italic ml-2">
                    ({formatTime(new Date(score.submittedAt!))})
                  </span>
                </div>
                <div className="mt-4">
                  <ShareScore game={game} score={score} variant="outline" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {sortedScores.map((score, index) => (
            <div
              key={score.id}
              className="flex items-center justify-between p-4 bg-card rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className="text-xl font-bold">#{index + 1}</div>
                <div>
                  <div className="font-medium">{score.playerName}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(new Date(score.submittedAt!))}
                    <span className="italic ml-2">
                      ({formatTime(new Date(score.submittedAt!))})
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xl font-mono">
                  {score.score.toLocaleString()}
                </div>
                <ShareScore game={game} score={score} size="sm" variant="outline" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}