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
      // Knight Dormitory
      {
        id: 1,
        name: "사샤 볼코프",
        callsign: "Sasha",
        dormitory: "Knight",
        rating: 90,
        reaction: 88,
        accuracy: 85,
        tactical: 80,
        teamwork: 78,
        traits: ["ACE", "AGGRESSIVE", "KNIGHT"],
        isActive: true,
        experience: 600,
        wins: 18,
        losses: 7,
        trainingUntil: null,
        trainingType: null,
        fatigue: 25,
        morale: 90,
      },
      {
        id: 2,
        name: "헬레나 파아라",
        callsign: "Helena",
        dormitory: "Knight",
        rating: 88,
        reaction: 75,
        accuracy: 92,
        tactical: 85,
        teamwork: 82,
        traits: ["VETERAN", "ANALYTICAL", "KNIGHT"],
        isActive: true,
        experience: 850,
        wins: 25,
        losses: 5,
        trainingUntil: null,
        trainingType: null,
        fatigue: 20,
        morale: 95,
      },
      // River Dormitory
      {
        id: 3,
        name: "아즈마",
        callsign: "Azuma",
        dormitory: "River",
        rating: 87,
        reaction: 92,
        accuracy: 80,
        tactical: 78,
        teamwork: 75,
        traits: ["ACE", "AGGRESSIVE", "RIVER"],
        isActive: true,
        experience: 550,
        wins: 16,
        losses: 9,
        trainingUntil: null,
        trainingType: null,
        fatigue: 35,
        morale: 85,
      },
      {
        id: 4,
        name: "하나",
        callsign: "Hana",
        dormitory: "River",
        rating: 85,
        reaction: 80,
        accuracy: 78,
        tactical: 90,
        teamwork: 88,
        traits: ["VETERAN", "CAUTIOUS", "RIVER"],
        isActive: true,
        experience: 900,
        wins: 22,
        losses: 6,
        trainingUntil: null,
        trainingType: null,
        fatigue: 30,
        morale: 80,
      },
      // Arbiter Dormitory
      {
        id: 5,
        name: "파우스트",
        callsign: "Faust",
        dormitory: "Arbiter",
        rating: 89,
        reaction: 78,
        accuracy: 94,
        tactical: 92,
        teamwork: 70,
        traits: ["GENIUS", "ANALYTICAL", "ARBITER"],
        isActive: true,
        experience: 800,
        wins: 21,
        losses: 4,
        trainingUntil: null,
        trainingType: null,
        fatigue: 15,
        morale: 88,
      },
      {
        id: 6,
        name: "멘테",
        callsign: "Mente",
        dormitory: "Arbiter",
        rating: 80,
        reaction: 85,
        accuracy: 76,
        tactical: 70,
        teamwork: 82,
        traits: ["ROOKIE", "AGGRESSIVE", "ARBITER"],
        isActive: true,
        experience: 300,
        wins: 8,
        losses: 4,
        trainingUntil: null,
        trainingType: null,
        fatigue: 40,
        morale: 75,
      },

      // Enemy Team Pilots (Steel Phoenixes)
      {
        id: 101,
        name: "레이븐 스카이",
        callsign: "Raven",
        dormitory: "Steel",
        rating: 85,
        reaction: 82,
        accuracy: 88,
        tactical: 79,
        teamwork: 71,
        traits: ["VETERAN", "AGGRESSIVE", "STEEL"],
        isActive: true,
        experience: 720,
        wins: 20,
        losses: 8,
        trainingUntil: null,
        trainingType: null,
        fatigue: 30,
        morale: 85,
      },
      {
        id: 102,
        name: "아이언 울프",
        callsign: "Wolf",
        dormitory: "Steel",
        rating: 87,
        reaction: 85,
        accuracy: 84,
        tactical: 88,
        teamwork: 76,
        traits: ["ACE", "ANALYTICAL", "STEEL"],
        isActive: true,
        experience: 680,
        wins: 19,
        losses: 6,
        trainingUntil: null,
        trainingType: null,
        fatigue: 25,
        morale: 90,
      },
      {
        id: 103,
        name: "블레이즈 피닉스",
        callsign: "Blaze",
        dormitory: "Steel",
        rating: 89,
        reaction: 90,
        accuracy: 86,
        tactical: 85,
        teamwork: 80,
        traits: ["GENIUS", "AGGRESSIVE", "STEEL"],
        isActive: true,
        experience: 800,
        wins: 22,
        losses: 4,
        trainingUntil: null,
        trainingType: null,
        fatigue: 20,
        morale: 92,
      },
    ];

    // Initialize default mechs
    this.mechs = [
      // River series
      {
        id: 1,
        name: "Rv-케식",
        type: "River",
        variant: "Assault",
        hp: 130,
        armor: 70,
        speed: 90,
        firepower: 60,
        range: 40,
        specialAbilities: ["펄스 클로", "고속 돌진"],
        isAvailable: true,
      },
      {
        id: 2,
        name: "Rv-칸",
        type: "River",
        variant: "Melee",
        hp: 140,
        armor: 90,
        speed: 60,
        firepower: 80,
        range: 30,
        specialAbilities: ["파일 벙커", "방어 강화"],
        isAvailable: true,
      },
      {
        id: 3,
        name: "Rv-나가",
        type: "River",
        variant: "General",
        hp: 120,
        armor: 60,
        speed: 70,
        firepower: 50,
        range: 40,
        specialAbilities: ["기본 근접 무장"],
        isAvailable: true,
      },
      {
        id: 4,
        name: "Rv-데바",
        type: "River",
        variant: "Heavy",
        hp: 160,
        armor: 110,
        speed: 40,
        firepower: 65,
        range: 35,
        specialAbilities: ["이중 실드", "견제 모드"],
        isAvailable: true,
      },

      // Arbiter series
      {
        id: 5,
        name: "Ab-판저",
        type: "Arbiter",
        variant: "Sniper",
        hp: 110,
        armor: 50,
        speed: 60,
        firepower: 100,
        range: 120,
        specialAbilities: ["차지랜스", "저격 모드"],
        isAvailable: true,
      },
      {
        id: 6,
        name: "Ab-티거",
        type: "Arbiter",
        variant: "Marksman",
        hp: 115,
        armor: 60,
        speed: 70,
        firepower: 85,
        range: 90,
        specialAbilities: ["유탄 SMG", "중거리 지원"],
        isAvailable: true,
      },
      {
        id: 7,
        name: "Ab-이글",
        type: "Arbiter",
        variant: "General",
        hp: 100,
        armor: 55,
        speed: 65,
        firepower: 70,
        range: 75,
        specialAbilities: ["기본 사격 무장"],
        isAvailable: true,
      },
      {
        id: 8,
        name: "Ab-팔콘",
        type: "Arbiter",
        variant: "Scout",
        hp: 95,
        armor: 40,
        speed: 90,
        firepower: 60,
        range: 80,
        specialAbilities: ["드론 시스템", "정찰"],
        isAvailable: true,
      },

      // Knight series
      {
        id: 9,
        name: "Kn-센츄리온",
        type: "Knight",
        variant: "Melee",
        hp: 140,
        armor: 80,
        speed: 70,
        firepower: 75,
        range: 35,
        specialAbilities: ["펄스 소드"],
        isAvailable: true,
      },
      {
        id: 10,
        name: "Kn-에퀴테스",
        type: "Knight",
        variant: "Marksman",
        hp: 125,
        armor: 65,
        speed: 70,
        firepower: 85,
        range: 95,
        specialAbilities: ["유니콘 라이플"],
        isAvailable: true,
      },
      {
        id: 11,
        name: "Kn-스쿠툼",
        type: "Knight",
        variant: "General",
        hp: 120,
        armor: 70,
        speed: 60,
        firepower: 70,
        range: 60,
        specialAbilities: ["기본 복합 무장"],
        isAvailable: true,
      },
      {
        id: 12,
        name: "Kn-팔라딘",
        type: "Knight",
        variant: "Support",
        hp: 130,
        armor: 75,
        speed: 60,
        firepower: 65,
        range: 50,
        specialAbilities: ["보강 필드", "팀 지원"],
        isAvailable: true,
      },

      // Instructor Specials (TH series)
      {
        id: 13,
        name: "TH-타이런트",
        type: "Knight",
        variant: "Brawler",
        hp: 170,
        armor: 120,
        speed: 50,
        firepower: 110,
        range: 30,
        specialAbilities: ["양손 파워 피스트", "근접전 특화"],
        isAvailable: true,
      },
      {
        id: 14,
        name: "TH-트릭",
        type: "Arbiter",
        variant: "Skirmisher",
        hp: 110,
        armor: 45,
        speed: 100,
        firepower: 95,
        range: 110,
        specialAbilities: ["펄스 권총", "고기동 사격"],
        isAvailable: true,
      },
    ];

    this.nextId = 100; // Start IDs higher to avoid conflicts
    
    // Initialize default formations
    this.formations = [
      // Trinity Squad formation
      {
        id: 1,
        teamId: 1,
        pilot1Id: 1, // 사샤 볼코프
        pilot2Id: 2, // 헬레나 파아라  
        pilot3Id: 3, // 아즈마
        mech1Id: 9,  // Kn-센츄리온
        mech2Id: 10, // Kn-에퀴테스
        mech3Id: 1,  // Rv-케식
        formation: "standard",
        isActive: true,
      },
      // Steel Phoenixes formation
      {
        id: 2,
        teamId: 2,
        pilot1Id: 101, // 레이븐 스카이
        pilot2Id: 102, // 아이언 울프
        pilot3Id: 103, // 블레이즈 피닉스
        mech1Id: 5,    // Ab-판저
        mech2Id: 13,   // TH-타이런트
        mech3Id: 2,    // Rv-칸
        formation: "aggressive",
        isActive: true,
      },
    ];
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

  async getPilotsByTeam(teamId: number): Promise<Pilot[]> {
    const teamFormation = this.formations.find(f => f.teamId === teamId && f.isActive);
    if (!teamFormation) {
      return [];
    }

    const pilotIds: number[] = [];
    if (teamFormation.pilot1Id) pilotIds.push(teamFormation.pilot1Id);
    if (teamFormation.pilot2Id) pilotIds.push(teamFormation.pilot2Id);
    if (teamFormation.pilot3Id) pilotIds.push(teamFormation.pilot3Id);

    return this.pilots.filter(p => pilotIds.includes(p.id));
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