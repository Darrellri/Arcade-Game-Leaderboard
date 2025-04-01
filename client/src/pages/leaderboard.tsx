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
      <div className="relative mb-6">
        <div className="w-full h-[180px] relative overflow-hidden rounded-lg">
          {game.imageUrl ? (
            <div className="w-full h-full bg-black rounded-lg flex items-center justify-center">
              <img 
                src={game.imageUrl} 
                alt={`${game.name} marquee`}
                className="w-auto h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-primary/20 to-primary/40 rounded-lg">
              <h2 className="text-2xl md:text-3xl font-bold tracking-wider text-center px-4 uppercase bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-foreground border-2 border-primary/60 rounded-[15px] p-3 inline-block">
                {game.name}
              </h2>
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight uppercase text-white truncate max-w-[80%] border-2 border-white/60 rounded-[15px] p-3 inline-block">
                {game.name}
              </h1>
              <p className="text-white/80 mt-1">{game.subtitle}</p>
              <p className="text-white/80 mt-1 border-2 border-white/60 rounded-[15px] p-3 inline-block">Top Scores</p>
            </div>
            <Button variant="outline" asChild className="bg-white/10 hover:bg-white/20 border-white/20 text-white">
              <Link href="/">
                <span className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="m15 18-6-6 6-6"/>
                  </svg>
                  Back
                </span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Button
          variant={viewMode === "grid" ? "default" : "outline"}
          size="icon"
          onClick={() => setViewMode("grid")}
        >
          <Grid2X2 className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === "list" ? "default" : "outline"}
          size="icon"
          onClick={() => setViewMode("list")}
        >
          <List className="h-4 w-4" />
        </Button>
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
            <Card key={score.id} className={index === 0 ? "border-2 border-yellow-500" : ""}>
              <CardContent className="pt-6">
                {index === 0 ? (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="inline-flex items-center justify-center p-1.5 bg-yellow-500/20 text-yellow-500 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
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
                    <div className="text-2xl font-bold text-yellow-500 border-2 border-yellow-500 rounded-[15px] p-3 inline-block">CHAMPION</div>
                  </div>
                ) : (
                  <div className="text-2xl font-bold mb-2 border-2 border-gray-500 rounded-[15px] p-3 inline-block">#{index + 1}</div>
                )}
                <div className="text-xl">{score.playerName}</div>
                <div className={`text-3xl font-mono mt-2 ${index === 0 ? "text-yellow-500" : ""}`}>
                  {score.score.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {formatDate(new Date(score.submittedAt!))}
                  <span className="italic ml-2">
                    ({formatTime(new Date(score.submittedAt!))})
                  </span>
                </div>
                <div className="mt-4">
                  <ShareScore game={game} score={score} variant="outline" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {sortedScores.map((score, index) => (
            <div
              key={score.id}
              className="flex items-center justify-between p-4 bg-card rounded-lg"
            >
              <div className="flex items-center gap-4">
                {index === 0 ? (
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center justify-center p-1 bg-yellow-500/20 text-yellow-500 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
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
                    <span className="text-xl font-bold text-yellow-500 border-2 border-yellow-500 rounded-[15px] p-3 inline-block">CHAMPION</span>
                  </div>
                ) : (
                  <div className="text-xl font-bold border-2 border-gray-500 rounded-[15px] p-3 inline-block">#{index + 1}</div>
                )}
                <div>
                  <div className={`font-medium ${index === 0 ? "text-yellow-500" : ""}`}>{score.playerName}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(new Date(score.submittedAt!))}
                    <span className="italic ml-2">
                      ({formatTime(new Date(score.submittedAt!))})
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xl font-mono flex items-center gap-1"> {/* Added trophy icon */}
                  {index === 0 && <TrophyIcon size={20} />}
                  {score.score.toLocaleString()}
                </div>
                <ShareScore game={game} score={score} size="sm" variant="outline" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}