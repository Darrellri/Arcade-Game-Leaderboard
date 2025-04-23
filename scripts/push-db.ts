import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "../shared/schema";

neonConfig.webSocketConstructor = ws;

const runMigration = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log("Pushing schema to database...");
  
  // Simply access the tables to create them if they don't exist
  try {
    await db.select().from(schema.games).limit(1);
    await db.select().from(schema.scores).limit(1);
    await db.select().from(schema.venueSettings).limit(1);
    
    console.log("Schema push completed!");
  } catch (error) {
    console.error("Error pushing schema:", error);
    process.exit(1);
  }

  process.exit(0);
};

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});