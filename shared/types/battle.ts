// Enhanced type definitions for battle system
export interface SafeBattleParticipant {
  pilotId: number;
  mechId: number;
  team: "team1" | "team2";
  position: { x: number; y: number };
  hp: number;
  status: "active" | "damaged" | "destroyed";
  lastActionTime?: number;
  range?: number;
}

export interface SafeAIAction {
  type: "MOVE" | "ATTACK" | "COMMUNICATE" | "DEFEND" | "SUPPORT" | "SCOUT" | "RETREAT" | "SPECIAL";
  actor: SafeBattleParticipant;
  target?: SafeBattleParticipant;
  newPosition?: { x: number; y: number };
  ability?: string;
  message: string;
}

export type TeamIdentifier = "team1" | "team2" | "ally" | "enemy";

export function isEnemyPilot(pilotId: number, currentTeam: TeamIdentifier): boolean {
  // Consistent team identification logic
  if (currentTeam === "team1" || currentTeam === "ally") {
    return pilotId >= 100;
  } else {
    return pilotId < 100;
  }
}

export function normalizeTeamName(team: string): TeamIdentifier {
  switch (team.toLowerCase()) {
    case "team1":
    case "ally":
      return "team1";
    case "team2": 
    case "enemy":
      return "team2";
    default:
      return "team1";
  }
}