import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Trophy } from "lucide-react";
import type { Game } from "@shared/schema";

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  return (
    <Card className="overflow-hidden flex flex-col">
      <CardContent className="grid gap-4 pt-6 flex-1">
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">{game.name}</h3>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span className="font-mono text-lg">
                  {(game.currentHighScore || 0).toLocaleString()}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                High Score by {game.topScorerName || 'No scores yet'}
              </div>
            </div>
            <Link href={`/leaderboard/${game.id}`}>
              <Button variant="secondary">View Scores</Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}