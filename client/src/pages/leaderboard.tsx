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

type ViewMode = "grid" | "list";

export default function Leaderboard() {
  const { gameId } = useParams();
  const id = parseInt(gameId || "0");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  // Always sort by score in descending order for individual game pages

  const { data: game } = useQuery<Game>({
    queryKey: [`/api/games/${id}`],
  });

  const { data: scores, isLoading } = useQuery<Score[]>({
    queryKey: [`/api/games/${id}/scores`],
  });

  if (!game) return null;

  // Always sort by score (highest to lowest) and exclude the champion (first place)
  const sortedScores = [...(scores || [])].sort((a, b) => b.score - a.score);
  const nonChampionScores = sortedScores.slice(1); // Start from 2nd place

  return (
    <div className="space-y-8">
      {/* Game Marquee Header */}
      <div className="mb-8 flex justify-center">
        <div className="relative">
          {/* Marquee image at natural aspect ratio */}
          {game.imageUrl && (
            <>
              <Link href="/">
                <div className="relative rounded-[10px] overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] group">
                  <img 
                    src={game.imageUrl || ''} 
                    alt={game.name} 
                    className="max-w-full h-auto object-contain rounded-[10px]"
                    style={{ maxHeight: '300px' }}
                  />
                  {/* Dark overlay for text readability */}
                  <div className="absolute inset-0 bg-black/50 rounded-[10px]"></div>
                  
                  {/* Desktop text overlay */}
                  <div className="hidden sm:absolute sm:inset-0 sm:flex sm:items-center p-6 sm:pl-[30px]">
                    <div className="text-center sm:text-left">
                      <h1 className="text-3xl md:text-5xl lg:text-5xl font-black tracking-wide uppercase text-white drop-shadow-2xl" 
                          style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5)' }}>
                        {game.name}
                      </h1>
                      {game.subtitle && (
                        <p className="text-lg md:text-xl text-white/95 tracking-wider mt-2 font-medium drop-shadow-lg"
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
                              {formatDate(new Date(game.topScoreDate))} ({formatTime(new Date(game.topScoreDate))})
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
              
              {/* Mobile title and subtitle below image */}
              <div className="sm:hidden mt-5 text-center">
                <h1 className="text-sm font-black tracking-wide uppercase text-foreground mb-2" 
                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
                  {game.name}
                </h1>
                {game.subtitle && (
                  <p className="text-xs text-muted-foreground tracking-wider font-medium mb-2">
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
            </>
          )}
          
          {!game.imageUrl && (
            <Link href="/">
              <div className="relative cursor-pointer transition-all duration-300 hover:scale-[1.02] group" style={{ width: '792px', height: '214px', maxWidth: '100vw' }}>
                <div className="w-full h-full bg-gradient-to-r from-primary/60 via-primary/40 to-primary/60 rounded-[10px] flex items-center p-6 sm:pl-[30px]">
                  <div className="text-center sm:text-left">
                    <h1 className="text-3xl sm:text-5xl font-black tracking-wide uppercase text-white drop-shadow-2xl">
                      {game.name}
                    </h1>
                    {game.subtitle && (
                      <p className="text-lg sm:text-xl text-white/95 tracking-wider mt-2 font-medium drop-shadow-lg">
                        {game.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          )}
          
          {/* Back button in lower right corner */}
          <Link href="/">
            <div className="absolute bottom-4 right-4 opacity-75 hover:opacity-100 transition-opacity duration-300 cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/80 hover:bg-primary text-primary-foreground rounded-lg backdrop-blur-sm border border-primary/20 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
                <span className="font-semibold text-sm">
                  <span className="hidden sm:inline">Back to Games</span>
                  <span className="sm:hidden">Back</span>
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Navigation buttons at the top */}
      <div className="flex space-x-2 mb-6">
        <Button variant="outline" asChild className="flex-1">
          <Link href="/">Home</Link>
        </Button>
        <Button variant="outline" asChild className="flex-1">
          <Link href="/scan">Scan</Link>
        </Button>
        <Button variant="outline" asChild className="flex-1">
          <Link href="/admin">Admin</Link>
        </Button>
      </div>
      
      <div className="section-header px-4 py-3 flex items-center justify-end rounded-lg mb-4">
        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
            className="shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Grid2X2 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
            className="shadow-sm hover:shadow-md transition-all duration-200"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {nonChampionScores.map((score, index) => (
            <Card 
              key={score.id} 
              className="themed-card shadow-md hover:shadow-lg transition-all duration-300"
            >
              <CardContent className="pt-6 card-content">
                <div className="flex items-center gap-3 mb-2">
                  <img 
                    src="/badge3.png" 
                    alt={`Rank ${index + 2} Badge`} 
                    className="w-16 h-16 object-contain" 
                  />
                  <div className="text-xl font-medium">#{index + 2} {score.playerName}</div>
                </div>
                <div className={`text-3xl score-display mt-2 ${index === 0 ? "champion-badge" : ""}`}>
                  {score.score.toLocaleString()}
                </div>
                <div className="subtitle mt-2">
                  {formatDate(new Date(score.submittedAt!))}
                  <span className="italic ml-2">
                    ({formatTime(new Date(score.submittedAt!))})
                  </span>
                </div>
                <div className="mt-4">
                  <Button variant="secondary" className="w-full font-medium shadow-sm hover:shadow-md mb-2">
                    <ShareScore game={game} score={score} variant="secondary" className="w-full" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-1 w-full">
          {nonChampionScores.map((score, index) => (
            <div
              key={score.id}
              className="flex items-center justify-between px-6 py-4 section-background rounded-2xl hover:bg-primary/15 transition-all duration-300 w-full group"
            >
              {/* Left side - Player info */}
              <div className="flex items-center gap-4 flex-1">
                <img 
                  src="/badge3.png" 
                  alt={`Rank ${index + 2} Badge`} 
                  className="w-10 h-10 object-contain opacity-80" 
                />
                <div className="flex flex-col">
                  <div className="font-medium text-lg text-foreground group-hover:text-primary transition-colors duration-200">
                    #{index + 2} {score.playerName}
                  </div>
                  <div className="text-sm text-muted-foreground/80">
                    {formatDate(new Date(score.submittedAt!))} • {formatTime(new Date(score.submittedAt!))}
                  </div>
                </div>
              </div>

              {/* Right side - Score and actions */}
              <div className="flex items-center gap-6">
                <div className="text-2xl font-semibold text-foreground tabular-nums">
                  {score.score.toLocaleString()}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-muted-foreground hover:text-foreground border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 transition-all duration-200 px-3"
                >
                  <ShareScore game={game} score={score} variant="ghost" size="sm" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}