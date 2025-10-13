import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Game, VenueSettings } from "@shared/schema";
import { Button } from "@/components/ui/button";
import GameCard from "@/components/game-card";
import ShareScore from "@/components/share-score";
import { Skeleton } from "@/components/ui/skeleton";
import { Gamepad2, Grid2X2, List, CircleDot, Trophy, GripVertical, MonitorSpeaker, Play, Square } from "lucide-react";
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




// Get random animation class - entrance animations with stop effects
function getRandomAnimation() {
  const animations = [
    'animate-slide-in-left-wobble',
    'animate-slide-in-right-bounce',
    'animate-fly-in-left-skew',
    'animate-fly-in-right-wobble',
    'animate-slide-in-top-bounce',
    'animate-slide-in-bottom-skew'
  ];
  return animations[Math.floor(Math.random() * animations.length)];
}

// Get exit animation for a given entrance animation
function getExitAnimation(entranceAnimation: string): string {
  const exitMap: { [key: string]: string } = {
    'animate-slide-in-left-wobble': 'animate-slide-out-right-wobble',
    'animate-slide-in-right-bounce': 'animate-slide-out-left-bounce',
    'animate-fly-in-left-skew': 'animate-fly-out-right-skew',
    'animate-fly-in-right-wobble': 'animate-fly-out-left-wobble',
    'animate-slide-in-top-bounce': 'animate-slide-out-top-bounce',
    'animate-slide-in-bottom-skew': 'animate-slide-out-bottom-skew'
  };
  
  return exitMap[entranceAnimation] || 'opacity-0';
}

// Get opposite entrance animation for champion window
function getOppositeEntranceAnimation(marqueeAnimation: string): string {
  const oppositeMap: { [key: string]: string } = {
    'animate-slide-in-left-wobble': 'animate-slide-in-right-wobble',
    'animate-slide-in-right-bounce': 'animate-slide-in-left-bounce',
    'animate-fly-in-left-skew': 'animate-fly-in-right-skew',
    'animate-fly-in-right-wobble': 'animate-fly-in-left-wobble',
    'animate-slide-in-top-bounce': 'animate-slide-in-bottom-bounce',
    'animate-slide-in-bottom-skew': 'animate-slide-in-top-skew'
  };
  
  return oppositeMap[marqueeAnimation] || 'animate-slide-in-bottom-bounce';
}

// Get opposite exit animation for champion window
function getOppositeExitAnimation(marqueeAnimation: string): string {
  const oppositeEntranceAnimation = getOppositeEntranceAnimation(marqueeAnimation);
  return getExitAnimation(oppositeEntranceAnimation);
}

