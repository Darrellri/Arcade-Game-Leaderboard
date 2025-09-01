import { useQuery } from "@tanstack/react-query";
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
import { apiRequest } from "@/lib/queryClient";
import {
  ArrowLeft,
  Gamepad2,
  Palette,
  Settings,
  Building2,
  FileText,
  ChevronRight,
  Users,
  BarChart3,
  Eye,
} from "lucide-react";

export default function Admin() {
  // Fetch venue settings for header logo
  const { data: venueSettings } = useQuery<VenueSettings>({
    queryKey: ["/api/admin/settings"],
  });

  // Fetch games for stats
  const { data: games } = useQuery<Game[]>({
    queryKey: ["/api/games", { includeHidden: true }],
    queryFn: () => apiRequest("GET", "/api/games?includeHidden=true").then(res => res.json()),
  });

  const adminSections = [
    {
      title: "Games Management",
      description: "Add, edit, and organize your arcade games",
      icon: Gamepad2,
      href: "/admin/games",
      color: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
      iconColor: "text-blue-600 dark:text-blue-400",
      stats: games ? `${games.length} total games` : "Loading...",
    },
    {
      title: "Color Schemes",
      description: "Transform your arcade's visual identity",
      icon: Palette,
      href: "/admin/color-schemes",
      color: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
      iconColor: "text-purple-600 dark:text-purple-400",
      stats: venueSettings?.themePresets ? `${venueSettings.themePresets.length} themes available` : "Loading...",
    },
    {
      title: "Display View Options",
      description: "Configure settings for all display modes",
      icon: Settings,
      href: "/admin/display-options",
      color: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
      iconColor: "text-green-600 dark:text-green-400",
      stats: "5 view modes configurable",
    },
    {
      title: "Venue Settings",
      description: "Configure your venue's basic information",
      icon: Building2,
      href: "/admin/venue-settings",
      color: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
      iconColor: "text-orange-600 dark:text-orange-400",
      stats: venueSettings?.name ? `Set up as ${venueSettings.name}` : "Not configured",
    },
    {
      title: "System Documentation",
      description: "Platform features and technical specifications",
      icon: FileText,
      href: "/admin/notes",
      color: "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800",
      iconColor: "text-gray-600 dark:text-gray-400",
      stats: "Complete feature guide",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
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
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your arcade leaderboard system</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Gamepad2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{games ? games.length : '—'}</div>
                <div className="text-sm text-muted-foreground">Total Games</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Eye className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{games ? games.filter(g => !g.hidden).length : '—'}</div>
                <div className="text-sm text-muted-foreground">Visible Games</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Palette className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{venueSettings?.themePresets?.length || '—'}</div>
                <div className="text-sm text-muted-foreground">Color Themes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className={`h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer ${section.color}`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg bg-white/50 dark:bg-black/20`}>
                    <section.icon className={`h-6 w-6 ${section.iconColor}`} />
                  </div>
                  <ChevronRight className={`h-5 w-5 ${section.iconColor}`} />
                </div>
                <CardTitle className="text-lg">{section.title}</CardTitle>
                <CardDescription className="text-sm">
                  {section.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Badge variant="secondary" className="text-xs">
                  {section.stats}
                </Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Current Active Theme Preview */}
      {venueSettings?.theme && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Current Theme</CardTitle>
            <CardDescription>Currently active color scheme for your venue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded border shadow-sm"
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
                  <div className="capitalize">{venueSettings.theme.appearance}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Radius:</span>
                  <div>{venueSettings.theme.radius}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/games">
              <Button variant="outline" className="w-full justify-start">
                <Gamepad2 className="h-4 w-4 mr-2" />
                Add New Game
              </Button>
            </Link>
            <Link href="/admin/color-schemes">
              <Button variant="outline" className="w-full justify-start">
                <Palette className="h-4 w-4 mr-2" />
                Change Theme
              </Button>
            </Link>
            <Link href="/admin/venue-settings">
              <Button variant="outline" className="w-full justify-start">
                <Building2 className="h-4 w-4 mr-2" />
                Update Venue Info
              </Button>
            </Link>
            <Link href="/admin/display-options">
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Configure Views
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}