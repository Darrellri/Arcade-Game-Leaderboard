import { Game, InsertGame, Score, InsertScore } from "@shared/schema";

export interface IStorage {
  // Game operations
  getAllGames(): Promise<Game[]>;
  getGame(id: number): Promise<Game | undefined>;
  addGame(game: InsertGame): Promise<Game>;
  updateGameHighScore(id: number, score: number): Promise<Game>;
  
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

    // Initialize with some sample games
    const sampleGames: InsertGame[] = [
      {
        name: "X-Men Pinball",
        imageUrl: "https://images.unsplash.com/photo-1626274890657-e28d5b65b04b",
        type: "pinball"
      },
      {
        name: "Godzilla Pinball",
        imageUrl: "https://images.unsplash.com/photo-1558979158-3f28368739e6",
        type: "pinball"
      },
      {
        name: "Street Fighter II",
        imageUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420",
        type: "arcade"
      },
      {
        name: "Pac-Man",
        imageUrl: "https://images.unsplash.com/photo-1573349836982-d14092e1665e",
        type: "arcade"
      }
    ];

    sampleGames.forEach(game => this.addGame(game));
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
      currentHighScore: 0
    };
    this.games.set(id, newGame);
    return newGame;
  }

  async updateGameHighScore(id: number, score: number): Promise<Game> {
    const game = await this.getGame(id);
    if (!game) throw new Error("Game not found");
    
    const updatedGame: Game = {
      ...game,
      currentHighScore: score
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
    if (game && score.score > game.currentHighScore) {
      await this.updateGameHighScore(game.id, score.score);
    }

    return newScore;
  }
}

export const storage = new MemStorage();
