import React, { useCallback } from "react";
import type { AttackEffect } from "@shared/domain/types";

interface UseEffectsRendererParams {
  attackEffects: AttackEffect[];
  setAttackEffects: React.Dispatch<React.SetStateAction<AttackEffect[]>>;
}

interface EffectsRenderResult {
  renderEffectsToCanvas: (ctx: CanvasRenderingContext2D) => void;
}

/**
 * useEffectsRenderer - 전투 이펙트 렌더링 전용 훅
 * 공격 이펙트 (레이저, 미사일, 빔), 폭발, 머즐플래시를 렌더링
 */
export function useEffectsRenderer({
  attackEffects,
  setAttackEffects,
}: UseEffectsRendererParams): EffectsRenderResult {

  const renderEffectsToCanvas = useCallback((ctx: CanvasRenderingContext2D) => {
    const currentTime = Date.now();

    // Attack / projectile effects
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

      // 일반 폭발 효과 (모든 타입 공통)
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
  }, [attackEffects, setAttackEffects]);

  return {
    renderEffectsToCanvas,
  };
} 