import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Grid2X2, List } from "lucide-react";
import { useState, useEffect } from "react";
import type { Game, Score } from "@shared/schema";
import ShareScore from "@/components/share-score";
import { TrophyIcon } from "@/components/trophy-icon";

import { formatDate, formatTime } from "@/lib/formatters";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";

export default function Leaderboard() {
  const { gameId } = useParams();
  const id = parseInt(gameId || "0");
  const { venueSettings } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [, setLocation] = useLocation();
  
  // Animation state for marquee overlay
  const [overlayAnimation, setOverlayAnimation] = useState<string>("");
  const [animationKey, setAnimationKey] = useState(0);
  const [marqueeBlurred, setMarqueeBlurred] = useState(false);
  
  // Handle marquee image click - navigate back to home
  const handleMarqueeClick = () => {
    setLocation("/");
  };

  // Array of faster animations with reduced travel distance (50% faster than before)
  const animations = [
    "animate-[overlayGrowShrink_0.36s_ease-in-out]",
    "animate-[overlayJello_0.33s_ease-in-out]",
    "animate-[overlaySkewWobble_0.4s_ease-in-out]",
    "animate-[overlayPulseScale_0.28s_ease-in-out]",
    "animate-[overlayElastic_0.46s_ease-out]",
    "animate-[overlayBreath_0.55s_ease-in-out]",
    "animate-[overlaySquish_0.36s_ease-in-out]",
    "animate-[overlayGlow_0.46s_ease-in-out]"
  ];

  const { data: game, isLoading: gameLoading } = useQuery<Game>({
    queryKey: [`/api/games/${id}`],
  });

  const { data: scores, isLoading: scoresLoading } = useQuery<Score[]>({
    queryKey: [`/api/games/${id}/scores`],
  });

  // Set up random animation timer for overlay
  useEffect(() => {
    if (!game?.overlayImageUrl) return;

    const triggerRandomAnimation = () => {
      const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
      setOverlayAnimation(randomAnimation);
      setAnimationKey(prev => prev + 1);
      
      // Blur marquee image when overlay animation starts
      setMarqueeBlurred(true);
      
      // Clear animation and remove blur after it completes
      setTimeout(() => {
        setOverlayAnimation("");
        setMarqueeBlurred(false);
      }, 1250);
    };

    // Trigger first animation after a random delay (8-15 seconds)
    const initialDelay = Math.random() * 7000 + 8000;
    const initialTimer = setTimeout(triggerRandomAnimation, initialDelay);

    // Set up recurring animations every 20-30 seconds
    const recurringTimer = setInterval(() => {
      triggerRandomAnimation();
    }, Math.random() * 10000 + 20000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(recurringTimer);
    };
  }, [game?.overlayImageUrl]);

  if (gameLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!game) {
    return <div>Game not found</div>;
  }

  const isLoading = scoresLoading;

  // Always sort by score (highest to lowest) and exclude the champion (first place)
  const sortedScores = [...(scores || [])].sort((a, b) => b.score - a.score);
  const nonChampionScores = sortedScores.slice(1); // Start from 2nd place

  return (
    <div 
      className="space-y-8"
      style={{
        '--titlebox-spacing': `${parseInt(venueSettings?.titleboxSpacing || "20")}px`
      } as React.CSSProperties}
    >
      {/* Game Marquee Header - Full Width */}
      <div className="mb-8 w-full">
        {game.imageUrl && (
          <div className="relative w-full">
            <div 
              className="relative w-full aspect-[792/214] rounded-[10px] overflow-hidden transition-all duration-300 group cursor-pointer hover:opacity-90"
              onClick={handleMarqueeClick}
            >
              <img 
                src={game.imageUrl || ''} 
                alt={game.name} 
                className="w-full h-full object-cover rounded-[10px] brightness-125"
                style={{
                  filter: marqueeBlurred ? 'blur(2px)' : 'blur(0px)',
                  transition: 'filter 0.3s ease-in-out'
                }}
              />
              
              {/* Overlay Image with Random Animations and Floating Effect */}
              {game.overlayImageUrl && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <img
                    key={animationKey}
                    src={game.overlayImageUrl}
                    alt={`${game.name} overlay`}
                    className={cn(
                      "w-full h-full object-cover",
                      overlayAnimation,
                      // Add continuous floating when no animation is active
                      !overlayAnimation && "animate-[overlayFloat_4s_ease-in-out_infinite]"
                    )}
                    style={{ 
                      filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.5))",
                      zIndex: 10
                    }}
                  />
                </div>
              )}
              {/* Lighter overlay for better brightness */}
              <div className="absolute inset-0 bg-black/30 rounded-[10px]" style={{ zIndex: 20 }}></div>
              
              {/* Desktop text overlay */}
              <div className="hidden sm:absolute sm:inset-0 sm:flex sm:items-center p-6 sm:pl-[30px]" style={{ zIndex: 30 }}>
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
                    {(game.currentHighScore ?? 0) > 0 && (
                      <img 
                        src="/badge1.png" 
                        alt="Champion Badge" 
                        className="w-24 h-24 object-contain drop-shadow-lg animate-float" 
                      />
                    )}
                    <div className="flex flex-col">
                      <p className="text-xl sm:text-2xl text-white font-bold uppercase drop-shadow-lg"
                         style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)', letterSpacing: '2px' }}>
                        #1 {game.topScorerName || "NO CHAMPION YET"}
                      </p>
                      <p className="text-lg sm:text-xl text-yellow-400 font-bold drop-shadow-lg"
                         style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                        {(game.currentHighScore ?? 0) > 0 
                          ? (game.currentHighScore ?? 0).toLocaleString()
                          : "000,000"
                        }
                      </p>
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
        
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-center space-x-2 mb-6">
        <Button variant="outline" size="sm" asChild className="h-8 px-3">
          <Link href="/">Home</Link>
        </Button>
        <Button variant="outline" size="sm" asChild className="h-8 px-3">
          <Link href="/scan">Scan</Link>
        </Button>
        <Button variant="outline" size="sm" asChild className="h-8 px-3">
          <Link href="/admin">Admin</Link>
        </Button>
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
                    <h3 className="font-semibold text-3xl">{score.playerName}</h3>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(new Date(score.submittedAt))} {formatTime(new Date(score.submittedAt))}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-primary tabular-nums">
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
                <div className="grid grid-cols-4 gap-4 items-center">
                  {/* Marquee Image Column */}
                  <div className="flex justify-center">
                    {game.imageUrl ? (
                      <img 
                        src={game.imageUrl} 
                        alt={game.name}
                        className="w-24 h-auto object-contain rounded-[10px]"
                        style={{ transform: 'scale(1.5)' }}
                      />
                    ) : (
                      <div className="w-24 h-16 bg-muted rounded-[10px] flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">No Image</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Rank Column */}
                  <div className="flex justify-center">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                      #{index + 2}
                    </div>
                  </div>
                  
                  {/* Champion Name Column */}
                  <div className="text-center">
                    <h3 className="font-semibold text-2xl">{score.playerName}</h3>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(new Date(score.submittedAt))} {formatTime(new Date(score.submittedAt))}
                    </p>
                  </div>
                  
                  {/* Score Column */}
                  <div className="flex items-center justify-center gap-4">
                    <p className="text-3xl font-bold text-primary tabular-nums">
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