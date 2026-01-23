import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { VenueSettings, Game } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ChevronRight,
  Square,
  List,
  Grid2X2,
} from "lucide-react";

export default function Admin() {
  const { toast } = useToast();

  // Fetch venue settings for header logo
  const { data: venueSettings } = useQuery<VenueSettings>({
    queryKey: ["/api/admin/settings"],
  });

  // Fetch games for stats
  const { data: games } = useQuery<Game[]>({
    queryKey: ["/api/games", { includeHidden: true }],
    queryFn: () => apiRequest("GET", "/api/games?includeHidden=true").then(res => res.json()),
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

  // Mutation for updating settings
  const updateSettingsMutation = useMutation({
    mutationFn: (data: { theme: any }) => 
      apiRequest("PATCH", "/api/admin/settings", data).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
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
    
    updateSettingsMutation.mutate({ theme: nextTheme });
  };

  const adminSections = [
    {
      title: "GAMES MANAGEMENT",
      description: "Add, edit, and organize your arcade games",
      href: "/admin/games",
      color: "bg-blue-50/30 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
      stats: games ? `${games.length} total games` : "Loading...",
    },
    {
      title: "HIGH SCORES",
      description: "Manually enter high scores for games",
      href: "/admin/scores",
      color: "bg-purple-50/30 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
      stats: "Add & manage scores",
    },
    {
      title: "DISPLAY OPTIONS",
      description: "Configure settings for all display modes",
      href: "/admin/display-options",
      color: "bg-green-50/30 dark:bg-green-900/20 border-green-200 dark:border-green-800",
      stats: "5 view modes configurable",
    },
    {
      title: "VENUE SETTINGS",
      description: "Configure your venue's basic information",
      href: "/admin/venue-settings",
      color: "bg-orange-50/30 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
      stats: venueSettings?.name ? `Set up as ${venueSettings.name}` : "Not configured",
    },
    {
      title: "SYSTEM DOCUMENTATION",
      description: "Platform features and technical specifications",
      href: "/admin/notes",
      color: "bg-gray-50/30 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800",
      stats: "Complete feature guide",
    },
  ];

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
          {/* Row 1: Venue Logo */}
          <div className="flex items-center justify-center mb-2">
            {(venueSettings?.animatedLogoUrl || venueSettings?.logoUrl) && (
              <div 
                className={`logo-container overflow-hidden cursor-pointer hover:opacity-80 transition-opacity w-24 h-12 flex items-center justify-center ${
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
          
          {/* Row 2: GAME MASTER Title + Arcade Leaderboard Logo */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="game-master-title text-xl whitespace-nowrap">
              GAME MASTER
            </h1>
            <img 
              src="/arcade-leaderboard-logo.png" 
              alt="Arcade Leaderboard" 
              className="h-6 w-auto object-contain" 
            />
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
                <Link href="/">Back</Link>
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
          
          {/* Center Content Area - GAME MASTER Title + Arcade Logo */}
          <div className="flex-1 min-w-0 flex items-center justify-center gap-4 px-4">
            <h1 className="game-master-title text-4xl lg:text-5xl xl:text-6xl whitespace-nowrap">
              GAME MASTER
            </h1>
            <img 
              src="/arcade-leaderboard-logo.png" 
              alt="Arcade Leaderboard" 
              className="h-16 lg:h-20 xl:h-24 w-auto object-contain" 
            />
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
                    <Link href="/">Back</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 space-y-8">


      {/* Page Title */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold uppercase tracking-wide">ADMIN DASHBOARD</h2>
        <p className="text-muted-foreground">Configure and customize your arcade leaderboard</p>
      </div>

      {/* Management Sections - Centered */}
      <div className="flex justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 max-w-5xl">
          {adminSections.map((section) => (
            <Link 
              key={section.href} 
              href={section.href}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <Card className={`h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer ${section.color}`}>
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center justify-between mb-2">
                    <div 
                      className="text-base font-bold leading-tight tracking-wide"
                      style={{ 
                        color: '#1f2937',
                        fontSize: '1.1rem'
                      }}
                    >
                      {section.title}
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  </div>
                  <CardDescription className="text-sm leading-tight" style={{ fontSize: '0.935rem' }}>
                    {section.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 pb-4 px-4">
                  <Badge variant="secondary" className="text-sm" style={{ fontSize: '0.935rem' }}>
                    {section.stats}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      </div>
    </div>
  );
}