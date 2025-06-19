import { InsertPilot } from '../shared/schema';

// Generate realistic pilot data with career progression
export function generateComprehensivePilotData(): InsertPilot[] {
  const trinitySquadPilots: InsertPilot[] = [
    {
      name: "Sasha Volkov",
      callsign: "Ice Queen",
      dormitory: "Knight",
      rating: 92,
      reaction: 88,
      accuracy: 95,
      tactical: 89,
      teamwork: 87,
      traits: ["ANALYTICAL", "CAUTIOUS", "KNIGHT", "ACE"],
      isActive: true,
      experience: 1250,
      wins: 45,
      losses: 8,
      fatigue: 25,
      morale: 85,
      battleCount: 53,
      mvpCount: 12,
      criticalHits: 127,
      damageDealt: 45780,
      damageTaken: 12340,
      averageAccuracy: 87.5,
      longestWinStreak: 8,
      currentWinStreak: 3,
      specialistRole: "Precision Striker",
      mentalState: "Focused",
      injuryStatus: "Healthy",
      salary: 8500,
      bonusEarned: 3200,
      performanceRating: 8.7,
      consistency: 85,
      clutchFactor: 78,
      leadership: 72,
      adaptability: 80,
      trainingHours: 340,
      trainingEfficiency: 1.2,
      skillGrowthRate: 1.1,
      preferredMechType: "Knight",
      mechCompatibility: ["Knight", "Arbiter"],
      equipmentMastery: 85
    },
    {
      name: "Marcus Chen",
      callsign: "Thunder",
      dormitory: "Arbiter",
      rating: 88,
      reaction: 82,
      accuracy: 91,
      tactical: 94,
      teamwork: 81,
      traits: ["ANALYTICAL", "SNIPER", "VETERAN", "ARBITER"],
      isActive: true,
      experience: 980,
      wins: 37,
      losses: 12,
      fatigue: 35,
      morale: 78,
      battleCount: 49,
      mvpCount: 8,
      criticalHits: 98,
      damageDealt: 52340,
      damageTaken: 8760,
      averageAccuracy: 89.2,
      longestWinStreak: 6,
      currentWinStreak: 1,
      specialistRole: "Long Range Specialist",
      mentalState: "Confident",
      injuryStatus: "Healthy",
      salary: 7800,
      bonusEarned: 2100,
      performanceRating: 8.3,
      consistency: 88,
      clutchFactor: 82,
      leadership: 75,
      adaptability: 73,
      trainingHours: 285,
      trainingEfficiency: 1.1,
      skillGrowthRate: 1.0,
      preferredMechType: "Arbiter",
      mechCompatibility: ["Arbiter", "Knight"],
      equipmentMastery: 79
    },
    {
      name: "Kai Nakamura",
      callsign: "Storm",
      dormitory: "River",
      rating: 85,
      reaction: 93,
      accuracy: 79,
      tactical: 82,
      teamwork: 88,
      traits: ["AGGRESSIVE", "ASSAULT", "RIVER", "VETERAN"],
      isActive: true,
      experience: 875,
      wins: 34,
      losses: 15,
      fatigue: 42,
      morale: 82,
      battleCount: 49,
      mvpCount: 6,
      criticalHits: 76,
      damageDealt: 38920,
      damageTaken: 18540,
      averageAccuracy: 75.8,
      longestWinStreak: 5,
      currentWinStreak: 0,
      specialistRole: "Assault Vanguard",
      mentalState: "Aggressive",
      injuryStatus: "Minor Fatigue",
      salary: 7200,
      bonusEarned: 1800,
      performanceRating: 7.9,
      consistency: 72,
      clutchFactor: 89,
      leadership: 81,
      adaptability: 85,
      trainingHours: 220,
      trainingEfficiency: 0.9,
      skillGrowthRate: 1.2,
      preferredMechType: "River",
      mechCompatibility: ["River", "Knight"],
      equipmentMastery: 74
    },
    {
      name: "Zara Al-Rashid",
      callsign: "Mirage",
      dormitory: "Arbiter",
      rating: 79,
      reaction: 77,
      accuracy: 86,
      tactical: 84,
      teamwork: 73,
      traits: ["CAUTIOUS", "SNIPER", "INDEPENDENT", "GENIUS"],
      isActive: true,
      experience: 720,
      wins: 28,
      losses: 11,
      fatigue: 18,
      morale: 88,
      battleCount: 39,
      mvpCount: 4,
      criticalHits: 62,
      damageDealt: 31240,
      damageTaken: 7890,
      averageAccuracy: 83.4,
      longestWinStreak: 7,
      currentWinStreak: 4,
      specialistRole: "Support Sniper",
      mentalState: "Calm",
      injuryStatus: "Healthy",
      salary: 6800,
      bonusEarned: 1200,
      performanceRating: 7.6,
      consistency: 81,
      clutchFactor: 68,
      leadership: 58,
      adaptability: 77,
      trainingHours: 180,
      trainingEfficiency: 1.3,
      skillGrowthRate: 1.1,
      preferredMechType: "Arbiter",
      mechCompatibility: ["Arbiter"],
      equipmentMastery: 71
    },
    {
      name: "Diego Santos",
      callsign: "Blade",
      dormitory: "River",
      rating: 76,
      reaction: 81,
      accuracy: 73,
      tactical: 70,
      teamwork: 79,
      traits: ["AGGRESSIVE", "ASSAULT", "ROOKIE", "RIVER"],
      isActive: true,
      experience: 480,
      wins: 19,
      losses: 8,
      fatigue: 28,
      morale: 91,
      battleCount: 27,
      mvpCount: 2,
      criticalHits: 34,
      damageDealt: 18650,
      damageTaken: 12100,
      averageAccuracy: 71.2,
      longestWinStreak: 4,
      currentWinStreak: 2,
      specialistRole: "Close Combat",
      mentalState: "Enthusiastic",
      injuryStatus: "Healthy",
      salary: 5200,
      bonusEarned: 600,
      performanceRating: 7.1,
      consistency: 68,
      clutchFactor: 74,
      leadership: 65,
      adaptability: 82,
      trainingHours: 95,
      trainingEfficiency: 1.0,
      skillGrowthRate: 1.4,
      preferredMechType: "River",
      mechCompatibility: ["River"],
      equipmentMastery: 58
    }
  ];

  const recruitablePilots: InsertPilot[] = [
    {
      name: "Viktor Kane",
      callsign: "Raven",
      dormitory: "Knight",
      rating: 82,
      reaction: 85,
      accuracy: 79,
      tactical: 81,
      teamwork: 76,
      traits: ["ACE", "AGGRESSIVE", "KNIGHT"],
      isActive: false,
      experience: 920,
      wins: 31,
      losses: 14,
      fatigue: 15,
      morale: 75,
      battleCount: 45,
      mvpCount: 7,
      criticalHits: 89,
      damageDealt: 34200,
      damageTaken: 14300,
      averageAccuracy: 78.9,
      longestWinStreak: 6,
      currentWinStreak: 0,
      specialistRole: "Heavy Assault",
      mentalState: "Determined",
      injuryStatus: "Healthy",
      salary: 7000,
      bonusEarned: 1500,
      performanceRating: 7.8,
      consistency: 76,
      clutchFactor: 84,
      leadership: 79,
      adaptability: 71,
      trainingHours: 240,
      trainingEfficiency: 1.0,
      skillGrowthRate: 0.9,
      preferredMechType: "Knight",
      mechCompatibility: ["Knight", "Custom"],
      equipmentMastery: 76
    },
    {
      name: "Luna Park",
      callsign: "Shadow",
      dormitory: "Arbiter",
      rating: 89,
      reaction: 72,
      accuracy: 96,
      tactical: 91,
      teamwork: 65,
      traits: ["GENIUS", "SNIPER", "INDEPENDENT", "ARBITER"],
      isActive: false,
      experience: 1100,
      wins: 42,
      losses: 9,
      fatigue: 22,
      morale: 68,
      battleCount: 51,
      mvpCount: 14,
      criticalHits: 156,
      damageDealt: 58900,
      damageTaken: 6750,
      averageAccuracy: 92.3,
      longestWinStreak: 9,
      currentWinStreak: 0,
      specialistRole: "Elite Marksman",
      mentalState: "Aloof",
      injuryStatus: "Healthy",
      salary: 9200,
      bonusEarned: 4100,
      performanceRating: 9.1,
      consistency: 91,
      clutchFactor: 87,
      leadership: 45,
      adaptability: 68,
      trainingHours: 380,
      trainingEfficiency: 1.4,
      skillGrowthRate: 1.0,
      preferredMechType: "Arbiter",
      mechCompatibility: ["Arbiter"],
      equipmentMastery: 93
    },
    {
      name: "Marco Silva",
      callsign: "Tide",
      dormitory: "River",
      rating: 70,
      reaction: 68,
      accuracy: 71,
      tactical: 75,
      teamwork: 85,
      traits: ["VETERAN", "SUPPORT", "COOPERATIVE", "RIVER"],
      isActive: false,
      experience: 650,
      wins: 24,
      losses: 18,
      fatigue: 31,
      morale: 79,
      battleCount: 42,
      mvpCount: 3,
      criticalHits: 41,
      damageDealt: 22100,
      damageTaken: 15800,
      averageAccuracy: 69.5,
      longestWinStreak: 3,
      currentWinStreak: 0,
      specialistRole: "Team Coordinator",
      mentalState: "Stable",
      injuryStatus: "Healthy",
      salary: 5800,
      bonusEarned: 800,
      performanceRating: 6.8,
      consistency: 79,
      clutchFactor: 62,
      leadership: 88,
      adaptability: 85,
      trainingHours: 320,
      trainingEfficiency: 0.8,
      skillGrowthRate: 0.7,
      preferredMechType: "River",
      mechCompatibility: ["River", "Knight"],
      equipmentMastery: 65
    },
    {
      name: "Aria Kim",
      callsign: "Phoenix",
      dormitory: "Knight",
      rating: 78,
      reaction: 74,
      accuracy: 81,
      tactical: 79,
      teamwork: 82,
      traits: ["CAUTIOUS", "DEFENSIVE", "KNIGHT", "VETERAN"],
      isActive: false,
      experience: 850,
      wins: 29,
      losses: 16,
      fatigue: 26,
      morale: 84,
      battleCount: 45,
      mvpCount: 5,
      criticalHits: 67,
      damageDealt: 28400,
      damageTaken: 11200,
      averageAccuracy: 79.8,
      longestWinStreak: 5,
      currentWinStreak: 0,
      specialistRole: "Guardian",
      mentalState: "Protective",
      injuryStatus: "Healthy",
      salary: 6500,
      bonusEarned: 1100,
      performanceRating: 7.4,
      consistency: 84,
      clutchFactor: 71,
      leadership: 76,
      adaptability: 73,
      trainingHours: 280,
      trainingEfficiency: 1.0,
      skillGrowthRate: 0.8,
      preferredMechType: "Knight",
      mechCompatibility: ["Knight"],
      equipmentMastery: 72
    },
    {
      name: "Jamal Washington",
      callsign: "Forge",
      dormitory: "Knight",
      rating: 74,
      reaction: 70,
      accuracy: 76,
      tactical: 78,
      teamwork: 80,
      traits: ["ANALYTICAL", "DEFENSIVE", "KNIGHT"],
      isActive: false,
      experience: 520,
      wins: 21,
      losses: 12,
      fatigue: 19,
      morale: 86,
      battleCount: 33,
      mvpCount: 2,
      criticalHits: 38,
      damageDealt: 19800,
      damageTaken: 9600,
      averageAccuracy: 74.2,
      longestWinStreak: 4,
      currentWinStreak: 0,
      specialistRole: "Tactical Support",
      mentalState: "Methodical",
      injuryStatus: "Healthy",
      salary: 5400,
      bonusEarned: 700,
      performanceRating: 7.0,
      consistency: 80,
      clutchFactor: 66,
      leadership: 72,
      adaptability: 74,
      trainingHours: 160,
      trainingEfficiency: 1.1,
      skillGrowthRate: 1.0,
      preferredMechType: "Knight",
      mechCompatibility: ["Knight", "Arbiter"],
      equipmentMastery: 68
    },
    {
      name: "Yuki Tanaka",
      callsign: "Frost",
      dormitory: "River",
      rating: 68,
      reaction: 66,
      accuracy: 70,
      tactical: 72,
      teamwork: 82,
      traits: ["CAUTIOUS", "SCOUT", "COOPERATIVE", "RIVER"],
      isActive: false,
      experience: 380,
      wins: 15,
      losses: 11,
      fatigue: 12,
      morale: 88,
      battleCount: 26,
      mvpCount: 1,
      criticalHits: 22,
      damageDealt: 12600,
      damageTaken: 8900,
      averageAccuracy: 67.8,
      longestWinStreak: 3,
      currentWinStreak: 0,
      specialistRole: "Reconnaissance",
      mentalState: "Observant",
      injuryStatus: "Healthy",
      salary: 4800,
      bonusEarned: 400,
      performanceRating: 6.5,
      consistency: 75,
      clutchFactor: 58,
      leadership: 64,
      adaptability: 79,
      trainingHours: 120,
      trainingEfficiency: 1.2,
      skillGrowthRate: 1.1,
      preferredMechType: "River",
      mechCompatibility: ["River"],
      equipmentMastery: 62
    }
  ];

  return [...trinitySquadPilots, ...recruitablePilots];
}

