import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Game, VenueSettings } from "@shared/schema";
import { Button } from "@/components/ui/button";
import GameCard from "@/components/game-card";
import ShareScore from "@/components/share-score";
import { Skeleton } from "@/components/ui/skeleton";
import { Gamepad2, Grid2X2, List, CircleDot, Trophy, GripVertical, MonitorSpeaker, Play, Square } from "lucide-react";
import ListMarquee from "@/components/list-marquee";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { formatDate, formatTime } from "@/lib/formatters";
import { useTheme } from "@/contexts/ThemeContext";
import GameMarquee from "@/components/game-marquee";
import { TrophyIcon } from "@/components/trophy-icon";

// Animation classes for dynamic effects
const animationClasses = [
  // Fade animations
  'animate-fade-in-up', 'animate-fade-in-down', 'animate-fade-in-left', 'animate-fade-in-right',
  // Slide animations
  'animate-slide-in-up', 'animate-slide-in-down', 'animate-slide-in-left', 'animate-slide-in-right',
  // Zoom animations
  'animate-zoom-in', 'animate-zoom-out', 'animate-zoom-in-up', 'animate-zoom-out-down',
  // Bounce animations
  'animate-bounce-in', 'animate-bounce-in-up', 'animate-bounce-in-down', 'animate-bounce-in-left', 'animate-bounce-in-right',
  // Rotation animations
  'animate-rotate-in', 'animate-rotate-in-up-left', 'animate-rotate-in-up-right', 'animate-rotate-in-down-left', 'animate-rotate-in-down-right',
  // Elastic animations
  'animate-elastic-in', 'animate-elastic-in-up', 'animate-elastic-in-down', 'animate-elastic-in-left', 'animate-elastic-in-right',
  // Fun animations
  'animate-jello', 'animate-wobble', 'animate-swing', 'animate-rubberBand', 'animate-tada',
  // Dramatic animations
  'animate-flip-in-x', 'animate-flip-in-y', 'animate-light-speed-in', 'animate-roll-in', 'animate-hinge'
];

// Dynamic overlay animation functions based on game ID for consistency
function getOverlayAnimation(gameId: number): string {
  // Layer animations that grow 20% then bounce back
  const overlayAnimations = [
    'animate-pulse-grow', 'animate-bounce-grow', 'animate-elastic-grow', 'animate-zoom-grow'
  ];
  return overlayAnimations[gameId % overlayAnimations.length];
}

function getOverlaySpeed(gameId: number): string {
  const speeds = ['300', '500', '700', '1000', '1200'];
  return speeds[gameId % speeds.length];
}

function getOverlayDelay(gameId: number): number {
  const delays = [0, 100, 200, 300, 500];
  return delays[gameId % delays.length];
}

// Score overlay animation functions - random selection each time
function getRandomScoreAnimation(): string {
  const scoreAnimations = [
    'animate-slide-in-up', 'animate-slide-in-left', 'animate-slide-in-right', 'animate-flip-in-up'
  ];
  return scoreAnimations[Math.floor(Math.random() * scoreAnimations.length)];
}

// Get random animation class
function getRandomAnimation() {
  return animationClasses[Math.floor(Math.random() * animationClasses.length)];
}

// Get exit animation for a given entrance animation
function getExitAnimation(entranceAnimation: string): string {
  const exitMap: { [key: string]: string } = {
    'animate-slide-in-left': 'animate-slide-out-right',
    'animate-slide-in-right': 'animate-slide-out-left',
    'animate-slide-in-up': 'animate-slide-out-down',
    'animate-slide-in-down': 'animate-slide-out-up',
    'animate-bounce-in': 'animate-bounce-out',
    'animate-zoom-in': 'animate-zoom-out',
    'animate-fade-in': 'animate-fade-out',
    'animate-rotate-in': 'animate-rotate-out',
    'animate-flip-in-x': 'animate-flip-out-x',
    'animate-flip-in-y': 'animate-flip-out-y',
    'animate-light-speed-in': 'animate-light-speed-out',
    'animate-roll-in': 'animate-roll-out',
    'animate-back-in-up': 'animate-back-out-up',
    'animate-back-in-down': 'animate-back-out-down',
    'animate-back-in-left': 'animate-back-out-left',
    'animate-back-in-right': 'animate-back-out-right',
    'animate-fly-in-from-left': 'animate-fly-out-left',
    'animate-fly-in-from-right': 'animate-fly-out-right',
    'animate-fly-in-from-top': 'animate-fly-out-top',
    'animate-fly-in-from-bottom': 'animate-fly-out-bottom',
    'animate-swoop-in-left': 'animate-swoop-out-left',
    'animate-swoop-in-right': 'animate-swoop-out-right',
    'animate-spiral-in': 'animate-spiral-out',
    'animate-explode-in': 'animate-explode-out',
    'animate-rocket-in': 'animate-rocket-out',
    'animate-meteor-in': 'animate-meteor-out'
  };
  
  return exitMap[entranceAnimation] || 'animate-fade-out';
}

