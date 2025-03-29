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

    // Initialize with sample high scores from Jan 1, 2025 to Mar 28, 2025
    // Only using dates and times when Winona Axe and Arcade is open:
    // Wednesday - Friday: 4pm - 10pm
    // Saturday: 11am - 10pm
    // Sunday: noon - 6pm
    const sampleScores = [
      // X-Men Pinball scores (range from 5M to 50M for serious players)
      { gameId: 1, playerName: "Mike S.", score: 42567890, phoneNumber: "+15551234567", imageUrl: "https://example.com/scores/1.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-03-15T19:28:00") }, // Saturday
      { gameId: 1, playerName: "Sarah L.", score: 38912345, phoneNumber: "+15559876543", imageUrl: "https://example.com/scores/2.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-03-07T20:42:00") }, // Friday
      { gameId: 1, playerName: "John D.", score: 32785620, phoneNumber: "+15552345678", imageUrl: "https://example.com/scores/3.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-02-22T13:15:00") }, // Saturday
      { gameId: 1, playerName: "Amy R.", score: 29432175, phoneNumber: "+15553456789", imageUrl: "https://example.com/scores/4.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-02-13T18:07:00") }, // Thursday
      { gameId: 1, playerName: "David M.", score: 25780945, phoneNumber: "+15554567890", imageUrl: "https://example.com/scores/5.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-01-19T14:53:00") }, // Sunday
      { gameId: 1, playerName: "Linda K.", score: 22154830, phoneNumber: "+15555678901", imageUrl: "https://example.com/scores/6.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-01-10T19:46:00") }, // Friday

      // Godzilla Pinball scores (range from 10M to 100M for serious players)
      { gameId: 2, playerName: "Alex R.", score: 87649530, phoneNumber: "+15553456789", imageUrl: "https://example.com/scores/7.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-03-26T18:14:00") }, // Wednesday
      { gameId: 2, playerName: "Emma T.", score: 73925810, phoneNumber: "+15554567890", imageUrl: "https://example.com/scores/8.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-03-21T21:08:00") }, // Friday
      { gameId: 2, playerName: "Peter W.", score: 65317840, phoneNumber: "+15555678901", imageUrl: "https://example.com/scores/9.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-03-16T15:32:00") }, // Sunday
      { gameId: 2, playerName: "Sophie B.", score: 59284610, phoneNumber: "+15556789012", imageUrl: "https://example.com/scores/10.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-03-01T16:45:00") }, // Saturday
      { gameId: 2, playerName: "Mark L.", score: 52761930, phoneNumber: "+15557890123", imageUrl: "https://example.com/scores/11.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-02-23T14:21:00") }, // Sunday
      { gameId: 2, playerName: "Rachel H.", score: 47289350, phoneNumber: "+15558901234", imageUrl: "https://example.com/scores/12.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-02-14T17:38:00") }, // Friday
      { gameId: 2, playerName: "Kevin P.", score: 41895620, phoneNumber: "+15559012345", imageUrl: "https://example.com/scores/13.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-01-25T14:12:00") }, // Saturday

      // Star Wars Trilogy (range from 500K to 3M for skilled players)
      { gameId: 3, playerName: "Chris M.", score: 2879350, phoneNumber: "+15555678901", imageUrl: "https://example.com/scores/14.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-03-27T19:42:00") }, // Thursday
      { gameId: 3, playerName: "Lisa P.", score: 2465780, phoneNumber: "+15556789012", imageUrl: "https://example.com/scores/15.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-03-23T13:18:00") }, // Sunday
      { gameId: 3, playerName: "Brian S.", score: 2124670, phoneNumber: "+15557890123", imageUrl: "https://example.com/scores/16.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-03-13T19:05:00") }, // Thursday
      { gameId: 3, playerName: "Jessica F.", score: 1865290, phoneNumber: "+15558901234", imageUrl: "https://example.com/scores/17.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-03-05T18:51:00") }, // Wednesday
      { gameId: 3, playerName: "Tom H.", score: 1634780, phoneNumber: "+15559012345", imageUrl: "https://example.com/scores/18.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-02-08T17:23:00") }, // Saturday
      { gameId: 3, playerName: "Nicole W.", score: 1475630, phoneNumber: "+15550123456", imageUrl: "https://example.com/scores/19.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-01-15T18:42:00") }, // Wednesday

      // Asteroids (range from 50K to 1M for skilled classic game players)
      { gameId: 4, playerName: "Dave K.", score: 856790, phoneNumber: "+15557890123", imageUrl: "https://example.com/scores/20.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-03-09T13:47:00") }, // Sunday
      { gameId: 4, playerName: "Paul W.", score: 745820, phoneNumber: "+15558901234", imageUrl: "https://example.com/scores/21.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-02-26T19:30:00") }, // Wednesday
      { gameId: 4, playerName: "Anna J.", score: 687450, phoneNumber: "+15559012345", imageUrl: "https://example.com/scores/22.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-02-15T12:18:00") }, // Saturday
      { gameId: 4, playerName: "George R.", score: 623180, phoneNumber: "+15550123456", imageUrl: "https://example.com/scores/23.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-02-02T15:54:00") }, // Sunday
      { gameId: 4, playerName: "Michelle L.", score: 573460, phoneNumber: "+15551234567", imageUrl: "https://example.com/scores/24.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-01-23T19:15:00") }, // Thursday

      // Marble Madness (range from 100K to 1.2M for skilled players)
      { gameId: 5, playerName: "Nina H.", score: 1127850, phoneNumber: "+15559012345", imageUrl: "https://example.com/scores/25.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-03-12T19:21:00") }, // Wednesday
      { gameId: 5, playerName: "Tom B.", score: 986420, phoneNumber: "+15550123456", imageUrl: "https://example.com/scores/26.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-02-28T21:06:00") }, // Friday
      { gameId: 5, playerName: "Laura C.", score: 842370, phoneNumber: "+15551234567", imageUrl: "https://example.com/scores/27.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-02-16T13:42:00") }, // Sunday
      { gameId: 5, playerName: "Steve M.", score: 739580, phoneNumber: "+15552345678", imageUrl: "https://example.com/scores/28.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-01-31T17:57:00") }, // Friday
      { gameId: 5, playerName: "Karen D.", score: 652470, phoneNumber: "+15553456789", imageUrl: "https://example.com/scores/29.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-01-11T13:28:00") }, // Saturday

      // Big Buck Hunter Reloaded (range from 30K to 200K for skilled players)
      { gameId: 6, playerName: "Ryan M.", score: 187640, phoneNumber: "+15551234567", imageUrl: "https://example.com/scores/30.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-03-19T18:38:00") }, // Wednesday
      { gameId: 6, playerName: "Kelly S.", score: 165290, phoneNumber: "+15552345678", imageUrl: "https://example.com/scores/31.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-03-01T19:52:00") }, // Saturday
      { gameId: 6, playerName: "Eric P.", score: 142780, phoneNumber: "+15553456789", imageUrl: "https://example.com/scores/32.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-02-21T16:13:00") }, // Friday
      { gameId: 6, playerName: "Megan B.", score: 128450, phoneNumber: "+15554567890", imageUrl: "https://example.com/scores/33.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-02-02T14:46:00") }, // Sunday
      { gameId: 6, playerName: "Jason T.", score: 112680, phoneNumber: "+15555678901", imageUrl: "https://example.com/scores/34.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-01-24T17:31:00") }, // Friday
      { gameId: 6, playerName: "Amanda R.", score: 98740, phoneNumber: "+15556789012", imageUrl: "https://example.com/scores/35.jpg", latitude: 44.0507, longitude: -91.6393, submittedAt: new Date("2025-01-18T13:15:00") }, // Saturday
    ];

    sampleScores.forEach(score => this.addScore(score));
  }

  async getAllGames(): Promise<Game[]> {
    const gamesWithTopScores = await Promise.all(
      Array.from(this.games.values()).map(async (game) => {
        const scores = Array.from(this.scores.values()).filter(score => score.gameId === game.id);
        
        if (scores.length === 0) {
          return {
            ...game,
            currentHighScore: 0,
            topScorerName: null,
            topScoreDate: null
          };
        }

        // Using a proper type and initial value to avoid TypeScript errors
        const topScore = scores.reduce((max, score) => 
          score.score > max.score ? score : max, scores[0]
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