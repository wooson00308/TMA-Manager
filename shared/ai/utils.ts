export interface Position {
  x: number;
  y: number;
}

export interface Entity {
  position: Position;
  hp?: number;
}

export interface Personality {
  aggressive: number;
  tactical: number;
  supportive: number;
}

// Clamp helper to keep positions inside battlefield bounds (1-based inclusive)
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export type TeamSide = string; // e.g. "ally" | "enemy" | "team1" | "team2"

/**
 * Retreat two tiles away from enemy front line toward own side.
 */
export function calculateRetreatPosition(
  pos: Position,
  team: TeamSide,
  enemies: Entity[]
): Position {
  const safeDirection = team === "ally" || team === "team1" ? -2 : 2;
  return {
    x: clamp(pos.x + safeDirection, 1, 15),
    y: clamp(pos.y + (Math.random() > 0.5 ? -1 : 1), 1, 11),
  };
}

/**
 * Scout two tiles deeper into enemy territory.
 */
export function calculateScoutPosition(
  pos: Position,
  team: TeamSide,
  enemies: Entity[]
): Position {
  const scoutDirection = team === "ally" || team === "team1" ? 2 : -2;
  return {
    x: clamp(pos.x + scoutDirection, 1, 15),
    y: clamp(pos.y, 1, 11),
  };
}

/**
 * Choose a tactical midpoint between the attacker and nearest enemy.
 * Falls back to a small advance / retreat when no enemies remain.
 */
export function calculateTacticalPosition(
  pos: Position,
  team: TeamSide,
  enemies: Entity[],
  allies: Entity[] = []
): Position {
  if (enemies.length === 0) {
    const direction = team === "ally" || team === "team1" ? 1 : -1;
    return {
      x: clamp(pos.x + direction, 1, 15),
      y: clamp(pos.y + (Math.random() > 0.5 ? 1 : -1), 1, 11),
    };
  }

  const nearestEnemy = enemies.reduce((prev, curr) => {
    const prevDist =
      Math.abs(prev.position.x - pos.x) + Math.abs(prev.position.y - pos.y);
    const currDist =
      Math.abs(curr.position.x - pos.x) + Math.abs(curr.position.y - pos.y);
    return currDist < prevDist ? curr : prev;
  });

  const optimalX = Math.floor((pos.x + nearestEnemy.position.x) / 2);
  const optimalY = Math.floor((pos.y + nearestEnemy.position.y) / 2);

  return {
    x: clamp(optimalX, 1, 15),
    y: clamp(optimalY, 1, 11),
  };
}

/**
 * Select the most advantageous enemy target.
 * If a personality is supplied, tailor the choice (aggressive → lowest HP, tactical → weighted distance/HP).
 */
export function selectBestTarget(
  enemies: Entity[],
  attacker: Entity,
  personality?: Personality
): Entity {
  if (enemies.length === 0) throw new Error("No enemies provided");

  // Aggressive pilots favour finishing low-HP foes
  if (personality && personality.aggressive > 0.7) {
    return enemies.reduce((prev, curr) => (curr.hp! < prev.hp! ? curr : prev));
  }

  // Tactical pilots weigh distance & HP
  if (personality && personality.tactical > 0.7) {
    return enemies.reduce((prev, curr) => {
      const prevScore =
        (prev.hp ?? 100) +
        (Math.abs(prev.position.x - attacker.position.x) +
          Math.abs(prev.position.y - attacker.position.y)) * 3;
      const currScore =
        (curr.hp ?? 100) +
        (Math.abs(curr.position.x - attacker.position.x) +
          Math.abs(curr.position.y - attacker.position.y)) * 3;
      return currScore < prevScore ? curr : prev;
    });
  }

  // Default: nearest target
  return enemies.reduce((prev, curr) => {
    const prevDist =
      Math.abs(prev.position.x - attacker.position.x) +
      Math.abs(prev.position.y - attacker.position.y);
    const currDist =
      Math.abs(curr.position.x - attacker.position.x) +
      Math.abs(curr.position.y - attacker.position.y);
    return currDist < prevDist ? curr : prev;
  });
} 