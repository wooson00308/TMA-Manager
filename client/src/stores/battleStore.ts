import { create } from 'zustand';
import { type BattleState } from '@shared/schema';

interface BattleStoreState {
  currentBattle: BattleState | null;
  isConnected: boolean;
  
  // Actions
  setBattle: (battle: BattleState | null | ((prev: BattleState | null) => BattleState | null)) => void;
  setConnected: (connected: boolean) => void;
  addBattleLog: (log: any) => void;
  clearBattleHistory: () => void;
}

export const useBattleStore = create<BattleStoreState>((set) => ({
  currentBattle: null,
  isConnected: false,

  setBattle: (updater) => set((state) => ({ 
    currentBattle: typeof updater === 'function' ? updater(state.currentBattle) : updater 
  })),
  setConnected: (connected) => set({ isConnected: connected }),
  addBattleLog: (log) => set((state) => {
    if (!state.currentBattle) return {};
    return {
      currentBattle: {
        ...state.currentBattle,
        log: [...state.currentBattle.log, log].slice(-50)
      }
    };
  }),
  clearBattleHistory: () => set(state => {
    if (!state.currentBattle) return {};
    return {
      currentBattle: {
        ...state.currentBattle,
        log: []
      }
    }
  }),
}));
