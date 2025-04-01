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
    <Card className="overflow-hidden flex flex-col shadow-md hover:shadow-lg transition-all duration-300">
      {/* Game Marquee Image */}
      <div className="image-container">
        {game.imageUrl ? (
          <img 
            src={game.imageUrl} 
            alt={`${game.name} marquee`}
            className="opacity-100 hover:opacity-90 transition-opacity"
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
      <CardContent className="grid gap-4 pt-6 flex-1 card-content">
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2">
              {game.type === 'pinball' ? (
                <CircleDot className="h-5 w-5 game-type-icon" />
              ) : (
                <Gamepad2 className="h-5 w-5 game-type-icon" />
              )}
              <h3 className="text-lg font-semibold uppercase truncate">{game.name}</h3>
            </div>
            {game.subtitle && <p className="subtitle ml-7">{game.subtitle}</p>}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="champion-icon">
                  <Trophy className="h-5 w-5" />
                </div>
                <span className="score-display text-lg champion-badge">
                  {(game.currentHighScore || 0).toLocaleString()}
                </span>
              </div>
              <div className="subtitle">
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
            <div className="flex flex-col gap-2 mt-4">
              <Link href={`/leaderboard/${game.id}`} className="w-full">
                <Button variant="secondary" className="w-full font-medium hover:bg-secondary/90 transition-colors shadow-sm hover:shadow-md">
                  <span className="flex items-center gap-2 justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <path d="M3 9h18" />
                      <path d="M9 21V9" />
                    </svg>
                    View Scores
                  </span>
                </Button>
              </Link>
              <Button className="w-full font-medium shadow-sm hover:shadow-md" variant="outline">
                <ShareScore game={game} variant="ghost" size="sm" className="w-full" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}