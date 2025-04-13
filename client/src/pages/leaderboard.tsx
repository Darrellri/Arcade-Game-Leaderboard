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

  // Always sort by score (highest to lowest)
  const sortedScores = [...(scores || [])].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-8">
      {/* Game Marquee Display */}
      <div className="mb-8">
        <div className="w-full min-h-[240px] relative bg-gradient-to-r from-primary/40 via-primary/30 to-primary/20 rounded-lg shadow-lg overflow-hidden">
          {/* Game image/marquee overlay */}
          <div className="absolute inset-0 opacity-20 bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='52' height='26' viewBox='0 0 52 26' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Cpath d='M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>

          {/* Main content overlay */}
          <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-8">
            <div className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
              <Link href="/scores" className="flex-shrink-0">
                <div className="w-[150px] sm:w-[200px] h-[100px] sm:h-[133px] relative rounded-lg overflow-hidden bg-black shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer border border-white/20">
                  <img 
                    src={game.imageUrl} 
                    alt={game.name} 
                    className="w-full h-full object-cover mx-auto cursor-pointer"
                  />
                </div>
              </Link>
              <div className="flex-grow text-center sm:text-left">
                <h1 className="text-3xl sm:text-5xl font-bold tracking-wide letter-spacing-wide text-white drop-shadow-md text-outline">{game.name}</h1>
                {game.subtitle && <p className="text-white/90 tracking-wider text-lg">{game.subtitle}</p>}
                <p className="text-white mt-2 font-medium drop-shadow-sm text-xl">TOP SCORES</p>
              </div>
              <Button 
                variant="outline" 
                asChild 
                className="bg-accent/30 hover:bg-accent/50 border-white/20 text-white transition-colors duration-300 shadow-md hover:shadow-lg font-medium flex-shrink-0"
              >
                <Link href="/">
                  <span className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
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
      
      <div className="section-header px-4 py-3 flex items-center justify-between rounded-lg mb-4">
        <div className="font-medium text-lg">
          View Mode
        </div>
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
          {sortedScores.map((score, index) => (
            <Card 
              key={score.id} 
              className={`shadow-md hover:shadow-lg transition-all duration-300 ${index === 0 ? "border-2 border-yellow-500" : ""}`}
            >
              <CardContent className="pt-6 card-content">
                {index === 0 ? (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="champion-icon p-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                        <path d="M4 22h16"></path>
                        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                        <path d="M9 2v7.5"></path>
                        <path d="M15 2v7.5"></path>
                        <path d="M12 2v10"></path>
                        <path d="M12 12a4 4 0 0 0 4-4V6H8v2a4 4 0 0 0 4 4Z"></path>
                      </svg>
                    </div>
                    <div className="text-2xl font-bold champion-badge">CHAMPION</div>
                  </div>
                ) : (
                  <div className="text-2xl font-bold mb-2 flex items-center gap-2">
                    <span className="bg-secondary/50 size-8 rounded-full flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span>Rank</span>
                  </div>
                )}
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
          {sortedScores.map((score, index) => (
            <div
              key={score.id}
              className="list-item flex items-center justify-between p-5 bg-card rounded-lg shadow-sm hover:shadow-md transition-all duration-300 w-full"
            >
              <div className="flex items-center gap-4 flex-grow">
                {index === 0 ? (
                  <div className="flex items-center gap-2">
                    <div className="champion-icon p-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                        <path d="M4 22h16"></path>
                        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                        <path d="M9 2v7.5"></path>
                        <path d="M15 2v7.5"></path>
                        <path d="M12 2v10"></path>
                        <path d="M12 12a4 4 0 0 0 4-4V6H8v2a4 4 0 0 0 4 4Z"></path>
                      </svg>
                    </div>
                    <span className="text-xl font-bold champion-badge letter-spacing-wide">CHAMPION</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="bg-accent/70 size-9 rounded-full flex items-center justify-center text-lg font-bold">
                      {index + 1}
                    </div>
                  </div>
                )}
                <div>
                  <div className={`font-bold text-lg tracking-wide ${index === 0 ? "champion-badge" : ""}`}>{score.playerName}</div>
                  <div className="subtitle tracking-wider">
                    {formatDate(new Date(score.submittedAt!))}
                    <span className="italic ml-2">
                      ({formatTime(new Date(score.submittedAt!))})
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className={`text-2xl score-display flex items-center gap-1 ${index === 0 ? "champion-badge" : ""}`}>
                  {score.score.toLocaleString()}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="shadow-sm hover:shadow-md font-medium border bg-accent/30 hover:bg-accent/50 text-foreground"
                >
                  <ShareScore 
                    game={game} 
                    score={score} 
                    size="sm" 
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