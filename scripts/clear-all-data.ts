import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as path from 'path';
import * as fs from 'fs';

neonConfig.webSocketConstructor = ws;

const clearAllData = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log("Clearing all data from database...");
  
  try {
    // Clear scores table
    await db.execute(sql`TRUNCATE scores CASCADE`);
    console.log("All scores deleted");
    
    // Clear games table
    await db.execute(sql`TRUNCATE games CASCADE`);
    console.log("All games deleted");
    
    // Reset venue settings but keep the record
    const defaultTheme = {
      "primary": "hsl(280, 100%, 50%)",
      "variant": "vibrant",
      "appearance": "dark",
      "radius": 0.75
    };
    
    await db.execute(sql`
      UPDATE venue_settings 
      SET 
        name = 'Winona Axe and Arcade',
        logo_url = NULL,
        address = NULL,
        phone = NULL,
        hours = NULL,
        theme = ${JSON.stringify(defaultTheme)}::jsonb,
        theme_presets = NULL
      WHERE id = 1
    `);
    console.log("Venue settings reset to defaults");
    
    // Optional: Clear uploaded files
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        fs.unlinkSync(path.join(uploadsDir, file));
      }
      console.log("All uploaded files deleted");
    }
    
    console.log("Data clearing completed!");
  } catch (error) {
    console.error("Error clearing data:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }

  process.exit(0);
};

clearAllData().catch((err) => {
  console.error("Data clearing failed:", err);
  process.exit(1);
});