// Scroll-specific marquee component - no individual animations, just static display
function ScrollMarquee({ game, className = "", scrollPosition, gameIndex, gameSpacing, gameHeight }: { 
  game: Game; 
  className?: string;
  scrollPosition?: number;
  gameIndex?: number;
  gameSpacing?: number;
  gameHeight?: number;
}) {
  const imageUrl = game.imageUrl;
  const [topOverlayVisible, setTopOverlayVisible] = useState(false);
  const [fadeOpacity, setFadeOpacity] = useState(0);

  // Calculate if this marquee is centered on screen for layer animation trigger
  useEffect(() => {
    if (scrollPosition !== undefined && gameIndex !== undefined && gameSpacing !== undefined && gameHeight !== undefined) {
      const screenHeight = window.innerHeight;
      const screenCenter = screenHeight / 2;
      
      // Calculate this game's position on screen
      const gameTopPosition = (gameIndex * (gameHeight + gameSpacing)) - scrollPosition;
      const gameBottomPosition = gameTopPosition + gameHeight;
      const gameCenterPosition = gameTopPosition + (gameHeight / 2);
      
      // Calculate visibility and opacity for fade effect
      const visibilityBuffer = 100; // Start fading in/out 100px before/after screen edges
      const topEdge = -visibilityBuffer;
      const bottomEdge = screenHeight + visibilityBuffer;
      
      // Fade calculation
      let opacity = 0;
      if (gameTopPosition > bottomEdge || gameBottomPosition < topEdge) {
        opacity = 0; // Completely off screen
      } else if (gameTopPosition >= topEdge && gameBottomPosition <= bottomEdge) {
        opacity = 1; // Completely on screen
      } else {
        // Partially on screen - calculate fade
        const fadeDistance = visibilityBuffer;
        if (gameTopPosition < topEdge) {
          // Fading in from top
          opacity = Math.max(0, Math.min(1, (gameBottomPosition - topEdge) / fadeDistance));
        } else if (gameBottomPosition > bottomEdge) {
          // Fading out to bottom
          opacity = Math.max(0, Math.min(1, (bottomEdge - gameTopPosition) / fadeDistance));
        }
      }
      
      setFadeOpacity(opacity);
      
      // Check if game center is near screen center for layer animation
      const centerThreshold = 50; // Pixels from center to trigger animation
      const isNearCenter = Math.abs(gameCenterPosition - screenCenter) < centerThreshold;
      
      // Only show overlay when near center and has overlay image
      if (isNearCenter && game.overlayImageUrl && !topOverlayVisible) {
        setTopOverlayVisible(true);
        // Hide overlay after animation duration
        setTimeout(() => {
          setTopOverlayVisible(false);
        }, 1500);
      }
    }
  }, [scrollPosition, gameIndex, gameSpacing, gameHeight, game.overlayImageUrl, topOverlayVisible]);

  return (
    <div className={`w-full max-w-[1188px] aspect-[1188/321] relative overflow-hidden transition-opacity duration-500 ${className}`} 
         style={{ 
           borderRadius: '15px',
           opacity: fadeOpacity
         }}>
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={`${game.name} marquee`}
          className="w-full h-full object-contain bg-black transition-opacity duration-500"
          style={{
            borderRadius: '15px',
            maxWidth: '100%',
            height: 'auto'
          }}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/40 flex items-center justify-center transition-opacity duration-500"
             style={{ borderRadius: '15px' }}>
          <div className="text-center px-4">
            <h2 className="text-lg sm:text-2xl md:text-3xl font-bold tracking-wider text-center uppercase bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-foreground drop-shadow-lg">
              {game.name}
            </h2>
            {game.subtitle && (
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-2">
                {game.subtitle}
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Top Overlay for Scroll View - Uses layer image with dynamic animation effects */}
      {topOverlayVisible && game.overlayImageUrl && (
        <div className={`absolute inset-0 ${getOverlayAnimation(game.id)} transition-all duration-${getOverlaySpeed(game.id)}`}
             style={{ 
               zIndex: 110, 
               borderRadius: '15px',
               animationDelay: `${getOverlayDelay(game.id)}ms`,
               animationFillMode: 'both'
             }}>
          <img 
            src={game.overlayImageUrl} 
            alt={`${game.name} overlay`}
            className="w-full h-full object-contain"
            style={{
              borderRadius: '15px',
              maxWidth: '100%',
              height: 'auto'
            }}
          />
        </div>
      )}
      
      {/* Horizontal Score Overlay - Random animation with darker transparency */}
      {((game.currentHighScore && game.currentHighScore > 0) || game.topScorerName) && (
        <div className={`absolute bottom-0 left-0 right-0 bg-black/75 backdrop-blur-sm border-t border-primary/20 px-6 py-4 ${getRandomScoreAnimation()}`} 
             style={{ 
               zIndex: 100, 
               borderBottomLeftRadius: '15px', 
               borderBottomRightRadius: '15px', 
               animationDelay: '0.5s', 
               animationFillMode: 'both',
               animationDuration: '0.8s'
             }}>
          <div className="flex items-center justify-between w-full">
            {/* Left side - Champion info */}
            <div className="flex items-center gap-4">
              <TrophyIcon size={62} className="text-yellow-400 flex-shrink-0 md:block sm:hidden" />
              <TrophyIcon size={46} className="text-yellow-400 flex-shrink-0 hidden sm:block md:hidden" />
              <TrophyIcon size={31} className="text-yellow-400 flex-shrink-0 block sm:hidden" />
              <div className="text-white">
                <div className="text-2xl md:text-xl sm:text-lg font-bold text-yellow-400">#1 CHAMPION</div>
                <div className="text-4xl md:text-3xl sm:text-2xl font-bold">{game.topScorerName || "No Name"}</div>
              </div>
            </div>
            
            {/* Center - Game name */}
            <div className="text-center flex-1 px-4">
              <div className="text-3xl md:text-2xl sm:text-xl font-bold text-primary uppercase tracking-wide">
                {game.name}
              </div>
              {game.subtitle && (
                <div className="text-lg md:text-base sm:text-sm text-gray-300 mt-1">
                  {game.subtitle}
                </div>
              )}
            </div>
            
            {/* Right side - Score and date */}
            <div className="text-right">
              <div className="text-5xl md:text-4xl sm:text-3xl font-bold text-primary">
                {game.currentHighScore ? game.currentHighScore.toLocaleString() : "0"}
              </div>
              {game.topScoreDate && (
                <div className="text-lg md:text-base sm:text-sm text-gray-300 mt-1">
                  {formatDate(new Date(game.topScoreDate))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Full-size marquee component for new views with 15px radius - MARQUEE ONLY
function FullSizeMarquee({ game, className = "", animationKey = 0, delay = 1000, overlayDelay, exitDelay = 6000 }: { 
  game: Game; 
  className?: string; 
  animationKey?: number;
  delay?: number;
  overlayDelay?: number;
  exitDelay?: number;
}) {
  const imageUrl = game.imageUrl;
  const [currentAnimation, setCurrentAnimation] = useState('');
  const [scoreAnimation, setScoreAnimation] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [scoreOverlayVisible, setScoreOverlayVisible] = useState(false);
  const [topOverlayVisible, setTopOverlayVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [exitAnimation, setExitAnimation] = useState('');
  const [scoreAnimationClass, setScoreAnimationClass] = useState('');

  // Set random animations when component mounts or animationKey changes
  useEffect(() => {
    const entranceAnim = getRandomAnimation();
    const randomScoreAnim = getRandomScoreAnimation();
    setCurrentAnimation(entranceAnim);
    setExitAnimation(getExitAnimation(entranceAnim));
    setScoreAnimation(randomScoreAnim);
    setScoreAnimationClass(randomScoreAnim);
    setImageLoaded(false);
    setIsVisible(false);
    setScoreOverlayVisible(false);
    setTopOverlayVisible(false);
    setIsExiting(false);

    // Start main animation immediately when component mounts
    const mainTimer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    // Show top overlay after marquee animation completes (0.8s animation + 0.2s buffer)
    const topOverlayTimer = setTimeout(() => {
      setTopOverlayVisible(true);
      // Hide top overlay after 1 second
      setTimeout(() => {
        setTopOverlayVisible(false);
      }, 1000);
    }, delay + 1000);

    // Start exit animation before the component cycles
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, delay + exitDelay);

    return () => {
      clearTimeout(mainTimer);
      clearTimeout(topOverlayTimer);
      clearTimeout(exitTimer);
    };
  }, [animationKey, delay, exitDelay]);

  // Handle image load event to trigger score overlay
  const handleImageLoad = () => {
    setImageLoaded(true);
    // Start score overlay animation after image loads with random delay
    const scoreDelay = overlayDelay || (800 + Math.random() * 1200); // 0.8-2.0 seconds after image loads
    setTimeout(() => {
      setScoreOverlayVisible(true);
    }, scoreDelay);
  };

  if (imageUrl) {
    const animationClass = isExiting ? exitAnimation : (isVisible ? currentAnimation : 'opacity-0');
    
    return (
      <div className={`w-full max-w-[1188px] aspect-[1188/321] relative overflow-hidden ${className} ${animationClass}`} 
           style={{ borderRadius: '15px', animationDuration: '0.8s' }}>
        <div className="w-full h-full bg-black flex items-center justify-center" 
             style={{ borderRadius: '15px' }}>
          <img 
            src={imageUrl} 
            alt={`${game.name} marquee`}
            className="w-full h-full object-contain"
            style={{
              borderRadius: '15px',
              maxWidth: '100%',
              height: 'auto'
            }}
            onLoad={handleImageLoad}
          />
          
          {/* Top Overlay - Appears after marquee animation stops using layer image with dynamic effects */}
          {topOverlayVisible && game.overlayImageUrl && (
            <div className={`absolute inset-0 ${getOverlayAnimation(game.id)} transition-all duration-${getOverlaySpeed(game.id)}`}
                 style={{ 
                   zIndex: 110, 
                   borderRadius: '15px',
                   animationDelay: `${getOverlayDelay(game.id)}ms`,
                   animationFillMode: 'both'
                 }}>
              <img 
                src={game.overlayImageUrl} 
                alt={`${game.name} overlay`}
                className="w-full h-full object-contain"
                style={{
                  borderRadius: '15px',
                  maxWidth: '100%',
                  height: 'auto'
                }}
              />
            </div>
          )}
          
          {/* Horizontal Score Overlay - Random animation with darker transparency */}
          {((game.currentHighScore && game.currentHighScore > 0) || game.topScorerName) && (
            <div className={`absolute bottom-0 left-0 right-0 bg-black/75 backdrop-blur-sm border-t border-primary/20 px-6 py-4 ${scoreOverlayVisible && !isExiting ? `${scoreAnimationClass} opacity-100` : 'opacity-0'}`} 
                 style={{ 
                   zIndex: 100, 
                   borderBottomLeftRadius: '15px', 
                   borderBottomRightRadius: '15px',
                   animationDuration: '0.8s',
                   animationFillMode: 'both'
                 }}>
              <div className="flex items-center justify-between w-full">
                {/* Left side - Champion info */}
                <div className="flex items-center gap-4">
                  <TrophyIcon size={62} className="text-yellow-400 flex-shrink-0 md:block sm:hidden" />
                  <TrophyIcon size={46} className="text-yellow-400 flex-shrink-0 hidden sm:block md:hidden" />
                  <TrophyIcon size={31} className="text-yellow-400 flex-shrink-0 block sm:hidden" />
                  <div className="text-white">
                    <div className="text-2xl md:text-xl sm:text-lg font-bold text-yellow-400">#1 CHAMPION</div>
                    <div className="text-4xl md:text-3xl sm:text-2xl font-bold">{game.topScorerName || "No Name"}</div>
                  </div>
                </div>
                
                {/* Center - Game name */}
                <div className="text-center flex-1 px-4">
                  <div className="text-3xl md:text-2xl sm:text-xl font-bold text-primary uppercase tracking-wide">
                    {game.name}
                  </div>
                  {game.subtitle && (
                    <div className="text-lg md:text-base sm:text-sm text-gray-300 mt-1">
                      {game.subtitle}
                    </div>
                  )}
                </div>
                
                {/* Right side - Score and date */}
                <div className="text-right">
                  <div className="text-5xl md:text-4xl sm:text-3xl font-bold text-primary">
                    {game.currentHighScore ? game.currentHighScore.toLocaleString() : "0"}
                  </div>
                  {game.topScoreDate && (
                    <div className="text-lg md:text-base sm:text-sm text-gray-300 mt-1">
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

  return (
    <div className={`w-full max-w-[1188px] aspect-[1188/321] flex items-center justify-center bg-gradient-to-r from-primary/20 to-primary/40 ${className}`}
         style={{ borderRadius: '15px' }}>
      <div className="text-center px-4">
        <h2 className="text-lg sm:text-2xl md:text-3xl font-bold tracking-wider text-center uppercase bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-foreground drop-shadow-lg">
          {game.name}
        </h2>
        {game.subtitle && (
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-2">
            {game.subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// Score overlay slide-up animations with random variations
const scoreOverlayAnimations = [
  'slideUpBounce',      // Slides up with bounce
  'slideUpWobble',      // Slides up with wobble
  'slideUpFast',        // Fast slide up
  'slideUpSlow',        // Slow slide up
  'slideUpSpring',      // Spring-like slide up
  'slideUpElastic',     // Elastic slide up
  'slideUpSmooth'       // Smooth slide up
];

type ViewMode = "dual" | "single" | "scroll" | "grid" | "list";

// Grid View Component - Traditional grid layout
function GridView({ games, animationsEnabled, hideHeader }: { 
  games: Game[]; 
  animationsEnabled: boolean; 
  hideHeader: boolean;
}) {
  return (
    <div className="container mx-auto px-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}

// List View Component - Traditional vertical list with drag and drop
function ListView({ games, animationsEnabled, hideHeader }: { 
  games: Game[]; 
  animationsEnabled: boolean; 
  hideHeader: boolean;
}) {
  return (
    <div className="container mx-auto px-4 space-y-4">
      <div className="space-y-3">
        {games.map((game) => (
          <SortableGameListItem key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}

// Marquee Animation Effects Library - No vertical rotations, horizontal movements and creative effects
const animationEffects = [
  // Basic slide effects
  'slideInLeft', 'slideInRight', 'slideInUp', 'slideInDown',
  // Fade effects
  'fadeIn', 'fadeInLeft', 'fadeInRight', 'fadeInUp', 'fadeInDown',
  // Zoom effects (horizontal preferred)
  'zoomIn', 'zoomInLeft', 'zoomInRight', 'zoomInUp', 'zoomInDown',
  // Bounce effects
  'bounceIn', 'bounceInUp', 'bounceInDown', 'bounceInLeft', 'bounceInRight',
  // Back effects
  'backInUp', 'backInDown', 'backInLeft', 'backInRight',
  // Light speed effects (horizontal only)
  'lightSpeedInLeft', 'lightSpeedInRight',
  // Wobble and shake effects (no rotation)
  'wobble', 'shake', 'swing', 'jello', 'pulse',
  // Attention effects
  'heartBeat', 'flash', 'rubberBand', 'tada', 'jackInTheBox',
  // Roll effects (horizontal only)
  'rollIn',
  
  // NEW: 5 Clever Animation Effects
  'slideInBounce',    // Slides in with a bounce at the end
  'zoomInPulse',      // Zooms in with a pulsing effect
  'swipeInLeft',      // Fast swipe from left with ease-out
  'popInScale',       // Pops in with scaling effect
  'glideInSmooth',    // Smooth gliding entrance
  
  // Dramatic off-screen flying entries (horizontal only)
  'flyInFromLeft', 'flyInFromRight',
  
  // Swooping dramatic entries (horizontal only)
  'swoopInLeft', 'swoopInRight',
  
  // Fun and playful effects
  'pulse', 'shake', 'swing', 'wobble', 'jello',
  
  // Attention-grabbing effects
  'heartBeat', 'flash', 'rubberBand', 'tada', 'jackInTheBox',
  
  // Rolling and speed effects
  'rollIn', 'rollOut', 'lightSpeedInLeft', 'lightSpeedInRight', 'hinge',
  
  // Additional directional effects
  'slideOutLeft', 'slideOutRight', 'slideOutUp', 'slideOutDown', 'rotateOut',
  'flipOutX', 'flipOutY', 'bounceOut', 'zoomInLeft', 'zoomInRight',
  'zoomInUp', 'zoomInDown', 'zoomOutLeft', 'zoomOutRight', 'zoomOutUp',
  'zoomOutDown', 'fadeInLeft', 'fadeInRight', 'fadeInUp', 'fadeInDown',
  'fadeOutLeft', 'fadeOutRight', 'fadeOutUp', 'fadeOutDown'
];

// Pairs of complementary animations for dual view staggered timing (no vertical rotations)
const dualViewAnimationPairs = [
  ['flyInFromLeft', 'flyInFromRight'],
  ['swoopInLeft', 'swoopInRight'],
  ['slideInLeft', 'slideInRight'],
  ['bounceInLeft', 'bounceInRight'],
  ['backInLeft', 'backInRight'],
  ['lightSpeedInLeft', 'lightSpeedInRight'],
  ['slideInUp', 'slideInDown'],
  ['bounceInUp', 'bounceInDown'],
  ['backInUp', 'backInDown'],
  ['fadeInLeft', 'fadeInRight'],
  ['zoomInLeft', 'zoomInRight'],
  ['slideInBounce', 'popInScale'],
  ['swipeInLeft', 'glideInSmooth'],
  ['zoomInPulse', 'slideInBounce']
];

// Dual View Component - Shows 2 games side by side with staggered dramatic animations
function DualView({ games, animationsEnabled, hideHeader }: { 
  games: Game[]; 
  animationsEnabled: boolean; 
  hideHeader: boolean; 
}) {
  const [currentPair, setCurrentPair] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);

  const gamePairs = [];
  for (let i = 0; i < games.length; i += 2) {
    gamePairs.push(games.slice(i, i + 2));
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPair((prev) => (prev + 1) % gamePairs.length);
      setAnimationKey(prev => prev + 1); // Trigger new random animations
    }, 8000);

    return () => clearInterval(timer);
  }, [gamePairs.length]);

  const currentGames = gamePairs[currentPair] || [];

  return (
    <div className="flex justify-center items-center min-h-[70vh] px-4">
      <div className="flex flex-col items-center gap-5 w-full max-w-[1200px]"> {/* 20px gap between images */}
        {currentGames.map((game, index) => (
          <div key={`${game.id}-${currentPair}-${animationKey}`} className="w-full flex justify-center">
            <FullSizeMarquee 
              game={game} 
              animationKey={animationKey + index}
              delay={index === 0 ? 1000 : 2000} // First game after 1s, second after 2s
              className={`w-full ${animationsEnabled ? '' : 'animation-none'}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Single View Component - Shows 1 large game centered with dramatic animations
function SingleView({ games, animationsEnabled, hideHeader }: { 
  games: Game[]; 
  animationsEnabled: boolean; 
  hideHeader: boolean; 
}) {
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);
  const { data: venueSettings } = useQuery<VenueSettings>({
    queryKey: ["/api/admin/settings"],
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentGameIndex((prev) => (prev + 1) % games.length);
      setAnimationKey(prev => prev + 1); // Trigger new random animations
    }, 6000);

    return () => clearInterval(timer);
  }, [games.length]);

  const currentGame = games[currentGameIndex];
  
  // Determine size based on venue settings
  const getSizeMultiplier = () => {
    switch (venueSettings?.singleViewSize) {
      case 'normal': return 1;
      case 'large': return 1.3; // 30% larger (default)
      case 'xl': return 1.5; // 50% larger  
      default: return 1.3; // Default to 30% larger
    }
  };
  
  const sizeMultiplier = getSizeMultiplier();
  const baseWidth = 1200;
  const maxWidth = `${Math.round(baseWidth * sizeMultiplier)}px`;

  if (!currentGame) return null;

  return (
    <div className="flex justify-center items-center min-h-[70vh] w-full px-4">
      <div 
        key={`${currentGame.id}-${currentGameIndex}-${animationKey}`} 
        className="w-full flex justify-center"
        style={{ maxWidth }}
      >
        <FullSizeMarquee 
          game={currentGame} 
          animationKey={animationKey}
          delay={1000} // Single view starts after 1 second
          className={`w-full ${animationsEnabled ? '' : 'animation-none'}`}
        />
      </div>
    </div>
  );
}

// Scroll View Component - Shows all games vertically with infinite scroll (no individual animations)
function ScrollView({ games, animationsEnabled, hideHeader }: { 
  games: Game[]; 
  animationsEnabled: boolean; 
  hideHeader: boolean; 
}) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [visibleGames, setVisibleGames] = useState<Game[]>([]);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [scrollSpeed, setScrollSpeed] = useState(1); // 1 = normal, 0.5 = slow, 2 = fast
  const [isInitialized, setIsInitialized] = useState(false);
  const gameSpacing = 50; // Much closer together - reduced from 200 to 50
  const gameHeight = 321; // Height of each marquee

  // Create infinite loop of games and initialize centered position
  useEffect(() => {
    if (games.length > 0) {
      const extendedGames = [...games, ...games, ...games]; // Triple the array for seamless loop
      setVisibleGames(extendedGames);
      
      // Calculate center position for first game
      const screenHeight = window.innerHeight;
      const centerPosition = (screenHeight / 2) - (gameHeight / 2) - 300; // 300 is the padding offset
      setScrollPosition(-centerPosition);
      
      // Start fade-in animation after a brief delay
      setTimeout(() => {
        setIsInitialized(true);
      }, 100);
    }
  }, [games, gameHeight]);

  // Auto-scroll effect with configurable direction and speed - starts after initialization
  useEffect(() => {
    if (!isInitialized) return;
    
    const scrollTimer = setInterval(() => {
      setScrollPosition(prev => {
        const baseSpeed = 1.2;
        const adjustedSpeed = baseSpeed * scrollSpeed;
        const movement = scrollDirection === 'up' ? adjustedSpeed : -adjustedSpeed;
        const newPosition = prev + movement;
        const resetPoint = games.length * (gameSpacing + gameHeight); // Game height + spacing
        
        if (scrollDirection === 'up') {
          return newPosition >= resetPoint ? 0 : newPosition;
        } else {
          return newPosition <= -resetPoint ? 0 : newPosition;
        }
      });
    }, 40); // Smooth scrolling

    return () => clearInterval(scrollTimer);
  }, [games.length, gameSpacing, scrollDirection, scrollSpeed, isInitialized, gameHeight]);

  return (
    <div className="relative overflow-hidden h-screen px-4 bg-background">
      {/* Scroll Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-background/90 backdrop-blur-sm border rounded-lg p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          Direction:
          <Button
            variant={scrollDirection === 'up' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setScrollDirection('up')}
            className="h-7 px-2"
          >
            ↑ Up
          </Button>
          <Button
            variant={scrollDirection === 'down' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setScrollDirection('down')}
            className="h-7 px-2"
          >
            ↓ Down
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          Speed:
          <Button
            variant={scrollSpeed === 0.5 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setScrollSpeed(0.5)}
            className="h-7 px-2"
          >
            Slow
          </Button>
          <Button
            variant={scrollSpeed === 1 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setScrollSpeed(1)}
            className="h-7 px-2"
          >
            Normal
          </Button>
          <Button
            variant={scrollSpeed === 2 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setScrollSpeed(2)}
            className="h-7 px-2"
          >
            Fast
          </Button>
        </div>
      </div>


      
      {visibleGames.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-muted-foreground">Loading games...</h3>
          </div>
        </div>
      ) : (
        <div 
          className={`space-y-4 w-full max-w-[1200px] mx-auto transition-opacity duration-1000 ${isInitialized ? 'opacity-100' : 'opacity-0'}`}
          style={{ 
            transform: `translateY(-${scrollPosition}px)`,
            paddingTop: `300px` // Start 300 pixels higher
          }}
        >
          {visibleGames.map((game, index) => (
            <div 
              key={`${game.id}-${index}`}
              className="flex justify-center w-full"
              style={{ 
                marginBottom: `${gameSpacing}px`
              }}
            >
              <ScrollMarquee 
                game={game} 
                className="w-full"
                scrollPosition={scrollPosition}
                gameIndex={index}
                gameSpacing={gameSpacing}
                gameHeight={gameHeight}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Sortable list item component for drag-and-drop
function SortableGameListItem({ game }: { game: Game }) {
  const { venueSettings } = useTheme();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: game.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="w-full">
      <Link href={`/leaderboard/${game.id}`} className="block w-full">
        <div className="flex items-center px-4 md:px-6 py-4 md:py-5 section-background rounded-2xl hover:bg-primary/15 transition-all duration-300 w-full group cursor-pointer">
          
          {/* Drag handle - only visible in admin mode */}
          <div 
            {...attributes}
            {...listeners}
            className="flex items-center mr-3 cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 transition-opacity"
            onClick={(e) => e.preventDefault()}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Left side - Game marquee image with overlay support */}
          <ListMarquee game={game} />

          {/* Game info - Hidden on mobile, shown on larger screens */}
          <div className="hidden sm:flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {game.type === 'pinball' ? (
                <CircleDot className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
              ) : (
                <Gamepad2 className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
              )}
              <div className="font-medium text-sm md:text-lg text-foreground group-hover:text-primary transition-colors duration-200 uppercase tracking-wide truncate">
                {game.name}
              </div>
            </div>
            {game.subtitle && (
              <div className={`text-xs md:text-sm tracking-wide truncate mt-1 ${
                venueSettings?.gameSubtitleWhite === 'true' 
                  ? 'text-white' 
                  : 'text-primary'
              } ${
                venueSettings?.gameSubtitleBold === 'true' 
                  ? 'font-bold' 
                  : ''
              } ${
                venueSettings?.gameSubtitleItalic === 'true' 
                  ? 'italic' 
                  : ''
              }`}>
                {game.subtitle}
              </div>
            )}
          </div>

          {/* Mobile game title - Only shown on mobile */}
          <div className="sm:hidden flex flex-col min-w-0 flex-1 mr-2">
            <div className="flex items-center gap-2">
              {game.type === 'pinball' ? (
                <CircleDot className="h-3 w-3 text-primary flex-shrink-0" />
              ) : (
                <Gamepad2 className="h-3 w-3 text-primary flex-shrink-0" />
              )}
              <div className="font-medium text-xs text-foreground group-hover:text-primary transition-colors duration-200 uppercase tracking-wide truncate">
                {game.name}
              </div>
            </div>
          </div>

          {/* Center - Champion info */}
          <div className="flex flex-col items-center text-center min-w-0 flex-1 px-1 sm:px-2">
            <div className="font-bold text-sm sm:text-lg md:text-xl text-foreground truncate">
              {game.topScorerName || 'No Champion'}
            </div>
            {game.topScoreDate && (
              <div className="text-xs text-muted-foreground">
                {formatDate(new Date(game.topScoreDate))} {formatTime(new Date(game.topScoreDate))}
              </div>
            )}
          </div>

          {/* Right side - Score */}
          <div className="flex flex-col items-end text-right flex-shrink-0">
            <div className="flex items-center gap-2">
              {(game.currentHighScore ?? 0) > 0 && (
                <img 
                  src="/badge.png" 
                  alt="Champion Badge" 
                  className="w-5 h-5 object-contain" 
                />
              )}
              <div className="font-bold text-sm sm:text-lg md:text-xl text-primary">
                {(game.currentHighScore ?? 0) > 0 
                  ? (game.currentHighScore ?? 0).toLocaleString()
                  : "000,000"
                }
              </div>
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider hidden sm:block">
              HIGH SCORE
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [hideHeader, setHideHeader] = useState(false);
  const [showLogoOverlay, setShowLogoOverlay] = useState(false);
  const [localGames, setLocalGames] = useState<Game[]>([]);

  const { data: games, isLoading: gamesLoading } = useQuery<Game[]>({
    queryKey: ["/api/games", { includeHidden: false }],
    queryFn: () => apiRequest("GET", "/api/games?includeHidden=false").then(res => res.json()),
  });
  
  const { data: venueSettings, isLoading: settingsLoading } = useQuery<VenueSettings>({
    queryKey: ["/api/admin/settings"],
  });

  // Set local games when data loads
  useEffect(() => {
    if (games) {
      setLocalGames(games);
    }
  }, [games]);

  // Timed UI transition - fade out nav elements and fade in logo after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLogoOverlay(true);
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, []);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Mutation to update game order
  const updateGameOrder = useMutation({
    mutationFn: async (gameOrders: { id: number; displayOrder: number }[]) => {
      const res = await apiRequest("PATCH", "/api/games/reorder", { gameOrders });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
    },
  });

  // Handle drag end
  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active.id !== over.id) {
      setLocalGames((games) => {
        const oldIndex = games.findIndex((game) => game.id === active.id);
        const newIndex = games.findIndex((game) => game.id === over.id);
        
        const newGames = arrayMove(games, oldIndex, newIndex);
        
        // Update display order for all games
        const gameOrders = newGames.map((game, index) => ({
          id: game.id,
          displayOrder: index,
        }));
        
        updateGameOrder.mutate(gameOrders);
        
        return newGames;
      });
    }
  }

  // Update venue settings mutation
  const updateSettings = useMutation({
    mutationFn: async (data: Partial<VenueSettings>) => {
      const res = await apiRequest("PATCH", "/api/admin/settings", data);
      return res.json() as Promise<VenueSettings>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
  });

  // Function to cycle through color schemes
  const cycleColorScheme = () => {
    if (!venueSettings?.themePresets) return;
    
    const currentTheme = venueSettings.theme;
    const presets = venueSettings.themePresets;
    
    // Find current theme index
    const currentIndex = presets.findIndex(preset => preset.primary === currentTheme.primary);
    
    // Get next theme (cycle back to 0 if at end)
    const nextIndex = (currentIndex + 1) % presets.length;
    const nextTheme = presets[nextIndex];
    
    // Update the theme
    updateSettings.mutate({
      theme: nextTheme
    });
  };

  const isLoading = gamesLoading || settingsLoading;

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[300px]" />
        ))}
      </div>
    );
  }

  // Process games data to determine the top scores
  const processedGames = games?.map(game => {
    // Game already contains the information we need
    return {
      ...game,
      topScore: game.currentHighScore || 0,
      topScorerName: game.topScorerName || 'No scores yet',
      topScoreDate: game.topScoreDate
    };
  }) || [];


  return (
    <div 
      className="space-y-6"
      style={{
        '--titlebox-spacing': `${parseInt(venueSettings?.titleboxSpacing || "20")}px`
      } as React.CSSProperties}
    >
      {/* Header with venue name and view mode controls */}
      <div className="themed-header px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg mb-2 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {(venueSettings?.animatedLogoUrl || venueSettings?.logoUrl) && (
            <div 
              className={`logo-container flex-shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity w-24 h-12 sm:w-48 sm:h-24 ${
                venueSettings.hideLogoBorderShadow === 'true' 
                  ? '' 
                  : 'rounded-md shadow-md border border-primary/20'
              }`}
              style={{ 
                backgroundColor: 
                  venueSettings.logoBackgroundColor === 'white' ? '#ffffff' :
                  venueSettings.logoBackgroundColor === 'black' ? '#000000' :
                  venueSettings.logoBackgroundColor === 'theme' ? 'hsl(var(--primary))' :
                  'transparent'
              }}
              onClick={cycleColorScheme}
              title="Click to cycle through color schemes"
            >
              {venueSettings.animatedLogoUrl ? (
                <video 
                  src={venueSettings.animatedLogoUrl} 
                  autoPlay 
                  loop 
                  muted
                  className="w-full h-full object-contain transparent-video" 
                />
              ) : (
                <img 
                  src={venueSettings.logoUrl} 
                  alt={venueSettings.name} 
                  className="w-full h-full object-contain p-2" 
                />
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-3xl font-black tracking-tight text-foreground uppercase text-outline leading-tight lg:px-5" style={{ letterSpacing: '1px' }}>
              {venueSettings?.leaderboardName || "THE LEADERBOARD"}
            </h1>
            <h2 
              className={`text-sm sm:text-lg md:text-2xl tracking-tight leading-tight lg:px-5 ${
                venueSettings?.subtitleBold === "true" ? "font-bold" : "font-normal"
              } ${
                venueSettings?.subtitleAllCaps === "true" ? "uppercase" : ""
              }`}
              style={{ 
                letterSpacing: '2px',
                color: venueSettings?.subtitleWhite === "true" 
                  ? "white" 
                  : (() => {
                      // For lighter color schemes, use primary color (same as game titles)
                      const isLightScheme = venueSettings?.theme?.appearance === "light" || 
                        (venueSettings?.theme?.variant === "tint" && venueSettings?.theme?.appearance !== "dark") ||
                        (venueSettings?.theme?.primary && parseInt(venueSettings.theme.primary.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)?.[3] || "0") > 60);
                      
                      if (isLightScheme) {
                        // Use the same color as game titles (primary color)
                        return venueSettings?.theme?.primary || "hsl(280, 100%, 50%)";
                      } else {
                        // For darker schemes, use the lighter version as before
                        return venueSettings?.theme?.primary
                          ? `hsl(${venueSettings.theme.primary.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)?.[1] || 280}, ${venueSettings.theme.primary.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)?.[2] || 100}%, ${Math.min(100, parseInt(venueSettings.theme.primary.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)?.[3] || "50") + 25)}%)`
                          : "hsl(280, 100%, 75%)";
                      }
                    })()
              }}
            >
              {venueSettings?.name || "Arcade"}
            </h2>
          </div>
        </div>
        <div className="flex flex-col gap-2 self-start sm:self-center mt-2 sm:mt-0 relative">
          {/* Navigation Elements with Timed Fade */}
          <div 
            className={`flex flex-col gap-2 transition-opacity duration-1000 ${
              showLogoOverlay ? 'opacity-20' : 'opacity-100'
            }`}
          >
            {/* View Mode Buttons Row */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant={viewMode === "single" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("single")}
                className="shadow-sm hover:shadow-md transition-all duration-200 h-8 w-8 sm:h-10 sm:w-10"
                title="Single View - One large game centered"
              >
                <Square className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant={viewMode === "dual" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("dual")}
                className="shadow-sm hover:shadow-md transition-all duration-200 h-8 w-8 sm:h-10 sm:w-10"
                title="Dual View - Two games side by side"
              >
                <MonitorSpeaker className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant={viewMode === "scroll" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("scroll")}
                className="shadow-sm hover:shadow-md transition-all duration-200 h-8 w-8 sm:h-10 sm:w-10"
                title="Scroll View - Infinite vertical scroll"
              >
                <List className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
                className="shadow-sm hover:shadow-md transition-all duration-200 h-8 w-8 sm:h-10 sm:w-10"
                title="List View - Games in a vertical list"
              >
                <CircleDot className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className="shadow-sm hover:shadow-md transition-all duration-200 h-8 w-8 sm:h-10 sm:w-10"
                title="Grid View - Games in a grid layout"
              >
                <Grid2X2 className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
            
            {/* Navigation Buttons Row */}
            <div className="flex gap-1 sm:gap-2">
              <Button variant="outline" size="sm" asChild className="h-7 px-2 text-xs sm:h-8 sm:px-3 sm:text-sm">
                <Link href="/">Home</Link>
              </Button>

              <Button variant="outline" size="sm" asChild className="h-7 px-2 text-xs sm:h-8 sm:px-3 sm:text-sm">
                <Link href="/admin">Admin</Link>
              </Button>
            </div>
          </div>

          {/* Centered Arcade Leaderboard Logo Overlay */}
          <div 
            className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-1000 ${
              showLogoOverlay ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img 
              src="/arcade-leaderboard-logo.png" 
              alt="Arcade Leaderboard" 
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain" 
            />
          </div>
        </div>
      </div>
      
      {!hideHeader && (
        <div className="mb-6">
          {/* Header content is rendered above */}
        </div>
      )}

      {viewMode === "dual" ? (
        <DualView 
          games={processedGames || []} 
          animationsEnabled={animationsEnabled} 
          hideHeader={hideHeader}
        />
      ) : viewMode === "single" ? (
        <SingleView 
          games={processedGames || []} 
          animationsEnabled={animationsEnabled} 
          hideHeader={hideHeader}
        />
      ) : viewMode === "scroll" ? (
        <ScrollView 
          games={processedGames || []} 
          animationsEnabled={animationsEnabled} 
          hideHeader={hideHeader}
        />
      ) : viewMode === "grid" ? (
        <GridView 
          games={processedGames || []} 
          animationsEnabled={animationsEnabled} 
          hideHeader={hideHeader}
        />
      ) : (
        <ListView 
          games={processedGames || []} 
          animationsEnabled={animationsEnabled} 
          hideHeader={hideHeader}
        />
      )}

      {/* Thin Footer Bar */}
      <div className="mt-12 py-6 border-t border-border/20 bg-card/30">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-3">
          <img 
            src="/arcade-leaderboard-logo.png" 
            alt="Arcade Leaderboard" 
            className="h-12 w-auto mx-auto"
          />
          <p className="text-sm text-primary">
            {venueSettings?.name || "Winona Axe and Arcade"} • High Score Tracking
          </p>
        </div>
      </div>
    </div>
  );
}