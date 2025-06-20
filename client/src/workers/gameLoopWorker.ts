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
  if (intervalId !== null || !currentState) return;
  intervalId = setInterval(() => {
    if (!currentState) return;
    currentState = processGameTick(currentState, pilots, terrainFeatures);
    const msg: StateUpdateMessage = { type: "STATE_UPDATE", state: currentState };
    self.postMessage(msg);
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
      break;
    case "START":
      startLoop();
      break;
    case "STOP":
      stopLoop();
      break;
  }
}; 