import { useState, useEffect } from "react";


import { useQuery, useMutation } from "@tanstack/react-query";
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
  Palette
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

  // Initialize the form with settings when they're loaded
  const form = useForm<VenueSettings>({
    resolver: zodResolver(venueSettingsSchema),
    defaultValues: {
      name: "",
      leaderboardName: "THE LEADERBOARD",
      logoUrl: "",
      animatedLogoUrl: "",
      logoBackgroundColor: "transparent",
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

                    <FormField
                      control={form.control}
                      name="animatedLogoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Animated Logo (Video)</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Input 
                                {...field} 
                                placeholder="Upload or enter video URL"
                                onChange={(e) => handleAnimatedLogoUrlChange(e.target.value)}
                              />
                              <input
                                type="file"
                                accept="video/*"
                                onChange={handleAnimatedLogoUpload}
                                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                                disabled={isUploadingAnimatedLogo}
                              />
                              {isUploadingAnimatedLogo && (
                                <p className="text-xs text-primary">Uploading video...</p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Upload a video file or enter a video URL. Video logo takes priority over image logo.
                              </p>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                  <div className="text-sm font-medium mb-2">Logo Preview</div>
                  <div 
                    className="border rounded-lg p-4 w-full h-[200px] flex items-center justify-center"
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                      className="h-16 w-full" 
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
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="font-medium text-lg">{preset.name}</div>
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
                      <div className="flex gap-2 flex-wrap">
                        <div 
                          className="size-8 rounded-full shadow-sm" 
                          style={{ backgroundColor: preset.primary }}
                        ></div>
                        <div 
                          className="size-8 rounded-md shadow-sm" 
                          style={{ backgroundColor: preset.primary }}
                        ></div>
                        <Button 
                          size="sm" 
                          className="px-3 ml-auto shadow-lg border border-white/20"
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
              <div className="mt-8 p-6 bg-card rounded-lg border shadow-md">
                <div className="text-lg font-medium mb-4">Theme Preview</div>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="font-medium mb-2">Buttons</div>
                      <div className="flex flex-wrap gap-2">
                        <Button>Primary</Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="outline">Outline</Button>
                        <Button variant="ghost">Ghost</Button>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium mb-2">UI Elements</div>
                      <div className="space-y-2">
                        <Input placeholder="Text input" className="max-w-[250px]" />
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="champion-icon">
                            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                            <path d="M4 22h16"></path>
                            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                            <path d="M9 2v7.5"></path>
                            <path d="M15 2v7.5"></path>
                            <path d="M12 2v10"></path>
                            <path d="M12 12a4 4 0 0 0 4-4V6H8v2a4 4 0 0 0 4 4Z"></path>
                          </svg>
                          <span className="champion-badge">Champion Score</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="font-medium mb-2">Color Palette</div>
                    <div className="flex flex-wrap gap-2">
                      <div className="h-8 w-20 rounded-md bg-primary flex items-center justify-center text-xs text-white font-medium">Primary</div>
                      <div className="h-8 w-20 rounded-md bg-secondary flex items-center justify-center text-xs text-secondary-foreground font-medium">Secondary</div>
                      <div className="h-8 w-20 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground font-medium">Muted</div>
                      <div className="h-8 w-20 rounded-md bg-accent flex items-center justify-center text-xs text-accent-foreground font-medium">Accent</div>
                      <div className="h-8 w-20 rounded-md border flex items-center justify-center text-xs font-medium">Border</div>
                    </div>
                  </div>
                </div>
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
                      {games?.map((game) => (
                        <TableRow key={game.id}>
                          <TableCell>
                            <div className="space-y-2">
                              <Input 
                                defaultValue={game.name}
                                className="w-full max-w-[200px]"
                                onBlur={(e) => {
                                  if (e.target.value !== game.name) {
                                    handleGameEdit(game.id, "name", e.target.value);
                                  }
                                }}
                              />
                              <Input 
                                defaultValue={game.subtitle || ''}
                                placeholder="Game subtitle"
                                className="w-full max-w-[200px] text-sm"
                                onBlur={(e) => {
                                  if (e.target.value !== game.subtitle) {
                                    handleGameEdit(game.id, "subtitle", e.target.value);
                                  }
                                }}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select 
                              defaultValue={game.type}
                              onValueChange={(value) => handleGameEdit(game.id, "type", value)}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="arcade">
                                  <div className="flex items-center gap-2">
                                    <Gamepad2 className="h-4 w-4" />
                                    <span>Arcade</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="pinball">
                                  <div className="flex items-center gap-2">
                                    <CircleDot className="h-4 w-4" />
                                    <span>Pinball</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                {/* Marquee Image Thumbnail */}
                                <div className="flex flex-col items-center gap-1">
                                  <div className="w-[60px] h-[16px] bg-card/50 rounded overflow-hidden">
                                    {game.imageUrl ? (
                                      <img 
                                        src={game.imageUrl} 
                                        alt={`${game.name} marquee`} 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                        <Image className="h-3 w-3" />
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground">Marquee</span>
                                </div>
                                
                                {/* Overlay Image Thumbnail */}
                                <div className="flex flex-col items-center gap-1">
                                  <div className="w-[16px] h-[16px] bg-card/50 rounded overflow-hidden">
                                    {game.overlayImageUrl ? (
                                      <img 
                                        src={game.overlayImageUrl} 
                                        alt={`${game.name} overlay`} 
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                        <Image className="h-3 w-3" />
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground">Overlay</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-8 px-2 text-xs flex items-center gap-1"
                                  onClick={() => setSelectedGameId(selectedGameId === game.id ? null : game.id)}
                                >
                                  <ImageDown className="h-3 w-3" />
                                  {selectedGameId === game.id ? "Close" : "Upload"}
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {game.currentHighScore ? (
                              <div>
                                <div className="font-mono font-bold">{game.currentHighScore.toLocaleString()}</div>
                                <div className="text-sm text-muted-foreground">by {game.topScorerName}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No scores yet</span>
                            )}
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
                                    deleteGame.mutate(game.id);
                                  }
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
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
