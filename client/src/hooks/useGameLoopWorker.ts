import { useEffect, useRef } from "react";
import type { BattleState } from "@shared/schema";
import { useBattleStore } from "@/stores/battleStore";
import { useGameStore } from "@/stores/gameStore";

export function useGameLoopWorker(
  battle: BattleState | null,
  enabled: boolean,
  onEvents?: (events: import("@shared/events").GameEvent[]) => void,
) {
  const workerRef = useRef<Worker | null>(null);
  const { setBattle } = useBattleStore();
  const { pilots, terrainFeatures } = useGameStore();

  useEffect(() => {
    console.log("useGameLoopWorker effect triggered:", { enabled, hasBattle: !!battle });
    
    if (!enabled || !battle) {
      // stop and clean up
      console.log("Stopping worker - enabled:", enabled, "battle:", !!battle);
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

      w.onmessage = (evt: MessageEvent<{ type: string; state: BattleState; events: import("@shared/events").GameEvent[] }>) => {
        console.log("Received message from worker:", evt.data.type, evt.data);
        if (evt.data.type === "STATE_UPDATE") {
          console.log("Updating battle state from worker:", evt.data.state);
          setBattle(evt.data.state);
          onEvents?.(evt.data.events);
        }
      };

      w.onerror = (error) => {
        console.error("Worker error:", error);
      };

      console.log("Initializing worker with battle state:", {
        participants: battle.participants?.length,
        pilots: pilots.length,
        terrainFeatures: terrainFeatures.length
      });
      
      w.postMessage({ 
        type: "INIT", 
        payload: { 
          state: battle,
          pilots,
          terrainFeatures
        } 
      });
    }

    // start loop (idempotent inside worker)
    console.log("Sending START message to worker");
    workerRef.current?.postMessage({ type: "START" });

    return () => {
      // optional clean-up on unmount
      workerRef.current?.postMessage({ type: "STOP" });
    };
    // Only re-run when enabled or battle changes
  }, [battle, enabled, setBattle, pilots, terrainFeatures, onEvents]);
} 