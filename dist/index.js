// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

// server/MemStorage.ts
var MemStorage = class {
  users = [];
  pilots = [];
  mechs = [];
  teams = [];
  battles = [];
  formations = [];
  nextId = 1;
  constructor() {
    this.initializeDefaultData();
  }
  initializeDefaultData() {
    this.teams = [
      {
        id: 1,
        name: "Trinity Squad",
        wins: 12,
        losses: 4,
        currentSeason: 3,
        leagueRank: 3,
        credits: 15500,
        reputation: 850
      },
      {
        id: 2,
        name: "Steel Phoenixes",
        wins: 15,
        losses: 1,
        currentSeason: 3,
        leagueRank: 1,
        credits: 25e3,
        reputation: 1200
      },
      {
        id: 3,
        name: "Lightning Bolts",
        wins: 10,
        losses: 6,
        currentSeason: 3,
        leagueRank: 5,
        credits: 12e3,
        reputation: 650
      }
    ];
    this.pilots = [
      // Knight Dormitory
      {
        id: 1,
        name: "\uC0AC\uC0E4 \uBCFC\uCF54\uD504",
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
        morale: 90
      },
      {
        id: 2,
        name: "\uD5EC\uB808\uB098 \uD30C\uC544\uB77C",
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
        morale: 95
      },
      // River Dormitory
      {
        id: 3,
        name: "\uC544\uC988\uB9C8",
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
        morale: 85
      },
      {
        id: 4,
        name: "\uD558\uB098",
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
        morale: 80
      },
      // Arbiter Dormitory
      {
        id: 5,
        name: "\uD30C\uC6B0\uC2A4\uD2B8",
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
        morale: 88
      },
      {
        id: 6,
        name: "\uBA58\uD14C",
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
        morale: 75
      },
      // Enemy Team Pilots (Steel Phoenixes)
      {
        id: 101,
        name: "\uB808\uC774\uBE10 \uC2A4\uCE74\uC774",
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
        morale: 85
      },
      {
        id: 102,
        name: "\uC544\uC774\uC5B8 \uC6B8\uD504",
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
        morale: 90
      },
      {
        id: 103,
        name: "\uBE14\uB808\uC774\uC988 \uD53C\uB2C9\uC2A4",
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
        morale: 92
      }
    ];
    this.mechs = [
      // River series
      {
        id: 1,
        name: "Rv-\uCF00\uC2DD",
        type: "River",
        variant: "Assault",
        hp: 130,
        armor: 70,
        speed: 90,
        firepower: 60,
        range: 40,
        specialAbilities: ["\uD384\uC2A4 \uD074\uB85C", "\uACE0\uC18D \uB3CC\uC9C4"],
        isAvailable: true
      },
      {
        id: 2,
        name: "Rv-\uCE78",
        type: "River",
        variant: "Melee",
        hp: 140,
        armor: 90,
        speed: 60,
        firepower: 80,
        range: 30,
        specialAbilities: ["\uD30C\uC77C \uBC99\uCEE4", "\uBC29\uC5B4 \uAC15\uD654"],
        isAvailable: true
      },
      {
        id: 3,
        name: "Rv-\uB098\uAC00",
        type: "River",
        variant: "General",
        hp: 120,
        armor: 60,
        speed: 70,
        firepower: 50,
        range: 40,
        specialAbilities: ["\uAE30\uBCF8 \uADFC\uC811 \uBB34\uC7A5"],
        isAvailable: true
      },
      {
        id: 4,
        name: "Rv-\uB370\uBC14",
        type: "River",
        variant: "Heavy",
        hp: 160,
        armor: 110,
        speed: 40,
        firepower: 65,
        range: 35,
        specialAbilities: ["\uC774\uC911 \uC2E4\uB4DC", "\uACAC\uC81C \uBAA8\uB4DC"],
        isAvailable: true
      },
      // Arbiter series
      {
        id: 5,
        name: "Ab-\uD310\uC800",
        type: "Arbiter",
        variant: "Sniper",
        hp: 110,
        armor: 50,
        speed: 60,
        firepower: 100,
        range: 120,
        specialAbilities: ["\uCC28\uC9C0\uB79C\uC2A4", "\uC800\uACA9 \uBAA8\uB4DC"],
        isAvailable: true
      },
      {
        id: 6,
        name: "Ab-\uD2F0\uAC70",
        type: "Arbiter",
        variant: "Marksman",
        hp: 115,
        armor: 60,
        speed: 70,
        firepower: 85,
        range: 90,
        specialAbilities: ["\uC720\uD0C4 SMG", "\uC911\uAC70\uB9AC \uC9C0\uC6D0"],
        isAvailable: true
      },
      {
        id: 7,
        name: "Ab-\uC774\uAE00",
        type: "Arbiter",
        variant: "General",
        hp: 100,
        armor: 55,
        speed: 65,
        firepower: 70,
        range: 75,
        specialAbilities: ["\uAE30\uBCF8 \uC0AC\uACA9 \uBB34\uC7A5"],
        isAvailable: true
      },
      {
        id: 8,
        name: "Ab-\uD314\uCF58",
        type: "Arbiter",
        variant: "Scout",
        hp: 95,
        armor: 40,
        speed: 90,
        firepower: 60,
        range: 80,
        specialAbilities: ["\uB4DC\uB860 \uC2DC\uC2A4\uD15C", "\uC815\uCC30"],
        isAvailable: true
      },
      // Knight series
      {
        id: 9,
        name: "Kn-\uC13C\uCE04\uB9AC\uC628",
        type: "Knight",
        variant: "Melee",
        hp: 140,
        armor: 80,
        speed: 70,
        firepower: 75,
        range: 35,
        specialAbilities: ["\uD384\uC2A4 \uC18C\uB4DC"],
        isAvailable: true
      },
      {
        id: 10,
        name: "Kn-\uC5D0\uD034\uD14C\uC2A4",
        type: "Knight",
        variant: "Marksman",
        hp: 125,
        armor: 65,
        speed: 70,
        firepower: 85,
        range: 95,
        specialAbilities: ["\uC720\uB2C8\uCF58 \uB77C\uC774\uD50C"],
        isAvailable: true
      },
      {
        id: 11,
        name: "Kn-\uC2A4\uCFE0\uD23C",
        type: "Knight",
        variant: "General",
        hp: 120,
        armor: 70,
        speed: 60,
        firepower: 70,
        range: 60,
        specialAbilities: ["\uAE30\uBCF8 \uBCF5\uD569 \uBB34\uC7A5"],
        isAvailable: true
      },
      {
        id: 12,
        name: "Kn-\uD314\uB77C\uB518",
        type: "Knight",
        variant: "Support",
        hp: 130,
        armor: 75,
        speed: 60,
        firepower: 65,
        range: 50,
        specialAbilities: ["\uBCF4\uAC15 \uD544\uB4DC", "\uD300 \uC9C0\uC6D0"],
        isAvailable: true
      },
      // Instructor Specials (TH series)
      {
        id: 13,
        name: "TH-\uD0C0\uC774\uB7F0\uD2B8",
        type: "Knight",
        variant: "Brawler",
        hp: 170,
        armor: 120,
        speed: 50,
        firepower: 110,
        range: 30,
        specialAbilities: ["\uC591\uC190 \uD30C\uC6CC \uD53C\uC2A4\uD2B8", "\uADFC\uC811\uC804 \uD2B9\uD654"],
        isAvailable: true
      },
      {
        id: 14,
        name: "TH-\uD2B8\uB9AD",
        type: "Arbiter",
        variant: "Skirmisher",
        hp: 110,
        armor: 45,
        speed: 100,
        firepower: 95,
        range: 110,
        specialAbilities: ["\uD384\uC2A4 \uAD8C\uCD1D", "\uACE0\uAE30\uB3D9 \uC0AC\uACA9"],
        isAvailable: true
      }
    ];
    this.nextId = 100;
    this.formations = [
      // Trinity Squad formation
      {
        id: 1,
        teamId: 1,
        pilot1Id: 1,
        // 사샤 볼코프
        pilot2Id: 2,
        // 헬레나 파아라  
        pilot3Id: 3,
        // 아즈마
        mech1Id: 9,
        // Kn-센츄리온
        mech2Id: 10,
        // Kn-에퀴테스
        mech3Id: 1,
        // Rv-케식
        formation: "standard",
        isActive: true
      },
      // Steel Phoenixes formation
      {
        id: 2,
        teamId: 2,
        pilot1Id: 101,
        // 레이븐 스카이
        pilot2Id: 102,
        // 아이언 울프
        pilot3Id: 103,
        // 블레이즈 피닉스
        mech1Id: 5,
        // Ab-판저
        mech2Id: 13,
        // TH-타이런트
        mech3Id: 2,
        // Rv-칸
        formation: "aggressive",
        isActive: true
      }
    ];
  }
  // User management
  async getUser(id) {
    return this.users.find((u) => u.id === id);
  }
  async getUserByUsername(username) {
    return this.users.find((u) => u.username === username);
  }
  async createUser(user) {
    const newUser = { ...user, id: this.nextId++ };
    this.users.push(newUser);
    return newUser;
  }
  // Pilot management
  async getAllPilots() {
    return [...this.pilots];
  }
  async getPilot(id) {
    return this.pilots.find((p) => p.id === id);
  }
  async createPilot(pilot) {
    const newPilot = {
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
      morale: pilot.morale ?? 50
    };
    this.pilots.push(newPilot);
    return newPilot;
  }
  async updatePilot(id, updates) {
    const index = this.pilots.findIndex((p) => p.id === id);
    if (index === -1) return void 0;
    this.pilots[index] = { ...this.pilots[index], ...updates };
    return this.pilots[index];
  }
  async getActivePilots() {
    return this.pilots.filter((p) => p.isActive);
  }
  async getPilotsByTeam(teamId) {
    const teamFormation = this.formations.find((f) => f.teamId === teamId && f.isActive);
    if (!teamFormation) {
      return [];
    }
    const pilotIds = [];
    if (teamFormation.pilot1Id) pilotIds.push(teamFormation.pilot1Id);
    if (teamFormation.pilot2Id) pilotIds.push(teamFormation.pilot2Id);
    if (teamFormation.pilot3Id) pilotIds.push(teamFormation.pilot3Id);
    return this.pilots.filter((p) => pilotIds.includes(p.id));
  }
  // Mech management
  async getAllMechs() {
    return [...this.mechs];
  }
  async getMech(id) {
    return this.mechs.find((m) => m.id === id);
  }
  async createMech(mech) {
    const newMech = {
      ...mech,
      id: this.nextId++,
      specialAbilities: mech.specialAbilities || [],
      isAvailable: mech.isAvailable !== void 0 ? mech.isAvailable : true
    };
    this.mechs.push(newMech);
    return newMech;
  }
  async getAvailableMechs() {
    return this.mechs.filter((m) => m.isAvailable);
  }
  // Team management
  async getAllTeams() {
    return [...this.teams];
  }
  async getTeam(id) {
    return this.teams.find((t) => t.id === id);
  }
  async createTeam(team) {
    const newTeam = {
      ...team,
      id: this.nextId++,
      wins: 0,
      losses: 0,
      currentSeason: team.currentSeason !== void 0 ? team.currentSeason : 1,
      leagueRank: team.leagueRank !== void 0 ? team.leagueRank : 8,
      credits: team.credits !== void 0 ? team.credits : 1e4,
      reputation: team.reputation !== void 0 ? team.reputation : 0
    };
    this.teams.push(newTeam);
    return newTeam;
  }
  async updateTeam(id, updates) {
    const index = this.teams.findIndex((t) => t.id === id);
    if (index === -1) return void 0;
    this.teams[index] = { ...this.teams[index], ...updates };
    return this.teams[index];
  }
  // Formation management
  async getActiveFormation(teamId) {
    return this.formations.find((f) => f.teamId === teamId && f.isActive);
  }
  async createFormation(formation) {
    this.formations.forEach((f) => {
      if (f.teamId === formation.teamId) {
        f.isActive = false;
      }
    });
    const newFormation = {
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
      isActive: formation.isActive !== void 0 ? formation.isActive : false
    };
    this.formations.push(newFormation);
    return newFormation;
  }
  async updateFormation(id, updates) {
    const index = this.formations.findIndex((f) => f.id === id);
    if (index === -1) return void 0;
    this.formations[index] = { ...this.formations[index], ...updates };
    return this.formations[index];
  }
  // Battle management
  async createBattle(battle) {
    const newBattle = {
      ...battle,
      id: this.nextId++,
      teamAId: battle.teamAId || null,
      teamBId: battle.teamBId || null,
      winnerId: battle.winnerId || null,
      battleData: battle.battleData || null,
      status: battle.status || "pending",
      createdAt: /* @__PURE__ */ new Date(),
      completedAt: null
    };
    this.battles.push(newBattle);
    return newBattle;
  }
  async getBattle(id) {
    return this.battles.find((b) => b.id === id);
  }
  async updateBattle(id, updates) {
    const index = this.battles.findIndex((b) => b.id === id);
    if (index === -1) return void 0;
    this.battles[index] = { ...this.battles[index], ...updates };
    return this.battles[index];
  }
  async getTeamBattles(teamId) {
    return this.battles.filter((b) => b.teamAId === teamId || b.teamBId === teamId);
  }
  // Game state
  async getReconData(enemyTeamId) {
    const team = await this.getTeam(enemyTeamId);
    if (!team) {
      throw new Error("Team not found");
    }
    const formation = await this.getActiveFormation(enemyTeamId);
    const corePilotIds = [];
    if (formation) {
      [formation.pilot1Id, formation.pilot2Id, formation.pilot3Id].filter((id) => typeof id === "number").forEach((id) => corePilotIds.push(id));
    }
    const pilotRows = corePilotIds.length ? this.pilots.filter((p) => corePilotIds.includes(p.id)) : [];
    const compositions = [
      "Knight-Heavy",
      "River-Scout",
      "Arbiter-Sniper",
      "Balanced-Formation",
      "Aggressive-Rush",
      "Defensive-Wall"
    ];
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
      corePilots: pilotRows.map((p) => ({
        name: p.name,
        traits: p.traits.slice(0, 3),
        winRate: p.wins / Math.max(p.wins + p.losses, 1) || Math.random() * 0.3 + 0.5
      }))
    };
  }
  // Training methods
  async startPilotTraining(pilotId, trainingType) {
    const pilot = await this.getPilot(pilotId);
    if (!pilot) return void 0;
    const trainingDuration = 3e4;
    const trainingUntil = new Date(Date.now() + trainingDuration);
    return this.updatePilot(pilotId, {
      trainingUntil,
      trainingType,
      fatigue: Math.min(pilot.fatigue + 10, 100)
    });
  }
  async completePilotTraining(pilotId) {
    const pilot = await this.getPilot(pilotId);
    if (!pilot || !pilot.trainingType) return void 0;
    const statBonus = Math.floor(Math.random() * 3) + 1;
    let updates = {};
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
  async spendCredits(teamId, amount) {
    const team = await this.getTeam(teamId);
    if (!team || team.credits < amount) return void 0;
    return this.updateTeam(teamId, { credits: team.credits - amount });
  }
};

