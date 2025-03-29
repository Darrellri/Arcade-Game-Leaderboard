import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Trophy, Gamepad2, CircleDot, Calendar } from "lucide-react";
import type { Game } from "@shared/schema";
import ShareScore from "@/components/share-score";

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

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  return (
    <Card className="overflow-hidden flex flex-col">
      <CardContent className="grid gap-4 pt-6 flex-1">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            {game.type === 'pinball' ? (
              <CircleDot className="h-5 w-5 text-primary" />
            ) : (
              <Gamepad2 className="h-5 w-5 text-primary" />
            )}
            <h3 className="text-lg font-semibold uppercase">{game.name}</h3>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span className="font-mono text-lg">
                  {(game.currentHighScore || 0).toLocaleString()}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Top Score by {game.topScorerName || 'No scores yet'}
              </div>
              {game.topScoreDate && (
                <div className="text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(new Date(game.topScoreDate))}
                  </div>
                  <div className="text-xs italic ml-4">
                    ({formatTime(new Date(game.topScoreDate))})
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <ShareScore game={game} variant="outline" />
              <Link href={`/leaderboard/${game.id}`}>
                <Button variant="secondary">View Scores</Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}