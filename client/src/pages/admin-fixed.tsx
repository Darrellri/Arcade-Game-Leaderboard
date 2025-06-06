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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGameSchema, insertVenueSettingsSchema, type Game, type InsertGame, type VenueSettings } from "@shared/schema";
import { 
  ArrowLeft, 
  PlusCircle, 
  Pencil, 
  Trash2, 
  Upload, 
  X, 
  GripVertical, 
  Eye, 
  EyeOff, 
  Settings, 
  Gamepad2, 
  Palette, 
  Monitor,
  Image,
  Type,
  Moon,
  Sun,
  Laptop
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
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
      <TableCell className="font-medium">{game.name}</TableCell>
      <TableCell>
        <Badge variant={game.type === 'pinball' ? 'default' : 'secondary'}>
          {game.type}
        </Badge>
      </TableCell>
      <TableCell>{game.currentHighScore || 'No scores yet'}</TableCell>
      <TableCell>{game.topScorerName || 'N/A'}</TableCell>
      <TableCell>
        <Switch
          checked={!game.hidden}
          onCheckedChange={(checked) => onGameEdit(game.id, 'hidden', !checked)}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <MarqueeImageUploader 
            gameId={game.id} 
            currentImageUrl={game.imageUrl}
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ['/api/games'] })}
          />
          <OverlayImageUploader 
            gameId={game.id} 
            currentOverlayUrl={game.overlayImageUrl}
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ['/api/games'] })}
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Game</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{game.name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(game.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function Admin() {
  const { toast } = useToast();
  const [showAddGameModal, setShowAddGameModal] = useState(false);
  const [gameFilter, setGameFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'score' | 'order'>('order');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [animatedLogoPreview, setAnimatedLogoPreview] = useState<string | null>(null);

  // Query for games
  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ['/api/games'],
    queryFn: async () => {
      const response = await fetch('/api/games?includeHidden=true');
      if (!response.ok) throw new Error('Failed to fetch games');
      return response.json() as Promise<Game[]>;
    }
  });

  // Query for venue settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/venue-settings'],
    queryFn: async () => {
      const response = await fetch('/api/venue-settings');
      if (!response.ok) throw new Error('Failed to fetch venue settings');
      return response.json() as Promise<VenueSettings>;
    }
  });

  // Form for venue settings
  const form = useForm<VenueSettings>({
    resolver: zodResolver(insertVenueSettingsSchema),
    defaultValues: {
      name: "",
      leaderboardName: "",
      address: "",
      phone: "",
      logoUrl: "",
      animatedLogoUrl: "",
      logoBackgroundColor: "#ffffff",
      hideLogoBorderShadow: false,
      subtitleBold: false,
      subtitleAllCaps: false,
      subtitleWhite: false,
      enableVerticalScroll: true,
      theme: {
        primary: "#7c3aed",
        variant: "vibrant",
        appearance: "dark",
        radius: 8
      },
      themePresets: []
    }
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      form.reset(settings);
      setLogoPreview(settings.logoUrl || null);
      setAnimatedLogoPreview(settings.animatedLogoUrl || null);
    }
  }, [settings, form]);

  // Form for adding games
  const gameForm = useForm<InsertGame>({
    resolver: zodResolver(insertGameSchema),
    defaultValues: {
      name: "",
      subtitle: "",
      type: "arcade",
      imageUrl: "",
      overlayImageUrl: "",
      displayOrder: 0,
      hidden: false
    }
  });

  // Mutation for updating venue settings
  const updateSettings = useMutation({
    mutationFn: async (data: VenueSettings) => {
      return apiRequest('/api/venue-settings', {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      toast({ title: "Settings updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/venue-settings'] });
    },
    onError: (error) => {
      toast({ title: "Failed to update settings", description: error.message, variant: "destructive" });
    }
  });

  // Mutation for adding games
  const addGame = useMutation({
    mutationFn: async (data: InsertGame) => {
      return apiRequest('/api/games', {
        method: 'POST',
        body: JSON.stringify({ ...data, displayOrder: 0 }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      toast({ title: "Game added successfully" });
      setShowAddGameModal(false);
      gameForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
    },
    onError: (error) => {
      toast({ title: "Failed to add game", description: error.message, variant: "destructive" });
    }
  });

  // Mutation for updating games
  const updateGame = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Game> }) => {
      return apiRequest(`/api/games/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
    },
    onError: (error) => {
      toast({ title: "Failed to update game", description: error.message, variant: "destructive" });
    }
  });

  // Mutation for deleting games
  const deleteGame = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/games/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast({ title: "Game deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
    },
    onError: (error) => {
      toast({ title: "Failed to delete game", description: error.message, variant: "destructive" });
    }
  });

  // Mutation for updating game order
  const updateGameOrder = useMutation({
    mutationFn: async (gameOrders: { id: number; displayOrder: number }[]) => {
      return apiRequest('/api/games/reorder', {
        method: 'POST',
        body: JSON.stringify({ gameOrders }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
    },
    onError: (error) => {
      toast({ title: "Failed to update game order", description: error.message, variant: "destructive" });
    }
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleAdminDragEnd(event: any) {
    const { active, over } = event;

    if (active.id !== over.id && games) {
      const oldIndex = games.findIndex((game) => game.id === active.id);
      const newIndex = games.findIndex((game) => game.id === over.id);
      
      const newGames = arrayMove(games, oldIndex, newIndex);
      
      const gameOrders = newGames.map((game, index) => ({
        id: game.id,
        displayOrder: index
      }));
      
      updateGameOrder.mutate(gameOrders);
    }
  }

  const onSaveVenueInfo = (data: VenueSettings) => {
    updateSettings.mutate(data);
  };

  const handleGameEdit = (id: number, field: string, value: string | boolean) => {
    updateGame.mutate({ id, data: { [field]: value } });
  };

  const handleGameDelete = (id: number) => {
    deleteGame.mutate(id);
  };

  const handleImageUpload = (gameId: number) => {
    // This is handled by the image uploader components
  };

  const handleImageDelete = (gameId: number, imageType: 'marquee' | 'overlay') => {
    const field = imageType === 'marquee' ? 'imageUrl' : 'overlayImageUrl';
    updateGame.mutate({ id: gameId, data: { [field]: null } });
  };

  // Filter and sort games
  const filteredAndSortedGames = games
    ?.filter(game => {
      if (gameFilter === 'visible') return !game.hidden;
      if (gameFilter === 'hidden') return game.hidden;
      return true;
    })
    ?.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'score':
          return (b.currentHighScore || 0) - (a.currentHighScore || 0);
        case 'order':
        default:
          return (a.displayOrder || 0) - (b.displayOrder || 0);
      }
    }) || [];

  if (gamesLoading || settingsLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>
      </div>

      <Tabs defaultValue="venue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="venue" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Venue Settings
          </TabsTrigger>
          <TabsTrigger value="games" className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4" />
            Game Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="venue" className="space-y-4">
          <Card className="themed-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Venue Information
              </CardTitle>
              <CardDescription>
                Configure your venue details and branding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSaveVenueInfo)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Venue Name</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} />
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
                          <FormLabel>Leaderboard Name</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
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
                            <Input {...field} value={field.value || ""} />
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
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} type="tel" value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Logo Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="logoUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Logo URL</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                value={field.value || ""} 
                                onChange={(e) => {
                                  field.onChange(e);
                                  setLogoPreview(e.target.value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="animatedLogoUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Animated Logo URL</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                value={field.value || ""} 
                                onChange={(e) => {
                                  field.onChange(e);
                                  setAnimatedLogoPreview(e.target.value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={updateSettings.isPending}>
                    {updateSettings.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Form>

              <div className="flex flex-col items-center mt-6">
                {!animatedLogoPreview && !logoPreview && (
                  <div className="text-sm font-medium mb-2">Logo Preview</div>
                )}
                <div 
                  className="w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800"
                  style={{ backgroundColor: form.watch('logoBackgroundColor') }}
                >
                  {logoPreview ? (
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
                {(logoPreview || animatedLogoPreview) && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-3 py-2 rounded-md">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5"/>
                      </svg>
                      Logo Uploaded
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLogoPreview(null);
                        setAnimatedLogoPreview(null);
                        form.setValue('logoUrl', '');
                        form.setValue('animatedLogoUrl', '');
                      }}
                      className="w-full"
                    >
                      Remove Logo
                    </Button>
                  </div>
                )}
                {animatedLogoPreview && (
                  <div className="text-xs text-muted-foreground mt-2 text-center">
                    Video URL: {animatedLogoPreview}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
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
                  Add, edit, and organize your arcade games
                </CardDescription>
              </div>
              <Button onClick={() => setShowAddGameModal(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Game
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Select value={gameFilter} onValueChange={(value: 'all' | 'visible' | 'hidden') => setGameFilter(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Games</SelectItem>
                    <SelectItem value="visible">Visible Only</SelectItem>
                    <SelectItem value="hidden">Hidden Only</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: 'name' | 'type' | 'score' | 'order') => setSortBy(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order">Sort by Order</SelectItem>
                    <SelectItem value="name">Sort by Name</SelectItem>
                    <SelectItem value="type">Sort by Type</SelectItem>
                    <SelectItem value="score">Sort by Score</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleAdminDragEnd}
              >
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Order</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>High Score</TableHead>
                        <TableHead>Top Scorer</TableHead>
                        <TableHead>Visible</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <SortableContext
                        items={filteredAndSortedGames?.map(game => game.id) || []}
                        strategy={verticalListSortingStrategy}
                      >
                        {filteredAndSortedGames?.map((game) => (
                          <SortableGameTableRow
                            key={game.id}
                            game={game}
                            onGameEdit={handleGameEdit}
                            onDelete={handleGameDelete}
                            onImageUpload={handleImageUpload}
                            onImageDelete={handleImageDelete}
                          />
                        ))}
                      </SortableContext>
                    </TableBody>
                  </Table>
                </div>
              </DndContext>

              {filteredAndSortedGames?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No games found. {gameFilter !== 'all' && `Try changing the filter or `}
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => setShowAddGameModal(true)}
                  >
                    add your first game
                  </Button>
                  .
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Game Modal */}
      <Dialog open={showAddGameModal} onOpenChange={setShowAddGameModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Game</DialogTitle>
            <DialogDescription>
              Add a new arcade or pinball game to your venue
            </DialogDescription>
          </DialogHeader>
          <Form {...gameForm}>
            <form onSubmit={gameForm.handleSubmit((data) => addGame.mutate(data))} className="space-y-4">
              <FormField
                control={gameForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Game Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter game name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={gameForm.control}
                name="subtitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subtitle (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter subtitle" value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={gameForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Game Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select game type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="arcade">Arcade</SelectItem>
                        <SelectItem value="pinball">Pinball</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddGameModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addGame.isPending}>
                  {addGame.isPending ? "Adding..." : "Add Game"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}