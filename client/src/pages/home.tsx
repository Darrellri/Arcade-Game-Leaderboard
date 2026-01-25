import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Game, VenueSettings } from "@shared/schema";
import { Button } from "@/components/ui/button";
import GameCard from "@/components/game-card";
import ShareScore from "@/components/share-score";
import { Skeleton } from "@/components/ui/skeleton";
import { Gamepad2, List, CircleDot, Trophy, GripVertical, MonitorSpeaker, Play, Square } from "lucide-react";
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
  const [fadeOpacity, setFadeOpacity] = useState(1);
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
      const gameCenterPosition = gameTopPosition + (gameHeight / 2);
      
      // Always keep marquees visible - no fade effect
      setFadeOpacity(1);
      
      // Check if game center is near screen center for layer animation
      const centerThreshold = 50;
      const isNearCenter = Math.abs(gameCenterPosition - screenCenter) < centerThreshold;
      
      // Trigger animation only once per pass through center
      if (isNearCenter && game.overlayImageUrl && !wasInCenter && !topOverlayVisible) {
        setWasInCenter(true);
        setTopOverlayVisible(true);
        setAnimationCount(prev => prev + 1);
        
        setTimeout(() => {
          setTopOverlayVisible(false);
        }, 1500);
      } else if (!isNearCenter && wasInCenter) {
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
        <div className={`absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm border-t border-primary/20 px-6 ${scoreOverlayVisible ? scoreAnimationClass : 'translate-y-full opacity-0'}`}
             style={{ 
               zIndex: 100, 
               borderBottomLeftRadius: '15px', 
               borderBottomRightRadius: '15px',
               paddingTop: '30px',
               paddingBottom: '30px'
             }}>
          <div className="flex items-center justify-between w-full gap-2">
            {/* Left side - Champion info with text animation */}
            <div className="flex items-center gap-2 flex-shrink-0" style={{ minWidth: '25%', maxWidth: '35%' }}>
              <div 
                className="flex-shrink-0 flex items-center justify-center"
                style={{ width: 'clamp(28px, 4vw, 62px)', height: 'clamp(28px, 4vw, 62px)' }}
              >
                <TrophyIcon className="text-yellow-400 w-full h-full" />
              </div>
              <div className="text-white" style={{ whiteSpace: 'nowrap' }}>
                <div 
                  className="font-bold text-yellow-400 animate-text-float-up"
                  style={{ fontSize: 'clamp(0.7rem, 1.5vw, 1.5rem)' }}
                >
                  #1 CHAMPION
                </div>
                <div 
                  className="font-bold animate-text-gentle-bob"
                  style={{ fontSize: 'clamp(0.9rem, 2.2vw, 2.5rem)' }}
                >
                  {game.topScorerName || "No Name"}
                </div>
              </div>
            </div>
            
            {/* Center - Game name with text animation */}
            <div className="text-center flex-1 px-2" style={{ whiteSpace: 'nowrap', minWidth: '30%' }}>
              <div 
                className="font-bold text-primary uppercase tracking-wide animate-text-pulse-up"
                style={{ fontSize: 'clamp(0.9rem, 2vw, 2rem)' }}
              >
                {game.name}
              </div>
              {game.subtitle && (
                <div 
                  className="text-gray-300 mt-1 animate-text-float-up"
                  style={{ fontSize: 'clamp(0.6rem, 1.2vw, 1.1rem)' }}
                >
                  {game.subtitle}
                </div>
              )}
            </div>
            
            {/* Right side - Score and date with text animation */}
            <div className="text-right flex-shrink-0" style={{ whiteSpace: 'nowrap', minWidth: '25%', maxWidth: '35%' }}>
              <div 
                className="font-bold text-primary animate-text-pulse-up"
                style={{ fontSize: 'clamp(1.2rem, 3vw, 3.5rem)' }}
              >
                {game.currentHighScore ? game.currentHighScore.toLocaleString() : "0"}
              </div>
              {game.topScoreDate && (
                <div 
                  className="text-gray-300 mt-1 animate-text-gentle-bob"
                  style={{ fontSize: 'clamp(0.6rem, 1.2vw, 1.1rem)' }}
                >
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
// Layer overlay animations - pool of 20 animations for variety
const layerAnimationsPool = [
  'animate-layer-bounce-left',
  'animate-layer-bounce-right',
  'animate-layer-grow-wobble',
  'animate-layer-pop-impact',
  'animate-layer-drift-slow-left',
  'animate-layer-drift-slow-right',
  'animate-layer-elastic-settle',
  'animate-layer-pop-shake',
  'animate-layer-swing-left',
  'animate-layer-swing-right',
  'animate-layer-zoom-bounce',
  'animate-layer-float-up',
  'animate-layer-float-down',
  'animate-layer-pulse-grow',
  'animate-layer-jitter-in',
  'animate-layer-spiral-subtle',
  'animate-layer-snap-in',
  'animate-layer-slide-bounce-left',
  'animate-layer-slide-bounce-right',
  'animate-layer-wobble-scale'
];

// Shuffle array using Fisher-Yates algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Animation cycle manager - shuffles animations each cycle so games get different animations
let currentAnimationCycle: string[] = shuffleArray(layerAnimationsPool);
let animationCycleIndex = 0;

// Get next animation from shuffled pool, reshuffles when cycle completes
const getNextLayerAnimation = () => {
  const animation = currentAnimationCycle[animationCycleIndex % currentAnimationCycle.length];
  animationCycleIndex++;
  
  // Reshuffle when we've used all animations
  if (animationCycleIndex >= currentAnimationCycle.length) {
    currentAnimationCycle = shuffleArray(layerAnimationsPool);
    animationCycleIndex = 0;
  }
  
  return animation;
};

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
  const overlayImageUrl = game.overlayImageUrl;
  const [currentAnimation, setCurrentAnimation] = useState('');
  const [overlayAnimation, setOverlayAnimation] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [topOverlayVisible, setTopOverlayVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [exitAnimation, setExitAnimation] = useState('');
  const [bgReaction, setBgReaction] = useState('');
  
  // Background reaction animations array
  const bgReactionAnimations = [
    'animate-bg-react-shake',
    'animate-bg-react-pulse',
    'animate-bg-react-ripple',
    'animate-bg-react-bump'
  ];

  // Set random animations when component mounts or animationKey changes
  useEffect(() => {
    const entranceAnim = getRandomAnimation();
    const exitAnim = getExitAnimation(entranceAnim);
    const layerAnim = getNextLayerAnimation();
    const bgReactAnim = bgReactionAnimations[Math.floor(Math.random() * bgReactionAnimations.length)];
    
    setCurrentAnimation(entranceAnim);
    setExitAnimation(exitAnim);
    setOverlayAnimation(layerAnim);
    setBgReaction('');
    
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

    // Show layer immediately after marquee animation completes (800ms animation duration)
    const layerTimer = setTimeout(() => {
      if (overlayImageUrl) {
        setTopOverlayVisible(true);
      }
    }, delay + 850); // Show layer right after main animation finishes

    // Trigger background reaction 200ms before layer animation ends
    const bgReactTimer = setTimeout(() => {
      if (overlayImageUrl) {
        setBgReaction(bgReactAnim);
      }
    }, delay + 850 + 400); // Layer shows at 850ms, react 400ms in (200ms before ~600ms animation ends)

    // Start exit animation before the component cycles
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      setTopOverlayVisible(false); // Hide layer when exiting
      setBgReaction(''); // Clear bg reaction when exiting
    }, delay + exitDelay);

    return () => {
      clearTimeout(mainTimer);
      clearTimeout(layerTimer);
      clearTimeout(bgReactTimer);
      clearTimeout(exitTimer);
    };
  }, [animationKey, delay, exitDelay, overlayImageUrl]);

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
           style={{ borderRadius: '15px', animationDuration: '0.8s', perspective: '1000px' }}>
        <div className={`w-full h-full bg-black flex items-center justify-center ${bgReaction}`}
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
        
        {/* Top overlay image layer for depth effect */}
        {overlayImageUrl && topOverlayVisible && (
          <div 
            className={`absolute inset-0 flex items-center justify-center pointer-events-none ${overlayAnimation}`}
            style={{ 
              borderRadius: '15px',
              transformStyle: 'preserve-3d'
            }}
          >
            <img 
              src={overlayImageUrl} 
              alt={`${game.name} overlay`}
              className="w-full h-full object-contain"
              style={{
                borderRadius: '15px',
                maxWidth: '100%',
                height: 'auto',
                filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.5))'
              }}
            />
          </div>
        )}
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

