import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertScoreSchema, insertGameSchema, venueSettingsSchema } from "@shared/schema";
import { ZodError } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

// Configure multer for storing game marquee images
const marqueeStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = path.join(process.cwd(), 'public', 'uploads');
    // Ensure the directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    // Use gameId to name the file (passed in the request body)
    // With a timestamp to prevent caching issues
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'game-marquee-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: marqueeStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept only images
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed!"));
  }
});

// Configure multer for animated logo videos
const animatedLogoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'animated-logo-' + uniqueSuffix + ext);
  }
});

const uploadAnimatedLogo = multer({
  storage: animatedLogoStorage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for videos
  },
  fileFilter: (_req, file, cb) => {
    // Accept only videos
    const filetypes = /mp4|avi|mov|wmv|flv|webm|mkv/;
    const mimetype = file.mimetype.startsWith('video/');
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only video files are allowed!"));
  }
});

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

  // Update venue settings (both PATCH and PUT for compatibility)
  const updateVenueSettingsHandler = async (req: Request, res: Response) => {
    try {
      console.log("Updating venue settings:", req.body);
      const settings = await storage.updateVenueSettings(req.body);
      console.log("Settings updated successfully:", settings);
      res.json(settings);
    } catch (error) {
      console.error("Error updating venue settings:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid settings data",
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update venue settings" });
    }
  };

  app.patch("/api/admin/settings", updateVenueSettingsHandler);
  app.put("/api/admin/settings", updateVenueSettingsHandler);

  // Upload animated logo
  app.post("/api/admin/upload-animated-logo", uploadAnimatedLogo.single('animatedLogo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Create relative URL to the uploaded file
      const relativeFilePath = `/uploads/${path.basename(req.file.path)}`;
      
      res.json({ 
        url: relativeFilePath,
        message: "Animated logo uploaded successfully" 
      });
    } catch (error) {
      // Remove uploaded file if there's an error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: "Failed to upload animated logo" });
    }
  });

  // Reorder games (must come before the :id route to avoid conflict)
  app.patch("/api/games/reorder", async (req, res) => {
    try {
      console.log("=== REORDER ENDPOINT START ===");
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      
      const { gameOrders } = req.body;
      
      if (!gameOrders || !Array.isArray(gameOrders)) {
        console.error("Invalid gameOrders data:", gameOrders);
        return res.status(400).json({ message: "Invalid gameOrders data" });
      }
      
      console.log("Valid gameOrders received, count:", gameOrders.length);
      console.log("Game orders to process:", JSON.stringify(gameOrders, null, 2));
      
      await storage.updateGameOrders(gameOrders);
      console.log("=== REORDER ENDPOINT SUCCESS ===");
      res.json({ message: "Game order updated successfully" });
    } catch (error: any) {
      console.error("=== REORDER ENDPOINT ERROR ===");
      console.error("Error type:", typeof error);
      console.error("Error name:", error?.name);
      console.error("Error message:", error?.message);
      console.error("Error stack:", error?.stack);
      console.error("Full error object:", error);
      res.status(500).json({ 
        message: "Failed to update game order", 
        error: error?.message || "Unknown error",
        details: error?.toString() || "No details available"
      });
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
  app.get("/api/games", async (req, res) => {
    try {
      const includeHidden = req.query.includeHidden === 'true';
      const games = await storage.getAllGames(includeHidden);
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });
  
  // Add a new game
  app.post("/api/games", async (req, res) => {
    try {
      const gameData = insertGameSchema.parse(req.body);
      const newGame = await storage.addGame(gameData);
      res.status(201).json(newGame);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid game data",
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to add game" });
    }
  });
  
  // Delete a game
  app.delete("/api/games/:id", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const game = await storage.getGame(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      await storage.deleteGame(gameId);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete game" });
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

  // Upload game marquee image (792x214 aspect ratio)
  app.post("/api/games/:id/upload-marquee", upload.single('marqueeImage'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const gameId = parseInt(req.params.id);
      const game = await storage.getGame(gameId);
      
      if (!game) {
        // Remove uploaded file if game doesn't exist
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: "Game not found" });
      }

      // Create relative URL to the uploaded file
      const relativeFilePath = `/uploads/${path.basename(req.file.path)}`;
      
      // Update the game's image URL
      const updatedGame = await storage.updateGame(gameId, { 
        imageUrl: relativeFilePath 
      });

      // Use plain string to avoid JSON.stringify issues
      res.setHeader('Content-Type', 'application/json');
      res.status(200).send(JSON.stringify({ 
        success: true, 
        game: updatedGame,
        imageUrl: relativeFilePath
      }));
    } catch (error) {
      console.error("Error uploading marquee image:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Upload overlay image for a game
  app.post("/api/games/:id/upload-overlay", upload.single('overlayImage'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const gameId = parseInt(req.params.id);
      const game = await storage.getGame(gameId);
      
      if (!game) {
        // Remove uploaded file if game doesn't exist
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: "Game not found" });
      }

      // Create relative URL to the uploaded file
      const relativeFilePath = `/uploads/${path.basename(req.file.path)}`;
      
      // Update the game's overlay image URL
      const updatedGame = await storage.updateGame(gameId, { 
        overlayImageUrl: relativeFilePath 
      });

      // Use plain string to avoid JSON.stringify issues
      res.setHeader('Content-Type', 'application/json');
      res.status(200).send(JSON.stringify({ 
        success: true, 
        game: updatedGame,
        overlayUrl: relativeFilePath
      }));
    } catch (error) {
      console.error("Error uploading overlay image:", error);
      res.status(500).json({ message: "Failed to upload overlay image" });
    }
  });
  
  // Database management routes
  
  // Clear all data
  app.get("/api/admin/clear-all-data", async (req, res) => {
    try {
      // Run the clear-all-data script
      execSync('cd scripts && npx tsx clear-all-data.ts');
      
      // Redirect back to admin page with success message
      res.redirect('/admin?message=All%20data%20has%20been%20cleared');
    } catch (error) {
      console.error("Error clearing data:", error);
      res.redirect('/admin?error=Failed%20to%20clear%20data');
    }
  });
  
  // Restore demo data
  app.get("/api/admin/restore-demo-data", async (req, res) => {
    try {
      // Run the seed-demo-data script
      execSync('cd scripts && npx tsx seed-demo-data.ts');
      
      // Redirect back to admin page with success message
      res.redirect('/admin?message=Demo%20data%20has%20been%20restored');
    } catch (error) {
      console.error("Error restoring demo data:", error);
      res.redirect('/admin?error=Failed%20to%20restore%20demo%20data');
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}