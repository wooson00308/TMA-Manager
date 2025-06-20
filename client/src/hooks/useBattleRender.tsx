import React, { useEffect, useRef } from "react";
import type { BattleState } from "@shared/schema";

/**
 * Lightweight domain types duplicated for now.  These will be migrated to
 * shared/domain during later refactor phases.
 */
export interface AttackEffect {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  startTime: number;
  type: "laser" | "missile" | "beam";
}

export interface TerrainFeature {
  x: number;
  y: number;
  type: "cover" | "obstacle" | "elevation" | "hazard";
  effect: string;
}

export interface PilotInfo {
  id: number;
  name: string;
  callsign: string;
  team: "ally" | "enemy";
  initial: string;
}

interface UseBattleRenderParams {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  battle: BattleState;
  animatingUnits: Set<number>;
  attackEffects: AttackEffect[];
  setAttackEffects: React.Dispatch<React.SetStateAction<AttackEffect[]>>;
  terrainFeatures: TerrainFeature[];
  getPilotInfo: (pilotId: number) => PilotInfo;
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !battle) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationStartTime = Date.now();

    const drawBattleField = (timestamp: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background gradient & grid
      const gradient = ctx.createRadialGradient(320, 240, 0, 320, 240, 400);
      gradient.addColorStop(0, "#1F2937");
      gradient.addColorStop(1, "#111827");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "#374151";
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 16; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 40, 0);
        ctx.lineTo(i * 40, 480);
        ctx.stroke();
      }
      for (let i = 0; i <= 12; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * 40);
        ctx.lineTo(640, i * 40);
        ctx.stroke();
      }

      // Terrain features
      terrainFeatures.forEach((terrain) => {
        const x = terrain.x * 40 + 20;
        const y = terrain.y * 40 + 20;

        ctx.save();
        switch (terrain.type) {
          case "cover":
            ctx.fillStyle = "#059669";
            ctx.fillRect(terrain.x * 40 + 5, terrain.y * 40 + 5, 30, 30);
            ctx.fillStyle = "#10B981";
            ctx.font = "12px monospace";
            ctx.textAlign = "center";
            ctx.fillText("🛡️", x, y + 4);
            break;
          case "elevation":
            ctx.fillStyle = "#7C3AED";
            ctx.beginPath();
            ctx.moveTo(x, y - 15);
            ctx.lineTo(x - 15, y + 10);
            ctx.lineTo(x + 15, y + 10);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "#A855F7";
            ctx.font = "10px monospace";
            ctx.textAlign = "center";
            ctx.fillText("⬆️", x, y + 2);
            break;
          case "obstacle":
            ctx.fillStyle = "#DC2626";
            ctx.fillRect(terrain.x * 40 + 8, terrain.y * 40 + 8, 24, 24);
            ctx.fillStyle = "#EF4444";
            ctx.font = "12px monospace";
            ctx.textAlign = "center";
            ctx.fillText("🚫", x, y + 4);
            break;
          case "hazard":
            ctx.fillStyle = "#F59E0B";
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillStyle = "#FBBF24";
            ctx.font = "12px monospace";
            ctx.textAlign = "center";
            ctx.fillText("⚠️", x, y + 4);
            break;
        }
        ctx.restore();
      });

      // Attack / projectile effects
      const currentTime = Date.now();
      attackEffects.forEach((effect) => {
        const elapsed = currentTime - effect.startTime;
        const duration = 800;
        const progress = Math.min(elapsed / duration, 1);

        if (progress >= 1) return;

        const fromX = effect.from.x * 40 + 20;
        const fromY = effect.from.y * 40 + 20;
        const toX = effect.to.x * 40 + 20;
        const toY = effect.to.y * 40 + 20;

        const alpha = 1 - progress;
        ctx.shadowBlur = 0;

        switch (effect.type) {
          case "laser":
            ctx.strokeStyle = `rgba(251, 191, 36, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.shadowColor = "#FBBF24";
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(toX, toY);
            ctx.stroke();
            break;
          case "missile": {
            const missileProgress = progress * (toX - fromX);
            const currentX = fromX + missileProgress;
            const currentY = fromY + progress * (toY - fromY);

            ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
            ctx.beginPath();
            ctx.arc(currentX, currentY, 4, 0, 2 * Math.PI);
            ctx.fill();

            ctx.strokeStyle = `rgba(239, 68, 68, ${alpha * 0.5})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(currentX, currentY);
            ctx.stroke();
            break;
          }
          case "beam":
            ctx.strokeStyle = `rgba(147, 51, 234, ${alpha})`;
            ctx.lineWidth = 6;
            ctx.shadowColor = "#9333EA";
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(toX, toY);
            ctx.stroke();

            ctx.strokeStyle = `rgba(196, 181, 253, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(toX, toY);
            ctx.stroke();
            break;
        }
        ctx.shadowBlur = 0;

        if (progress > 0.6) {
          const explosionProgress = (progress - 0.6) / 0.4;
          const explosionRadius = explosionProgress * 25;
          const explosionAlpha = 1 - explosionProgress;

          ctx.fillStyle = `rgba(239, 68, 68, ${explosionAlpha * 0.7})`;
          ctx.beginPath();
          ctx.arc(toX, toY, explosionRadius, 0, 2 * Math.PI);
          ctx.fill();
        }
      });

      // Clean up finished effects
      setAttackEffects((prev) => prev.filter((e) => currentTime - e.startTime < 800));

      // Participants
      (battle.participants || []).forEach((participant) => {
        const pilot = getPilotInfo(participant.pilotId);
        const x = participant.position.x * 40 + 20;
        const y = participant.position.y * 40 + 20;

        // Animated pulse around active units
        if (animatingUnits.has(participant.pilotId)) {
          const pulseProgress = ((timestamp - animationStartTime) % 1000) / 1000;
          const pulseRadius = 20 + Math.sin(pulseProgress * Math.PI * 2) * 5;
          ctx.strokeStyle =
            pilot.team === "ally"
              ? `rgba(59, 130, 246, ${0.8 - pulseProgress * 0.6})`
              : `rgba(239, 68, 68, ${0.8 - pulseProgress * 0.6})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, y, pulseRadius, 0, 2 * Math.PI);
          ctx.stroke();
        }

        // Hex-shaped mech marker
        const baseSize = participant.status === "destroyed" ? 12 : 16;
        ctx.fillStyle = pilot.team === "ally" ? "#3B82F6" : "#EF4444";
        if (participant.status === "destroyed") {
          ctx.fillStyle = "#6B7280";
        }

        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const hexX = x + Math.cos(angle) * baseSize;
          const hexY = y + Math.sin(angle) * baseSize;
          if (i === 0) ctx.moveTo(hexX, hexY);
          else ctx.lineTo(hexX, hexY);
        }
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.stroke();

        if (participant.status !== "destroyed") {
          const hpBarWidth = 30;
          const hpBarHeight = 4;
          const hpX = x - hpBarWidth / 2;
          const hpY = y - 28;

          ctx.fillStyle = "#374151";
          ctx.fillRect(hpX, hpY, hpBarWidth, hpBarHeight);

          const hpWidth = (participant.hp / 100) * hpBarWidth;
          ctx.fillStyle = participant.hp > 70 ? "#10B981" : participant.hp > 30 ? "#F59E0B" : "#EF4444";
          ctx.fillRect(hpX, hpY, hpWidth, hpBarHeight);

          ctx.fillStyle = "#FFFFFF";
          ctx.font = "10px monospace";
          ctx.textAlign = "center";
          ctx.fillText(`${participant.hp}%`, x, hpY - 2);
        }

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.fillText(pilot.initial, x, y + 5);

        ctx.fillStyle = pilot.team === "ally" ? "#93C5FD" : "#FCA5A5";
        ctx.font = "8px monospace";
        ctx.fillText(pilot.name, x, y + 35);

        if (participant.status === "destroyed") {
          ctx.strokeStyle = "#DC2626";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x - 10, y - 10);
          ctx.lineTo(x + 10, y + 10);
          ctx.moveTo(x + 10, y - 10);
          ctx.lineTo(x - 10, y + 10);
          ctx.stroke();
        }
      });

      animationFrameRef.current = requestAnimationFrame(drawBattleField);
    };

    animationFrameRef.current = requestAnimationFrame(drawBattleField);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [battle, animatingUnits, attackEffects, terrainFeatures, getPilotInfo, setAttackEffects]);
} 