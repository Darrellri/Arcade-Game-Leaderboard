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
  displayOrder: integer("display_order").default(0),
  hidden: boolean("hidden").default(false),
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
  subtitleBold: text("subtitle_bold").default("true"),
  subtitleAllCaps: text("subtitle_all_caps").default("true"),
  subtitleWhite: text("subtitle_white").default("false"),
  gameSubtitleWhite: text("game_subtitle_white").default("false"),
  gameSubtitleBold: text("game_subtitle_bold").default("false"),
  gameSubtitleItalic: text("game_subtitle_italic").default("false"),
  titleboxSpacing: text("titlebox_spacing").default("20"),
  gameSpacing: text("game_spacing").default("24"),
  address: text("address"),
  cityState: text("city_state"),
  phone: text("phone"),
  webAddress: text("web_address"),
  weeklyHours: json("weekly_hours"),
  hours: text("hours"),
  theme: json("theme").notNull(),
  themePresets: json("theme_presets"),
  backgroundOverride: boolean("background_override").default(false),
  customBackgroundColor: text("custom_background_color").default("#000000"),
  
  // Display View Settings
  dualViewSpeed: integer("dual_view_speed").default(8),
  dualViewAnimations: boolean("dual_view_animations").default(true),
  dualViewHideHeader: boolean("dual_view_hide_header").default(false),
  dualViewSize: text("dual_view_size").default("extra-large"),
  
  singleViewSpeed: integer("single_view_speed").default(6),
  singleViewAnimations: boolean("single_view_animations").default(true),
  singleViewHideHeader: boolean("single_view_hide_header").default(false),
  singleViewSize: text("single_view_size").default("extra-large"),
  
  scrollViewSpeed: integer("scroll_view_speed").default(50),
  scrollViewSpacing: integer("scroll_view_spacing").default(200),
  scrollViewAnimations: boolean("scroll_view_animations").default(true),
  scrollViewStickyHeader: boolean("scroll_view_sticky_header").default(true),
  scrollViewLazyLoad: boolean("scroll_view_lazy_load").default(false),
  scrollViewSize: text("scroll_view_size").default("extra-large"),
  
  listViewScrollDirection: text("list_view_scroll_direction").default("up"),
  listViewSpeed: integer("list_view_speed").default(50),
  listViewSpacing: integer("list_view_spacing").default(20),
  listViewAnimations: boolean("list_view_animations").default(true),
  listViewHideHeader: boolean("list_view_hide_header").default(false),
  listViewStickyHeader: boolean("list_view_sticky_header").default(true),
  listViewScrolling: boolean("list_view_scrolling").default(false),
  listViewSize: text("list_view_size").default("large"),
  
  gridViewScrollDirection: text("grid_view_scroll_direction").default("up"),
  gridViewSpeed: integer("grid_view_speed").default(75),
  gridViewColumns: integer("grid_view_columns").default(3),
  gridViewSpacing: integer("grid_view_spacing").default(25),
  gridViewAnimations: boolean("grid_view_animations").default(true),
  gridViewHideHeader: boolean("grid_view_hide_header").default(false),
  gridViewStickyHeader: boolean("grid_view_sticky_header").default(true),
  gridViewScrolling: boolean("grid_view_scrolling").default(false),
  gridViewSize: text("grid_view_size").default("normal"),
  
  // Animation System Settings
  animationCategories: json("animation_categories"),
  animationTiming: text("animation_timing").default("0.8"),
  animationDelay: text("animation_delay").default("0.3"),
  
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Venue settings schema for admin interface
export const venueSettingsSchema = z.object({
  name: z.string().min(1, "Venue name is required"),
  leaderboardName: z.string().min(1, "Leaderboard name is required"),
  logoUrl: z.string().optional(),
  animatedLogoUrl: z.string().optional(),
  logoBackgroundColor: z.string().optional(),
  hideLogoBorderShadow: z.string().optional(),
  subtitleBold: z.string().optional(),
  subtitleAllCaps: z.string().optional(),
  subtitleWhite: z.string().optional(),
  gameSubtitleWhite: z.string().optional(),
  gameSubtitleBold: z.string().optional(),
  gameSubtitleItalic: z.string().optional(),
  titleboxSpacing: z.string().optional(),
  gameSpacing: z.string().optional(),
  address: z.string().optional(),
  cityState: z.string().optional(),
  phone: z.string().optional(),
  webAddress: z.string().optional(),
  weeklyHours: z.object({
    monday: z.object({ open: z.string(), close: z.string() }).optional(),
    tuesday: z.object({ open: z.string(), close: z.string() }).optional(),
    wednesday: z.object({ open: z.string(), close: z.string() }).optional(),
    thursday: z.object({ open: z.string(), close: z.string() }).optional(),
    friday: z.object({ open: z.string(), close: z.string() }).optional(),
    saturday: z.object({ open: z.string(), close: z.string() }).optional(),
    sunday: z.object({ open: z.string(), close: z.string() }).optional(),
  }).optional(),
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
  backgroundOverride: z.boolean().optional(),
  customBackgroundColor: z.string().optional(),
  
  // Display View Settings
  dualViewSpeed: z.number().optional(),
  dualViewAnimations: z.boolean().optional(),
  dualViewHideHeader: z.boolean().optional(),
  dualViewSize: z.string().optional(),
  
  singleViewSpeed: z.number().optional(),
  singleViewAnimations: z.boolean().optional(),
  singleViewHideHeader: z.boolean().optional(),
  singleViewSize: z.string().optional(),
  
  scrollViewSpeed: z.number().optional(),
  scrollViewSpacing: z.number().optional(),
  scrollViewAnimations: z.boolean().optional(),
  scrollViewStickyHeader: z.boolean().optional(),
  scrollViewLazyLoad: z.boolean().optional(),
  scrollViewSize: z.string().optional(),
  
  listViewScrollDirection: z.string().optional(),
  listViewSpeed: z.number().optional(),
  listViewSpacing: z.number().optional(),
  listViewAnimations: z.boolean().optional(),
  listViewHideHeader: z.boolean().optional(),
  listViewStickyHeader: z.boolean().optional(),
  listViewScrolling: z.boolean().optional(),
  listViewSize: z.string().optional(),
  
  gridViewScrollDirection: z.string().optional(),
  gridViewSpeed: z.number().optional(),
  gridViewColumns: z.number().optional(),
  gridViewSpacing: z.number().optional(),
  gridViewAnimations: z.boolean().optional(),
  gridViewHideHeader: z.boolean().optional(),
  gridViewStickyHeader: z.boolean().optional(),
  gridViewScrolling: z.boolean().optional(),
  gridViewSize: z.string().optional(),
  
  // Animation System Settings
  animationCategories: z.object({
    fade: z.boolean().optional(),
    slide: z.boolean().optional(),
    zoom: z.boolean().optional(),
    bounce: z.boolean().optional(),
    rotation: z.boolean().optional(),
    elastic: z.boolean().optional(),
    fun: z.boolean().optional(),
    dramatic: z.boolean().optional(),
  }).optional(),
  animationTiming: z.string().optional(),
  animationDelay: z.string().optional(),
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