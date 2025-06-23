import { create } from 'zustand';
import { type BattleState } from '@shared/schema';
import { type BattleEvent } from '@shared/domain/types';

interface BattleStoreState {
  currentBattle: BattleState | null;
  isConnected: boolean;
  eventBuffer: BattleEvent[]; // Buffer for recent events
  
  // Actions
  setBattle: (battle: BattleState | null | ((prev: BattleState | null) => BattleState | null)) => void;
  setConnected: (connected: boolean) => void;
  addBattleLog: (log: any) => void;
  clearBattleHistory: () => void;
  addEvents: (events: BattleEvent[]) => void;
  clearEventBuffer: () => void;
}

export const useBattleStore = create<BattleStoreState>((set) => ({
  currentBattle: null,
  isConnected: false,
  eventBuffer: [],

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
  addEvents: (events) => set((state) => ({
    eventBuffer: [...state.eventBuffer, ...events].slice(-100) // Keep last 100 events
  })),
  clearEventBuffer: () => set({ eventBuffer: [] }),
}));
