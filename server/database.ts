import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";

// Initialise SQLite database file (default: db.sqlite in project root)
const sqliteFile = process.env.SQLITE_DB_PATH || "./db.sqlite";

// better-sqlite3 will create the file if it doesn't exist
const sqlite = new Database(sqliteFile);

export const db = drizzle(sqlite, { schema }); 