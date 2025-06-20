interface GridNode {
  x: number;
  y: number;
  g: number;  // 시작점으로부터의 실제 비용
  h: number;  // 목표까지의 휴리스틱 비용
  f: number;  // g + h
  parent: GridNode | null;
  isWalkable: boolean;
  terrainCost: number;
}

interface TerrainInfo {
  x: number;
  y: number;
  type: 'cover' | 'obstacle' | 'elevation' | 'hazard';
  movementCost: number;
}

export class PathfindingService {
  private readonly GRID_WIDTH = 16;
  private readonly GRID_HEIGHT = 10;
  
  // 지형별 이동 비용
  private readonly TERRAIN_COSTS = {
    normal: 1,
    cover: 2,     // 엄폐물은 통과 비용 증가
    elevation: 1, // 고지대는 정상 비용
    hazard: 5,    // 위험지역은 회피하도록 높은 비용
    obstacle: Infinity // 통과 불가
  };

  // 기본 지형 데이터 (클라이언트와 동일)
  private readonly DEFAULT_TERRAIN: TerrainInfo[] = [
    { x: 4, y: 3, type: 'cover', movementCost: this.TERRAIN_COSTS.cover },
    { x: 8, y: 5, type: 'elevation', movementCost: this.TERRAIN_COSTS.elevation },
    { x: 12, y: 7, type: 'obstacle', movementCost: this.TERRAIN_COSTS.obstacle },
    { x: 6, y: 9, type: 'hazard', movementCost: this.TERRAIN_COSTS.hazard },
    { x: 10, y: 2, type: 'cover', movementCost: this.TERRAIN_COSTS.cover }
  ];

  /**
   * A* 알고리즘을 사용하여 최적 경로 찾기
   */
  findPath(
    start: { x: number; y: number }, 
    goal: { x: number; y: number },
    occupiedPositions: { x: number; y: number }[] = [],
    enemyPositions: { x: number; y: number }[] = [],
    maxDistance: number = 3
  ): { x: number; y: number }[] {
    
    // 경계 체크
    if (!this.isValidPosition(start) || !this.isValidPosition(goal)) {
      return [];
    }

    // 거리 제한 체크
    const directDistance = this.calculateManhattanDistance(start, goal);
    if (directDistance > maxDistance) {
      // 목표가 너무 멀면 목표 방향으로 최대 거리만큼 이동
      return this.findDirectionalMove(start, goal, maxDistance);
    }

    // 그리드 초기화
    const grid = this.createGrid(occupiedPositions, enemyPositions);
    
    const openList: GridNode[] = [];
    const closedList: Set<string> = new Set();
    
    const startNode = grid[start.y][start.x];
    const goalNode = grid[goal.y][goal.x];
    
    // 목표 지점이 이동 불가능한 경우
    if (!goalNode.isWalkable) {
      return this.findNearestWalkablePosition(start, goal, grid, maxDistance);
    }
    
    startNode.g = 0;
    startNode.h = this.calculateHeuristic(startNode, goalNode);
    startNode.f = startNode.g + startNode.h;
    
    openList.push(startNode);
    
    while (openList.length > 0) {
      // f 값이 가장 낮은 노드 선택
      openList.sort((a, b) => a.f - b.f);
      const currentNode = openList.shift()!;
      
      const nodeKey = `${currentNode.x},${currentNode.y}`;
      closedList.add(nodeKey);
      
      // 목표 도달
      if (currentNode.x === goal.x && currentNode.y === goal.y) {
        return this.reconstructPath(currentNode);
      }
      
      // 인접 노드들 탐색
      const neighbors = this.getNeighbors(currentNode, grid);
      
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        
        if (closedList.has(neighborKey) || !neighbor.isWalkable) {
          continue;
        }
        
        const tentativeG = currentNode.g + neighbor.terrainCost;
        
        if (!openList.includes(neighbor)) {
          openList.push(neighbor);
        } else if (tentativeG >= neighbor.g) {
          continue;
        }
        
        neighbor.parent = currentNode;
        neighbor.g = tentativeG;
        neighbor.h = this.calculateHeuristic(neighbor, goalNode);
        neighbor.f = neighbor.g + neighbor.h;
      }
    }
    
