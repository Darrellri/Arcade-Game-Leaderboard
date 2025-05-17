import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "../shared/schema";

neonConfig.webSocketConstructor = ws;

const runDatabaseSetup = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log("Creating schema in database...");
  
  try {
    // Create games table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        subtitle TEXT,
        image_url TEXT DEFAULT '',
        type TEXT NOT NULL,
        current_high_score INTEGER DEFAULT 0,
        top_scorer_name TEXT,
        top_score_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log("Games table created");

    // Create scores table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS scores (
        id SERIAL PRIMARY KEY,
        game_id INTEGER NOT NULL,
        player_name TEXT NOT NULL,
        score INTEGER NOT NULL,
        phone_number TEXT NOT NULL,
        image_url TEXT DEFAULT '',
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log("Scores table created");

    // Create venue_settings table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS venue_settings (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        logo_url TEXT,
        address TEXT,
        phone TEXT,
        hours TEXT,
        theme JSONB NOT NULL,
        theme_presets JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log("Venue settings table created");
    
    // Create default venue settings if none exist
    const result = await db.execute(sql`SELECT COUNT(*) FROM venue_settings`);
    const count = parseInt(result.rows[0].count);
    
    if (count === 0) {
      console.log("Creating default venue settings");
      await db.execute(sql`
        INSERT INTO venue_settings (name, theme)
        VALUES (
          'Winona Axe and Arcade',
          '{"primary":"hsl(280, 100%, 50%)","variant":"vibrant","appearance":"dark","radius":0.75}'::jsonb
        )
      `);
    }
    
    console.log("Schema creation completed!");
  } catch (error) {
    console.error("Error creating schema:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }

  process.exit(0);
};

runDatabaseSetup().catch((err) => {
  console.error("Database setup failed:", err);
  process.exit(1);
});