// server/storage.ts
var storage = new MemStorage();

// shared/schema.ts
import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var pilots = pgTable("pilots", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  callsign: text("callsign").notNull(),
  dormitory: text("dormitory").notNull(),
  // "Knight", "River", "Arbiter"
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
  morale: integer("morale").notNull().default(50)
});
var mechs = pgTable("mechs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  // "Knight", "River", "Arbiter"
  variant: text("variant").notNull(),
  // "Heavy", "Assault", "Sniper", etc.
  hp: integer("hp").notNull(),
  armor: integer("armor").notNull(),
  speed: integer("speed").notNull(),
  firepower: integer("firepower").notNull(),
  range: integer("range").notNull(),
  specialAbilities: text("special_abilities").array().notNull().default([]),
  isAvailable: boolean("is_available").notNull().default(true)
});
var teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  currentSeason: integer("current_season").notNull().default(1),
  leagueRank: integer("league_rank").notNull().default(8),
  credits: integer("credits").notNull().default(1e4),
  reputation: integer("reputation").notNull().default(0)
});
var battles = pgTable("battles", {
  id: serial("id").primaryKey(),
  teamAId: integer("team_a_id").references(() => teams.id),
  teamBId: integer("team_b_id").references(() => teams.id),
  winnerId: integer("winner_id").references(() => teams.id),
  battleData: jsonb("battle_data"),
  // Store complete battle log
  season: integer("season").notNull(),
  week: integer("week").notNull(),
  status: text("status").notNull().default("pending"),
  // "pending", "in_progress", "completed"
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at")
});
var formations = pgTable("formations", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id),
  pilot1Id: integer("pilot1_id").references(() => pilots.id),
  pilot2Id: integer("pilot2_id").references(() => pilots.id),
  pilot3Id: integer("pilot3_id").references(() => pilots.id),
  mech1Id: integer("mech1_id").references(() => mechs.id),
  mech2Id: integer("mech2_id").references(() => mechs.id),
  mech3Id: integer("mech3_id").references(() => mechs.id),
  formation: text("formation").notNull().default("standard"),
  // "standard", "aggressive", "defensive"
  isActive: boolean("is_active").notNull().default(false)
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var insertPilotSchema = createInsertSchema(pilots).omit({
  id: true
});
var insertMechSchema = createInsertSchema(mechs).omit({
  id: true
});
var insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  wins: true,
  losses: true
});
var insertBattleSchema = createInsertSchema(battles).omit({
  id: true,
  createdAt: true,
  completedAt: true
});
var insertFormationSchema = createInsertSchema(formations).omit({
  id: true
});

