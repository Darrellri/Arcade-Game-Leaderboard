import { Game, InsertGame, Score, InsertScore } from "@shared/schema";

export interface IStorage {
  // Game operations
  getAllGames(): Promise<Game[]>;
  getGame(id: number): Promise<Game | undefined>;
  addGame(game: InsertGame): Promise<Game>;
  updateGameHighScore(id: number, score: number, playerName: string): Promise<Game>;

  // Score operations
  getScoresByGame(gameId: number): Promise<Score[]>;
  addScore(score: InsertScore): Promise<Score>;
}

export class MemStorage implements IStorage {
  private games: Map<number, Game>;
  private scores: Map<number, Score>;
  private gameCurrentId: number;
  private scoreCurrentId: number;

  constructor() {
    this.games = new Map();
    this.scores = new Map();
    this.gameCurrentId = 1;
    this.scoreCurrentId = 1;

    // Initialize with sample games
    const sampleGames: InsertGame[] = [
      {
        name: "X-Men Pinball",
        imageUrl: "https://axeandarcade.com/wp-content/uploads/2024/03/xmen-marquee-792x214.jpg",
        type: "pinball"
      },
      {
        name: "Godzilla Pinball",
        imageUrl: "https://axeandarcade.com/wp-content/uploads/2024/03/godzilla-marquee-792x214.jpg",
        type: "pinball"
      },
      {
        name: "STAR WARS TRILOGY",
        imageUrl: "https://axeandarcade.com/wp-content/uploads/2024/03/starwars-marquee-792x214.jpg",
        type: "arcade"
      },
      {
        name: "Asteroids",
        imageUrl: "https://axeandarcade.com/wp-content/uploads/2024/03/asteroids-marquee-792x214.jpg",
        type: "arcade"
      },
      {
        name: "Marble Madness",
        imageUrl: "https://axeandarcade.com/wp-content/uploads/2024/03/marblemadness-marquee-792x214.jpg",
        type: "arcade"
      },
      {
        name: "Big Buck Hunter Reloaded",
        imageUrl: "https://axeandarcade.com/wp-content/uploads/2024/03/bigbuckhunter-marquee-792x214.jpg",
        type: "arcade"
      }
    ];

    sampleGames.forEach(game => this.addGame(game));

    // Add sample high scores from the last 4 weeks
    const sampleScores = [
      // X-Men Pinball scores (typically range from 1M to 10M)
      { gameId: 1, playerName: "Mike S.", score: 8750000, phoneNumber: "+15551234567", imageUrl: "https://example.com/scores/1.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-03-15") },
      { gameId: 1, playerName: "Sarah L.", score: 7250000, phoneNumber: "+15559876543", imageUrl: "https://example.com/scores/2.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-03-10") },
      { gameId: 1, playerName: "John D.", score: 6500000, phoneNumber: "+15552345678", imageUrl: "https://example.com/scores/3.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-03-05") },

      // Godzilla Pinball scores (typically range from 500K to 5M)
      { gameId: 2, playerName: "Alex R.", score: 4250000, phoneNumber: "+15553456789", imageUrl: "https://example.com/scores/4.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-03-17") },
      { gameId: 2, playerName: "Emma T.", score: 3750000, phoneNumber: "+15554567890", imageUrl: "https://example.com/scores/5.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-03-12") },

      // Star Wars Trilogy (typically range from 100K to 1M)
      { gameId: 3, playerName: "Chris M.", score: 950000, phoneNumber: "+15555678901", imageUrl: "https://example.com/scores/6.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-03-16") },
      { gameId: 3, playerName: "Lisa P.", score: 875000, phoneNumber: "+15556789012", imageUrl: "https://example.com/scores/7.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-03-08") },

      // Asteroids (typically range from 50K to 250K)
      { gameId: 4, playerName: "Dave K.", score: 225000, phoneNumber: "+15557890123", imageUrl: "https://example.com/scores/8.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-03-14") },
      { gameId: 4, playerName: "Paul W.", score: 195000, phoneNumber: "+15558901234", imageUrl: "https://example.com/scores/9.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-03-07") },

      // Marble Madness (typically range from 10K to 100K)
      { gameId: 5, playerName: "Nina H.", score: 85000, phoneNumber: "+15559012345", imageUrl: "https://example.com/scores/10.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-03-13") },
      { gameId: 5, playerName: "Tom B.", score: 72000, phoneNumber: "+15550123456", imageUrl: "https://example.com/scores/11.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-03-06") },

      // Big Buck Hunter (typically range from 5K to 50K)
      { gameId: 6, playerName: "Ryan M.", score: 45000, phoneNumber: "+15551234567", imageUrl: "https://example.com/scores/12.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-03-18") },
      { gameId: 6, playerName: "Kelly S.", score: 38000, phoneNumber: "+15552345678", imageUrl: "https://example.com/scores/13.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-03-09") }
    ];

    sampleScores.forEach(score => this.addScore(score));
  }

  async getAllGames(): Promise<Game[]> {
    return Array.from(this.games.values());
  }

  async getGame(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async addGame(game: InsertGame): Promise<Game> {
    const id = this.gameCurrentId++;
    const newGame: Game = {
      ...game,
      id,
      currentHighScore: 0,
      topScorerName: "",
      topScoreDate: new Date(0) // Initialize with epoch
    };
    this.games.set(id, newGame);
    return newGame;
  }

  async updateGameHighScore(id: number, score: number, playerName: string): Promise<Game> {
    const game = await this.getGame(id);
    if (!game) throw new Error("Game not found");

    const updatedGame: Game = {
      ...game,
      currentHighScore: score,
      topScorerName: playerName,
      topScoreDate: new Date()
    };
    this.games.set(id, updatedGame);
    return updatedGame;
  }

  async getScoresByGame(gameId: number): Promise<Score[]> {
    return Array.from(this.scores.values())
      .filter(score => score.gameId === gameId)
      .sort((a, b) => b.score - a.score);
  }

  async addScore(score: InsertScore): Promise<Score> {
    const id = this.scoreCurrentId++;
    const newScore: Score = {
      ...score,
      id,
      submittedAt: new Date()
    };
    this.scores.set(id, newScore);

    // Update game's high score if necessary
    const game = await this.getGame(score.gameId);
    if (game && score.score > (game.currentHighScore || 0)) {
      await this.updateGameHighScore(game.id, score.score, score.playerName);
    }

    return newScore;
  }
}

export const storage = new MemStorage();