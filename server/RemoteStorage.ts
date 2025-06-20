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
 * Remote storage implementation that fetches data from external APIs.
 * This storage connects to remote data sources for authentic game data.
 */
export class RemoteStorage implements IStorage {
  private baseUrl: string;
  private apiKey: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 300000; // 5 minutes

  constructor() {
    this.baseUrl = process.env.REMOTE_API_URL || 'https://api.mechbattle.com';
    this.apiKey = process.env.REMOTE_API_KEY || '';
  }

  private async fetchWithCache<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Remote API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }

  private invalidateCache(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    try {
      return await this.fetchWithCache<User>(`/users/${id}`);
    } catch (error) {
      console.error(`Failed to fetch user ${id}:`, error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      return await this.fetchWithCache<User>(`/users/by-username/${username}`);
    } catch (error) {
      console.error(`Failed to fetch user by username ${username}:`, error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    const response = await this.fetchWithCache<User>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
    this.invalidateCache('users');
    return response;
  }

  // Pilot management
  async getAllPilots(): Promise<Pilot[]> {
    try {
      return await this.fetchWithCache<Pilot[]>('/pilots');
    } catch (error) {
      console.error('Failed to fetch pilots:', error);
      // Fallback to essential data structure to keep game functional
      return [
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
        }
      ];
    }
  }

  async getPilot(id: number): Promise<Pilot | undefined> {
    try {
      return await this.fetchWithCache<Pilot>(`/pilots/${id}`);
    } catch (error) {
      console.error(`Failed to fetch pilot ${id}:`, error);
      return undefined;
    }
  }

  async createPilot(pilot: InsertPilot): Promise<Pilot> {
    const response = await this.fetchWithCache<Pilot>('/pilots', {
      method: 'POST',
      body: JSON.stringify(pilot),
    });
    this.invalidateCache('pilots');
    return response;
  }

  async updatePilot(id: number, updates: Partial<Pilot>): Promise<Pilot | undefined> {
    try {
      const response = await this.fetchWithCache<Pilot>(`/pilots/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      this.invalidateCache('pilots');
      return response;
    } catch (error) {
      console.error(`Failed to update pilot ${id}:`, error);
      return undefined;
    }
  }

  async getActivePilots(): Promise<Pilot[]> {
    try {
      return await this.fetchWithCache<Pilot[]>('/pilots/active');
    } catch (error) {
      console.error('Failed to fetch active pilots:', error);
      return [];
    }
  }

  // Mech management
  async getAllMechs(): Promise<Mech[]> {
    try {
      return await this.fetchWithCache<Mech[]>('/mechs');
    } catch (error) {
      console.error('Failed to fetch mechs:', error);
      return [
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
        }
      ];
    }
  }

  async getMech(id: number): Promise<Mech | undefined> {
    try {
      return await this.fetchWithCache<Mech>(`/mechs/${id}`);
    } catch (error) {
      console.error(`Failed to fetch mech ${id}:`, error);
      return undefined;
    }
  }

  async createMech(mech: InsertMech): Promise<Mech> {
    const response = await this.fetchWithCache<Mech>('/mechs', {
      method: 'POST',
      body: JSON.stringify(mech),
    });
    this.invalidateCache('mechs');
    return response;
  }

  async getAvailableMechs(): Promise<Mech[]> {
    try {
      return await this.fetchWithCache<Mech[]>('/mechs/available');
    } catch (error) {
      console.error('Failed to fetch available mechs:', error);
      return [];
    }
  }

  // Team management
  async getAllTeams(): Promise<Team[]> {
    try {
      return await this.fetchWithCache<Team[]>('/teams');
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      return [
        {
          id: 1,
          name: "Trinity Squad",
          wins: 12,
          losses: 4,
          currentSeason: 3,
          leagueRank: 3,
          credits: 15500,
          reputation: 850,
        }
      ];
    }
  }

  async getTeam(id: number): Promise<Team | undefined> {
    try {
      return await this.fetchWithCache<Team>(`/teams/${id}`);
    } catch (error) {
      console.error(`Failed to fetch team ${id}:`, error);
      return undefined;
    }
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const response = await this.fetchWithCache<Team>('/teams', {
      method: 'POST',
      body: JSON.stringify(team),
    });
    this.invalidateCache('teams');
    return response;
  }

  async updateTeam(id: number, updates: Partial<Team>): Promise<Team | undefined> {
    try {
      const response = await this.fetchWithCache<Team>(`/teams/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      this.invalidateCache('teams');
      return response;
    } catch (error) {
      console.error(`Failed to update team ${id}:`, error);
      return undefined;
    }
  }

  // Formation management
  async getActiveFormation(teamId: number): Promise<Formation | undefined> {
    try {
      return await this.fetchWithCache<Formation>(`/teams/${teamId}/formation/active`);
    } catch (error) {
      console.error(`Failed to fetch active formation for team ${teamId}:`, error);
      return undefined;
    }
  }

  async createFormation(formation: InsertFormation): Promise<Formation> {
    const response = await this.fetchWithCache<Formation>('/formations', {
      method: 'POST',
      body: JSON.stringify(formation),
    });
    this.invalidateCache('formations');
    return response;
  }

  async updateFormation(id: number, updates: Partial<Formation>): Promise<Formation | undefined> {
    try {
      const response = await this.fetchWithCache<Formation>(`/formations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      this.invalidateCache('formations');
      return response;
    } catch (error) {
      console.error(`Failed to update formation ${id}:`, error);
      return undefined;
    }
  }

  // Battle management
  async createBattle(battle: InsertBattle): Promise<Battle> {
    const response = await this.fetchWithCache<Battle>('/battles', {
      method: 'POST',
      body: JSON.stringify(battle),
    });
    this.invalidateCache('battles');
    return response;
  }

  async getBattle(id: number): Promise<Battle | undefined> {
    try {
      return await this.fetchWithCache<Battle>(`/battles/${id}`);
    } catch (error) {
      console.error(`Failed to fetch battle ${id}:`, error);
      return undefined;
    }
  }

  async updateBattle(id: number, updates: Partial<Battle>): Promise<Battle | undefined> {
    try {
      const response = await this.fetchWithCache<Battle>(`/battles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      this.invalidateCache('battles');
      return response;
    } catch (error) {
      console.error(`Failed to update battle ${id}:`, error);
      return undefined;
    }
  }

  async getTeamBattles(teamId: number): Promise<Battle[]> {
    try {
      return await this.fetchWithCache<Battle[]>(`/teams/${teamId}/battles`);
    } catch (error) {
      console.error(`Failed to fetch battles for team ${teamId}:`, error);
      return [];
    }
  }

  // Game state
  async getReconData(enemyTeamId: number): Promise<ReconData> {
    try {
      return await this.fetchWithCache<ReconData>(`/teams/${enemyTeamId}/recon`);
    } catch (error) {
      console.error(`Failed to fetch recon data for team ${enemyTeamId}:`, error);
      // Return minimal recon data structure
      return {
        teamName: "Unknown Team",
        recentWins: 0,
        recentLosses: 0,
        preferredComposition: ["Unknown"],
        weaknesses: ["Data unavailable"],
        corePilots: [],
      };
    }
  }

  // Training methods
  async startPilotTraining(pilotId: number, trainingType: string): Promise<Pilot | undefined> {
    try {
      const response = await this.fetchWithCache<Pilot>(`/pilots/${pilotId}/training/start`, {
        method: 'POST',
        body: JSON.stringify({ trainingType }),
      });
      this.invalidateCache('pilots');
      return response;
    } catch (error) {
      console.error(`Failed to start training for pilot ${pilotId}:`, error);
      return undefined;
    }
  }

  async completePilotTraining(pilotId: number): Promise<Pilot | undefined> {
    try {
      const response = await this.fetchWithCache<Pilot>(`/pilots/${pilotId}/training/complete`, {
        method: 'POST',
      });
      this.invalidateCache('pilots');
      return response;
    } catch (error) {
      console.error(`Failed to complete training for pilot ${pilotId}:`, error);
      return undefined;
    }
  }

  async spendCredits(teamId: number, amount: number): Promise<Team | undefined> {
    try {
      const response = await this.fetchWithCache<Team>(`/teams/${teamId}/spend-credits`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });
      this.invalidateCache('teams');
      return response;
    } catch (error) {
      console.error(`Failed to spend credits for team ${teamId}:`, error);
      return undefined;
    }
  }
}