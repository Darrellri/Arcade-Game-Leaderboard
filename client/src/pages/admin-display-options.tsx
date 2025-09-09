import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { VenueSettings } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  ArrowLeft,
  Settings,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function AdminDisplayOptions() {
  const { toast } = useToast();

  // Fetch venue settings
  const { data: venueSettings, isLoading: settingsLoading } = useQuery<VenueSettings>({
    queryKey: ["/api/admin/settings"],
  });

  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState({
    singleView: false,
    scrollView: false,
    gridView: false,
  });

  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Display View Options state
  const [displayViewSettings, setDisplayViewSettings] = useState({
    // Single View Settings
    singleViewSpeed: 6,
    singleViewAnimations: false,
    singleViewHideHeader: false,
    singleViewSize: "large",
    
    // Scroll View Settings
    scrollViewSpeed: 50,
    scrollViewSpacing: 200,
    scrollViewAnimations: false,
    scrollViewStickyHeader: true,
    scrollViewLazyLoad: false,
    scrollViewSize: "extra-large",
    
    // Grid View Settings
    gridViewScrollDirection: "up",
    gridViewSpeed: 75,
    gridViewColumns: 3,
    gridViewSpacing: 25,
    gridViewAnimations: false,
    gridViewHideHeader: false,
    gridViewStickyHeader: true,
    gridViewScrolling: false,
    gridViewSize: "normal",
  });

  // Initialize display view settings from database
  useEffect(() => {
    if (venueSettings) {
      setDisplayViewSettings({
        singleViewSpeed: venueSettings.singleViewSpeed || 6,
        singleViewAnimations: venueSettings.singleViewAnimations === true,
        singleViewHideHeader: venueSettings.singleViewHideHeader || false,
        singleViewSize: venueSettings.singleViewSize || "extra-large",
        
        scrollViewSpeed: venueSettings.scrollViewSpeed || 50,
        scrollViewSpacing: venueSettings.scrollViewSpacing || 200,
        scrollViewAnimations: venueSettings.scrollViewAnimations === true,
        scrollViewStickyHeader: venueSettings.scrollViewStickyHeader !== false,
        scrollViewLazyLoad: venueSettings.scrollViewLazyLoad || false,
        scrollViewSize: venueSettings.scrollViewSize || "extra-large",
        
        gridViewScrollDirection: venueSettings.gridViewScrollDirection || "up",
        gridViewSpeed: venueSettings.gridViewSpeed || 75,
        gridViewColumns: venueSettings.gridViewColumns || 3,
        gridViewSpacing: venueSettings.gridViewSpacing || 25,
        gridViewAnimations: venueSettings.gridViewAnimations === true,
        gridViewHideHeader: venueSettings.gridViewHideHeader || false,
        gridViewStickyHeader: venueSettings.gridViewStickyHeader !== false,
        gridViewScrolling: venueSettings.gridViewScrolling || false,
        gridViewSize: venueSettings.gridViewSize || "normal",
      });
    }
  }, [venueSettings]);

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
        description: "Display view options have been updated successfully.",
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

  // Save display view settings
  const saveDisplayViewSettings = () => {
    updateSettings.mutate(displayViewSettings);
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
            <h1 className="text-3xl font-bold">Display View Options</h1>
            <p className="text-muted-foreground">Configure settings for all display modes</p>
          </div>
        </div>
      </div>

      {/* Display View Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-lg font-bold">View Configuration</div>
              <CardDescription>Customize animations, sizing, and behavior for each display mode</CardDescription>
            </div>
          </CardTitle>
        </CardHeader>
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
                    <Label className="text-sm font-medium">Display Size</Label>
                    <select 
                      value={displayViewSettings.singleViewSize}
                      onChange={(e) => setDisplayViewSettings(prev => ({ ...prev, singleViewSize: e.target.value }))}
                      className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
                    >
                      <option value="normal">Regular Size</option>
                      <option value="large">Large (1.3x)</option>
                      <option value="extra-large">Extra Large (1.5x) - Default</option>
                      <option value="full">Full Screen (150px margins)</option>
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
                      Lazy Loading
                    </Label>
                    <p className="text-xs text-muted-foreground">Load games as needed for better performance</p>
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


            {/* Grid View Settings */}
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-base">Grid View (Card-based grid layout)</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('gridView')}
                  className="h-6 w-6 p-0"
                >
                  {collapsedSections.gridView ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {!collapsedSections.gridView && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Grid Columns</Label>
                    <select 
                      value={displayViewSettings.gridViewColumns}
                      onChange={(e) => setDisplayViewSettings(prev => ({ ...prev, gridViewColumns: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
                    >
                      <option value={2}>2 Columns</option>
                      <option value={3}>3 Columns (Default)</option>
                      <option value={4}>4 Columns</option>
                      <option value={5}>5 Columns</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={displayViewSettings.gridViewScrolling}
                        onChange={(e) => setDisplayViewSettings(prev => ({ ...prev, gridViewScrolling: e.target.checked }))}
                        className="rounded" 
                      />
                      Enable Scrolling
                    </Label>
                    <p className="text-xs text-muted-foreground">Automatically scroll through grid items</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={displayViewSettings.gridViewAnimations}
                        onChange={(e) => setDisplayViewSettings(prev => ({ ...prev, gridViewAnimations: e.target.checked }))}
                        className="rounded" 
                      />
                      Enable Animations
                    </Label>
                    <p className="text-xs text-muted-foreground">Hover and transition effects</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Display Size</Label>
                    <select 
                      value={displayViewSettings.gridViewSize}
                      onChange={(e) => setDisplayViewSettings(prev => ({ ...prev, gridViewSize: e.target.value }))}
                      className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
                    >
                      <option value="normal">Regular Size (Default)</option>
                      <option value="large">Large (1.3x)</option>
                      <option value="extra-large">Extra Large (1.5x)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-6 border-t">
            <Button 
              onClick={saveDisplayViewSettings} 
              disabled={updateSettings.isPending}
              size="lg"
            >
              {updateSettings.isPending ? "Saving..." : "Save All Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}