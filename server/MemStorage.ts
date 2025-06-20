import {
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
  type ReconData,
} from "@shared/schema";
import type { IStorage } from "./storage";

/**
 * In-memory storage implementation for development and testing.
 * All data is lost when the server restarts.
 */
export class MemStorage implements IStorage {
  private users: User[] = [];
  private pilots: Pilot[] = [];
  private mechs: Mech[] = [];
  private teams: Team[] = [];
  private battles: Battle[] = [];
  private formations: Formation[] = [];
  private nextId = 1;

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Initialize default teams
    this.teams = [
      {
        id: 1,
        name: "Trinity Squad",
        wins: 12,
        losses: 4,
        currentSeason: 3,
        leagueRank: 3,
        credits: 15500,
        reputation: 850,
      },
      {
        id: 2,
        name: "Steel Phoenixes",
        wins: 15,
        losses: 1,
        currentSeason: 3,
        leagueRank: 1,
        credits: 25000,
        reputation: 1200,
      },
      {
        id: 3,
        name: "Lightning Bolts",
        wins: 10,
        losses: 6,
        currentSeason: 3,
        leagueRank: 5,
        credits: 12000,
        reputation: 650,
      },
    ];

    // Initialize default pilots
    this.pilots = [
      {
        id: 1,
        name: "이서연",
        callsign: "Phoenix",
        dormitory: "Knight",
        rating: 89,
        reaction: 88,
        accuracy: 85,
        tactical: 92,
        teamwork: 87,
        traits: ["ACE", "KNIGHT"],
        isActive: true,
        experience: 1250,
        wins: 28,
        losses: 7,
        trainingUntil: null,
        trainingType: null,
        fatigue: 25,
        morale: 95,
      },
      {
        id: 2,
        name: "박준혁",
        callsign: "Storm",
        dormitory: "River",
        rating: 82,
        reaction: 91,
        accuracy: 78,
        tactical: 85,
        teamwork: 84,
        traits: ["VETERAN", "RIVER"],
        isActive: true,
        experience: 980,
        wins: 22,
        losses: 8,
        trainingUntil: null,
        trainingType: null,
        fatigue: 40,
        morale: 78,
      },
      {
        id: 3,
        name: "김민지",
        callsign: "Sniper",
        dormitory: "Arbiter",
        rating: 86,
        reaction: 83,
        accuracy: 94,
        tactical: 88,
        teamwork: 81,
        traits: ["ANALYTICAL", "ARBITER"],
        isActive: true,
        experience: 1100,
        wins: 25,
        losses: 6,
        trainingUntil: null,
        trainingType: null,
        fatigue: 15,
        morale: 88,
      },
      {
        id: 4,
        name: "정태우",
        callsign: "Guardian",
        dormitory: "Knight",
        rating: 79,
        reaction: 76,
        accuracy: 81,
        tactical: 83,
        teamwork: 88,
        traits: ["ROOKIE", "KNIGHT"],
        isActive: true,
        experience: 450,
        wins: 12,
        losses: 5,
        trainingUntil: null,
        trainingType: null,
        fatigue: 55,
        morale: 72,
      },
      {
        id: 5,
        name: "한소영",
        callsign: "Scout",
        dormitory: "River",
        rating: 75,
        reaction: 89,
        accuracy: 74,
        tactical: 78,
        teamwork: 79,
        traits: ["ROOKIE", "RIVER"],
        isActive: true,
        experience: 320,
        wins: 8,
        losses: 4,
        trainingUntil: null,
        trainingType: null,
        fatigue: 30,
        morale: 85,
      },
    ];

    // Initialize default mechs
    this.mechs = [
      {
        id: 1,
        name: "Knight Vanguard",
        type: "Knight",
        variant: "Heavy",
        hp: 150,
        armor: 90,
        speed: 60,
        firepower: 85,
        range: 70,
        specialAbilities: ["Shield Burst", "Charge Attack"],
        isAvailable: true,
      },
      {
        id: 2,
        name: "River Striker",
        type: "River",
        variant: "Assault",
        hp: 120,
        armor: 70,
        speed: 95,
        firepower: 88,
        range: 75,
        specialAbilities: ["Speed Boost", "Multi-Strike"],
        isAvailable: true,
      },
      {
        id: 3,
        name: "Arbiter Sniper",
        type: "Arbiter",
        variant: "Sniper",
        hp: 100,
        armor: 60,
        speed: 70,
        firepower: 95,
        range: 120,
        specialAbilities: ["Precision Shot", "Stealth Mode"],
        isAvailable: true,
      },
    ];

