import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
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
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Game, VenueSettings, InsertGame } from "@shared/schema";
import { insertGameSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  PlusCircle,
  Gamepad2,
  CircleDot,
  ArrowLeft,
  GripVertical,
  Square,
  List,
  Grid2X2,
} from "lucide-react";
import MarqueeImageUploader from "@/components/marquee-image-uploader";
import OverlayImageUploader from "@/components/overlay-image-uploader";

// Sortable card component for admin game management - mobile-friendly
function SortableGameCard({ game, onGameEdit, onDelete, onImageUpload, onImageDelete }: { 
  game: Game; 
  onGameEdit: (id: number, field: string, value: string | boolean) => void;
  onDelete: (id: number) => void;
  onImageUpload: (gameId: number) => void;
  onImageDelete: (gameId: number, imageType: 'marquee' | 'overlay') => void;
}) {
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
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={`${game.hidden ? "opacity-50 bg-muted/30" : ""} ${isDragging ? "shadow-lg z-50" : ""}`}
    >
      <CardContent className="p-4 space-y-4">
        {/* Header with drag handle and game info */}
        <div className="flex items-center gap-3">
          <div 
            {...attributes} 
            {...listeners}
            className="cursor-grab hover:cursor-grabbing p-2 hover:bg-muted rounded flex-shrink-0"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              {game.type === 'pinball' ? (
                <CircleDot className="h-6 w-6 text-primary" />
              ) : (
                <Gamepad2 className="h-6 w-6 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{game.name}</h3>
              {game.hidden && (
                <p className="text-sm text-muted-foreground">Hidden from display</p>
              )}
            </div>
          </div>
        </div>

        {/* Subtitle editing */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Subtitle</label>
          <Input
            type="text"
            value={game.subtitle || ""}
            onChange={(e) => onGameEdit(game.id, "subtitle", e.target.value)}
            placeholder="Enter subtitle (optional)"
            className="text-sm"
          />
        </div>

        {/* Game type selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Game Type</label>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`arcade-${game.id}`}
                name={`type-${game.id}`}
                value="arcade"
                checked={game.type === "arcade"}
                onChange={() => onGameEdit(game.id, "type", "arcade")}
                className="w-4 h-4 text-primary focus:ring-primary"
              />
              <label htmlFor={`arcade-${game.id}`} className="flex items-center gap-2 text-sm cursor-pointer">
                <Gamepad2 className="h-4 w-4" />
                Arcade
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`pinball-${game.id}`}
                name={`type-${game.id}`}
                value="pinball"
                checked={game.type === "pinball"}
                onChange={() => onGameEdit(game.id, "type", "pinball")}
                className="w-4 h-4 text-primary focus:ring-primary"
              />
              <label htmlFor={`pinball-${game.id}`} className="flex items-center gap-2 text-sm cursor-pointer">
                <CircleDot className="h-4 w-4" />
                Pinball
              </label>
            </div>
          </div>
        </div>

        {/* Images Side by Side */}
        <div className="flex flex-wrap gap-4">
          {/* Marquee Image */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Marquee</label>
            <div className="w-[300px] max-w-full aspect-[3/1] bg-black/20 rounded-lg overflow-hidden border border-primary/20">
              {game.imageUrl ? (
                <img 
                  src={game.imageUrl} 
                  alt={game.name} 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  No image
                </div>
              )}
            </div>
            <MarqueeImageUploader 
              gameId={game.id}
              currentImageUrl={game.imageUrl}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/games"] });
              }}
            />
          </div>

          {/* Overlay Image */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Overlay</label>
            <div className="w-[300px] max-w-full aspect-[3/1] bg-black/20 rounded-lg overflow-hidden border border-primary/20">
              {game.overlayImageUrl ? (
                <img 
                  src={game.overlayImageUrl} 
                  alt={`${game.name} overlay`} 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  No image
                </div>
              )}
            </div>
            <OverlayImageUploader 
              gameId={game.id}
              currentOverlayUrl={game.overlayImageUrl}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/games"] });
              }}
            />
          </div>
        </div>

        {/* Action buttons - fixed height, no stretch */}
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={game.hidden ? "outline" : "secondary"} 
            size="sm"
            className="h-9"
            onClick={() => onGameEdit(game.id, "hidden", !game.hidden)}
          >
            {game.hidden ? "Show Game" : "Hide Game"}
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            className="h-9"
            onClick={() => {
              if (window.confirm(`Delete ${game.name}? This will remove the game and all scores.`)) {
                onDelete(game.id);
              }
            }}
          >
            Delete Game
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminGames() {
  const { toast } = useToast();
  
  // State for sorting
  const [sortBy, setSortBy] = useState("displayOrder");

  // Fetch venue settings for header logo
  const { data: venueSettings } = useQuery<VenueSettings>({
    queryKey: ["/api/admin/settings"],
  });

  // Font styling functions
  const getVenueNameStyle = () => ({
    fontFamily: venueSettings?.nameFont || "'Oswald', 'Impact', 'Arial Black', sans-serif",
    fontWeight: venueSettings?.nameFontStyle === "bold" ? "900" : "700",
    fontStyle: venueSettings?.nameFontStyle === "italic" ? "italic" : "normal",
    letterSpacing: '0.08em',
    lineHeight: '1.1',
    whiteSpace: 'nowrap' as const,
    color: venueSettings?.subtitleWhite === "true" 
      ? "white" 
      : (() => {
          const isLightScheme = venueSettings?.theme?.appearance === "light" || 
            (venueSettings?.theme?.variant === "tint" && venueSettings?.theme?.appearance !== "dark") ||
            (venueSettings?.theme?.primary && parseInt(venueSettings.theme.primary.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)?.[3] || "0") > 60);
          
          if (isLightScheme) {
            return venueSettings?.theme?.primary || "hsl(280, 100%, 50%)";
          } else {
            return "hsl(280, 100%, 75%)";
          }
        })()
  });

  const getLeaderboardTitleStyle = () => ({
    fontFamily: venueSettings?.leaderboardFont || "Arial",
    fontWeight: venueSettings?.leaderboardFontStyle === "bold" ? "bold" : "normal",
    fontStyle: venueSettings?.leaderboardFontStyle === "italic" ? "italic" : "normal",
    fontSize: `${venueSettings?.leaderboardFontSize || 30}pt`,
    letterSpacing: '1px'
  });

  // Mutation for updating settings
  const updateSettingsMutation = useMutation({
    mutationFn: (data: { theme: any }) => 
      apiRequest("PATCH", "/api/admin/settings", data).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Theme Updated",
        description: "Color scheme has been applied successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  // Function to cycle through color schemes
  const cycleColorScheme = () => {
    if (!venueSettings?.themePresets) return;
    
    const currentTheme = venueSettings.theme;
    const presets = venueSettings.themePresets;
    
    const currentIndex = presets.findIndex(preset => 
      preset.primary === currentTheme.primary && 
      preset.variant === currentTheme.variant
    );
    
    const nextIndex = (currentIndex + 1) % presets.length;
    const nextTheme = presets[nextIndex];
    
    updateSettingsMutation.mutate({ theme: nextTheme });
  };

  // Fetch games for admin view (include hidden games)
  const { data: games, isLoading: gamesLoading } = useQuery<Game[]>({
    queryKey: ["/api/games", { includeHidden: true }],
    queryFn: () => apiRequest("GET", "/api/games?includeHidden=true").then(res => res.json()),
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Local state for games
  const [localGames, setLocalGames] = useState<Game[]>([]);

  // Initialize local games when data loads
  useEffect(() => {
    if (games) {
      setLocalGames(games);
    }
  }, [games]);

  // Sort games (no filtering - show all games)
  const filteredAndSortedGames = localGames.sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "type") return a.type.localeCompare(b.type);
    return (a.displayOrder || 0) - (b.displayOrder || 0);
  });

  // Form setup for adding new games
  const form = useForm<InsertGame>({
    resolver: zodResolver(insertGameSchema),
    defaultValues: {
      name: "",
      type: "arcade",
      hidden: false,
    },
  });

  // Add game mutation
  const addGame = useMutation({
    mutationFn: async (data: InsertGame) => {
      const response = await apiRequest("POST", "/api/games", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      form.reset();
      toast({
        title: "Game Added",
        description: "New game has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  // Update game mutation
  const updateGame = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Game> }) => {
      const response = await apiRequest("PATCH", `/api/games/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive", 
        title: "Error",
        description: error.message,
      });
    },
  });

  // Delete game mutation
  const deleteGame = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/games/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({
        title: "Game Deleted",
        description: "Game has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error", 
        description: error.message,
      });
    },
  });

  // Update game order mutation  
  const updateGameOrder = useMutation({
    mutationFn: async (gameOrders: { id: number; displayOrder: number }[]) => {
      const response = await apiRequest("POST", "/api/games/reorder", { gameOrders });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({
        title: "Order Updated",
        description: "Game order has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  // Handle drag end for game reordering
  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setLocalGames((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update display orders
        const gameOrders = newItems.map((game, index) => ({
          id: game.id,
          displayOrder: index
        }));
        
        updateGameOrder.mutate(gameOrders);
        
        return newItems;
      });
    }
  }

  // Handle game field edits
  const handleGameEdit = (id: number, field: string, value: string | boolean) => {
    updateGame.mutate({ 
      id, 
      data: { [field]: value } 
    });
  };

  // Handle game deletion
  const handleGameDelete = (id: number) => {
    deleteGame.mutate(id);
  };

  // Handle form submission
  const onSubmit = async (data: InsertGame) => {
    addGame.mutate(data);
  };

  if (gamesLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div 
      className="space-y-2 min-h-screen flex flex-col"
      style={{
        '--titlebox-spacing': `${parseInt(venueSettings?.titleboxSpacing || "20")}px`
      } as React.CSSProperties}
    >
      {/* Header with venue name and admin controls */}
      <div className="themed-header px-5 py-4 rounded-lg mb-2 w-full">
        
        {/* Mobile Layout: 3 Rows (visible on small screens only) */}
        <div className="block md:hidden">
          {/* Row 1: Logos evenly spaced */}
          <div className="flex items-center justify-between mb-3">
            {/* Left: Venue Logo */}
            <div className="flex-1 flex justify-start">
              {(venueSettings?.animatedLogoUrl || venueSettings?.logoUrl) && (
                <div 
                  className={`logo-container overflow-hidden cursor-pointer hover:opacity-80 transition-opacity w-20 h-10 flex items-center justify-center ${
                    venueSettings.hideLogoBorderShadow === 'true' 
                      ? '' 
                      : 'rounded-md shadow-md border border-primary/20'
                  }`}
                  style={{ 
                    backgroundColor: 
                      venueSettings.logoBackgroundColor === 'white' ? '#ffffff' :
                      venueSettings.logoBackgroundColor === 'black' ? '#000000' :
                      venueSettings.logoBackgroundColor === 'theme' ? 'hsl(var(--primary))' :
                      'transparent'
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
                      className="w-full h-full object-contain transparent-video" 
                    />
                  ) : (
                    <img 
                      src={venueSettings.logoUrl} 
                      alt={venueSettings.name} 
                      className="w-full h-full object-contain p-1" 
                    />
                  )}
                </div>
              )}
            </div>
            
            {/* Right: Arcade Leaderboard Logo */}
            <div className="flex-1 flex justify-end">
              <div className="w-20 h-10 flex items-center justify-center">
                <img 
                  src="/arcade-leaderboard-logo.png" 
                  alt="Arcade Leaderboard" 
                  className="max-w-full max-h-full object-contain" 
                />
              </div>
            </div>
          </div>
          
          {/* Row 2: Venue Name - Centered */}
          <div className="mb-3 w-full overflow-hidden flex items-center justify-center px-2">
            <h1 
              className={`leading-tight text-center truncate ${
                venueSettings?.subtitleBold === "true" ? "font-bold" : ""
              } ${
                venueSettings?.subtitleAllCaps === "true" ? "uppercase" : ""
              }`}
              style={{
                ...getVenueNameStyle(),
                fontSize: 'clamp(1.1rem, 5vw, 1.6rem)',
                maxWidth: '100%',
                WebkitTextStroke: '2px black',
                textShadow: '0 0 6px rgba(0,0,0,0.8), 0 0 6px rgba(0,0,0,0.8)'
              }}
            >
              {venueSettings?.name || "Arcade"}
            </h1>
          </div>
          
          {/* Controls Row for Mobile */}
          <div className="flex items-center justify-center gap-2">
            {/* View Mode Buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                asChild
                className="shadow-sm hover:shadow-md transition-all duration-200 h-[42px] w-[42px]"
                title="Single View"
              >
                <Link href="/">
                  <Square className="h-[16px] w-[16px]" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="icon"
                asChild
                className="shadow-sm hover:shadow-md transition-all duration-200 h-[42px] w-[42px]"
                title="Scroll View"
              >
                <Link href="/">
                  <List className="h-[16px] w-[16px]" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="icon"
                asChild
                className="shadow-sm hover:shadow-md transition-all duration-200 h-[42px] w-[42px]"
                title="Grid View"
              >
                <Link href="/">
                  <Grid2X2 className="h-[16px] w-[16px]" />
                </Link>
              </Button>
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex gap-1">
              <Button 
                variant="default" 
                size="sm" 
                asChild 
                className="h-[36px] px-4 text-base"
              >
                <Link href="/admin">Admin</Link>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                asChild 
                className="h-[36px] px-4 text-base"
              >
                <Link href="/admin">Back</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop Layout: Three Column Layout (visible on medium screens and up) */}
        <div className="hidden md:flex items-center w-full">
          {/* Left Venue Logo - Fixed 300px on desktop */}
          <div className="flex-shrink-0 w-[300px] flex justify-center">
            {(venueSettings?.animatedLogoUrl || venueSettings?.logoUrl) && (
              <div 
                className={`logo-container overflow-hidden cursor-pointer hover:opacity-80 transition-opacity w-[280px] h-36 flex items-center justify-center ${
                  venueSettings.hideLogoBorderShadow === 'true' 
                    ? '' 
                    : 'rounded-md shadow-md border border-primary/20'
                }`}
                style={{ 
                  backgroundColor: 
                    venueSettings.logoBackgroundColor === 'white' ? '#ffffff' :
                    venueSettings.logoBackgroundColor === 'black' ? '#000000' :
                    venueSettings.logoBackgroundColor === 'theme' ? 'hsl(var(--primary))' :
                    'transparent'
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
                    className="w-full h-full object-contain transparent-video" 
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
          </div>
          
          {/* Center Content Area - Venue Name centered */}
          <div className="flex-1 min-w-0 flex items-center justify-center px-4 overflow-hidden">
            <h1 
              className={`leading-tight text-center truncate ${
                venueSettings?.subtitleBold === "true" ? "font-bold" : ""
              } ${
                venueSettings?.subtitleAllCaps === "true" ? "uppercase" : ""
              }`}
              style={{
                ...getVenueNameStyle(),
                fontSize: 'clamp(1.5rem, 3.5vw, 3rem)',
                maxWidth: '100%',
                WebkitTextStroke: '2px black',
                textShadow: '0 0 6px rgba(0,0,0,0.8), 0 0 6px rgba(0,0,0,0.8)'
              }}
            >
              {venueSettings?.name || "Arcade"}
            </h1>
          </div>
          
          {/* Right Controls and Leaderboard Logo - Fixed 300px on desktop */}
          <div className="flex-shrink-0 w-[300px] flex justify-center">
            <div className="flex flex-col gap-2 self-center relative">
              {/* Navigation Elements */}
              <div className="flex flex-col gap-2">
                {/* View Mode Buttons Row */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    asChild
                    className="shadow-sm hover:shadow-md transition-all duration-200 h-[52px] w-[52px]"
                    title="Single View - One large game centered"
                  >
                    <Link href="/">
                      <Square className="h-[21px] w-[21px]" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    asChild
                    className="shadow-sm hover:shadow-md transition-all duration-200 h-[52px] w-[52px]"
                    title="Scroll View - Infinite vertical scroll"
                  >
                    <Link href="/">
                      <List className="h-[21px] w-[21px]" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    asChild
                    className="shadow-sm hover:shadow-md transition-all duration-200 h-[52px] w-[52px]"
                    title="Grid View - Games in a grid layout"
                  >
                    <Link href="/">
                      <Grid2X2 className="h-[21px] w-[21px]" />
                    </Link>
                  </Button>
                </div>
                
                {/* Navigation Buttons Row */}
                <div className="flex gap-2">
                  <Button 
                    variant="default" 
                    size="sm" 
                    asChild 
                    className="h-[42px] px-5 text-lg"
                  >
                    <Link href="/admin">Admin</Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    asChild 
                    className="h-[42px] px-5 text-lg"
                  >
                    <Link href="/admin">Back</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 space-y-8">

      {/* Page Title */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold uppercase tracking-wide">GAME LIBRARY</h2>
        <p className="text-muted-foreground">Add games, upload images, and drag to reorder</p>
      </div>

      {/* Add New Game - Simple & Fun */}
      <Card className="border-2 border-dashed border-primary/40 bg-primary/5">
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-4 items-center">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1 w-full sm:w-auto">
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Type game name here..." 
                        className="text-lg h-14 text-center sm:text-left font-medium"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-[140px] h-14">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="arcade">
                          <div className="flex items-center gap-2">
                            <Gamepad2 className="h-4 w-4" />
                            Arcade
                          </div>
                        </SelectItem>
                        <SelectItem value="pinball">
                          <div className="flex items-center gap-2">
                            <CircleDot className="h-4 w-4" />
                            Pinball
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={addGame.isPending} size="lg" className="h-14 px-8 text-lg">
                <PlusCircle className="h-5 w-5 mr-2" />
                ADD GAME
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{filteredAndSortedGames.length} games</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Sort:</span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="displayOrder">Display Order</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Games List */}
      <div className="space-y-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredAndSortedGames.map(g => g.id)}
            strategy={verticalListSortingStrategy}
          >
            {filteredAndSortedGames.map((game) => (
              <SortableGameCard
                key={game.id}
                game={game}
                onGameEdit={handleGameEdit}
                onDelete={handleGameDelete}
                onImageUpload={() => {}}
                onImageDelete={() => {}}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      </div>
    </div>
  );
}