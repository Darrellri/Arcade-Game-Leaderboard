import { useState, useEffect } from 'react';
import type { Game } from '@shared/schema';

// Get the game image URL from the game object
function useGameImage(game: Game) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  useEffect(() => {
    if (!game) return;
    
    // Use the imageUrl directly from the game object if available
    if (game.imageUrl) {
      setImageUrl(game.imageUrl);
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