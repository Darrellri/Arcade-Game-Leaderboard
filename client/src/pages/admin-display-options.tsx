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
  Square,
  List,
  Grid2X2,
  Palette,
  Moon,
  Sun,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminDisplayOptions() {
  const { toast } = useToast();

  // Fetch venue settings
  const { data: venueSettings, isLoading: settingsLoading } = useQuery<VenueSettings>({
    queryKey: ["/api/admin/settings"],
  });

  // Font styling functions
  const getVenueNameStyle = () => ({
    fontFamily: venueSettings?.nameFont || "Arial",
    fontWeight: venueSettings?.nameFontStyle === "bold" ? "bold" : "normal",
    fontStyle: venueSettings?.nameFontStyle === "italic" ? "italic" : "normal",
    fontSize: `${venueSettings?.nameFontSize || 30}pt`,
    letterSpacing: '2px',
    lineHeight: 'calc(1.25em + 2px)',
    color: venueSettings?.subtitleWhite === "true" 
      ? "white" 
      : (() => {
          // For lighter color schemes, use primary color (same as game titles)
          const isLightScheme = venueSettings?.theme?.appearance === "light" || 
            (venueSettings?.theme?.variant === "tint" && venueSettings?.theme?.appearance !== "dark") ||
            (venueSettings?.theme?.primary && parseInt(venueSettings.theme.primary.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)?.[3] || "0") > 60);
          
          if (isLightScheme) {
            // Use the same color as game titles (primary color)
            return venueSettings?.theme?.primary || "hsl(280, 100%, 50%)";
          } else {
            // For dark schemes, use a lighter purple color
            return "hsl(280, 100%, 75%)";
          }
        })()
  });

  const getLeaderboardTitleStyle = () => ({
    fontFamily: venueSettings?.leaderboardFont || "Arial",
    fontWeight: venueSettings?.leaderboardFontStyle === "bold" ? "bold" : "normal",
    fontStyle: venueSettings?.leaderboardFontStyle === "italic" ? "italic" : "normal",
    fontSize: `${venueSettings?.leaderboardFontSize || 30}pt`,
    letterSpacing: '1px'
  });

  // Function to cycle through color schemes
  const cycleColorScheme = () => {
    if (!venueSettings?.themePresets) return;
    
    const currentTheme = venueSettings.theme;
    const presets = venueSettings.themePresets;
    
    const currentIndex = presets.findIndex(preset => 
      preset.primary === currentTheme.primary && 
      preset.variant === currentTheme.variant
    );
    
    const nextIndex = (currentIndex + 1) % presets.length;
    const nextTheme = presets[nextIndex];
    
    updateSettings.mutate({ theme: nextTheme });
  };

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
    <div 
      className="space-y-2 min-h-screen flex flex-col"
      style={{
        '--titlebox-spacing': `${parseInt(venueSettings?.titleboxSpacing || "20")}px`
      } as React.CSSProperties}
    >
      {/* Header with venue name and admin controls */}
      <div className="themed-header px-5 py-4 rounded-lg mb-2 w-full">
        
        {/* Mobile Layout: 3 Rows (visible on small screens only) */}
        <div className="block md:hidden">
          {/* Row 1: Logos evenly spaced */}
          <div className="flex items-center justify-between mb-3">
            {/* Left: Venue Logo */}
            <div className="flex-1 flex justify-start">
              {(venueSettings?.animatedLogoUrl || venueSettings?.logoUrl) && (
                <div 
                  className={`logo-container overflow-hidden cursor-pointer hover:opacity-80 transition-opacity w-20 h-10 flex items-center justify-center ${
                    venueSettings.hideLogoBorderShadow === 'true' 
                      ? '' 
                      : 'rounded-md shadow-md border border-primary/20'
                  }`}
                  style={{ 
                    backgroundColor: 
                      venueSettings.logoBackgroundColor === 'white' ? '#ffffff' :
                      venueSettings.logoBackgroundColor === 'black' ? '#000000' :
                      venueSettings.logoBackgroundColor === 'theme' ? 'hsl(var(--primary))' :
                      'transparent'
                  }}
                  onClick={cycleColorScheme}
                  title="Click to cycle through color schemes"
                >
                  {venueSettings.animatedLogoUrl ? (
                    <video 
                      src={venueSettings.animatedLogoUrl} 
                      autoPlay 
                      loop 
                      muted
                      className="w-full h-full object-contain transparent-video" 
                    />
                  ) : (
                    <img 
                      src={venueSettings.logoUrl} 
                      alt={venueSettings.name} 
                      className="w-full h-full object-contain p-1" 
                    />
                  )}
                </div>
              )}
            </div>
            
            {/* Right: Arcade Leaderboard Logo */}
            <div className="flex-1 flex justify-end">
              <div className="w-20 h-10 flex items-center justify-center">
                <img 
                  src="/arcade-leaderboard-logo.png" 
                  alt="Arcade Leaderboard" 
                  className="max-w-full max-h-full object-contain" 
                />
              </div>
            </div>
          </div>
          
          {/* Row 2: Leaderboard Name */}
          <div className="mb-2">
            <h1 className="font-black tracking-tight text-foreground uppercase text-outline leading-tight text-center" 
                style={{...getLeaderboardTitleStyle(), fontSize: '16px'}}>
              {venueSettings?.leaderboardName || "THE LEADERBOARD"}
            </h1>
          </div>
          
          {/* Row 3: Venue Name */}
          <div className="mb-3">
            <h2 
              className={`tracking-tight leading-tight text-center ${
                venueSettings?.subtitleBold === "true" ? "font-bold" : "font-normal"
              } ${
                venueSettings?.subtitleAllCaps === "true" ? "uppercase" : ""
              }`}
              style={{...getVenueNameStyle(), fontSize: '14px'}}
            >
              {venueSettings?.name || "Arcade"}
            </h2>
          </div>
          
          {/* Controls Row for Mobile */}
          <div className="flex items-center justify-center gap-2">
            {/* View Mode Buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                asChild
                className="shadow-sm hover:shadow-md transition-all duration-200 h-[42px] w-[42px]"
                title="Single View"
              >
                <Link href="/">
                  <Square className="h-[16px] w-[16px]" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="icon"
                asChild
                className="shadow-sm hover:shadow-md transition-all duration-200 h-[42px] w-[42px]"
                title="Scroll View"
              >
                <Link href="/">
                  <List className="h-[16px] w-[16px]" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="icon"
                asChild
                className="shadow-sm hover:shadow-md transition-all duration-200 h-[42px] w-[42px]"
                title="Grid View"
              >
                <Link href="/">
                  <Grid2X2 className="h-[16px] w-[16px]" />
                </Link>
              </Button>
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex gap-1">
              <Button 
                variant="default" 
                size="sm" 
                asChild 
                className="h-[36px] px-4 text-base"
              >
                <Link href="/admin">Admin</Link>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                asChild 
                className="h-[36px] px-4 text-base"
              >
                <Link href="/admin">Back</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop Layout: Three Column Layout (visible on medium screens and up) */}
        <div className="hidden md:flex items-center w-full">
          {/* Left Venue Logo - Fixed 300px on desktop */}
          <div className="flex-shrink-0 w-[300px] flex justify-center">
            {(venueSettings?.animatedLogoUrl || venueSettings?.logoUrl) && (
              <div 
                className={`logo-container overflow-hidden cursor-pointer hover:opacity-80 transition-opacity w-[280px] h-36 flex items-center justify-center ${
                  venueSettings.hideLogoBorderShadow === 'true' 
                    ? '' 
                    : 'rounded-md shadow-md border border-primary/20'
                }`}
                style={{ 
                  backgroundColor: 
                    venueSettings.logoBackgroundColor === 'white' ? '#ffffff' :
                    venueSettings.logoBackgroundColor === 'black' ? '#000000' :
                    venueSettings.logoBackgroundColor === 'theme' ? 'hsl(var(--primary))' :
                    'transparent'
                }}
                onClick={cycleColorScheme}
                title="Click to cycle through color schemes"
              >
                {venueSettings.animatedLogoUrl ? (
                  <video 
                    src={venueSettings.animatedLogoUrl} 
                    autoPlay 
                    loop 
                    muted
                    className="w-full h-full object-contain transparent-video" 
                  />
                ) : (
                  <img 
                    src={venueSettings.logoUrl} 
                    alt={venueSettings.name} 
                    className="w-full h-full object-contain p-2" 
                  />
                )}
              </div>
            )}
          </div>
          
          {/* Center Content Area - Titles centered from marquee position */}
          <div className="flex-1 min-w-0 flex flex-col justify-center px-4">
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-foreground uppercase text-outline leading-tight text-center" style={getLeaderboardTitleStyle()}>
              {venueSettings?.leaderboardName || "THE LEADERBOARD"}
            </h1>
            <h2 
              className={`text-2xl lg:text-[2.625rem] tracking-tight leading-tight text-center ${
                venueSettings?.subtitleBold === "true" ? "font-bold" : "font-normal"
              } ${
                venueSettings?.subtitleAllCaps === "true" ? "uppercase" : ""
              }`}
              style={getVenueNameStyle()}
            >
              {venueSettings?.name || "Arcade"}
            </h2>
          </div>
          
          {/* Right Controls and Leaderboard Logo - Fixed 300px on desktop */}
          <div className="flex-shrink-0 w-[300px] flex justify-center">
            <div className="flex flex-col gap-2 self-center relative">
              {/* Navigation Elements */}
              <div className="flex flex-col gap-2">
                {/* View Mode Buttons Row */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    asChild
                    className="shadow-sm hover:shadow-md transition-all duration-200 h-[52px] w-[52px]"
                    title="Single View - One large game centered"
                  >
                    <Link href="/">
                      <Square className="h-[21px] w-[21px]" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    asChild
                    className="shadow-sm hover:shadow-md transition-all duration-200 h-[52px] w-[52px]"
                    title="Scroll View - Infinite vertical scroll"
                  >
                    <Link href="/">
                      <List className="h-[21px] w-[21px]" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    asChild
                    className="shadow-sm hover:shadow-md transition-all duration-200 h-[52px] w-[52px]"
                    title="Grid View - Games in a grid layout"
                  >
                    <Link href="/">
                      <Grid2X2 className="h-[21px] w-[21px]" />
                    </Link>
                  </Button>
                </div>
                
                {/* Navigation Buttons Row */}
                <div className="flex gap-2">
                  <Button 
                    variant="default" 
                    size="sm" 
                    asChild 
                    className="h-[42px] px-5 text-lg"
                  >
                    <Link href="/admin">Admin</Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    asChild 
                    className="h-[42px] px-5 text-lg"
                  >
                    <Link href="/admin">Back</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 space-y-8">

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
    </div>
  );
}