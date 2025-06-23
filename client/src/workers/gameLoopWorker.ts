import { processGameTick } from "../logic/GameLoop";
import type { BattleState, Pilot } from "@shared/schema";
import type { TerrainFeature, BattleEvent } from "@shared/domain/types";

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
  newEvents: BattleEvent[]; // Only send new events since last update
}

// For type safety in web-worker context
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – DedicatedWorkerGlobalScope is available in browsers but may be missing in the TS lib target for workers
declare const self: any;

let currentState: BattleState | null = null;
let pilots: Pilot[] = [];
let terrainFeatures: TerrainFeature[] = [];
let intervalId: ReturnType<typeof setInterval> | null = null;
let tickMs = 100; // Changed from 1000ms to 100ms for smoother gameplay
let lastEventIndex = 0; // Track last sent event index

function startLoop() {
  if (intervalId !== null || !currentState) return;
  intervalId = setInterval(() => {
    if (!currentState) return;
    
    // Process tick and get new state
    const oldEventCount = currentState.events?.length || 0;
    currentState = processGameTick(currentState, pilots, terrainFeatures);
    
    // Extract only new events
    const newEvents = currentState.events?.slice(lastEventIndex) || [];
    lastEventIndex = currentState.events?.length || 0;
    
    const msg: StateUpdateMessage = { 
      type: "STATE_UPDATE", 
      state: currentState,
      newEvents // Send only new events
    };
    self.postMessage(msg);

    // Automatically halt the loop once the battle has finished.
    if (currentState.phase === "completed") {
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
  switch (type) {
    case "INIT":
      currentState = evt.data.payload.state;
      pilots = evt.data.payload.pilots;
      terrainFeatures = evt.data.payload.terrainFeatures;
      tickMs = evt.data.payload.tickMs ?? tickMs;
      lastEventIndex = 0; // Reset event tracking
      break;
    case "START":
      startLoop();
      break;
    case "STOP":
      stopLoop();
      break;
  }
}; 