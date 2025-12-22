import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const SAMPLE_SONGS = [
  {
    title: "Jingle Bells",
    artist: "Traditional",
    duration: 120,
    fileUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Jingle_Bells_Bing_Crosby_1943.ogg",
    isPremium: false,
    isActive: true,
  },
  {
    title: "Silent Night",
    artist: "Traditional",
    duration: 180,
    fileUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4c/Silent_Night_%28song%29.ogg",
    isPremium: false,
    isActive: true,
  },
  {
    title: "We Wish You a Merry Christmas",
    artist: "Traditional",
    duration: 90,
    fileUrl: "https://upload.wikimedia.org/wikipedia/commons/2/28/We_Wish_You_a_Merry_Christmas.ogg",
    isPremium: false,
    isActive: true,
  },
  {
    title: "O Holy Night",
    artist: "Traditional",
    duration: 240,
    fileUrl: "https://upload.wikimedia.org/wikipedia/commons/8/8e/O_Holy_Night_%28song%29.ogg",
    isPremium: false,
    isActive: true,
  },
  {
    title: "Deck the Halls",
    artist: "Traditional",
    duration: 100,
    fileUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9a/Deck_the_Halls.ogg",
    isPremium: false,
    isActive: true,
  },
];

async function seedSongs() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log("Seeding songs...");
  
  for (const song of SAMPLE_SONGS) {
    try {
      await connection.execute(
        `INSERT INTO songs (title, artist, duration, fileUrl, isPremium, isActive, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE title = title`,
        [song.title, song.artist, song.duration, song.fileUrl, song.isPremium, song.isActive]
      );
      console.log(`Added: ${song.title}`);
    } catch (error) {
      console.error(`Error adding ${song.title}:`, error.message);
    }
  }
  
  console.log("Seeding complete!");
  await connection.end();
}

seedSongs().catch(console.error);
