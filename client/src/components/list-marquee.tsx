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

  // Array with the new expand-all-directions animation
  const animations = [
    "animate-expand-all-directions"
  ];

  // Set up 20-second cycle animation system for overlay
  useEffect(() => {
    if (!overlayImageUrl) return;

    let cycleTimer: NodeJS.Timeout;

    const triggerRandomAnimation = () => {
      // Pause for 2 seconds after marquee appears, then start animation
      setTimeout(() => {
        const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
        setOverlayAnimation(randomAnimation);
        setAnimationKey(prev => prev + 1);
        
        // Blur marquee image when overlay animation starts
        setMarqueeBlurred(true);
        
        // Clear animation and remove blur after animation completes (3 seconds)
        setTimeout(() => {
          setOverlayAnimation("");
          setMarqueeBlurred(false);
        }, 3000);
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

  // Subtle overlay movement effect - 2 pixels max, once per 10-second period
  useEffect(() => {
    if (!overlayImageUrl) return;

    const scheduleMovement = () => {
      // Choose random time within 10-second window (0-10 seconds)
      const randomTime = Math.random() * 10000;
      
      setTimeout(() => {
        // Randomly choose direction: vertical or horizontal
        const isVertical = Math.random() < 0.5;
        
        if (isVertical) {
          // Move up or down by 2 pixels
          const direction = Math.random() < 0.5 ? -2 : 2;
          setOverlayOffset({ x: 0, y: direction });
        } else {
          // Move left or right by 2 pixels
          const direction = Math.random() < 0.5 ? -2 : 2;
          setOverlayOffset({ x: direction, y: 0 });
        }
        
        // Return to center after 1 second
        setTimeout(() => {
          setOverlayOffset({ x: 0, y: 0 });
        }, 1000);
        
        // Schedule next movement in 10 seconds
        setTimeout(scheduleMovement, 10000);
      }, randomTime);
    };

    // Start the movement cycle
    scheduleMovement();

    return () => {
      // Cleanup handled by setTimeout chains
    };
  }, [overlayImageUrl]);

  if (imageUrl) {
    return (
      <div className={cn("flex-shrink-0 mr-2 md:mr-4 w-20 xs:w-24 sm:w-32 md:w-80 relative", className)}>
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