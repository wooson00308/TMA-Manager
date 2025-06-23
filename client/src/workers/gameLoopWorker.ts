import { processGameTick, type TickResult } from "../logic/GameLoop";
import type { BattleState, Pilot } from "@shared/schema";
import type { TerrainFeature } from "@shared/domain/types";
import type { GameEvent } from "@shared/events";

interface InitMessage {
  type: "INIT";
  payload: {
    state: BattleState;
    pilots: Pilot[];
    terrainFeatures: TerrainFeature[];
    tickMs?: number;
  };
}

interface StartMessage {
  type: "START";
}

interface StopMessage {
  type: "STOP";
}

// Union of accepted messages from main thread
type InboundMessage = InitMessage | StartMessage | StopMessage;

interface StateUpdateMessage {
  type: "STATE_UPDATE";
  state: BattleState;
  events: GameEvent[];
}

// For type safety in web-worker context
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – DedicatedWorkerGlobalScope is available in browsers but may be missing in the TS lib target for workers
declare const self: any;

let currentState: BattleState | null = null;
let pilots: Pilot[] = [];
let terrainFeatures: TerrainFeature[] = [];
let intervalId: ReturnType<typeof setInterval> | null = null;
let tickMs = 800; // faster tick for more responsive AI

function startLoop() {
  if (intervalId !== null || !currentState) {
    console.log("Cannot start loop - already running:", intervalId !== null, "or no state:", !currentState);
    return;
  }
  
  console.log("Starting game loop worker with tick interval:", tickMs, "ms");
  console.log("Initial participants:", currentState.participants?.map(p => ({id: p.pilotId, hp: p.hp, team: p.team})));
  
  intervalId = setInterval(() => {
    if (!currentState) {
      console.log("No current state in loop, stopping");
      stopLoop();
      return;
    }
    
    const activeUnits = currentState.participants?.filter(p => p.hp > 0) || [];
    console.log(`Turn ${currentState.turn}: Processing ${activeUnits.length} active units`);
    
    if (activeUnits.length === 0) {
      console.log("No active units, battle should end");
      return;
    }
    
    const tickResult: TickResult = processGameTick(currentState, pilots, terrainFeatures);
    currentState = tickResult.state;
    
    console.log(`Turn ${tickResult.state.turn} completed, sending update`);
    const msg: StateUpdateMessage = { type: "STATE_UPDATE", state: tickResult.state, events: tickResult.events };
    self.postMessage(msg);

    // Automatically halt the loop once the battle has finished.
    if (currentState.phase === "completed") {
      console.log("Battle completed, stopping loop");
      stopLoop();
    }
  }, tickMs);
}

function stopLoop() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

self.onmessage = (evt: MessageEvent<InboundMessage>) => {
  const { type } = evt.data;
  console.log("Worker received message:", type);
  
  switch (type) {
    case "INIT":
      currentState = evt.data.payload.state;
      pilots = evt.data.payload.pilots;
      terrainFeatures = evt.data.payload.terrainFeatures;
      tickMs = evt.data.payload.tickMs ?? tickMs;
      console.log("Worker initialized with state:", {
        participants: currentState?.participants?.length,
        pilots: pilots.length,
        terrainFeatures: terrainFeatures.length,
        state: currentState
      });
      
      if (!currentState) {
        console.error("ERROR: No battle state provided to worker!");
        return;
      }
      
      if (!currentState.participants || currentState.participants.length === 0) {
        console.error("ERROR: No participants in battle state!");
        return;
      }
      
      break;
    case "START":
      console.log("Starting worker loop");
      startLoop();
      break;
    case "STOP":
      console.log("Stopping worker loop");
      stopLoop();
      break;
  }
}; 