    // 경로를 찾지 못한 경우 방향성 이동
    return this.findDirectionalMove(start, goal, Math.min(maxDistance, 2));
  }

  /**
   * 전술적 위치 찾기 (엄폐물, 고지대 우선)
   */
  findTacticalPosition(
    start: { x: number; y: number },
    enemies: { x: number; y: number }[] = [],
    allies: { x: number; y: number }[] = [],
    preferCover: boolean = true
  ): { x: number; y: number } {
    
    const candidates: Array<{ pos: { x: number; y: number }, score: number }> = [];
    
    // 이동 가능한 범위 내에서 후보 위치들 평가
    for (let dx = -3; dx <= 3; dx++) {
      for (let dy = -3; dy <= 3; dy++) {
        const pos = { x: start.x + dx, y: start.y + dy };
        
        if (!this.isValidPosition(pos) || (dx === 0 && dy === 0)) continue;
        
        const path = this.findPath(start, pos, allies.concat(enemies));
        if (path.length === 0) continue;
        
        const score = this.evaluateTacticalPosition(pos, enemies, allies, preferCover);
        candidates.push({ pos, score });
      }
    }
    
    if (candidates.length === 0) {
      return this.findDirectionalMove(start, { x: start.x + 1, y: start.y }, 1)[0] || start;
    }
    
    // 점수가 가장 높은 위치 선택
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].pos;
  }

  /**
   * 그리드 생성
   */
  private createGrid(
    occupiedPositions: { x: number; y: number }[] = [],
    enemyPositions: { x: number; y: number }[] = []
  ): GridNode[][] {
    const grid: GridNode[][] = [];
    
    for (let y = 0; y < this.GRID_HEIGHT; y++) {
      grid[y] = [];
      for (let x = 0; x < this.GRID_WIDTH; x++) {
        const terrain = this.DEFAULT_TERRAIN.find(t => t.x === x && t.y === y);
        const isOccupied = occupiedPositions.some(pos => pos.x === x && pos.y === y);
        const isEnemyZone = enemyPositions.some(pos => 
          Math.abs(pos.x - x) <= 1 && Math.abs(pos.y - y) <= 1
        );
        
        grid[y][x] = {
          x,
          y,
          g: 0,
          h: 0,
          f: 0,
          parent: null,
          isWalkable: !isOccupied && (!terrain || terrain.type !== 'obstacle'),
          terrainCost: terrain ? terrain.movementCost : this.TERRAIN_COSTS.normal
        };
        
        // 적 주변 위험지역 비용 증가
        if (isEnemyZone && grid[y][x].isWalkable) {
          grid[y][x].terrainCost += 2;
        }
      }
    }
    
    return grid;
  }

  /**
   * 인접 노드들 가져오기 (8방향)
   */
  private getNeighbors(node: GridNode, grid: GridNode[][]): GridNode[] {
    const neighbors: GridNode[] = [];
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
    
    for (const [dx, dy] of directions) {
      const x = node.x + dx;
      const y = node.y + dy;
      
      if (this.isValidPosition({ x, y })) {
        neighbors.push(grid[y][x]);
      }
    }
    
    return neighbors;
  }

  /**
   * 휴리스틱 계산 (맨해튼 거리)
   */
  private calculateHeuristic(nodeA: GridNode, nodeB: GridNode): number {
    return Math.abs(nodeA.x - nodeB.x) + Math.abs(nodeA.y - nodeB.y);
  }

  /**
   * 맨해튼 거리 계산
   */
  private calculateManhattanDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  /**
   * 경로 재구성
   */
  private reconstructPath(goalNode: GridNode): { x: number; y: number }[] {
    const path: { x: number; y: number }[] = [];
    let currentNode: GridNode | null = goalNode;
    
    while (currentNode) {
      path.unshift({ x: currentNode.x, y: currentNode.y });
      currentNode = currentNode.parent;
    }
    
    // 시작점 제외하고 반환
    return path.slice(1);
  }

  /**
   * 유효한 위치인지 확인
   */
  private isValidPosition(pos: { x: number; y: number }): boolean {
    return pos.x >= 0 && pos.x < this.GRID_WIDTH && pos.y >= 0 && pos.y < this.GRID_HEIGHT;
  }

  /**
   * 방향성 이동 (경로를 찾지 못했을 때)
   */
  private findDirectionalMove(
    start: { x: number; y: number }, 
    goal: { x: number; y: number }, 
    maxSteps: number
  ): { x: number; y: number }[] {
    const dx = goal.x - start.x;
    const dy = goal.y - start.y;
    
    const stepX = dx === 0 ? 0 : Math.sign(dx);
    const stepY = dy === 0 ? 0 : Math.sign(dy);
    
    const steps = Math.min(maxSteps, Math.max(Math.abs(dx), Math.abs(dy)));
    const path: { x: number; y: number }[] = [];
    
    for (let i = 1; i <= steps; i++) {
      const newPos = {
        x: Math.max(0, Math.min(this.GRID_WIDTH - 1, start.x + stepX * i)),
        y: Math.max(0, Math.min(this.GRID_HEIGHT - 1, start.y + stepY * i))
      };
      path.push(newPos);
    }
    
    return path;
  }

  /**
   * 가장 가까운 이동 가능한 위치 찾기
   */
  private findNearestWalkablePosition(
    start: { x: number; y: number },
    goal: { x: number; y: number },
    grid: GridNode[][],
    maxDistance: number
  ): { x: number; y: number }[] {
    
    let bestPos = start;
    let bestDistance = Infinity;
    
    for (let radius = 1; radius <= maxDistance; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          if (Math.abs(dx) + Math.abs(dy) !== radius) continue;
          
          const pos = { x: goal.x + dx, y: goal.y + dy };
          if (!this.isValidPosition(pos)) continue;
          
          if (grid[pos.y][pos.x].isWalkable) {
            const distance = this.calculateManhattanDistance(start, pos);
            if (distance < bestDistance) {
              bestDistance = distance;
              bestPos = pos;
            }
          }
        }
      }
      
      if (bestPos !== start) break;
    }
    
    return bestPos === start ? [] : this.findPath(start, bestPos);
  }

  /**
   * 전술적 위치 평가
   */
  private evaluateTacticalPosition(
    pos: { x: number; y: number },
    enemies: { x: number; y: number }[],
    allies: { x: number; y: number }[],
    preferCover: boolean
  ): number {
    let score = 0;
    
    // 지형 보너스
    const terrain = this.DEFAULT_TERRAIN.find(t => t.x === pos.x && t.y === pos.y);
    if (terrain) {
      switch (terrain.type) {
        case 'cover':
          score += preferCover ? 20 : 5;
          break;
        case 'elevation':
          score += 15;
          break;
        case 'hazard':
          score -= 10;
          break;
      }
    }
    
    // 적과의 거리 (너무 가깝지 않게)
    const avgEnemyDistance = enemies.length > 0 
      ? enemies.reduce((sum, enemy) => sum + this.calculateManhattanDistance(pos, enemy), 0) / enemies.length
      : 10;
    
    if (avgEnemyDistance >= 2 && avgEnemyDistance <= 4) {
      score += 10; // 적절한 교전거리
    } else if (avgEnemyDistance < 2) {
      score -= 15; // 너무 가까움
    }
    
    // 아군과의 협력 거리
    const nearbyAllies = allies.filter(ally => this.calculateManhattanDistance(pos, ally) <= 3).length;
    score += nearbyAllies * 5;
    
    return score;
  }
}