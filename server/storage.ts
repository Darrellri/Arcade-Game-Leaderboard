import { Game, InsertGame, Score, InsertScore, VenueSettings } from "@shared/schema";

export interface IStorage {
  // Game operations
  getAllGames(): Promise<Game[]>;
  getGame(id: number): Promise<Game | undefined>;
  addGame(game: InsertGame): Promise<Game>;
  updateGameHighScore(id: number, score: number, playerName: string): Promise<Game>;
  updateGame(id: number, game: Partial<Game>): Promise<Game>;

  // Score operations
  getScoresByGame(gameId: number): Promise<Score[]>;
  addScore(score: InsertScore): Promise<Score>;

  // Venue settings operations
  getVenueSettings(): Promise<VenueSettings>;
  updateVenueSettings(settings: Partial<VenueSettings>): Promise<VenueSettings>;
}

export class MemStorage implements IStorage {
  private games: Map<number, Game>;
  private scores: Map<number, Score>;
  private gameCurrentId: number;
  private scoreCurrentId: number;
  private venueSettings: VenueSettings;

  constructor() {
    this.games = new Map();
    this.scores = new Map();
    this.gameCurrentId = 1;
    this.scoreCurrentId = 1;

    // Initialize venue settings
    this.venueSettings = {
      name: "Winona Axe and Arcade",
      theme: {
        primary: "hsl(280, 100%, 50%)",
        variant: "vibrant",
        appearance: "dark",
        radius: 0.75
      },
      themePresets: [
        { name: "Purple Glow", primary: "hsl(280, 100%, 50%)", variant: "vibrant", appearance: "dark", radius: 0.75 },
        { name: "Ocean Blue", primary: "hsl(210, 100%, 50%)", variant: "vibrant", appearance: "dark", radius: 0.75 },
        { name: "Forest Green", primary: "hsl(150, 100%, 40%)", variant: "vibrant", appearance: "dark", radius: 0.75 },
        { name: "Sunset Orange", primary: "hsl(20, 100%, 50%)", variant: "vibrant", appearance: "dark", radius: 0.75 },
        { name: "Berry Red", primary: "hsl(350, 100%, 50%)", variant: "vibrant", appearance: "dark", radius: 0.75 },
        { name: "Professional Blue", primary: "hsl(220, 70%, 50%)", variant: "professional", appearance: "dark", radius: 0.75 },
        { name: "Professional Green", primary: "hsl(160, 70%, 40%)", variant: "professional", appearance: "dark", radius: 0.75 },
        { name: "Professional Purple", primary: "hsl(270, 70%, 50%)", variant: "professional", appearance: "dark", radius: 0.75 },
        { name: "Soft Teal", primary: "hsl(180, 70%, 50%)", variant: "tint", appearance: "light", radius: 0.75 },
        { name: "Soft Rose", primary: "hsl(330, 70%, 50%)", variant: "tint", appearance: "light", radius: 0.75 }
      ]
    };

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

    // Initialize with sample high scores from the last 4 weeks
    const sampleScores = [
      // X-Men Pinball scores (typically range from 1M to 10M)
      { gameId: 1, playerName: "Mike S.", score: 8750000, phoneNumber: "+15551234567", imageUrl: "https://example.com/scores/1.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-03-15") },
      { gameId: 1, playerName: "Sarah L.", score: 7250000, phoneNumber: "+15559876543", imageUrl: "https://example.com/scores/2.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-03-10") },
      { gameId: 1, playerName: "John D.", score: 6500000, phoneNumber: "+15552345678", imageUrl: "https://example.com/scores/3.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-03-05") },
      { gameId: 1, playerName: "Amy R.", score: 5980000, phoneNumber: "+15553456789", imageUrl: "https://example.com/scores/4.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-02-28") },
      { gameId: 1, playerName: "David M.", score: 5750000, phoneNumber: "+15554567890", imageUrl: "https://example.com/scores/5.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-02-25") },
      { gameId: 1, playerName: "Linda K.", score: 5250000, phoneNumber: "+15555678901", imageUrl: "https://example.com/scores/6.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-02-20") },

      // Godzilla Pinball scores (typically range from 500K to 5M)
      { gameId: 2, playerName: "Alex R.", score: 4250000, phoneNumber: "+15553456789", imageUrl: "https://example.com/scores/7.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-03-17") },
      { gameId: 2, playerName: "Emma T.", score: 3750000, phoneNumber: "+15554567890", imageUrl: "https://example.com/scores/8.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-03-12") },
      { gameId: 2, playerName: "Peter W.", score: 3250000, phoneNumber: "+15555678901", imageUrl: "https://example.com/scores/9.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-03-08") },
      { gameId: 2, playerName: "Sophie B.", score: 2980000, phoneNumber: "+15556789012", imageUrl: "https://example.com/scores/10.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-03-03") },
      { gameId: 2, playerName: "Mark L.", score: 2750000, phoneNumber: "+15557890123", imageUrl: "https://example.com/scores/11.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-02-27") },
      { gameId: 2, playerName: "Rachel H.", score: 2500000, phoneNumber: "+15558901234", imageUrl: "https://example.com/scores/12.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-02-22") },
      { gameId: 2, playerName: "Kevin P.", score: 2250000, phoneNumber: "+15559012345", imageUrl: "https://example.com/scores/13.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-02-18") },

      // Star Wars Trilogy (typically range from 100K to 1M)
      { gameId: 3, playerName: "Chris M.", score: 950000, phoneNumber: "+15555678901", imageUrl: "https://example.com/scores/14.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-03-16") },
      { gameId: 3, playerName: "Lisa P.", score: 875000, phoneNumber: "+15556789012", imageUrl: "https://example.com/scores/15.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-03-08") },
      { gameId: 3, playerName: "Brian S.", score: 820000, phoneNumber: "+15557890123", imageUrl: "https://example.com/scores/16.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-03-01") },
      { gameId: 3, playerName: "Jessica F.", score: 780000, phoneNumber: "+15558901234", imageUrl: "https://example.com/scores/17.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-02-24") },
      { gameId: 3, playerName: "Tom H.", score: 725000, phoneNumber: "+15559012345", imageUrl: "https://example.com/scores/18.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-02-19") },
      { gameId: 3, playerName: "Nicole W.", score: 690000, phoneNumber: "+15550123456", imageUrl: "https://example.com/scores/19.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-02-15") },

      // Asteroids (typically range from 50K to 250K)
      { gameId: 4, playerName: "Dave K.", score: 225000, phoneNumber: "+15557890123", imageUrl: "https://example.com/scores/20.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-03-14") },
      { gameId: 4, playerName: "Paul W.", score: 195000, phoneNumber: "+15558901234", imageUrl: "https://example.com/scores/21.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-03-07") },
      { gameId: 4, playerName: "Anna J.", score: 180000, phoneNumber: "+15559012345", imageUrl: "https://example.com/scores/22.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-02-29") },
      { gameId: 4, playerName: "George R.", score: 165000, phoneNumber: "+15550123456", imageUrl: "https://example.com/scores/23.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-02-22") },
      { gameId: 4, playerName: "Michelle L.", score: 155000, phoneNumber: "+15551234567", imageUrl: "https://example.com/scores/24.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-02-15") },

      // Marble Madness (typically range from 10K to 100K)
      { gameId: 5, playerName: "Nina H.", score: 85000, phoneNumber: "+15559012345", imageUrl: "https://example.com/scores/25.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-03-13") },
      { gameId: 5, playerName: "Tom B.", score: 72000, phoneNumber: "+15550123456", imageUrl: "https://example.com/scores/26.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-03-06") },
      { gameId: 5, playerName: "Laura C.", score: 68000, phoneNumber: "+15551234567", imageUrl: "https://example.com/scores/27.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-02-28") },
      { gameId: 5, playerName: "Steve M.", score: 65000, phoneNumber: "+15552345678", imageUrl: "https://example.com/scores/28.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-02-21") },
      { gameId: 5, playerName: "Karen D.", score: 61000, phoneNumber: "+15553456789", imageUrl: "https://example.com/scores/29.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-02-14") },

      // Big Buck Hunter (typically range from 5K to 50K)
      { gameId: 6, playerName: "Ryan M.", score: 45000, phoneNumber: "+15551234567", imageUrl: "https://example.com/scores/30.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-03-18") },
      { gameId: 6, playerName: "Kelly S.", score: 38000, phoneNumber: "+15552345678", imageUrl: "https://example.com/scores/31.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-03-09") },
      { gameId: 6, playerName: "Eric P.", score: 35000, phoneNumber: "+15553456789", imageUrl: "https://example.com/scores/32.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-03-02") },
      { gameId: 6, playerName: "Megan B.", score: 32000, phoneNumber: "+15554567890", imageUrl: "https://example.com/scores/33.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-02-24") },
      { gameId: 6, playerName: "Jason T.", score: 30000, phoneNumber: "+15555678901", imageUrl: "https://example.com/scores/34.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-02-17") },
      { gameId: 6, playerName: "Amanda R.", score: 28000, phoneNumber: "+15556789012", imageUrl: "https://example.com/scores/35.jpg", latitude: 45.5231, longitude: -122.6765, submittedAt: new Date("2024-02-10") }
    ];

    sampleScores.forEach(score => this.addScore(score));
  }

  async getAllGames(): Promise<Game[]> {
    const gamesWithTopScores = await Promise.all(
      Array.from(this.games.values()).map(async (game) => {
        const scores = Array.from(this.scores.values()).filter(score => score.gameId === game.id);
        const topScore = scores.reduce((max, score) =>
          score.score > max.score ? score : max,
          { score: 0, playerName: null, submittedAt: null }
        );

        return {
          ...game,
          currentHighScore: topScore.score,
          topScorerName: topScore.playerName,
          topScoreDate: topScore.submittedAt
        };
      })
    );
    return gamesWithTopScores;
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
      topScorerName: null,
      topScoreDate: null
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

  async updateGame(id: number, gameUpdate: Partial<Game>): Promise<Game> {
    const game = await this.getGame(id);
    if (!game) throw new Error("Game not found");

    const updatedGame: Game = {
      ...game,
      ...gameUpdate,
    };
    this.games.set(id, updatedGame);
    return updatedGame;
  }

  async getVenueSettings(): Promise<VenueSettings> {
    return this.venueSettings;
  }

  async updateVenueSettings(settings: Partial<VenueSettings>): Promise<VenueSettings> {
    this.venueSettings = {
      ...this.venueSettings,
      ...settings,
    };
    return this.venueSettings;
  }
}

export const storage = new MemStorage();