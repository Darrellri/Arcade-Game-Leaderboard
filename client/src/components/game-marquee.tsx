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
  
  // Using the exact 792x214 aspect ratio (3.7:1) for marquee images
  if (imageUrl) {
    return (
      <div className={cn("w-full aspect-[792/214] relative overflow-hidden rounded-t-lg", className)}>
        <div className="w-full h-full bg-black rounded-t-lg flex items-center justify-center">
          <img 
            src={imageUrl} 
            alt={`${game.name} marquee`}
            className="w-full h-full object-contain transition-all duration-300 hover:opacity-90"
            style={{
              filter: marqueeBlurred ? 'blur(2px)' : 'blur(0px)',
              transition: 'filter 0.3s ease-in-out',
              aspectRatio: '792/214'
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