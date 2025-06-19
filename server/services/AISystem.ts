import { type BattleState } from "@shared/schema";

interface AIDecision {
  type: "MOVE" | "ATTACK" | "COMMUNICATE";
  pilotName: string;
  dialogue?: string;
  newPosition?: { x: number; y: number };
  targetIndex?: number;
}

export class AISystem {
  private pilotPersonalities = {
    1: { name: "SASHA-03", traits: ["AGGRESSIVE", "RIVER"], dialogues: ["Let's go!", "I'll take point!", "Target acquired!"] },
    2: { name: "MENTE-11", traits: ["ANALYTICAL", "KNIGHT"], dialogues: ["Analyzing situation...", "Coordinating support.", "Formation holding."] },
    3: { name: "AZUMA-07", traits: ["CAUTIOUS", "ARBITER"], dialogues: ["Maintaining overwatch.", "Taking the shot.", "Target locked."] },
    101: { name: "MARCUS", traits: ["VETERAN"], dialogues: ["Experience tells!", "Hold formation!", "Push forward!"] },
    102: { name: "RAVEN", traits: ["TACTICAL"], dialogues: ["Calculating angles...", "Covering fire!", "Repositioning."] },
    103: { name: "STEEL", traits: ["AGGRESSIVE"], dialogues: ["Bring it on!", "No mercy!", "Full assault!"] }
  };

  makeDecision(participant: any, battleState: BattleState, team: string): AIDecision {
    const personality = this.pilotPersonalities[participant.pilotId as keyof typeof this.pilotPersonalities] || {
      name: participant.pilotName || "Unknown Pilot",
      traits: ["BALANCED"],
      dialogues: ["Engaging target!", "Moving to position!", "Roger that!"]
    };
    const randomAction = Math.random();
    
    // Higher chance of communication early in battle
    if (battleState.turn < 5 && randomAction < 0.3) {
      return {
        type: "COMMUNICATE",
        pilotName: personality.name,
        dialogue: personality.dialogues[Math.floor(Math.random() * personality.dialogues.length)]
      };
    }

    // Movement decision
    if (randomAction < 0.4) {
      const newPosition = this.calculateNewPosition(participant.position, team);
      return {
        type: "MOVE",
        pilotName: personality.name,
        newPosition,
        dialogue: "Moving to new position."
      };
    }

    // Attack decision
    const enemies = team === "team1" 
      ? battleState.participants.slice(3, 6) 
      : battleState.participants.slice(0, 3);
    
    const availableTargets = enemies.filter(enemy => enemy.status === "active");
    
    if (availableTargets.length > 0) {
      const targetIndex = team === "team1" 
        ? 3 + Math.floor(Math.random() * availableTargets.length)
        : Math.floor(Math.random() * availableTargets.length);
      
      return {
        type: "ATTACK",
        pilotName: personality.name,
        targetIndex,
        dialogue: this.getAttackDialogue(personality.traits)
      };
    }

    // Default to communication
    return {
      type: "COMMUNICATE",
      pilotName: personality.name,
      dialogue: "Standing by for orders."
    };
  }

  private calculateNewPosition(currentPos: { x: number; y: number }, team: string): { x: number; y: number } {
    const movement = team === "team1" ? 1 : -1;
    return {
      x: Math.max(1, Math.min(14, currentPos.x + movement)),
      y: Math.max(1, Math.min(8, currentPos.y + (Math.random() > 0.5 ? 1 : -1)))
    };
  }

  private getAttackDialogue(traits: string[]): string {
    if (traits.includes("AGGRESSIVE")) {
      return ["Take this!", "No escape!", "Full power!"][Math.floor(Math.random() * 3)];
    }
    if (traits.includes("ANALYTICAL")) {
      return ["Calculated strike.", "Precision attack.", "Target confirmed."][Math.floor(Math.random() * 3)];
    }
    if (traits.includes("CAUTIOUS")) {
      return ["Careful shot.", "Taking aim...", "Steady..."][Math.floor(Math.random() * 3)];
    }
    return ["Engaging target!", "Fire!", "Attack!"][Math.floor(Math.random() * 3)];
  }
}