    this.nextId = 100; // Start IDs higher to avoid conflicts
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = { ...user, id: this.nextId++ };
    this.users.push(newUser);
    return newUser;
  }

  // Pilot management
  async getAllPilots(): Promise<Pilot[]> {
    return [...this.pilots];
  }

  async getPilot(id: number): Promise<Pilot | undefined> {
    return this.pilots.find(p => p.id === id);
  }

  async createPilot(pilot: InsertPilot): Promise<Pilot> {
    const newPilot: Pilot = { 
      ...pilot, 
      id: this.nextId++,
      rating: pilot.rating ?? 50,
      reaction: pilot.reaction ?? 50,
      accuracy: pilot.accuracy ?? 50,
      tactical: pilot.tactical ?? 50,
      teamwork: pilot.teamwork ?? 50,
      traits: pilot.traits ?? [],
      isActive: pilot.isActive ?? true,
      experience: pilot.experience ?? 0,
      wins: pilot.wins ?? 0,
      losses: pilot.losses ?? 0,
      trainingUntil: pilot.trainingUntil || null,
      trainingType: pilot.trainingType || null,
      fatigue: pilot.fatigue ?? 0,
      morale: pilot.morale ?? 50,
    };
    this.pilots.push(newPilot);
    return newPilot;
  }

  async updatePilot(id: number, updates: Partial<Pilot>): Promise<Pilot | undefined> {
    const index = this.pilots.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    
    this.pilots[index] = { ...this.pilots[index], ...updates };
    return this.pilots[index];
  }

  async getActivePilots(): Promise<Pilot[]> {
    return this.pilots.filter(p => p.isActive);
  }

  // Mech management
  async getAllMechs(): Promise<Mech[]> {
    return [...this.mechs];
  }

  async getMech(id: number): Promise<Mech | undefined> {
    return this.mechs.find(m => m.id === id);
  }

  async createMech(mech: InsertMech): Promise<Mech> {
    const newMech: Mech = { 
      ...mech, 
      id: this.nextId++,
      specialAbilities: mech.specialAbilities || [],
      isAvailable: mech.isAvailable !== undefined ? mech.isAvailable : true,
    };
    this.mechs.push(newMech);
    return newMech;
  }

  async getAvailableMechs(): Promise<Mech[]> {
    return this.mechs.filter(m => m.isAvailable);
  }

  // Team management
  async getAllTeams(): Promise<Team[]> {
    return [...this.teams];
  }

  async getTeam(id: number): Promise<Team | undefined> {
    return this.teams.find(t => t.id === id);
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const newTeam: Team = { 
      ...team, 
      id: this.nextId++,
      wins: 0,
      losses: 0,
      currentSeason: team.currentSeason !== undefined ? team.currentSeason : 1,
      leagueRank: team.leagueRank !== undefined ? team.leagueRank : 8,
      credits: team.credits !== undefined ? team.credits : 10000,
      reputation: team.reputation !== undefined ? team.reputation : 0,
    };
    this.teams.push(newTeam);
    return newTeam;
  }

  async updateTeam(id: number, updates: Partial<Team>): Promise<Team | undefined> {
    const index = this.teams.findIndex(t => t.id === id);
    if (index === -1) return undefined;
    
    this.teams[index] = { ...this.teams[index], ...updates };
    return this.teams[index];
  }

  // Formation management
  async getActiveFormation(teamId: number): Promise<Formation | undefined> {
    return this.formations.find(f => f.teamId === teamId && f.isActive);
  }

  async createFormation(formation: InsertFormation): Promise<Formation> {
    // Deactivate existing formations for this team
    this.formations.forEach(f => {
      if (f.teamId === formation.teamId) {
        f.isActive = false;
      }
    });

    const newFormation: Formation = { 
      ...formation, 
      id: this.nextId++,
      teamId: formation.teamId || null,
      pilot1Id: formation.pilot1Id || null,
      pilot2Id: formation.pilot2Id || null,
      pilot3Id: formation.pilot3Id || null,
      mech1Id: formation.mech1Id || null,
      mech2Id: formation.mech2Id || null,
      mech3Id: formation.mech3Id || null,
      formation: formation.formation || "standard",
      isActive: formation.isActive !== undefined ? formation.isActive : false,
    };
    this.formations.push(newFormation);
    return newFormation;
  }

  async updateFormation(id: number, updates: Partial<Formation>): Promise<Formation | undefined> {
    const index = this.formations.findIndex(f => f.id === id);
    if (index === -1) return undefined;
    
    this.formations[index] = { ...this.formations[index], ...updates };
    return this.formations[index];
  }

  // Battle management
  async createBattle(battle: InsertBattle): Promise<Battle> {
    const newBattle: Battle = { 
      ...battle, 
      id: this.nextId++,
      teamAId: battle.teamAId || null,
      teamBId: battle.teamBId || null,
      winnerId: battle.winnerId || null,
      battleData: battle.battleData || null,
      status: battle.status || "pending",
      createdAt: new Date(),
      completedAt: null,
    };
    this.battles.push(newBattle);
    return newBattle;
  }

  async getBattle(id: number): Promise<Battle | undefined> {
    return this.battles.find(b => b.id === id);
  }

  async updateBattle(id: number, updates: Partial<Battle>): Promise<Battle | undefined> {
    const index = this.battles.findIndex(b => b.id === id);
    if (index === -1) return undefined;
    
    this.battles[index] = { ...this.battles[index], ...updates };
    return this.battles[index];
  }

  async getTeamBattles(teamId: number): Promise<Battle[]> {
    return this.battles.filter(b => b.teamAId === teamId || b.teamBId === teamId);
  }

  // Game state
  async getReconData(enemyTeamId: number): Promise<ReconData> {
    const team = await this.getTeam(enemyTeamId);
    if (!team) {
      throw new Error("Team not found");
    }

    const formation = await this.getActiveFormation(enemyTeamId);
    const corePilotIds: number[] = [];
    if (formation) {
      [formation.pilot1Id, formation.pilot2Id, formation.pilot3Id]
        .filter((id): id is number => typeof id === "number")
        .forEach((id) => corePilotIds.push(id));
    }
    
    const pilotRows = corePilotIds.length
      ? this.pilots.filter(p => corePilotIds.includes(p.id))
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

  // Training methods
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
}