import { db } from "./database";
import { eq, and, or, inArray } from "drizzle-orm";
import {
  users,
  pilots,
  mechs,
  teams,
  battles,
  formations,
  type User,
  type InsertUser,
  type Pilot,
  type InsertPilot,
  type Mech,
  type InsertMech,
  type Team,
  type InsertTeam,
  type Battle,
  type InsertBattle,
  type Formation,
  type InsertFormation,
  type BattleState,
  type ReconData,
} from "@shared/schema";
import type { IStorage } from "./storage"; // type-only to avoid runtime cycle

/**
 * Drizzle-powered SQLite storage that persists all game data on-disk.
 *
 * NOTE: This class purposefully implements just the subset of methods that are
 * currently used by server/routes.ts.  Any unimplemented function will throw a
 * clear error so that missing functionality is easy to spot during runtime.
 */
export class SQLiteStorage implements IStorage {
  //───────────────────────────────────────────────────────────────────────────┐
  // User management                                                          │
  //───────────────────────────────────────────────────────────────────────────┘
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(insertUser).returning();
    return created;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Pilot management                                                         │
  //───────────────────────────────────────────────────────────────────────────┘
  async getAllPilots(): Promise<Pilot[]> {
    return db.select().from(pilots);
  }

  async getPilot(id: number): Promise<Pilot | undefined> {
    const result = await db.select().from(pilots).where(eq(pilots.id, id));
    return result[0];
  }

  async createPilot(pilot: InsertPilot): Promise<Pilot> {
    const [created] = await db.insert(pilots).values(pilot).returning();
    return created;
  }

  async updatePilot(id: number, updates: Partial<Pilot>): Promise<Pilot | undefined> {
    const [updated] = await db
      .update(pilots)
      .set(updates)
      .where(eq(pilots.id, id))
      .returning();
    return updated;
  }

  async getActivePilots(): Promise<Pilot[]> {
    return db.select().from(pilots).where(eq(pilots.isActive, true));
  }

