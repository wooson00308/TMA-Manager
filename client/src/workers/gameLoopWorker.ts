import { processGameTick } from "../logic/GameLoop";
import type { BattleState, Pilot } from "@shared/schema";
import type { TerrainFeature } from "@shared/domain/types";

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
}

// For type safety in web-worker context
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – DedicatedWorkerGlobalScope is available in browsers but may be missing in the TS lib target for workers
declare const self: any;

let currentState: BattleState | null = null;
let pilots: Pilot[] = [];
let terrainFeatures: TerrainFeature[] = [];
let intervalId: ReturnType<typeof setInterval> | null = null;
let tickMs = 1000; // default 1s tick – can be overridden by INIT

function startLoop() {
  if (intervalId !== null || !currentState) {
    console.log("Cannot start loop - already running or no state");
    return;
  }
  
  console.log("Starting game loop worker with tick interval:", tickMs);
  
  intervalId = setInterval(() => {
    if (!currentState) {
      console.log("No current state, skipping tick");
      return;
    }
    
    console.log("Processing game tick in worker");
    currentState = processGameTick(currentState, pilots, terrainFeatures);
    const msg: StateUpdateMessage = { type: "STATE_UPDATE", state: currentState };
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
        terrainFeatures: terrainFeatures.length
      });
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