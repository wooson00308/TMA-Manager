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
  mechs: Mech[];
  terrainFeatures: TerrainFeature[];
  activeFormation: Formation | null;
  enemyTeams: Team[];

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
  setMechs: (mechs: Mech[]) => void;
  setActiveFormation: (formation: Formation | null) => void;
  setEnemyTeams: (teams: Team[]) => void;
  setSelectedMechs: (mechs: { player: Mech[]; enemy: Mech[] }) => void;
  initializePlayerTeam: () => Promise<void>;
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
  mechs: [],
  terrainFeatures: TFM_TERRAIN_FEATURES,
  activeFormation: null,
  enemyTeams: [],
  selectedMechs: {
    player: [],
    enemy: [],
  },

  setScene: (scene: GameScene) => set({ currentScene: scene }),

  initializeGameData: async () => {
    try {
      const [pilotsRes, mechsRes, teamsRes] = await Promise.all([
        apiRequest("GET", "/api/pilots"),
        apiRequest("GET", "/api/mechs"),
        apiRequest("GET", "/api/teams"),
      ]);

      const pilots = await pilotsRes.json();
      const mechs = await mechsRes.json();
      const teams = await teamsRes.json();

      set({
        pilots,
        mechs,
        enemyTeams: teams.filter((t: Team) => t.id !== 1), // Assuming player is team 1
        playerTeam: teams.find((t: Team) => t.id === 1) || null,
      });
    } catch (error) {
      console.error("Failed to initialize game data", error);
    }
  },

  setPlayerTeam: (team: Team) => set({ playerTeam: team }),
  setPilots: (pilots: Pilot[]) => set({ pilots }),
  setMechs: (mechs: Mech[]) => set({ mechs }),
  setActiveFormation: (formation: Formation | null) =>
    set({ activeFormation: formation }),
  setEnemyTeams: (teams: Team[]) => set({ enemyTeams: teams }),
  setSelectedMechs: (mechs: { player: Mech[]; enemy: Mech[] }) =>
    set({ selectedMechs: mechs }),

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

  getPilotInfo: (pilotId: number): PilotInfo => {
    const { pilots } = get();
    const found = pilots.find((p: Pilot) => p.id === pilotId);
    if (found) {
      // All pilots held in the local store belong to the player's roster, therefore they are allies.
      return {
        id: found.id,
        name: found.name,
        callsign: found.callsign,
        team: "ally",
        initial: found.name.charAt(0).toUpperCase(),
      };
    }

    // 하드코딩된 적군 정보 - 실제로는 서버에서 가져와야 함
    // 임시로 적군 파일럿 정보 생성
    if (pilotId >= 100) {
      const enemyNames = ['Raven', 'Wolf', 'Blaze', 'Storm', 'Shadow', 'Phoenix'];
      const enemyCallsigns = ['RAVEN-01', 'WOLF-02', 'BLAZE-03', 'STORM-04', 'SHADOW-05', 'PHOENIX-06'];
      const index = (pilotId - 101) % enemyNames.length;
      
      return {
        id: pilotId,
        name: enemyNames[index] || `Enemy ${pilotId}`,
        callsign: enemyCallsigns[index] || `E-${pilotId}`,
        team: "enemy",
        initial: (enemyNames[index] || `E${pilotId}`).charAt(0).toUpperCase(),
      };
    }

    // 기본값 - 알 수 없는 파일럿
    return {
      id: pilotId,
      name: `Unknown Pilot ${pilotId}`,
      callsign: `UNK-${pilotId}`,
      team: "ally", // 기본값은 아군으로 설정
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
