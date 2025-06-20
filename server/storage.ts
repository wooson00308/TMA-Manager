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
    // Initialize Trinity Squad pilots (5 active pilots)
    const trinityPilots: InsertPilot[] = [
      {
        name: "Sasha Volkov",
        callsign: "GHOST",
        dormitory: "Knight",
        rating: 78,
        reaction: 82,
        accuracy: 75,
        tactical: 80,
        teamwork: 73,
        traits: ["AGGRESSIVE", "ACE"],
        isActive: true
      },
      {
        name: "Mei Chen",
        callsign: "AZURE",
        dormitory: "Arbiter",
        rating: 71,
        reaction: 68,
        accuracy: 85,
        tactical: 78,
        teamwork: 67,
        traits: ["ANALYTICAL", "SNIPER"],
        isActive: true
      },
      {
        name: "Alex Rodriguez",
        callsign: "STORM",
        dormitory: "River",
        rating: 69,
        reaction: 72,
        accuracy: 66,
        tactical: 65,
        teamwork: 81,
        traits: ["COOPERATIVE", "SUPPORT"],
        isActive: true
      },
      {
        name: "Jin Watanabe",
        callsign: "BLADE",
        dormitory: "Knight",
        rating: 74,
        reaction: 78,
        accuracy: 71,
        tactical: 73,
        teamwork: 75,
        traits: ["VETERAN", "ASSAULT"],
        isActive: true
      },
      {
        name: "Elena Vasquez",
        callsign: "NOVA",
        dormitory: "River",
        rating: 67,
        reaction: 65,
        accuracy: 69,
        tactical: 68,
        teamwork: 79,
        traits: ["SCOUT", "COOPERATIVE"],
        isActive: true
      }
    ];

    // Initialize recruitable pilots (inactive)
    const recruitablePilots: InsertPilot[] = [
      {
        name: "Viktor Kane",
        callsign: "RAVEN",
        dormitory: "Knight",
        rating: 82,
        reaction: 85,
        accuracy: 79,
        tactical: 81,
        teamwork: 76,
        traits: ["ACE", "AGGRESSIVE"],
        isActive: false
      },
      {
        name: "Luna Park",
        callsign: "SHADOW",
        dormitory: "Arbiter",
        rating: 76,
        reaction: 72,
        accuracy: 88,
        tactical: 84,
        teamwork: 65,
        traits: ["GENIUS", "SNIPER"],
        isActive: false
      },
      {
        name: "Marco Silva",
        callsign: "TIDE",
        dormitory: "River",
        rating: 70,
        reaction: 68,
        accuracy: 71,
        tactical: 75,
        teamwork: 85,
        traits: ["VETERAN", "SUPPORT"],
        isActive: false
      },
      {
        name: "Aria Kim",
        callsign: "PHOENIX",
        dormitory: "Knight",
        rating: 79,
        reaction: 83,
        accuracy: 76,
        tactical: 77,
        teamwork: 74,
        traits: ["ROOKIE", "ASSAULT"],
        isActive: false
      },
      {
        name: "Diego Morales",
        callsign: "VIPER",
        dormitory: "Arbiter",
        rating: 73,
        reaction: 70,
        accuracy: 81,
        tactical: 79,
        teamwork: 68,
        traits: ["ANALYTICAL", "DEFENSIVE"],
        isActive: false
      },
      {
        name: "Yuki Tanaka",
        callsign: "FROST",
        dormitory: "River",
        rating: 68,
        reaction: 66,
        accuracy: 70,
        tactical: 72,
        teamwork: 82,
        traits: ["CAUTIOUS", "SCOUT"],
        isActive: false
      }
    ];

    // Create all pilots
    [...trinityPilots, ...recruitablePilots].forEach(pilot => this.createPilot(pilot));

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
      },
      // Additional mechs for variety
      {
        name: "Knight Guardian",
        type: "Knight", 
        variant: "Heavy",
        hp: 120,
        armor: 100,
        speed: 40,
        firepower: 80,
        range: 45,
        specialAbilities: ["Fortress Mode", "Heavy Strike"]
      },
      {
        name: "River Phantom",
        type: "River",
        variant: "Stealth", 
        hp: 60,
        armor: 35,
        speed: 95,
        firepower: 65,
        range: 55,
        specialAbilities: ["Stealth", "Silent Strike"]
      },
      {
        name: "Arbiter Judge",
        type: "Arbiter",
        variant: "Command",
        hp: 90,
        armor: 70,
        speed: 55,
        firepower: 75,
        range: 65,
        specialAbilities: ["Command Boost", "Tactical Strike"]
      },
      {
        name: "Titan Breaker",
        type: "Custom",
        variant: "Siege",
        hp: 140,
        armor: 90,
        speed: 30,
        firepower: 100,
        range: 60,
        specialAbilities: ["Siege Mode", "Armor Pierce"]
      },
      {
        name: "Nova Striker", 
        type: "Custom",
        variant: "Energy",
        hp: 75,
        armor: 45,
        speed: 80,
        firepower: 85,
        range: 70,
        specialAbilities: ["Energy Burst", "Overcharge"]
      },
      // Additional Knight Class Mechs
      {
        name: "Iron Bulwark",
        type: "Knight",
        variant: "Fortress",
        hp: 130,
        armor: 100,
        speed: 35,
        firepower: 65,
        range: 40,
        specialAbilities: ["Immobile Defense", "Damage Reflection"]
      },
      {
        name: "Steel Vanguard",
        type: "Knight",
        variant: "Striker",
        hp: 105,
        armor: 70,
        speed: 65,
        firepower: 80,
        range: 50,
        specialAbilities: ["Charge Attack", "Shield Slam"]
      },
      {
        name: "Paladin Core",
        type: "Knight",
        variant: "Healer",
        hp: 100,
        armor: 75,
        speed: 50,
        firepower: 55,
        range: 55,
        specialAbilities: ["Repair Field", "Emergency Shield"]
      },
      {
        name: "Crusader MK-III",
        type: "Knight",
        variant: "Assault",
        hp: 115,
        armor: 80,
        speed: 55,
        firepower: 90,
        range: 45,
        specialAbilities: ["Berserker Mode", "Heavy Impact"]
      },
      // Additional River Class Mechs
      {
        name: "Shadow Current",
        type: "River",
        variant: "Stealth",
        hp: 65,
        armor: 40,
        speed: 100,
        firepower: 70,
        range: 45,
        specialAbilities: ["Invisibility", "Backstab"]
      },
      {
        name: "Wind Dancer",
        type: "River",
        variant: "Evasion",
        hp: 70,
        armor: 45,
        speed: 95,
        firepower: 65,
        range: 40,
        specialAbilities: ["Perfect Dodge", "Counter Strike"]
      },
      {
        name: "Torrent Rush",
        type: "River",
        variant: "Burst",
        hp: 60,
        armor: 35,
        speed: 90,
        firepower: 95,
        range: 35,
        specialAbilities: ["Speed Boost", "Multi-Strike"]
      },
      {
        name: "Swift Tide",
        type: "River",
        variant: "Mobility",
        hp: 75,
        armor: 50,
        speed: 85,
        firepower: 75,
        range: 50,
        specialAbilities: ["Wall Jump", "Flow State"]
      },
      {
        name: "Blade Cyclone",
        type: "River",
        variant: "Melee",
        hp: 80,
        armor: 55,
        speed: 80,
        firepower: 85,
        range: 25,
        specialAbilities: ["Sword Dance", "Bleeding Edge"]
      },
      // Additional Arbiter Class Mechs
      {
        name: "Silent Judge",
        type: "Arbiter",
        variant: "Assassin",
        hp: 70,
        armor: 50,
        speed: 75,
        firepower: 90,
        range: 75,
        specialAbilities: ["Silent Shot", "Mark for Death"]
      },
      {
        name: "Thunder Verdict",
        type: "Arbiter",
        variant: "Artillery",
        hp: 85,
        armor: 60,
        speed: 45,
        firepower: 105,
        range: 90,
        specialAbilities: ["Thunder Strike", "Area Bombard"]
      },
      {
        name: "Omega Protocol",
        type: "Arbiter",
        variant: "Tech",
        hp: 80,
        armor: 65,
        speed: 60,
        firepower: 80,
        range: 70,
        specialAbilities: ["System Hack", "EMP Burst"]
      },
      {
        name: "Divine Arbiter",
        type: "Arbiter",
        variant: "Elite",
        hp: 95,
        armor: 70,
        speed: 70,
        firepower: 85,
        range: 75,
        specialAbilities: ["Divine Judgment", "Perfect Aim"]
      },
      {
        name: "Crimson Executioner",
        type: "Arbiter",
        variant: "Berserker",
        hp: 75,
        armor: 55,
        speed: 80,
        firepower: 100,
        range: 55,
        specialAbilities: ["Blood Frenzy", "Execution Strike"]
      },
      // Experimental/Custom Mechs
      {
        name: "Hybrid Genesis",
        type: "Custom",
        variant: "Adaptive",
        hp: 85,
        armor: 60,
        speed: 70,
        firepower: 75,
        range: 60,
        specialAbilities: ["Mode Switch", "Adaptive Armor"]
      },
      {
        name: "Quantum Phantom",
        type: "Custom",
        variant: "Phase",
        hp: 70,
        armor: 40,
        speed: 85,
        firepower: 80,
        range: 65,
        specialAbilities: ["Phase Shift", "Quantum Strike"]
      },
      {
        name: "Meteor Hammer",
        type: "Custom",
        variant: "Demolition",
        hp: 120,
        armor: 85,
        speed: 40,
        firepower: 110,
        range: 50,
        specialAbilities: ["Meteor Drop", "Shockwave"]
      },
      {
        name: "Angel Wing",
        type: "Custom",
        variant: "Flight",
        hp: 65,
        armor: 45,
        speed: 90,
        firepower: 70,
        range: 80,
        specialAbilities: ["Aerial Combat", "Dive Bomb"]
      },
      {
        name: "Demon Claw",
        type: "Custom",
        variant: "Predator",
        hp: 80,
        armor: 50,
        speed: 85,
        firepower: 90,
        range: 45,
        specialAbilities: ["Hunt Mode", "Fear Aura"]
      }
    ];

    defaultMechs.forEach(mech => this.createMech(mech));

    // Initialize default teams
    const defaultTeams = [
      { name: "Trinity Squad", currentSeason: 3, leagueRank: 3 },
      { name: "Steel Ravens", currentSeason: 3, leagueRank: 4 },
      { name: "Void Hunters", currentSeason: 3, leagueRank: 1 },
      { name: "Crimson Lance", currentSeason: 3, leagueRank: 2 },
      { name: "Ghost Protocol", currentSeason: 3, leagueRank: 5 },
      { name: "Neon Spartans", currentSeason: 3, leagueRank: 6 },
      { name: "Shadow Wolves", currentSeason: 3, leagueRank: 7 },
      { name: "Iron Eagles", currentSeason: 3, leagueRank: 8 }
    ];

    defaultTeams.forEach(team => this.createTeam(team));


    
    // Create initial formations for each team
    this.createInitialFormations();
  }



  private createInitialFormations() {
    const teams = Array.from(this.teams.values());
    const allMechs = Array.from(this.mechs.values());
    
    teams.forEach(team => {
      // Get pilots for this team (approximately distribute pilots among teams)
      const teamPilots = Array.from(this.pilots.values()).slice(
        (team.id - teams[0].id) * 3, 
        (team.id - teams[0].id + 1) * 3
      );
      
      if (teamPilots.length >= 3 && allMechs.length >= 3) {
        // Assign mechs randomly
        const shuffledMechs = [...allMechs].sort(() => Math.random() - 0.5);
        const selectedMechs = shuffledMechs.slice(0, 3);
        
        this.createFormation({
          teamId: team.id,
          pilot1Id: teamPilots[0]?.id,
          pilot2Id: teamPilots[1]?.id, 
          pilot3Id: teamPilots[2]?.id,
          mech1Id: selectedMechs[0]?.id,
          mech2Id: selectedMechs[1]?.id,
          mech3Id: selectedMechs[2]?.id,
          formation: 'standard',
          isActive: true
        });
      }
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
      id,
      name: insertPilot.name,
      callsign: insertPilot.callsign,
      dormitory: insertPilot.dormitory,
      rating: insertPilot.rating || 50,
      reaction: insertPilot.reaction || 50,
      accuracy: insertPilot.accuracy || 50,
      tactical: insertPilot.tactical || 50,
      teamwork: insertPilot.teamwork || 50,
      traits: insertPilot.traits || [],
      isActive: insertPilot.isActive ?? true,
      experience: 0,
      wins: 0,
      losses: 0,
      trainingUntil: null,
      trainingType: null,
      fatigue: 0,
      morale: 50
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
    const mech: Mech = { 
      id,
      name: insertMech.name,
      type: insertMech.type,
      variant: insertMech.variant,
      hp: insertMech.hp,
      armor: insertMech.armor,
      speed: insertMech.speed,
      firepower: insertMech.firepower,
      range: insertMech.range,
      specialAbilities: insertMech.specialAbilities || [],
      isAvailable: insertMech.isAvailable ?? true
    };
    this.mechs.set(id, mech);
    return mech;
  }

  async getAvailableMechs(): Promise<Mech[]> {
    return Array.from(this.mechs.values()).filter(mech => mech.isAvailable);
  }

  // Team methods
  async getAllTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  async getTeam(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = this.currentId++;
    const team: Team = { 
      id,
      name: insertTeam.name,
      wins: Math.floor(Math.random() * 15) + 5,
      losses: Math.floor(Math.random() * 10) + 2,
      currentSeason: insertTeam.currentSeason || 3,
      leagueRank: insertTeam.leagueRank || 8,
      credits: insertTeam.credits || 10000,
      reputation: insertTeam.reputation || 0
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
    const formation: Formation = { 
      id,
      teamId: insertFormation.teamId!,
      pilot1Id: insertFormation.pilot1Id!,
      pilot2Id: insertFormation.pilot2Id!,
      pilot3Id: insertFormation.pilot3Id!,
      mech1Id: insertFormation.mech1Id!,
      mech2Id: insertFormation.mech2Id!,
      mech3Id: insertFormation.mech3Id!,
      formation: insertFormation.formation || 'standard',
      isActive: insertFormation.isActive ?? false
    };
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
      id,
      teamAId: insertBattle.teamAId!,
      teamBId: insertBattle.teamBId!,
      winnerId: insertBattle.winnerId!,
      battleData: insertBattle.battleData!,
      season: insertBattle.season,
      week: insertBattle.week,
      status: insertBattle.status || 'pending',
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
    const team = this.teams.get(enemyTeamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Get team's formation and pilots
    const formation = Array.from(this.formations.values()).find(f => f.teamId === enemyTeamId && f.isActive);
    const teamPilots = Array.from(this.pilots.values()).filter(p => 
      formation && (p.id === formation.pilot1Id || p.id === formation.pilot2Id || p.id === formation.pilot3Id)
    );

    // Generate dynamic recon data based on actual team
    const compositions = ["Knight-Heavy", "River-Scout", "Arbiter-Sniper", "Balanced-Formation", "Aggressive-Rush", "Defensive-Wall"];
    const weaknesses = [
      "Vulnerable to flanking maneuvers",
      "Slow adaptation to formation changes", 
      "Weak against long-range attacks",
      "Poor coordination in close combat",
      "Susceptible to electronic warfare",
      "Limited mobility in defensive stance"
    ];

    return {
      teamName: team.name,
      recentWins: team.wins,
      recentLosses: team.losses,
      preferredComposition: compositions.slice(0, 3),
      weaknesses: weaknesses.slice(0, 2),
      corePilots: teamPilots.slice(0, 3).map(pilot => ({
        name: pilot.name,
        traits: pilot.traits.slice(0, 3),
        winRate: (pilot.wins / Math.max(pilot.wins + pilot.losses, 1)) || Math.random() * 0.3 + 0.5
      }))
    };
  }

  // Training methods
  async startPilotTraining(pilotId: number, trainingType: string): Promise<Pilot | undefined> {
    const pilot = this.pilots.get(pilotId);
    if (!pilot) return undefined;

    const trainingDuration = 30000; // 30 seconds for demo
    const trainingUntil = new Date(Date.now() + trainingDuration);
    
    const updatedPilot = {
      ...pilot,
      trainingUntil,
      trainingType,
      fatigue: Math.min(pilot.fatigue + 10, 100)
    };
    
    this.pilots.set(pilotId, updatedPilot);
    return updatedPilot;
  }

  async completePilotTraining(pilotId: number): Promise<Pilot | undefined> {
    const pilot = this.pilots.get(pilotId);
    if (!pilot || !pilot.trainingType) return undefined;

    const statBonus = Math.floor(Math.random() * 3) + 1; // 1-3 stat increase
    let updatedPilot = { ...pilot };

    // Apply training benefits based on type
    switch (pilot.trainingType) {
      case 'reaction':
        updatedPilot.reaction = Math.min(pilot.reaction + statBonus, 100);
        break;
      case 'accuracy':
        updatedPilot.accuracy = Math.min(pilot.accuracy + statBonus, 100);
        break;
      case 'tactical':
        updatedPilot.tactical = Math.min(pilot.tactical + statBonus, 100);
        break;
      case 'teamwork':
        updatedPilot.teamwork = Math.min(pilot.teamwork + statBonus, 100);
        break;
    }

    updatedPilot.experience += 10;
    updatedPilot.trainingUntil = null;
    updatedPilot.trainingType = null;
    updatedPilot.morale = Math.min(pilot.morale + 5, 100);
    
    this.pilots.set(pilotId, updatedPilot);
    return updatedPilot;
  }

  async spendCredits(teamId: number, amount: number): Promise<Team | undefined> {
    const team = this.teams.get(teamId);
    if (!team || team.credits < amount) return undefined;

    const updatedTeam = { ...team, credits: team.credits - amount };
    this.teams.set(teamId, updatedTeam);
    return updatedTeam;
  }
}

export const storage = new MemStorage();
