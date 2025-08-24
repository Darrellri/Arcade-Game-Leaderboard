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
function ScrollMarquee({ game, className = "" }: { 
  game: Game; 
  className?: string; 
}) {
  const imageUrl = game.imageUrl;

  return (
    <div className={`w-full max-w-[1188px] aspect-[1188/321] relative overflow-hidden ${className}`} 
         style={{ borderRadius: '15px' }}>
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={`${game.name} marquee`}
          className="w-full h-full object-contain bg-black"
          style={{
            borderRadius: '15px',
            maxWidth: '100%',
            height: 'auto'
          }}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/40 flex items-center justify-center"
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
      
      {/* High Score Information Overlay - always visible, no animation */}
      {((game.currentHighScore && game.currentHighScore > 0) || game.topScorerName) && (
        <div className="absolute bottom-6 left-6 flex items-center gap-6 bg-black/80 backdrop-blur-sm rounded-2xl px-8 py-6 border border-primary/40" 
             style={{ zIndex: 100 }}>
          <TrophyIcon size={64} className="text-yellow-400" />
          <div className="text-white">
            <div className="text-2xl font-bold text-yellow-400 mb-1">#1 PINWIZARD</div>
            <div className="text-3xl font-bold mb-2">{game.topScorerName || "No Name"}</div>
            <div className="text-5xl font-bold text-primary mb-1">
              {game.currentHighScore ? game.currentHighScore.toLocaleString() : "0"}
            </div>
            {game.topScoreDate && (
              <div className="text-lg text-gray-300">
                {formatDate(new Date(game.topScoreDate))}
              </div>
            )}
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
  const [badgeAnimation, setBadgeAnimation] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [exitAnimation, setExitAnimation] = useState('');

  // Set random animations when component mounts or animationKey changes
  useEffect(() => {
    const entranceAnim = getRandomAnimation();
    setCurrentAnimation(entranceAnim);
    setExitAnimation(getExitAnimation(entranceAnim));
    setBadgeAnimation(getRandomAnimation());
    setIsVisible(false);
    setOverlayVisible(false);
    setIsExiting(false);

    // Start main animation after specified delay
    const mainTimer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    // Start overlay animation with random delay between 1.5-3 seconds after main animation
    const finalOverlayDelay = overlayDelay || (1500 + Math.random() * 1500);
    const overlayTimer = setTimeout(() => {
      setOverlayVisible(true);
    }, delay + finalOverlayDelay);

    // Start exit animation before the component cycles
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, delay + exitDelay);

    return () => {
      clearTimeout(mainTimer);
      clearTimeout(overlayTimer);
      clearTimeout(exitTimer);
    };
  }, [animationKey, delay, overlayDelay, exitDelay]);

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
          />
          
          {/* High Score Information Overlay with animation */}
          {((game.currentHighScore && game.currentHighScore > 0) || game.topScorerName) && (
            <div className={`absolute bottom-6 left-6 flex items-center gap-6 bg-black/80 backdrop-blur-sm rounded-2xl px-8 py-6 border border-primary/40 ${overlayVisible && !isExiting ? badgeAnimation : 'opacity-0'}`} 
                 style={{ zIndex: 100, animationDuration: '1.2s' }}>
              <TrophyIcon size={64} className="text-yellow-400" />
              <div className="text-white">
                <div className="text-2xl font-bold text-yellow-400 mb-1">#1 PINWIZARD</div>
                <div className="text-3xl font-bold mb-2">{game.topScorerName || "No Name"}</div>
                <div className="text-5xl font-bold text-primary mb-1">
                  {game.currentHighScore ? game.currentHighScore.toLocaleString() : "0"}
                </div>
                {game.topScoreDate && (
                  <div className="text-lg text-gray-300">
                    {formatDate(new Date(game.topScoreDate))}
                  </div>
                )}
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

// Dramatic Animation Effects Library - 70+ Effects
const animationEffects = [
  // Basic fade and slide effects
  'fadeIn', 'slideInLeft', 'slideInRight', 'slideInUp', 'slideInDown',
  
  // Dramatic off-screen flying entries
  'flyInFromLeft', 'flyInFromRight', 'flyInFromTop', 'flyInFromBottom',
  
  // Swooping dramatic entries
  'swoopInLeft', 'swoopInRight', 'spiralIn',
  
  // Explosive and dynamic entries
  'explodeIn', 'rocketIn', 'meteorIn',
  
  // Classic zoom and rotation effects
  'zoomIn', 'zoomOut', 'rotateIn', 'flipInX', 'flipInY',
  
  // Bouncing effects from all directions
  'bounceIn', 'bounceInLeft', 'bounceInRight', 'bounceInUp', 'bounceInDown',
  
  // Elastic and back effects
  'elasticIn', 'backInLeft', 'backInRight', 'backInUp', 'backInDown',
  
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

// Pairs of complementary animations for dual view staggered timing
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
  ['explodeIn', 'spiralIn'],
  ['rocketIn', 'meteorIn'],
  ['flyInFromTop', 'flyInFromBottom']
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
  const gameSpacing = 50; // Much closer together - reduced from 200 to 50

  // Create infinite loop of games
  useEffect(() => {
    if (games.length > 0) {
      const extendedGames = [...games, ...games, ...games]; // Triple the array for seamless loop
      setVisibleGames(extendedGames);
    }
  }, [games]);

  // Auto-scroll effect with configurable direction and speed
  useEffect(() => {
    const scrollTimer = setInterval(() => {
      setScrollPosition(prev => {
        const baseSpeed = 1.2;
        const adjustedSpeed = baseSpeed * scrollSpeed;
        const movement = scrollDirection === 'up' ? adjustedSpeed : -adjustedSpeed;
        const newPosition = prev + movement;
        const resetPoint = games.length * (gameSpacing + 321); // Game height + spacing
        
        if (scrollDirection === 'up') {
          return newPosition >= resetPoint ? 0 : newPosition;
        } else {
          return newPosition <= -resetPoint ? 0 : newPosition;
        }
      });
    }, 40); // Smooth scrolling

    return () => clearInterval(scrollTimer);
  }, [games.length, gameSpacing, scrollDirection, scrollSpeed]);

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

      {!hideHeader && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b p-4">
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Arcade Games</h2>
          </div>
        </div>
      )}
      
      {visibleGames.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-muted-foreground">Loading games...</h3>
          </div>
        </div>
      ) : (
        <div 
          className="space-y-4 w-full max-w-[1200px] mx-auto"
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
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [hideHeader, setHideHeader] = useState(false);
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
        <div className="flex flex-col gap-2 self-start sm:self-center mt-2 sm:mt-0">
          {/* View Mode Buttons Row */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant={viewMode === "dual" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("dual")}
              className="shadow-sm hover:shadow-md transition-all duration-200 h-8 w-8 sm:h-10 sm:w-10"
              title="Dual View - Two games side by side"
            >
              <Grid2X2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
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
              variant={viewMode === "scroll" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("scroll")}
              className="shadow-sm hover:shadow-md transition-all duration-200 h-8 w-8 sm:h-10 sm:w-10"
              title="Scroll View - Infinite vertical scroll"
            >
              <List className="h-3 w-3 sm:h-4 sm:w-4" />
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
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="shadow-sm hover:shadow-md transition-all duration-200 h-8 w-8 sm:h-10 sm:w-10"
              title="List View - Games in a vertical list"
            >
              <CircleDot className="h-3 w-3 sm:h-4 sm:w-4" />
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