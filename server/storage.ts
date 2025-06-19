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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private pilots: Map<number, Pilot>;
  private mechs: Map<number, Mech>;
  private teams: Map<number, Team>;
  private battles: Map<number, Battle>;
  private formations: Map<number, Formation>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.pilots = new Map();
    this.mechs = new Map();
    this.teams = new Map();
    this.battles = new Map();
    this.formations = new Map();
    this.currentId = 1;
    this.initializeGameData();
  }

  private initializeGameData() {
    // Initialize default pilots
    const defaultPilots: InsertPilot[] = [
      {
        name: "Sasha Volkov",
        callsign: "SASHA-03",
        dormitory: "River",
        rating: 87,
        reaction: 92,
        accuracy: 78,
        tactical: 65,
        teamwork: 75,
        traits: ["AGGRESSIVE", "RIVER", "ASSAULT"]
      },
      {
        name: "Mente Kazuki",
        callsign: "MENTE-11",
        dormitory: "Knight",
        rating: 91,
        reaction: 75,
        accuracy: 85,
        tactical: 95,
        teamwork: 88,
        traits: ["ANALYTICAL", "KNIGHT", "SUPPORT"]
      },
      {
        name: "Azuma Chen",
        callsign: "AZUMA-07",
        dormitory: "Arbiter",
        rating: 89,
        reaction: 80,
        accuracy: 96,
        tactical: 90,
        teamwork: 70,
        traits: ["CAUTIOUS", "ARBITER", "SNIPER"]
      }
    ];

    defaultPilots.forEach(pilot => this.createPilot(pilot));

    // Initialize default mechs
    const defaultMechs: InsertMech[] = [
      {
        name: "Knight MK-VII",
        type: "Knight",
        variant: "Balanced",
        hp: 100,
        armor: 80,
        speed: 60,
        firepower: 70,
        range: 50,
        specialAbilities: ["Shield Boost", "Formation Hold"]
      },
      {
        name: "River Blade",
        type: "River",
        variant: "Assault",
        hp: 70,
        armor: 50,
        speed: 90,
        firepower: 85,
        range: 40,
        specialAbilities: ["Boost Dash", "Combo Strike"]
      },
      {
        name: "Arbiter Hawk",
        type: "Arbiter",
        variant: "Sniper",
        hp: 80,
        armor: 60,
        speed: 50,
        firepower: 95,
        range: 90,
        specialAbilities: ["Lock-On", "Piercing Shot"]
      }
    ];

    defaultMechs.forEach(mech => this.createMech(mech));

    // Initialize default team
    this.createTeam({
      name: "Trinity Squad",
      currentSeason: 3,
      leagueRank: 3
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Pilot methods
  async getAllPilots(): Promise<Pilot[]> {
    return Array.from(this.pilots.values());
  }

  async getPilot(id: number): Promise<Pilot | undefined> {
    return this.pilots.get(id);
  }

  async createPilot(insertPilot: InsertPilot): Promise<Pilot> {
    const id = this.currentId++;
    const pilot: Pilot = { 
      ...insertPilot, 
      id,
      experience: 0,
      wins: 0,
      losses: 0
    };
    this.pilots.set(id, pilot);
    return pilot;
  }

  async updatePilot(id: number, updates: Partial<Pilot>): Promise<Pilot | undefined> {
    const pilot = this.pilots.get(id);
    if (!pilot) return undefined;
    
    const updatedPilot = { ...pilot, ...updates };
    this.pilots.set(id, updatedPilot);
    return updatedPilot;
  }

  async getActivePilots(): Promise<Pilot[]> {
    return Array.from(this.pilots.values()).filter(pilot => pilot.isActive);
  }

  // Mech methods
  async getAllMechs(): Promise<Mech[]> {
    return Array.from(this.mechs.values());
  }

  async getMech(id: number): Promise<Mech | undefined> {
    return this.mechs.get(id);
  }

  async createMech(insertMech: InsertMech): Promise<Mech> {
    const id = this.currentId++;
    const mech: Mech = { ...insertMech, id };
    this.mechs.set(id, mech);
    return mech;
  }

  async getAvailableMechs(): Promise<Mech[]> {
    return Array.from(this.mechs.values()).filter(mech => mech.isAvailable);
  }

  // Team methods
  async getTeam(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = this.currentId++;
    const team: Team = { 
      ...insertTeam, 
      id,
      wins: 12,
      losses: 5
    };
    this.teams.set(id, team);
    return team;
  }

  async updateTeam(id: number, updates: Partial<Team>): Promise<Team | undefined> {
    const team = this.teams.get(id);
    if (!team) return undefined;
    
    const updatedTeam = { ...team, ...updates };
    this.teams.set(id, updatedTeam);
    return updatedTeam;
  }

  // Formation methods
  async getActiveFormation(teamId: number): Promise<Formation | undefined> {
    return Array.from(this.formations.values()).find(
      formation => formation.teamId === teamId && formation.isActive
    );
  }

  async createFormation(insertFormation: InsertFormation): Promise<Formation> {
    const id = this.currentId++;
    const formation: Formation = { ...insertFormation, id };
    this.formations.set(id, formation);
    return formation;
  }

  async updateFormation(id: number, updates: Partial<Formation>): Promise<Formation | undefined> {
    const formation = this.formations.get(id);
    if (!formation) return undefined;
    
    const updatedFormation = { ...formation, ...updates };
    this.formations.set(id, updatedFormation);
    return updatedFormation;
  }

  // Battle methods
  async createBattle(insertBattle: InsertBattle): Promise<Battle> {
    const id = this.currentId++;
    const battle: Battle = { 
      ...insertBattle, 
      id,
      createdAt: new Date(),
      completedAt: null
    };
    this.battles.set(id, battle);
    return battle;
  }

  async getBattle(id: number): Promise<Battle | undefined> {
    return this.battles.get(id);
  }

  async updateBattle(id: number, updates: Partial<Battle>): Promise<Battle | undefined> {
    const battle = this.battles.get(id);
    if (!battle) return undefined;
    
    const updatedBattle = { ...battle, ...updates };
    this.battles.set(id, updatedBattle);
    return updatedBattle;
  }

  async getTeamBattles(teamId: number): Promise<Battle[]> {
    return Array.from(this.battles.values()).filter(
      battle => battle.teamAId === teamId || battle.teamBId === teamId
    );
  }

  // Game state methods
  async getReconData(enemyTeamId: number): Promise<ReconData> {
    // Mock reconnaissance data
    return {
      teamName: "Steel Ravens",
      recentWins: 8,
      recentLosses: 4,
      preferredComposition: ["Assault Heavy", "Support Medium", "Sniper Light"],
      weaknesses: ["Long-range engagement", "Coordinated rushes"],
      corePilots: [
        { name: "Marcus Steel", traits: ["AGGRESSIVE", "VETERAN"], winRate: 0.73 },
        { name: "Raven Night", traits: ["TACTICAL", "SNIPER"], winRate: 0.68 }
      ]
    };
  }
}

export const storage = new MemStorage();