  async getPilotsByTeam(teamId: number): Promise<Pilot[]> {
    const teamFormation = await db
      .select()
      .from(formations)
      .where(and(eq(formations.teamId, teamId), eq(formations.isActive, true)))
      .limit(1);

    if (teamFormation.length === 0) {
      return [];
    }

    const formation = teamFormation[0];
    const pilotIds: number[] = [];
    if (formation.pilot1Id) pilotIds.push(formation.pilot1Id);
    if (formation.pilot2Id) pilotIds.push(formation.pilot2Id);
    if (formation.pilot3Id) pilotIds.push(formation.pilot3Id);

    if (pilotIds.length === 0) {
      return [];
    }

    return db.select().from(pilots).where(inArray(pilots.id, pilotIds));
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Mech management                                                          │
  //───────────────────────────────────────────────────────────────────────────┘
  async getAllMechs(): Promise<Mech[]> {
    return db.select().from(mechs);
  }

  async getMech(id: number): Promise<Mech | undefined> {
    const result = await db.select().from(mechs).where(eq(mechs.id, id));
    return result[0];
  }

  async createMech(mech: InsertMech): Promise<Mech> {
    const [created] = await db.insert(mechs).values(mech).returning();
    return created;
  }

  async getAvailableMechs(): Promise<Mech[]> {
    return db.select().from(mechs).where(eq(mechs.isAvailable, true));
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Team management                                                          │
  //───────────────────────────────────────────────────────────────────────────┘
  async getAllTeams(): Promise<Team[]> {
    return db.select().from(teams);
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const result = await db.select().from(teams).where(eq(teams.id, id));
    return result[0];
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const [created] = await db.insert(teams).values(team).returning();
    return created;
  }

  async updateTeam(id: number, updates: Partial<Team>): Promise<Team | undefined> {
    const [updated] = await db.update(teams).set(updates).where(eq(teams.id, id)).returning();
    return updated;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Formation management                                                     │
  //───────────────────────────────────────────────────────────────────────────┘
  async getActiveFormation(teamId: number): Promise<Formation | undefined> {
    const result = await db
      .select()
      .from(formations)
      .where(and(eq(formations.teamId, teamId), eq(formations.isActive, true)));
    return result[0];
  }

  async createFormation(formation: InsertFormation): Promise<Formation> {
    const [created] = await db.insert(formations).values(formation).returning();
    return created;
  }

  async updateFormation(id: number, updates: Partial<Formation>): Promise<Formation | undefined> {
    const [updated] = await db.update(formations).set(updates).where(eq(formations.id, id)).returning();
    return updated;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Battle management                                                        │
  //───────────────────────────────────────────────────────────────────────────┘
  async createBattle(battle: InsertBattle): Promise<Battle> {
    const [created] = await db.insert(battles).values(battle).returning();
    return created;
  }

  async getBattle(id: number): Promise<Battle | undefined> {
    const result = await db.select().from(battles).where(eq(battles.id, id));
    return result[0];
  }

  async updateBattle(id: number, updates: Partial<Battle>): Promise<Battle | undefined> {
    const [updated] = await db.update(battles).set(updates).where(eq(battles.id, id)).returning();
    return updated;
  }

  async getTeamBattles(teamId: number): Promise<Battle[]> {
    return db
      .select()
      .from(battles)
      .where(or(eq(battles.teamAId, teamId), eq(battles.teamBId, teamId)));
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Game state & misc                                                        │
  //───────────────────────────────────────────────────────────────────────────┘
  async getReconData(enemyTeamId: number): Promise<ReconData> {
    // Naive implementation: delegate to in-memory algorithm similar to MemStorage
    const team = await this.getTeam(enemyTeamId);
    if (!team) {
      throw new Error("Team not found");
    }

    const formation = await this.getActiveFormation(enemyTeamId);
    const corePilotsIds: number[] = [];
    if (formation) {
      [formation.pilot1Id, formation.pilot2Id, formation.pilot3Id]
        .filter((id): id is number => typeof id === "number")
        .forEach((id) => corePilotsIds.push(id));
    }
    const pilotRows = corePilotsIds.length
      ? await db.select().from(pilots).where(inArray(pilots.id, corePilotsIds))
      : [];

    const compositions = [
      "Knight-Heavy",
      "River-Scout",
      "Arbiter-Sniper",
      "Balanced-Formation",
      "Aggressive-Rush",
      "Defensive-Wall",
    ];

    const weaknesses = [
      "Vulnerable to flanking maneuvers",
      "Slow adaptation to formation changes",
      "Weak against long-range attacks",
      "Poor coordination in close combat",
      "Susceptible to electronic warfare",
      "Limited mobility in defensive stance",
    ];

    return {
      teamName: team.name,
      recentWins: team.wins,
      recentLosses: team.losses,
      preferredComposition: compositions.slice(0, 3),
      weaknesses: weaknesses.slice(0, 2),
      corePilots: pilotRows.map((p) => ({
        name: p.name,
        traits: p.traits.slice(0, 3),
        winRate: (p.wins / Math.max(p.wins + p.losses, 1)) || Math.random() * 0.3 + 0.5,
      })),
    } as ReconData;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Training & credits                                                       │
  //───────────────────────────────────────────────────────────────────────────┘
  async startPilotTraining(pilotId: number, trainingType: string): Promise<Pilot | undefined> {
    const pilot = await this.getPilot(pilotId);
    if (!pilot) return undefined;

    const trainingDuration = 30000; // 30 seconds for demo
    const trainingUntil = new Date(Date.now() + trainingDuration);

    return this.updatePilot(pilotId, {
      trainingUntil,
      trainingType,
      fatigue: Math.min(pilot.fatigue + 10, 100),
    });
  }

  async completePilotTraining(pilotId: number): Promise<Pilot | undefined> {
    const pilot = await this.getPilot(pilotId);
    if (!pilot || !pilot.trainingType) return undefined;

    const statBonus = Math.floor(Math.random() * 3) + 1;
    let updates: Partial<Pilot> = {};

    switch (pilot.trainingType) {
      case "reaction":
        updates.reaction = Math.min(pilot.reaction + statBonus, 100);
        break;
      case "accuracy":
        updates.accuracy = Math.min(pilot.accuracy + statBonus, 100);
        break;
      case "tactical":
        updates.tactical = Math.min(pilot.tactical + statBonus, 100);
        break;
      case "teamwork":
        updates.teamwork = Math.min(pilot.teamwork + statBonus, 100);
        break;
    }

    updates.experience = pilot.experience + 10;
    updates.trainingUntil = null;
    updates.trainingType = null;
    updates.morale = Math.min(pilot.morale + 5, 100);

    return this.updatePilot(pilotId, updates);
  }

  async spendCredits(teamId: number, amount: number): Promise<Team | undefined> {
    const team = await this.getTeam(teamId);
    if (!team || team.credits < amount) return undefined;
    return this.updateTeam(teamId, { credits: team.credits - amount });
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Battle state (unused by storage)                                         │
  //───────────────────────────────────────────────────────────────────────────┘
  // These are just placeholders to satisfy the interface.  BattleState is
  // managed in-memory during simulations, so storage does not persist it.
  // If long-term persistence is required, create a new table and implement
  // these methods accordingly.

  // (no-op)                                                                
} 