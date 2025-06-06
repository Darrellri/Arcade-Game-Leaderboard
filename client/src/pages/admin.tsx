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

// Sortable table row component for admin game management
function SortableGameTableRow({ game, onGameEdit, onDelete, onImageUpload, onImageDelete }: { 
  game: Game; 
  onGameEdit: (id: number, field: string, value: string) => void;
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
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <div className="flex items-center gap-2">
          <div 
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 transition-opacity"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-2 flex-1">
            <Input 
              defaultValue={game.name}
              className="w-full max-w-[200px]"
              onBlur={(e) => {
                if (e.target.value !== game.name) {
                  onGameEdit(game.id, "name", e.target.value);
                }
              }}
            />
            <Input 
              defaultValue={game.subtitle || ''}
              placeholder="Game subtitle"
              className="w-full max-w-[200px] text-sm"
              onBlur={(e) => {
                if (e.target.value !== game.subtitle) {
                  onGameEdit(game.id, "subtitle", e.target.value);
                }
              }}
            />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-2">
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
            <label htmlFor={`arcade-${game.id}`} className="flex items-center gap-1 text-sm font-medium cursor-pointer">
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
              className="w-4 h-4 text-primary focus:ring-primary"
            />
            <label htmlFor={`pinball-${game.id}`} className="flex items-center gap-1 text-sm font-medium cursor-pointer">
              <CircleDot className="h-3 w-3" />
              Pinball
            </label>
          </div>
        </div>
      </TableCell>
      <TableCell className="p-2">
        <div className="space-y-2">
          {/* Marquee Image */}
          <div className="space-y-1">
            {game.imageUrl ? (
              <div className="relative w-full h-16 rounded overflow-hidden bg-black">
                <img 
                  src={game.imageUrl} 
                  alt={`${game.name} marquee`}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-16 rounded bg-muted flex items-center justify-center">
                <Image className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex gap-1">
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1 text-xs h-6"
                onClick={() => onImageUpload(game.id)}
              >
                <ImageDown className="h-3 w-3 mr-1" />
                Upload Marquee
              </Button>
              {game.imageUrl && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => onImageDelete(game.id, 'marquee')}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Overlay Image */}
          <div className="space-y-1">
            {game.overlayImageUrl && (
              <div className="relative w-full h-16 rounded overflow-hidden bg-black/20">
                <img 
                  src={game.overlayImageUrl} 
                  alt={`${game.name} overlay`}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div className="flex gap-1">
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1 text-xs h-6"
                onClick={() => onImageUpload(game.id)}
              >
                <Upload className="h-3 w-3 mr-1" />
                Upload Overlay
              </Button>
              {game.overlayImageUrl && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => onImageDelete(game.id, 'overlay')}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-right tabular-nums">
          {game.currentHighScore?.toLocaleString() || '0'}
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <Button 
            variant="outline" 
            size="sm"
            className="w-full"
            onClick={() => {
              window.open(`/leaderboard/${game.id}`, '_blank');
            }}
          >
            View
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            className="w-full"
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete ${game.name}?\n\nThis will permanently remove this game and all its scores.`)) {
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
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { venueSettingsSchema, type VenueSettings, type Game } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Gamepad2, 
  CircleDot, 
  Image, 
  ImageDown, 
  PlusCircle, 
  Trash2, 
  Database, 
  RefreshCw, 
  AlertTriangle,
  Upload,
  Camera,
  Info,
  Building2,
  Palette,
  GripVertical
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
import MarqueeImageUploader from "@/components/marquee-image-uploader";
import OverlayImageUploader from "@/components/overlay-image-uploader";

export default function Admin() {
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [animatedLogoPreview, setAnimatedLogoPreview] = useState<string | null>(null);
  const [isUploadingAnimatedLogo, setIsUploadingAnimatedLogo] = useState(false);
  
  // State for confirmation dialogs
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
  const [showRestoreDataDialog, setShowRestoreDataDialog] = useState(false);
  const [clearDataConfirmation, setClearDataConfirmation] = useState("");
  const [restoreDataConfirmation, setRestoreDataConfirmation] = useState("");

  // Fetch venue settings
  const { data: settings, isLoading: settingsLoading } = useQuery<VenueSettings>({
    queryKey: ["/api/admin/settings"],
  });

  // Fetch all games
  const { data: games, isLoading: gamesLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  // Local state for drag-and-drop games ordering
  const [localGames, setLocalGames] = useState<Game[]>([]);

  // Set local games when data loads
  useEffect(() => {
    if (games) {
      setLocalGames(games);
    }
  }, [games]);

  // Drag and drop sensors for admin dashboard
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Mutation to update game order
  const updateGameOrder = useMutation({
    mutationFn: async (gameOrders: { id: number; displayOrder: number }[]) => {
      console.log("Sending game order update:", gameOrders);
      const res = await apiRequest("PATCH", "/api/games/reorder", { gameOrders });
      if (!res.ok) {
        const errorData = await res.text();
        console.error("Failed to update game order:", res.status, errorData);
        throw new Error(`Failed to update game order: ${res.status} ${errorData}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({
        title: "Success",
        description: "Game order updated successfully",
      });
    },
    onError: (error: any) => {
      console.error("Game order update error:", error);
      toast({
        title: "Error",
        description: `Failed to update game order: ${error?.message || 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  // Handle drag end for admin dashboard
  function handleAdminDragEnd(event: any) {
    const { active, over } = event;

    if (!active || !over) {
      console.warn("Drag end event missing active or over data");
      return;
    }

    if (active.id !== over.id) {
      setLocalGames((games) => {
        if (!games || games.length === 0) {
          console.warn("No games available for reordering");
          return games;
        }

        const oldIndex = games.findIndex((game) => game.id === active.id);
        const newIndex = games.findIndex((game) => game.id === over.id);
        
        if (oldIndex === -1 || newIndex === -1) {
          console.warn("Could not find game indices for drag operation");
          return games;
        }
        
        const newGames = arrayMove(games, oldIndex, newIndex);
        
        // Update display order for all games starting from 0
        const gameOrders = newGames.map((game, index) => ({
          id: game.id,
          displayOrder: index,
        }));
        
        console.log("Updating game order with:", gameOrders);
        updateGameOrder.mutate(gameOrders);
        
        return newGames;
      });
    }
  }

  // Initialize the form with settings when they're loaded
  const form = useForm<VenueSettings>({
    resolver: zodResolver(venueSettingsSchema),
    defaultValues: {
      name: "",
      leaderboardName: "THE LEADERBOARD",
      logoUrl: "",
      animatedLogoUrl: "",
      logoBackgroundColor: "transparent",
      hideLogoBorderShadow: "false",
      subtitleBold: "true",
      subtitleAllCaps: "true",
      subtitleWhite: "false",
      gameSubtitleWhite: "false",
      gameSubtitleBold: "false",
      gameSubtitleItalic: "false",
      theme: {
        primary: "hsl(280, 100%, 50%)",
        variant: "vibrant",
        appearance: "dark",
        radius: 0.75
      }
    },
  });

  // Update form values when settings are loaded
  useEffect(() => {
    if (settings) {
      // Preserve current animated logo preview if it exists
      const currentAnimatedLogo = animatedLogoPreview || settings.animatedLogoUrl;
      
      form.reset(settings);
      setLogoPreview(settings.logoUrl || null);
      setAnimatedLogoPreview(currentAnimatedLogo || null);
      
      // If we have an animated logo preview that's not in the settings, update the form
      if (currentAnimatedLogo && currentAnimatedLogo !== settings.animatedLogoUrl) {
        form.setValue("animatedLogoUrl", currentAnimatedLogo);
      }
    }
  }, [settings, form, animatedLogoPreview]);

  // Update venue settings
  const updateSettings = useMutation({
    mutationFn: async (data: Partial<VenueSettings>) => {
      const res = await apiRequest("PATCH", "/api/admin/settings", data);
      return res.json() as Promise<VenueSettings>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      
      // Generate random animation number (1-10)
      const randomAnimation = Math.floor(Math.random() * 10) + 1;
      
      // Create themed toast notification
      toast({
        title: "Settings Updated",
        description: "Your changes have been saved successfully.",
        className: `themed-toast toast-anim-${randomAnimation}`,
        duration: 4000, // 4 seconds
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

  // Update game
  const updateGame = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Game> }) => {
      const res = await apiRequest("PATCH", `/api/games/${id}`, data);
      return res.json() as Promise<Game>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({
        title: "Game Updated",
        description: "Game data has been updated successfully.",
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

  // Theme switching functionality removed

  // Handle logo URL change
  const handleLogoUrlChange = (url: string) => {
    setLogoPreview(url || null);
    form.setValue("logoUrl", url);
  };

  // Handle animated logo URL change
  const handleAnimatedLogoUrlChange = (url: string) => {
    setAnimatedLogoPreview(url || null);
    form.setValue("animatedLogoUrl", url);
  };

  // Handle animated logo file upload
  const handleAnimatedLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please select a video file.",
      });
      return;
    }

    setIsUploadingAnimatedLogo(true);

    try {
      const formData = new FormData();
      formData.append('animatedLogo', file);

      // Use fetch directly for file uploads (don't use apiRequest which sets JSON headers)
      const response = await fetch('/api/admin/upload-animated-logo', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      
      setAnimatedLogoPreview(result.url);
      form.setValue("animatedLogoUrl", result.url);
      
      toast({
        title: "Upload successful",
        description: "Animated logo has been uploaded. Click Save Venue Information to apply changes.",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload animated logo. Please try again.",
      });
    } finally {
      setIsUploadingAnimatedLogo(false);
    }
  };

  // Handle form submission
  const onSaveVenueInfo = (data: VenueSettings) => {
    console.log('Saving venue settings:', data);
    console.log('Animated logo URL in form data:', data.animatedLogoUrl);
    updateSettings.mutate(data);
  };

  // Handle clear data confirmation
  const handleClearData = () => {
    if (clearDataConfirmation === "DELETE ALL") {
      window.location.href = "/api/admin/clear-all-data";
    } else {
      toast({
        variant: "destructive",
        title: "Incorrect confirmation",
        description: "You must type 'DELETE ALL' exactly to proceed.",
      });
    }
  };

  // Handle restore data confirmation
  const handleRestoreData = () => {
    if (restoreDataConfirmation === "RESTORE ALL") {
      window.location.href = "/api/admin/restore-demo-data";
    } else {
      toast({
        variant: "destructive",
        title: "Incorrect confirmation", 
        description: "You must type 'RESTORE ALL' exactly to proceed.",
      });
    }
  };

  // Handle image deletion
  const handleImageDelete = async (gameId: number, imageType: 'marquee' | 'overlay') => {
    try {
      const field = imageType === 'marquee' ? 'imageUrl' : 'overlayImageUrl';
      const response = await fetch(`/api/games/${gameId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: null }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({
        title: "Image Deleted",
        description: `${imageType === 'marquee' ? 'Marquee' : 'Overlay'} image has been removed successfully.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete image. Please try again.",
      });
    }
  };

  // Handle game editing
  const handleGameEdit = (id: number, field: string, value: string) => {
    updateGame.mutate({
      id,
      data: { [field]: value }
    });
  };
  
  // Add a new game
  const addGame = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/games", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({
        title: "Game Added",
        description: "New game has been added successfully.",
      });
      
      // Reset form
      setNewGameData({
        name: "",
        subtitle: "",
        imageUrl: "",
        type: "arcade"
      });
      
      // Close modal
      setShowAddGameModal(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });
  
  // Delete a game
  const deleteGame = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/games/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({
        title: "Game Deleted",
        description: "Game has been removed successfully.",
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
  
  // State for add game modal
  const [showAddGameModal, setShowAddGameModal] = useState(false);
  const [newGameData, setNewGameData] = useState({
    name: "",
    subtitle: "",
    imageUrl: "",
    type: "arcade"
  });
  
  // Handle new game data changes
  const handleNewGameChange = (field: string, value: string) => {
    setNewGameData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // State for tracking which game's image uploader is visible
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);

  if (settingsLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">Manage your venue settings</p>
      </div>

      {/* Theme Switcher removed from here */}

      <Tabs defaultValue="venue">
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="venue" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Venue Details
            </TabsTrigger>
            <TabsTrigger value="themes" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Theme Settings
            </TabsTrigger>
            <TabsTrigger value="games" className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4" />
              Game Management
            </TabsTrigger>
          </TabsList>
          
          <div className="flex space-x-2">
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

        <TabsContent value="venue" className="space-y-4">
          <Card className="themed-card">
            <CardHeader>
              <CardTitle>Venue Information</CardTitle>
              <CardDescription>
                Update your venue's basic information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-[2fr_1fr] gap-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSaveVenueInfo)} className="space-y-4">
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

                    {!logoPreview && !animatedLogoPreview && (
                      <FormField
                        control={form.control}
                        name="logoUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Logo URL</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                onChange={(e) => handleLogoUrlChange(e.target.value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}



                    <FormField
                      control={form.control}
                      name="logoBackgroundColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logo Background Color</FormLabel>
                          <FormControl>
                            <Select value={field.value || "transparent"} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select background color" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="transparent">Transparent</SelectItem>
                                <SelectItem value="white">White</SelectItem>
                                <SelectItem value="black">Black</SelectItem>
                                <SelectItem value="theme">Theme Color</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">
                            Background color for the logo area (useful for transparent videos)
                          </p>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hideLogoBorderShadow"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value === "true"}
                              onCheckedChange={(checked) => {
                                field.onChange(checked ? "true" : "false");
                              }}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Hide the border and shadow around logo?
                            </FormLabel>
                            <p className="text-xs text-muted-foreground">
                              Removes visual styling around the logo display area
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <FormLabel className="text-base font-semibold">Subtitle Styling Options</FormLabel>
                      
                      <FormField
                        control={form.control}
                        name="subtitleBold"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value === "true"}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked ? "true" : "false");
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Make subtitle bold
                              </FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Display the venue name in bold font weight
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="subtitleAllCaps"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value === "true"}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked ? "true" : "false");
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Display subtitle in all caps
                              </FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Transform venue name to uppercase letters
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="subtitleWhite"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value === "true"}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked ? "true" : "false");
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Use white color for subtitle
                              </FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Display subtitle in white instead of theme color
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Game Listing Styling Options */}
                    <div className="space-y-4">
                      <FormLabel className="text-base font-semibold">Game Listing Styling Options</FormLabel>
                      
                      <FormField
                        control={form.control}
                        name="gameSubtitleWhite"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value === "true"}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked ? "true" : "false");
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Use white color for game subtitles
                              </FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Display game subtitles in white instead of theme color
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="gameSubtitleBold"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value === "true"}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked ? "true" : "false");
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Make game subtitles bold
                              </FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Display game subtitles in bold font weight
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="gameSubtitleItalic"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value === "true"}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked ? "true" : "false");
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Make game subtitles italic
                              </FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Display game subtitles in italic font style
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="gameSpacing"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Game Listing Spacing</FormLabel>
                          <FormControl>
                            <div className="space-y-3">
                              <input
                                type="range"
                                min="20"
                                max="200"
                                step="4"
                                value={field.value || "24"}
                                onChange={(e) => field.onChange(e.target.value)}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                              />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>20px</span>
                                <span className="font-medium">{field.value || "24"}px spacing</span>
                                <span>200px</span>
                              </div>
                            </div>
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Adjust spacing between game listings (scales down on mobile)
                          </p>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Enter your venue's address" 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input {...field} type="tel" value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="hours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hours</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="e.g., Mon-Fri: 9am-9pm" 
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="mt-4"
                      disabled={updateSettings.isPending}
                    >
                      {updateSettings.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </Form>

                <div className="flex flex-col items-center">
                  {!animatedLogoPreview && !logoPreview && (
                    <div className="text-sm font-medium mb-2">Logo Preview</div>
                  )}
                  <div 
                    className={`w-full h-[200px] flex items-center justify-center p-4 ${
                      form.watch('hideLogoBorderShadow') === 'true' 
                        ? '' 
                        : 'border rounded-lg shadow-sm'
                    }`}
                    style={{
                      backgroundColor: 
                        form.watch('logoBackgroundColor') === 'white' ? '#ffffff' :
                        form.watch('logoBackgroundColor') === 'black' ? '#000000' :
                        form.watch('logoBackgroundColor') === 'theme' ? 'hsl(var(--primary))' :
                        'transparent'
                    }}
                  >
                    {animatedLogoPreview ? (
                      <video 
                        src={animatedLogoPreview} 
                        autoPlay 
                        loop 
                        muted
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          console.error('Video error:', e);
                          setAnimatedLogoPreview(null);
                        }}
                        onLoadStart={() => console.log('Video loading started')}
                        onCanPlay={() => console.log('Video can play')}
                      />
                    ) : logoPreview ? (
                      <img 
                        src={logoPreview} 
                        alt="Venue Logo" 
                        className="max-w-full max-h-full object-contain"
                        onError={() => setLogoPreview(null)}
                      />
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground">
                        <Image className="h-12 w-12 mb-2 opacity-50" />
                        <span>Logo preview</span>
                      </div>
                    )}
                  </div>
                  {animatedLogoPreview && logoPreview && (
                    <div className="text-xs text-muted-foreground mt-2 text-center">
                      Video logo is displayed. Image logo is saved as backup.
                    </div>
                  )}
                  {animatedLogoPreview && (
                    <div className="text-xs text-muted-foreground mt-2 text-center">
                      Video URL: {animatedLogoPreview}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="themes" className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            <p>Color schemes have been moved to the Game Management tab for better organization.</p>
          </div>
        </TabsContent>

        <TabsContent value="games" className="space-y-4">
          <Card className="themed-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5" />
                  <span>Game Management</span>
                </CardTitle>
                <CardDescription>
                  Edit game details and manage your arcade collection
                </CardDescription>
              </div>
              <Button 
                onClick={() => setShowAddGameModal(true)}
                className="ml-auto"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Game
              </Button>
            </CardHeader>
            <CardContent>
              {/* Theme Switcher removed to improve stability */}
              
              {gamesLoading ? (
                <div>Loading games...</div>
              ) : (
                <div className="space-y-8">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleAdminDragEnd}
                  >
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Game</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Image</TableHead>
                          <TableHead>Top Score</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <SortableContext
                          items={localGames}
                          strategy={verticalListSortingStrategy}
                        >
                          {localGames?.map((game) => (
                            <SortableGameTableRow
                              key={game.id}
                              game={game}
                              onGameEdit={handleGameEdit}
                              onDelete={(id) => deleteGame.mutate(id)}
                              onImageUpload={setSelectedGameId}
                              onImageDelete={handleImageDelete}
                            />
                          ))}
                        </SortableContext>
                      </TableBody>
                    </Table>
                  </DndContext>
                  
                  {/* Image Upload Section */}
                  {selectedGameId !== null && games?.find(g => g.id === selectedGameId) && (
                    <Card className="mt-8 border border-primary/20">
                      <CardHeader className="border-b bg-muted/50">
                        <CardTitle className="text-xl flex items-center gap-2">
                          <ImageDown className="h-5 w-5" />
                          Game Marquee Upload
                        </CardTitle>
                        <CardDescription>
                          Upload a new marquee image for {games.find(g => g.id === selectedGameId)?.name}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="space-y-8">
                          <MarqueeImageUploader
                            gameId={selectedGameId}
                            currentImageUrl={games.find(g => g.id === selectedGameId)?.imageUrl || null}
                            onSuccess={(imageUrl) => {
                              queryClient.invalidateQueries({ queryKey: ['/api/games'] });
                            }}
                          />
                          
                          <div className="border-t pt-6">
                            <OverlayImageUploader
                              gameId={selectedGameId}
                              currentOverlayUrl={games.find(g => g.id === selectedGameId)?.overlayImageUrl || null}
                              onSuccess={(overlayUrl) => {
                                queryClient.invalidateQueries({ queryKey: ['/api/games'] });
                              }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="themed-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M4 3h16a2 2 0 0 1 2 2v6a10 10 0 0 1-10 10A10 10 0 0 1 2 11V5a2 2 0 0 1 2-2z"></path>
                  <path d="M8 10h.01"></path>
                  <path d="M12 10h.01"></path>
                  <path d="M16 10h.01"></path>
                </svg>
                <span>Color Schemes</span>
              </CardTitle>
              <CardDescription>
                Choose from ten different color schemes for your arcade leaderboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {settings?.themePresets?.map((preset, index) => (
                  <Card 
                    key={index} 
                    className={`
                      overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300
                      ${settings.theme.primary === preset.primary ? 'ring-2 ring-primary border-primary' : ''}
                    `}
                    onClick={() => {
                      const newSettings = {
                        ...settings,
                        theme: preset
                      };
                      updateSettings.mutate(newSettings);
                    }}
                  >
                    <div 
                      className="h-12 w-full" 
                      style={{ 
                        background: `linear-gradient(45deg, ${preset.primary} 0%, ${preset.primary}aa 100%)` 
                      }}
                    >
                      {settings.theme.primary === preset.primary && (
                        <div className="flex justify-end p-2">
                          <div className="bg-white text-primary text-xs font-bold px-2 py-1 rounded-full">
                            ACTIVE
                          </div>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="font-medium text-sm">{preset.name}</div>
                        {preset.appearance === 'light' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
                            <circle cx="12" cy="12" r="4"/>
                            <path d="m12 2 0 2"/>
                            <path d="m12 20 0 2"/>
                            <path d="m4.93 4.93 1.41 1.41"/>
                            <path d="m17.66 17.66 1.41 1.41"/>
                            <path d="m2 12 2 0"/>
                            <path d="m20 12 2 0"/>
                            <path d="m6.34 17.66-1.41 1.41"/>
                            <path d="m19.07 4.93-1.41 1.41"/>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
                            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                          </svg>
                        )}
                      </div>
                      <div className="flex gap-1 items-center">
                        <div 
                          className="size-6 rounded-full shadow-sm" 
                          style={{ backgroundColor: preset.primary }}
                        ></div>
                        <div 
                          className="size-6 rounded-md shadow-sm" 
                          style={{ backgroundColor: preset.primary }}
                        ></div>
                        <Button 
                          size="sm" 
                          className="px-2 py-1 ml-auto text-xs h-6 shadow-lg border border-white/20"
                          style={{ 
                            backgroundColor: settings.theme.primary === preset.primary ? '#666' : preset.primary,
                            color: 'white',
                            textShadow: '0 1px 2px rgba(0,0,0,0.6)'
                          }}
                        >
                          Apply
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Database Management
              </CardTitle>
              <CardDescription>
                Options to reset or clear data from the system
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-semibold mb-2">Clear All Data</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Remove all games and scores from the database. This cannot be undone.
                </p>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    setClearDataConfirmation("");
                    setShowClearDataDialog(true);
                  }}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Clear All Data
                </Button>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Reset To Demo Data</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Restore the default demo data for testing. This will overwrite existing data.
                </p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setRestoreDataConfirmation("");
                    setShowRestoreDataDialog(true);
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Restore Demo Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clear Data Confirmation Dialog */}
        <Dialog open={showClearDataDialog} onOpenChange={setShowClearDataDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-destructive">⚠️ Clear All Data</DialogTitle>
              <DialogDescription>
                This will permanently delete ALL games and scores from the database. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="clear-confirmation">
                  Type <strong>DELETE ALL</strong> to confirm:
                </Label>
                <Input
                  id="clear-confirmation"
                  value={clearDataConfirmation}
                  onChange={(e) => setClearDataConfirmation(e.target.value)}
                  placeholder="DELETE ALL"
                  className={clearDataConfirmation === "DELETE ALL" ? "border-green-500" : ""}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowClearDataDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleClearData}
                disabled={clearDataConfirmation !== "DELETE ALL"}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Clear All Data
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Restore Data Confirmation Dialog */}
        <Dialog open={showRestoreDataDialog} onOpenChange={setShowRestoreDataDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>🔄 Restore Demo Data</DialogTitle>
              <DialogDescription>
                This will replace all current data with the default demo data. Existing games and scores will be overwritten.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="restore-confirmation">
                  Type <strong>RESTORE ALL</strong> to confirm:
                </Label>
                <Input
                  id="restore-confirmation"
                  value={restoreDataConfirmation}
                  onChange={(e) => setRestoreDataConfirmation(e.target.value)}
                  placeholder="RESTORE ALL"
                  className={restoreDataConfirmation === "RESTORE ALL" ? "border-green-500" : ""}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRestoreDataDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="default" 
                onClick={handleRestoreData}
                disabled={restoreDataConfirmation !== "RESTORE ALL"}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Restore Demo Data
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Add Game Modal */}
        {showAddGameModal && (
          <Dialog open={showAddGameModal} onOpenChange={setShowAddGameModal}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Game</DialogTitle>
                <DialogDescription>
                  Enter the details for the new arcade or pinball game.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Game Name</Label>
                  <Input 
                    id="name" 
                    value={newGameData.name} 
                    onChange={(e) => handleNewGameChange('name', e.target.value)}
                    placeholder="e.g., Pac-Man"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle (optional)</Label>
                  <Input 
                    id="subtitle" 
                    value={newGameData.subtitle} 
                    onChange={(e) => handleNewGameChange('subtitle', e.target.value)}
                    placeholder="e.g., Championship Edition"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Game Type</Label>
                  <Select 
                    value={newGameData.type} 
                    onValueChange={(value) => handleNewGameChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="arcade">Arcade</SelectItem>
                      <SelectItem value="pinball">Pinball</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddGameModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    if (!newGameData.name) {
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Game name is required",
                      });
                      return;
                    }
                    addGame.mutate(newGameData);
                  }}
                  disabled={addGame.isPending}
                >
                  {addGame.isPending ? "Adding..." : "Add Game"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </Tabs>
    </div>
  );
}
