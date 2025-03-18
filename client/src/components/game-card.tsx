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
      <div className="relative">
        <img
          src={game.imageUrl}
          alt={game.name}
          className="w-full h-auto object-cover"
          loading="lazy"
        />
      </div>
      <CardContent className="grid gap-4 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span className="font-mono text-lg">
              {(game.currentHighScore || 0).toLocaleString()}
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