// shared/ai/utils.ts
var clamp = (value, min, max) => Math.max(min, Math.min(max, value));
function getTerrainAt(pos, terrainFeatures) {
  return terrainFeatures.find((t) => t.x === pos.x && t.y === pos.y) || null;
}
function getTerrainAttackBonus(pos, terrainFeatures) {
  const terrain = getTerrainAt(pos, terrainFeatures);
  if (terrain?.type === "elevation") return 0.2;
  return 0;
}
function getTerrainRangeBonus(pos, terrainFeatures) {
  const terrain = getTerrainAt(pos, terrainFeatures);
  if (terrain?.type === "elevation") return 1;
  return 0;
}
function calculateAttackRange(mechStats, terrainFeatures, pos) {
  let baseRange = 2;
  if (mechStats.firepower >= 85) baseRange = 4;
  else if (mechStats.firepower >= 70) baseRange = 3;
  baseRange += getTerrainRangeBonus(pos, terrainFeatures);
  return baseRange;
}
function canAttack(attacker, target, mechStats, terrainFeatures) {
  const distance = Math.abs(attacker.position.x - target.position.x) + Math.abs(attacker.position.y - target.position.y);
  const range = calculateAttackRange(mechStats, terrainFeatures, attacker.position);
  return distance <= range;
}
function findBestTacticalPosition(currentPos, team, enemies, allies, terrainFeatures, mechStats) {
  const possiblePositions = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      const newPos = {
        x: clamp(currentPos.x + dx, 1, 15),
        y: clamp(currentPos.y + dy, 1, 11)
      };
      const terrain = getTerrainAt(newPos, terrainFeatures);
      if (terrain?.type === "obstacle") continue;
      const occupied = [...enemies, ...allies].some(
        (unit) => unit.position.x === newPos.x && unit.position.y === newPos.y
      );
      if (occupied) continue;
      possiblePositions.push(newPos);
    }
  }
  if (possiblePositions.length === 0) return currentPos;
  const scoredPositions = possiblePositions.map((pos) => {
    let score = 0;
    const terrain = getTerrainAt(pos, terrainFeatures);
    if (terrain?.type === "elevation") score += 30;
    if (terrain?.type === "cover") score += 20;
    if (terrain?.type === "hazard") score -= 50;
    if (enemies.length > 0) {
      const nearestEnemyDist = Math.min(
        ...enemies.map(
          (e) => Math.abs(e.position.x - pos.x) + Math.abs(e.position.y - pos.y)
        )
      );
      if (mechStats.firepower >= 85) {
        score += nearestEnemyDist * 5;
      } else if (mechStats.speed >= 80) {
        score += nearestEnemyDist <= 3 ? nearestEnemyDist * 3 : (6 - nearestEnemyDist) * 2;
      } else {
        score += (5 - nearestEnemyDist) * 3;
      }
    }
    return { position: pos, score };
  });
  return scoredPositions.reduce(
    (best, current) => current.score > best.score ? current : best
  ).position;
}
function calculateRetreatPosition(pos, team, enemies, terrainFeatures) {
  const safeDirection = team === "ally" || team === "team1" ? -2 : 2;
  const retreatPos = {
    x: clamp(pos.x + safeDirection, 1, 15),
    y: clamp(pos.y + (Math.random() > 0.5 ? -1 : 1), 1, 11)
  };
  if (terrainFeatures) {
    const terrain = getTerrainAt(retreatPos, terrainFeatures);
    if (terrain?.type === "hazard") {
      return {
        x: clamp(pos.x + safeDirection, 1, 15),
        y: clamp(pos.y + (Math.random() > 0.5 ? 1 : -1), 1, 11)
      };
    }
  }
  return retreatPos;
}
function calculateScoutPosition(pos, team, enemies, terrainFeatures) {
  const scoutDirection = team === "ally" || team === "team1" ? 2 : -2;
  const scoutPos = {
    x: clamp(pos.x + scoutDirection, 1, 15),
    y: clamp(pos.y, 1, 11)
  };
  if (terrainFeatures) {
    const terrain = getTerrainAt(scoutPos, terrainFeatures);
    if (terrain?.type === "hazard") {
      return {
        x: scoutPos.x,
        y: clamp(pos.y + (Math.random() > 0.5 ? 1 : -1), 1, 11)
      };
    }
  }
  return scoutPos;
}
function calculateTacticalPosition(pos, team, enemies, allies = [], terrainFeatures, mechStats) {
  if (terrainFeatures && mechStats) {
    return findBestTacticalPosition(pos, team, enemies, allies, terrainFeatures, mechStats);
  }
  if (enemies.length === 0) {
    const direction = team === "ally" || team === "team1" ? 1 : -1;
    return {
      x: clamp(pos.x + direction, 1, 15),
      y: clamp(pos.y + (Math.random() > 0.5 ? 1 : -1), 1, 11)
    };
  }
  const nearestEnemy = enemies.reduce((prev, curr) => {
    const prevDist = Math.abs(prev.position.x - pos.x) + Math.abs(prev.position.y - pos.y);
    const currDist = Math.abs(curr.position.x - pos.x) + Math.abs(curr.position.y - pos.y);
    return currDist < prevDist ? curr : prev;
  });
  const optimalX = Math.floor((pos.x + nearestEnemy.position.x) / 2);
  const optimalY = Math.floor((pos.y + nearestEnemy.position.y) / 2);
  return {
    x: clamp(optimalX, 1, 15),
    y: clamp(optimalY, 1, 11)
  };
}
function selectBestTarget(enemies, attacker, personality, mechStats, terrainFeatures) {
  if (enemies.length === 0) throw new Error("No enemies provided");
  let attackableEnemies = enemies;
  if (mechStats && terrainFeatures) {
    attackableEnemies = enemies.filter(
      (enemy) => canAttack(attacker, enemy, mechStats, terrainFeatures)
    );
  }
  const targetPool = attackableEnemies.length > 0 ? attackableEnemies : enemies;
  if (personality && personality.aggressive > 0.7) {
    return targetPool.reduce((prev, curr) => curr.hp < prev.hp ? curr : prev);
  }
  if (personality && personality.tactical > 0.7) {
    return targetPool.reduce((prev, curr) => {
      let prevScore = (prev.hp ?? 100) + (Math.abs(prev.position.x - attacker.position.x) + Math.abs(prev.position.y - attacker.position.y)) * 3;
      let currScore = (curr.hp ?? 100) + (Math.abs(curr.position.x - attacker.position.x) + Math.abs(curr.position.y - attacker.position.y)) * 3;
      if (terrainFeatures) {
        const prevTerrain = getTerrainAt(prev.position, terrainFeatures);
        const currTerrain = getTerrainAt(curr.position, terrainFeatures);
        if (prevTerrain?.type === "cover") prevScore += 20;
        if (currTerrain?.type === "cover") currScore += 20;
      }
      return currScore < prevScore ? curr : prev;
    });
  }
  return targetPool.reduce((prev, curr) => {
    const prevDist = Math.abs(prev.position.x - attacker.position.x) + Math.abs(prev.position.y - attacker.position.y);
    const currDist = Math.abs(curr.position.x - attacker.position.x) + Math.abs(curr.position.y - attacker.position.y);
    return currDist < prevDist ? curr : prev;
  });
}

// shared/ai/decision.ts
var PERSONALITY_PRESETS = {
  S: { aggressive: 0.8, tactical: 0.6, supportive: 0.4 },
  M: { aggressive: 0.4, tactical: 0.9, supportive: 0.8 },
  A: { aggressive: 0.9, tactical: 0.3, supportive: 0.5 },
  E: { aggressive: 0.6, tactical: 0.5, supportive: 0.2 }
};
function calculateTerrainTacticalPriority(actor, terrainFeatures, enemies, mechStats) {
  const currentTerrain = getTerrainAt(actor.position, terrainFeatures);
  if (currentTerrain?.type === "elevation") {
    if (mechStats && mechStats.firepower >= 85) {
      return { priority: "HOLD_POSITION", bonus: 0.4 };
    }
    return { priority: "ATTACK", bonus: 0.3 };
  }
  if (currentTerrain?.type === "cover") {
    return { priority: "DEFEND", bonus: 0.2 };
  }
  if (currentTerrain?.type === "hazard") {
    return { priority: "RETREAT", bonus: 0.6 };
  }
  const nearbyElevation = terrainFeatures.find(
    (t) => t.type === "elevation" && Math.abs(t.x - actor.position.x) <= 2 && Math.abs(t.y - actor.position.y) <= 2
  );
  if (nearbyElevation && mechStats?.firepower && mechStats.firepower >= 70) {
    return { priority: "MOVE_TO_ELEVATION", bonus: 0.3 };
  }
  return { priority: "NORMAL", bonus: 0 };
}
function determineRangeBasedAction(actor, enemies, mechStats, terrainFeatures) {
  if (enemies.length === 0) {
    return { canAttackAny: false, shouldAdvance: false, shouldRetreat: false };
  }
  const attackableEnemies = enemies.filter(
    (enemy) => canAttack(actor, enemy, mechStats, terrainFeatures)
  );
  const nearestEnemyDistance = Math.min(
    ...enemies.map(
      (e) => Math.abs(e.position.x - actor.position.x) + Math.abs(e.position.y - actor.position.y)
    )
  );
  if (mechStats.firepower >= 85) {
    if (attackableEnemies.length > 0) {
      return { canAttackAny: true, shouldAdvance: false, shouldRetreat: false };
    }
    if (nearestEnemyDistance <= 2) {
      return { canAttackAny: false, shouldAdvance: false, shouldRetreat: true };
    }
    return { canAttackAny: false, shouldAdvance: true, shouldRetreat: false };
  }
  if (mechStats.speed >= 80) {
    if (attackableEnemies.length > 0) {
      return { canAttackAny: true, shouldAdvance: false, shouldRetreat: false };
    }
    return { canAttackAny: false, shouldAdvance: true, shouldRetreat: false };
  }
  if (attackableEnemies.length > 0) {
    return { canAttackAny: true, shouldAdvance: false, shouldRetreat: false };
  }
  return { canAttackAny: false, shouldAdvance: true, shouldRetreat: false };
}
function makeAIDecision(actor, battleState, team, options) {
  const rand = options.random ?? Math.random;
  const pilotInitial = options.getPilotInitial(actor.pilotId);
  const personality = PERSONALITY_PRESETS[pilotInitial] ?? PERSONALITY_PRESETS["E"];
  const mechStats = actor.mechId && options.getMechStats ? options.getMechStats(actor.mechId) : void 0;
  const terrainFeatures = options.terrainFeatures || [];
  const enemies = battleState.participants.filter((p) => {
    const isEnemy = team === "team1" || team === "ally" ? p.team === "team2" : p.team === "team1";
    return isEnemy && p.status !== "destroyed";
  });
  const allies = battleState.participants.filter((p) => {
    const isAlly = team === "team1" || team === "ally" ? p.team === "team1" : p.team === "team2";
    return isAlly && p.status !== "destroyed" && p.pilotId !== actor.pilotId;
  });
  const damagedAllies = allies.filter((a) => a.hp < 50);
  const nearbyEnemies = enemies.filter(
    (e) => Math.abs(e.position.x - actor.position.x) <= 2 && Math.abs(e.position.y - actor.position.y) <= 2
  );
  const terrainPriority = calculateTerrainTacticalPriority(actor, terrainFeatures, enemies, mechStats);
  const rangeAnalysis = mechStats ? determineRangeBasedAction(actor, enemies, mechStats, terrainFeatures) : { canAttackAny: true, shouldAdvance: false, shouldRetreat: false };
  if (terrainPriority.priority === "RETREAT" || actor.hp < 15 && rand() < 0.6) {
    return {
      type: "RETREAT",
      pilotId: actor.pilotId,
      newPosition: calculateRetreatPosition(actor.position, team, enemies, terrainFeatures),
      message: actor.hp < 15 ? "\uAE34\uAE09 \uD6C4\uD1F4! \uC7AC\uC815\uBE44 \uD544\uC694!" : "\uC704\uD5D8\uC9C0\uB300 \uC774\uD0C8!"
    };
  }
  if (rangeAnalysis.shouldRetreat && rand() < 0.4) {
    return {
      type: "RETREAT",
      pilotId: actor.pilotId,
      newPosition: calculateRetreatPosition(actor.position, team, enemies, terrainFeatures),
      message: "\uAC70\uB9AC \uC870\uC808! \uD6C4\uD1F4!"
    };
  }
  if (personality.supportive > 0.6 && damagedAllies.length && rand() < 0.25) {
    const target = damagedAllies[0];
    return {
      type: "SUPPORT",
      pilotId: actor.pilotId,
      targetId: target.pilotId,
      message: "\uC9C0\uC6D0 \uB098\uAC04\uB2E4! \uBC84\uD168!"
    };
  }
  if ((terrainPriority.priority === "HOLD_POSITION" || terrainPriority.priority === "DEFEND") && nearbyEnemies.length >= 1 && rand() < 0.3 + terrainPriority.bonus) {
    return {
      type: "DEFEND",
      pilotId: actor.pilotId,
      message: terrainPriority.priority === "HOLD_POSITION" ? "\uACE0\uC9C0 \uC0AC\uC218! \uD3EC\uC9C0\uC158 \uC720\uC9C0!" : "\uBC29\uC5B4 \uD0DC\uC138! \uACAC\uACE0\uD558\uAC8C!"
    };
  }
  if (terrainPriority.priority === "MOVE_TO_ELEVATION" && rand() < 0.25 + terrainPriority.bonus) {
    return {
      type: "SCOUT",
      pilotId: actor.pilotId,
      newPosition: calculateScoutPosition(actor.position, team, enemies, terrainFeatures),
      message: "\uACE0\uC9C0\uB300 \uD655\uBCF4! \uC720\uB9AC\uD55C \uC704\uCE58\uB85C!"
    };
  }
  if (personality.tactical > 0.7 && rand() < 0.25) {
    return {
      type: "SCOUT",
      pilotId: actor.pilotId,
      newPosition: calculateScoutPosition(actor.position, team, enemies, terrainFeatures),
      message: "\uC815\uCC30 \uC774\uB3D9! \uC0C1\uD669 \uD30C\uC545!"
    };
  }
  if (battleState.turn > 5 && rand() < 0.15) {
    const abilities = ["\uC624\uBC84\uB4DC\uB77C\uC774\uBE0C", "\uC815\uBC00 \uC870\uC900", "\uC77C\uC81C \uC0AC\uACA9", "\uC740\uD3D0 \uAE30\uB3D9"];
    const ability = abilities[Math.floor(rand() * abilities.length)];
    return {
      type: "SPECIAL",
      pilotId: actor.pilotId,
      ability,
      message: `${ability} \uBC1C\uB3D9!`
    };
  }
  if (rangeAnalysis.canAttackAny && enemies.length && rand() < 0.8) {
    const target = selectBestTarget(enemies, actor, personality, mechStats, terrainFeatures);
    const attackBonus = getTerrainAttackBonus(actor.position, terrainFeatures);
    const message = attackBonus > 0 ? "\uACE0\uC9C0\uB300\uC5D0\uC11C \uC0AC\uACA9! \uD0C0\uAC9F \uD655\uC778!" : "\uD0C0\uAC9F \uD655\uC778! \uACF5\uACA9 \uAC1C\uC2DC!";
    return {
      type: "ATTACK",
      pilotId: actor.pilotId,
      targetId: target.pilotId,
      message
    };
  }
  if (rangeAnalysis.shouldAdvance) {
    return {
      type: "MOVE",
      pilotId: actor.pilotId,
      newPosition: calculateTacticalPosition(actor.position, team, enemies, allies, terrainFeatures, mechStats),
      message: "\uC0AC\uAC70\uB9AC \uD655\uBCF4! \uD3EC\uC9C0\uC158 \uC774\uB3D9!"
    };
  }
  return {
    type: "MOVE",
    pilotId: actor.pilotId,
    newPosition: calculateTacticalPosition(actor.position, team, enemies, allies, terrainFeatures, mechStats),
    message: "\uC804\uC220\uC801 \uC7AC\uBC30\uCE58!"
  };
}

