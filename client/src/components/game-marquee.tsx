import { cn } from "@/lib/utils";
import { Game } from "@shared/schema";

interface GameMarqueeProps {
  game: Game;
  className?: string;
}

// Map of game names to their marquee image URLs
export const MARQUEE_IMAGES: Record<string, string> = {
  "X-Men Pinball": "https://drive.google.com/uc?export=view&id=16M3SJLpFQKxO1wEI36V_UMEFFGBqR4Ta",
  "Godzilla": "https://drive.google.com/uc?export=view&id=1H7DFE_zJfRJMHdUMcI_RqVcL1lTEkfT-",
  "Star Wars": "https://drive.google.com/uc?export=view&id=12IwHpaxe9JyHJCQlHu8nj4I91gQQrN0H",
  "NASCAR": "https://drive.google.com/uc?export=view&id=1QMiWx9vNhJbevLo2QxpLXZWndkSixbVk",
  "The Simpsons": "https://drive.google.com/uc?export=view&id=1WbQf8N-OA7I66V5RgxWGTwjgLrXGEDZ3",
  "Addams Family": "https://drive.google.com/uc?export=view&id=1qVt6A1I_iCatgLVEZ6GbfV-wnJffS-0y",
  "Mortal Kombat": "https://drive.google.com/uc?export=view&id=1QvC5zdUcmI_lJppnj-uUAM_G1P9OEj-1",
  "NBA Jam": "https://drive.google.com/uc?export=view&id=1mZUwO0WuRmQpHgzjxEzKwFwUDJcwFqn0",
  "Terminator 2": "https://drive.google.com/uc?export=view&id=1JU_A4nTJNGp9cXbUDdoxnVSNQbLRd5vF",
  "Ms. Pac-Man": "https://drive.google.com/uc?export=view&id=1ZbQ-H8f9vF-S-8CAVXKSIpxMoUwO7RB3",
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