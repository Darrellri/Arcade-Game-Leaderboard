import { Facebook, Share2, Twitter, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { Game, Score } from "@shared/schema";
import { useState } from "react";

interface ShareScoreProps {
  game: Game;
  score?: Score;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export default function ShareScore({ 
  game, 
  score, 
  className,
  variant = "default",
  size = "default"
}: ShareScoreProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Generate the message for sharing
  const generateShareMessage = () => {
    const baseUrl = window.location.origin;
    let message = "";
    
    if (score) {
      // Sharing a specific score
      message = `Check out my score of ${score.score.toLocaleString()} on ${game.name} at Winona Axe and Arcade! ${baseUrl}/leaderboard/${game.id}`;
    } else {
      // Sharing the game's top score
      message = `The top score on ${game.name} at Winona Axe and Arcade is ${game.currentHighScore?.toLocaleString() || '0'} by ${game.topScorerName || 'no one yet'}! Can you beat it? ${baseUrl}/leaderboard/${game.id}`;
    }
    
    return message;
  };

  // Share functions
  const shareToFacebook = () => {
    const message = generateShareMessage();
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const shareToTwitter = () => {
    const message = generateShareMessage();
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
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
          className={className}
          disabled={isLoading}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={shareToFacebook}>
          <Facebook className="h-4 w-4 mr-2" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToTwitter}>
          <Twitter className="h-4 w-4 mr-2" />
          Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyToClipboard}>
          <LinkIcon className="h-4 w-4 mr-2" />
          Copy Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}