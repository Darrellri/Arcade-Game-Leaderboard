import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Game, VenueSettings } from "@shared/schema";
import { Button } from "@/components/ui/button";
import GameCard from "@/components/game-card";
import ShareScore from "@/components/share-score";
import { Skeleton } from "@/components/ui/skeleton";
import { Gamepad2, Grid2X2, List, CircleDot, Trophy, GripVertical } from "lucide-react";
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

type ViewMode = "grid" | "list";

// Sortable list item component for drag-and-drop
function SortableGameListItem({ game }: { game: Game }) {
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
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 section-background rounded-2xl hover:bg-primary/15 transition-all duration-300 w-full group cursor-pointer">
          
          {/* Drag handle - only visible in admin mode */}
          <div 
            {...attributes}
            {...listeners}
            className="flex items-center mr-3 cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 transition-opacity"
            onClick={(e) => e.preventDefault()}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Left side - Game info */}
          <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
            <img 
              src="/badge.png" 
              alt="Champion Badge" 
              className="w-8 h-8 md:w-10 md:h-10 object-contain opacity-80 flex-shrink-0" 
            />
            <div className="flex flex-col min-w-0">
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
              <div className="text-xs md:text-sm text-muted-foreground/80 truncate">
                {game.topScorerName || 'No champion yet'} • {game.topScoreDate ? formatDate(new Date(game.topScoreDate)) : 'No date'}
              </div>
            </div>
          </div>

          {/* Right side - Score and share button */}
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <div className="text-right">
              <div className="font-bold text-lg md:text-xl text-primary">
                {game.currentHighScore?.toLocaleString() || '0'}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">
                HIGH SCORE
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <ShareScore 
                game={game} 
                variant="ghost" 
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-primary/20"
              />
              <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-primary/20 flex items-center justify-center">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary"></div>
              </div>
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
    queryKey: ["/api/games"],
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
        <div className="flex items-center gap-4">
          {(venueSettings?.animatedLogoUrl || venueSettings?.logoUrl) && (
            <div 
              className={`logo-container flex-shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity ${
                venueSettings.hideLogoBorderShadow === 'true' 
                  ? '' 
                  : 'rounded-md shadow-md border border-primary/20'
              }`}
              style={{ 
                width: '200px', 
                height: '100px',
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
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground uppercase text-outline" style={{ letterSpacing: '2px' }}>
              {venueSettings?.leaderboardName || "THE LEADERBOARD"}
            </h1>
            <h2 className="text-lg md:text-2xl font-bold tracking-tight text-primary uppercase" style={{ letterSpacing: '4px' }}>
              {venueSettings?.name || "Arcade"}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 sm:mt-0">
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
      </div>
      
      {/* Smaller navigation buttons */}
      <div className="flex justify-end space-x-2 mb-4">
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

      {viewMode === "grid" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
            <div className="space-y-1 w-full">
              {localGames?.map((game) => (
                <SortableGameListItem key={game.id} game={game} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}