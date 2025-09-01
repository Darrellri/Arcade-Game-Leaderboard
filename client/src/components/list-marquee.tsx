import { Game } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Gamepad2, CircleDot, Trophy } from "lucide-react";
import { useState, useEffect } from "react";

// Score overlay entrance animations - Bottom-up slide/bounce effects
const scoreOverlayAnimations = [
  'animate-score-slide-up-bounce',   // Slides up with bounce
  'animate-score-slide-up-wobble',   // Slides up with wobble  
  'animate-score-slide-up-fast',     // Fast slide up
  'animate-score-slide-up-slow',     // Slow slide up
  'animate-score-slide-up-spring',   // Spring-like slide up
  'animate-score-slide-up-elastic',  // Elastic slide up
  'animate-score-slide-up-smooth'    // Smooth slide up
];

// Helper function to format date
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

interface ListMarqueeProps {
  game: Game;
  className?: string;
}

export default function ListMarquee({ game, className }: ListMarqueeProps) {
  const imageUrl = game.imageUrl;
  const [scoreOverlayVisible, setScoreOverlayVisible] = useState(false);
  const [scoreAnimationClass, setScoreAnimationClass] = useState('');
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Trigger score overlay animation when image loads
  const handleImageLoad = () => {
    setIsImageLoaded(true);
    // Random delay before showing score overlay
    const delay = 800 + Math.random() * 1200;
    setTimeout(() => {
      const randomAnimation = scoreOverlayAnimations[Math.floor(Math.random() * scoreOverlayAnimations.length)];
      setScoreAnimationClass(randomAnimation);
      setScoreOverlayVisible(true);
    }, delay);
  };

  // Reset animation when game changes
  useEffect(() => {
    setScoreOverlayVisible(false);
    setIsImageLoaded(false);
    setScoreAnimationClass('');
  }, [game.id]);



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
            onLoad={handleImageLoad}
          />
          
          {/* Score Overlay - Bottom-up entrance animation */}
          {((game.currentHighScore && game.currentHighScore > 0) || (game.topScorerName && game.topScorerName !== 'No scores yet')) && (
            <div className={`absolute bottom-0 left-0 right-0 bg-black/75 backdrop-blur-sm border-t border-primary/20 px-2 sm:px-4 md:px-6 ${scoreOverlayVisible ? scoreAnimationClass : 'translate-y-full opacity-0'}`}
                 style={{ 
                   zIndex: 100, 
                   borderBottomLeftRadius: '8px', 
                   borderBottomRightRadius: '8px',
                   paddingTop: '8px',
                   paddingBottom: '8px'
                 }}>
              <div className="flex items-center justify-between w-full">
                {/* Left side - Champion info with text animation */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <Trophy size={16} className="text-yellow-400 flex-shrink-0 sm:block hidden" />
                  <Trophy size={12} className="text-yellow-400 flex-shrink-0 block sm:hidden" />
                  <div className="text-white">
                    <div className="text-xs sm:text-sm font-bold text-yellow-400 animate-text-float-up">#1</div>
                    <div className="text-sm sm:text-base font-bold animate-text-gentle-bob">{(game.topScorerName && game.topScorerName.length > 8) ? game.topScorerName.substring(0, 8) + '...' : (game.topScorerName || "No Name")}</div>
                  </div>
                </div>
                
                {/* Right side - Score with text animation */}
                <div className="text-right">
                  <div className="text-lg sm:text-xl font-bold text-primary animate-text-pulse-up">
                    {game.currentHighScore ? game.currentHighScore.toLocaleString() : "0"}
                  </div>
                  {game.topScoreDate && (
                    <div className="text-xs text-gray-300 animate-text-gentle-bob">
                      {formatDate(new Date(game.topScoreDate))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
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