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
import { Palette, Upload, Gamepad2, CircleDot, Image } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function Admin() {
  const { toast } = useToast();
  const { updateTheme } = useTheme();
  const [selectedScheme, setSelectedScheme] = useState<number | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

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
      form.reset(settings);
      setLogoPreview(settings.logoUrl || null);
      
      // Find the current theme in presets
      if (settings.themePresets) {
        const currentThemeIndex = settings.themePresets.findIndex(
          preset => preset.primary === settings.theme.primary && preset.variant === settings.theme.variant
        );
        if (currentThemeIndex !== -1) {
          setSelectedScheme(currentThemeIndex);
        }
      }
    }
  }, [settings, form]);

  // Update venue settings
  const updateSettings = useMutation({
    mutationFn: async (data: Partial<VenueSettings>) => {
      const res = await apiRequest("PATCH", "/api/admin/settings", data);
      return res.json() as Promise<VenueSettings>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Settings Updated",
        description: "Your changes have been saved successfully.",
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

  // Handle theme switching
  const handleThemeSwitch = (index: number) => {
    if (!settings?.themePresets) return;
    
    const newTheme = settings.themePresets[index];
    setSelectedScheme(index);
    
    // Update the theme object for real-time UI changes
    updateTheme({
      primary: newTheme.primary,
      variant: newTheme.variant,
      appearance: newTheme.appearance,
      radius: newTheme.radius
    });
    
    // Also update the theme in storage
    updateSettings.mutate({ 
      theme: {
        primary: newTheme.primary,
        variant: newTheme.variant,
        appearance: newTheme.appearance,
        radius: newTheme.radius
      } 
    });
  };

  // Handle logo URL change
  const handleLogoUrlChange = (url: string) => {
    setLogoPreview(url || null);
    form.setValue("logoUrl", url);
  };

  // Handle form submission
  const onSaveVenueInfo = (data: VenueSettings) => {
    updateSettings.mutate(data);
  };

  // Handle game editing
  const handleGameEdit = (id: number, field: string, value: string) => {
    updateGame.mutate({
      id,
      data: { [field]: value }
    });
  };

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
          <TabsTrigger value="venue">Venue Details</TabsTrigger>
          <TabsTrigger value="games">Game Management</TabsTrigger>
        </TabsList>

        <TabsContent value="venue" className="space-y-4">
          <Card>
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
                          <FormLabel>Venue Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                  <div className="border rounded-lg p-4 w-full h-[200px] flex items-center justify-center bg-muted/30">
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
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Theme Settings tab removed */}

        <TabsContent value="games" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5" />
                <span>Game Management</span>
              </CardTitle>
              <CardDescription>
                Edit game details and manage your arcade collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Horizontal Theme Switcher */}
              {settings?.themePresets && (
                <div className="mb-6">
                  <div className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    <span>Theme Switcher</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {settings.themePresets.map((preset, index) => (
                      <button
                        key={preset.name}
                        onClick={() => handleThemeSwitch(index)}
                        className={`w-10 h-10 rounded-full border transition-all ${
                          selectedScheme === index
                            ? "ring-2 ring-primary ring-offset-2 border-primary"
                            : "border-border hover:border-primary"
                        }`}
                        style={{ backgroundColor: preset.primary }}
                        title={preset.name}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {gamesLoading ? (
                <div>Loading games...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Game</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Image URL</TableHead>
                      <TableHead>Top Score</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {games?.map((game) => (
                      <TableRow key={game.id}>
                        <TableCell>
                          <Input 
                            defaultValue={game.name}
                            className="w-full max-w-[200px]"
                            onBlur={(e) => {
                              if (e.target.value !== game.name) {
                                handleGameEdit(game.id, "name", e.target.value);
                              }
                            }}
                          />
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
                          <Input 
                            defaultValue={game.imageUrl}
                            className="w-full max-w-[250px]"
                            onBlur={(e) => {
                              if (e.target.value !== game.imageUrl) {
                                handleGameEdit(game.id, "imageUrl", e.target.value);
                              }
                            }}
                          />
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
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              // Preview functionality could be added here
                              window.open(`/leaderboard/${game.id}`, '_blank');
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
