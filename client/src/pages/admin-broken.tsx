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
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
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
            <span className="font-medium">{game.name}</span>
          </div>
        </div>
      </TableCell>
      
      <TableCell>
        <input
          type="text"
          value={game.subtitle || ""}
          onChange={(e) => onGameEdit(game.id, "subtitle", e.target.value)}
          className="w-full px-2 py-1 text-sm border rounded"
          placeholder="Subtitle (optional)"
        />
      </TableCell>
      
      <TableCell>
        <Select 
          value={game.type} 
          onValueChange={(value) => onGameEdit(game.id, "type", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="arcade">Arcade</SelectItem>
            <SelectItem value="pinball">Pinball</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      
      <TableCell>
        <div className="flex flex-col gap-2">
          <MarqueeImageUploader 
            gameId={game.id}
            currentImageUrl={game.imageUrl}
            onSuccess={() => {
              // Refetch games after successful upload
              window.location.reload();
            }}
          />
          <OverlayImageUploader 
            gameId={game.id}
            currentOverlayUrl={game.overlayImageUrl}
            onSuccess={() => {
              // Refetch games after successful upload
              window.location.reload();
            }}
          />
        </div>
      </TableCell>
      
      <TableCell className="text-center">
        <Badge variant={game.hidden ? "secondary" : "default"}>
          {game.hidden ? "Hidden" : "Visible"}
        </Badge>
      </TableCell>
      
      <TableCell>
        <div className="flex flex-col gap-1">
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
            variant={game.hidden ? "default" : "secondary"} 
            size="sm"
            className="w-full"
            onClick={() => {
              onGameEdit(game.id, "hidden", !game.hidden);
            }}
          >
            {game.hidden ? "Unhide" : "Hide"}
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
  
  // State for sorting and filtering
  const [sortBy, setSortBy] = useState("displayOrder");
  const [filterType, setFilterType] = useState("all");
  
  // State for confirmation dialogs
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
  const [showRestoreDataDialog, setShowRestoreDataDialog] = useState(false);
  const [clearDataConfirmation, setClearDataConfirmation] = useState("");
  const [restoreDataConfirmation, setRestoreDataConfirmation] = useState("");

  // Fetch venue settings
  const { data: settings, isLoading: settingsLoading } = useQuery<VenueSettings>({
    queryKey: ["/api/admin/settings"],
  });

  // Fetch all games (including hidden ones for admin view)
  const { data: games, isLoading: gamesLoading } = useQuery<Game[]>({
    queryKey: ["/api/games", { includeHidden: true }],
    queryFn: () => apiRequest("GET", "/api/games?includeHidden=true").then(res => res.json()),
  });

  // Local state for drag-and-drop games ordering
  const [localGames, setLocalGames] = useState<Game[]>([]);

  // Set local games when data loads and apply sorting/filtering
  useEffect(() => {
    if (games) {
      let filteredGames = [...games];
      
      // Apply type filter
      if (filterType !== "all") {
        filteredGames = filteredGames.filter(game => game.type === filterType);
      }
      
      // Apply sorting
      filteredGames.sort((a, b) => {
        switch (sortBy) {
          case "name":
            return a.name.localeCompare(b.name);
          case "type":
            return a.type.localeCompare(b.type);
          case "displayOrder":
          default:
            return (a.displayOrder || 0) - (b.displayOrder || 0);
        }
      });
      
      setLocalGames(filteredGames);
    }
  }, [games, sortBy, filterType]);

  // Initialize form with current settings
  const form = useForm({
    resolver: zodResolver(insertVenueSettingsSchema),
    defaultValues: {
      name: "",
      leaderboardName: "",
      logoUrl: "",
      animatedLogoUrl: "",
      logoBackgroundColor: "transparent",
      hideLogoBorderShadow: "false",
      subtitleBold: "false",
      subtitleAllCaps: "false", 
      subtitleWhite: "false",
      gameSubtitleWhite: "false",
      gameSubtitleBold: "false",
      gameSubtitleItalic: "false",
      titleboxSpacing: "20",
      gameSpacing: "30",
      address: "",
    },
  });

  // Update form when settings load
  useEffect(() => {
    if (settings) {
      form.reset({
        name: settings.name || "",
        leaderboardName: settings.leaderboardName || "",
        logoUrl: settings.logoUrl || "",
        animatedLogoUrl: settings.animatedLogoUrl || "",
        logoBackgroundColor: settings.logoBackgroundColor || "transparent",
        hideLogoBorderShadow: settings.hideLogoBorderShadow || "false",
        subtitleBold: settings.subtitleBold || "false",
        subtitleAllCaps: settings.subtitleAllCaps || "false",
        subtitleWhite: settings.subtitleWhite || "false",
        gameSubtitleWhite: settings.gameSubtitleWhite || "false",
        gameSubtitleBold: settings.gameSubtitleBold || "false",
        gameSubtitleItalic: settings.gameSubtitleItalic || "false",
        titleboxSpacing: settings.titleboxSpacing || "20",
        gameSpacing: settings.gameSpacing || "30",
        address: settings.address || "",
      });
      
      // Set logo previews if they exist
      if (settings.logoUrl) {
        setLogoPreview(settings.logoUrl);
      }
      if (settings.animatedLogoUrl) {
        setAnimatedLogoPreview(settings.animatedLogoUrl);
      }
    }
  }, [settings, form]);

  // Handle logo URL changes
  const handleLogoUrlChange = (url: string) => {
    form.setValue("logoUrl", url);
    setLogoPreview(url || null);
  };

  // Logo upload handler
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'logo');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
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

  // Animated logo upload handler
  const handleAnimatedLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingAnimatedLogo(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'animated-logo');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
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
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", "/api/admin/settings", data);
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

  // Add game mutation
  const addGame = useMutation({
    mutationFn: async (data: InsertGame) => {
      const response = await apiRequest("POST", "/api/games", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      setShowAddGameModal(false);
      setNewGameData({ name: "", subtitle: "", imageUrl: "", type: "arcade" });
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
      const response = await apiRequest("PUT", `/api/games/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({
        title: "Game Updated",
        description: "Game has been updated successfully.",
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

      <Tabs defaultValue="venue">
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="venue" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Venue Details
            </TabsTrigger>

            <TabsTrigger value="games" className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4" />
              Game Management
            </TabsTrigger>

            <TabsTrigger value="notes" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Notes
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

                    {/* Styling Options - Side by side boxes */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Subtitle Styling Options */}
                      <div className="border rounded-lg p-4 bg-card/50">
                        <h4 className="text-base font-semibold mb-4 text-primary">Subtitle Styling Options</h4>
                        <div className="space-y-3">
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
                      </div>

                      {/* Game Listing Styling Options */}
                      <div className="border rounded-lg p-4 bg-card/50">
                        <h4 className="text-base font-semibold mb-4 text-primary">Game Listing Styling Options</h4>
                        <div className="space-y-3">
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
                      </div>
                    </div>

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

                  {/* Static Logo Preview (backup/fallback) */}
                  {logoPreview && (
                    <div className="space-y-2">
                      <h4 className="font-medium">
                        {animatedLogoPreview ? "Backup Static Logo:" : "Current Static Logo Preview:"}
                      </h4>
                      <img src={logoPreview} alt="Logo preview" className="max-w-xs max-h-24 object-contain border rounded" />
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
                      {animatedLogoPreview && (
                        <div className="text-xs text-muted-foreground">
                          This static logo is kept as backup. Video logo will be displayed when available.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Logo Background Options */}
                  {(logoPreview || animatedLogoPreview) && (
                    <div className="space-y-3 pt-4 border-t">
                      <h4 className="font-medium">Logo Display Options</h4>
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
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="games" className="space-y-4">
          <Card className="themed-card">
            <CardHeader>
              <CardTitle>Game Management</CardTitle>
              <CardDescription>
                Manage your arcade games
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Game management functionality will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card className="themed-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                System Features & Documentation
              </CardTitle>
              <CardDescription>
                Complete overview of the high score tracking system capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Core Features */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-primary">🎮 Core Features</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Game Management</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                      <li>• Add/edit arcade and pinball games</li>
                      <li>• Drag-and-drop game ordering</li>
                      <li>• Hide/show games from public view</li>
                      <li>• Upload marquee and overlay images</li>
                      <li>• Auto-generated QR codes for each game</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Score Tracking</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                      <li>• Real-time high score tracking</li>
                      <li>• Photo evidence with scores</li>
                      <li>• Champion tracking with dates</li>
                      <li>• Days as champion counter</li>
                      <li>• Complete score history per game</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}