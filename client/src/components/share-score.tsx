import React from "react";
import { Facebook, Share2, Twitter, Link as LinkIcon, Mail, Share, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { Game, Score, VenueSettings } from "@shared/schema";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface ShareScoreProps {
  game: Game;
  score?: Score;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const ShareScore = React.forwardRef<HTMLButtonElement, ShareScoreProps>(({ 
  game, 
  score, 
  className,
  variant = "default",
  size = "default"
}, ref) => {
  const [isLoading, setIsLoading] = useState(false);

  // Fetch venue settings for contact info
  const { data: venueSettings } = useQuery<VenueSettings>({
    queryKey: ["/api/admin/settings"],
  });

  // Generate the enhanced message for sharing
  const generateShareMessage = () => {
    const baseUrl = window.location.origin;
    let message = "";
    
    if (score) {
      // Sharing a specific score
      message = `🎮 My Top Score: ${score.score.toLocaleString()} points on ${game.name}!\n\n`;
    } else {
      // Sharing the game's top score
      message = `🏆 Current Top Score on ${game.name}: ${game.currentHighScore?.toLocaleString() || '0'} points by ${game.topScorerName || 'no one yet'}!\n\n`;
    }

    // Add venue information
    message += `🎯 ${venueSettings?.name || 'Winona Axe and Arcade'}\n`;
    
    if (venueSettings?.hours) {
      message += `⏰ Hours: ${venueSettings.hours}\n`;
    }
    
    if (venueSettings?.phone) {
      message += `📞 Phone: ${venueSettings.phone}\n`;
    }
    
    if (venueSettings?.address) {
      message += `📍 ${venueSettings.address}\n`;
    }
    
    message += `\n🌐 Visit us: ${baseUrl}\n`;
    message += `🎲 Game Details: ${baseUrl}/leaderboard/${game.id}`;
    
    return message;
  };

  // Share functions with enhanced content
  const shareToFacebook = () => {
    const message = generateShareMessage();
    const gameUrl = `${window.location.origin}/leaderboard/${game.id}`;
    let url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(gameUrl)}&quote=${encodeURIComponent(message)}`;
    
    // If game has marquee image, add it to the share
    if (game.imageUrl) {
      url += `&picture=${encodeURIComponent(game.imageUrl)}`;
    }
    
    window.open(url, '_blank');
  };

  const shareToTwitter = () => {
    const message = generateShareMessage();
    const gameUrl = `${window.location.origin}/leaderboard/${game.id}`;
    let url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
    
    // Add hashtags for better discoverability
    const hashtags = ['arcade', 'gaming', 'highscore', 'winona'].join(',');
    url += `&hashtags=${hashtags}&url=${encodeURIComponent(gameUrl)}`;
    
    window.open(url, '_blank');
  };
  
  const shareToWhatsApp = () => {
    const message = generateShareMessage();
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };
  
  const shareViaEmail = () => {
    const message = generateShareMessage();
    const url = `mailto:?subject=Arcade High Score&body=${encodeURIComponent(message)}`;
    window.open(url);
  };

  const copyToClipboard = async () => {
    const message = generateShareMessage();
    
    setIsLoading(true);
    try {
      await navigator.clipboard.writeText(message);
      toast({
        title: "Link copied!",
        description: "The link has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className={`${className} font-medium transition-all duration-200`}
          disabled={isLoading}
        >
          <Share2 className="h-4 w-4 mr-2 text-primary" />
          Share Score
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48 p-1 rounded-md shadow-lg">
        <DropdownMenuItem 
          onClick={shareToFacebook} 
          className="flex items-center p-2 cursor-pointer transition-colors hover:bg-secondary rounded-sm"
        >
          <Facebook className="h-4 w-4 mr-2 text-blue-600" />
          <span className="font-medium">Facebook</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={shareToTwitter} 
          className="flex items-center p-2 cursor-pointer transition-colors hover:bg-secondary rounded-sm"
        >
          <Twitter className="h-4 w-4 mr-2 text-sky-500" />
          <span className="font-medium">Twitter</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={shareToWhatsApp} 
          className="flex items-center p-2 cursor-pointer transition-colors hover:bg-secondary rounded-sm"
        >
          <Share className="h-4 w-4 mr-2 text-green-500" />
          <span className="font-medium">WhatsApp</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={shareViaEmail} 
          className="flex items-center p-2 cursor-pointer transition-colors hover:bg-secondary rounded-sm"
        >
          <Mail className="h-4 w-4 mr-2 text-amber-500" />
          <span className="font-medium">Email</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={copyToClipboard} 
          className="flex items-center p-2 cursor-pointer transition-colors hover:bg-secondary rounded-sm"
        >
          <LinkIcon className="h-4 w-4 mr-2 text-primary" />
          <span className="font-medium">Copy Link</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

ShareScore.displayName = "ShareScore";

export default ShareScore;