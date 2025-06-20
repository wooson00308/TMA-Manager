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
  damage?: number;
  targetHit?: boolean;
}

export interface HitEffect {
  id: string;
  x: number;
  y: number;
  startTime: number;
  type: "explosion" | "sparks" | "shield";
  damage: number;
}

export interface MuzzleFlash {
  id: string;
  x: number;
  y: number;
  startTime: number;
  angle: number;
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
  const terrainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const needsTerrainRedrawRef = useRef<boolean>(true);

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

    if (!terrainCanvasRef.current) {
      terrainCanvasRef.current = document.createElement("canvas");
    }
    const terrainCanvas = terrainCanvasRef.current;
    if (terrainCanvas) {
      terrainCanvas.width = canvas.width;
      terrainCanvas.height = canvas.height;
    }

    needsTerrainRedrawRef.current = true;
  }, [canvasRef]);

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

      // 1) Draw cached static terrain layer
      if (needsTerrainRedrawRef.current) {
        const terrainCtx = terrainCanvasRef.current!.getContext("2d")!;
        terrainCtx.save();
        terrainCtx.resetTransform?.();
        const dpr = window.devicePixelRatio || 1;
        terrainCtx.scale(dpr, dpr);

        terrainCtx.clearRect(0, 0, terrainCanvasRef.current!.width, terrainCanvasRef.current!.height);

        const gradient = terrainCtx.createRadialGradient(320, 240, 0, 320, 240, 400);
        gradient.addColorStop(0, "#1F2937");
        gradient.addColorStop(1, "#111827");
        terrainCtx.fillStyle = gradient;
        terrainCtx.fillRect(0, 0, 640, 480);

        terrainCtx.strokeStyle = "#374151";
        terrainCtx.lineWidth = 0.5;
        for (let i = 0; i <= 16; i++) {
          terrainCtx.beginPath();
          terrainCtx.moveTo(i * 40, 0);
          terrainCtx.lineTo(i * 40, 480);
          terrainCtx.stroke();
        }
        for (let i = 0; i <= 12; i++) {
          terrainCtx.beginPath();
          terrainCtx.moveTo(0, i * 40);
          terrainCtx.lineTo(640, i * 40);
          terrainCtx.stroke();
        }

        terrainFeatures.forEach((terrain) => {
          const x = terrain.x * 40 + 20;
          const y = terrain.y * 40 + 20;
          const cellX = terrain.x * 40;
          const cellY = terrain.y * 40;

          terrainCtx.save();
          switch (terrain.type) {
            case "cover":
              // 엄폐물 - 벙커 스타일
              const gradient1 = terrainCtx.createLinearGradient(cellX, cellY, cellX + 40, cellY + 40);
              gradient1.addColorStop(0, "#065F46");
              gradient1.addColorStop(1, "#047857");
              terrainCtx.fillStyle = gradient1;
              terrainCtx.fillRect(cellX + 3, cellY + 3, 34, 34);
              
              // 벙커 디테일
              terrainCtx.fillStyle = "#10B981";
              terrainCtx.fillRect(cellX + 8, cellY + 8, 24, 6);
              terrainCtx.fillRect(cellX + 8, cellY + 18, 24, 6);
              terrainCtx.fillRect(cellX + 8, cellY + 28, 24, 6);
              
              // 그림자 효과
              terrainCtx.fillStyle = "rgba(0,0,0,0.3)";
              terrainCtx.fillRect(cellX + 6, cellY + 6, 28, 28);
              
              // 외곽선
              terrainCtx.strokeStyle = "#34D399";
              terrainCtx.lineWidth = 2;
              terrainCtx.strokeRect(cellX + 3, cellY + 3, 34, 34);
              break;
              
            case "elevation":
              // 고지대 - 다층 플랫폼
              const elevColors = ["#7C3AED", "#8B5CF6", "#A78BFA"];
              for (let i = 0; i < 3; i++) {
                const size = 28 - i * 6;
                const offset = i * 3;
                terrainCtx.fillStyle = elevColors[i];
                terrainCtx.beginPath();
                terrainCtx.moveTo(x, cellY + offset + 5);
                terrainCtx.lineTo(x - size/2, cellY + offset + size);
                terrainCtx.lineTo(x + size/2, cellY + offset + size);
                terrainCtx.closePath();
                terrainCtx.fill();
                
                // 윤곽선
                terrainCtx.strokeStyle = "#DDD6FE";
                terrainCtx.lineWidth = 1;
                terrainCtx.stroke();
              }
              
              // 방향 화살표
              terrainCtx.fillStyle = "#FFFFFF";
              terrainCtx.beginPath();
              terrainCtx.moveTo(x, y - 8);
              terrainCtx.lineTo(x - 4, y - 2);
              terrainCtx.lineTo(x + 4, y - 2);
              terrainCtx.closePath();
              terrainCtx.fill();
              break;
              
            case "obstacle":
              // 장애물 - 파괴된 구조물
              terrainCtx.fillStyle = "#7F1D1D";
              terrainCtx.fillRect(cellX + 6, cellY + 6, 28, 28);
              
              // 크랙 패턴
              terrainCtx.strokeStyle = "#DC2626";
              terrainCtx.lineWidth = 3;
              terrainCtx.beginPath();
              terrainCtx.moveTo(cellX + 8, cellY + 8);
              terrainCtx.lineTo(cellX + 32, cellY + 32);
              terrainCtx.moveTo(cellX + 32, cellY + 8);
              terrainCtx.lineTo(cellX + 8, cellY + 32);
              terrainCtx.stroke();
              
              // 잔해 효과
              for (let i = 0; i < 6; i++) {
                const debrisX = cellX + 10 + Math.random() * 20;
                const debrisY = cellY + 10 + Math.random() * 20;
                terrainCtx.fillStyle = "#B91C1C";
                terrainCtx.beginPath();
                terrainCtx.arc(debrisX, debrisY, 2, 0, 2 * Math.PI);
                terrainCtx.fill();
              }
              
              // 경고 테두리
              terrainCtx.strokeStyle = "#FEE2E2";
              terrainCtx.lineWidth = 2;
              terrainCtx.setLineDash([5, 5]);
              terrainCtx.strokeRect(cellX + 2, cellY + 2, 36, 36);
              terrainCtx.setLineDash([]);
              break;
              
            case "hazard":
              // 위험지대 - 방사능/독성 지역
              const hazardGradient = terrainCtx.createRadialGradient(x, y, 5, x, y, 18);
              hazardGradient.addColorStop(0, "#FCD34D");
              hazardGradient.addColorStop(0.7, "#F59E0B");
              hazardGradient.addColorStop(1, "#D97706");
              
              terrainCtx.fillStyle = hazardGradient;
              terrainCtx.beginPath();
              terrainCtx.arc(x, y, 18, 0, 2 * Math.PI);
              terrainCtx.fill();
              
              // 펄싱 효과용 링
              const time = Date.now() * 0.003;
              const pulseAlpha = 0.3 + 0.2 * Math.sin(time);
              terrainCtx.strokeStyle = `rgba(251, 191, 36, ${pulseAlpha})`;
              terrainCtx.lineWidth = 3;
              terrainCtx.beginPath();
              terrainCtx.arc(x, y, 15 + 3 * Math.sin(time), 0, 2 * Math.PI);
              terrainCtx.stroke();
              
              // 방사능 심볼
              terrainCtx.fillStyle = "#92400E";
              terrainCtx.font = "bold 16px monospace";
              terrainCtx.textAlign = "center";
              terrainCtx.fillText("☢", x, y + 5);
              
              // 위험 경고
              terrainCtx.strokeStyle = "#FBBF24";
              terrainCtx.lineWidth = 2;
              terrainCtx.setLineDash([3, 3]);
              terrainCtx.strokeRect(cellX + 2, cellY + 2, 36, 36);
              terrainCtx.setLineDash([]);
              break;
          }
          terrainCtx.restore();
        });

        terrainCtx.restore();
        needsTerrainRedrawRef.current = false;
      }

      // Push the cached terrain onto the main ctx at start of frame
      ctx.drawImage(terrainCanvasRef.current!, 0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));

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
            // 레이저 빔 효과 개선
            const laserX = fromX + (toX - fromX) * progress;
            const laserY = fromY + (toY - fromY) * progress;
            
            // 코어 레이저
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 6;
            ctx.shadowColor = "#FBBF24";
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(laserX, laserY);
            ctx.stroke();
            
            // 외부 글로우
            ctx.strokeStyle = `rgba(251, 191, 36, ${alpha * 0.7})`;
            ctx.lineWidth = 12;
            ctx.shadowBlur = 25;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(toX, toY);
            ctx.stroke();
            break;
          case "missile": {
            const missileX = fromX + (toX - fromX) * progress;
            const missileY = fromY + (toY - fromY) * progress;
            
            // 미사일 본체
            ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
            ctx.shadowColor = "#EF4444";
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(missileX, missileY, 5, 0, 2 * Math.PI);
            ctx.fill();
            
            // 추진 화염 트레일
            const trailLength = 20;
            const dx = toX - fromX;
            const dy = toY - fromY;
            const length = Math.sqrt(dx * dx + dy * dy);
            const unitX = dx / length;
            const unitY = dy / length;
            
            for (let i = 0; i < 6; i++) {
              const trailAlpha = alpha * (1 - i * 0.15);
              const trailX = missileX - (i * 3) * unitX;
              const trailY = missileY - (i * 3) * unitY;
              
              ctx.fillStyle = `rgba(251, 191, 36, ${trailAlpha})`;
              ctx.beginPath();
              ctx.arc(trailX, trailY, 4 - i * 0.5, 0, 2 * Math.PI);
              ctx.fill();
            }
            
            // 폭발 효과 (목표 도달시)
            if (progress > 0.95) {
              const explosionProgress = (progress - 0.95) * 20;
              const explosionRadius = 25 * explosionProgress;
              
              // 폭발 플래시
              const explosionGradient = ctx.createRadialGradient(toX, toY, 0, toX, toY, explosionRadius);
              explosionGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
              explosionGradient.addColorStop(0.3, `rgba(255, 150, 0, ${alpha * 0.8})`);
              explosionGradient.addColorStop(0.7, `rgba(255, 0, 0, ${alpha * 0.5})`);
              explosionGradient.addColorStop(1, `rgba(0, 0, 0, 0)`);
              
              ctx.fillStyle = explosionGradient;
              ctx.beginPath();
              ctx.arc(toX, toY, explosionRadius, 0, 2 * Math.PI);
              ctx.fill();
              
              // 파편 효과
              const debrisCount = 8;
              for (let i = 0; i < debrisCount; i++) {
                const angle = (i / debrisCount) * Math.PI * 2;
                const debrisDistance = explosionRadius * 0.8;
                const debrisX = toX + Math.cos(angle) * debrisDistance;
                const debrisY = toY + Math.sin(angle) * debrisDistance;
                
                ctx.fillStyle = `rgba(255, 100, 0, ${alpha * 0.7})`;
                ctx.beginPath();
                ctx.arc(debrisX, debrisY, 2, 0, 2 * Math.PI);
                ctx.fill();
              }
            }
            break;
          }
          case "beam":
            // 플라즈마 빔 외곽
            ctx.strokeStyle = `rgba(147, 51, 234, ${alpha})`;
            ctx.lineWidth = 8;
            ctx.shadowColor = "#9333EA";
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(toX, toY);
            ctx.stroke();

            // 플라즈마 빔 내부 코어
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
            ctx.lineWidth = 4;
            ctx.shadowBlur = 25;
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(toX, toY);
            ctx.stroke();
            
            // 전기 방전 효과
            const segments = 12;
            for (let i = 0; i < segments; i++) {
              const segmentProgress = i / segments;
              const x = fromX + (toX - fromX) * segmentProgress;
              const y = fromY + (toY - fromY) * segmentProgress;
              const offsetX = (Math.random() - 0.5) * 12;
              const offsetY = (Math.random() - 0.5) * 12;
              
              ctx.strokeStyle = `rgba(139, 92, 246, ${alpha * 0.6})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(x + offsetX, y + offsetY);
              ctx.stroke();
            }
            
            // 목표 지점 에너지 방출
            if (progress > 0.8) {
              const energyRadius = 15 * (progress - 0.8) * 5;
              const energyGradient = ctx.createRadialGradient(toX, toY, 0, toX, toY, energyRadius);
              energyGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.8})`);
              energyGradient.addColorStop(0.5, `rgba(147, 51, 234, ${alpha * 0.6})`);
              energyGradient.addColorStop(1, `rgba(0, 0, 0, 0)`);
              
              ctx.fillStyle = energyGradient;
              ctx.beginPath();
              ctx.arc(toX, toY, energyRadius, 0, 2 * Math.PI);
              ctx.fill();
            }
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
      
      // Muzzle flash effects when attacks start
      attackEffects.forEach((effect) => {
        const elapsed = currentTime - effect.startTime;
        if (elapsed < 150) { // Show muzzle flash for first 150ms
          const flashAlpha = 1 - (elapsed / 150);
          const fromX = effect.from.x * 40 + 20;
          const fromY = effect.from.y * 40 + 20;
          
          // Muzzle flash burst
          const flashRadius = 8 + Math.random() * 4;
          const flashGradient = ctx.createRadialGradient(fromX, fromY, 0, fromX, fromY, flashRadius);
          flashGradient.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha})`);
          flashGradient.addColorStop(0.4, `rgba(255, 200, 0, ${flashAlpha * 0.8})`);
          flashGradient.addColorStop(1, `rgba(255, 100, 0, 0)`);
          
          ctx.fillStyle = flashGradient;
          ctx.beginPath();
          ctx.arc(fromX, fromY, flashRadius, 0, 2 * Math.PI);
          ctx.fill();
          
          // Muzzle sparks
          const sparkCount = 6;
          for (let i = 0; i < sparkCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 5 + Math.random() * 10;
            const sparkX = fromX + Math.cos(angle) * distance;
            const sparkY = fromY + Math.sin(angle) * distance;
            
            ctx.fillStyle = `rgba(255, 255, 100, ${flashAlpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 1, 0, 2 * Math.PI);
            ctx.fill();
          }
        }
      });

      // Participants
      (battle.participants || []).forEach((participant) => {
        const pilot = getPilotInfo(participant.pilotId);
        const x = participant.position.x * 40 + 20;
        const y = participant.position.y * 40 + 20;

        // Enhanced unit animations
        if (animatingUnits.has(participant.pilotId)) {
          const pulseProgress = ((timestamp - animationStartTime) % 1000) / 1000;
          const pulseRadius = 20 + Math.sin(pulseProgress * Math.PI * 2) * 5;
          
          // Action pulse ring
          ctx.strokeStyle =
            pilot.team === "ally"
              ? `rgba(59, 130, 246, ${0.8 - pulseProgress * 0.6})`
              : `rgba(239, 68, 68, ${0.8 - pulseProgress * 0.6})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, y, pulseRadius, 0, 2 * Math.PI);
          ctx.stroke();
          
          // Charging energy effect
          const energyIntensity = Math.sin(pulseProgress * Math.PI * 4) * 0.5 + 0.5;
          ctx.fillStyle = pilot.team === "ally" 
            ? `rgba(59, 130, 246, ${energyIntensity * 0.3})`
            : `rgba(239, 68, 68, ${energyIntensity * 0.3})`;
          ctx.beginPath();
          ctx.arc(x, y, 12, 0, 2 * Math.PI);
          ctx.fill();
        }
        
        // Hit flash effect for damaged units
        const recentDamage = battle.log?.slice(-5).some(log => 
          log.message.includes(pilot.name) && 
          (log.message.includes('피해') || log.message.includes('공격')) &&
          Date.now() - log.timestamp < 2000
        );
        
        if (recentDamage) {
          const flashProgress = ((Date.now()) % 300) / 300;
          const flashAlpha = Math.sin(flashProgress * Math.PI * 2) * 0.5 + 0.5;
          
          // Red damage flash
          ctx.fillStyle = `rgba(255, 0, 0, ${flashAlpha * 0.4})`;
          ctx.beginPath();
          ctx.arc(x, y, 25, 0, 2 * Math.PI);
          ctx.fill();
          
          // Screen shake effect simulation with offset
          const shakeX = (Math.random() - 0.5) * 2;
          const shakeY = (Math.random() - 0.5) * 2;
          ctx.translate(shakeX, shakeY);
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

          const hpWidth = (Math.min(participant.hp, 100) / 100) * hpBarWidth;
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

// lightweight debounce helper (avoids external deps)
function debounce(fn: () => void, wait: number) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return () => {
    if (t) clearTimeout(t);
    t = setTimeout(fn, wait);
  };
} 