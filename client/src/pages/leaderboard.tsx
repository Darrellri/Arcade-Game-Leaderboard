import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Game, Score } from "@shared/schema";
import ShareScore from "@/components/share-score";
import { TrophyIcon } from "@/components/trophy-icon";

import { formatDate, formatTime } from "@/lib/formatters";

export default function Leaderboard() {
  const { gameId } = useParams();
  const id = parseInt(gameId || "0");
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
      {/* Game Marquee Display - Full Size 792x214px */}
      <div className="mb-8">
        <div className="w-full h-[214px] relative bg-black border-b border-primary/20 shadow-lg overflow-hidden">
          {/* Full size marquee image as background */}
          {game.imageUrl && (
            <div className="absolute inset-0">
              <img 
                src={game.imageUrl} 
                alt={game.name} 
                className="w-full h-full object-cover"
              />
              {/* Gradient overlay to ensure text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>
            </div>
          )}

          {/* Main content overlay */}
          <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6">
            <div className="flex justify-between items-start">
              <Button 
                variant="outline" 
                size="sm"
                asChild 
                className="bg-black/30 border-white/20 text-white hover:bg-black/50 shadow-md"
              >
                <Link href="/">
                  <span className="flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Games
                  </span>
                </Link>
              </Button>
              
              <ShareScore 
                game={game} 
                variant="outline" 
                size="sm" 
                className="bg-black/30 border-white/20 text-white hover:bg-black/50 shadow-md" 
              />
            </div>
            
            <div className="mt-auto">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight uppercase text-white text-shadow-lg">{game.name}</h1>
              {game.subtitle && (
                <p className="text-xl text-white/90 mt-1 text-shadow-md">{game.subtitle}</p>
              )}
              <p className="text-lg text-white/90 mt-2 font-bold text-shadow-sm uppercase">
                High Scores
              </p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : (
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
        <div className="space-y-3">
          {sortedScores.map((score, index) => (
            <div
              key={score.id}
              className="list-item flex items-center justify-between p-4 bg-card rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                {index === 0 ? (
                  <div className="flex items-center gap-2">
                    <div className="champion-icon p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                    <span className="text-xl font-bold champion-badge">CHAMPION</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="bg-secondary/50 size-8 rounded-full flex items-center justify-center">
                      {index + 1}
                    </div>
                  </div>
                )}
                <div>
                  <div className={`font-medium text-lg ${index === 0 ? "champion-badge" : ""}`}>{score.playerName}</div>
                  <div className="subtitle">
                    {formatDate(new Date(score.submittedAt!))}
                    <span className="italic ml-2">
                      ({formatTime(new Date(score.submittedAt!))})
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`text-xl score-display flex items-center gap-1 ${index === 0 ? "champion-badge" : ""}`}>
                  {score.score.toLocaleString()}
                </div>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="shadow-sm hover:shadow-md font-medium"
                >
                  <ShareScore 
                    game={game} 
                    score={score} 
                    size="sm" 
                    variant="secondary" 
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