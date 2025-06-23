import { create } from "zustand";
import { apiRequest } from "../lib/queryClient";
import type {
  Pilot,
  Mech,
  Team,
  Formation,
  GameScene,
} from "../../../shared/schema";

// Local type definitions
interface TerrainFeature {
  x: number;
  y: number;
  type: "cover" | "obstacle" | "elevation" | "hazard";
  effect: string;
}

interface PilotInfo {
  id: number;
  name: string;
  callsign: string;
  team: "ally" | "enemy";
  initial: string;
}

// Hardcoded terrain data (can be moved to server config later)
const TFM_TERRAIN_FEATURES: TerrainFeature[] = [
  { x: 4, y: 3, type: "cover", effect: "방어력 +20%" },
  { x: 8, y: 5, type: "elevation", effect: "사거리 +1" },
  { x: 12, y: 7, type: "obstacle", effect: "이동 제한" },
  { x: 6, y: 9, type: "hazard", effect: "턴당 HP -5" },
  { x: 10, y: 2, type: "cover", effect: "방어력 +20%" },
];

interface GameState {
  currentScene: GameScene;
  currentSeason: number;
  currentWeek: number;
  playerTeam: Team | null;
  pilots: Pilot[];
  enemyPilots: Pilot[];
  mechs: Mech[];
  terrainFeatures: TerrainFeature[];
  activeFormation: Formation | null;
  enemyTeams: Team[];
  
  // 전술 정보 추가
  playerTacticalFormation: string;

  // Ban/Pick results
  selectedMechs: {
    player: Mech[];
    enemy: Mech[];
  };

  // Actions
  setScene: (scene: GameScene) => void;
  initializeGameData: () => Promise<void>;
  setPlayerTeam: (team: Team) => void;
  setPilots: (pilots: Pilot[]) => void;
  setEnemyPilots: (pilots: Pilot[]) => void;
  setMechs: (mechs: Mech[]) => void;
  setActiveFormation: (formation: Formation | null) => void;
  setEnemyTeams: (teams: Team[]) => void;
  setSelectedMechs: (mechs: { player: Mech[]; enemy: Mech[] }) => void;
  setPlayerTacticalFormation: (formation: string) => void;
  initializePlayerTeam: () => Promise<void>;
  loadEnemyPilots: () => Promise<void>;
  getPilotInfo: (pilotId: number) => PilotInfo;

  // 전투 상태를 고려한 파일럿 정보 가져오기
  getPilotInfoWithBattle: (pilotId: number, battleParticipants?: any[]) => PilotInfo;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentScene: "hub",
  currentSeason: 3,
  currentWeek: 8,
  playerTeam: null,
  pilots: [],
  enemyPilots: [],
  mechs: [],
  terrainFeatures: TFM_TERRAIN_FEATURES,
  activeFormation: null,
  enemyTeams: [],
  playerTacticalFormation: "",
  selectedMechs: {
    player: [],
    enemy: [],
  },

  setScene: (scene: GameScene) => set({ currentScene: scene }),

  initializeGameData: async () => {
    try {
      const [pilotsRes, mechsRes, teamsRes, enemyPilotsRes] = await Promise.all([
        apiRequest("GET", "/api/pilots"),
        apiRequest("GET", "/api/mechs"),
        apiRequest("GET", "/api/teams"),
        apiRequest("GET", "/api/pilots/team/2"), // 적군 파일럿 로드
      ]);

      const pilots = await pilotsRes.json();
      const mechs = await mechsRes.json();
      const teams = await teamsRes.json();
      const enemyPilots = await enemyPilotsRes.json();

      set({
        pilots,
        enemyPilots,
        mechs,
        enemyTeams: teams.filter((t: Team) => t.id !== 1), // Assuming player is team 1
        playerTeam: teams.find((t: Team) => t.id === 1) || null,
      });
      
      console.log("Game data initialized - pilots:", pilots.length, "enemy pilots:", enemyPilots.length);
    } catch (error) {
      console.error("Failed to initialize game data", error);
    }
  },

  setPlayerTeam: (team: Team) => set({ playerTeam: team }),
  setPilots: (pilots: Pilot[]) => set({ pilots }),
  setEnemyPilots: (pilots: Pilot[]) => set({ enemyPilots: pilots }),
  setMechs: (mechs: Mech[]) => set({ mechs }),
  setActiveFormation: (formation: Formation | null) =>
    set({ activeFormation: formation }),
  setEnemyTeams: (teams: Team[]) => set({ enemyTeams: teams }),
  setSelectedMechs: (mechs: { player: Mech[]; enemy: Mech[] }) =>
    set({ selectedMechs: mechs }),
  setPlayerTacticalFormation: (formation: string) => set({ playerTacticalFormation: formation }),

  initializePlayerTeam: async () => {
    if (get().playerTeam) return;

    try {
      const res = await apiRequest("GET", "/api/teams/1");
      const playerTeam = await res.json();

      const pilotsRes = await apiRequest("GET", "/api/pilots");
      const pilots = await pilotsRes.json();

      set({
        playerTeam,
        pilots,
      });
    } catch (error) {
      console.error("Failed to initialize player team:", error);
    }
  },

  loadEnemyPilots: async () => {
    try {
      const res = await apiRequest("GET", "/api/pilots/team/2");
      const enemyPilots = await res.json();
      set({ enemyPilots });
      console.log("Loaded enemy pilots:", enemyPilots);
    } catch (error) {
      console.error("Failed to load enemy pilots:", error);
    }
  },

  getPilotInfo: (pilotId: number): PilotInfo => {
    const { pilots, enemyPilots } = get();
    
    console.log(`getPilotInfo called with pilotId: ${pilotId}`);
    
    // 아군 파일럿 확인
    const found = pilots.find((p: Pilot) => p.id === pilotId);
    if (found) {
      console.log(`Found ally pilot in local store: ${found.name}`);
      return {
        id: found.id,
        name: found.name,
        callsign: found.callsign,
        team: "ally",
        initial: found.name.charAt(0).toUpperCase(),
      };
    }

    // 적군 파일럿 확인
    const enemyFound = enemyPilots.find((p: Pilot) => p.id === pilotId);
    if (enemyFound) {
      console.log(`Found enemy pilot in store: ${enemyFound.name}`);
      return {
        id: enemyFound.id,
        name: enemyFound.name,
        callsign: enemyFound.callsign,
        team: "enemy",
        initial: enemyFound.name.charAt(0).toUpperCase(),
      };
    }

    // 파일럿을 찾을 수 없는 경우
    console.log(`Pilot ${pilotId} not found in any team data`);
    return {
      id: pilotId,
      name: `Unknown Pilot ${pilotId}`,
      callsign: `UNK-${pilotId}`,
      team: "ally", // 기본값
      initial: "U",
    };
  },

  // 전투 상태를 고려한 파일럿 정보 가져오기
  getPilotInfoWithBattle: (pilotId: number, battleParticipants?: any[]) => {
    const basicInfo = get().getPilotInfo(pilotId);
    
    // 전투 참가자 정보가 있으면 실제 팀 정보 사용
    if (battleParticipants) {
      const participant = battleParticipants.find(p => p.pilotId === pilotId);
      if (participant) {
        return {
          ...basicInfo,
          team: participant.team === 'team1' ? 'ally' : 'enemy'
        };
      }
    }
    
    return basicInfo;
  },
}));
