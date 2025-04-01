import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Trophy, Gamepad2, CircleDot, Calendar } from "lucide-react";
import type { Game } from "@shared/schema";
import ShareScore from "@/components/share-score";
import { cn } from "@/lib/utils";

import { formatDate, formatTime } from "@/lib/formatters";

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  return (
    <Card className="overflow-hidden flex flex-col">
      {/* Game Marquee Image */}
      <div className="w-full h-[200px] relative overflow-hidden">
        {game.imageUrl ? (
          <img 
            src={game.imageUrl} 
            alt={`${game.name} marquee`}
            className="w-full h-full object-contain bg-black"
          />
        ) : (
          <div 
            className={cn(
              "w-full h-full flex items-center justify-center bg-gradient-to-r from-primary/20 to-primary/40"
            )}
          >
            <h2 className="text-2xl md:text-3xl font-bold tracking-wider text-center px-4 uppercase bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-foreground">
              {game.name}
            </h2>
          </div>
        )}
      </div>
      <CardContent className="grid gap-4 pt-6 flex-1">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            {game.type === 'pinball' ? (
              <CircleDot className="h-5 w-5 text-primary flex-shrink-0" />
            ) : (
              <Gamepad2 className="h-5 w-5 text-primary flex-shrink-0" />
            )}
            <h3 className="text-lg font-semibold uppercase truncate">{game.name}</h3>
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
            <div className="flex flex-col gap-2 mt-2">
              <Link href={`/leaderboard/${game.id}`}>
                <Button variant="secondary" className="w-full">View Scores</Button>
              </Link>
              <div className="flex justify-end">
                <ShareScore game={game} variant="ghost" size="sm" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}