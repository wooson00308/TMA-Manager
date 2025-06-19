// Comprehensive pilot data system with realistic career progression
export interface ExtendedPilotData {
  // Basic pilot info
  id: number;
  name: string;
  callsign: string;
  dormitory: string;
  rating: number;
  reaction: number;
  accuracy: number;
  tactical: number;
  teamwork: number;
  traits: string[];
  isActive: boolean;
  experience: number;
  wins: number;
  losses: number;
  trainingUntil: Date | null;
  trainingType: string | null;
  fatigue: number;
  morale: number;

  // Extended career statistics
  battleCount: number;
  mvpCount: number;
  criticalHits: number;
  damageDealt: number;
  damageTaken: number;
  averageAccuracy: number;
  longestWinStreak: number;
  currentWinStreak: number;

  // Career progression
  joinDate: Date;
  specialistRole: string;
  mentalState: string;
  injuryStatus: string;
  contractExpiry: Date;
  salary: number;
  bonusEarned: number;

  // Performance metrics
  performanceRating: number;
  consistency: number;
  clutchFactor: number;
  leadership: number;
  adaptability: number;

  // Training data
  trainingHours: number;
  trainingEfficiency: number;
  skillGrowthRate: number;
  lastTrainingDate: Date | null;

  // Equipment preferences
  preferredMechType: string;
  mechCompatibility: string[];
  equipmentMastery: number;
}

// Generate comprehensive Trinity Squad pilots
export function generateTrinitySquadPilots(): ExtendedPilotData[] {
  const now = new Date();
  
  return [
    {
      id: 1,
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
      trainingUntil: null,
      trainingType: null,
      battleCount: 53,
      mvpCount: 12,
      criticalHits: 127,
      damageDealt: 45780,
      damageTaken: 12340,
      averageAccuracy: 87.5,
      longestWinStreak: 8,
      currentWinStreak: 3,
      joinDate: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
      specialistRole: "Precision Striker",
      mentalState: "Focused",
      injuryStatus: "Healthy",
      contractExpiry: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
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
      lastTrainingDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      preferredMechType: "Knight",
      mechCompatibility: ["Knight", "Arbiter"],
      equipmentMastery: 85
    },
    {
      id: 2,
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
      trainingUntil: null,
      trainingType: null,
      battleCount: 49,
      mvpCount: 8,
      criticalHits: 98,
      damageDealt: 52340,
      damageTaken: 8760,
      averageAccuracy: 89.2,
      longestWinStreak: 6,
      currentWinStreak: 1,
      joinDate: new Date(now.getTime() - 150 * 24 * 60 * 60 * 1000),
      specialistRole: "Long Range Specialist",
      mentalState: "Confident",
      injuryStatus: "Healthy",
      contractExpiry: new Date(now.getTime() + 300 * 24 * 60 * 60 * 1000),
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
      lastTrainingDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      preferredMechType: "Arbiter",
      mechCompatibility: ["Arbiter", "Knight"],
      equipmentMastery: 79
    },
    {
      id: 3,
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
      trainingUntil: null,
      trainingType: null,
      battleCount: 49,
      mvpCount: 6,
      criticalHits: 76,
      damageDealt: 38920,
      damageTaken: 18540,
      averageAccuracy: 75.8,
      longestWinStreak: 5,
      currentWinStreak: 0,
      joinDate: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000),
      specialistRole: "Assault Vanguard",
      mentalState: "Aggressive",
      injuryStatus: "Minor Fatigue",
      contractExpiry: new Date(now.getTime() + 240 * 24 * 60 * 60 * 1000),
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
      lastTrainingDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      preferredMechType: "River",
      mechCompatibility: ["River", "Knight"],
      equipmentMastery: 74
    },
    {
      id: 4,
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
      trainingUntil: null,
      trainingType: null,
      battleCount: 39,
      mvpCount: 4,
      criticalHits: 62,
      damageDealt: 31240,
      damageTaken: 7890,
      averageAccuracy: 83.4,
      longestWinStreak: 7,
      currentWinStreak: 4,
      joinDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      specialistRole: "Support Sniper",
      mentalState: "Calm",
      injuryStatus: "Healthy",
      contractExpiry: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
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
      lastTrainingDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      preferredMechType: "Arbiter",
      mechCompatibility: ["Arbiter"],
      equipmentMastery: 71
    },
    {
      id: 5,
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
      trainingUntil: null,
      trainingType: null,
      battleCount: 27,
      mvpCount: 2,
      criticalHits: 34,
      damageDealt: 18650,
      damageTaken: 12100,
      averageAccuracy: 71.2,
      longestWinStreak: 4,
      currentWinStreak: 2,
      joinDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      specialistRole: "Close Combat",
      mentalState: "Enthusiastic",
      injuryStatus: "Healthy",
      contractExpiry: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000),
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
      lastTrainingDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      preferredMechType: "River",
      mechCompatibility: ["River"],
      equipmentMastery: 58
    }
  ];
}

