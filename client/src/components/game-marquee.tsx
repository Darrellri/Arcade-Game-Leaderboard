import { cn } from "@/lib/utils";
import { Game } from "@shared/schema";

interface GameMarqueeProps {
  game: Game;
  className?: string;
}

// Map of game names to their marquee image URLs
export const MARQUEE_IMAGES: Record<string, string> = {
  "X-Men Pinball": "https://raw.githubusercontent.com/replit-community/arcade-assets/main/marquees/xmen.jpg",
  "Godzilla": "https://raw.githubusercontent.com/replit-community/arcade-assets/main/marquees/godzilla.jpg",
  "Star Wars": "https://raw.githubusercontent.com/replit-community/arcade-assets/main/marquees/starwars.jpg",
  "Asteroids": "https://raw.githubusercontent.com/replit-community/arcade-assets/main/marquees/asteroids.jpg",
  // Fallback images for other games
  "NASCAR": "https://raw.githubusercontent.com/replit-community/arcade-assets/main/marquees/generic-pinball.jpg",
  "The Simpsons": "https://raw.githubusercontent.com/replit-community/arcade-assets/main/marquees/generic-pinball.jpg",
  "Addams Family": "https://raw.githubusercontent.com/replit-community/arcade-assets/main/marquees/generic-pinball.jpg",
  "Mortal Kombat": "https://raw.githubusercontent.com/replit-community/arcade-assets/main/marquees/generic-arcade.jpg",
  "NBA Jam": "https://raw.githubusercontent.com/replit-community/arcade-assets/main/marquees/generic-arcade.jpg",
  "Terminator 2": "https://raw.githubusercontent.com/replit-community/arcade-assets/main/marquees/generic-arcade.jpg",
  "Ms. Pac-Man": "https://raw.githubusercontent.com/replit-community/arcade-assets/main/marquees/generic-arcade.jpg",
};

export default function GameMarquee({ game, className }: GameMarqueeProps) {
  // Check if we have a specific marquee image for this game
  const marqueeUrl = MARQUEE_IMAGES[game.name];
  
  if (marqueeUrl) {
    return (
      <div className={cn("w-full h-[214px] relative overflow-hidden rounded-t-lg", className)}>
        <img 
          src={marqueeUrl} 
          alt={`${game.name} marquee`}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }
  
  // For games without a specific image, create a styled text alternative
  return (
    <div 
      className={cn(
        "w-full h-[214px] flex items-center justify-center bg-gradient-to-r from-primary/20 to-primary/40 rounded-t-lg",
        className
      )}
    >
      <h2 className="text-3xl md:text-4xl font-bold tracking-wider text-center px-4 uppercase bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-foreground">
        {game.name}
      </h2>
    </div>
  );
}