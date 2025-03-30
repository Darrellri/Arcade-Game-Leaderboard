import { useState, useEffect } from 'react';
import type { Game } from '@shared/schema';

// Create a map of game names to their image URLs
function useGameImage(game: Game) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  useEffect(() => {
    if (!game) return;
    
    const gameImages: Record<string, string> = {
      "Godzilla": "/images/marquees/godzilla.jpg",
    };
    
    // If we have a custom image for this game, use it
    if (gameImages[game.name]) {
      setImageUrl(gameImages[game.name]);
    } else {
      // Otherwise use a fallback based on game type
      if (game.type === 'pinball') {
        setImageUrl("https://raw.githubusercontent.com/replit-community/arcade-assets/main/marquees/generic-pinball.jpg");
      } else {
        setImageUrl("https://raw.githubusercontent.com/replit-community/arcade-assets/main/marquees/generic-arcade.jpg");
      }
    }
  }, [game]);
  
  return imageUrl;
}

export { useGameImage };