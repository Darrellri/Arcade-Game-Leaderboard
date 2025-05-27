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
      {/* Full-Width Game Marquee Header */}
      <div className="mb-8 -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="w-full min-h-[300px] relative overflow-hidden">
          {/* Full marquee background image */}
          {game.imageUrl && (
            <div className="absolute inset-0">
              <img 
                src={game.imageUrl || ''} 
                alt={game.name} 
                className="w-full h-full object-cover"
              />
              {/* Dark overlay for text readability */}
              <div className="absolute inset-0 bg-black/50"></div>
            </div>
          )}
          
          {/* Fallback gradient if no image */}
          {!game.imageUrl && (
            <div className="absolute inset-0 bg-gradient-to-r from-primary/60 via-primary/40 to-primary/60"></div>
          )}

          {/* Professional text overlay */}
          <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-8">
            <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Game title and info */}
              <div className="flex-grow text-center sm:text-left">
                <h1 className="text-4xl sm:text-6xl font-black tracking-wide uppercase text-white drop-shadow-2xl" 
                    style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5)' }}>
                  {game.name}
                </h1>
                {game.subtitle && (
                  <p className="text-xl sm:text-2xl text-white/95 tracking-wider mt-2 font-medium drop-shadow-lg"
                     style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>
                    {game.subtitle}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-center sm:justify-start gap-3">
                  <img 
                    src="/badge1.png" 
                    alt="Champion Badge" 
                    className="w-32 h-32 object-contain drop-shadow-lg" 
                  />
                  <div className="flex flex-col">
                    <p className="text-2xl sm:text-3xl text-white font-bold uppercase drop-shadow-lg"
                       style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)', letterSpacing: '2px' }}>
                      {game.topScorerName || "NO CHAMPION YET"}
                    </p>
                    {game.currentHighScore && (
                      <p className="text-xl sm:text-2xl text-yellow-400 font-bold drop-shadow-lg"
                         style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                        {game.currentHighScore.toLocaleString()}
                      </p>
                    )}
                    {game.topScoreDate && (
                      <p className="text-sm sm:text-base text-white/90 drop-shadow-lg"
                         style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>
                        {formatDate(new Date(game.topScoreDate))} ({formatTime(new Date(game.topScoreDate))})
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Navigation button */}
              <Button 
                variant="outline" 
                asChild 
                className="bg-black/30 hover:bg-black/50 border-white/30 text-white transition-colors duration-300 shadow-xl hover:shadow-2xl font-bold text-lg px-6 py-3 backdrop-blur-sm"
                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
              >
                <Link href="/">
                  <span className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <path d="m15 18-6-6 6-6"/>
                    </svg>
                    Back to Games
                  </span>
                </Link>
              </Button>
            </div>
          </div>
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
              className="shadow-md hover:shadow-lg transition-all duration-300"
            >
              <CardContent className="pt-6 card-content">
                <div className="flex items-center gap-2 mb-2">
                  {index === 0 ? (
                    <img 
                      src="/badge2.png" 
                      alt="Second Place Badge" 
                      className="w-16 h-16 object-contain" 
                    />
                  ) : (
                    <div className="relative w-16 h-16">
                      <img 
                        src="/badge3.png" 
                        alt={`Rank ${index + 2} Badge`} 
                        className="w-16 h-16 object-contain" 
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-lg font-bold drop-shadow-md">
                          {index + 2}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="text-2xl font-bold text-muted-foreground">
                    #{index + 2}
                  </div>
                </div>
                <div className="text-xl font-medium">{score.playerName}</div>
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
        <div className="space-y-3 w-full">
          {nonChampionScores.map((score, index) => (
            <div
              key={score.id}
              className="list-item flex items-center justify-between p-6 bg-card rounded-lg shadow-md hover:shadow-lg transition-all duration-300 w-full"
            >
              <div className="flex items-center gap-5 flex-grow pr-6">
                <div className="flex-shrink-0">
                  {index === 0 ? (
                    <img 
                      src="/badge2.png" 
                      alt="Second Place Badge" 
                      className="w-24 h-24 object-contain" 
                    />
                  ) : (
                    <div className="relative w-24 h-24">
                      <img 
                        src="/badge3.png" 
                        alt={`Rank ${index + 2} Badge`} 
                        className="w-24 h-24 object-contain" 
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-xl font-bold drop-shadow-md">
                          {index + 2}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="font-bold text-xl md:text-2xl tracking-wide">
                    {score.playerName}
                  </div>
                  <div className="subtitle tracking-wider mt-1">
                    {formatDate(new Date(score.submittedAt!))}
                    <span className="italic ml-2">
                      ({formatTime(new Date(score.submittedAt!))})
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3 bg-accent/20 px-6 py-4 rounded-lg flex-shrink-0">
                <div className={`score-display text-2xl md:text-4xl font-bold text-right ${index === 0 ? "champion-badge text-3xl md:text-5xl" : ""}`}>
                  {score.score.toLocaleString()}
                </div>
                <Button 
                  variant="outline" 
                  className="shadow-sm hover:shadow-md font-medium border bg-accent/30 hover:bg-accent/50 text-foreground"
                >
                  <ShareScore 
                    game={game} 
                    score={score} 
                    variant="outline" 
                    className="w-full"
                  />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}