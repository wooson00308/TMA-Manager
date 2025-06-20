import { 
  users, pilots, mechs, teams, battles, formations,
  type User, type InsertUser, type Pilot, type InsertPilot,
  type Mech, type InsertMech, type Team, type InsertTeam,
  type Battle, type InsertBattle, type Formation, type InsertFormation,
  type BattleState, type ReconData
} from "@shared/schema";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Pilot management
  getAllPilots(): Promise<Pilot[]>;
  getPilot(id: number): Promise<Pilot | undefined>;
  createPilot(pilot: InsertPilot): Promise<Pilot>;
  updatePilot(id: number, updates: Partial<Pilot>): Promise<Pilot | undefined>;
  getActivePilots(): Promise<Pilot[]>;

  // Mech management
  getAllMechs(): Promise<Mech[]>;
  getMech(id: number): Promise<Mech | undefined>;
  createMech(mech: InsertMech): Promise<Mech>;
  getAvailableMechs(): Promise<Mech[]>;

  // Team management
  getAllTeams(): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, updates: Partial<Team>): Promise<Team | undefined>;

  // Formation management
  getActiveFormation(teamId: number): Promise<Formation | undefined>;
  createFormation(formation: InsertFormation): Promise<Formation>;
  updateFormation(id: number, updates: Partial<Formation>): Promise<Formation | undefined>;

  // Battle management
  createBattle(battle: InsertBattle): Promise<Battle>;
  getBattle(id: number): Promise<Battle | undefined>;
  updateBattle(id: number, updates: Partial<Battle>): Promise<Battle | undefined>;
  getTeamBattles(teamId: number): Promise<Battle[]>;

  // Game state
  getReconData(enemyTeamId: number): Promise<ReconData>;

  // Training methods
  startPilotTraining(pilotId: number, trainingType: string): Promise<Pilot | undefined>;
  completePilotTraining(pilotId: number): Promise<Pilot | undefined>;
  spendCredits(teamId: number, amount: number): Promise<Team | undefined>;
}

import { SQLiteStorage } from "./SQLiteStorage";

export const storage: IStorage = new SQLiteStorage();
