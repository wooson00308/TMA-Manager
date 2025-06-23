import { useEffect, useRef } from "react";
import type { BattleState } from "@shared/schema";
import { useBattleStore } from "@/stores/battleStore";
import { useGameStore } from "@/stores/gameStore";

export function useGameLoopWorker(battle: BattleState | null, enabled: boolean) {
  const workerRef = useRef<Worker | null>(null);
  const { setBattle } = useBattleStore();
  const { pilots, enemyPilots, terrainFeatures } = useGameStore();

  useEffect(() => {
    if (!enabled || !battle) {
      // stop and clean up
      if (workerRef.current) {
        workerRef.current.postMessage({ type: "STOP" });
        workerRef.current.terminate();
        workerRef.current = null;
      }
      return;
    }

    // initialise worker once
    if (!workerRef.current) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore – vite will inline the worker during build
      const w = new Worker(new URL("@/workers/gameLoopWorker.ts", import.meta.url), {
        type: "module",
      });
      workerRef.current = w;

      w.onmessage = (evt: MessageEvent<{ type: string; state: BattleState }>) => {
        if (evt.data.type === "STATE_UPDATE") {
          setBattle(evt.data.state);
        }
      };

      // 아군과 적군 파일럿 모두 전달
      const allPilots = [...pilots, ...enemyPilots];
      
      w.postMessage({ 
        type: "INIT", 
        payload: { 
          state: battle,
          pilots: allPilots,
          terrainFeatures
        } 
      });
    }

    // start loop (idempotent inside worker)
    workerRef.current?.postMessage({ type: "START" });

    return () => {
      // optional clean-up on unmount
      workerRef.current?.postMessage({ type: "STOP" });
    };
    // Only re-run when enabled or battle changes
  }, [battle, enabled, setBattle, pilots, enemyPilots, terrainFeatures]);
} 