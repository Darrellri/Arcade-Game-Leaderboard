import { Game } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Gamepad2, CircleDot } from "lucide-react";

interface ListMarqueeProps {
  game: Game;
  className?: string;
}

export default function ListMarquee({ game, className }: ListMarqueeProps) {
  const imageUrl = game.imageUrl;



  if (imageUrl) {
    return (
      <div className={cn("flex-shrink-0 mr-2 md:mr-4 w-20 xs:w-24 sm:w-32 md:w-80 relative", className)}>
        <div className="relative w-full rounded-lg overflow-hidden shadow-md bg-black aspect-[792/214]">
          <img 
            src={imageUrl} 
            alt={game.name} 
            className="w-full h-full object-contain"
            style={{
              aspectRatio: '792/214',
              maxWidth: '100%',
              height: 'auto'
            }}
          />
          
        </div>
      </div>
    );
  }

  // Fallback for games without images
  return (
    <div className={cn("flex-shrink-0 mr-2 md:mr-4 w-24 sm:w-32 md:w-80", className)}>
      <div className="w-full h-12 sm:h-14 md:h-16 bg-muted rounded-lg flex items-center justify-center">
        {game.type === 'pinball' ? (
          <CircleDot className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
        ) : (
          <Gamepad2 className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
        )}
      </div>
    </div>
  );
}