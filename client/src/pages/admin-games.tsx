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

// Sortable table row component for admin game management
function SortableGameTableRow({ game, onGameEdit, onDelete, onImageUpload, onImageDelete }: { 
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
    <TableRow ref={setNodeRef} style={style} className={game.hidden ? "opacity-50 bg-muted/30" : ""}>
      <TableCell className="p-2">
        <div className="flex items-center gap-2">
          <div 
            {...attributes} 
            {...listeners}
            className="cursor-grab hover:cursor-grabbing p-1 hover:bg-muted rounded"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2">
            {game.type === 'pinball' ? (
              <CircleDot className="h-4 w-4 text-primary" />
            ) : (
              <Gamepad2 className="h-4 w-4 text-primary" />
            )}
            <span className="font-medium text-sm">{game.name}</span>
          </div>
        </div>
      </TableCell>
      
      <TableCell className="p-2">
        <input
          type="text"
          value={game.subtitle || ""}
          onChange={(e) => onGameEdit(game.id, "subtitle", e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded h-6"
          placeholder="Subtitle (optional)"
        />
      </TableCell>
      
      <TableCell className="p-2">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id={`arcade-${game.id}`}
              name={`type-${game.id}`}
              value="arcade"
              checked={game.type === "arcade"}
              onChange={() => onGameEdit(game.id, "type", "arcade")}
              className="w-3 h-3 text-primary focus:ring-primary"
            />
            <label htmlFor={`arcade-${game.id}`} className="flex items-center gap-1 text-xs cursor-pointer">
              <Gamepad2 className="h-3 w-3" />
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
              className="w-3 h-3 text-primary focus:ring-primary"
            />
            <label htmlFor={`pinball-${game.id}`} className="flex items-center gap-1 text-xs cursor-pointer">
              <CircleDot className="h-3 w-3" />
              Pinball
            </label>
          </div>
        </div>
      </TableCell>
      
      <TableCell className="p-2">
        <div className="space-y-1">
          <MarqueeImageUploader 
            gameId={game.id}
            currentImageUrl={game.imageUrl}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/games"] });
            }}
          />
          <OverlayImageUploader 
            gameId={game.id}
            currentOverlayUrl={game.overlayImageUrl}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/games"] });
            }}
          />
        </div>
      </TableCell>
      
      <TableCell className="p-2">
        <div className="space-y-1">
          {game.hidden && (
            <div className="text-center text-xs text-muted-foreground">
              Not Displayed
            </div>
          )}
          <Button 
            variant={game.hidden ? "outline" : "secondary"} 
            size="sm"
            className="w-full text-xs h-6"
            onClick={() => onGameEdit(game.id, "hidden", !game.hidden)}
          >
            {game.hidden ? "Show" : "Hide"}
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            className="w-full text-xs h-6"
            onClick={() => {
              if (window.confirm(`Delete ${game.name}? This will remove the game and all scores.`)) {
                onDelete(game.id);
              }
            }}
          >
            Delete
          </Button>
        </div>
      </TableCell>
    </TableRow>
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
    fontFamily: venueSettings?.nameFont || "Arial",
    fontWeight: venueSettings?.nameFontStyle === "bold" ? "bold" : "normal",
    fontStyle: venueSettings?.nameFontStyle === "italic" ? "italic" : "normal",
    fontSize: `${venueSettings?.nameFontSize || 30}pt`,
    letterSpacing: '2px',
    lineHeight: 'calc(1.25em + 2px)',
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
            // For dark schemes, use a lighter purple color
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
          
          {/* Row 2: Leaderboard Name */}
          <div className="mb-2">
            <h1 className="font-black tracking-tight text-foreground uppercase text-outline leading-tight text-center" 
                style={{...getLeaderboardTitleStyle(), fontSize: '16px'}}>
              {venueSettings?.leaderboardName || "THE LEADERBOARD"}
            </h1>
          </div>
          
          {/* Row 3: Venue Name */}
          <div className="mb-3">
            <h2 
              className={`tracking-tight leading-tight text-center ${
                venueSettings?.subtitleBold === "true" ? "font-bold" : "font-normal"
              } ${
                venueSettings?.subtitleAllCaps === "true" ? "uppercase" : ""
              }`}
              style={{...getVenueNameStyle(), fontSize: '14px'}}
            >
              {venueSettings?.name || "Arcade"}
            </h2>
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
          
          {/* Center Content Area - Titles centered from marquee position */}
          <div className="flex-1 min-w-0 flex flex-col justify-center px-4">
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-foreground uppercase text-outline leading-tight text-center" style={getLeaderboardTitleStyle()}>
              {venueSettings?.leaderboardName || "THE LEADERBOARD"}
            </h1>
            <h2 
              className={`text-2xl lg:text-[2.625rem] tracking-tight leading-tight text-center ${
                venueSettings?.subtitleBold === "true" ? "font-bold" : "font-normal"
              } ${
                venueSettings?.subtitleAllCaps === "true" ? "uppercase" : ""
              }`}
              style={getVenueNameStyle()}
            >
              {venueSettings?.name || "Arcade"}
            </h2>
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

      {/* Games Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Gamepad2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-lg font-bold">Game Library</div>
              <CardDescription>
                Manage your arcade and pinball games. Drag to reorder, edit details, and upload marquee images.
              </CardDescription>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Game Form */}
          <div className="border rounded-lg p-4 bg-muted/20">
            <h3 className="font-semibold mb-4 text-primary">Add New Game</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-4 items-end flex-wrap">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex-1 min-w-[200px]">
                      <FormLabel>Game Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter game name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="min-w-[120px]">
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
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
                <Button type="submit" disabled={addGame.isPending}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Game
                </Button>
              </form>
            </Form>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="displayOrder">Display Order</SelectItem>
                <SelectItem value="name">Game Name</SelectItem>
                <SelectItem value="type">Game Type</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Games Table */}
          <div className="border rounded-lg overflow-hidden">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredAndSortedGames.map(g => g.id)}
                strategy={verticalListSortingStrategy}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Game</TableHead>
                      <TableHead className="text-center">Subtitle</TableHead>
                      <TableHead className="text-center">Type</TableHead>
                      <TableHead className="text-center">Marquee Images</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedGames.map((game) => (
                      <SortableGameTableRow
                        key={game.id}
                        game={game}
                        onGameEdit={handleGameEdit}
                        onDelete={handleGameDelete}
                        onImageUpload={() => {}}
                        onImageDelete={() => {}}
                      />
                    ))}
                  </TableBody>
                </Table>
              </SortableContext>
            </DndContext>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{filteredAndSortedGames.length} total games</span>
            <span>
              {filteredAndSortedGames.filter(g => !g.hidden).length} visible, {' '}
              {filteredAndSortedGames.filter(g => g.hidden).length} hidden
            </span>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}