import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { Game, Score } from "@shared/schema";

export default function Leaderboard() {
  const { gameId } = useParams();
  const id = parseInt(gameId);

  const { data: game } = useQuery<Game>({
    queryKey: [`/api/games/${id}`],
  });

  const { data: scores, isLoading } = useQuery<Score[]>({
    queryKey: [`/api/games/${id}/scores`],
  });

  if (!game) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">{game.name}</h1>
        <p className="text-muted-foreground mt-2">High Scores</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Player</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scores?.map((score, index) => (
              <TableRow key={score.id}>
                <TableCell className="font-bold">{index + 1}</TableCell>
                <TableCell>{score.playerName}</TableCell>
                <TableCell>{score.score.toLocaleString()}</TableCell>
                <TableCell>
                  {new Date(score.submittedAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