// server/domain/AISystem.ts
var DEFAULT_TERRAIN_FEATURES = [
  { x: 4, y: 3, type: "cover", effect: "\uBC29\uC5B4\uB825 +20%" },
  { x: 8, y: 5, type: "elevation", effect: "\uC0AC\uAC70\uB9AC +1" },
  { x: 12, y: 7, type: "obstacle", effect: "\uC774\uB3D9 \uC81C\uD55C" },
  { x: 6, y: 9, type: "hazard", effect: "\uD134\uB2F9 HP -5" },
  { x: 10, y: 2, type: "cover", effect: "\uBC29\uC5B4\uB825 +20%" }
];
var AISystem = class {
  storage;
  constructor(storage2) {
    this.storage = storage2;
  }
  makeSimpleDecision(participant, battleState, team) {
    const sharedDecision = makeAIDecision(participant, battleState, team, {
      getPilotInitial: (id) => {
        if (id === 1) return "S";
        if (id === 2) return "M";
        if (id === 3) return "A";
        return id >= 100 ? "E" : "A";
      },
      // 지형 정보 추가
      terrainFeatures: DEFAULT_TERRAIN_FEATURES,
      // 메카 스탯 조회 함수 - 실제 participant에서 가져오기
      getMechStats: (mechId) => {
        return {
          firepower: participant.firepower || 75,
          speed: participant.speed || 70,
          armor: participant.armor || 70
        };
      }
    });
    const pilotNames = {
      1: "\uC0AC\uC0E4 \uBCFC\uCF54\uD504",
      2: "\uD5EC\uB808\uB098 \uD30C\uC544\uB77C",
      3: "\uC544\uC988\uB9C8",
      4: "\uD558\uB098",
      5: "\uD30C\uC6B0\uC2A4\uD2B8",
      6: "\uBA58\uD14C",
      101: "\uB808\uC774\uBE10 \uC2A4\uCE74\uC774",
      102: "\uC544\uC774\uC5B8 \uC6B8\uD504",
      103: "\uBE14\uB808\uC774\uC988 \uD53C\uB2C9\uC2A4",
      104: "\uC2A4\uD1B0 \uB77C\uC774\uB354",
      105: "\uC100\uB3C4\uC6B0 \uD5CC\uD130",
      106: "\uD53C\uB2C9\uC2A4 \uC719"
    };
    const pilotName = pilotNames[participant.pilotId] || `Unit-${participant.pilotId}`;
    return {
      type: sharedDecision.type,
      pilotName,
      dialogue: sharedDecision.message,
      newPosition: sharedDecision.newPosition,
      targetIndex: sharedDecision.targetId !== void 0 ? battleState.participants.findIndex((p) => p.pilotId === sharedDecision.targetId) : void 0,
      actionData: sharedDecision.ability ? { abilityName: sharedDecision.ability } : void 0
    };
  }
  // Personality helper
  getPilotPersonality(pilotId) {
    const personalities = {
      1: {
        aggressive: 0.8,
        tactical: 0.6,
        supportive: 0.4,
        dialogues: {
          attack: ["\uBAA9\uD45C \uD655\uC778, \uC0AC\uACA9 \uAC1C\uC2DC!", "\uC774\uAC70\uB2E4!", "\uC815\uD655\uD788 \uB9DE\uCDB0\uC8FC\uB9C8!"],
          support: ["\uC9C0\uC6D0 \uC0AC\uACA9 \uC900\uBE44!", "\uCEE4\uBC84\uD574\uC904\uAC8C!", "\uB4A4\uB294 \uB9E1\uACA8!"],
          retreat: ["\uC7A0\uC2DC \uD6C4\uD1F4!", "\uC7AC\uC815\uBE44\uAC00 \uD544\uC694\uD574!", "\uD3EC\uC9C0\uC158 \uBCC0\uACBD!"],
          scout: ["\uC815\uCC30 \uB098\uAC04\uB2E4!", "\uC0C1\uD669 \uD30C\uC545 \uC911!", "\uC801 \uB3D9\uD5A5 \uD655\uC778!"]
        }
      },
      2: {
        aggressive: 0.4,
        tactical: 0.9,
        supportive: 0.8,
        dialogues: {
          attack: ["\uACC4\uC0B0\uB41C \uACF5\uACA9!", "\uC804\uC220\uC801 \uD0C0\uACA9!", "\uC57D\uC810\uC744 \uB178\uB9B0\uB2E4!"],
          support: ["\uB3D9\uB8CC\uB4E4 \uC0C1\uD0DC \uD655\uC778!", "\uC9C0\uC6D0\uC774 \uD544\uC694\uD574!", "\uD300\uC6CC\uD06C\uAC00 \uC911\uC694\uD574!"],
          retreat: ["\uC804\uB7B5\uC801 \uD6C4\uD1F4!", "\uC7AC\uBC30\uCE58 \uD544\uC694!", "\uC0C1\uD669 \uBD84\uC11D \uC911!"],
          scout: ["\uC815\uBCF4 \uC218\uC9D1 \uC911!", "\uC801 \uD328\uD134 \uBD84\uC11D!", "\uB370\uC774\uD130 \uD655\uC778!"]
        }
      },
      3: {
        aggressive: 0.9,
        tactical: 0.3,
        supportive: 0.5,
        dialogues: {
          attack: ["\uC804\uBA74 \uB3CC\uACA9!", "\uC815\uBA74 \uC2B9\uBD80\uB2E4!", "\uBC00\uC5B4\uBD99\uC778\uB2E4!"],
          support: ["\uAC19\uC774 \uAC00\uC790!", "\uD798\uB0B4!", "\uD3EC\uAE30\uD558\uC9C0 \uB9C8!"],
          retreat: ["\uC774\uB7F0, \uBB3C\uB7EC\uB098\uC57C\uACA0\uC5B4!", "\uB2E4\uC2DC \uAE30\uD68C\uB97C \uB178\uB9AC\uC790!", "\uC7AC\uCDA9\uC804 \uC2DC\uAC04!"],
          scout: ["\uC55E\uC7A5\uC11C\uACA0\uC5B4!", "\uAE38\uC744 \uC5F4\uC5B4\uC8FC\uACA0\uC5B4!", "\uB3CC\uD30C\uAD6C\uB97C \uCC3E\uC790!"]
        }
      }
    };
    return personalities[pilotId] || {
      aggressive: 0.5,
      tactical: 0.5,
      supportive: 0.5,
      dialogues: {
        attack: ["\uACF5\uACA9!", "\uC0AC\uACA9!", "\uD0C0\uACA9!"],
        support: ["\uC9C0\uC6D0!", "\uB3C4\uC6C0!", "\uCEE4\uBC84!"],
        retreat: ["\uD6C4\uD1F4!", "\uC774\uB3D9!", "\uC7AC\uBC30\uCE58!"],
        scout: ["\uC815\uCC30!", "\uD655\uC778!", "\uC218\uC0C9!"]
      }
    };
  }
  // Position helpers
  calculateNewPosition(current, team) {
    const dx = team === "team1" ? 1 : -1;
    return { x: Math.max(1, Math.min(15, current.x + dx)), y: current.y };
  }
  calculateRetreatPosition(current, team, enemies) {
    return calculateRetreatPosition(current, team, enemies);
  }
  calculateScoutPosition(current, team, enemies) {
    return calculateScoutPosition(current, team, enemies);
  }
  calculateTacticalPosition(current, team, enemies, allies) {
    return calculateTacticalPosition(current, team, enemies, allies);
  }
  selectBestTarget(enemies, attacker) {
    return selectBestTarget(enemies, attacker, { aggressive: 0.5, tactical: 0.5, supportive: 0.5 });
  }
  getSpecialEffect(ability) {
    switch (ability) {
      case "\uC624\uBC84\uB4DC\uB77C\uC774\uBE0C":
        return { attackMultiplier: 1.5, duration: 2 };
      case "\uC815\uBC00 \uC870\uC900":
        return { accuracyBonus: 0.3, duration: 3 };
      case "\uC77C\uC81C \uC0AC\uACA9":
        return { multiTarget: true, damageModifier: 0.7 };
      case "\uC740\uD3D0 \uAE30\uB3D9":
        return { evasionBonus: 0.4, duration: 2 };
      default:
        return {};
    }
  }
  // 적군 전술 선택 AI
  selectEnemyTactics(playerFormation, enemyMechs, enemyPilots) {
    const formations2 = [
      {
        name: "balanced",
        effects: [
          { stat: "firepower", modifier: 0 },
          { stat: "speed", modifier: 0 },
          { stat: "armor", modifier: 0 }
        ]
      },
      {
        name: "aggressive",
        effects: [
          { stat: "firepower", modifier: 15 },
          { stat: "speed", modifier: 10 },
          { stat: "armor", modifier: -5 }
        ]
      },
      {
        name: "defensive",
        effects: [
          { stat: "armor", modifier: 20 },
          { stat: "reaction", modifier: 10 },
          { stat: "firepower", modifier: -10 }
        ]
      },
      {
        name: "mobile",
        effects: [
          { stat: "speed", modifier: 25 },
          { stat: "reaction", modifier: 15 },
          { stat: "armor", modifier: -15 }
        ]
      }
    ];
    const counterStrategy = this.getCounterStrategy(playerFormation.name);
    const teamComposition = this.analyzeTeamComposition(enemyMechs, enemyPilots);
    const selectedFormation = formations2.find(
      (f) => f.name === counterStrategy || f.name === teamComposition
    ) || formations2[0];
    console.log(`AI selected formation: ${selectedFormation.name} as counter to player's ${playerFormation.name}`);
    return selectedFormation;
  }
  getCounterStrategy(playerFormation) {
    const counters = {
      "aggressive": "defensive",
      // 공격적이면 방어로 대응
      "defensive": "mobile",
      // 방어적이면 기동으로 대응  
      "mobile": "aggressive",
      // 기동적이면 공격으로 대응
      "balanced": "aggressive"
      // 균형이면 공격으로 압박
    };
    return counters[playerFormation] || "balanced";
  }
  analyzeTeamComposition(mechs2, pilots2) {
    const mechTypes = mechs2.reduce((acc, mech) => {
      acc[mech.type] = (acc[mech.type] || 0) + 1;
      return acc;
    }, {});
    const pilotTraits = pilots2.flatMap((p) => p.traits || []);
    const aggressiveCount = pilotTraits.filter((t) => t.includes("Aggressive")).length;
    const defensiveCount = pilotTraits.filter((t) => t.includes("Defensive")).length;
    if (mechTypes.Knight >= 2) return "defensive";
    if (mechTypes.River >= 2) return "mobile";
    if (mechTypes.Arbiter >= 2) return "aggressive";
    if (aggressiveCount > defensiveCount) return "aggressive";
    return "balanced";
  }
};

