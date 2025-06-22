export interface Position {
  x: number;
  y: number;
}

export interface Entity {
  position: Position;
  hp?: number;
  range?: number;
  mechId?: number;
}

export interface TerrainFeature {
  x: number;
  y: number;
  type: "cover" | "obstacle" | "elevation" | "hazard";
  effect: string;
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
 * Calculate terrain advantage multiplier for a given position
 */
export function evaluateTerrainAdvantage(position: Position, terrainFeatures: TerrainFeature[]): number {
  const feature = terrainFeatures.find(t => t.x === position.x && t.y === position.y);
  switch (feature?.type) {
    case 'cover': return 0.8; // 20% defense bonus
    case 'elevation': return 1.2; // 20% attack bonus
    case 'obstacle': return 0.1; // Movement restricted
    case 'hazard': return 0.3; // Dangerous area
    default: return 1.0;
  }
}

/**
 * Check if target is within weapon range
 */
export function isInRange(attacker: Position, target: Position, weaponRange: number = 3): boolean {
  const distance = Math.abs(attacker.x - target.x) + Math.abs(attacker.y - target.y);
  return distance <= weaponRange;
}

/**
 * Calculate line of sight between two positions (basic implementation)
 */
export function hasLineOfSight(from: Position, to: Position, terrainFeatures: TerrainFeature[]): boolean {
  // Simple check: no obstacles in direct path
  const dx = Math.sign(to.x - from.x);
  const dy = Math.sign(to.y - from.y);
  
  let current = { x: from.x, y: from.y };
  while (current.x !== to.x || current.y !== to.y) {
    current.x += dx;
    current.y += dy;
    
    const obstacle = terrainFeatures.find(t => 
      t.x === current.x && t.y === current.y && t.type === 'obstacle'
    );
    if (obstacle) return false;
  }
  return true;
}

/**
 * Enhanced target scoring with terrain and tactical considerations
 */
export function calculateTargetScore(
  target: Entity,
  attacker: Entity,
  personality: Personality,
  terrainFeatures: TerrainFeature[] = []
): number {
  const distance = Math.abs(target.position.x - attacker.position.x) + 
                  Math.abs(target.position.y - attacker.position.y);
  
  // Base score from HP and distance
  let score = (100 - (target.hp || 100)) / 100; // Prefer damaged targets
  score += (10 - distance) / 10; // Prefer closer targets
  
  // Terrain considerations
  const targetTerrain = evaluateTerrainAdvantage(target.position, terrainFeatures);
  const attackerTerrain = evaluateTerrainAdvantage(attacker.position, terrainFeatures);
  
  // If target is in cover, reduce score
  if (targetTerrain < 1.0) {
    score *= 0.7;
  }
  
  // If attacker has elevation advantage, increase score
  if (attackerTerrain > 1.0) {
    score *= 1.3;
  }
  
  // Line of sight check
  if (!hasLineOfSight(attacker.position, target.position, terrainFeatures)) {
    score *= 0.3; // Heavily penalize if no clear shot
  }
  
  // Personality modifiers
  if (personality.aggressive > 0.7) {
    score += (100 - (target.hp || 100)) / 200; // Extra bonus for low HP targets
  }
  
  if (personality.tactical > 0.7) {
    score += (attackerTerrain - 1.0) * 0.5; // Bonus for tactical positioning
  }
  
  return Math.max(0, score);
}

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
 * Enhanced tactical positioning with terrain awareness and formation considerations.
 */
export function calculateTacticalPosition(
  pos: Position,
  team: TeamSide,
  enemies: Entity[],
  allies: Entity[] = [],
  terrainFeatures: TerrainFeature[] = []
): Position {
  if (enemies.length === 0) {
    const direction = team === "ally" || team === "team1" ? 1 : -1;
    return {
      x: clamp(pos.x + direction, 1, 15),
      y: clamp(pos.y + (Math.random() > 0.5 ? 1 : -1), 1, 11),
    };
  }

  const nearestEnemy = enemies.reduce((prev, curr) => {
    const prevDist = Math.abs(prev.position.x - pos.x) + Math.abs(prev.position.y - pos.y);
    const currDist = Math.abs(curr.position.x - pos.x) + Math.abs(curr.position.y - pos.y);
    return currDist < prevDist ? curr : prev;
  });

  // Generate potential positions around current location
  const candidates: Position[] = [];
  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = -2; dy <= 2; dy++) {
      if (dx === 0 && dy === 0) continue;
      candidates.push({
        x: clamp(pos.x + dx, 1, 15),
        y: clamp(pos.y + dy, 1, 11)
      });
    }
  }

  // Score each candidate position
  let bestPosition = pos;
  let bestScore = -1;

  for (const candidate of candidates) {
    let score = 0;

    // Terrain advantage
    const terrainScore = evaluateTerrainAdvantage(candidate, terrainFeatures);
    score += (terrainScore - 1.0) * 2; // Boost for good terrain

    // Distance to nearest enemy (optimal range ~3-4 tiles)
    const distToEnemy = Math.abs(candidate.x - nearestEnemy.position.x) + 
                       Math.abs(candidate.y - nearestEnemy.position.y);
    score += Math.max(0, 1 - Math.abs(distToEnemy - 3.5) / 5);

    // Line of sight to enemies
    if (hasLineOfSight(candidate, nearestEnemy.position, terrainFeatures)) {
      score += 0.5;
    }

    // Avoid clustering with allies
    for (const ally of allies) {
      const allyDist = Math.abs(candidate.x - ally.position.x) + 
                      Math.abs(candidate.y - ally.position.y);
      if (allyDist < 2) score -= 0.3;
    }

    // Prefer positions that don't move into hazards
    const terrainAtCandidate = terrainFeatures.find(t => t.x === candidate.x && t.y === candidate.y);
    if (terrainAtCandidate?.type === 'hazard') score -= 1.0;
    if (terrainAtCandidate?.type === 'obstacle') score -= 2.0;

    if (score > bestScore) {
      bestScore = score;
      bestPosition = candidate;
    }
  }

  return bestPosition;
}

/**
 * Select the most advantageous enemy target using enhanced scoring system.
 */
export function selectBestTarget(
  enemies: Entity[],
  attacker: Entity,
  personality?: Personality,
  terrainFeatures: TerrainFeature[] = []
): Entity {
  if (enemies.length === 0) throw new Error("No enemies provided");

  // Filter targets that are in range
  const weaponRange = attacker.range || 3;
  const targetsInRange = enemies.filter(enemy => 
    isInRange(attacker.position, enemy.position, weaponRange)
  );

  // If no targets in range, move closer to nearest
  const targetPool = targetsInRange.length > 0 ? targetsInRange : enemies;

  // Use enhanced scoring system
  return targetPool.reduce((best, current) => {
    const bestScore = calculateTargetScore(best, attacker, personality || { aggressive: 0.5, tactical: 0.5, supportive: 0.5 }, terrainFeatures);
    const currentScore = calculateTargetScore(current, attacker, personality || { aggressive: 0.5, tactical: 0.5, supportive: 0.5 }, terrainFeatures);
    
    return currentScore > bestScore ? current : best;
  });
} 