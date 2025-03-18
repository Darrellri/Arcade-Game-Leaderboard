import { pgTable, text, serial, integer, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  type: text("type").notNull(), // 'arcade' or 'pinball'
  currentHighScore: integer("current_high_score").default(0),
  topScorerName: text("top_scorer_name"),
  topScoreDate: timestamp("top_score_date"),
});

export const scores = pgTable("scores", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  playerName: text("player_name").notNull(),
  score: integer("score").notNull(),
  phoneNumber: text("phone_number").notNull(),
  imageUrl: text("image_url").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const insertGameSchema = createInsertSchema(games).omit({ 
  id: true,
  currentHighScore: true,
  topScorerName: true,
  topScoreDate: true
});

export const insertScoreSchema = createInsertSchema(scores).omit({ 
  id: true,
  submittedAt: true 
}).extend({
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Score = typeof scores.$inferSelect;
export type InsertScore = z.infer<typeof insertScoreSchema>;