// server/domain/BattleEngine.ts
var BattleEngine = class {
  aiSystem;
  storage;
  constructor(storage2) {
    this.aiSystem = new AISystem(storage2);
    this.storage = storage2;
  }
  getTacticalFormation(tacticName) {
    const formations2 = {
      "balanced": {
        name: "balanced",
        effects: [
          { stat: "firepower", modifier: 0 },
          { stat: "speed", modifier: 0 },
          { stat: "armor", modifier: 0 }
        ]
      },
      "aggressive": {
        name: "aggressive",
        effects: [
          { stat: "firepower", modifier: 15 },
          { stat: "speed", modifier: 10 },
          { stat: "armor", modifier: -5 }
        ]
      },
      "defensive": {
        name: "defensive",
        effects: [
          { stat: "armor", modifier: 20 },
          { stat: "reaction", modifier: 10 },
          { stat: "firepower", modifier: -10 }
        ]
      },
      "mobile": {
        name: "mobile",
        effects: [
          { stat: "speed", modifier: 25 },
          { stat: "reaction", modifier: 15 },
          { stat: "armor", modifier: -15 }
        ]
      }
    };
    return formations2[tacticName] || formations2["balanced"];
  }
  async initializeBattle(formation1, formation2, playerTactics) {
    const battleId = `battle_${Date.now()}`;
    const participants = [];
    const playerFormation = this.getTacticalFormation(playerTactics || "balanced");
    const enemyFormation = this.aiSystem.selectEnemyTactics(
      playerFormation,
      formation2.pilots || [],
      formation2.pilots || []
    );
    if (formation1.pilots && Array.isArray(formation1.pilots)) {
      for (let index = 0; index < formation1.pilots.length; index++) {
        const pilotData = formation1.pilots[index];
        const pilot = await this.storage.getPilot(pilotData.pilotId);
        const mech = await this.storage.getMech(pilotData.mechId);
        if (pilot && mech) {
          participants.push({
            pilotId: pilot.id,
            mechId: mech.id,
            team: "team1",
            position: { x: 2, y: 2 + index * 2 },
            hp: mech.hp,
            maxHp: mech.hp,
            armor: mech.armor,
            speed: mech.speed,
            firepower: mech.firepower,
            range: mech.range,
            status: "active",
            pilotStats: {
              reaction: pilot.reaction,
              accuracy: pilot.accuracy,
              tactical: pilot.tactical,
              teamwork: pilot.teamwork,
              traits: pilot.traits
            }
          });
        }
      }
    } else if (formation1.pilot1Id) {
      for (let idx = 0; idx < 3; idx++) {
        const pid = formation1[`pilot${idx + 1}Id`];
        const mid = formation1[`mech${idx + 1}Id`];
        if (pid && mid) {
          const pilot = await this.storage.getPilot(pid);
          const mech = await this.storage.getMech(mid);
          if (pilot && mech) {
            participants.push({
              pilotId: pilot.id,
              mechId: mech.id,
              team: "team1",
              position: { x: 2, y: 2 + idx * 2 },
              hp: mech.hp,
              maxHp: mech.hp,
              armor: mech.armor,
              speed: mech.speed,
              firepower: mech.firepower,
              range: mech.range,
              status: "active",
              pilotStats: {
                reaction: pilot.reaction,
                accuracy: pilot.accuracy,
                tactical: pilot.tactical,
                teamwork: pilot.teamwork,
                traits: pilot.traits
              }
            });
          }
        }
      }
    }
    if (formation2.pilots && Array.isArray(formation2.pilots)) {
      for (let index = 0; index < formation2.pilots.length; index++) {
        const pilotData = formation2.pilots[index];
        const pilot = await this.storage.getPilot(pilotData.pilotId);
        const mech = await this.storage.getMech(pilotData.mechId);
        if (pilot && mech) {
          participants.push({
            pilotId: pilot.id,
            mechId: mech.id,
            team: "team2",
            position: { x: 17, y: 2 + index * 2 },
            hp: mech.hp,
            maxHp: mech.hp,
            armor: mech.armor,
            speed: mech.speed,
            firepower: mech.firepower,
            range: mech.range,
            status: "active",
            pilotStats: {
              reaction: pilot.reaction,
              accuracy: pilot.accuracy,
              tactical: pilot.tactical,
              teamwork: pilot.teamwork,
              traits: pilot.traits
            }
          });
        }
      }
    } else if (formation2.pilot1Id) {
      for (let idx = 0; idx < 3; idx++) {
        const pid = formation2[`pilot${idx + 1}Id`];
        const mid = formation2[`mech${idx + 1}Id`];
        if (pid && mid) {
          const pilot = await this.storage.getPilot(pid);
          const mech = await this.storage.getMech(mid);
          if (pilot && mech) {
            participants.push({
              pilotId: pilot.id,
              mechId: mech.id,
              team: "team2",
              position: { x: 17, y: 2 + idx * 2 },
              hp: mech.hp,
              maxHp: mech.hp,
              armor: mech.armor,
              speed: mech.speed,
              firepower: mech.firepower,
              range: mech.range,
              status: "active",
              pilotStats: {
                reaction: pilot.reaction,
                accuracy: pilot.accuracy,
                tactical: pilot.tactical,
                teamwork: pilot.teamwork,
                traits: pilot.traits
              }
            });
          }
        }
      }
    }
    const battleState = {
      id: battleId,
      phase: "preparation",
      turn: 0,
      participants,
      teamFormations: {
        team1: playerFormation,
        team2: enemyFormation
      },
      log: [
        {
          timestamp: Date.now(),
          type: "system",
          message: "\uC804\uD22C \uC2DC\uC2A4\uD15C \uCD08\uAE30\uD654 \uC644\uB8CC. \uBAA8\uB4E0 \uC720\uB2DB \uB300\uAE30 \uC911."
        },
        {
          timestamp: Date.now() + 1e3,
          type: "system",
          message: `\uC804\uC220 \uBD84\uC11D \uC644\uB8CC. \uC544\uAD70: ${playerFormation.name}, \uC801\uAD70: ${enemyFormation.name}`
        }
      ]
    };
    console.log(`Battle initialized - Player: ${playerFormation.name}, Enemy: ${enemyFormation.name}`);
    return battleState;
  }
  async runBattle(battleState, onUpdate) {
    battleState.phase = "active";
    onUpdate({ type: "PHASE_CHANGE", phase: "active" });
    const maxTurns = 50;
    let turn = 0;
    const interval = setInterval(() => {
      if (turn >= maxTurns || this.isBattleComplete(battleState)) {
        clearInterval(interval);
        battleState.phase = "completed";
        onUpdate({ type: "BATTLE_COMPLETE", winner: this.determineWinner(battleState) });
        return;
      }
      turn++;
      battleState.turn = turn;
      battleState.participants.forEach((participant) => {
        if (participant.status !== "destroyed") {
          const decision = this.aiSystem.makeSimpleDecision(
            participant,
            battleState,
            participant.team
          );
          this.executeAction(participant, decision, battleState);
        }
      });
      onUpdate({ type: "TURN_UPDATE", turn, participants: battleState.participants, recentLogs: battleState.log.slice(-3) });
    }, 2e3);
  }
  executeAction(participant, action, battleState) {
    const timestamp2 = Date.now();
    switch (action.type) {
      case "MOVE":
        participant.position = action.newPosition;
        battleState.log.push({ timestamp: timestamp2, type: "movement", message: action.dialogue, speaker: action.pilotName });
        break;
      case "ATTACK":
        const target = battleState.participants[action.targetIndex];
        if (target) {
          const attackerAccuracy = participant.pilotStats?.accuracy || 70;
          const attackerFirepower = participant.firepower || 75;
          const targetArmor = target.armor || 70;
          const targetPilotReaction = target.pilotStats?.reaction || 70;
          const hitChance = Math.max(0.1, Math.min(0.95, (attackerAccuracy - targetPilotReaction + 50) / 100));
          if (Math.random() < hitChance) {
            const baseDamage = Math.max(5, attackerFirepower - targetArmor + Math.random() * 20);
            const finalDamage = Math.floor(baseDamage);
            target.hp = Math.max(0, target.hp - finalDamage);
            if (target.hp === 0) target.status = "destroyed";
            else if (target.hp < target.maxHp * 0.3) target.status = "damaged";
            battleState.log.push({
              timestamp: timestamp2,
              type: "attack",
              message: `${action.dialogue} (${finalDamage} \uB370\uBBF8\uC9C0!)`,
              speaker: action.pilotName
            });
          } else {
            battleState.log.push({
              timestamp: timestamp2,
              type: "attack",
              message: `${action.dialogue} (\uBE57\uB098\uAC10!)`,
              speaker: action.pilotName
            });
          }
        }
        break;
      case "COMMUNICATE":
        battleState.log.push({ timestamp: timestamp2, type: "communication", message: action.dialogue, speaker: action.pilotName });
        break;
    }
  }
  isBattleComplete(state) {
    const team1Active = state.participants.filter((p) => p.team === "team1" && p.status !== "destroyed").length;
    const team2Active = state.participants.filter((p) => p.team === "team2" && p.status !== "destroyed").length;
    return team1Active === 0 || team2Active === 0;
  }
  determineWinner(state) {
    const t1 = state.participants.filter((p) => p.team === "team1" && p.status !== "destroyed").length;
    const t2 = state.participants.filter((p) => p.team === "team2" && p.status !== "destroyed").length;
    if (t1 > t2) return "team1";
    if (t2 > t1) return "team2";
    return "draw";
  }
};

