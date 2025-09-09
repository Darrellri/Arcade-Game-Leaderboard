import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { VenueSettings } from "@shared/schema";
import { insertVenueSettingsSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  ArrowLeft,
  Building2,
  Upload,
} from "lucide-react";

// Font options for venue name and leaderboard title
const fontOptions = [
  // Common fonts
  { value: "Arial", label: "Arial" },
  { value: "Helvetica", label: "Helvetica" },
  { value: "Georgia", label: "Georgia" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Verdana", label: "Verdana" },
  // Title/display fonts
  { value: "Impact", label: "Impact" },
  { value: "Bebas Neue", label: "Bebas Neue" },
  { value: "Oswald", label: "Oswald" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Playfair Display", label: "Playfair Display" },
];

const fontStyleOptions = [
  { value: "normal", label: "Normal" },
  { value: "bold", label: "Bold" },
  { value: "italic", label: "Italic" },
];

export default function AdminVenueSettings() {
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [animatedLogoPreview, setAnimatedLogoPreview] = useState<string | null>(null);
  const [isUploadingAnimatedLogo, setIsUploadingAnimatedLogo] = useState(false);

  // Fetch venue settings
  const { data: venueSettings, isLoading: settingsLoading } = useQuery<VenueSettings>({
    queryKey: ["/api/admin/settings"],
  });

  // Form setup for venue settings
  const form = useForm<VenueSettings>({
    resolver: zodResolver(insertVenueSettingsSchema),
    defaultValues: {
      name: "",
      nameFont: "Arial",
      nameFontStyle: "normal",
      nameFontSize: 30,
      leaderboardName: "",
      leaderboardFont: "Arial",
      leaderboardFontStyle: "normal",
      leaderboardFontSize: 30,
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

  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: async (data: Partial<VenueSettings>) => {
      const response = await apiRequest("PATCH", "/api/admin/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Settings Saved",
        description: "Venue settings have been updated successfully.",
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
          title: "Video Logo Uploaded",
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

  // Handle form submission
  const onSubmit = async (data: VenueSettings) => {
    updateSettings.mutate(data);
  };

  if (settingsLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
        </Link>
        <div className="flex items-center gap-4">
          {(venueSettings?.logoUrl || venueSettings?.animatedLogoUrl) && (
            <div className="w-[100px] h-auto">
              {venueSettings.animatedLogoUrl ? (
                <video 
                  src={venueSettings.animatedLogoUrl} 
                  autoPlay 
                  loop 
                  muted
                  className="w-full h-full object-contain" 
                />
              ) : (
                <img 
                  src={venueSettings.logoUrl} 
                  alt="Venue Logo"
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold">Venue Settings</h1>
            <p className="text-muted-foreground">Configure your venue's basic information and branding</p>
          </div>
        </div>
      </div>

      {/* Venue Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-lg font-bold">Venue Information</div>
              <CardDescription>
                Set up your venue's basic details, contact information, and logo branding
              </CardDescription>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Venue Name - Full width */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Your Venue Name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Venue Name Font Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <FormField
                  control={form.control}
                  name="nameFont"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue Name Font</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "Arial"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select font" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fontOptions.map((font) => (
                            <SelectItem key={font.value} value={font.value}>
                              {font.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nameFontStyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Font Style</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "normal"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fontStyleOptions.map((style) => (
                            <SelectItem key={style.value} value={style.value}>
                              {style.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nameFontSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Font Size (pt)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={16}
                          max={40}
                          {...field}
                          value={field.value ?? 30}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                          placeholder="30"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Leaderboard Name - Full width */}
              <FormField
                control={form.control}
                name="leaderboardName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leaderboard Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="THE LEADERBOARD" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Leaderboard Title Font Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <FormField
                  control={form.control}
                  name="leaderboardFont"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leaderboard Title Font</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "Arial"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select font" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fontOptions.map((font) => (
                            <SelectItem key={font.value} value={font.value}>
                              {font.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="leaderboardFontStyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Font Style</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "normal"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fontStyleOptions.map((style) => (
                            <SelectItem key={style.value} value={style.value}>
                              {style.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="leaderboardFontSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Font Size (pt)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={16}
                          max={40}
                          {...field}
                          value={field.value ?? 30}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                          placeholder="30"
                        />
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

          <div className="space-y-4 pt-6 border-t">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Static Logo Upload
              </h3>
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
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Video Logo Upload
              </h3>
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
        </CardContent>
      </Card>
    </div>
  );
}