import React, { useCallback } from "react";
import type { BattleState } from "@shared/schema";
import type { BattleParticipant, PilotInfo } from "@shared/domain/types";

interface UseUnitsRendererParams {
  battle: BattleState | null;
  animatingUnits: Set<number>;
  getPilotInfo: (pilotId: number) => PilotInfo;
}

interface UnitsRenderResult {
  renderUnitsToCanvas: (ctx: CanvasRenderingContext2D, timestamp: number, animationStartTime: number) => void;
}

/**
 * useUnitsRenderer - 파일럿 유닛 렌더링 전용 훅
 * 유닛 애니메이션, HP바, 육각형 메카, 파일럿 정보, 피해 효과를 렌더링
 */
export function useUnitsRenderer({
  battle,
  animatingUnits,
  getPilotInfo,
}: UseUnitsRendererParams): UnitsRenderResult {

  const renderUnitsToCanvas = useCallback((
    ctx: CanvasRenderingContext2D, 
    timestamp: number, 
    animationStartTime: number
  ) => {
    if (!battle?.participants) return;

    battle.participants.forEach((participant) => {
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

      // HP bar (only for active units)
      if (participant.status !== "destroyed") {
        const hpBarWidth = 30;
        const hpBarHeight = 4;
        const hpX = x - hpBarWidth / 2;
        const hpY = y - 28;

        // HP bar background
        ctx.fillStyle = "#374151";
        ctx.fillRect(hpX, hpY, hpBarWidth, hpBarHeight);

        // HP bar fill
        const hpWidth = (Math.min(participant.hp, 100) / 100) * hpBarWidth;
        ctx.fillStyle = participant.hp > 70 ? "#10B981" : participant.hp > 30 ? "#F59E0B" : "#EF4444";
        ctx.fillRect(hpX, hpY, hpWidth, hpBarHeight);

        // HP percentage text
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`${participant.hp}%`, x, hpY - 2);
      }

      // Pilot initial (center text)
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "center";
      ctx.fillText(pilot.initial, x, y + 5);

      // Pilot name (bottom text)
      ctx.fillStyle = pilot.team === "ally" ? "#93C5FD" : "#FCA5A5";
      ctx.font = "8px monospace";
      ctx.fillText(pilot.name, x, y + 35);

      // Destroyed unit marker (X mark)
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
  }, [battle, animatingUnits, getPilotInfo]);

  return {
    renderUnitsToCanvas,
  };
} 