// Generate team performance data
export function generateTeamData() {
  return {
    trinitySquad: {
      currentSeason: 3,
      currentWeek: 8,
      seasonWins: 6,
      seasonLosses: 2,
      totalWins: 47,
      totalLosses: 23,
      credits: 15420,
      reputation: 78,
      leagueRank: 3,
      facilities: {
        trainingLevel: 2,
        medicalLevel: 1,
        techLevel: 2,
        dormitoryLevel: 3
      },
      staff: {
        headCoach: "Commander Sarah Mitchell",
        tacticalAnalyst: "Dr. Alex Chen",
        medicalOfficer: "Dr. Maria Rodriguez",
        mechEngineer: "Chief Engineer Johnson"
      },
      achievements: [
        "Season 1 Champion",
        "Perfect Season Record",
        "Best Rookie Team"
      ]
    }
  };
}

// Performance tracking system
export function calculatePilotPerformanceMetrics(pilot: any) {
  const winRate = pilot.wins / (pilot.wins + pilot.losses);
  const damageRatio = pilot.damageDealt / Math.max(pilot.damageTaken, 1);
  const mvpRate = pilot.mvpCount / pilot.battleCount;
  
  return {
    overallScore: Math.round((winRate * 40 + damageRatio * 30 + mvpRate * 30)),
    strengths: determineStrengths(pilot),
    weaknesses: determineWeaknesses(pilot),
    growthPotential: calculateGrowthPotential(pilot),
    recommendations: generateTrainingRecommendations(pilot)
  };
}