// Generate recruitable pilots
export function generateRecruitablePilots(): ExtendedPilotData[] {
  const now = new Date();
  
  return [
    {
      id: 6,
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
      trainingUntil: null,
      trainingType: null,
      battleCount: 45,
      mvpCount: 7,
      criticalHits: 89,
      damageDealt: 34200,
      damageTaken: 14300,
      averageAccuracy: 78.9,
      longestWinStreak: 6,
      currentWinStreak: 0,
      joinDate: new Date(now.getTime() - 200 * 24 * 60 * 60 * 1000),
      specialistRole: "Heavy Assault",
      mentalState: "Determined",
      injuryStatus: "Healthy",
      contractExpiry: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
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
      lastTrainingDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      preferredMechType: "Knight",
      mechCompatibility: ["Knight", "Custom"],
      equipmentMastery: 76
    },
    {
      id: 7,
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
      trainingUntil: null,
      trainingType: null,
      battleCount: 51,
      mvpCount: 14,
      criticalHits: 156,
      damageDealt: 58900,
      damageTaken: 6750,
      averageAccuracy: 92.3,
      longestWinStreak: 9,
      currentWinStreak: 0,
      joinDate: new Date(now.getTime() - 250 * 24 * 60 * 60 * 1000),
      specialistRole: "Elite Marksman",
      mentalState: "Aloof",
      injuryStatus: "Healthy",
      contractExpiry: new Date(now.getTime() + 150 * 24 * 60 * 60 * 1000),
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
      lastTrainingDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      preferredMechType: "Arbiter",
      mechCompatibility: ["Arbiter"],
      equipmentMastery: 93
    },
    {
      id: 8,
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
      trainingUntil: null,
      trainingType: null,
      battleCount: 42,
      mvpCount: 3,
      criticalHits: 41,
      damageDealt: 22100,
      damageTaken: 15800,
      averageAccuracy: 69.5,
      longestWinStreak: 3,
      currentWinStreak: 0,
      joinDate: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
      specialistRole: "Team Coordinator",
      mentalState: "Stable",
      injuryStatus: "Healthy",
      contractExpiry: new Date(now.getTime() + 80 * 24 * 60 * 60 * 1000),
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
      lastTrainingDate: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
      preferredMechType: "River",
      mechCompatibility: ["River", "Knight"],
      equipmentMastery: 65
    }
  ];
}

// Performance analysis system
export function analyzePilotPerformance(pilot: ExtendedPilotData) {
  const winRate = pilot.wins / Math.max(pilot.wins + pilot.losses, 1);
  const damageRatio = pilot.damageDealt / Math.max(pilot.damageTaken, 1);
  const mvpRate = pilot.mvpCount / Math.max(pilot.battleCount, 1);
  
  return {
    overallScore: Math.round((winRate * 40 + Math.min(damageRatio / 3, 1) * 30 + mvpRate * 30) * 100),
    strengths: determineStrengths(pilot),
    weaknesses: determineWeaknesses(pilot),
    growthPotential: calculateGrowthPotential(pilot),
    recommendations: generateRecommendations(pilot),
    careerStatus: determineCareerStatus(pilot)
  };
}

