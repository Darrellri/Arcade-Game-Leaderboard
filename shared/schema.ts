import { pgTable, text, serial, integer, timestamp, real, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subtitle: text("subtitle"),
  imageUrl: text("image_url").default(''),
  overlayImageUrl: text("overlay_image_url").default(''),
  type: text("type").notNull(), // 'arcade' or 'pinball'
  currentHighScore: integer("current_high_score").default(0),
  topScorerName: text("top_scorer_name"),
  topScoreDate: timestamp("top_score_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scores = pgTable("scores", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  playerName: text("player_name").notNull(),
  score: integer("score").notNull(),
  phoneNumber: text("phone_number").notNull(),
  imageUrl: text("image_url").default(''),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

// Define the relations
export const gamesRelations = relations(games, ({ many }) => ({
  scores: many(scores),
}));

export const scoresRelations = relations(scores, ({ one }) => ({
  game: one(games, {
    fields: [scores.gameId],
    references: [games.id],
  }),
}));

// Venue settings table for persistent storage
export const venueSettings = pgTable("venue_settings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  leaderboardName: text("leaderboard_name").default("THE LEADERBOARD"),
  logoUrl: text("logo_url"),
  animatedLogoUrl: text("animated_logo_url"),
  logoBackgroundColor: text("logo_background_color").default("transparent"),
  hideLogoBorderShadow: text("hide_logo_border_shadow").default("false"),
  address: text("address"),
  phone: text("phone"),
  hours: text("hours"),
  theme: json("theme").notNull(),
  themePresets: json("theme_presets"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Venue settings schema for admin interface
export const venueSettingsSchema = z.object({
  name: z.string().min(1, "Venue name is required"),
  leaderboardName: z.string().min(1, "Leaderboard name is required"),
  logoUrl: z.string().optional(),
  animatedLogoUrl: z.string().optional(),
  logoBackgroundColor: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  hours: z.string().optional(),
  theme: z.object({
    primary: z.string(),
    variant: z.enum(["professional", "tint", "vibrant"]),
    appearance: z.enum(["light", "dark", "system"]),
    radius: z.number(),
  }),
  themePresets: z.array(z.object({
    name: z.string(),
    primary: z.string(),
    variant: z.enum(["professional", "tint", "vibrant"]),
    appearance: z.enum(["light", "dark", "system"]),
    radius: z.number(),
  })).optional(),
});

export const insertGameSchema = createInsertSchema(games).omit({ 
  id: true,
  currentHighScore: true,
  topScorerName: true,
  topScoreDate: true,
  createdAt: true
});

export const insertScoreSchema = createInsertSchema(scores).omit({ 
  id: true,
  submittedAt: true
}).extend({
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  submittedAt: z.date().optional(),
});

export const insertVenueSettingsSchema = createInsertSchema(venueSettings).omit({
  id: true,
  updatedAt: true
});

export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Score = typeof scores.$inferSelect;
export type InsertScore = z.infer<typeof insertScoreSchema>;
export type VenueSetting = typeof venueSettings.$inferSelect;
export type InsertVenueSetting = z.infer<typeof insertVenueSettingsSchema>;
export type VenueSettings = z.infer<typeof venueSettingsSchema>;