import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Game, VenueSettings } from "@shared/schema";
import { Button } from "@/components/ui/button";
import GameCard from "@/components/game-card";
import ShareScore from "@/components/share-score";
import { Skeleton } from "@/components/ui/skeleton";
import { Gamepad2, Grid2X2, List, CircleDot, Trophy, GripVertical } from "lucide-react";
import ListMarquee from "@/components/list-marquee";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { formatDate, formatTime } from "@/lib/formatters";
import { useTheme } from "@/contexts/ThemeContext";

type ViewMode = "grid" | "list";

// Sortable list item component for drag-and-drop
function SortableGameListItem({ game }: { game: Game }) {
  const { venueSettings } = useTheme();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: game.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="w-full">
      <Link href={`/leaderboard/${game.id}`} className="block w-full">
        <div className="flex items-center px-4 md:px-6 py-4 md:py-5 section-background rounded-2xl hover:bg-primary/15 transition-all duration-300 w-full group cursor-pointer">
          
          {/* Drag handle - only visible in admin mode */}
          <div 
            {...attributes}
            {...listeners}
            className="flex items-center mr-3 cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 transition-opacity"
            onClick={(e) => e.preventDefault()}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Left side - Game marquee image with overlay support */}
          <ListMarquee game={game} />

          {/* Game info - Hidden on mobile, shown on larger screens */}
          <div className="hidden sm:flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {game.type === 'pinball' ? (
                <CircleDot className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
              ) : (
                <Gamepad2 className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
              )}
              <div className="font-medium text-sm md:text-lg text-foreground group-hover:text-primary transition-colors duration-200 uppercase tracking-wide truncate">
                {game.name}
              </div>
            </div>
            {game.subtitle && (
              <div className={`text-xs md:text-sm tracking-wide truncate mt-1 ${
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
              </div>
            )}
          </div>

          {/* Mobile game title - Only shown on mobile */}
          <div className="sm:hidden flex flex-col min-w-0 flex-1 mr-2">
            <div className="flex items-center gap-2">
              {game.type === 'pinball' ? (
                <CircleDot className="h-3 w-3 text-primary flex-shrink-0" />
              ) : (
                <Gamepad2 className="h-3 w-3 text-primary flex-shrink-0" />
              )}
              <div className="font-medium text-xs text-foreground group-hover:text-primary transition-colors duration-200 uppercase tracking-wide truncate">
                {game.name}
              </div>
            </div>
          </div>

          {/* Center - Champion info */}
          <div className="flex flex-col items-center text-center min-w-0 flex-1 px-1 sm:px-2">
            <div className="font-bold text-sm sm:text-lg md:text-xl text-foreground truncate">
              {game.topScorerName || 'No Champion'}
            </div>
            {game.topScoreDate && (
              <div className="text-xs text-muted-foreground">
                {formatDate(new Date(game.topScoreDate))} {formatTime(new Date(game.topScoreDate))}
              </div>
            )}
          </div>

          {/* Right side - Score */}
          <div className="flex flex-col items-end text-right flex-shrink-0">
            <div className="flex items-center gap-2">
              {(game.currentHighScore ?? 0) > 0 && (
                <img 
                  src="/badge.png" 
                  alt="Champion Badge" 
                  className="w-5 h-5 object-contain" 
                />
              )}
              <div className="font-bold text-sm sm:text-lg md:text-xl text-primary">
                {(game.currentHighScore ?? 0) > 0 
                  ? (game.currentHighScore ?? 0).toLocaleString()
                  : "000,000"
                }
              </div>
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider hidden sm:block">
              HIGH SCORE
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [localGames, setLocalGames] = useState<Game[]>([]);

  const { data: games, isLoading: gamesLoading } = useQuery<Game[]>({
    queryKey: ["/api/games", { includeHidden: false }],
    queryFn: () => apiRequest("GET", "/api/games?includeHidden=false").then(res => res.json()),
  });
  
  const { data: venueSettings, isLoading: settingsLoading } = useQuery<VenueSettings>({
    queryKey: ["/api/admin/settings"],
  });

  // Set local games when data loads
  useEffect(() => {
    if (games) {
      setLocalGames(games);
    }
  }, [games]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Mutation to update game order
  const updateGameOrder = useMutation({
    mutationFn: async (gameOrders: { id: number; displayOrder: number }[]) => {
      const res = await apiRequest("PATCH", "/api/games/reorder", { gameOrders });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
    },
  });

  // Handle drag end
  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active.id !== over.id) {
      setLocalGames((games) => {
        const oldIndex = games.findIndex((game) => game.id === active.id);
        const newIndex = games.findIndex((game) => game.id === over.id);
        
        const newGames = arrayMove(games, oldIndex, newIndex);
        
        // Update display order for all games
        const gameOrders = newGames.map((game, index) => ({
          id: game.id,
          displayOrder: index,
        }));
        
        updateGameOrder.mutate(gameOrders);
        
        return newGames;
      });
    }
  }

  // Update venue settings mutation
  const updateSettings = useMutation({
    mutationFn: async (data: Partial<VenueSettings>) => {
      const res = await apiRequest("PATCH", "/api/admin/settings", data);
      return res.json() as Promise<VenueSettings>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
  });

  // Function to cycle through color schemes
  const cycleColorScheme = () => {
    if (!venueSettings?.themePresets) return;
    
    const currentTheme = venueSettings.theme;
    const presets = venueSettings.themePresets;
    
    // Find current theme index
    const currentIndex = presets.findIndex(preset => preset.primary === currentTheme.primary);
    
    // Get next theme (cycle back to 0 if at end)
    const nextIndex = (currentIndex + 1) % presets.length;
    const nextTheme = presets[nextIndex];
    
    // Update the theme
    updateSettings.mutate({
      theme: nextTheme
    });
  };

  const isLoading = gamesLoading || settingsLoading;

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[300px]" />
        ))}
      </div>
    );
  }

  // Process games data to determine the top scores
  const processedGames = games?.map(game => {
    // Game already contains the information we need
    return {
      ...game,
      topScore: game.currentHighScore || 0,
      topScorerName: game.topScorerName || 'No scores yet',
      topScoreDate: game.topScoreDate
    };
  }) || [];


  return (
    <div className="space-y-6">
      {/* Header with venue name and view mode controls */}
      <div className="themed-header px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg mb-2 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {(venueSettings?.animatedLogoUrl || venueSettings?.logoUrl) && (
            <div 
              className={`logo-container flex-shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity w-24 h-12 sm:w-48 sm:h-24 ${
                venueSettings.hideLogoBorderShadow === 'true' 
                  ? '' 
                  : 'rounded-md shadow-md border border-primary/20'
              }`}
              style={{ 
                backgroundColor: 
                  venueSettings.logoBackgroundColor === 'white' ? '#ffffff' :
                  venueSettings.logoBackgroundColor === 'black' ? '#000000' :
                  venueSettings.logoBackgroundColor === 'theme' ? 'hsl(var(--primary))' :
                  'rgba(var(--card), 0.7)'
              }}
              onClick={cycleColorScheme}
              title="Click to cycle through color schemes"
            >
              {venueSettings.animatedLogoUrl ? (
                <video 
                  src={venueSettings.animatedLogoUrl} 
                  autoPlay 
                  loop 
                  muted
                  className="w-full h-full object-contain p-2" 
                />
              ) : (
                <img 
                  src={venueSettings.logoUrl} 
                  alt={venueSettings.name} 
                  className="w-full h-full object-contain p-2" 
                />
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-3xl font-black tracking-tight text-foreground uppercase text-outline leading-tight lg:px-5" style={{ letterSpacing: '1px' }}>
              {venueSettings?.leaderboardName || "THE LEADERBOARD"}
            </h1>
            <h2 
              className={`text-sm sm:text-lg md:text-2xl tracking-tight leading-tight lg:px-5 ${
                venueSettings?.subtitleBold === "true" ? "font-bold" : "font-normal"
              } ${
                venueSettings?.subtitleAllCaps === "true" ? "uppercase" : ""
              }`}
              style={{ 
                letterSpacing: '2px',
                color: venueSettings?.subtitleWhite === "true" 
                  ? "white" 
                  : (() => {
                      // For lighter color schemes, use primary color (same as game titles)
                      const isLightScheme = venueSettings?.theme?.appearance === "light" || 
                        (venueSettings?.theme?.variant === "tint" && venueSettings?.theme?.appearance !== "dark") ||
                        (venueSettings?.theme?.primary && parseInt(venueSettings.theme.primary.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)?.[3] || "0") > 60);
                      
                      if (isLightScheme) {
                        // Use the same color as game titles (primary color)
                        return venueSettings?.theme?.primary || "hsl(280, 100%, 50%)";
                      } else {
                        // For darker schemes, use the lighter version as before
                        return venueSettings?.theme?.primary
                          ? `hsl(${venueSettings.theme.primary.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)?.[1] || 280}, ${venueSettings.theme.primary.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)?.[2] || 100}%, ${Math.min(100, parseInt(venueSettings.theme.primary.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)?.[3] || "50") + 25)}%)`
                          : "hsl(280, 100%, 75%)";
                      }
                    })()
              }}
            >
              {venueSettings?.name || "Arcade"}
            </h2>
          </div>
        </div>
        <div className="flex items-start gap-2 self-start sm:self-center sm:items-center sm:gap-4 mt-2 sm:mt-0">
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
          
          <div className="flex space-x-2 ml-2">
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
        </div>
      </div>
      


      {viewMode === "grid" ? (
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 responsive-game-grid"
          style={{
            '--desktop-spacing': `${parseInt(venueSettings?.gameSpacing || "30")}px`,
            '--tablet-spacing': `${Math.max(12, Math.round(parseInt(venueSettings?.gameSpacing || "30") * 0.7))}px`,
            '--mobile-spacing': `${Math.max(8, Math.round(parseInt(venueSettings?.gameSpacing || "30") * 0.5))}px`,
            gap: `var(--desktop-spacing)`
          } as React.CSSProperties}
        >
          {processedGames?.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={localGames} strategy={verticalListSortingStrategy}>
            <div 
              className="w-full flex flex-col responsive-game-list"
              style={{
                '--desktop-spacing': `${parseInt(venueSettings?.gameSpacing || "30")}px`,
                '--tablet-spacing': `${Math.max(8, Math.round(parseInt(venueSettings?.gameSpacing || "30") * 0.6))}px`,
                '--mobile-spacing': `${Math.max(6, Math.round(parseInt(venueSettings?.gameSpacing || "30") * 0.4))}px`,
                gap: `var(--desktop-spacing)`
              } as React.CSSProperties}
            >
              {localGames?.map((game) => (
                <SortableGameListItem key={game.id} game={game} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
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