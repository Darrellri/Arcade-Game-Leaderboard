import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Trophy } from "lucide-react";
import type { Game } from "@shared/schema";

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video">
        <img
          src={game.imageUrl}
          alt={game.name}
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      <CardHeader className="relative -mt-20 bg-gradient-to-t from-background to-background/95">
        <CardTitle className="text-2xl font-bold">{game.name}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span className="font-mono text-lg">
              {game.currentHighScore.toLocaleString()}
            </span>
          </div>
          <Link href={`/leaderboard/${game.id}`}>
            <Button variant="secondary">View Scores</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
