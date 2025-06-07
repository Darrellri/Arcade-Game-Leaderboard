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
import { RetroButton } from "@/components/ui/retro-button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ParticleBurst, ShootingStar } from "@/components/ui/particle-burst";
import { FloatingScore } from "@/components/ui/floating-score";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import type { Game, VenueSettings, InsertGame } from "@shared/schema";
import { insertGameSchema } from "@shared/schema";
import { insertVenueSettingsSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  PlusCircle,
  Settings,
  Gamepad2,
  CircleDot,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Upload,
  Camera,
  Info,
  Building2,
  GripVertical,
  Palette,
  Sun,
  Moon,
  AlertCircle
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import MarqueeImageUploader from "@/components/marquee-image-uploader";
import OverlayImageUploader from "@/components/overlay-image-uploader";

// Helper functions for color conversion
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h! /= 6;
  }

  return { h: h!, s, l };
}

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

export default function Admin() {
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [animatedLogoPreview, setAnimatedLogoPreview] = useState<string | null>(null);
  const [isUploadingAnimatedLogo, setIsUploadingAnimatedLogo] = useState(false);
  
  // State for sorting
  const [sortBy, setSortBy] = useState("displayOrder");
  
  // State for confirmation dialogs
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
  const [showRestoreDataDialog, setShowRestoreDataDialog] = useState(false);
  const [clearDataConfirmation, setClearDataConfirmation] = useState("");
  const [restoreDataConfirmation, setRestoreDataConfirmation] = useState("");

  // Local state for background override functionality
  const [localBackgroundOverride, setLocalBackgroundOverride] = useState(false);
  const [localAppearance, setLocalAppearance] = useState<"dark" | "light">("dark");
  const [localDarknessLevel, setLocalDarknessLevel] = useState(20); // 0-100 scale
  const [localCustomBackgroundColor, setLocalCustomBackgroundColor] = useState('#000000');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch venue settings
  const { data: venueSettings, isLoading: settingsLoading } = useQuery<VenueSettings>({
    queryKey: ["/api/admin/settings"],
  });

  // Fetch games for admin view (include hidden games)
  const { data: games, isLoading: gamesLoading } = useQuery<Game[]>({
    queryKey: ["/api/games", { includeHidden: true }],
    queryFn: () => apiRequest("GET", "/api/games?includeHidden=true").then(res => res.json()),
  });

  // Initialize local state when venue settings load
  useEffect(() => {
    if (venueSettings) {
      setLocalBackgroundOverride(venueSettings.backgroundOverride || false);
      setLocalAppearance(venueSettings.theme.appearance as "dark" | "light");
      setLocalDarknessLevel(venueSettings.theme.appearance === 'dark' ? 20 : 80);
      setLocalCustomBackgroundColor(venueSettings.customBackgroundColor || '#000000');
      setHasUnsavedChanges(false);
      
      console.log("Initialized background override:", venueSettings.backgroundOverride);
    }
  }, [venueSettings]);

  // Form setup for venue settings
  const form = useForm<VenueSettings>({
    resolver: zodResolver(insertVenueSettingsSchema),
    defaultValues: {
      name: "",
      leaderboardName: "",
      address: "",
      logoUrl: "",
      animatedLogoUrl: "",
      logoBackgroundColor: "transparent",
      hideLogoBorderShadow: "false",
      theme: {
        primary: "hsl(280, 100%, 70%)",
        variant: "vibrant",
        appearance: "dark",
        radius: 0.75,
      },
      subtitleBold: "false",
      subtitleAllCaps: "false", 
      subtitleWhite: "false",
      titleboxSpacing: "20",
      themePresets: [
        { primary: "hsl(280, 100%, 70%)", variant: "vibrant", appearance: "dark", radius: 0.75 },
        { primary: "hsl(15, 86%, 67%)", variant: "tint", appearance: "light", radius: 0.75 },
        { primary: "hsl(142, 76%, 36%)", variant: "vibrant", appearance: "dark", radius: 0.75 },
        { primary: "hsl(221, 83%, 53%)", variant: "professional", appearance: "light", radius: 0.75 },
      ],
    },
  });

  // Update form when venue settings load
  useEffect(() => {
    if (venueSettings) {
      // Safely parse theme data
      let themeData = venueSettings.theme;
      if (typeof themeData === 'string') {
        try {
          themeData = JSON.parse(themeData);
        } catch (e) {
          themeData = {
            primary: "hsl(280, 100%, 70%)",
            variant: "vibrant",
            appearance: "dark",
            radius: 0.75
          };
        }
      }

      // Safely parse themePresets data
      let themePresentData = venueSettings.themePresets;
      if (typeof themePresentData === 'string') {
        try {
          themePresentData = JSON.parse(themePresentData);
        } catch (e) {
          themePresentData = [
            { name: "Purple Vibrant", primary: "hsl(280, 100%, 70%)", variant: "vibrant" as const, appearance: "dark" as const, radius: 0.75 },
            { name: "Orange Tint", primary: "hsl(15, 86%, 67%)", variant: "tint" as const, appearance: "light" as const, radius: 0.75 },
            { name: "Green Vibrant", primary: "hsl(142, 76%, 36%)", variant: "vibrant" as const, appearance: "dark" as const, radius: 0.75 },
            { name: "Blue Professional", primary: "hsl(221, 83%, 53%)", variant: "professional" as const, appearance: "light" as const, radius: 0.75 },
          ];
        }
      }

      form.reset({
        ...venueSettings,
        theme: themeData,
        themePresets: themePresentData,
      });
      
      // Set logo previews
      if (venueSettings.logoUrl) {
        setLogoPreview(venueSettings.logoUrl);
      }
      if (venueSettings.animatedLogoUrl) {
        setAnimatedLogoPreview(venueSettings.animatedLogoUrl);
      }
    }
  }, [venueSettings, form]);

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

  // Add game mutation
  const addGame = useMutation({
    mutationFn: async (data: InsertGame) => {
      const response = await apiRequest("POST", "/api/games", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
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

  // Handle logo upload
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch('/api/admin/upload-logo', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setLogoPreview(data.url);
        form.setValue("logoUrl", data.url);
        toast({
          title: "Logo Uploaded",
          description: "Your logo has been uploaded successfully.",
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: "Failed to upload logo. Please try again.",
      });
    }
  };

  // Handle animated logo upload  
  const handleAnimatedLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingAnimatedLogo(true);

    try {
      const formData = new FormData();
      formData.append('animatedLogo', file);

      const response = await fetch('/api/admin/upload-animated-logo', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAnimatedLogoPreview(data.url);
        form.setValue("animatedLogoUrl", data.url);
        toast({
          title: "Animated Logo Uploaded",
          description: "Your animated logo has been uploaded successfully.",
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: "Failed to upload animated logo. Please try again.",
      });
    } finally {
      setIsUploadingAnimatedLogo(false);
    }
  };

  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: async (data: Partial<VenueSettings>) => {
      const response = await apiRequest("PATCH", "/api/admin/settings", data);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Settings Updated",
        description: "Your venue settings have been saved successfully.",
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

  const isLoading = gamesLoading || settingsLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your arcade games and venue settings
          </p>
        </div>
        <Link href="/" className="inline-flex">
          <Button variant="outline">
            Back to Home
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="games" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="games">Games Management</TabsTrigger>
          <TabsTrigger value="venue">Venue Settings</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="games" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5" />
                Games Management
              </CardTitle>
              <CardDescription>
                Add, edit, and organize your arcade games
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sort Option */}
              <div className="flex justify-end">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Sort by:</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="displayOrder">Order</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="type">Type</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Add Game Form */}
              <div className="border rounded-lg p-4 bg-muted/50">
                <h3 className="font-semibold mb-4">Add New Game</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const name = formData.get("name") as string;
                    const subtitle = formData.get("subtitle") as string;
                    const type = formData.get("type") as "arcade" | "pinball";
                    
                    if (name) {
                      addGame.mutate({
                        name,
                        subtitle: subtitle || undefined,
                        type,
                        displayOrder: (games?.length || 0),
                      });
                      e.currentTarget.reset();
                    }
                  }}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4"
                >
                  <Input
                    name="name"
                    placeholder="Game name"
                    required
                  />
                  <Input
                    name="subtitle"
                    placeholder="Subtitle (optional)"
                  />
                  <Select name="type" defaultValue="arcade">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="arcade">Arcade</SelectItem>
                      <SelectItem value="pinball">Pinball</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="submit" disabled={addGame.isPending}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Game
                  </Button>
                </form>
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
            </CardContent>
          </Card>

          {/* Color Schemes Section */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-muted/50 to-background border-b">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-lg font-bold">Color Schemes</div>
                  <div className="text-sm text-muted-foreground font-normal">
                    Transform your arcade's visual identity
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* Category Filters */}
              <div className="mb-6 flex flex-wrap gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">Categories:</span>
                </div>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Moon className="w-3 h-3" />
                  Dark Themes
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Sun className="w-3 h-3" />
                  Light Themes
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Palette className="w-3 h-3" />
                  All Variants
                </Badge>
              </div>

              {/* Enhanced Theme Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {venueSettings?.themePresets?.map((preset) => (
                  <div
                    key={preset.name}
                    className={`group relative cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                      venueSettings.theme.primary === preset.primary
                        ? "scale-[1.01]"
                        : ""
                    }`}
                    onClick={() => {
                      updateSettings.mutate({
                        theme: {
                          name: preset.name,
                          primary: preset.primary,
                          variant: preset.variant,
                          appearance: preset.appearance,
                          radius: preset.radius,
                        },
                      });
                    }}
                  >
                    <Card className={`overflow-hidden transition-all duration-300 ${
                      venueSettings.theme.primary === preset.primary
                        ? "ring-2 ring-primary shadow-lg border-primary/40"
                        : "hover:shadow-md group-hover:border-primary/20"
                    }`}>
                      <CardContent className="p-3">
                        {/* Compact Color Display */}
                        <div className="relative h-16 mb-3 overflow-hidden rounded-md">
                          {/* Main color swatch */}
                          <div
                            className="absolute inset-0"
                            style={{ backgroundColor: preset.primary }}
                          />
                          
                          {/* Variant pattern overlay */}
                          {preset.variant === 'vibrant' && (
                            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/20" />
                          )}
                          {preset.variant === 'tint' && (
                            <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20" />
                          )}
                          {preset.variant === 'professional' && (
                            <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-black/15" />
                          )}

                          {/* Theme mode indicator */}
                          <div className="absolute top-2 right-2">
                            <div className={`p-1 rounded-full backdrop-blur-sm shadow-sm ${
                              preset.appearance === 'dark' 
                                ? 'bg-black/50 text-white' 
                                : 'bg-white/70 text-gray-700'
                            }`}>
                              {preset.appearance === 'dark' ? (
                                <Moon className="w-3 h-3" />
                              ) : (
                                <Sun className="w-3 h-3" />
                              )}
                            </div>
                          </div>

                          {/* Active selection indicator */}
                          {venueSettings.theme.primary === preset.primary && (
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                              <div className="bg-gradient-to-b from-white via-gray-50 to-gray-100 backdrop-blur-sm rounded-full px-4 py-1 shadow-lg border border-white/50 transform -translate-y-0.5">
                                <span className="text-xs font-bold text-green-700 tracking-wider">ACTIVE</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Theme Name with Color */}
                        <div className="text-center mb-2">
                          <h3 
                            className="font-bold text-sm mb-1 transition-colors"
                            style={{ color: preset.primary }}
                          >
                            {preset.name}
                          </h3>
                        </div>

                        {/* Compact Info Row */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1">
                            <div 
                              className="w-2 h-2 rounded-full border border-white/50"
                              style={{ backgroundColor: preset.primary }}
                            />
                            <span className="text-muted-foreground capitalize truncate">
                              {preset.variant}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1 text-muted-foreground">
                            {preset.appearance === 'dark' ? (
                              <Moon className="w-3 h-3" />
                            ) : (
                              <Sun className="w-3 h-3" />
                            )}
                          </div>
                        </div>

                        {/* Color Value */}
                        <div className="mt-2 text-center">
                          <code className="text-xs font-mono text-muted-foreground bg-muted/50 rounded px-1 py-0.5">
                            {preset.primary.replace('hsl(', '').replace(')', '')}
                          </code>
                        </div>




                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="mt-8 pt-6 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Click any theme to apply it instantly to your arcade
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {venueSettings?.themePresets?.length || 0} themes available
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Background Color */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-secondary/50">
                  <Palette className="h-4 w-4" />
                </div>
                Custom Background Color
              </CardTitle>
              <CardDescription>
                Set a specific background color that overrides any theme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {/* Enable/Disable Toggle */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="customBackgroundEnabled"
                    checked={localBackgroundOverride}
                    onCheckedChange={(checked) => {
                      setLocalBackgroundOverride(!!checked);
                      setHasUnsavedChanges(true);
                      
                      if (!checked && venueSettings) {
                        // Reset to theme default
                        document.documentElement.style.removeProperty('background-color');
                        document.documentElement.style.removeProperty('color');
                        document.body.style.removeProperty('background-color');
                        document.body.style.removeProperty('color');
                      }
                    }}
                  />
                  <Label htmlFor="customBackgroundEnabled" className="text-sm font-medium">
                    Use custom background color
                  </Label>
                </div>

                {localBackgroundOverride && (
                  <div className="space-y-4">
                    {/* Color Input */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Background Color</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={localCustomBackgroundColor}
                          onChange={(e) => {
                            setLocalCustomBackgroundColor(e.target.value);
                            setHasUnsavedChanges(true);
                            
                            // Apply immediately as preview to both html and body
                            document.documentElement.style.setProperty('background-color', e.target.value);
                            document.body.style.setProperty('background-color', e.target.value);
                            
                            const rgb = hexToRgb(e.target.value);
                            if (rgb) {
                              const { r, g, b } = rgb;
                              const hsl = rgbToHsl(r, g, b);
                              const lightness = hsl.l;
                              
                              // Set foreground color based on lightness
                              const textColor = lightness > 0.5 ? '#000000' : '#ffffff';
                              document.documentElement.style.setProperty('color', textColor);
                              document.body.style.setProperty('color', textColor);
                            }
                          }}
                          className="w-12 h-12 rounded border cursor-pointer"
                        />
                        <div className="flex-1">
                          <input
                            type="text"
                            value={localCustomBackgroundColor}
                            onChange={(e) => {
                              setLocalCustomBackgroundColor(e.target.value);
                              setHasUnsavedChanges(true);
                              
                              // Apply immediately as preview if valid hex
                              if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                                document.documentElement.style.setProperty('background-color', e.target.value);
                                document.body.style.setProperty('background-color', e.target.value);
                                
                                const rgb = hexToRgb(e.target.value);
                                if (rgb) {
                                  const { r, g, b } = rgb;
                                  const hsl = rgbToHsl(r, g, b);
                                  const lightness = hsl.l;
                                  
                                  const textColor = lightness > 0.5 ? '#000000' : '#ffffff';
                                  document.documentElement.style.setProperty('color', textColor);
                                  document.body.style.setProperty('color', textColor);
                                }
                              }
                            }}
                            placeholder="#000000"
                            className="w-full px-3 py-2 border border-input rounded-md text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="p-4 border rounded-lg" style={{ backgroundColor: localCustomBackgroundColor }}>
                      <div className="text-center">
                        <div className="text-sm font-medium mb-1">Preview</div>
                        <div className="text-xs opacity-70">This is how your background will look</div>
                      </div>
                    </div>

                    {/* Common Color Presets */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Quick Colors</Label>
                      <div className="flex gap-2 flex-wrap">
                        {[
                          { name: 'Black', color: '#000000' },
                          { name: 'Very Dark Gray', color: '#1C1C1C' },
                          { name: 'Dark Gray', color: '#383838' },
                          { name: 'Medium Dark', color: '#555555' },
                          { name: 'Medium', color: '#717171' },
                          { name: 'Medium Light', color: '#8D8D8D' },
                          { name: 'Light Gray', color: '#AAAAAA' },
                          { name: 'Very Light', color: '#C6C6C6' },
                          { name: 'Almost White', color: '#E2E2E2' },
                          { name: 'White', color: '#FFFFFF' },
                        ].map((preset) => (
                          <button
                            key={preset.name}
                            onClick={() => {
                              setLocalCustomBackgroundColor(preset.color);
                              setHasUnsavedChanges(true);
                              
                              // Apply immediately as preview to both html and body
                              document.documentElement.style.setProperty('background-color', preset.color);
                              document.body.style.setProperty('background-color', preset.color);
                              
                              const rgb = hexToRgb(preset.color);
                              if (rgb) {
                                const { r, g, b } = rgb;
                                const hsl = rgbToHsl(r, g, b);
                                const lightness = hsl.l;
                                
                                const textColor = lightness > 0.5 ? '#000000' : '#ffffff';
                                document.documentElement.style.setProperty('color', textColor);
                                document.body.style.setProperty('color', textColor);
                              }
                            }}
                            className="w-8 h-8 rounded border-2 border-muted hover:border-primary transition-colors"
                            style={{ backgroundColor: preset.color }}
                            title={preset.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Current Status */}
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Background:</span>
                    <div className="flex items-center gap-2">
                      {!localBackgroundOverride ? (
                        <span className="text-sm">Using theme default</span>
                      ) : (
                        <>
                          <div 
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: localCustomBackgroundColor }}
                          />
                          <span className="text-sm font-mono">{localCustomBackgroundColor}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {hasUnsavedChanges && (
                <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-amber-800">
                    <AlertCircle className="w-4 h-4" />
                    Custom background color changes need to be saved
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (venueSettings) {
                          setLocalBackgroundOverride(venueSettings.backgroundOverride || false);
                          setLocalCustomBackgroundColor(venueSettings.customBackgroundColor || '#000000');
                          setHasUnsavedChanges(false);
                          // Reset preview
                          document.documentElement.style.removeProperty('background-color');
                          document.documentElement.style.removeProperty('color');
                          document.body.style.removeProperty('background-color');
                          document.body.style.removeProperty('color');
                        }
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (venueSettings) {
                          updateSettings.mutate({
                            ...venueSettings,
                            backgroundOverride: localBackgroundOverride,
                            customBackgroundColor: localCustomBackgroundColor,
                          });
                          setHasUnsavedChanges(false);
                        }
                      }}
                      disabled={updateSettings.isPending}
                    >
                      {updateSettings.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="venue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Venue Information
              </CardTitle>
              <CardDescription>
                Update your venue's basic information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-[2fr_1fr] gap-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => updateSettings.mutate(data))} className="space-y-6">
                    {/* Venue Name and Leaderboard Name - 50/50 grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Venue Name
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Displayed at the top of the Homepage</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="leaderboardName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Leaderboard Name
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Displayed underneath the Venue Name on the Homepage</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="THE LEADERBOARD" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Address - Single line */}
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="123 Main Street, City, State" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Logo Background Options - moved inside form */}
                    {(logoPreview || animatedLogoPreview) && (
                      <div className="space-y-3 pt-4 border-t">
                        <h4 className="font-medium">Logo Display Options</h4>
                        <FormField
                          control={form.control}
                          name="logoBackgroundColor"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel>Logo Background Color</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  value={field.value || "transparent"}
                                  className="flex flex-col space-y-2"
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="transparent" id="transparent" />
                                    <Label htmlFor="transparent">Transparent</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="white" id="white" />
                                    <Label htmlFor="white">White</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="black" id="black" />
                                    <Label htmlFor="black">Black</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="theme" id="theme" />
                                    <Label htmlFor="theme">Theme Color</Label>
                                  </div>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                              <p className="text-xs text-muted-foreground">
                                Background color for the logo area (works with both images and videos)
                              </p>
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    <Button type="submit" disabled={updateSettings.isPending}>
                      {updateSettings.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </Form>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Static Logo Upload</h3>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="mb-2"
                    />
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload an image file for your venue logo. Recommended size: 300x100px or similar aspect ratio.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Video Logo Upload</h3>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleAnimatedLogoUpload}
                      disabled={isUploadingAnimatedLogo}
                      className="mb-2"
                    />
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload a video file for animated venue logo. Takes precedence over static logo when present. Recommended: MP4 format, under 5MB.
                    </p>
                    {isUploadingAnimatedLogo && (
                      <p className="text-sm text-blue-600">Uploading video logo...</p>
                    )}
                  </div>

                  {/* Static Logo Preview */}
                  {logoPreview && !animatedLogoPreview && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Current Static Logo Preview:</h4>
                      <img 
                        src={logoPreview} 
                        alt="Venue Logo" 
                        className="max-w-xs max-h-24 object-contain border rounded"
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setLogoPreview(null);
                          form.setValue("logoUrl", "");
                        }}
                      >
                        Remove Static Logo
                      </Button>
                      <div className="text-xs text-muted-foreground">
                        Image URL: {logoPreview}
                      </div>
                    </div>
                  )}

                  {/* Video Logo Preview (takes precedence) */}
                  {animatedLogoPreview && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Current Video Logo Preview:</h4>
                      <video 
                        src={animatedLogoPreview} 
                        autoPlay 
                        muted 
                        loop 
                        className="max-w-xs max-h-24 object-contain bg-transparent"
                        style={{ backgroundColor: 'transparent' }}
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setAnimatedLogoPreview(null);
                          form.setValue("animatedLogoUrl", "");
                        }}
                      >
                        Remove Video Logo
                      </Button>
                      <div className="text-xs text-muted-foreground">
                        Video URL: {animatedLogoPreview}
                      </div>
                    </div>
                  )}



                  {animatedLogoPreview && logoPreview && (
                    <div className="text-xs text-muted-foreground mt-2 text-center bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                      Video logo is displayed. Image logo is saved as backup.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Notes & Features</CardTitle>
              <CardDescription>
                Documentation of platform capabilities and features
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none dark:prose-invert">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Core Features</h3>
                  <ul className="space-y-2">
                    <li><strong>Game Management:</strong> Add, edit, reorder, and delete arcade/pinball games</li>
                    <li><strong>Score Tracking:</strong> Players can submit scores with photo validation</li>
                    <li><strong>QR Code System:</strong> Venue-specific QR codes for score submission</li>
                    <li><strong>Real-time Leaderboards:</strong> Dynamic ranking system with high score tracking</li>
                    <li><strong>Mobile Responsive:</strong> Optimized for all device sizes</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Venue Customization</h3>
                  <ul className="space-y-2">
                    <li><strong>Logo Support:</strong> Static images and animated videos (MP4/WebM)</li>
                    <li><strong>Theme System:</strong> Multiple color schemes with click-to-cycle functionality</li>
                    <li><strong>Layout Controls:</strong> Customizable spacing, typography, and visual styling</li>
                    <li><strong>Branding Options:</strong> Venue name, leaderboard titles, and address display</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Admin Capabilities</h3>
                  <ul className="space-y-2">
                    <li><strong>Drag & Drop Reordering:</strong> Intuitive game organization</li>
                    <li><strong>Image Management:</strong> Marquee and overlay image uploads per game</li>
                    <li><strong>Visibility Controls:</strong> Show/hide games from public view</li>
                    <li><strong>Bulk Operations:</strong> Filter and sort games by type or name</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Player Experience</h3>
                  <ul className="space-y-2">
                    <li><strong>Score Submission:</strong> Photo evidence required for verification</li>
                    <li><strong>Champion Recognition:</strong> Special highlighting for #1 scores</li>
                    <li><strong>Social Features:</strong> Score sharing and friendly competition</li>
                    <li><strong>Game Discovery:</strong> Grid and list view modes</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Technical Stack</h3>
                  <ul className="space-y-2">
                    <li><strong>Frontend:</strong> React, TypeScript, Tailwind CSS</li>
                    <li><strong>Backend:</strong> Express.js, Node.js</li>
                    <li><strong>Database:</strong> PostgreSQL with Drizzle ORM</li>
                    <li><strong>UI Components:</strong> Shadcn/ui with custom arcade theming</li>
                    <li><strong>File Storage:</strong> Local upload system for images/videos</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Rules & Guidelines</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Marquee Image Specifications</h4>
                      <ul className="space-y-1 text-sm">
                        <li><strong>Recommended Size:</strong> 400x600px (2:3 aspect ratio)</li>
                        <li><strong>Maximum File Size:</strong> 2MB per image</li>
                        <li><strong>Supported Formats:</strong> JPG, PNG, WebP</li>
                        <li><strong>Display Context:</strong> Grid view cards, list view thumbnails</li>
                        <li><strong>Responsive Behavior:</strong> Auto-scales for mobile devices</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Overlay Image System</h4>
                      <ul className="space-y-1 text-sm">
                        <li><strong>Purpose:</strong> Additional branding or promotional overlays</li>
                        <li><strong>Layering:</strong> Displays over marquee image with transparency support</li>
                        <li><strong>Recommended Size:</strong> Same dimensions as marquee (400x600px)</li>
                        <li><strong>Transparency:</strong> PNG format recommended for alpha channels</li>
                        <li><strong>Use Cases:</strong> "Coming Soon" badges, special event promotions</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Animation Sequences & Timing</h4>
                      <ul className="space-y-1 text-sm">
                        <li><strong>Hover Effects:</strong> 300ms smooth transitions on game cards</li>
                        <li><strong>Loading States:</strong> Skeleton animations during data fetch</li>
                        <li><strong>Score Celebrations:</strong> Particle bursts and floating animations</li>
                        <li><strong>Theme Transitions:</strong> Color scheme changes with 200ms easing</li>
                        <li><strong>Drag & Drop:</strong> Visual feedback with opacity and transform effects</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Content Guidelines</h4>
                      <ul className="space-y-1 text-sm">
                        <li><strong>Game Names:</strong> Keep concise, avoid special characters</li>
                        <li><strong>Subtitles:</strong> Optional additional game information or taglines</li>
                        <li><strong>Image Quality:</strong> High-resolution, clear visibility at thumbnail sizes</li>
                        <li><strong>Consistency:</strong> Maintain similar visual style across all game images</li>
                        <li><strong>Accessibility:</strong> Ensure sufficient contrast for text overlays</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Performance Considerations</h4>
                      <ul className="space-y-1 text-sm">
                        <li><strong>Image Optimization:</strong> Compress images without quality loss</li>
                        <li><strong>Lazy Loading:</strong> Images load as they come into viewport</li>
                        <li><strong>Caching:</strong> Browser caching enabled for static assets</li>
                        <li><strong>Mobile Optimization:</strong> Responsive images for different screen sizes</li>
                        <li><strong>Loading Priority:</strong> Above-fold content loads first</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Video Logo Specifications</h4>
                      <ul className="space-y-1 text-sm">
                        <li><strong>Supported Formats:</strong> MP4, WebM (WebM preferred for transparency)</li>
                        <li><strong>Maximum File Size:</strong> 5MB for optimal loading</li>
                        <li><strong>Recommended Duration:</strong> 2-5 seconds for seamless looping</li>
                        <li><strong>Dimensions:</strong> 300x100px or similar aspect ratio</li>
                        <li><strong>Transparency:</strong> WebM with alpha channel for true transparency</li>
                        <li><strong>Fallback:</strong> Static logo image serves as backup</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Venue Information</h4>
                  <p><strong>Winona Axe and Arcade</strong></p>
                  <p>Operating Hours:</p>
                  <ul className="ml-4">
                    <li>Wednesday-Friday: 4pm-10pm</li>
                    <li>Saturday: 11am-10pm</li>
                    <li>Sunday: noon-6pm</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}