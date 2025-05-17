import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as fs from 'fs';
import * as path from 'path';

neonConfig.webSocketConstructor = ws;

const seedDemoData = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log("Seeding demo data...");
  
  try {
    // Add demo games
    const demoGames = [
      {
        name: "Godzilla",
        subtitle: "Pinball Pro Monsters Edition",
        type: "pinball",
        current_high_score: 85000000,
        top_scorer_name: "MaxPinball",
        top_score_date: "2025-01-15T18:45:00Z",
        image_url: "/uploads/godzilla_marquee.jpg"
      },
      {
        name: "X-Men",
        subtitle: "Magneto's Revenge",
        type: "pinball",
        current_high_score: 45000000,
        top_scorer_name: "PinWizard",
        top_score_date: "2025-02-10T19:30:00Z",
        image_url: "/uploads/xmen_marquee.jpg"
      },
      {
        name: "Star Wars",
        subtitle: "Battle of Endor",
        type: "arcade",
        current_high_score: 2500000,
        top_scorer_name: "RebelAce",
        top_score_date: "2025-03-05T16:15:00Z",
        image_url: "/uploads/starwars_marquee.jpg"
      },
      {
        name: "Pac-Man",
        subtitle: "Championship Edition",
        type: "arcade",
        current_high_score: 950000,
        top_scorer_name: "GhostHunter",
        top_score_date: "2025-01-25T14:20:00Z",
        image_url: "/uploads/pacman_marquee.jpg"
      },
      {
        name: "Jurassic Park",
        subtitle: "The Lost World",
        type: "pinball",
        current_high_score: 65000000,
        top_scorer_name: "DinoTamer",
        top_score_date: "2025-02-18T17:10:00Z",
        image_url: "/uploads/jurassic_marquee.jpg"
      }
    ];

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Copy demo marquee images from attached_assets to public/uploads
    const sourceImagePath = path.join(process.cwd(), '..', 'attached_assets', 'godzilla_marquee2.jpg');
    const uploadedImagePaths = [
      path.join(uploadsDir, 'godzilla_marquee.jpg'),
      path.join(uploadsDir, 'xmen_marquee.jpg'),
      path.join(uploadsDir, 'starwars_marquee.jpg'),
      path.join(uploadsDir, 'pacman_marquee.jpg'),
      path.join(uploadsDir, 'jurassic_marquee.jpg')
    ];
    
    // Copy the same image for all games (they'll be replaced later with proper images)
    if (fs.existsSync(sourceImagePath)) {
      uploadedImagePaths.forEach(destPath => {
        fs.copyFileSync(sourceImagePath, destPath);
      });
      console.log("Demo marquee images copied to uploads directory");
    } else {
      console.warn("Demo image not found at:", sourceImagePath);
    }

    // Insert games with a single statement
    const insertGamesResult = await db.execute(sql`
      INSERT INTO games 
        (name, subtitle, image_url, type, current_high_score, top_scorer_name, top_score_date)
      VALUES 
        ${sql.join(demoGames.map(game => sql`(
          ${game.name}, 
          ${game.subtitle}, 
          ${game.image_url}, 
          ${game.type}, 
          ${game.current_high_score}, 
          ${game.top_scorer_name}, 
          ${game.top_score_date}::timestamp
        )`), sql`,`)}
      RETURNING id
    `);
    
    console.log("Demo games added:", insertGamesResult.rows);

    // Add demo scores for each game
    const gameIds = insertGamesResult.rows.map((row: any) => row.id);
    
    // Generate scores for each game
    const demoScores = [];
    
    // Weekday date-times (Wednesday-Friday 4pm-10pm)
    const weekdayTimes = [
      "16:30:00", // 4:30 PM
      "17:45:00", // 5:45 PM
      "19:20:00", // 7:20 PM
      "21:15:00", // 9:15 PM
    ];
    
    // Weekend date-times (Saturday 11am-10pm, Sunday noon-6pm)
    const saturdayTimes = [
      "11:45:00", // 11:45 AM
      "14:20:00", // 2:20 PM
      "16:15:00", // 4:15 PM
      "19:30:00", // 7:30 PM
    ];
    
    const sundayTimes = [
      "12:30:00", // 12:30 PM
      "14:45:00", // 2:45 PM
      "17:30:00", // 5:30 PM
    ];
    
    // Dates from Jan to Mar 2025 (Wednesdays, Fridays, Saturdays and Sundays)
    const dates = [
      // January 2025 (Wed, Fri, Sat, Sun)
      "2025-01-03", // Friday
      "2025-01-04", // Saturday
      "2025-01-05", // Sunday
      "2025-01-08", // Wednesday
      "2025-01-10", // Friday
      "2025-01-11", // Saturday
      "2025-01-12", // Sunday
      "2025-01-17", // Friday
      "2025-01-18", // Saturday
      "2025-01-19", // Sunday
      "2025-01-22", // Wednesday
      "2025-01-24", // Friday
      "2025-01-25", // Saturday
      "2025-01-26", // Sunday
      // February 2025
      "2025-02-01", // Saturday
      "2025-02-02", // Sunday
      "2025-02-05", // Wednesday
      "2025-02-07", // Friday
      "2025-02-08", // Saturday
      "2025-02-09", // Sunday
      "2025-02-12", // Wednesday
      "2025-02-14", // Friday
      "2025-02-15", // Saturday
      "2025-02-16", // Sunday
      "2025-02-19", // Wednesday
      "2025-02-21", // Friday
      "2025-02-22", // Saturday
      "2025-02-23", // Sunday
      // March 2025
      "2025-03-01", // Saturday
      "2025-03-02", // Sunday
      "2025-03-05", // Wednesday
      "2025-03-07", // Friday
      "2025-03-08", // Saturday
      "2025-03-09", // Sunday
      "2025-03-12", // Wednesday
      "2025-03-14", // Friday
      "2025-03-15", // Saturday
      "2025-03-16", // Sunday
      "2025-03-19", // Wednesday
      "2025-03-21", // Friday
      "2025-03-22", // Saturday
      "2025-03-23", // Sunday
    ];
    
    // Names for players
    const playerNames = [
      "MaxPinball", "PinWizard", "RebelAce", "GhostHunter", "DinoTamer",
      "ArcadeKing", "FlipperQueen", "HighScorer", "GameMaster", "TokenChamp",
      "PinballPro", "JoystickJedi", "QuarterSlinger", "ComboBreaker", "TiltMaster"
    ];
    
    // Phone numbers
    const phoneNumbers = [
      "555-123-4567", "555-234-5678", "555-345-6789", "555-456-7890", "555-567-8901",
      "555-678-9012", "555-789-0123", "555-890-1234", "555-901-2345", "555-012-3456"
    ];
    
    // Location coordinates (around Winona, MN)
    const locations = [
      { lat: 44.0521, lng: -91.6380 }, // Winona center
      { lat: 44.0508, lng: -91.6346 },
      { lat: 44.0535, lng: -91.6405 },
      { lat: 44.0492, lng: -91.6372 },
      { lat: 44.0550, lng: -91.6390 }
    ];
    
    // Generate scores for each game
    gameIds.forEach((gameId: number, gameIndex: number) => {
      // Score ranges by game type and index
      let minScore = 0;
      let maxScore = 0;
      
      // Set score range based on the game index
      switch (gameIndex) {
        case 0: // Godzilla pinball
          minScore = 10_000_000;
          maxScore = 100_000_000;
          break;
        case 1: // X-Men pinball
          minScore = 5_000_000;
          maxScore = 50_000_000;
          break;
        case 2: // Star Wars arcade
          minScore = 500_000;
          maxScore = 3_000_000;
          break;
        case 3: // Pac-Man arcade
          minScore = 200_000;
          maxScore = 1_000_000;
          break;
        case 4: // Jurassic Park pinball
          minScore = 8_000_000;
          maxScore = 70_000_000;
          break;
        default:
          minScore = 100_000;
          maxScore = 1_000_000;
      }
      
      // Generate 8-12 scores for each game
      const scoreCount = 8 + Math.floor(Math.random() * 5);
      
      for (let i = 0; i < scoreCount; i++) {
        // Choose a random date
        const dateIndex = Math.floor(Math.random() * dates.length);
        const date = dates[dateIndex];
        
        // Choose a time based on the day of the week
        let time;
        const day = new Date(date).getDay();
        
        if (day === 6) { // Saturday
          time = saturdayTimes[Math.floor(Math.random() * saturdayTimes.length)];
        } else if (day === 0) { // Sunday
          time = sundayTimes[Math.floor(Math.random() * sundayTimes.length)];
        } else { // Weekday (Wed-Fri)
          time = weekdayTimes[Math.floor(Math.random() * weekdayTimes.length)];
        }
        
        // Create timestamp
        const timestamp = `${date}T${time}Z`;
        
        // Random player, score, phone, and location
        const playerName = playerNames[Math.floor(Math.random() * playerNames.length)];
        const score = minScore + Math.floor(Math.random() * (maxScore - minScore));
        const phoneNumber = phoneNumbers[Math.floor(Math.random() * phoneNumbers.length)];
        const location = locations[Math.floor(Math.random() * locations.length)];
        
        demoScores.push({
          gameId,
          playerName,
          score,
          phoneNumber,
          submittedAt: timestamp,
          lat: location.lat,
          lng: location.lng,
          imageUrl: "/uploads/score_image.jpg" // Default placeholder
        });
      }
    });
    
    // Insert all scores
    if (demoScores.length > 0) {
      const insertScoresResult = await db.execute(sql`
        INSERT INTO scores 
          (game_id, player_name, score, phone_number, image_url, latitude, longitude, submitted_at)
        VALUES 
          ${sql.join(demoScores.map(score => sql`(
            ${score.gameId}, 
            ${score.playerName}, 
            ${score.score}, 
            ${score.phoneNumber}, 
            ${score.imageUrl}, 
            ${score.lat}, 
            ${score.lng}, 
            ${score.submittedAt}::timestamp
          )`), sql`,`)}
        RETURNING id
      `);
      
      console.log(`Added ${insertScoresResult.rows.length} demo scores`);
    }
    
    // Update venue settings with theme presets
    const themePresets = [
      {
        "name": "Arcade Purple",
        "primary": "hsl(280, 100%, 50%)",
        "variant": "vibrant",
        "appearance": "dark",
        "radius": 0.75
      },
      {
        "name": "Neon Green",
        "primary": "hsl(120, 100%, 50%)",
        "variant": "vibrant", 
        "appearance": "dark",
        "radius": 0.5
      },
      {
        "name": "Retro Red",
        "primary": "hsl(0, 100%, 50%)",
        "variant": "vibrant",
        "appearance": "dark",
        "radius": 0.75
      },
      {
        "name": "Electric Blue",
        "primary": "hsl(210, 100%, 50%)",
        "variant": "vibrant",
        "appearance": "dark",
        "radius": 0.5
      },
      {
        "name": "Cosmic Orange",
        "primary": "hsl(30, 100%, 50%)",
        "variant": "vibrant",
        "appearance": "dark",
        "radius": 0.5
      },
      {
        "name": "Teal Dreams",
        "primary": "hsl(180, 100%, 50%)",
        "variant": "vibrant",
        "appearance": "dark",
        "radius": 0.75
      }
    ];
    
    // Update the default venue settings
    await db.execute(sql`
      UPDATE venue_settings 
      SET 
        logo_url = '/uploads/arcade_logo.svg',
        address = '120 Main Street, Winona, MN 55987',
        phone = '507-555-1234',
        hours = 'Wed-Fri: 4pm-10pm, Sat: 11am-10pm, Sun: 12pm-6pm',
        theme_presets = ${JSON.stringify(themePresets)}::jsonb
      WHERE id = 1
    `);
    
    console.log("Demo data seeding completed!");
  } catch (error) {
    console.error("Error seeding demo data:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }

  process.exit(0);
};

seedDemoData().catch((err) => {
  console.error("Demo data seeding failed:", err);
  process.exit(1);
});