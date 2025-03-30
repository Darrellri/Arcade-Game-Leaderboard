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
      <div className={cn("w-full h-[214px] relative overflow-hidden rounded-t-lg", className)}>
        <img 
          src={imageUrl} 
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