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
} from "lucide-react";

export default function AdminNotes() {
  // Fetch venue settings for header logo
  const { data: venueSettings, isLoading: settingsLoading } = useQuery<VenueSettings>({
    queryKey: ["/api/admin/settings"],
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
            <h1 className="text-3xl font-bold">System Documentation</h1>
            <p className="text-muted-foreground">Complete platform features and technical specifications</p>
          </div>
        </div>
      </div>

      {/* Documentation Content */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-secondary/10 to-primary/5 border-b">
          <CardTitle className="flex items-center gap-4">
            {(venueSettings?.logoUrl || venueSettings?.animatedLogoUrl) && (
              <div className="w-[150px] h-auto">
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
  );
}