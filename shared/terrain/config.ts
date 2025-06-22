// Centralized terrain configuration
export const TERRAIN_FEATURES = [
  { x: 4, y: 3, type: "cover" as const, effect: "방어력 +20%" },
  { x: 8, y: 5, type: "elevation" as const, effect: "사거리 +1" },
  { x: 12, y: 7, type: "obstacle" as const, effect: "이동 제한" },
  { x: 6, y: 9, type: "hazard" as const, effect: "턴당 HP -5" },
  { x: 10, y: 2, type: "cover" as const, effect: "방어력 +20%" },
  { x: 14, y: 4, type: "elevation" as const, effect: "사거리 +1" },
  { x: 3, y: 8, type: "cover" as const, effect: "방어력 +20%" },
  { x: 9, y: 6, type: "hazard" as const, effect: "턴당 HP -5" },
] as const;

export const BATTLEFIELD_BOUNDS = {
  minX: 1,
  maxX: 15,
  minY: 1,
  maxY: 11,
} as const;