type ViewMode = "single" | "scroll";

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
      <div 
        className={`container mx-auto transition-opacity duration-1000 ${isInitialized ? 'opacity-100' : 'opacity-0'}`}
        style={{ 
          transform: `translateY(-${scrollPositionY}px)`,
          paddingTop: '100px'
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
          <div className="w-full max-w-[1188px] bg-black/75 backdrop-blur-sm border border-primary/20 rounded-[15px]">
            <div className="w-full h-full grid grid-cols-3 gap-4 px-6 py-1">
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
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-2">
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
  const [scrollPositionY, setScrollPositionY] = useState(0);
  const [visibleGames, setVisibleGames] = useState<Game[]>([]);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isHoveringControls, setIsHoveringControls] = useState(false);
  const gameSpacing = 50;
  const gameHeight = 321;
  const singleSetHeight = games.length * (gameHeight + gameSpacing);

  // Create infinite loop of games with enough copies for seamless scrolling
  useEffect(() => {
    if (games.length > 0) {
      // Create 5 copies for smoother infinite scrolling
      const extendedGames = [...games, ...games, ...games, ...games, ...games];
      setVisibleGames(extendedGames);
      
      // Start at the second set so we have room to scroll in both directions
      setScrollPositionY(singleSetHeight);
      
      setTimeout(() => {
        setIsInitialized(true);
      }, 100);
    }
  }, [games, gameHeight, singleSetHeight]);

  // Auto-scroll effect with seamless infinite loop
  useEffect(() => {
    if (!isInitialized || games.length === 0) return;
    
    const scrollTimer = setInterval(() => {
      setScrollPositionY(prev => {
        const baseSpeed = 1.2;
        const adjustedSpeed = baseSpeed * scrollSpeed;
        const movement = scrollDirection === 'up' ? adjustedSpeed : -adjustedSpeed;
        let newPosition = prev + movement;
        
        // Seamless wrap-around: when we've scrolled through one full set,
        // jump back by exactly one set height (invisible to user)
        if (scrollDirection === 'up') {
          // Scrolling up (content moves up, user sees games scrolling upward)
          if (newPosition >= singleSetHeight * 3) {
            newPosition = newPosition - singleSetHeight;
          }
        } else {
          // Scrolling down
          if (newPosition <= singleSetHeight) {
            newPosition = newPosition + singleSetHeight;
          }
        }
        
        return newPosition;
      });
    }, 40);

    return () => clearInterval(scrollTimer);
  }, [games.length, gameSpacing, scrollDirection, scrollSpeed, isInitialized, gameHeight, singleSetHeight]);

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
  const [buttonsVisible, setButtonsVisible] = useState(true);
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

  // Auto-hide navigation buttons after 10 seconds of inactivity
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;
    
    const resetTimer = () => {
      setButtonsVisible(true);
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        setButtonsVisible(false);
      }, 10000); // 10 seconds
    };
    
    // Initial timer start
    resetTimer();
    
    // Event listeners for activity detection
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });
    
    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, []);

  // Font styling functions
  const getVenueNameStyle = (isMobile = false) => ({
    fontFamily: venueSettings?.nameFont || "'Oswald', 'Impact', 'Arial Black', sans-serif",
    fontWeight: venueSettings?.nameFontStyle === "bold" ? "900" : "700",
    fontStyle: venueSettings?.nameFontStyle === "italic" ? "italic" : "normal",
    letterSpacing: '0.08em',
    lineHeight: '1.1',
    whiteSpace: 'nowrap' as const,
    color: venueSettings?.subtitleWhite === "true" 
      ? "white" 
      : (() => {
          const isLightScheme = venueSettings?.theme?.appearance === "light" || 
            (venueSettings?.theme?.variant === "tint" && venueSettings?.theme?.appearance !== "dark") ||
            (venueSettings?.theme?.primary && parseInt(venueSettings.theme.primary.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)?.[3] || "0") > 60);
          
          if (isLightScheme) {
            return venueSettings?.theme?.primary || "hsl(280, 100%, 50%)";
          } else {
            return venueSettings?.theme?.primary
              ? `hsl(${venueSettings.theme.primary.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)?.[1] || 280}, ${venueSettings.theme.primary.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)?.[2] || 100}%, ${Math.min(100, parseInt(venueSettings.theme.primary.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)?.[3] || "50") + 25)}%)`
              : "hsl(280, 100%, 75%)";
          }
        })()
  });

  const getLeaderboardTitleStyle = (isMobile = false) => ({
    fontFamily: venueSettings?.leaderboardFont || "'Bebas Neue', 'Impact', sans-serif",
    fontWeight: venueSettings?.leaderboardFontStyle === "bold" ? "bold" : "700",
    fontStyle: venueSettings?.leaderboardFontStyle === "italic" ? "italic" : "normal",
    letterSpacing: '0.08em'
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
          {/* Row 1: Venue Logo */}
          <div className="flex items-center justify-center mb-2">
            {(venueSettings?.animatedLogoUrl || venueSettings?.logoUrl) && (
              <div 
                className={`logo-container overflow-hidden cursor-pointer hover:opacity-80 transition-opacity w-24 h-12 flex items-center justify-center ${
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
          
          {/* Row 2: GAME MASTER Title + Arcade Leaderboard Logo */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="game-master-title text-xl whitespace-nowrap">
              GAME MASTER
            </h1>
            <img 
              src="/arcade-leaderboard-logo.png" 
              alt="Arcade Leaderboard" 
              className="h-6 w-auto object-contain" 
            />
          </div>
          
          {/* Controls Row for Mobile */}
          <div className={`flex items-center justify-center gap-2 transition-opacity duration-1000 ${
            buttonsVisible ? 'opacity-100' : 'opacity-0'
          }`}>
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
          
          {/* Center Content Area - GAME MASTER Title + Arcade Logo */}
          <div className="flex-1 min-w-0 flex items-center justify-center gap-4 px-4">
            <h1 className="game-master-title text-4xl lg:text-5xl xl:text-6xl whitespace-nowrap">
              GAME MASTER
            </h1>
            <img 
              src="/arcade-leaderboard-logo.png" 
              alt="Arcade Leaderboard" 
              className="h-16 lg:h-20 xl:h-24 w-auto object-contain" 
            />
          </div>
          
          {/* Right Controls - Fixed 300px on desktop */}
          <div className="flex-shrink-0 w-[300px] flex justify-center">
            <div className={`flex flex-col gap-2 self-center transition-opacity duration-1000 ${
              buttonsVisible ? 'opacity-100' : 'opacity-0'
            }`}>
              {/* View Mode Buttons Row */}
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "single" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("single")}
                  className="shadow-sm hover:shadow-md transition-all duration-200 h-[42px] w-[42px]"
                  title="Single View - One large game centered"
                >
                  <Square className="h-[16px] w-[16px]" />
                </Button>
                <Button
                  variant={viewMode === "scroll" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("scroll")}
                  className="shadow-sm hover:shadow-md transition-all duration-200 h-[42px] w-[42px]"
                  title="Scroll View - Infinite vertical scroll"
                >
                  <List className="h-[16px] w-[16px]" />
                </Button>
              </div>
              
              {/* Navigation Buttons Row */}
              <div className="flex gap-2">
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
    </div>
  );
}