import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const pilots = pgTable("pilots", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  callsign: text("callsign").notNull(),
  dormitory: text("dormitory").notNull(), // "Knight", "River", "Arbiter"
  rating: integer("rating").notNull().default(50),
  reaction: integer("reaction").notNull().default(50),
  accuracy: integer("accuracy").notNull().default(50),
  tactical: integer("tactical").notNull().default(50),
  teamwork: integer("teamwork").notNull().default(50),
  traits: text("traits").array().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  experience: integer("experience").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  trainingUntil: timestamp("training_until"),
  trainingType: text("training_type"),
  fatigue: integer("fatigue").notNull().default(0),
  morale: integer("morale").notNull().default(50),
});

export const mechs = pgTable("mechs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "Knight", "River", "Arbiter"
  variant: text("variant").notNull(), // "Heavy", "Assault", "Sniper", etc.
  hp: integer("hp").notNull(),
  armor: integer("armor").notNull(),
  speed: integer("speed").notNull(),
  firepower: integer("firepower").notNull(),
  range: integer("range").notNull(),
  specialAbilities: text("special_abilities").array().notNull().default([]),
  isAvailable: boolean("is_available").notNull().default(true),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  currentSeason: integer("current_season").notNull().default(1),
  leagueRank: integer("league_rank").notNull().default(8),
  credits: integer("credits").notNull().default(10000),
  reputation: integer("reputation").notNull().default(0),
});

export const battles = pgTable("battles", {
  id: serial("id").primaryKey(),
  teamAId: integer("team_a_id").references(() => teams.id),
  teamBId: integer("team_b_id").references(() => teams.id),
  winnerId: integer("winner_id").references(() => teams.id),
  battleData: jsonb("battle_data"), // Store complete battle log
  season: integer("season").notNull(),
  week: integer("week").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "in_progress", "completed"
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const formations = pgTable("formations", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id),
  pilot1Id: integer("pilot1_id").references(() => pilots.id),
  pilot2Id: integer("pilot2_id").references(() => pilots.id),
  pilot3Id: integer("pilot3_id").references(() => pilots.id),
  mech1Id: integer("mech1_id").references(() => mechs.id),
  mech2Id: integer("mech2_id").references(() => mechs.id),
  mech3Id: integer("mech3_id").references(() => mechs.id),
  formation: text("formation").notNull().default("standard"), // "standard", "aggressive", "defensive"
  isActive: boolean("is_active").notNull().default(false),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPilotSchema = createInsertSchema(pilots).omit({
  id: true,
  wins: true,
  losses: true,
  experience: true,
});

export const insertMechSchema = createInsertSchema(mechs).omit({
  id: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  wins: true,
  losses: true,
});

export const insertBattleSchema = createInsertSchema(battles).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertFormationSchema = createInsertSchema(formations).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Pilot = typeof pilots.$inferSelect;
export type InsertPilot = z.infer<typeof insertPilotSchema>;

export type Mech = typeof mechs.$inferSelect;
export type InsertMech = z.infer<typeof insertMechSchema>;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type Battle = typeof battles.$inferSelect;
export type InsertBattle = z.infer<typeof insertBattleSchema>;

export type Formation = typeof formations.$inferSelect;
export type InsertFormation = z.infer<typeof insertFormationSchema>;

// Game state types
export type GameScene = "hub" | "scouting" | "formation" | "recon" | "banpick" | "battle" | "analysis" | "match_prep";

export type PilotTrait = 
  | "AGGRESSIVE" | "CAUTIOUS" | "ANALYTICAL" | "COOPERATIVE" | "INDEPENDENT"
  | "ASSAULT" | "DEFENSIVE" | "SUPPORT" | "SNIPER" | "SCOUT"
  | "KNIGHT" | "RIVER" | "ARBITER"
  | "ACE" | "VETERAN" | "ROOKIE" | "GENIUS";

export type BattleState = {
  id: string;
  phase: "preparation" | "active" | "completed";
  turn: number;
  participants: Array<{
    pilotId: number;
    mechId: number;
    position: { x: number; y: number };
    hp: number;
    status: "active" | "damaged" | "destroyed";
  }>;
  log: Array<{
    timestamp: number;
    type: "movement" | "attack" | "communication" | "system";
    message: string;
    speaker?: string;
  }>;
};

export type ReconData = {
  teamName: string;
  recentWins: number;
  recentLosses: number;
  preferredComposition: string[];
  weaknesses: string[];
  corePilots: Array<{
    name: string;
    traits: string[];
    winRate: number;
  }>;
};
