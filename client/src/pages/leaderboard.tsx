import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Grid2X2, List } from "lucide-react";
import { useState } from "react";
import type { Game, Score } from "@shared/schema";
import ShareScore from "@/components/share-score";
import { TrophyIcon } from "@/components/trophy-icon";

import { formatDate, formatTime } from "@/lib/formatters";
import { useTheme } from "@/contexts/ThemeContext";

type ViewMode = "grid" | "list";

export default function Leaderboard() {
  const { gameId } = useParams();
  const id = parseInt(gameId || "0");
  const { venueSettings } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  // Always sort by score in descending order for individual game pages

  const { data: game } = useQuery<Game>({
    queryKey: [`/api/games/${id}`],
  });

  const { data: scores, isLoading } = useQuery<Score[]>({
    queryKey: [`/api/games/${id}/scores`],
  });

  if (!game) {
    return <div>Game not found</div>;
  }

  // Always sort by score (highest to lowest) and exclude the champion (first place)
  const sortedScores = [...(scores || [])].sort((a, b) => b.score - a.score);
  const nonChampionScores = sortedScores.slice(1); // Start from 2nd place

  return (
    <div className="space-y-8">
      {/* Game Marquee Header - Full Width */}
      <div className="mb-8 w-full">
        {game.imageUrl && (
          <div className="relative w-full">
            <div className="relative rounded-[10px] overflow-hidden transition-all duration-300 group">
              <img 
                src={game.imageUrl || ''} 
                alt={game.name} 
                className="w-full h-auto object-contain rounded-[10px] brightness-125"
              />
              {/* Lighter overlay for better brightness */}
              <div className="absolute inset-0 bg-black/30 rounded-[10px]"></div>
              
              {/* Desktop text overlay */}
              <div className="hidden sm:absolute sm:inset-0 sm:flex sm:items-center p-6 sm:pl-[30px]">
                <div className="text-center sm:text-left">
                  <h1 className="text-3xl md:text-5xl lg:text-5xl font-black tracking-wide uppercase text-white drop-shadow-2xl" 
                      style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5)' }}>
                    {game.name}
                  </h1>
                  {game.subtitle && (
                    <p className={`text-lg md:text-xl tracking-wider mt-2 drop-shadow-lg ${
                      venueSettings?.gameSubtitleWhite === 'true' 
                        ? 'text-white' 
                        : 'text-white'
                    } ${
                      venueSettings?.gameSubtitleBold === 'true' 
                        ? 'font-bold' 
                        : 'font-medium'
                    } ${
                      venueSettings?.gameSubtitleItalic === 'true' 
                        ? 'italic' 
                        : ''
                    }`}
                       style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>
                      {game.subtitle}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-center sm:justify-start gap-3">
                    <img 
                      src="/badge1.png" 
                      alt="Champion Badge" 
                      className="w-24 h-24 object-contain drop-shadow-lg animate-float" 
                    />
                    <div className="flex flex-col">
                      <p className="text-xl sm:text-2xl text-white font-bold uppercase drop-shadow-lg"
                         style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)', letterSpacing: '2px' }}>
                        #1 {game.topScorerName || "NO CHAMPION YET"}
                      </p>
                      {game.currentHighScore && (
                        <p className="text-lg sm:text-xl text-yellow-400 font-bold drop-shadow-lg"
                           style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                          {game.currentHighScore.toLocaleString()}
                        </p>
                      )}
                      {game.topScoreDate && (
                        <p className="text-xs sm:text-sm text-white/90 drop-shadow-lg"
                           style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>
                          {formatDate(new Date(game.topScoreDate))} {formatTime(new Date(game.topScoreDate))}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile title and subtitle below image */}
      <div className="sm:hidden mt-5 text-center">
        <h1 className="text-sm font-black tracking-wide uppercase text-foreground mb-2" 
            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
          {game.name}
        </h1>
        {game.subtitle && (
          <p className={`text-xs tracking-wider mb-2 ${
            venueSettings?.gameSubtitleWhite === 'true' 
              ? 'text-white' 
              : 'text-foreground'
          } ${
            venueSettings?.gameSubtitleBold === 'true' 
              ? 'font-bold' 
              : 'font-medium'
          } ${
            venueSettings?.gameSubtitleItalic === 'true' 
              ? 'italic' 
              : ''
          }`}>
            {game.subtitle}
          </p>
        )}
        {game.topScorerName && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <img 
              src="/badge1.png" 
              alt="Champion Badge" 
              className="w-12 h-12 object-contain" 
            />
            <div className="flex flex-col text-left">
              <p className="text-sm font-bold uppercase text-foreground"
                 style={{ letterSpacing: '1px' }}>
                #1 {game.topScorerName}
              </p>
              {game.currentHighScore && (
                <p className="text-xs text-primary font-bold">
                  {game.currentHighScore.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* View Mode Toggle and Back Button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="flex items-center gap-2"
          >
            <Grid2X2 className="h-4 w-4" />
            Grid
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="flex items-center gap-2"
          >
            <List className="h-4 w-4" />
            List
          </Button>
        </div>
        
        <Link href="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            ← Back
          </Button>
        </Link>
      </div>

      {/* Leaderboard Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {nonChampionScores.map((score, index) => (
            <Card key={score.id} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                    #{index + 2}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{score.playerName}</h3>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(new Date(score.submittedAt))} {formatTime(new Date(score.submittedAt))}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary tabular-nums">
                    {score.score.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {nonChampionScores.map((score, index) => (
            <Card key={score.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                      #{index + 2}
                    </div>
                    <div>
                      <h3 className="font-semibold">{score.playerName}</h3>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(new Date(score.submittedAt))} {formatTime(new Date(score.submittedAt))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-xl font-bold text-primary tabular-nums">
                      {score.score.toLocaleString()}
                    </p>
                    <ShareScore 
                      game={game} 
                      score={score}
                      variant="ghost" 
                      size="sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && nonChampionScores.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <TrophyIcon size={48} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Scores Yet</h3>
            <p className="text-muted-foreground">
              Be the first to submit a score for {game.name}!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Thin Footer Bar */}
      <div className="mt-12 py-6 border-t border-border/20 bg-card/30">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            {venueSettings?.name || "Winona Axe and Arcade"} • High Score Tracking
          </p>
        </div>
      </div>
    </div>
  );
}