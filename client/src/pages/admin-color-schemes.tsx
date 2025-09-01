import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { VenueSettings } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  ArrowLeft,
  Palette,
  Moon,
  Sun,
} from "lucide-react";

export default function AdminColorSchemes() {
  const { toast } = useToast();

  // Fetch venue settings
  const { data: venueSettings, isLoading: settingsLoading } = useQuery<VenueSettings>({
    queryKey: ["/api/admin/settings"],
  });

  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: async (data: Partial<VenueSettings>) => {
      const response = await apiRequest("POST", "/api/admin/settings", data);
      return response.json();
    },
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
          {venueSettings?.logoUrl && (
            <img 
              src={venueSettings.logoUrl} 
              alt="Venue Logo"
              className="w-[100px] h-auto object-contain"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold">Color Schemes</h1>
            <p className="text-muted-foreground">Transform your arcade's visual identity</p>
          </div>
        </div>
      </div>

      {/* Color Schemes Section */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-background border-b">
          <CardTitle className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Palette className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-lg font-bold">Theme Gallery</div>
                <div className="text-sm text-muted-foreground font-normal">
                  Choose from professionally designed color schemes
                </div>
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

          {/* Current Theme Info */}
          {venueSettings?.theme && (
            <div className="mt-6 p-4 bg-muted/30 rounded-lg border">
              <h4 className="font-semibold mb-2">Currently Active Theme</h4>
              <div className="flex items-center gap-4">
                <div 
                  className="w-8 h-8 rounded border shadow-sm"
                  style={{ backgroundColor: venueSettings.theme.primary }}
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Primary:</span>
                    <div className="font-mono text-xs">{venueSettings.theme.primary}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Variant:</span>
                    <div className="capitalize">{venueSettings.theme.variant}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mode:</span>
                    <div className="flex items-center gap-1 capitalize">
                      {venueSettings.theme.appearance === 'dark' ? (
                        <>
                          <Moon className="w-3 h-3" />
                          Dark
                        </>
                      ) : (
                        <>
                          <Sun className="w-3 h-3" />
                          Light
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Radius:</span>
                    <div>{venueSettings.theme.radius}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}