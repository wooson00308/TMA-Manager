import React, { useEffect, useRef, useCallback } from "react";
import type { TerrainFeature } from "@shared/domain/types";

interface UseTerrainRendererParams {
  terrainFeatures: TerrainFeature[];
  canvasWidth: number;
  canvasHeight: number;
}

interface TerrainRenderResult {
  terrainCanvasRef: React.RefObject<HTMLCanvasElement>;
  needsTerrainRedraw: () => void;
  drawTerrainToCanvas: (mainCtx: CanvasRenderingContext2D) => void;
}

/**
 * useTerrainRenderer - 지형 렌더링 전용 훅
 * 지형 캐싱, 배경, 그리드, 지형 요소들을 렌더링
 */
export function useTerrainRenderer({
  terrainFeatures,
  canvasWidth,
  canvasHeight,
}: UseTerrainRendererParams): TerrainRenderResult {
  const terrainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const needsTerrainRedrawRef = useRef<boolean>(true);

  // 지형 캔버스 초기화
  const initializeTerrainCanvas = useCallback(() => {
    if (!terrainCanvasRef.current) {
      terrainCanvasRef.current = document.createElement("canvas");
    }
    const terrainCanvas = terrainCanvasRef.current;
    if (terrainCanvas && canvasWidth > 0 && canvasHeight > 0) {
      terrainCanvas.width = canvasWidth;
      terrainCanvas.height = canvasHeight;
      needsTerrainRedrawRef.current = true;
    }
  }, [canvasWidth, canvasHeight]);

  // 캔버스 크기 변경 시 지형 캔버스 재초기화
  useEffect(() => {
    initializeTerrainCanvas();
  }, [initializeTerrainCanvas]);

  // 지형 다시 그리기 요청
  const needsTerrainRedraw = useCallback(() => {
    needsTerrainRedrawRef.current = true;
  }, []);

  // 지형을 메인 캔버스에 그리기
  const drawTerrainToCanvas = useCallback((mainCtx: CanvasRenderingContext2D) => {
    if (!terrainCanvasRef.current) return;

    // 지형 다시 그리기가 필요한 경우에만 렌더링
    if (needsTerrainRedrawRef.current) {
      const terrainCtx = terrainCanvasRef.current.getContext("2d");
      if (!terrainCtx) return;

      terrainCtx.save();
      terrainCtx.resetTransform?.();
      const dpr = window.devicePixelRatio || 1;
      terrainCtx.scale(dpr, dpr);

      terrainCtx.clearRect(0, 0, terrainCanvasRef.current.width, terrainCanvasRef.current.height);

      // 배경 그라디언트
      const gradient = terrainCtx.createRadialGradient(320, 240, 0, 320, 240, 400);
      gradient.addColorStop(0, "#1F2937");
      gradient.addColorStop(1, "#111827");
      terrainCtx.fillStyle = gradient;
      terrainCtx.fillRect(0, 0, 640, 480);

      // 그리드 라인
      terrainCtx.strokeStyle = "#374151";
      terrainCtx.lineWidth = 0.5;
      
      // 세로 그리드
      for (let i = 0; i <= 16; i++) {
        terrainCtx.beginPath();
        terrainCtx.moveTo(i * 40, 0);
        terrainCtx.lineTo(i * 40, 480);
        terrainCtx.stroke();
      }
      
      // 가로 그리드
      for (let i = 0; i <= 12; i++) {
        terrainCtx.beginPath();
        terrainCtx.moveTo(0, i * 40);
        terrainCtx.lineTo(640, i * 40);
        terrainCtx.stroke();
      }

      // 지형 요소들 렌더링
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

    // 캐시된 지형을 메인 캔버스에 그리기
    const dpr = window.devicePixelRatio || 1;
    mainCtx.drawImage(
      terrainCanvasRef.current, 
      0, 0, 
      canvasWidth / dpr, 
      canvasHeight / dpr
    );
  }, [terrainFeatures, canvasWidth, canvasHeight]);

  return {
    terrainCanvasRef,
    needsTerrainRedraw,
    drawTerrainToCanvas,
  };
} 