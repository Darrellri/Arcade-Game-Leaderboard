import { and, desc, eq } from "drizzle-orm";
import { db } from "./db";
import { games, scores, venueSettings, VenueSettings, Game, InsertGame, Score, InsertScore, type VenueSetting, InsertVenueSetting } from "@shared/schema";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  
  async getAllGames(includeHidden = true): Promise<Game[]> {
    if (!includeHidden) {
      return await db.select().from(games)
        .where(eq(games.hidden, false))
        .orderBy(games.displayOrder, games.createdAt);
    }
    
    return await db.select().from(games).orderBy(games.displayOrder, games.createdAt);
  }

  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game;
  }

  async addGame(game: InsertGame): Promise<Game> {
    // Get the highest displayOrder to place new game at the top
    const maxOrderResult = await db.select({ maxOrder: games.displayOrder })
      .from(games)
      .orderBy(desc(games.displayOrder))
      .limit(1);
    
    const maxOrder = maxOrderResult[0]?.maxOrder ?? 0;
    const newDisplayOrder = maxOrder + 1;
    
    const [newGame] = await db.insert(games).values({
      ...game,
      displayOrder: newDisplayOrder
    }).returning();
    return newGame;
  }

  async updateGameHighScore(id: number, score: number, playerName: string, date?: Date): Promise<Game> {
    const [updatedGame] = await db.update(games)
      .set({
        currentHighScore: score,
        topScorerName: playerName,
        topScoreDate: date || new Date()
      })
      .where(eq(games.id, id))
      .returning();
    
    return updatedGame;
  }

  async getScoresByGame(gameId: number): Promise<Score[]> {
    return await db.select()
      .from(scores)
      .where(eq(scores.gameId, gameId))
      .orderBy(desc(scores.score));
  }

  async addScore(score: InsertScore): Promise<Score> {
    const [newScore] = await db.insert(scores).values(score).returning();
    
    // Check if this is a new high score
    const game = await this.getGame(score.gameId);
    if (game && score.score > (game.currentHighScore || 0)) {
      await this.updateGameHighScore(score.gameId, score.score, score.playerName, score.submittedAt);
    }

    return newScore;
  }

  async updateGame(id: number, gameUpdate: Partial<Game>): Promise<Game> {
    const [updatedGame] = await db.update(games)
      .set(gameUpdate)
      .where(eq(games.id, id))
      .returning();
    
    return updatedGame;
  }

  async updateGameOrders(gameOrders: { id: number; displayOrder: number }[]): Promise<void> {
    try {
      console.log("=== DATABASE updateGameOrders START ===");
      console.log("Game orders to update:", JSON.stringify(gameOrders, null, 2));
      
      // Validate input data
      for (const order of gameOrders) {
        if (!order.id || typeof order.id !== 'number') {
          throw new Error(`Invalid game ID: ${order.id}`);
        }
        if (typeof order.displayOrder !== 'number') {
          throw new Error(`Invalid displayOrder for game ${order.id}: ${order.displayOrder}`);
        }
      }
      
      console.log("Input validation passed");
      
      // Update display order for each game using a transaction for better reliability
      await db.transaction(async (tx) => {
        console.log("Starting database transaction");
        
        for (const { id, displayOrder } of gameOrders) {
          console.log(`Updating game ${id} to displayOrder ${displayOrder}`);
          
          try {
            const result = await tx.update(games)
              .set({ displayOrder })
              .where(eq(games.id, id))
              .returning();
            
            console.log(`Game ${id} update result:`, result);
            
            if (result.length === 0) {
              throw new Error(`No game found with ID ${id}`);
            }
          } catch (gameError) {
            console.error(`Failed to update game ${id}:`, gameError);
            throw gameError;
          }
        }
        
        console.log("Transaction completed successfully");
      });
      
      console.log("=== DATABASE updateGameOrders SUCCESS ===");
    } catch (error: any) {
      console.error("=== DATABASE updateGameOrders ERROR ===");
      console.error("Error type:", typeof error);
      console.error("Error name:", error?.name);
      console.error("Error message:", error?.message);
      console.error("Error stack:", error?.stack);
      console.error("Full error object:", error);
      throw error;
    }
  }

  async deleteGame(id: number): Promise<void> {
    // First delete all scores for this game
    await db.delete(scores).where(eq(scores.gameId, id));
    
    // Then delete the game itself
    await db.delete(games).where(eq(games.id, id));
  }

  async getVenueSettings(): Promise<VenueSettings> {
    // Get the first venue settings record or create a default one
    const [settings] = await db.select().from(venueSettings);
    
    if (settings) {
      return {
        name: settings.name,
        leaderboardName: settings.leaderboardName || "THE LEADERBOARD",
        logoUrl: settings.logoUrl || undefined,
        animatedLogoUrl: settings.animatedLogoUrl || undefined,
        logoBackgroundColor: settings.logoBackgroundColor || "transparent",
        hideLogoBorderShadow: settings.hideLogoBorderShadow || "false",
        subtitleBold: (settings as any).subtitleBold || (settings as any).subtitle_bold || "true",
        subtitleAllCaps: (settings as any).subtitleAllCaps || (settings as any).subtitle_all_caps || "true",
        subtitleWhite: (settings as any).subtitleWhite || (settings as any).subtitle_white || "false",
        address: settings.address || undefined,
        phone: settings.phone || undefined,
        hours: settings.hours || undefined,
        theme: settings.theme as VenueSettings['theme'],
        themePresets: settings.themePresets as VenueSettings['themePresets']
      };
    }
    
    // Create default venue settings if none exist
    const defaultSettings = {
      name: "Winona Axe and Arcade",
      leaderboardName: "THE LEADERBOARD",
      logoBackgroundColor: "transparent",
      hideLogoBorderShadow: "false",
      subtitleBold: "true",
      subtitleAllCaps: "true",
      subtitleWhite: "false",
      theme: {
        primary: "hsl(280, 100%, 50%)",
        variant: "vibrant" as const,
        appearance: "dark" as const,
        radius: 0.75
      },
      themePresets: [
        {
          name: "Midnight Blue",
          primary: "hsl(220, 85%, 58%)",
          variant: "professional" as const,
          appearance: "dark" as const,
          radius: 0.75
        },
        {
          name: "Forest Green",
          primary: "hsl(142, 76%, 36%)",
          variant: "professional" as const,
          appearance: "dark" as const,
          radius: 0.5
        },
        {
          name: "Deep Purple",
          primary: "hsl(271, 81%, 56%)",
          variant: "tint" as const,
          appearance: "dark" as const,
          radius: 0.75
        },
        {
          name: "Crimson Red",
          primary: "hsl(348, 83%, 47%)",
          variant: "vibrant" as const,
          appearance: "dark" as const,
          radius: 0.5
        },
        {
          name: "Ocean Teal",
          primary: "hsl(188, 94%, 37%)",
          variant: "professional" as const,
          appearance: "dark" as const,
          radius: 0.75
        },
        {
          name: "Sunset Orange",
          primary: "hsl(24, 100%, 50%)",
          variant: "vibrant" as const,
          appearance: "dark" as const,
          radius: 0.5
        },
        {
          name: "Lavender Mist",
          primary: "hsl(267, 57%, 78%)",
          variant: "tint" as const,
          appearance: "light" as const,
          radius: 1.0
        },
        {
          name: "Rose Gold",
          primary: "hsl(15, 86%, 67%)",
          variant: "tint" as const,
          appearance: "light" as const,
          radius: 0.75
        },
        {
          name: "Arctic Silver",
          primary: "hsl(210, 20%, 55%)",
          variant: "professional" as const,
          appearance: "light" as const,
          radius: 0.5
        },
        {
          name: "Emerald Glow",
          primary: "hsl(160, 84%, 39%)",
          variant: "vibrant" as const,
          appearance: "dark" as const,
          radius: 0.75
        }
      ]
    };
    
    // Insert the default settings
    await db.insert(venueSettings).values({
      name: defaultSettings.name,
      leaderboardName: "THE LEADERBOARD",
      theme: defaultSettings.theme,
      themePresets: defaultSettings.themePresets
    });
    
    return defaultSettings;
  }

  async updateVenueSettings(settings: Partial<VenueSettings>): Promise<VenueSettings> {
    // Check if any venue settings exist
    const [existingSettings] = await db.select().from(venueSettings);
    
    if (existingSettings) {
      // Update existing settings
      const [updated] = await db.update(venueSettings)
        .set({
          name: settings.name || existingSettings.name,
          leaderboardName: settings.leaderboardName || existingSettings.leaderboardName,
          logoUrl: settings.logoUrl || existingSettings.logoUrl,
          animatedLogoUrl: settings.animatedLogoUrl !== undefined ? settings.animatedLogoUrl : existingSettings.animatedLogoUrl,
          logoBackgroundColor: settings.logoBackgroundColor || existingSettings.logoBackgroundColor,
          hideLogoBorderShadow: settings.hideLogoBorderShadow !== undefined ? settings.hideLogoBorderShadow : existingSettings.hideLogoBorderShadow,
          subtitleBold: settings.subtitleBold !== undefined ? settings.subtitleBold : (existingSettings as any).subtitle_bold,
          subtitleAllCaps: settings.subtitleAllCaps !== undefined ? settings.subtitleAllCaps : (existingSettings as any).subtitle_all_caps,
          subtitleWhite: settings.subtitleWhite !== undefined ? settings.subtitleWhite : (existingSettings as any).subtitle_white,
          address: settings.address || existingSettings.address,
          phone: settings.phone || existingSettings.phone,
          hours: settings.hours || existingSettings.hours,
          theme: settings.theme ? settings.theme : existingSettings.theme,
          themePresets: settings.themePresets ? settings.themePresets : existingSettings.themePresets,
          updatedAt: new Date()
        })
        .where(eq(venueSettings.id, existingSettings.id))
        .returning();
      
      const updatedSettings: VenueSettings = {
        name: updated.name,
        leaderboardName: updated.leaderboardName || "THE LEADERBOARD",
        logoUrl: updated.logoUrl || undefined,
        animatedLogoUrl: updated.animatedLogoUrl || undefined,
        logoBackgroundColor: updated.logoBackgroundColor || "transparent",
        hideLogoBorderShadow: updated.hideLogoBorderShadow || "false",
        subtitleBold: (updated as any).subtitleBold || (updated as any).subtitle_bold || "true",
        subtitleAllCaps: (updated as any).subtitleAllCaps || (updated as any).subtitle_all_caps || "true",
        subtitleWhite: (updated as any).subtitleWhite || (updated as any).subtitle_white || "false",
        address: updated.address || undefined,
        phone: updated.phone || undefined,
        hours: updated.hours || undefined,
        theme: updated.theme as VenueSettings['theme'],
        themePresets: updated.themePresets as VenueSettings['themePresets']
      };
      
      return updatedSettings;
    } else {
      // Create new settings
      await this.getVenueSettings(); // This will create the default settings
      return this.updateVenueSettings(settings); // Try again
    }
  }
}