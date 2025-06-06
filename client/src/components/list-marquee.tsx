import { useState, useEffect } from "react";
import { Game } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Gamepad2, CircleDot } from "lucide-react";

interface ListMarqueeProps {
  game: Game;
  className?: string;
}

export default function ListMarquee({ game, className }: ListMarqueeProps) {
  const [overlayAnimation, setOverlayAnimation] = useState<string>("");
  const [animationKey, setAnimationKey] = useState(0);
  const [marqueeBlurred, setMarqueeBlurred] = useState(false);
  
  const imageUrl = game.imageUrl;
  const overlayImageUrl = game.overlayImageUrl;

  // Array of faster animations with reduced travel distance (175% faster)
  const animations = [
    "animate-[overlayGrowShrink_0.72s_ease-in-out]",
    "animate-[overlayJello_0.65s_ease-in-out]",
    "animate-[overlaySkewWobble_0.8s_ease-in-out]",
    "animate-[overlayPulseScale_0.55s_ease-in-out]",
    "animate-[overlayElastic_0.91s_ease-out]",
    "animate-[overlayBreath_1.09s_ease-in-out]",
    "animate-[overlaySquish_0.72s_ease-in-out]",
    "animate-[overlayGlow_0.91s_ease-in-out]"
  ];

  // Set up random animation timer for overlay
  useEffect(() => {
    if (!overlayImageUrl) return;

    const triggerRandomAnimation = () => {
      const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
      setOverlayAnimation(randomAnimation);
      setAnimationKey(prev => prev + 1);
      
      // Blur marquee image when overlay animation starts
      setMarqueeBlurred(true);
      
      // Clear animation and remove blur after it completes
      setTimeout(() => {
        setOverlayAnimation("");
        setMarqueeBlurred(false);
      }, 2500);
    };

    // Initial delay before first animation (5-10 seconds)
    const initialDelay = Math.random() * 5000 + 5000;
    const initialTimer = setTimeout(triggerRandomAnimation, initialDelay);

    // Set up recurring timer (20-30 seconds)
    const recurringTimer = setInterval(() => {
      triggerRandomAnimation();
    }, Math.random() * 10000 + 20000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(recurringTimer);
    };
  }, [overlayImageUrl]);

  if (imageUrl) {
    return (
      <div className={cn("flex-shrink-0 mr-2 md:mr-4 w-24 sm:w-32 md:w-40 relative", className)}>
        <div className="relative w-full h-12 sm:h-14 md:h-16 rounded-lg overflow-hidden shadow-md bg-black">
          <img 
            src={imageUrl} 
            alt={game.name} 
            className="w-full h-full object-cover"
            style={{
              filter: marqueeBlurred ? 'blur(1px)' : 'blur(0px)',
              transition: 'filter 0.3s ease-in-out'
            }}
          />
          
          {/* Overlay Image with Random Animations and Floating Effect */}
          {overlayImageUrl && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <img
                key={animationKey}
                src={overlayImageUrl}
                alt={`${game.name} overlay`}
                className={cn(
                  "max-w-full max-h-full object-contain",
                  overlayAnimation,
                  // Add continuous floating when no animation is active
                  !overlayAnimation && "animate-[overlayFloat_4s_ease-in-out_infinite]"
                )}
                style={{ 
                  filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.5))",
                  zIndex: 10
                }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback for games without images
  return (
    <div className={cn("flex-shrink-0 mr-2 md:mr-4 w-24 sm:w-32 md:w-40", className)}>
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