// Scroll-specific marquee component - no individual animations, just static display
function ScrollMarquee({ game, className = "", scrollPosition, gameIndex, gameSpacing, gameHeight, isAutoScrolling = true }: { 
  game: Game; 
  className?: string;
  scrollPosition?: number;
  gameIndex?: number;
  gameSpacing?: number;
  gameHeight?: number;
  isAutoScrolling?: boolean;
}) {
  const imageUrl = game.imageUrl;
  const [topOverlayVisible, setTopOverlayVisible] = useState(false);
  const [fadeOpacity, setFadeOpacity] = useState(0);
  const [animationCount, setAnimationCount] = useState(0);
  const [wasInCenter, setWasInCenter] = useState(false);
  const [scoreOverlayVisible, setScoreOverlayVisible] = useState(false);
  const [scoreAnimationClass, setScoreAnimationClass] = useState('');

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
      
      // Trigger animation only once per pass through center
      if (isNearCenter && game.overlayImageUrl && !wasInCenter && !topOverlayVisible) {
        setWasInCenter(true);
        setTopOverlayVisible(true);
        setAnimationCount(prev => prev + 1);
        
        // Hide overlay after animation duration
        setTimeout(() => {
          setTopOverlayVisible(false);
        }, 1500);
      } else if (!isNearCenter && wasInCenter) {
        // Reset when game moves away from center, allowing it to trigger again next time
        setWasInCenter(false);
      }
    }
  }, [scrollPosition, gameIndex, gameSpacing, gameHeight, game.overlayImageUrl, topOverlayVisible, wasInCenter]);

  // Trigger score overlay animation when not auto-scrolling and game is visible
  useEffect(() => {
    if (!isAutoScrolling && fadeOpacity > 0.8) {
      // Random delay before showing score overlay
      const delay = 1000 + Math.random() * 1500;
      const timer = setTimeout(() => {
        const randomAnimation = scoreOverlayAnimations[Math.floor(Math.random() * scoreOverlayAnimations.length)];
        setScoreAnimationClass(randomAnimation);
        setScoreOverlayVisible(true);
      }, delay);
      
      return () => clearTimeout(timer);
    } else {
      // Hide score overlay when auto-scrolling or not visible
      setScoreOverlayVisible(false);
    }
  }, [isAutoScrolling, fadeOpacity]);

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
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground mt-2">
                {game.subtitle}
              </p>
            )}
          </div>
        </div>
      )}
      
      
      {/* Horizontal Score Overlay - Hidden during auto-scroll, animated entrance when shown */}
      {!isAutoScrolling && ((game.currentHighScore && game.currentHighScore > 0) || (game.topScorerName && game.topScorerName !== 'No scores yet')) && (
        <div className={`absolute bottom-0 left-0 right-0 bg-black/75 backdrop-blur-sm border-t border-primary/20 px-6 ${scoreOverlayVisible ? scoreAnimationClass : 'translate-y-full opacity-0'}`}
             style={{ 
               zIndex: 100, 
               borderBottomLeftRadius: '15px', 
               borderBottomRightRadius: '15px',
               paddingTop: '30px',
               paddingBottom: '30px'
             }}>
          <div className="flex items-center justify-between w-full">
            {/* Left side - Champion info with text animation */}
            <div className="flex items-center gap-4">
              <TrophyIcon size={40} className="text-yellow-400 flex-shrink-0 sm:hidden" />
              <TrophyIcon size={50} className="text-yellow-400 flex-shrink-0 hidden sm:block md:hidden" />
              <TrophyIcon size={62} className="text-yellow-400 flex-shrink-0 hidden md:block" />
              <div className="text-white">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-400 animate-text-float-up">#1 CHAMPION</div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold animate-text-gentle-bob">{game.topScorerName || "No Name"}</div>
              </div>
            </div>
            
            {/* Center - Game name with text animation */}
            <div className="text-center flex-1 px-4">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary uppercase tracking-wide animate-text-pulse-up">
                {game.name}
              </div>
              {game.subtitle && (
                <div className="text-sm sm:text-base md:text-lg text-gray-300 mt-1 animate-text-float-up">
                  {game.subtitle}
                </div>
              )}
            </div>
            
            {/* Right side - Score and date with text animation */}
            <div className="text-right">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary animate-text-pulse-up">
                {game.currentHighScore ? game.currentHighScore.toLocaleString() : "0"}
              </div>
              {game.topScoreDate && (
                <div className="text-sm sm:text-base md:text-lg text-gray-300 mt-1 animate-text-gentle-bob">
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
function FullSizeMarquee({ game, className = "", animationKey = 0, delay = 1000, overlayDelay, exitDelay = 6000, onImageLoad, onAnimationSet }: { 
  game: Game; 
  className?: string; 
  animationKey?: number;
  delay?: number;
  overlayDelay?: number;
  exitDelay?: number;
  onImageLoad?: () => void;
  onAnimationSet?: (animation: string) => void;
}) {
  const imageUrl = game.imageUrl;
  const [currentAnimation, setCurrentAnimation] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [topOverlayVisible, setTopOverlayVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [exitAnimation, setExitAnimation] = useState('');

  // Set random animations when component mounts or animationKey changes
  useEffect(() => {
    const entranceAnim = getRandomAnimation();
    const exitAnim = getExitAnimation(entranceAnim);
    
    setCurrentAnimation(entranceAnim);
    setExitAnimation(exitAnim);
    
    // Notify parent component of the current animation
    if (onAnimationSet) {
      onAnimationSet(entranceAnim);
    }
    setImageLoaded(false);
    setIsVisible(false);
    setTopOverlayVisible(false);
    setIsExiting(false);

    // Start main animation immediately when component mounts
    const mainTimer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    // Show top overlay after marquee animation completes (animation duration + buffer)
    const topOverlayTimer = setTimeout(() => {
      setTopOverlayVisible(true);
      // Hide top overlay after 1 second
      setTimeout(() => {
        setTopOverlayVisible(false);
      }, 1000);
    }, delay + 1400); // Wait for entrance animation to complete (1.4s max)

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

  // Handle image load event
  const handleImageLoad = () => {
    setImageLoaded(true);
    if (onImageLoad) {
      onImageLoad();
    }
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
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-[1188px] aspect-[1188/321] flex items-center justify-center bg-gradient-to-r from-primary/20 to-primary/40 ${className}`}
         style={{ borderRadius: '15px' }}>
      <div className="text-center px-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-wider text-center uppercase bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-foreground drop-shadow-lg">
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

// Text animation classes for subtle vertical movement
const textAnimations = [
  'animate-text-float-up',
  'animate-text-gentle-bob', 
  'animate-text-pulse-up'
];

type ViewMode = "single" | "scroll" | "grid";

// Grid View Component - Scrollable grid layout
function GridView({ games, animationsEnabled, hideHeader }: { 
  games: Game[]; 
  animationsEnabled: boolean; 
  hideHeader: boolean;
}) {
  const [scrollPositionY, setScrollPositionY] = useState(0);
  const [visibleGames, setVisibleGames] = useState<Game[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { data: venueSettings } = useQuery<VenueSettings>({
    queryKey: ["/api/admin/settings"],
  });
  
  const scrollDirection = venueSettings?.gridViewScrollDirection || 'up';
  const scrollSpeed = venueSettings?.gridViewSpeed || 75;
  const gridColumns = venueSettings?.gridViewColumns || 3;
  const cardSpacing = venueSettings?.gridViewSpacing || 25;
  const stickyHeader = venueSettings?.gridViewStickyHeader !== false;
  
  const cardHeight = 350; // Approximate height of each card
  
  // Create extended games array for infinite scroll
  useEffect(() => {
    if (games.length > 0) {
      const extendedGames = [...games, ...games, ...games]; // Triple for seamless loop
      setVisibleGames(extendedGames);
      
      // Initialize at center position
      const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
      const centerPosition = (screenHeight / 2) - (cardHeight / 2);
      setScrollPositionY(-centerPosition);
      
      setTimeout(() => {
        setIsInitialized(true);
      }, 100);
    }
  }, [games, cardHeight, cardSpacing, gridColumns]);
  
  // Auto-scroll effect
  useEffect(() => {
    if (!isInitialized) return;
    
    const scrollTimer = setInterval(() => {
      setScrollPositionY(prev => {
        const baseSpeed = scrollSpeed / 1000; // Convert ms to pixels per frame
        const direction = scrollDirection === 'up' ? 1 : scrollDirection === 'down' ? -1 : Math.sin(Date.now() / 5000) > 0 ? 1 : -1;
        const newPosition = prev + (baseSpeed * direction);
        
        const resetPoint = games.length * (cardHeight + cardSpacing) / gridColumns;
        
        if (direction > 0) {
          return newPosition >= resetPoint ? 0 : newPosition;
        } else {
          return newPosition <= -resetPoint ? 0 : newPosition;
        }
      });
    }, 16); // ~60fps
    
    return () => clearInterval(scrollTimer);
  }, [games.length, cardHeight, cardSpacing, scrollDirection, scrollSpeed, isInitialized, gridColumns]);
  
  const getGridColumns = () => {
    switch (gridColumns) {
      case 2: return 'grid-cols-2';
      case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      case 5: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5';
      default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  };
  
  return (
    <div className="relative overflow-hidden h-screen px-4 bg-background">
      {/* Sticky Header */}
      {stickyHeader && !hideHeader && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-sm border-b border-border/50 px-4 py-3">
          <div className="container mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center">
              {venueSettings?.leaderboardName || 'Leaderboard'}
            </h2>
          </div>
        </div>
      )}
      
      <div 
        className={`container mx-auto transition-opacity duration-1000 ${isInitialized ? 'opacity-100' : 'opacity-0'}`}
        style={{ 
          transform: `translateY(-${scrollPositionY}px)`,
          paddingTop: stickyHeader && !hideHeader ? '120px' : '100px'
        }}
      >
        <div 
          className={`grid ${getGridColumns()} gap-6`}
          style={{ gap: `${cardSpacing}px` }}
        >
          {visibleGames.map((game, index) => (
            <GameCard key={`${game.id}-${index}`} game={game} />
          ))}
        </div>
      </div>
    </div>
  );
}




// Letter animation options for random selection
const letterAnimations = [
  'animate-letter-slide-in-left',
  'animate-letter-slide-in-right', 
  'animate-letter-slide-in-up',
  'animate-letter-slide-in-down',
  'animate-letter-bounce-in',
  'animate-letter-zoom-in',
  'animate-letter-rotate-in',
  'animate-letter-flip-in',
  'animate-letter-pop-in',
  'animate-letter-glow-in'
];

// Function to randomly select animations for each text section
const getRandomTextAnimations = () => {
  const shuffled = [...letterAnimations].sort(() => Math.random() - 0.5);
  return {
    champion: shuffled[0],
    name: shuffled[1],
    game: shuffled[2],
    score: shuffled[3],
    subtitle: shuffled[4],
    date: shuffled[5]
  };
};

// Component to render text with letter-by-letter animations
const AnimatedText = ({ text, animationClass, baseDelay = 0 }: { 
  text: string; 
  animationClass: string; 
  baseDelay?: number; 
}) => {
  return (
    <>
      {text.split('').map((char, index) => (
        <span
          key={index}
          className={animationClass}
          style={{
            animationDelay: `${baseDelay + (index * 0.05)}s`,
            opacity: 0,
            animationFillMode: 'both',
            display: 'inline-block',
            // Preserve spaces
            ...(char === ' ' ? { width: '0.3em' } : {})
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </>
  );
};

// Single View Component - Shows 1 large game centered with dramatic animations
function SingleView({ games, animationsEnabled, hideHeader }: { 
  games: Game[]; 
  animationsEnabled: boolean; 
  hideHeader: boolean; 
}) {
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);
  const [showChampionWindow, setShowChampionWindow] = useState(false);
  const [textAnimations, setTextAnimations] = useState(getRandomTextAnimations());
  const [championGame, setChampionGame] = useState<Game | null>(null);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [currentMarqueeAnimation, setCurrentMarqueeAnimation] = useState('');
  const [championEntering, setChampionEntering] = useState(false);
  const [championExiting, setChampionExiting] = useState(false);
  const { data: venueSettings } = useQuery<VenueSettings>({
    queryKey: ["/api/admin/settings"],
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentGameIndex((prev) => (prev + 1) % games.length);
      setAnimationKey(prev => prev + 1); // Trigger new random animations
      setShowChampionWindow(false); // Hide champion window during transition
      setTextAnimations(getRandomTextAnimations()); // Generate new random animations for each text area
    }, 8000);

    return () => clearInterval(timer);
  }, [games.length]);

  // Reset background loaded state when game changes
  useEffect(() => {
    setBackgroundLoaded(false);
    setShowChampionWindow(false); // Reset on game change
    
    // Start champion exit animation 0.8 seconds before next game transition
    const exitTimer = setTimeout(() => {
      setChampionExiting(true);
    }, 7200); // Start exit animation 0.8 seconds before transition
    
    // Hide champion window after exit animation completes
    const hideTimer = setTimeout(() => {
      setShowChampionWindow(false);
      setChampionExiting(false);
    }, 7500); // Hide 0.5 seconds before 8 second cycle ends

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(hideTimer);
    };
  }, [currentGameIndex, animationKey, games]);

  // Show champion window after background loads + 1 second delay
  useEffect(() => {
    if (!backgroundLoaded) return;
    
    // Show champion window 0.5 seconds after background loads with entrance animation
    const championTimer = setTimeout(() => {
      const currentGame = games[currentGameIndex];
      setChampionGame(currentGame); // Store the game data for champion window
      setChampionEntering(true);
      setShowChampionWindow(true);
      // Stop entrance animation after it completes
      setTimeout(() => {
        setChampionEntering(false);
      }, 800); // Animation duration
    }, 500); // 0.5 seconds total

    return () => {
      clearTimeout(championTimer);
    };
  }, [backgroundLoaded, currentGameIndex, games]);

  const currentGame = games[currentGameIndex];
  
  // Determine size based on venue settings
  const isFullSize = venueSettings?.singleViewSize === 'full';
  
  const getSizeMultiplier = () => {
    switch (venueSettings?.singleViewSize) {
      case 'normal': return 1;
      case 'large': return 1.3; // 30% larger (default)
      case 'extra-large': return 1.5; // 50% larger  
      default: return 1.3; // Default to 30% larger
    }
  };
  
  const sizeMultiplier = getSizeMultiplier();
  const baseWidth = 1200;
  const maxWidth = isFullSize ? undefined : `${Math.round(baseWidth * sizeMultiplier)}px`;


  if (!currentGame) return null;

  return (
    <div className="flex flex-col items-center w-full px-4">
      <div 
        key={`${currentGame.id}-${currentGameIndex}-${animationKey}`} 
        className={`w-full flex justify-center ${isFullSize ? 'mx-[50px] lg:mx-[150px]' : ''}`}
        style={!isFullSize ? { maxWidth } : undefined}
      >
        <FullSizeMarquee 
          game={currentGame} 
          animationKey={animationKey}
          delay={1000} // Single view starts after 1 second
          className={`w-full ${animationsEnabled ? '' : 'animation-none'}`}
          onImageLoad={() => setBackgroundLoaded(true)}
          onAnimationSet={(animation) => setCurrentMarqueeAnimation(animation)}
        />
      </div>
      
      {/* Champion Information Window - Below marquee with same aspect ratio as marquee */}
      {championGame && ((championGame.currentHighScore && championGame.currentHighScore > 0) || (championGame.topScorerName && championGame.topScorerName !== 'No scores yet')) && (
        <div 
          className={`w-full flex justify-center mt-5 ${isFullSize ? 'mx-[50px] lg:mx-[150px]' : ''} ${
            championEntering ? getOppositeEntranceAnimation(currentMarqueeAnimation) : 
            championExiting ? getOppositeExitAnimation(currentMarqueeAnimation) :
            showChampionWindow ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            ...((!isFullSize && { maxWidth }) || {}),
            animationDuration: '0.8s',
            animationFillMode: 'both'
          }}
        >
          <div className="w-full max-w-[1188px] aspect-[1188/321] bg-black/75 backdrop-blur-sm border border-primary/20 rounded-[15px]">
            <div className="w-full h-full grid grid-cols-3 gap-4 px-6 py-6">
              {/* Left Column - Champion Name */}
              <div className="flex flex-col justify-center items-start">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-400 mb-2">
                  <AnimatedText 
                    text="#1 CHAMPION" 
                    animationClass={textAnimations.champion} 
                    baseDelay={0.75} 
                  />
                </div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                  <AnimatedText 
                    text={championGame.topScorerName || "No Name"} 
                    animationClass={textAnimations.name} 
                    baseDelay={0.95} 
                  />
                </div>
              </div>

              {/* Middle Column - High Score and Date */}
              <div className="flex flex-col justify-center items-center text-center">
                <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary mb-2">
                  <AnimatedText 
                    text={championGame.currentHighScore ? championGame.currentHighScore.toLocaleString() : "0"} 
                    animationClass={textAnimations.score} 
                    baseDelay={1.15} 
                  />
                </div>
                {championGame.topScoreDate && (
                  <div className="text-base sm:text-lg md:text-xl text-gray-300">
                    <AnimatedText 
                      text={formatDate(new Date(championGame.topScoreDate))} 
                      animationClass={textAnimations.date} 
                      baseDelay={1.35} 
                    />
                  </div>
                )}
              </div>

              {/* Right Column - Game Title and Subtitle */}
              <div className="flex flex-col justify-center items-end text-right">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary uppercase tracking-wide">
                  <AnimatedText 
                    text={championGame.name} 
                    animationClass={textAnimations.game} 
                    baseDelay={0.35} 
                  />
                </div>
                {championGame.subtitle && (
                  <div className="text-sm sm:text-base md:text-lg text-gray-300 mt-2">
                    <AnimatedText 
                      text={championGame.subtitle} 
                      animationClass={textAnimations.subtitle} 
                      baseDelay={0.55} 
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Scroll View Component - Shows all games vertically with infinite scroll (no individual animations)
function ScrollView({ games, animationsEnabled, hideHeader }: { 
  games: Game[]; 
  animationsEnabled: boolean; 
  hideHeader: boolean; 
}) {
  const [scrollPositionX, setScrollPositionX] = useState(0);
  const [scrollPositionY, setScrollPositionY] = useState(0);
  const [visibleGames, setVisibleGames] = useState<Game[]>([]);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [scrollSpeed, setScrollSpeed] = useState(1); // 1 = normal, 0.5 = slow, 2 = fast
  const [isInitialized, setIsInitialized] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isHoveringControls, setIsHoveringControls] = useState(false);
  const gameSpacing = 50; // Much closer together - reduced from 200 to 50
  const gameHeight = 321; // Height of each marquee
  const gameWidth = 1200; // Width of each marquee

  // Create infinite loop of games and initialize centered position
  useEffect(() => {
    if (games.length > 0) {
      const extendedGames = [...games, ...games, ...games]; // Triple the array for seamless loop
      setVisibleGames(extendedGames);
      
      // Calculate center position for first game
      const screenHeight = window.innerHeight;
      const centerPosition = (screenHeight / 2) - (gameHeight / 2) - 300; // 300 is the padding offset
      setScrollPositionY(-centerPosition);
      
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
      setScrollPositionY(prev => {
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

  // Timed fade for controls - fade after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, []);

  // Timer for fading controls after mouse leaves
  useEffect(() => {
    if (!isHoveringControls && showControls) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 10000); // 10 seconds after mouse leaves

      return () => clearTimeout(timer);
    }
  }, [isHoveringControls, showControls]);

  // Handle mouse events for controls
  const handleControlsMouseEnter = () => {
    setIsHoveringControls(true);
    setShowControls(true);
  };

  const handleControlsMouseLeave = () => {
    setIsHoveringControls(false);
  };

  return (
    <div className="relative overflow-hidden h-screen px-4 bg-background">


      
      {visibleGames.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-muted-foreground">Loading games...</h3>
          </div>
        </div>
      ) : (
        <div 
          className={`w-full max-w-[1200px] mx-auto transition-opacity duration-1000 ${isInitialized ? 'opacity-100' : 'opacity-0'}`}
          style={{ 
            transform: `translateY(-${scrollPositionY}px)`,
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
                scrollPosition={scrollPositionY}
                gameIndex={index}
                gameSpacing={gameSpacing}
                gameHeight={gameHeight}
                isAutoScrolling={isInitialized}
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

          {/* Left side - Game image or icon */}
          <div className="flex-shrink-0 mr-2 md:mr-4 w-20 xs:w-24 sm:w-32 md:w-80 relative">
            {game.imageUrl ? (
              <div className="relative w-full rounded-lg overflow-hidden shadow-md bg-black aspect-[792/214]">
                <img 
                  src={game.imageUrl} 
                  alt={game.name} 
                  className="w-full h-full object-contain"
                  style={{
                    aspectRatio: '792/214',
                    maxWidth: '100%',
                    height: 'auto'
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-12 sm:h-14 md:h-16 bg-muted rounded-lg flex items-center justify-center">
                {game.type === 'pinball' ? (
                  <CircleDot className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                ) : (
                  <Gamepad2 className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                )}
              </div>
            )}
          </div>

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
  const [showLogoOverlay, setShowLogoOverlay] = useState(true);
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

  // Logo overlay is always shown immediately
  // No timer needed as per user request

  // Font styling functions
  const getVenueNameStyle = () => ({
    fontFamily: venueSettings?.nameFont || "Arial",
    fontWeight: venueSettings?.nameFontStyle === "bold" ? "bold" : "normal",
    fontStyle: venueSettings?.nameFontStyle === "italic" ? "italic" : "normal",
    fontSize: `${venueSettings?.nameFontSize || 30}pt`,
    letterSpacing: '2px',
    lineHeight: 'calc(1.25em + 2px)',
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
  });

  const getLeaderboardTitleStyle = () => ({
    fontFamily: venueSettings?.leaderboardFont || "Arial",
    fontWeight: venueSettings?.leaderboardFontStyle === "bold" ? "bold" : "normal",
    fontStyle: venueSettings?.leaderboardFontStyle === "italic" ? "italic" : "normal",
    fontSize: `${venueSettings?.leaderboardFontSize || 30}pt`,
    letterSpacing: '1px'
  });

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

  // Remove loading screen - go directly to Single View

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
      className="space-y-2 min-h-screen flex flex-col"
      style={{
        '--titlebox-spacing': `${parseInt(venueSettings?.titleboxSpacing || "20")}px`
      } as React.CSSProperties}
    >
      {/* Header with venue name and view mode controls */}
      <div className="themed-header px-5 py-4 rounded-lg mb-2 w-full">
        
        {/* Mobile Layout: 3 Rows (visible on small screens only) */}
        <div className="block md:hidden">
          {/* Row 1: Logos evenly spaced */}
          <div className="flex items-center justify-between mb-3">
            {/* Left: Venue Logo */}
            <div className="flex-1 flex justify-start">
              {(venueSettings?.animatedLogoUrl || venueSettings?.logoUrl) && (
                <div 
                  className={`logo-container overflow-hidden cursor-pointer hover:opacity-80 transition-opacity w-20 h-10 flex items-center justify-center ${
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
                      className="w-full h-full object-contain p-1" 
                    />
                  )}
                </div>
              )}
            </div>
            
            {/* Right: Arcade Leaderboard Logo */}
            <div className="flex-1 flex justify-end">
              <div className="w-20 h-10 flex items-center justify-center">
                <img 
                  src="/arcade-leaderboard-logo.png" 
                  alt="Arcade Leaderboard" 
                  className="max-w-full max-h-full object-contain" 
                />
              </div>
            </div>
          </div>
          
          {/* Row 2: Leaderboard Name */}
          <div className="mb-2">
            <h1 className="font-black tracking-tight text-foreground uppercase text-outline leading-tight text-center" 
                style={{...getLeaderboardTitleStyle(), fontSize: '16px'}}>
              {venueSettings?.leaderboardName || "THE LEADERBOARD"}
            </h1>
          </div>
          
          {/* Row 3: Venue Name */}
          <div className="mb-3">
            <h2 
              className={`tracking-tight leading-tight text-center ${
                venueSettings?.subtitleBold === "true" ? "font-bold" : "font-normal"
              } ${
                venueSettings?.subtitleAllCaps === "true" ? "uppercase" : ""
              }`}
              style={{...getVenueNameStyle(), fontSize: '14px'}}
            >
              {venueSettings?.name || "Arcade"}
            </h2>
          </div>
          
          {/* Controls Row for Mobile */}
          <div className="flex items-center justify-center gap-2">
            {/* View Mode Buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === "single" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("single")}
                className="shadow-sm hover:shadow-md transition-all duration-200 h-[42px] w-[42px]"
                title="Single View"
              >
                <Square className="h-[16px] w-[16px]" />
              </Button>
              <Button
                variant={viewMode === "scroll" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("scroll")}
                className="shadow-sm hover:shadow-md transition-all duration-200 h-[42px] w-[42px]"
                title="Scroll View"
              >
                <List className="h-[16px] w-[16px]" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className="shadow-sm hover:shadow-md transition-all duration-200 h-[42px] w-[42px]"
                title="Grid View"
              >
                <Grid2X2 className="h-[16px] w-[16px]" />
              </Button>
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                asChild 
                className="h-[36px] px-4 text-base"
              >
                <Link href="/admin">Admin</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop Layout: Three Column Layout (visible on medium screens and up) */}
        <div className="hidden md:flex items-center w-full">
          {/* Left Venue Logo - Fixed 300px on desktop */}
          <div className="flex-shrink-0 w-[300px] flex justify-center">
            {(venueSettings?.animatedLogoUrl || venueSettings?.logoUrl) && (
              <div 
                className={`logo-container overflow-hidden cursor-pointer hover:opacity-80 transition-opacity w-[280px] h-36 flex items-center justify-center ${
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
          </div>
          
          {/* Center Content Area - Titles centered from marquee position */}
          <div className="flex-1 min-w-0 flex flex-col justify-center px-4">
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-foreground uppercase text-outline leading-tight text-center" style={getLeaderboardTitleStyle()}>
              {venueSettings?.leaderboardName || "THE LEADERBOARD"}
            </h1>
            <h2 
              className={`text-2xl lg:text-[2.625rem] tracking-tight leading-tight text-center ${
                venueSettings?.subtitleBold === "true" ? "font-bold" : "font-normal"
              } ${
                venueSettings?.subtitleAllCaps === "true" ? "uppercase" : ""
              }`}
              style={getVenueNameStyle()}
            >
              {venueSettings?.name || "Arcade"}
            </h2>
          </div>
          
          {/* Right Controls and Leaderboard Logo - Fixed 300px on desktop */}
          <div className="flex-shrink-0 w-[300px] flex justify-center">
            <div className="flex flex-col gap-2 self-center relative">
              {/* Navigation Elements with Timed Fade */}
              <div 
                className={`flex flex-col gap-2 transition-opacity duration-1000 group ${
                  showLogoOverlay ? 'opacity-0 hover:opacity-100' : 'opacity-100'
                }`}
              >
                {/* View Mode Buttons Row */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "single" ? (showLogoOverlay ? "outline" : "default") : "outline"}
                    size="icon"
                    onClick={() => setViewMode("single")}
                    className={`shadow-sm hover:shadow-md transition-all duration-200 h-[52px] w-[52px] ${
                      showLogoOverlay ? 'hover:opacity-100 group-hover:z-10 relative' : ''
                    }`}
                    title="Single View - One large game centered"
                  >
                    <Square className="h-[21px] w-[21px]" />
                  </Button>
                  <Button
                    variant={viewMode === "scroll" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("scroll")}
                    className={`shadow-sm hover:shadow-md transition-all duration-200 h-[52px] w-[52px] ${
                      showLogoOverlay ? 'hover:opacity-100 group-hover:z-10 relative' : ''
                    }`}
                    title="Scroll View - Infinite vertical scroll"
                  >
                    <List className="h-[21px] w-[21px]" />
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    className={`shadow-sm hover:shadow-md transition-all duration-200 h-[52px] w-[52px] ${
                      showLogoOverlay ? 'hover:opacity-100 group-hover:z-10 relative' : ''
                    }`}
                    title="Grid View - Games in a grid layout"
                  >
                    <Grid2X2 className="h-[21px] w-[21px]" />
                  </Button>
                </div>
                
                {/* Navigation Buttons Row */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    asChild 
                    className={`h-[42px] px-5 text-lg ${
                      showLogoOverlay ? 'hover:opacity-100 group-hover:z-10 relative' : ''
                    }`}
                  >
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
                <div className="w-[280px] h-72 flex items-center justify-center">
                  <img 
                    src="/arcade-leaderboard-logo.png" 
                    alt="Arcade Leaderboard" 
                    className="max-w-full max-h-full object-contain" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {!hideHeader && (
        <div className="mb-2">
          {/* Header content is rendered above */}
        </div>
      )}

      <div className="flex-1 min-h-0 pt-2.5 pb-2.5 flex items-center justify-center">
        {viewMode === "single" ? (
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
        ) : (
          <GridView 
            games={processedGames || []} 
            animationsEnabled={animationsEnabled} 
            hideHeader={hideHeader}
          />
        )}
      </div>

      {/* Footer Bar */}
      <div className="mt-2 h-[50px] bg-card/30">
        <div className="max-w-4xl mx-auto px-4 h-full flex items-center justify-center">
          <div className="flex items-center justify-center gap-[30px]">
            <img 
              src="/arcade-leaderboard-logo.png" 
              alt="Arcade Leaderboard" 
              className="h-8 w-auto"
            />
            <p className="text-sm text-primary">
              {venueSettings?.name || "Winona Axe and Arcade"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}