// server/application/BattleUseCase.ts
var BattleUseCase = class {
  engine;
  constructor(storage2) {
    this.engine = new BattleEngine(storage2);
  }
  initializeBattle(formation1, formation2, playerTactics) {
    return this.engine.initializeBattle(formation1, formation2, playerTactics);
  }
  runBattle(battleState, onUpdate) {
    return this.engine.runBattle(battleState, onUpdate);
  }
};

// server/routes.ts
async function registerRoutes(app2) {
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  const battleEngine = new BattleUseCase(storage);
  const activeBattles = /* @__PURE__ */ new Map();
  wss.on("connection", (ws) => {
    console.log("Client connected to battle system");
    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        switch (message.type) {
          case "START_BATTLE":
            const battleId = `battle_${Date.now()}`;
            const battleState = await battleEngine.initializeBattle(message.formation1, message.formation2);
            activeBattles.set(battleId, battleState);
            ws.send(JSON.stringify({
              type: "BATTLE_STARTED",
              battleId,
              state: battleState
            }));
            battleEngine.runBattle(battleState, (update) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: "BATTLE_UPDATE",
                  battleId,
                  update
                }));
              }
            });
            break;
          case "JOIN_BATTLE":
            const existingBattle = activeBattles.get(message.battleId);
            if (existingBattle) {
              ws.send(JSON.stringify({
                type: "BATTLE_STATE",
                battleId: message.battleId,
                state: existingBattle
              }));
            }
            break;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });
    ws.on("close", () => {
      console.log("Client disconnected from battle system");
    });
  });
  app2.get("/api/pilots", async (req, res) => {
    try {
      const pilots2 = await storage.getAllPilots();
      res.json(pilots2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pilots" });
    }
  });
  app2.get("/api/pilots/active", async (req, res) => {
    try {
      const pilots2 = await storage.getActivePilots();
      res.json(pilots2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active pilots" });
    }
  });
  app2.get("/api/pilots/team/:teamId", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const pilots2 = await storage.getPilotsByTeam(teamId);
      res.json(pilots2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team pilots" });
    }
  });
  app2.get("/api/pilots/:id/analytics", async (req, res) => {
    try {
      const pilotId = parseInt(req.params.id);
      const pilot = await storage.getPilot(pilotId);
      if (!pilot) {
        return res.status(404).json({ error: "Pilot not found" });
      }
      const analytics = {
        pilot,
        performance: {
          winRate: pilot.wins / Math.max(pilot.wins + pilot.losses, 1),
          averageRating: pilot.rating,
          battleCount: pilot.wins + pilot.losses,
          experienceGrowth: pilot.experience,
          efficiency: {
            accuracy: pilot.accuracy,
            reaction: pilot.reaction,
            tactical: pilot.tactical,
            teamwork: pilot.teamwork
          }
        },
        career: {
          status: pilot.experience < 300 ? "\uC2E0\uC608" : pilot.experience < 700 ? "\uC77C\uBC18" : pilot.experience < 1200 ? "\uBCA0\uD14C\uB791" : "\uC5D0\uC774\uC2A4",
          specialization: pilot.traits.includes("KNIGHT") ? "Knight \uC804\uBB38" : pilot.traits.includes("ARBITER") ? "Arbiter \uC804\uBB38" : pilot.traits.includes("RIVER") ? "River \uC804\uBB38" : "\uBC94\uC6A9",
          strengths: pilot.accuracy > 85 ? ["\uC815\uD655\uB3C4"] : pilot.reaction > 85 ? ["\uBC18\uC751\uC18D\uB3C4"] : pilot.tactical > 85 ? ["\uC804\uC220"] : pilot.teamwork > 85 ? ["\uD300\uC6CC\uD06C"] : ["\uADE0\uD615"],
          growthPotential: pilot.traits.includes("ROOKIE") ? 85 : pilot.traits.includes("VETERAN") ? 60 : 75
        },
        recommendations: [
          pilot.fatigue > 60 ? "\uD734\uC2DD \uD544\uC694" : null,
          pilot.morale < 70 ? "\uC0AC\uAE30 \uC9C4\uC791" : null,
          pilot.accuracy < 70 ? "\uC815\uD655\uB3C4 \uD6C8\uB828" : null,
          pilot.tactical < 70 ? "\uC804\uC220 \uAD50\uC721" : null
        ].filter(Boolean)
      };
      res.json(analytics);
    } catch (error) {
      console.error("Error generating pilot analytics:", error);
      res.status(500).json({ error: "Failed to generate analytics" });
    }
  });
  app2.get("/api/pilots/recruitable", async (req, res) => {
    try {
      const allPilots = await storage.getAllPilots();
      const inactivePilots = allPilots.filter((pilot) => !pilot.isActive);
      const maxPilots = Math.min(4, inactivePilots.length);
      const selectedCount = Math.max(3, maxPilots);
      const shuffled = inactivePilots.sort(() => 0.5 - Math.random());
      const recruitablePilots = shuffled.slice(0, selectedCount).map((pilot) => ({
        ...pilot,
        cost: Math.floor(pilot.rating * 50) + 2e3,
        // Higher cost based on rating
        background: `${pilot.dormitory} \uAE30\uC219\uC0AC \uCD9C\uC2E0\uC758 \uC2E4\uB825\uC790`,
        specialAbility: pilot.traits.includes("ACE") ? "\uC5D0\uC774\uC2A4 \uD30C\uC77C\uB7FF \uD2B9\uC131" : pilot.traits.includes("VETERAN") ? "\uBCA0\uD14C\uB791 \uACBD\uD5D8" : pilot.traits.includes("GENIUS") ? "\uCC9C\uC7AC\uC801 \uC7AC\uB2A5" : pilot.traits.includes("ROOKIE") ? "\uC2E0\uC608 \uD30C\uC77C\uB7FF" : "\uADE0\uD615\uC7A1\uD78C \uB2A5\uB825"
      }));
      res.json(recruitablePilots);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recruitable pilots" });
    }
  });
  app2.post("/api/pilots/:id/rest", async (req, res) => {
    try {
      const pilotId = parseInt(req.params.id);
      const pilot = await storage.getPilot(pilotId);
      if (!pilot) {
        return res.status(404).json({ error: "Pilot not found" });
      }
      const fatigueReduction = Math.floor(Math.random() * 21) + 30;
      const moraleIncrease = Math.floor(Math.random() * 11) + 10;
      const updatedPilot = await storage.updatePilot(pilotId, {
        fatigue: Math.max(0, pilot.fatigue - fatigueReduction),
        morale: Math.min(100, pilot.morale + moraleIncrease)
      });
      res.json(updatedPilot);
    } catch (error) {
      console.error("Error resting pilot:", error);
      res.status(500).json({ error: "Failed to rest pilot" });
    }
  });
  app2.post("/api/pilots/:id/dismiss", async (req, res) => {
    try {
      const pilotId = parseInt(req.params.id);
      const pilot = await storage.getPilot(pilotId);
      if (!pilot) {
        return res.status(404).json({ error: "Pilot not found" });
      }
      const activePilots = await storage.getActivePilots();
      if (activePilots.length <= 3) {
        return res.status(400).json({ error: "Cannot dismiss pilot - minimum 3 active pilots required" });
      }
      const updatedPilot = await storage.updatePilot(pilotId, { isActive: false });
      res.json({ success: true, pilot: updatedPilot });
    } catch (error) {
      console.error("Error dismissing pilot:", error);
      res.status(500).json({ error: "Failed to dismiss pilot" });
    }
  });
  app2.get("/api/teams/:id/analytics", async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      const pilots2 = await storage.getActivePilots();
      const battles2 = await storage.getTeamBattles(teamId);
      const analytics = {
        team,
        season: {
          current: 3,
          week: 8,
          record: { wins: team.wins, losses: team.losses },
          winRate: team.wins / Math.max(team.wins + team.losses, 1),
          leagueRank: team.leagueRank,
          reputation: team.reputation
        },
        pilots: {
          count: pilots2.length,
          averageRating: pilots2.reduce((sum, p) => sum + p.rating, 0) / pilots2.length,
          averageExperience: pilots2.reduce((sum, p) => sum + p.experience, 0) / pilots2.length,
          averageFatigue: pilots2.reduce((sum, p) => sum + p.fatigue, 0) / pilots2.length,
          averageMorale: pilots2.reduce((sum, p) => sum + p.morale, 0) / pilots2.length,
          specializations: {
            knight: pilots2.filter((p) => p.traits.includes("KNIGHT")).length,
            arbiter: pilots2.filter((p) => p.traits.includes("ARBITER")).length,
            river: pilots2.filter((p) => p.traits.includes("RIVER")).length
          }
        },
        performance: {
          totalBattles: battles2.length,
          recentForm: battles2.slice(-5).map((b) => b.winnerId === teamId ? "W" : "L"),
          strengths: determineTeamStrengths(pilots2),
          weaknesses: determineTeamWeaknesses(pilots2),
          recommendations: generateTeamRecommendations(pilots2, team)
        },
        resources: {
          credits: team.credits,
          facilities: {
            trainingCenter: { level: 2, effect: "+10% \uD6C8\uB828 \uD6A8\uC728" },
            medicalBay: { level: 1, effect: "+5% \uD68C\uBCF5 \uC18D\uB3C4" },
            techLab: { level: 2, effect: "+8% \uBA54\uD06C \uC131\uB2A5" },
            dormitory: { level: 3, effect: "+15% \uD30C\uC77C\uB7FF \uC0AC\uAE30" }
          }
        },
        projections: {
          seasonOutlook: team.wins >= team.losses * 2 ? "\uC6B0\uC2B9 \uD6C4\uBCF4" : team.wins > team.losses ? "\uD50C\uB808\uC774\uC624\uD504 \uC9C4\uCD9C" : "\uC21C\uC704 \uAC1C\uC120 \uD544\uC694",
          budgetStatus: team.credits > 1e4 ? "\uC548\uC815\uC801" : team.credits > 5e3 ? "\uBCF4\uD1B5" : "\uAE34\uCD95 \uD544\uC694",
          developmentFocus: pilots2.some((p) => p.traits.includes("ROOKIE")) ? "\uC2E0\uC608 \uC721\uC131" : pilots2.filter((p) => p.experience > 1e3).length >= 3 ? "\uBCA0\uD14C\uB791 \uAD00\uB9AC" : "\uADE0\uD615 \uBC1C\uC804"
        }
      };
      res.json(analytics);
    } catch (error) {
      console.error("Error generating team analytics:", error);
      res.status(500).json({ error: "Failed to generate team analytics" });
    }
  });
  app2.get("/api/season/progress", async (req, res) => {
    try {
      const teams2 = await storage.getAllTeams();
      const trinitySquad = teams2.find((t) => t.name === "Trinity Squad");
      const pilots2 = await storage.getActivePilots();
      const seasonData = {
        current: {
          season: 3,
          week: 8,
          totalWeeks: 16
        },
        standings: teams2.map((team) => ({
          name: team.name,
          wins: team.wins,
          losses: team.losses,
          winRate: team.wins / Math.max(team.wins + team.losses, 1),
          rank: team.leagueRank
        })).sort((a, b) => a.rank - b.rank),
        playerTeam: {
          name: trinitySquad?.name || "Trinity Squad",
          performance: {
            wins: trinitySquad?.wins || 0,
            losses: trinitySquad?.losses || 0,
            rank: trinitySquad?.leagueRank || 8,
            credits: trinitySquad?.credits || 0
          },
          roster: {
            totalPilots: pilots2.length,
            readyPilots: pilots2.filter((p) => p.fatigue < 60).length,
            trainingPilots: pilots2.filter((p) => p.trainingUntil).length,
            averageRating: Math.round(pilots2.reduce((sum, p) => sum + p.rating, 0) / pilots2.length)
          }
        },
        milestones: [
          {
            name: "\uC2DC\uC98C \uC6B0\uC2B9",
            progress: Math.min((trinitySquad?.wins || 0) / 12 * 100, 100),
            requirement: "12\uC2B9 \uB2EC\uC131",
            reward: "50,000 \uD06C\uB808\uB527 + \uBA85\uC608"
          },
          {
            name: "\uD50C\uB808\uC774\uC624\uD504 \uC9C4\uCD9C",
            progress: Math.min((trinitySquad?.wins || 0) / 8 * 100, 100),
            requirement: "8\uC2B9 \uB2EC\uC131",
            reward: "20,000 \uD06C\uB808\uB527"
          },
          {
            name: "\uBCA0\uD14C\uB791 \uC721\uC131",
            progress: Math.min(pilots2.filter((p) => p.experience > 1e3).length / 3 * 100, 100),
            requirement: "\uBCA0\uD14C\uB791 \uD30C\uC77C\uB7FF 3\uBA85",
            reward: "\uD6C8\uB828 \uD6A8\uC728 \uC99D\uAC00"
          }
        ],
        upcomingEvents: [
          { week: 9, event: "vs Steel Phoenixes", difficulty: "\uC5B4\uB824\uC6C0" },
          { week: 10, event: "\uC2DC\uC124 \uC5C5\uADF8\uB808\uC774\uB4DC \uAE30\uD68C", type: "facility" },
          { week: 11, event: "vs Lightning Bolts", difficulty: "\uBCF4\uD1B5" },
          { week: 12, event: "\uC911\uAC04 \uD3C9\uAC00", type: "evaluation" }
        ]
      };
      res.json(seasonData);
    } catch (error) {
      console.error("Error generating season progress:", error);
      res.status(500).json({ error: "Failed to generate season progress" });
    }
  });
  function determineTeamStrengths(pilots2) {
    const strengths = [];
    const avgAccuracy = pilots2.reduce((sum, p) => sum + p.accuracy, 0) / pilots2.length;
    const avgReaction = pilots2.reduce((sum, p) => sum + p.reaction, 0) / pilots2.length;
    const avgTactical = pilots2.reduce((sum, p) => sum + p.tactical, 0) / pilots2.length;
    const avgTeamwork = pilots2.reduce((sum, p) => sum + p.teamwork, 0) / pilots2.length;
    if (avgAccuracy > 80) strengths.push("\uB192\uC740 \uC815\uD655\uB3C4");
    if (avgReaction > 80) strengths.push("\uBE60\uB978 \uBC18\uC751\uC18D\uB3C4");
    if (avgTactical > 80) strengths.push("\uB6F0\uC5B4\uB09C \uC804\uC220 \uC774\uD574");
    if (avgTeamwork > 80) strengths.push("\uAC15\uD55C \uD300\uC6CC\uD06C");
    if (pilots2.filter((p) => p.traits.includes("ACE")).length >= 2) strengths.push("\uC5D0\uC774\uC2A4 \uD30C\uC77C\uB7FF \uB2E4\uC218");
    if (pilots2.filter((p) => p.experience > 1e3).length >= 3) strengths.push("\uD48D\uBD80\uD55C \uACBD\uD5D8");
    return strengths.length > 0 ? strengths : ["\uADE0\uD615\uC7A1\uD78C \uD300"];
  }
  function determineTeamWeaknesses(pilots2) {
    const weaknesses = [];
    const avgFatigue = pilots2.reduce((sum, p) => sum + p.fatigue, 0) / pilots2.length;
    const avgMorale = pilots2.reduce((sum, p) => sum + p.morale, 0) / pilots2.length;
    const rookieCount = pilots2.filter((p) => p.traits.includes("ROOKIE")).length;
    if (avgFatigue > 60) weaknesses.push("\uB192\uC740 \uD53C\uB85C\uB3C4");
    if (avgMorale < 70) weaknesses.push("\uB0AE\uC740 \uC0AC\uAE30");
    if (rookieCount >= 3) weaknesses.push("\uACBD\uD5D8 \uBD80\uC871");
    if (pilots2.length < 5) weaknesses.push("\uBD80\uC871\uD55C \uB85C\uC2A4\uD130");
    const specializationCounts = {
      knight: pilots2.filter((p) => p.traits.includes("KNIGHT")).length,
      arbiter: pilots2.filter((p) => p.traits.includes("ARBITER")).length,
      river: pilots2.filter((p) => p.traits.includes("RIVER")).length
    };
    const minSpecialization = Math.min(...Object.values(specializationCounts));
    if (minSpecialization === 0) weaknesses.push("\uD2B9\uD654 \uBD80\uC871");
    return weaknesses.length > 0 ? weaknesses : ["\uD2B9\uBCC4\uD55C \uC57D\uC810 \uC5C6\uC74C"];
  }
  function generateTeamRecommendations(pilots2, team) {
    const recommendations = [];
    const avgFatigue = pilots2.reduce((sum, p) => sum + p.fatigue, 0) / pilots2.length;
    const avgMorale = pilots2.reduce((sum, p) => sum + p.morale, 0) / pilots2.length;
    const rookieCount = pilots2.filter((p) => p.traits.includes("ROOKIE")).length;
    if (avgFatigue > 60) recommendations.push("\uD300 \uD734\uC2DD \uC2DC\uAC04 \uB298\uB9AC\uAE30");
    if (avgMorale < 70) recommendations.push("\uC0AC\uAE30 \uC9C4\uC791 \uD65C\uB3D9 \uC2E4\uC2DC");
    if (rookieCount >= 2) recommendations.push("\uBCA0\uD14C\uB791 \uD30C\uC77C\uB7FF \uC601\uC785");
    if (team.credits > 15e3) recommendations.push("\uC2DC\uC124 \uC5C5\uADF8\uB808\uC774\uB4DC \uACE0\uB824");
    if (pilots2.length < 6) recommendations.push("\uB85C\uC2A4\uD130 \uD655\uC7A5");
    return recommendations.length > 0 ? recommendations : ["\uD604\uC7AC \uD300 \uC0C1\uD0DC \uC591\uD638"];
  }
  app2.get("/api/pilots/recruitable2", async (req, res) => {
    try {
      const recruitablePilots = [
        {
          id: 101,
          name: "\uAE40\uC900\uD638",
          callsign: "\uC2A4\uB098\uC774\uD37C",
          rating: 88,
          traits: ["ANALYTICAL", "SNIPER", "CAUTIOUS", "VETERAN"],
          teamId: null,
          status: "available",
          cost: 2500,
          requirements: ["\uC2B9\uB960 70% \uC774\uC0C1", "\uC2DC\uC98C 3\uC8FC \uC774\uC0C1"],
          specialAbility: "\uC7A5\uAC70\uB9AC \uC815\uBC00 \uC0AC\uACA9 \uC2DC \uCD94\uAC00 \uB370\uBBF8\uC9C0",
          background: "\uC804\uC9C1 \uAD70 \uC800\uACA9\uC218 \uCD9C\uC2E0\uC73C\uB85C \uB0C9\uC815\uD55C \uD310\uB2E8\uB825\uC744 \uBCF4\uC720"
        },
        {
          id: 102,
          name: "\uBC15\uBBFC\uC9C0",
          callsign: "\uC11C\uC9C0",
          rating: 85,
          traits: ["AGGRESSIVE", "ASSAULT", "INDEPENDENT", "ACE"],
          teamId: null,
          status: "available",
          cost: 3e3,
          requirements: ["\uB9AC\uADF8 \uC0C1\uC704 50%", "\uACF5\uACA9\uD615 \uAE30\uCCB4 \uBCF4\uC720"],
          specialAbility: "\uC5F0\uC18D \uACF5\uACA9 \uC2DC \uD654\uB825 \uC99D\uAC00",
          background: "\uC544\uCE74\uB370\uBBF8 \uC218\uC11D \uC878\uC5C5\uC0DD, \uACF5\uACA9\uC801\uC778 \uC804\uC220\uC744 \uC120\uD638"
        },
        {
          id: 103,
          name: "\uC774\uB3C4\uD604",
          callsign: "\uAC00\uB514\uC5B8",
          rating: 82,
          traits: ["DEFENSIVE", "KNIGHT", "COOPERATIVE", "ROOKIE"],
          teamId: null,
          status: "available",
          cost: 1800,
          requirements: ["\uAE30\uBCF8 \uC694\uAD6C\uC0AC\uD56D \uC5C6\uC74C"],
          specialAbility: "\uC544\uAD70 \uBCF4\uD638 \uC2DC \uBC29\uC5B4\uB825 \uC99D\uAC00",
          background: "\uC2E0\uC778\uC774\uC9C0\uB9CC \uB6F0\uC5B4\uB09C \uBC29\uC5B4 \uAC10\uAC01\uC744 \uAC00\uC9C4 \uC720\uB9DD\uC8FC"
        },
        {
          id: 104,
          name: "\uD55C\uC218\uC9C4",
          callsign: "\uD15C\uD398\uC2A4\uD2B8",
          rating: 90,
          traits: ["ANALYTICAL", "ARBITER", "INDEPENDENT", "GENIUS"],
          teamId: null,
          status: "available",
          cost: 4500,
          requirements: ["\uB9AC\uADF8 \uC0C1\uC704 25%", "\uC804\uC220 \uC9C0\uC218 80 \uC774\uC0C1"],
          specialAbility: "\uC804\uC7A5 \uBD84\uC11D\uC73C\uB85C \uD300 \uC804\uCCB4 \uC815\uD655\uB3C4 \uC99D\uAC00",
          background: "\uC804\uC220 \uBD84\uC11D\uC758 \uCC9C\uC7AC\uB85C \uBD88\uB9AC\uB294 \uC2E0\uC9C4 \uD30C\uC77C\uB7FF"
        },
        {
          id: 105,
          name: "\uCD5C\uBBFC\uD601",
          callsign: "\uBE14\uB9AC\uCE20",
          rating: 87,
          traits: ["AGGRESSIVE", "RIVER", "SCOUT", "VETERAN"],
          teamId: null,
          status: "available",
          cost: 3200,
          requirements: ["\uAE30\uB3D9\uC804 \uC2B9\uB9AC 5\uD68C \uC774\uC0C1"],
          specialAbility: "\uACE0\uC18D \uAE30\uB3D9 \uC2DC \uD68C\uD53C\uC728 \uB300\uD3ED \uC99D\uAC00",
          background: "\uAE30\uB3D9\uC804\uC758 \uB2EC\uC778\uC73C\uB85C \uC720\uBA85\uD55C \uBCA0\uD14C\uB791 \uD30C\uC77C\uB7FF"
        },
        {
          id: 106,
          name: "\uC815\uC544\uC5F0",
          callsign: "\uC624\uB77C\uD074",
          rating: 91,
          traits: ["ANALYTICAL", "SUPPORT", "COOPERATIVE", "ACE"],
          teamId: null,
          status: "available",
          cost: 5e3,
          requirements: ["\uB9AC\uADF8 \uC0C1\uC704 10%", "\uD300\uC6CC\uD06C \uC9C0\uC218 90 \uC774\uC0C1"],
          specialAbility: "\uC804\uC7A5 \uC608\uCE21\uC73C\uB85C \uD300 \uC804\uCCB4 \uBC18\uC751\uC18D\uB3C4 \uC99D\uAC00",
          background: "\uBBF8\uB798\uB97C \uC608\uCE21\uD558\uB294 \uB4EF\uD55C \uC9C1\uAC10\uC744 \uAC00\uC9C4 \uC5D0\uC774\uC2A4 \uD30C\uC77C\uB7FF"
        }
      ];
      res.json(recruitablePilots);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recruitable pilots" });
    }
  });
  app2.post("/api/pilots", async (req, res) => {
    try {
      const pilotData = insertPilotSchema.parse(req.body);
      const pilot = await storage.createPilot(pilotData);
      res.json(pilot);
    } catch (error) {
      res.status(400).json({ error: "Invalid pilot data" });
    }
  });
  app2.get("/api/pilots/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const pilot = await storage.getPilot(id);
      if (!pilot) {
        return res.status(404).json({ error: "Pilot not found" });
      }
      res.json(pilot);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pilot" });
    }
  });
  app2.get("/api/mechs", async (req, res) => {
    try {
      const mechs2 = await storage.getAllMechs();
      res.json(mechs2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mechs" });
    }
  });
  app2.get("/api/mechs/available", async (req, res) => {
    try {
      const mechs2 = await storage.getAvailableMechs();
      res.json(mechs2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch available mechs" });
    }
  });
  app2.get("/api/teams", async (req, res) => {
    try {
      const teams2 = await storage.getAllTeams();
      res.json(teams2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });
  app2.get("/api/teams/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const team = await storage.getTeam(id);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team" });
    }
  });
  app2.get("/api/formations/team/:teamId", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const formation = await storage.getActiveFormation(teamId);
      res.json(formation);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch formation" });
    }
  });
  app2.post("/api/formations", async (req, res) => {
    try {
      const formationData = insertFormationSchema.parse(req.body);
      const formation = await storage.createFormation(formationData);
      res.json(formation);
    } catch (error) {
      res.status(400).json({ error: "Invalid formation data" });
    }
  });
  app2.get("/api/formations/team/:teamId/full", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const formation = await storage.getActiveFormation(teamId);
      if (!formation) {
        return res.status(404).json({ error: "Formation not found" });
      }
      const pilotIds = [
        formation.pilot1Id,
        formation.pilot2Id,
        formation.pilot3Id
      ].filter((id) => typeof id === "number");
      const mechIds = [
        formation.mech1Id,
        formation.mech2Id,
        formation.mech3Id
      ].filter((id) => typeof id === "number");
      const pilots2 = await Promise.all(
        pilotIds.map((pid) => storage.getPilot(pid))
      );
      const mechs2 = await Promise.all(
        mechIds.map((mid) => storage.getMech(mid))
      );
      res.json({
        formation,
        pilots: pilots2.filter(Boolean),
        mechs: mechs2.filter(Boolean)
      });
    } catch (error) {
      console.error("Error fetching full formation:", error);
      res.status(500).json({ error: "Failed to fetch full formation" });
    }
  });
  app2.get("/api/recon/:enemyTeamId", async (req, res) => {
    try {
      const enemyTeamId = parseInt(req.params.enemyTeamId);
      const reconData = await storage.getReconData(enemyTeamId);
      res.json(reconData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reconnaissance data" });
    }
  });
  app2.get("/api/battles/team/:teamId", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const battles2 = await storage.getTeamBattles(teamId);
      res.json(battles2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team battles" });
    }
  });
  app2.post("/api/pilots/:pilotId/training", async (req, res) => {
    try {
      const pilotId = parseInt(req.params.pilotId);
      const { trainingType } = req.body;
      if (!trainingType || !["reaction", "accuracy", "tactical", "teamwork"].includes(trainingType)) {
        return res.status(400).json({ error: "Invalid training type" });
      }
      const pilot = await storage.startPilotTraining(pilotId, trainingType);
      if (!pilot) {
        return res.status(404).json({ error: "Pilot not found" });
      }
      res.json(pilot);
    } catch (error) {
      res.status(500).json({ error: "Failed to start training" });
    }
  });
  app2.post("/api/pilots/:pilotId/complete-training", async (req, res) => {
    try {
      const pilotId = parseInt(req.params.pilotId);
      const pilot = await storage.completePilotTraining(pilotId);
      if (!pilot) {
        return res.status(404).json({ error: "Pilot not found or not in training" });
      }
      res.json(pilot);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete training" });
    }
  });
  app2.post("/api/teams/:teamId/spend-credits", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const { amount } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }
      const team = await storage.spendCredits(teamId, amount);
      if (!team) {
        return res.status(400).json({ error: "Insufficient credits or team not found" });
      }
      res.json(team);
    } catch (error) {
      res.status(500).json({ error: "Failed to spend credits" });
    }
  });
  app2.post("/api/pilots/:pilotId/recruit", async (req, res) => {
    try {
      const pilotId = parseInt(req.params.pilotId);
      const pilot = await storage.getPilot(pilotId);
      if (!pilot || pilot.isActive) {
        return res.status(404).json({ error: "Pilot not found or already recruited" });
      }
      const cost = Math.floor(pilot.rating * 50) + 2e3;
      const teams2 = await storage.getAllTeams();
      const trinityTeam = teams2.find((team) => team.name === "Trinity Squad");
      if (!trinityTeam || trinityTeam.credits < cost) {
        return res.status(400).json({ error: "Insufficient credits" });
      }
      await storage.spendCredits(trinityTeam.id, cost);
      const recruitedPilot = await storage.updatePilot(pilotId, { isActive: true });
      if (!recruitedPilot) {
        return res.status(500).json({ error: "Failed to recruit pilot" });
      }
      res.json(recruitedPilot);
    } catch (error) {
      res.status(500).json({ error: "Failed to recruit pilot" });
    }
  });
  app2.post("/api/battle/start", async (req, res) => {
    try {
      const { formation1, formation2, playerTactics } = req.body;
      if (!formation1 || !formation2) {
        return res.status(400).json({ error: "Both formations are required" });
      }
      console.log("Starting battle with tactics:", playerTactics);
      const battleData = {
        season: 3,
        week: 8,
        teamAId: formation1.teamId || 1,
        teamBId: formation2.teamId || 2,
        status: "active",
        winnerId: null,
        battleData: {
          formation1,
          formation2,
          playerTactics: playerTactics || "balanced",
          startTime: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      const battle = await storage.createBattle(battleData);
      const battleState = await battleEngine.initializeBattle(formation1, formation2, playerTactics);
      activeBattles.set(battle.id.toString(), battleState);
      res.json({
        success: true,
        battleId: battle.id,
        message: "Battle started successfully",
        battleState
      });
    } catch (error) {
      console.error("Error starting battle:", error);
      res.status(500).json({ error: "Failed to start battle" });
    }
  });
  app2.get("/api/battle/:id", async (req, res) => {
    try {
      const battleId = parseInt(req.params.id);
      const battle = await storage.getBattle(battleId);
      if (!battle) {
        return res.status(404).json({ error: "Battle not found" });
      }
      const battleState = activeBattles.get(battleId.toString());
      res.json({
        battle,
        state: battleState || null,
        isActive: battleState ? battleState.phase !== "completed" : false
      });
    } catch (error) {
      console.error("Error fetching battle:", error);
      res.status(500).json({ error: "Failed to fetch battle" });
    }
  });
  app2.get("/api/battles/team/:teamId", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const battles2 = await storage.getTeamBattles(teamId);
      res.json(battles2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team battles" });
    }
  });
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      "@shared/domain": path.resolve(import.meta.dirname, "shared", "domain"),
      "@shared/ai": path.resolve(import.meta.dirname, "shared", "ai"),
      "@domain": path.resolve(import.meta.dirname, "shared", "domain")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 3001;
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
