import React, { useEffect, useRef } from "react";
import type { BattleState } from "@shared/schema";
import type { 
  AttackEffect, 
  HitEffect, 
  MuzzleFlash, 
  TerrainFeature, 
  PilotInfo 
} from "@shared/domain/types";
import { useTerrainRenderer } from "./useTerrainRenderer";
import { useEffectsRenderer } from "./useEffectsRenderer";
import { useUnitsRenderer } from "./useUnitsRenderer";

interface UseBattleRenderParams {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  battle: BattleState | null;
  animatingUnits: Set<number>;
  attackEffects: AttackEffect[];
  setAttackEffects: React.Dispatch<React.SetStateAction<AttackEffect[]>>;
  terrainFeatures: TerrainFeature[];
  getPilotInfo: (pilotId: number) => PilotInfo;
  hitEffects?: HitEffect[];
  setHitEffects?: React.Dispatch<React.SetStateAction<HitEffect[]>>;
  muzzleFlashes?: MuzzleFlash[];
  setMuzzleFlashes?: React.Dispatch<React.SetStateAction<MuzzleFlash[]>>;
}

/**
 * useBattleRender encapsulates **all** imperative canvas drawing logic so that
 * the BattleSimulation component can stay declarative / presenter-only.
 */
export function useBattleRender({
  canvasRef,
  battle,
  animatingUnits,
  attackEffects,
  setAttackEffects,
  terrainFeatures,
  getPilotInfo,
}: UseBattleRenderParams) {
  const animationFrameRef = useRef<number>();

  // 지형 렌더러 훅 사용
  const { drawTerrainToCanvas, needsTerrainRedraw } = useTerrainRenderer({
    terrainFeatures,
    canvasWidth: canvasRef.current?.width || 0,
    canvasHeight: canvasRef.current?.height || 0,
  });

  // 이펙트 렌더러 훅 사용
  const { renderEffectsToCanvas } = useEffectsRenderer({
    attackEffects,
    setAttackEffects,
  });

  // 유닛 렌더러 훅 사용
  const { renderUnitsToCanvas } = useUnitsRenderer({
    battle,
    animatingUnits,
    getPilotInfo,
  });

  const resizeCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.resetTransform?.();
      ctx.scale(dpr, dpr);
    }

    // 지형 다시 그리기 요청
    needsTerrainRedraw();
  }, [canvasRef, needsTerrainRedraw]);

  useEffect(() => {
    resizeCanvas();
    const handler = debounce(resizeCanvas, 200);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [resizeCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !battle) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationStartTime = Date.now();

    const drawBattleField = (timestamp: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1) Draw terrain using the dedicated terrain renderer
      drawTerrainToCanvas(ctx);

      // 2) Draw effects using the dedicated effects renderer
      renderEffectsToCanvas(ctx);

      // 3) Draw units using the dedicated units renderer
      renderUnitsToCanvas(ctx, timestamp, animationStartTime);

      animationFrameRef.current = requestAnimationFrame(drawBattleField);
    };

    animationFrameRef.current = requestAnimationFrame(drawBattleField);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [battle, animatingUnits, attackEffects, drawTerrainToCanvas, renderEffectsToCanvas, renderUnitsToCanvas]);
}

// lightweight debounce helper (avoids external deps)
function debounce(fn: () => void, wait: number) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return () => {
    if (t) clearTimeout(t);
    t = setTimeout(fn, wait);
  };
} 