function determineStrengths(pilot: any): string[] {
  const strengths = [];
  if (pilot.accuracy > 85) strengths.push("뛰어난 정확도");
  if (pilot.reaction > 85) strengths.push("빠른 반응속도");
  if (pilot.tactical > 85) strengths.push("탁월한 전술 이해");
  if (pilot.teamwork > 85) strengths.push("우수한 팀워크");
  if (pilot.clutchFactor > 80) strengths.push("압박감 극복");
  if (pilot.consistency > 85) strengths.push("안정적인 성과");
  return strengths;
}

function determineWeaknesses(pilot: any): string[] {
  const weaknesses = [];
  if (pilot.accuracy < 65) weaknesses.push("정확도 부족");
  if (pilot.reaction < 65) weaknesses.push("반응속도 개선 필요");
  if (pilot.tactical < 65) weaknesses.push("전술 이해도 부족");
  if (pilot.teamwork < 65) weaknesses.push("팀워크 향상 필요");
  if (pilot.fatigue > 70) weaknesses.push("피로도 관리");
  if (pilot.morale < 60) weaknesses.push("사기 진작 필요");
  return weaknesses;
}

function calculateGrowthPotential(pilot: any): number {
  const age = Math.floor(Math.random() * 10) + 18; // Simulate age 18-28
  const experienceFactor = Math.min(pilot.experience / 1000, 1);
  const ageFactor = age < 25 ? 1.2 : age < 30 ? 1.0 : 0.8;
  
  return Math.round(pilot.skillGrowthRate * ageFactor * (1 - experienceFactor) * 100);
}

function generateTrainingRecommendations(pilot: any): string[] {
  const recommendations = [];
  
  if (pilot.accuracy < pilot.reaction) {
    recommendations.push("정확도 훈련 집중");
  }
  if (pilot.tactical < 70) {
    recommendations.push("전술 교육 프로그램");
  }
  if (pilot.fatigue > 60) {
    recommendations.push("휴식 및 컨디션 관리");
  }
  if (pilot.teamwork < 75) {
    recommendations.push("팀 협동 훈련");
  }
  
  return recommendations;
}

export const pilotCareerProgression = {
  rookie: { experience: 0, skills: { min: 45, max: 70 } },
  regular: { experience: 500, skills: { min: 60, max: 80 } },
  veteran: { experience: 1000, skills: { min: 70, max: 90 } },
  ace: { experience: 1500, skills: { min: 80, max: 95 } },
  legend: { experience: 2500, skills: { min: 90, max: 99 } }
};