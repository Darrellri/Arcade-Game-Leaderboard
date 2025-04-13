import { Game } from "@shared/schema";
import { Calendar, Gamepad2, CircleDot, Trophy } from "lucide-react";
import { Link } from "wouter";

import { Button } from "@/components/ui/button";
import GameMarquee from "./game-marquee";
import { formatDate, formatTime } from "@/lib/formatters";

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  return (
    <Link href={`/leaderboard/${game.id}`} className="block">
      <div className="overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 bg-card hover:bg-card/90 cursor-pointer">
        <GameMarquee game={game} />
        <div className="card-content p-4 space-y-2">
          <div className="flex items-center gap-2">
            {game.type === 'pinball' ? (
              <CircleDot className="h-4 w-4 game-type-icon" />
            ) : (
              <Gamepad2 className="h-4 w-4 game-type-icon" />
            )}
            <h3 className="text-xl font-bold tracking-tight uppercase text-primary-600">{game.name}</h3>
          </div>
          {game.subtitle && <p className="subtitle text-primary-300">{game.subtitle}</p>}

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
                <div className="w-full">
                  <Button variant="secondary" className="w-full font-medium bg-primary-100 hover:bg-primary-200 text-primary-700 transition-colors shadow-sm hover:shadow-md border-primary-200">
                    <span className="flex items-center gap-2 justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <rect width="18" height="18" x="3" y="3" rx="2" />
                        <path d="M3 9h18" />
                        <path d="M9 21V9" />
                      </svg>
                      View Scores
                    </span>
                  </Button>
                </div>
              </div>
            </div>
        </div>
      </div>
    </Link>
  );
}