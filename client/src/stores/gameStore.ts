import { create } from 'zustand';
import { type GameScene, type Pilot, type Mech, type Team, type Formation } from '@shared/schema';

interface GameState {
  currentScene: GameScene;
  currentSeason: number;
  currentWeek: number;
  playerTeam: Team | null;
  pilots: Pilot[];
  mechs: Mech[];
  activeFormation: Formation | null;
  
  // Actions
  setScene: (scene: GameScene) => void;
  setPlayerTeam: (team: Team) => void;
  setPilots: (pilots: Pilot[]) => void;
  setMechs: (mechs: Mech[]) => void;
  setActiveFormation: (formation: Formation | null) => void;
}

export const useGameStore = create<GameState>((set) => ({
  currentScene: 'hub',
  currentSeason: 3,
  currentWeek: 7,
  playerTeam: null,
  pilots: [],
  mechs: [],
  activeFormation: null,

  setScene: (scene) => set({ currentScene: scene }),
  setPlayerTeam: (team) => set({ playerTeam: team }),
  setPilots: (pilots) => set({ pilots }),
  setMechs: (mechs) => set({ mechs }),
  setActiveFormation: (formation) => set({ activeFormation: formation }),
}));
