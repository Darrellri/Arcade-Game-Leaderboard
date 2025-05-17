import { cn } from "@/lib/utils";
import { Game } from "@shared/schema";

interface GameMarqueeProps {
  game: Game;
  className?: string;
}

export default function GameMarquee({ game, className }: GameMarqueeProps) {
  // Use the imageUrl directly from the game object
  const imageUrl = game.imageUrl;
  
  // Using the exact 792x214 aspect ratio (3.7:1) for marquee images
  if (imageUrl) {
    return (
      <div className={cn("w-full aspect-[792/214] relative overflow-hidden rounded-t-lg", className)}>
        <div className="w-full h-full bg-black rounded-t-lg flex items-center justify-center">
          <img 
            src={imageUrl} 
            alt={`${game.name} marquee`}
            className="w-full h-full object-contain transition-all duration-300 hover:opacity-90"
          />
        </div>
      </div>
    );
  }
  
  // For games without a specific image, create a styled text alternative
  return (
    <div 
      className={cn(
        "w-full aspect-[792/214] flex items-center justify-center bg-gradient-to-r from-primary/20 to-primary/40 rounded-t-lg",
        className
      )}
    >
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold tracking-wider text-center px-4 uppercase bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-foreground drop-shadow-lg">
          {game.name}
        </h2>
        {game.subtitle && (
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            {game.subtitle}
          </p>
        )}
      </div>
    </div>
  );
}