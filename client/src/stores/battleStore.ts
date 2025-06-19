import { create } from 'zustand';
import { type BattleState } from '@shared/schema';

interface BattleStoreState {
  currentBattle: BattleState | null;
  isConnected: boolean;
  battleHistory: Array<{
    timestamp: number;
    type: string;
    message: string;
    speaker?: string;
  }>;
  
  // Actions
  setBattle: (battle: BattleState | null) => void;
  setConnected: (connected: boolean) => void;
  addBattleLog: (log: any) => void;
  clearBattleHistory: () => void;
}

export const useBattleStore = create<BattleStoreState>((set) => ({
  currentBattle: null,
  isConnected: false,
  battleHistory: [],

  setBattle: (battle) => set({ currentBattle: battle }),
  setConnected: (connected) => set({ isConnected: connected }),
  addBattleLog: (log) => set((state) => ({
    battleHistory: [...state.battleHistory, log].slice(-50) // Keep last 50 logs
  })),
  clearBattleHistory: () => set({ battleHistory: [] }),
}));
