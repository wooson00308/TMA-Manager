import { create } from 'zustand';
import { type GameScene, type Pilot, type Mech, type Team, type Formation } from '@shared/schema';

interface GameFlowState {
  banPickCompleted: boolean;
  formationCompleted: boolean;
  battleCompleted: boolean;
  selectedMechs: Mech[];
  bannedMechs: Mech[];
}

interface GameState {
  currentScene: GameScene;
  currentSeason: number;
  currentWeek: number;
  playerTeam: Team | null;
  pilots: Pilot[];
  mechs: Mech[];
  activeFormation: Formation | null;
  enemyTeams: Team[];
  gameFlow: GameFlowState;
  
  // Actions
  setScene: (scene: GameScene) => void;
  setPlayerTeam: (team: Team) => void;
  setPilots: (pilots: Pilot[]) => void;
  setMechs: (mechs: Mech[]) => void;
  setActiveFormation: (formation: Formation | null) => void;
  setEnemyTeams: (teams: Team[]) => void;
  initializePlayerTeam: () => Promise<void>;
  
  // Game flow actions
  completeBanPick: (selectedMechs: Mech[], bannedMechs: Mech[]) => void;
  completeFormation: () => void;
  completeBattle: () => void;
  resetGameFlow: () => void;
  canAccessScene: (scene: GameScene) => boolean;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentScene: 'hub',
  currentSeason: 3,
  currentWeek: 7,
  playerTeam: null,
  pilots: [],
  mechs: [],
  activeFormation: null,
  enemyTeams: [],

  setScene: (scene) => set({ currentScene: scene }),
  setPlayerTeam: (team) => set({ playerTeam: team }),
  setPilots: (pilots) => set({ pilots }),
  setMechs: (mechs) => set({ mechs }),
  setActiveFormation: (formation) => set({ activeFormation: formation }),
  setEnemyTeams: (teams) => set({ enemyTeams: teams }),
  
  initializePlayerTeam: async () => {
    try {
      // Fetch all teams and set Trinity Squad as player team
      const response = await fetch('/api/teams');
      const teams = await response.json();
      
      const trinitySquad = teams.find((team: Team) => team.name === 'Trinity Squad');
      const otherTeams = teams.filter((team: Team) => team.name !== 'Trinity Squad');
      
      if (trinitySquad) {
        set({ playerTeam: trinitySquad, enemyTeams: otherTeams });
      }
    } catch (error) {
      console.error('Failed to initialize player team:', error);
    }
  },
}));
