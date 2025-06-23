import { type BattleState } from "@shared/schema";
import { BattleEngine } from "../domain/BattleEngine";
import type { IStorage } from "../storage";

/**
 * BattleUseCase acts as the application-layer façade sitting between the
 * presentation tier (e.g. HTTP / WS handlers) and the pure domain logic that
 * lives in `server/domain`.  By delegating all battle simulation behaviour to
 * `BattleEngine`, we keep the presentation layer clean while still allowing
 * later injection of cross-cutting concerns such as logging, transactions or
 * metrics.
 */
export class BattleUseCase {
  private engine: BattleEngine;

  constructor(storage: IStorage) {
    this.engine = new BattleEngine(storage);
  }

  initializeBattle(formation1: any, formation2: any, playerTactics?: string): Promise<BattleState> {
    return this.engine.initializeBattle(formation1, formation2, playerTactics);
  }

  runBattle(battleState: BattleState, onUpdate: (update: any) => void): Promise<void> {
    return this.engine.runBattle(battleState, onUpdate);
  }
} 