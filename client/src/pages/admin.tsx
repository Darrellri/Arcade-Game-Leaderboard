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
  AlertCircle,
  ChevronDown,
  ChevronUp
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

  // Countdown timer for settings confirmation
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState({
    colorSchemes: false,
    displayViewOptions: false,
    singleView: false,
    dualView: false,
    scrollView: false,
    animationSystem: false,
    notes: false,
  });

  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Display View Options state
  const [displayViewSettings, setDisplayViewSettings] = useState({
    // Dual View Settings
    dualViewSpeed: 8,
    dualViewAnimations: true,
    dualViewHideHeader: false,
    dualViewSize: "extra-large",
    
    // Single View Settings
    singleViewSpeed: 6,
    singleViewAnimations: true,
    singleViewHideHeader: false,
    singleViewSize: "large",
    
    // Scroll View Settings
    scrollViewSpeed: 50,
    scrollViewSpacing: 200,
    scrollViewAnimations: true,
    scrollViewStickyHeader: true,
    scrollViewLazyLoad: false,
    scrollViewSize: "extra-large",
    
    // List View Settings
    listViewScrollDirection: "up",
    listViewSpeed: 50,
    listViewSpacing: 20,
    listViewAnimations: true,
    listViewHideHeader: false,
    listViewSize: "large",
    
    // Grid View Settings
    gridViewScrollDirection: "up",
    gridViewSpeed: 75,
    gridViewColumns: 3,
    gridViewSpacing: 25,
    gridViewAnimations: true,
    gridViewHideHeader: false,
    gridViewSize: "normal",
  });

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
      
      // Initialize display view settings from database
      setDisplayViewSettings({
        dualViewSpeed: venueSettings.dualViewSpeed || 8,
        dualViewAnimations: venueSettings.dualViewAnimations !== false,
        dualViewHideHeader: venueSettings.dualViewHideHeader || false,
        dualViewSize: venueSettings.dualViewSize || "extra-large",
        
        singleViewSpeed: venueSettings.singleViewSpeed || 6,
        singleViewAnimations: venueSettings.singleViewAnimations !== false,
        singleViewHideHeader: venueSettings.singleViewHideHeader || false,
        singleViewSize: venueSettings.singleViewSize || "extra-large",
        
        scrollViewSpeed: venueSettings.scrollViewSpeed || 50,
        scrollViewSpacing: venueSettings.scrollViewSpacing || 200,
        scrollViewAnimations: venueSettings.scrollViewAnimations !== false,
        scrollViewStickyHeader: venueSettings.scrollViewStickyHeader !== false,
        scrollViewLazyLoad: venueSettings.scrollViewLazyLoad || false,
        scrollViewSize: venueSettings.scrollViewSize || "extra-large",
        
        listViewScrollDirection: venueSettings.listViewScrollDirection || "up",
        listViewSpeed: venueSettings.listViewSpeed || 50,
        listViewSpacing: venueSettings.listViewSpacing || 20,
        listViewAnimations: venueSettings.listViewAnimations !== false,
        listViewHideHeader: venueSettings.listViewHideHeader || false,
        listViewSize: venueSettings.listViewSize || "large",
        
        gridViewScrollDirection: venueSettings.gridViewScrollDirection || "up",
        gridViewSpeed: venueSettings.gridViewSpeed || 75,
        gridViewColumns: venueSettings.gridViewColumns || 3,
        gridViewSpacing: venueSettings.gridViewSpacing || 25,
        gridViewAnimations: venueSettings.gridViewAnimations !== false,
        gridViewHideHeader: venueSettings.gridViewHideHeader || false,
        gridViewSize: venueSettings.gridViewSize || "normal",
      });
      
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
      
      // Start countdown overlay
      setShowCountdown(true);
      setCountdown(5);
      
      // Countdown timer
      let timeLeft = 5;
      const countdownInterval = setInterval(() => {
        timeLeft--;
        setCountdown(timeLeft);
        
        if (timeLeft <= 0) {
          clearInterval(countdownInterval);
          setShowCountdown(false);
        }
      }, 1000);
      
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

  // Display View Settings mutation
  const updateDisplayViewSettings = useMutation({
    mutationFn: async (settings: typeof displayViewSettings) => {
      const response = await apiRequest("PATCH", "/api/admin/settings", settings);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      
      // Start countdown overlay
      setShowCountdown(true);
      setCountdown(5);
      
      // Countdown timer
      let timeLeft = 5;
      const countdownInterval = setInterval(() => {
        timeLeft--;
        setCountdown(timeLeft);
        
        if (timeLeft <= 0) {
          clearInterval(countdownInterval);
          setShowCountdown(false);
        }
      }, 1000);
      
      toast({
        title: "Display Settings Saved",
        description: "All display view settings have been saved successfully.",
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
    <div className="container mx-auto p-6 max-w-7xl space-y-6 relative">
      {/* Countdown Overlay */}
      {showCountdown && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
            <div 
              className="text-9xl font-bold text-primary/20 select-none transition-all duration-1000 ease-in-out"
              style={{
                textShadow: '0 0 20px rgba(0,0,0,0.3)',
                transform: `scale(${1 + (5 - countdown) * 0.1})`,
                opacity: 0.15 + (5 - countdown) * 0.05
              }}
            >
              {countdown}
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img 
            src="/arcade-leaderboard-logo.png" 
            alt="Arcade Leaderboard" 
            className="h-16 w-auto"
          />
          <div className="relative">
            {/* Watermark Arcade Leaderboard logo behind the text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
              <img 
                src="/arcade-leaderboard-watermark.png" 
                alt="Arcade Leaderboard watermark" 
                className="w-32 h-32 object-contain opacity-75" 
                style={{ filter: 'brightness(0.8)' }}
                onError={(e) => { console.log('Image failed to load:', e); }}
              />
            </div>
            
            <div className="relative z-10">
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Manage your arcade games and venue settings
              </p>
            </div>
          </div>
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

        {/* Admin Dashboard Content */}
        <>
        <TabsContent key="games" value="games" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-4">
                {venueSettings?.logoUrl && (
                  <img 
                    src={venueSettings.logoUrl} 
                    alt="Venue Logo"
                    className="w-[150px] h-auto object-contain"
                  />
                )}
                <div className="flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5" />
                  Games Management
                </div>
              </CardTitle>
              <CardDescription>
                Add, edit, and organize your arcade games
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Section Navigation */}
              <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg border">
                <h4 className="text-sm font-medium text-muted-foreground mr-4">Quick Navigation:</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('color-schemes-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="h-7 px-3 text-xs"
                >
                  Color Schemes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('display-view-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="h-7 px-3 text-xs"
                >
                  Display View Options
                </Button>
              </div>

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
          <Card id="color-schemes-section" className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-muted/50 to-background border-b">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {venueSettings?.logoUrl && (
                    <img 
                      src={venueSettings.logoUrl} 
                      alt="Venue Logo"
                      className="w-[150px] h-auto object-contain"
                    />
                  )}
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Palette className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-lg font-bold">Color Schemes</div>
                      <div className="text-sm text-muted-foreground font-normal">
                        Transform your arcade's visual identity
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('colorSchemes')}
                  className="h-8 w-8 p-0"
                >
                  {collapsedSections.colorSchemes ? (
                    <ChevronDown className="h-6 w-6" />
                  ) : (
                    <ChevronUp className="h-6 w-6" />
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            {!collapsedSections.colorSchemes && (
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
                              <div 
                                className="backdrop-blur-sm rounded-full shadow-lg border border-white/50 animate-[active-button-float_3s_ease-in-out_infinite]"
                                style={{
                                  background: `linear-gradient(to bottom, ${preset.primary}40, ${preset.primary}60, ${preset.primary}80)`,
                                  paddingTop: '1px',
                                  paddingBottom: '4px',
                                  paddingLeft: '6px',
                                  paddingRight: '6px'
                                }}
                              >
                                <span className="text-xs font-bold text-white tracking-wider drop-shadow-sm">ACTIVE</span>
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
            )}
          </Card>

          {/* Display View Options */}
          <Card id="display-view-section">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div>
                  <div>Display View Options</div>
                  <CardDescription className="mt-1">Configure settings for the three display modes: Single View, Dual View, and Scroll View</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('displayViewOptions')}
                  className="h-8 w-8 p-0"
                >
                  {collapsedSections.displayViewOptions ? (
                    <ChevronDown className="h-6 w-6" />
                  ) : (
                    <ChevronUp className="h-6 w-6" />
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            {!collapsedSections.displayViewOptions && (
              <CardContent className="space-y-6">
                <div className="space-y-6">

                  {/* Single View Settings */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-base">Single View (One large game centered)</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSection('singleView')}
                        className="h-6 w-6 p-0"
                      >
                        {collapsedSections.singleView ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    {!collapsedSections.singleView && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Transition Speed</Label>
                      <select 
                        value={displayViewSettings.singleViewSpeed}
                        onChange={(e) => setDisplayViewSettings(prev => ({ ...prev, singleViewSpeed: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
                      >
                        <option value={4}>Fast (4 seconds)</option>
                        <option value={6}>Medium (6 seconds)</option>
                        <option value={10}>Slow (10 seconds)</option>
                        <option value={15}>Very Slow (15 seconds)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={displayViewSettings.singleViewAnimations}
                          onChange={(e) => setDisplayViewSettings(prev => ({ ...prev, singleViewAnimations: e.target.checked }))}
                          className="rounded" 
                        />
                        Enable Animations
                      </Label>
                      <p className="text-xs text-muted-foreground">Random animation effects when games change</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={displayViewSettings.singleViewHideHeader}
                          onChange={(e) => setDisplayViewSettings(prev => ({ ...prev, singleViewHideHeader: e.target.checked }))}
                          className="rounded" 
                        />
                        Hide Header/Navigation
                      </Label>
                      <p className="text-xs text-muted-foreground">Hide leaderboard name and controls</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Display Size</Label>
                      <select 
                        value={displayViewSettings.singleViewSize}
                        onChange={(e) => setDisplayViewSettings(prev => ({ ...prev, singleViewSize: e.target.value }))}
                        className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
                      >
                        <option value="normal">Regular Size</option>
                        <option value="large">Large (1.3x)</option>
                        <option value="extra-large">Extra Large (1.5x) - Default</option>
                      </select>
                      </div>
                      </div>
                    )}
                  </div>

                  {/* Dual View Settings */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-base">Dual View (Two games side by side)</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSection('dualView')}
                        className="h-6 w-6 p-0"
                      >
                        {collapsedSections.dualView ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    {!collapsedSections.dualView && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Transition Speed</Label>
                      <select 
                        value={displayViewSettings.dualViewSpeed}
                        onChange={(e) => setDisplayViewSettings(prev => ({ ...prev, dualViewSpeed: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
                      >
                        <option value={5}>Fast (5 seconds)</option>
                        <option value={8}>Medium (8 seconds)</option>
                        <option value={12}>Slow (12 seconds)</option>
                        <option value={15}>Very Slow (15 seconds)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={displayViewSettings.dualViewAnimations}
                          onChange={(e) => setDisplayViewSettings(prev => ({ ...prev, dualViewAnimations: e.target.checked }))}
                          className="rounded" 
                        />
                        Enable Animations
                      </Label>
                      <p className="text-xs text-muted-foreground">Random animation effects when games change</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={displayViewSettings.dualViewHideHeader}
                          onChange={(e) => setDisplayViewSettings(prev => ({ ...prev, dualViewHideHeader: e.target.checked }))}
                          className="rounded" 
                        />
                        Hide Header/Navigation
                      </Label>
                      <p className="text-xs text-muted-foreground">Hide leaderboard name and controls</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Display Size</Label>
                      <select 
                        value={displayViewSettings.dualViewSize}
                        onChange={(e) => setDisplayViewSettings(prev => ({ ...prev, dualViewSize: e.target.value }))}
                        className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
                      >
                        <option value="normal">Regular Size</option>
                        <option value="large">Large (1.3x)</option>
                        <option value="extra-large">Extra Large (1.5x) - Default</option>
                      </select>
                      </div>
                      </div>
                    )}
                  </div>

                  {/* Scroll View Settings */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-base">Scroll View (Infinite vertical scroll)</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSection('scrollView')}
                        className="h-6 w-6 p-0"
                      >
                        {collapsedSections.scrollView ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    {!collapsedSections.scrollView && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Scroll Speed</Label>
                      <select 
                        value={displayViewSettings.scrollViewSpeed}
                        onChange={(e) => setDisplayViewSettings(prev => ({ ...prev, scrollViewSpeed: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
                      >
                        <option value={25}>Very Fast (25ms)</option>
                        <option value={50}>Fast (50ms)</option>
                        <option value={75}>Medium (75ms)</option>
                        <option value={100}>Slow (100ms)</option>
                        <option value={150}>Very Slow (150ms)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Game Spacing</Label>
                      <input 
                        type="number" 
                        value={displayViewSettings.scrollViewSpacing}
                        onChange={(e) => setDisplayViewSettings(prev => ({ ...prev, scrollViewSpacing: Number(e.target.value) }))}
                        min={50}
                        max={500}
                        step={25}
                        className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
                      />
                      <p className="text-xs text-muted-foreground">Pixels between games (50-500)</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={displayViewSettings.scrollViewAnimations}
                          onChange={(e) => setDisplayViewSettings(prev => ({ ...prev, scrollViewAnimations: e.target.checked }))}
                          className="rounded" 
                        />
                        Enable Animations
                      </Label>
                      <p className="text-xs text-muted-foreground">Fade-in effects as games scroll into view</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={displayViewSettings.scrollViewStickyHeader}
                          onChange={(e) => setDisplayViewSettings(prev => ({ ...prev, scrollViewStickyHeader: e.target.checked }))}
                          className="rounded" 
                        />
                        Sticky Header
                      </Label>
                      <p className="text-xs text-muted-foreground">Keep leaderboard header visible while scrolling</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={displayViewSettings.scrollViewLazyLoad}
                          onChange={(e) => setDisplayViewSettings(prev => ({ ...prev, scrollViewLazyLoad: e.target.checked }))}
                          className="rounded" 
                        />
                        Lazy Load Images
                      </Label>
                      <p className="text-xs text-muted-foreground">Load images only when needed for performance</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Display Size</Label>
                      <select 
                        value={displayViewSettings.scrollViewSize}
                        onChange={(e) => setDisplayViewSettings(prev => ({ ...prev, scrollViewSize: e.target.value }))}
                        className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
                      >
                        <option value="normal">Regular Size</option>
                        <option value="large">Large (1.3x)</option>
                        <option value="extra-large">Extra Large (1.5x) - Default</option>
                      </select>
                      </div>
                      </div>
                    )}
                  </div>

                  {/* List View Settings */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-base">List View (Vertical list layout)</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Scroll Direction</Label>
                      <select 
                        value={displayViewSettings.listViewScrollDirection || 'up'}
                        onChange={(e) => setDisplayViewSettings(prev => ({ ...prev, listViewScrollDirection: e.target.value }))}
                        className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
                      >
                        <option value="up">Scroll Up</option>
                        <option value="down">Scroll Down</option>
                        <option value="up-down">Scroll Up then Down</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Scroll Speed</Label>
                      <select 
                        value={displayViewSettings.listViewSpeed || 50}
                        onChange={(e) => setDisplayViewSettings(prev => ({ ...prev, listViewSpeed: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
                      >
                        <option value={25}>Very Fast (25ms)</option>
                        <option value={50}>Fast (50ms)</option>
                        <option value={75}>Medium (75ms)</option>
                        <option value={100}>Slow (100ms)</option>
                        <option value={150}>Very Slow (150ms)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Item Spacing</Label>
                      <input 
                        type="number" 
                        value={displayViewSettings.listViewSpacing || 20}
                        onChange={(e) => setDisplayViewSettings(prev => ({ ...prev, listViewSpacing: Number(e.target.value) }))}
                        min={10}
                        max={100}
                        step={5}
                        className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
                      />
                      <p className="text-xs text-muted-foreground">Pixels between list items (10-100)</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={displayViewSettings.listViewAnimations !== false}
                          onChange={(e) => setDisplayViewSettings(prev => ({ ...prev, listViewAnimations: e.target.checked }))}
                          className="rounded" 
                        />
                        Enable Animations
                      </Label>
                      <p className="text-xs text-muted-foreground">Fade-in effects as items scroll into view</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={displayViewSettings.listViewHideHeader || false}
                          onChange={(e) => setDisplayViewSettings(prev => ({ ...prev, listViewHideHeader: e.target.checked }))}
                          className="rounded" 
                        />
                        Hide Header/Navigation
                      </Label>
                      <p className="text-xs text-muted-foreground">Hide leaderboard name and controls</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Display Size</Label>
                      <select 
                        value={displayViewSettings.listViewSize || 'large'}
                        onChange={(e) => setDisplayViewSettings(prev => ({ ...prev, listViewSize: e.target.value }))}
                        className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
                      >
                        <option value="normal">Regular Size</option>
                        <option value="large">Large (1.3x) - Default</option>
                        <option value="extra-large">Extra Large (1.5x)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Grid View Settings */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-base">Grid View (Card grid layout)</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Scroll Direction</Label>
                      <select 
                        value={displayViewSettings.gridViewScrollDirection || 'up'}
                        onChange={(e) => setDisplayViewSettings(prev => ({ ...prev, gridViewScrollDirection: e.target.value }))}
                        className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
                      >
                        <option value="up">Scroll Up</option>
                        <option value="down">Scroll Down</option>
                        <option value="up-down">Scroll Up then Down</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Scroll Speed</Label>
                      <select 
                        value={displayViewSettings.gridViewSpeed || 75}
                        onChange={(e) => setDisplayViewSettings(prev => ({ ...prev, gridViewSpeed: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
                      >
                        <option value={25}>Very Fast (25ms)</option>
                        <option value={50}>Fast (50ms)</option>
                        <option value={75}>Medium (75ms)</option>
                        <option value={100}>Slow (100ms)</option>
                        <option value={150}>Very Slow (150ms)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Grid Columns</Label>
                      <select 
                        value={displayViewSettings.gridViewColumns || 3}
                        onChange={(e) => setDisplayViewSettings(prev => ({ ...prev, gridViewColumns: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
                      >
                        <option value={2}>2 Columns</option>
                        <option value={3}>3 Columns - Default</option>
                        <option value={4}>4 Columns</option>
                        <option value={5}>5 Columns</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Card Spacing</Label>
                      <input 
                        type="number" 
                        value={displayViewSettings.gridViewSpacing || 25}
                        onChange={(e) => setDisplayViewSettings(prev => ({ ...prev, gridViewSpacing: Number(e.target.value) }))}
                        min={10}
                        max={50}
                        step={5}
                        className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
                      />
                      <p className="text-xs text-muted-foreground">Pixels between cards (10-50)</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={displayViewSettings.gridViewAnimations !== false}
                          onChange={(e) => setDisplayViewSettings(prev => ({ ...prev, gridViewAnimations: e.target.checked }))}
                          className="rounded" 
                        />
                        Enable Animations
                      </Label>
                      <p className="text-xs text-muted-foreground">Hover and scroll animation effects</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={displayViewSettings.gridViewHideHeader || false}
                          onChange={(e) => setDisplayViewSettings(prev => ({ ...prev, gridViewHideHeader: e.target.checked }))}
                          className="rounded" 
                        />
                        Hide Header/Navigation
                      </Label>
                      <p className="text-xs text-muted-foreground">Hide leaderboard name and controls</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Display Size</Label>
                      <select 
                        value={displayViewSettings.gridViewSize || 'normal'}
                        onChange={(e) => setDisplayViewSettings(prev => ({ ...prev, gridViewSize: e.target.value }))}
                        className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
                      >
                        <option value="normal">Regular Size - Default</option>
                        <option value="large">Large (1.3x)</option>
                        <option value="extra-large">Extra Large (1.5x)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Animation System */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-base">Animation System</h4>
                  <p className="text-sm text-muted-foreground">
                    Configure the 60+ animation effects that randomly trigger when games change
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Animation Categories</Label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" defaultChecked className="rounded" />
                          Fade Effects (fadeIn, fadeOut variants)
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" defaultChecked className="rounded" />
                          Slide Effects (slideIn/Out from all directions)
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" defaultChecked className="rounded" />
                          Zoom Effects (zoomIn, zoomOut variants)
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" defaultChecked className="rounded" />
                          Bounce Effects (bounceIn from all directions)
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" defaultChecked className="rounded" />
                          Rotation Effects (rotateIn, flipIn variants)
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" defaultChecked className="rounded" />
                          Elastic & Back Effects (elasticIn, backIn variants)
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" defaultChecked className="rounded" />
                          Fun Effects (pulse, shake, swing, wobble, jello)
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" defaultChecked className="rounded" />
                          Dramatic Effects (tada, jackInTheBox, rollIn, lightSpeed)
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Animation Timing</Label>
                      <select 
                        defaultValue="0.8"
                        className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
                      >
                        <option value="0.5">Very Fast (0.5s)</option>
                        <option value="0.8">Fast (0.8s)</option>
                        <option value="1.0">Medium (1.0s)</option>
                        <option value="1.5">Slow (1.5s)</option>
                        <option value="2.0">Very Slow (2.0s)</option>
                      </select>
                      
                      <Label className="text-sm font-medium mt-4 block">Animation Delay</Label>
                      <select 
                        defaultValue="0.3"
                        className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
                      >
                        <option value="0">No Delay</option>
                        <option value="0.1">Short (0.1s)</option>
                        <option value="0.3">Medium (0.3s)</option>
                        <option value="0.5">Long (0.5s)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    <strong>Display Modes:</strong>
                    <br />• <strong>Dual View:</strong> Shows 2 games side by side, cycles through all game pairs
                    <br />• <strong>Single View:</strong> Shows 1 large game centered, cycles through each game individually  
                    <br />• <strong>Scroll View:</strong> Shows all games in infinite vertical scroll with configurable spacing
                    <br />• <strong>List View:</strong> Shows games in a vertical list format with customizable scroll direction
                    <br />• <strong>Grid View:</strong> Shows games in a responsive grid layout with adjustable columns
                    <br /><br />All modes support animations, header hiding, scroll direction controls, and size customization for optimal performance and display flexibility.
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t">
                  <Button 
                    onClick={() => {
                      updateDisplayViewSettings.mutate(displayViewSettings);
                    }}
                    disabled={updateDisplayViewSettings.isPending}
                    className="px-6"
                  >
                    {updateDisplayViewSettings.isPending ? "Saving..." : "Save Display Settings"}
                  </Button>
                </div>
              </div>
            </CardContent>
            )}
          </Card>
        </TabsContent>

        <TabsContent key="venue" value="venue" className="space-y-6">
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
                  <form onSubmit={form.handleSubmit((data) => {
                    // Include uploaded logo URLs in the form data
                    const settingsData = {
                      ...data,
                      logoUrl: logoPreview || data.logoUrl,
                      animatedLogoUrl: animatedLogoPreview || data.animatedLogoUrl
                    };
                    updateSettings.mutate(settingsData);
                  })} className="space-y-6">
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
                            <Input {...field} placeholder="123 Main Street" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cityState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City/State</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="City, State ZIP" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Venue Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="(555) 123-4567" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="webAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Web Address</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://www.yourwebsite.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* TODO: Weekly Hours Section - will be implemented separately */}

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

                        {/* Hide Logobox Border Checkbox */}
                        <FormField
                          control={form.control}
                          name="hideLogoBorderShadow"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value === "true"}
                                  onCheckedChange={(checked) =>
                                    field.onChange(checked ? "true" : "false")
                                  }
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Hide logobox border</FormLabel>
                                <p className="text-xs text-muted-foreground">
                                  Remove the border around the logo display area
                                </p>
                              </div>
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

        <TabsContent key="notes" value="notes" className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 via-secondary/10 to-primary/5 border-b">
              <CardTitle className="flex items-center gap-4">
                {venueSettings?.logoUrl && (
                  <img 
                    src={venueSettings.logoUrl} 
                    alt="Venue Logo"
                    className="w-[150px] h-auto object-contain"
                  />
                )}
                <div>
                  <h2 className="text-2xl font-bold text-primary">System Documentation</h2>
                  <p className="text-muted-foreground text-base mt-1">
                    Complete platform features and technical specifications
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid gap-8">
                {/* Core Features Section */}
                <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg p-6 border border-primary/10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Gamepad2 className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-primary">Core Platform Features</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="font-semibold text-foreground">Game Management System</h4>
                          <p className="text-sm text-muted-foreground">Add, edit, reorder, and organize arcade/pinball games with drag-and-drop functionality</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="font-semibold text-foreground">Score Tracking & Validation</h4>
                          <p className="text-sm text-muted-foreground">Players submit scores with photo evidence for verification and leaderboard updates</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="font-semibold text-foreground">QR Code Integration</h4>
                          <p className="text-sm text-muted-foreground">Venue-specific QR codes for quick score submission and game identification</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="font-semibold text-foreground">Real-time Leaderboards</h4>
                          <p className="text-sm text-muted-foreground">Dynamic ranking system with automatic high score tracking and champion highlighting</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="font-semibold text-foreground">Mobile Responsive Design</h4>
                          <p className="text-sm text-muted-foreground">Optimized interface for smartphones, tablets, and desktop screens</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="font-semibold text-foreground">Advanced Display Modes</h4>
                          <p className="text-sm text-muted-foreground">Single, Dual, and Scroll view options with customizable animations and sizing</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Venue Customization Section */}
                <div className="bg-gradient-to-br from-secondary/5 to-primary/5 rounded-lg p-6 border border-secondary/10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-secondary/10">
                      <Settings className="h-6 w-6 text-secondary" />
                    </div>
                    <h3 className="text-xl font-bold text-secondary">Venue Customization</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-secondary mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="font-semibold text-foreground">Logo & Branding</h4>
                          <p className="text-sm text-muted-foreground">Static images and animated videos (MP4/WebM) with custom background options</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-secondary mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="font-semibold text-foreground">Theme System</h4>
                          <p className="text-sm text-muted-foreground">Multiple color schemes with professional, tint, and vibrant variants</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-secondary mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="font-semibold text-foreground">Layout Controls</h4>
                          <p className="text-sm text-muted-foreground">Customizable spacing, typography, and visual styling options</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-secondary mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="font-semibold text-foreground">Display Size Options</h4>
                          <p className="text-sm text-muted-foreground">Regular, Large (1.3x), and Extra Large (1.5x) sizing for all view modes</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Technical Specifications Section */}
                <div className="bg-gradient-to-br from-muted/30 to-secondary/10 rounded-lg p-6 border border-muted/20">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-muted/20">
                      <CircleDot className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Technical Specifications</h3>
                  </div>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Frontend Stack</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• React 18 with TypeScript</li>
                        <li>• Tailwind CSS + Shadcn/ui</li>
                        <li>• TanStack Query</li>
                        <li>• Wouter routing</li>
                        <li>• Framer Motion animations</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Backend Stack</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Express.js + Node.js</li>
                        <li>• PostgreSQL database</li>
                        <li>• Drizzle ORM</li>
                        <li>• Multer file uploads</li>
                        <li>• Session management</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Deployment</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Replit hosting platform</li>
                        <li>• Vite build optimization</li>
                        <li>• Static asset serving</li>
                        <li>• Environment configuration</li>
                        <li>• Database migrations</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-4 text-foreground">Rules & Guidelines</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold mb-3 text-foreground">Marquee Image Specifications</h4>
                      <ul className="space-y-2 text-base">
                        <li className="text-foreground"><strong className="text-primary">Recommended Size:</strong> 792x214px</li>
                        <li className="text-foreground"><strong className="text-primary">Maximum File Size:</strong> 2MB per image</li>
                        <li className="text-foreground"><strong className="text-primary">Supported Formats:</strong> JPG, PNG, WebP</li>
                        <li className="text-foreground"><strong className="text-primary">Display Context:</strong> Grid view cards, list view thumbnails</li>
                        <li className="text-foreground"><strong className="text-primary">Responsive Behavior:</strong> Auto-scales for mobile devices</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold mb-3 text-foreground">Overlay Image System</h4>
                      <ul className="space-y-2 text-base">
                        <li className="text-foreground"><strong className="text-primary">Purpose:</strong> Additional branding or promotional overlays</li>
                        <li className="text-foreground"><strong className="text-primary">Layering:</strong> Displays over marquee image with transparency support</li>
                        <li className="text-foreground"><strong className="text-primary">Recommended Size:</strong> Same as marquee (792x214px)</li>
                        <li className="text-foreground"><strong className="text-primary">Transparency:</strong> WEBP or PNG format needed for alpha channels</li>
                        <li className="text-foreground"><strong className="text-primary">Use Cases:</strong> "Coming Soon" badges, special event promotions</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold mb-3 text-foreground">Animation Sequences & Timing</h4>
                      <ul className="space-y-2 text-base">
                        <li className="text-foreground"><strong className="text-primary">Hover Effects:</strong> 300ms smooth transitions on game cards</li>
                        <li className="text-foreground"><strong className="text-primary">Loading States:</strong> Skeleton animations during data fetch</li>
                        <li className="text-foreground"><strong className="text-primary">Score Celebrations:</strong> Particle bursts and floating animations</li>
                        <li className="text-foreground"><strong className="text-primary">Theme Transitions:</strong> Color scheme changes with 200ms easing</li>
                        <li className="text-foreground"><strong className="text-primary">Drag & Drop:</strong> Visual feedback with opacity and transform effects</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold mb-3 text-foreground">Content Guidelines</h4>
                      <ul className="space-y-2 text-base">
                        <li className="text-foreground"><strong className="text-primary">Game Names:</strong> Keep concise, avoid special characters</li>
                        <li className="text-foreground"><strong className="text-primary">Subtitles:</strong> Optional additional game information or taglines</li>
                        <li className="text-foreground"><strong className="text-primary">Image Quality:</strong> High-resolution, clear visibility at thumbnail sizes</li>
                        <li className="text-foreground"><strong className="text-primary">Consistency:</strong> Maintain similar visual style across all game images</li>
                        <li className="text-foreground"><strong className="text-primary">Accessibility:</strong> Ensure sufficient contrast for text overlays</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold mb-3 text-foreground">Performance Considerations</h4>
                      <ul className="space-y-2 text-base">
                        <li className="text-foreground"><strong className="text-primary">Image Optimization:</strong> Compress images without quality loss</li>
                        <li className="text-foreground"><strong className="text-primary">Lazy Loading:</strong> Images load as they come into viewport</li>
                        <li className="text-foreground"><strong className="text-primary">Caching:</strong> Browser caching enabled for static assets</li>
                        <li className="text-foreground"><strong className="text-primary">Mobile Optimization:</strong> Responsive images for different screen sizes</li>
                        <li className="text-foreground"><strong className="text-primary">Loading Priority:</strong> Above-fold content loads first</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold mb-3 text-foreground">Video Logo Specifications</h4>
                      <ul className="space-y-2 text-base">
                        <li className="text-foreground"><strong className="text-primary">Supported Formats:</strong> MP4, WebM (WebM preferred for transparency)</li>
                        <li className="text-foreground"><strong className="text-primary">Maximum File Size:</strong> 5MB for optimal loading</li>
                        <li className="text-foreground"><strong className="text-primary">Recommended Duration:</strong> 2-5 seconds for seamless looping</li>
                        <li className="text-foreground"><strong className="text-primary">Dimensions:</strong> 300x100px or similar aspect ratio</li>
                        <li className="text-foreground"><strong className="text-primary">Transparency:</strong> WebM with alpha channel for true transparency</li>
                        <li className="text-foreground"><strong className="text-primary">Fallback:</strong> Static logo image serves as backup</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-6 rounded-lg border">
                  <h4 className="text-lg font-bold mb-4 text-foreground">Venue Information</h4>
                  <p className="text-base text-foreground mb-3"><strong className="text-primary">Winona Axe and Arcade</strong></p>
                  <p className="text-base text-foreground mb-2"><strong className="text-primary">Operating Hours:</strong></p>
                  <ul className="ml-6 space-y-1">
                    <li className="text-base text-foreground">Wednesday-Friday: 4pm-10pm</li>
                    <li className="text-base text-foreground">Saturday: 11am-10pm</li>
                    <li className="text-base text-foreground">Sunday: noon-6pm</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </>
      </Tabs>
    </div>
  );
}