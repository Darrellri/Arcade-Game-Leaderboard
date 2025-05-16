import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertScoreSchema, venueSettingsSchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get venue settings
  app.get("/api/admin/settings", async (_req, res) => {
    try {
      const settings = await storage.getVenueSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch venue settings" });
    }
  });

  // Update venue settings
  app.patch("/api/admin/settings", async (req, res) => {
    try {
      const settings = await storage.updateVenueSettings(req.body);
      res.json(settings);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid settings data",
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update venue settings" });
    }
  });

  // Update game
  app.patch("/api/games/:id", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const game = await storage.updateGame(gameId, req.body);
      res.json(game);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid game data",
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update game" });
    }
  });

  // Get all games
  app.get("/api/games", async (_req, res) => {
    try {
      const games = await storage.getAllGames();
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  // Get a specific game
  app.get("/api/games/:id", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch game" });
    }
  });

  // Get scores for a game
  app.get("/api/games/:id/scores", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const scores = await storage.getScoresByGame(gameId);
      res.json(scores);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scores" });
    }
  });

  // Submit a new score
  app.post("/api/scores", async (req, res) => {
    try {
      const scoreData = insertScoreSchema.parse(req.body);
      
      // Verify game exists
      const game = await storage.getGame(scoreData.gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      // Add score and return
      const score = await storage.addScore(scoreData);
      res.status(201).json(score);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid score data",
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to submit score" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}