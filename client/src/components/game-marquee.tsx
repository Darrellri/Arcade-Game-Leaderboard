import { cn } from "@/lib/utils";
import { Game } from "@shared/schema";

interface GameMarqueeProps {
  game: Game;
  className?: string;
}

export default function GameMarquee({ game, className }: GameMarqueeProps) {
  // Use the imageUrl directly from the game object
  const imageUrl = game.imageUrl;
  
  if (imageUrl) {
    return (
      <div className={cn("w-full h-[220px] relative overflow-hidden rounded-t-lg", className)}>
        <div className="w-full h-full bg-black rounded-t-lg flex items-center justify-center">
          <img 
            src={imageUrl} 
            alt={`${game.name} marquee`}
            className="w-full h-full object-cover transition-all duration-300 hover:opacity-90"
          />
        </div>
      </div>
    );
  }
  
  // For games without a specific image, create a styled text alternative
  return (
    <div 
      className={cn(
        "w-full h-[220px] flex items-center justify-center bg-gradient-to-r from-primary/20 to-primary/40 rounded-t-lg",
        className
      )}
    >
      <h2 className="text-2xl md:text-3xl font-bold tracking-wider text-center px-4 uppercase bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-foreground drop-shadow-lg">
        {game.name}
      </h2>
    </div>
  );
}