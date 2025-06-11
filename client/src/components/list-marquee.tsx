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
  const [overlayOffset, setOverlayOffset] = useState({ x: 0, y: 0 });
  
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

  // Set up 20-second cycle animation system for overlay
  useEffect(() => {
    if (!overlayImageUrl) return;

    let cycleTimer: NodeJS.Timeout;

    const triggerRandomAnimation = () => {
      const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
      setOverlayAnimation(randomAnimation);
      setAnimationKey(prev => prev + 1);
      
      // Blur marquee image when overlay animation starts
      setMarqueeBlurred(true);
      
      // Clear animation and remove blur after 2 seconds
      setTimeout(() => {
        setOverlayAnimation("");
        setMarqueeBlurred(false);
      }, 2000);
    };

    const start20SecondCycle = () => {
      // Choose random time within 20-second window (0-18 seconds to allow for 2-second animation)
      const randomStartTime = Math.random() * 18000;
      
      setTimeout(() => {
        triggerRandomAnimation();
      }, randomStartTime);
      
      // Schedule next 20-second cycle
      cycleTimer = setTimeout(start20SecondCycle, 20000);
    };

    // Start the first cycle
    start20SecondCycle();

    return () => {
      if (cycleTimer) {
        clearTimeout(cycleTimer);
      }
    };
  }, [overlayImageUrl]);

  // Parallax scrolling effect for overlay images
  useEffect(() => {
    if (!overlayImageUrl) return;

    const parallaxTimer = setInterval(() => {
      // Randomly choose to move ahead, lag behind, or snap back
      const motion = Math.random();
      
      if (motion < 0.4) {
        // Move ahead by 1-2 pixels
        setOverlayOffset({ x: Math.random() * 2 + 1, y: Math.random() * 2 + 1 });
      } else if (motion < 0.7) {
        // Lag behind by 2 pixels
        setOverlayOffset({ x: -(Math.random() * 2 + 1), y: -(Math.random() * 2 + 1) });
      } else {
        // Snap back to center
        setOverlayOffset({ x: 0, y: 0 });
      }
    }, 150 + Math.random() * 200); // Random interval between 150-350ms

    return () => clearInterval(parallaxTimer);
  }, [overlayImageUrl]);

  if (imageUrl) {
    return (
      <div className={cn("flex-shrink-0 mr-2 md:mr-4 w-20 xs:w-24 sm:w-32 md:w-40 relative", className)}>
        <div className="relative w-full rounded-lg overflow-hidden shadow-md bg-black aspect-[792/214]">
          <img 
            src={imageUrl} 
            alt={game.name} 
            className="w-full h-full object-contain"
            style={{
              filter: marqueeBlurred ? 'blur(1px)' : 'blur(0px)',
              transition: 'filter 0.3s ease-in-out',
              aspectRatio: '792/214',
              maxWidth: '100%',
              height: 'auto'
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
                  "absolute",
                  overlayAnimation,
                  // Add continuous floating when no animation is active
                  !overlayAnimation && "animate-[overlayFloat_4s_ease-in-out_infinite]"
                )}
                style={{ 
                  filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.5))",
                  zIndex: 10,
                  width: 'auto',
                  height: 'auto',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  transform: `translate(${overlayOffset.x}px, ${overlayOffset.y}px)`,
                  transition: 'transform 0.1s ease-out'
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