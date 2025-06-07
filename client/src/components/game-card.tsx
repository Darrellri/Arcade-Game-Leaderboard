import { Game, Score } from "@shared/schema";
import { Calendar, Gamepad2, CircleDot, Trophy, Crown, Medal } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import GameMarquee from "./game-marquee";
import ShareScore from "./share-score";
import { formatDate, formatTime } from "@/lib/formatters";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/retro-tooltip";
import { useTheme } from "@/contexts/ThemeContext";
import { useState } from "react";

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  const { venueSettings } = useTheme();
  
  // Fetch scores for this game to find the second place
  const { data: scores } = useQuery<Score[]>({
    queryKey: [`/api/games/${game.id}/scores`],
    enabled: !!game.id && !!game.topScorerName, // Only fetch if we have a top score
  });
  
  // Find the second highest score (if available)
  const secondPlace = scores?.filter(s => s.playerName !== game.topScorerName)
    .sort((a, b) => b.score - a.score)[0];
    
  // Calculate days as champion if we have a date
  const daysAsChampion = game.topScoreDate ? 
    Math.floor((new Date().getTime() - new Date(game.topScoreDate).getTime()) / (1000 * 3600 * 24)) : 0;
    
  return (
    <div className="overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 themed-card">
      <Link href={`/leaderboard/${game.id}`}>
        <GameMarquee game={game} />
      </Link>
      
      <div className="card-content p-4 space-y-3">
        <Link href={`/leaderboard/${game.id}`}>
          <div className="flex items-center justify-center gap-2">
            {game.type === 'pinball' ? (
              <CircleDot className="h-4 w-4 text-primary" />
            ) : (
              <Gamepad2 className="h-4 w-4 text-primary" />
            )}
            <h3 className="text-lg font-bold tracking-wide uppercase text-primary letter-spacing-wide text-outline text-center">{game.name}</h3>
          </div>
          {game.subtitle && (
            <p className={`subtitle tracking-wider text-center mb-[10px] ${
              venueSettings?.gameSubtitleWhite === 'true' 
                ? 'text-white' 
                : 'text-primary'
            } ${
              venueSettings?.gameSubtitleBold === 'true' 
                ? 'font-bold' 
                : ''
            } ${
              venueSettings?.gameSubtitleItalic === 'true' 
                ? 'italic' 
                : ''
            }`}>
              {game.subtitle}
            </p>
          )}

          <div className="flex flex-col items-center justify-center">
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center justify-center gap-2">
                {(game.currentHighScore ?? 0) > 0 && (
                  <img 
                    src="/badge.png" 
                    alt="Champion Badge" 
                    className="w-7 h-7 object-contain" 
                  />
                )}
                <span className="score-display text-xl font-bold text-white drop-shadow-md">
                  {(game.currentHighScore ?? 0) > 0 
                    ? (game.currentHighScore ?? 0).toLocaleString()
                    : "000,000"
                  }
                </span>
              </div>
              <div className="text-lg font-bold text-white top-player-info text-center">
                {game.topScorerName && game.topScorerName !== 'No scores yet' 
                  ? `Top Score by ${game.topScorerName}`
                  : 'No scores yet'
                }
              </div>
              
              {game.topScoreDate && (
                <div className="space-y-1 mt-1 champion-details">
                  <div className="flex flex-wrap items-center justify-center gap-x-2 text-sm">
                    <span className="flex items-center gap-1 text-yellow-400">
                      <Trophy className="h-3.5 w-3.5" />
                      <span>Champion since:</span>
                    </span>
                    <span className="text-white">
                      {formatDate(new Date(game.topScoreDate))}
                    </span>
                    <span className="font-semibold text-primary-foreground">
                      ({daysAsChampion} days)
                    </span>
                  </div>
                  
                  {secondPlace && (
                    <div className="flex items-center justify-center gap-1 text-sm">
                      <Medal className="h-3.5 w-3.5 text-zinc-400" />
                      <span>Took the lead from:</span>
                      <span className="font-medium text-zinc-300">{secondPlace.playerName}</span>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(new Date(game.topScoreDate))}, {formatTime(new Date(game.topScoreDate))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Link>

        <div className="flex flex-col gap-2 mt-4">
          <div className="w-full">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={`/leaderboard/${game.id}`}>
                    <Button variant="outline" className="w-full font-medium transition-colors shadow-md hover:shadow-lg border bg-accent/30 hover:bg-accent/50 text-foreground mb-2">
                      <span className="flex items-center gap-2 justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <rect width="18" height="18" x="3" y="3" rx="2" />
                          <path d="M3 9h18" />
                          <path d="M9 21V9" />
                        </svg>
                        View Scores
                      </span>
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent variant="score">
                  Check out the leaderboard champions!
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ShareScore 
                    game={game} 
                    variant="secondary" 
                    className="w-full shadow-sm hover:shadow-md" 
                  />
                </TooltipTrigger>
                <TooltipContent variant="powerup">
                  Share your epic high score!
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
}