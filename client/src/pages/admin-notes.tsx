import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { VenueSettings } from "@shared/schema";
import {
  ArrowLeft,
  Gamepad2,
  Settings,
  CircleDot,
  Square,
  List,
} from "lucide-react";

export default function AdminNotes() {
  // Fetch venue settings for header logo
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

  // Function to cycle through color schemes (no mutations needed for this page)
  const cycleColorScheme = () => {
    // This is the documentation page, so no color cycling functionality needed
    // But we keep the function for consistency with the header component
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

      {/* Documentation Content */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-secondary/10 to-primary/5 border-b">
          <CardTitle>
            <div>
              <h2 className="text-2xl font-bold text-primary">System Documentation</h2>
              <p className="text-muted-foreground text-base mt-1">
                Complete platform features and technical specifications
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid gap-8">
            {/* Core Features Section */}
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg p-6 border border-primary/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Gamepad2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-primary">Core Platform Features</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-foreground">Game Management System</h4>
                      <p className="text-sm text-muted-foreground">Add, edit, reorder, and organize arcade/pinball games with drag-and-drop functionality</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-foreground">Score Tracking & Validation</h4>
                      <p className="text-sm text-muted-foreground">Players submit scores with photo evidence for verification and leaderboard updates</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-foreground">QR Code Integration</h4>
                      <p className="text-sm text-muted-foreground">Venue-specific QR codes for quick score submission and game identification</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-foreground">Real-time Leaderboards</h4>
                      <p className="text-sm text-muted-foreground">Dynamic ranking system with automatic high score tracking and champion highlighting</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-foreground">Mobile Responsive Design</h4>
                      <p className="text-sm text-muted-foreground">Optimized interface for smartphones, tablets, and desktop screens</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-foreground">Advanced Display Modes</h4>
                      <p className="text-sm text-muted-foreground">Single, Scroll, and Grid view options with customizable animations and sizing</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Venue Customization Section */}
            <div className="bg-gradient-to-br from-secondary/5 to-primary/5 rounded-lg p-6 border border-secondary/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <Settings className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-xl font-bold text-secondary">Venue Customization</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-secondary mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-foreground">Logo & Branding</h4>
                      <p className="text-sm text-muted-foreground">Static images and animated videos (MP4/WebM) with custom background options</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-secondary mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-foreground">Theme System</h4>
                      <p className="text-sm text-muted-foreground">Multiple color schemes with professional, tint, and vibrant variants</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-secondary mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-foreground">Layout Controls</h4>
                      <p className="text-sm text-muted-foreground">Customizable spacing, typography, and visual styling options</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-secondary mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-foreground">Display Size Options</h4>
                      <p className="text-sm text-muted-foreground">Regular, Large (1.3x), Extra Large (1.5x), and Full Screen sizing for all view modes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Specifications Section */}
            <div className="bg-gradient-to-br from-muted/30 to-secondary/10 rounded-lg p-6 border border-muted/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-muted/20">
                  <CircleDot className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Technical Specifications</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Frontend Stack</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• React 18 with TypeScript</li>
                    <li>• Tailwind CSS + Shadcn/ui</li>
                    <li>• TanStack Query</li>
                    <li>• Wouter routing</li>
                    <li>• Framer Motion animations</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Backend Stack</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Express.js + Node.js</li>
                    <li>• PostgreSQL database</li>
                    <li>• Drizzle ORM</li>
                    <li>• Multer file uploads</li>
                    <li>• Session management</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Deployment</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Replit hosting platform</li>
                    <li>• Vite build optimization</li>
                    <li>• Static asset serving</li>
                    <li>• Environment configuration</li>
                    <li>• Database migrations</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-foreground">Rules & Guidelines</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold mb-3 text-foreground">Marquee Image Specifications</h4>
                  <ul className="space-y-2 text-base">
                    <li className="text-foreground"><strong className="text-primary">Recommended Size:</strong> 792x214px</li>
                    <li className="text-foreground"><strong className="text-primary">Maximum File Size:</strong> 2MB per image</li>
                    <li className="text-foreground"><strong className="text-primary">Supported Formats:</strong> JPG, PNG, WebP</li>
                    <li className="text-foreground"><strong className="text-primary">Display Context:</strong> Grid view cards and game displays</li>
                    <li className="text-foreground"><strong className="text-primary">Responsive Behavior:</strong> Auto-scales for mobile devices</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-3 text-foreground">Overlay Image System</h4>
                  <ul className="space-y-2 text-base">
                    <li className="text-foreground"><strong className="text-primary">Purpose:</strong> Additional branding or promotional overlays</li>
                    <li className="text-foreground"><strong className="text-primary">Layering:</strong> Displays over marquee image with transparency support</li>
                    <li className="text-foreground"><strong className="text-primary">Recommended Size:</strong> Same as marquee (792x214px)</li>
                    <li className="text-foreground"><strong className="text-primary">Transparency:</strong> WEBP or PNG format needed for alpha channels</li>
                    <li className="text-foreground"><strong className="text-primary">Use Cases:</strong> "Coming Soon" badges, special event promotions</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-3 text-foreground">Animation Sequences & Timing</h4>
                  <ul className="space-y-2 text-base">
                    <li className="text-foreground"><strong className="text-primary">Hover Effects:</strong> 300ms smooth transitions on game cards</li>
                    <li className="text-foreground"><strong className="text-primary">Loading States:</strong> Skeleton animations during data fetch</li>
                    <li className="text-foreground"><strong className="text-primary">Score Celebrations:</strong> Particle bursts and floating animations</li>
                    <li className="text-foreground"><strong className="text-primary">Theme Transitions:</strong> Color scheme changes with 200ms easing</li>
                    <li className="text-foreground"><strong className="text-primary">Drag & Drop:</strong> Visual feedback with opacity and transform effects</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-3 text-foreground">Content Guidelines</h4>
                  <ul className="space-y-2 text-base">
                    <li className="text-foreground"><strong className="text-primary">Game Names:</strong> Keep concise, avoid special characters</li>
                    <li className="text-foreground"><strong className="text-primary">Subtitles:</strong> Optional additional game information or taglines</li>
                    <li className="text-foreground"><strong className="text-primary">Score Validation:</strong> Photo evidence required for high score submissions</li>
                    <li className="text-foreground"><strong className="text-primary">Display Order:</strong> Drag-and-drop reordering affects all public views</li>
                    <li className="text-foreground"><strong className="text-primary">Hidden Games:</strong> Not shown in public leaderboards but data preserved</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-3 text-foreground">Display View Modes</h4>
                  <ul className="space-y-2 text-base">
                    <li className="text-foreground"><strong className="text-primary">Single View:</strong> One large game displayed with automatic rotation</li>
                    <li className="text-foreground"><strong className="text-primary">Scroll View:</strong> Infinite vertical scroll with customizable spacing</li>
                    <li className="text-foreground"><strong className="text-primary">Grid View:</strong> Card-based grid layout with configurable columns</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-3 text-foreground">Performance Optimization</h4>
                  <ul className="space-y-2 text-base">
                    <li className="text-foreground"><strong className="text-primary">Image Optimization:</strong> Automatic compression and format conversion</li>
                    <li className="text-foreground"><strong className="text-primary">Lazy Loading:</strong> Optional for scroll view to improve performance</li>
                    <li className="text-foreground"><strong className="text-primary">Animation Control:</strong> Can be disabled per view mode for better performance</li>
                    <li className="text-foreground"><strong className="text-primary">Responsive Design:</strong> Adaptive layouts for different screen sizes</li>
                    <li className="text-foreground"><strong className="text-primary">Caching Strategy:</strong> Efficient data fetching with TanStack Query</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}