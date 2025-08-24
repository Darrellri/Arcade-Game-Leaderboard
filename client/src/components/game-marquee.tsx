import { cn } from "@/lib/utils";
import { Game } from "@shared/schema";
import { useState, useEffect } from "react";

interface GameMarqueeProps {
  game: Game;
  className?: string;
}

export default function GameMarquee({ game, className }: GameMarqueeProps) {
  const [overlayAnimation, setOverlayAnimation] = useState<string>("");
  const [animationKey, setAnimationKey] = useState(0);
  const [marqueeBlurred, setMarqueeBlurred] = useState(false);
  const [overlayOffset, setOverlayOffset] = useState({ x: 0, y: 0 });
  
  // Use the imageUrl directly from the game object
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
        
        // Clear animation and remove blur after animation completes (2.5 seconds)
        setTimeout(() => {
          setOverlayAnimation("");
          setMarqueeBlurred(false);
        }, 2500);
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
  
  // Using the exact 792x214 aspect ratio (3.7:1) for marquee images with mobile responsiveness
  if (imageUrl) {
    return (
      <div className={cn("w-full max-w-full aspect-[792/214] relative overflow-hidden rounded-t-lg", className)}>
        <div className="w-full h-full bg-black rounded-t-lg flex items-center justify-center">
          <img 
            src={imageUrl} 
            alt={`${game.name} marquee`}
            className="w-full h-full object-contain transition-all duration-300 hover:opacity-90"
            style={{
              filter: marqueeBlurred ? 'blur(2px)' : 'blur(0px)',
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
                  filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.5))",
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