function determineStrengths(pilot: ExtendedPilotData): string[] {
  const strengths = [];
  if (pilot.accuracy > 85) strengths.push("뛰어난 정확도");
  if (pilot.reaction > 85) strengths.push("빠른 반응속도");
  if (pilot.tactical > 85) strengths.push("탁월한 전술 이해");
  if (pilot.teamwork > 85) strengths.push("우수한 팀워크");
  if (pilot.clutchFactor > 80) strengths.push("압박감 극복");
  if (pilot.consistency > 85) strengths.push("안정적인 성과");
  if (pilot.leadership > 80) strengths.push("리더십");
  return strengths;
}

function determineWeaknesses(pilot: ExtendedPilotData): string[] {
  const weaknesses = [];
  if (pilot.accuracy < 65) weaknesses.push("정확도 부족");
  if (pilot.reaction < 65) weaknesses.push("반응속도 개선 필요");
  if (pilot.tactical < 65) weaknesses.push("전술 이해도 부족");
  if (pilot.teamwork < 65) weaknesses.push("팀워크 향상 필요");
  if (pilot.fatigue > 70) weaknesses.push("피로도 관리");
  if (pilot.morale < 60) weaknesses.push("사기 진작 필요");
  if (pilot.consistency < 60) weaknesses.push("성과 일관성");
  return weaknesses;
}

function calculateGrowthPotential(pilot: ExtendedPilotData): number {
  const experienceFactor = Math.min(pilot.experience / 1500, 1);
  const ageFactor = pilot.traits.includes("ROOKIE") ? 1.3 : pilot.traits.includes("VETERAN") ? 0.8 : 1.0;
  
  return Math.round(pilot.skillGrowthRate * ageFactor * (1 - experienceFactor * 0.5) * 100);
}

function generateRecommendations(pilot: ExtendedPilotData): string[] {
  const recommendations = [];
  
  if (pilot.accuracy < pilot.reaction - 10) {
    recommendations.push("정확도 훈련 집중");
  }
  if (pilot.tactical < 70) {
    recommendations.push("전술 교육 프로그램");
  }
  if (pilot.fatigue > 60) {
    recommendations.push("휴식 및 컨디션 관리");
  }
  if (pilot.teamwork < 75 && pilot.specialistRole !== "Independent") {
    recommendations.push("팀 협동 훈련");
  }
  if (pilot.morale < 70) {
    recommendations.push("사기 진작 활동");
  }
  
  return recommendations;
}

function determineCareerStatus(pilot: ExtendedPilotData): string {
  if (pilot.experience < 300) return "신예 파일럿";
  if (pilot.experience < 700) return "일반 파일럿";
  if (pilot.experience < 1200) return "베테랑 파일럿";
  if (pilot.experience < 2000) return "에이스 파일럿";
  return "전설적 파일럿";
}

// Team progression system
export function generateTeamProgression() {
  return {
    currentSeason: 3,
    currentWeek: 8,
    seasonRecord: { wins: 6, losses: 2 },
    overallRecord: { wins: 47, losses: 23 },
    leagueRank: 3,
    reputation: 78,
    credits: 15420,
    facilities: {
      trainingCenter: { level: 2, efficiency: 1.1 },
      medicalBay: { level: 1, recovery: 1.05 },
      techLab: { level: 2, mechBonus: 1.08 },
      dormitory: { level: 3, morale: 1.15 }
    },
    achievements: [
      { name: "Season 1 Champion", description: "첫 시즌 우승", date: "2024-03-15" },
      { name: "Perfect Season Record", description: "완벽한 시즌 기록", date: "2024-06-20" },
      { name: "Best Rookie Team", description: "최우수 신인팀", date: "2024-02-28" }
    ],
    nextMilestones: [
      { target: "League Championship", progress: 75, requirement: "시즌 우승" },
      { target: "Elite Status", progress: 60, requirement: "연속 8승" },
      { target: "Perfect Rating", progress: 45, requirement: "평균 평점 90+" }
    ]
  };
}