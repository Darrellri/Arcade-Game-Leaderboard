import { and, desc, eq } from "drizzle-orm";
import { db } from "./db";
import { games, scores, venueSettings, VenueSettings, Game, InsertGame, Score, InsertScore, type VenueSetting, InsertVenueSetting } from "@shared/schema";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  
  async getAllGames(): Promise<Game[]> {
    return await db.select().from(games).orderBy(desc(games.createdAt));
  }

  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game;
  }

  async addGame(game: InsertGame): Promise<Game> {
    const [newGame] = await db.insert(games).values(game).returning();
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
      theme: {
        primary: "hsl(280, 100%, 50%)",
        variant: "vibrant" as const,
        appearance: "dark" as const,
        radius: 0.75
      },
      themePresets: [
        {
          name: "Classic Arcade Purple",
          primary: "hsl(280, 100%, 50%)",
          variant: "vibrant" as const,
          appearance: "dark" as const,
          radius: 0.75
        },
        {
          name: "Retro Green",
          primary: "hsl(142, 71%, 45%)",
          variant: "vibrant" as const,
          appearance: "dark" as const,
          radius: 0.5
        },
        {
          name: "Neon Blue",
          primary: "hsl(215, 100%, 50%)",
          variant: "vibrant" as const,
          appearance: "dark" as const,
          radius: 0.75
        },
        {
          name: "Classic Red",
          primary: "hsl(0, 100%, 60%)",
          variant: "vibrant" as const,
          appearance: "dark" as const,
          radius: 0.5
        },
        {
          name: "Golden",
          primary: "hsl(48, 100%, 50%)",
          variant: "vibrant" as const,
          appearance: "dark" as const,
          radius: 0.6
        },
        {
          name: "Teal Dream",
          primary: "hsl(180, 100%, 37%)",
          variant: "vibrant" as const,
          appearance: "dark" as const,
          radius: 0.8
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