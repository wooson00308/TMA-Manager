import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertPilotSchema, insertFormationSchema, type BattleState } from "@shared/schema";
import { BattleUseCase } from "./application/BattleUseCase";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time battle updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const battleEngine = new BattleUseCase(storage);
  const activeBattles = new Map<string, BattleState>();

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to battle system');

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'START_BATTLE':
            const battleId = `battle_${Date.now()}`;
            const battleState = await battleEngine.initializeBattle(message.formation1, message.formation2);
            activeBattles.set(battleId, battleState);
            
            ws.send(JSON.stringify({
              type: 'BATTLE_STARTED',
              battleId,
              state: battleState
            }));

            // Start battle simulation
            battleEngine.runBattle(battleState, (update) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'BATTLE_UPDATE',
                  battleId,
                  update
                }));
              }
            });
            break;

          case 'JOIN_BATTLE':
            const existingBattle = activeBattles.get(message.battleId);
            if (existingBattle) {
              ws.send(JSON.stringify({
                type: 'BATTLE_STATE',
                battleId: message.battleId,
                state: existingBattle
              }));
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from battle system');
    });
  });

  // REST API routes
  
  // Pilot routes
  app.get("/api/pilots", async (req, res) => {
    try {
      const pilots = await storage.getAllPilots();
      res.json(pilots);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pilots" });
    }
  });

  app.get("/api/pilots/active", async (req, res) => {
    try {
      const pilots = await storage.getActivePilots();
      res.json(pilots);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active pilots" });
    }
  });

  // Enhanced pilot analytics endpoint
  app.get("/api/pilots/:id/analytics", async (req, res) => {
    try {
      const pilotId = parseInt(req.params.id);
      const pilot = await storage.getPilot(pilotId);
      
      if (!pilot) {
        return res.status(404).json({ error: 'Pilot not found' });
      }

      // Generate comprehensive analytics
      const analytics = {
        pilot,
        performance: {
          winRate: pilot.wins / Math.max(pilot.wins + pilot.losses, 1),
          averageRating: pilot.rating,
          battleCount: pilot.wins + pilot.losses,
          experienceGrowth: pilot.experience,
          efficiency: {
            accuracy: pilot.accuracy,
            reaction: pilot.reaction,
            tactical: pilot.tactical,
            teamwork: pilot.teamwork
          }
        },
        career: {
          status: pilot.experience < 300 ? "신예" : 
                  pilot.experience < 700 ? "일반" :
                  pilot.experience < 1200 ? "베테랑" : "에이스",
          specialization: pilot.traits.includes("KNIGHT") ? "Knight 전문" :
                         pilot.traits.includes("ARBITER") ? "Arbiter 전문" :
                         pilot.traits.includes("RIVER") ? "River 전문" : "범용",
          strengths: pilot.accuracy > 85 ? ["정확도"] :
                    pilot.reaction > 85 ? ["반응속도"] :
                    pilot.tactical > 85 ? ["전술"] :
                    pilot.teamwork > 85 ? ["팀워크"] : ["균형"],
          growthPotential: pilot.traits.includes("ROOKIE") ? 85 :
                          pilot.traits.includes("VETERAN") ? 60 : 75
        },
        recommendations: [
          pilot.fatigue > 60 ? "휴식 필요" : null,
          pilot.morale < 70 ? "사기 진작" : null,
          pilot.accuracy < 70 ? "정확도 훈련" : null,
          pilot.tactical < 70 ? "전술 교육" : null
        ].filter(Boolean)
      };

      res.json(analytics);
    } catch (error) {
      console.error('Error generating pilot analytics:', error);
      res.status(500).json({ error: 'Failed to generate analytics' });
    }
  });

  app.get("/api/pilots/recruitable", async (req, res) => {
    try {
      const allPilots = await storage.getAllPilots();
      const inactivePilots = allPilots.filter(pilot => !pilot.isActive);
      
      // Show 3-4 random recruitable pilots
      const maxPilots = Math.min(4, inactivePilots.length);
      const selectedCount = Math.max(3, maxPilots);
      const shuffled = inactivePilots.sort(() => 0.5 - Math.random());
      const recruitablePilots = shuffled.slice(0, selectedCount).map(pilot => ({
        ...pilot,
        cost: Math.floor(pilot.rating * 50) + 2000, // Higher cost based on rating
        background: `${pilot.dormitory} 기숙사 출신의 실력자`,
        specialAbility: pilot.traits.includes('ACE') ? '에이스 파일럿 특성' : 
                      pilot.traits.includes('VETERAN') ? '베테랑 경험' :
                      pilot.traits.includes('GENIUS') ? '천재적 재능' :
                      pilot.traits.includes('ROOKIE') ? '신예 파일럿' :
                      '균형잡힌 능력'
      }));
      res.json(recruitablePilots);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recruitable pilots" });
    }
  });

  // Rest pilot
  app.post('/api/pilots/:id/rest', async (req, res) => {
    try {
      const pilotId = parseInt(req.params.id);
      const pilot = await storage.getPilot(pilotId);
      
      if (!pilot) {
        return res.status(404).json({ error: 'Pilot not found' });
      }

      // Reduce fatigue by 30-50, increase morale by 10-20
      const fatigueReduction = Math.floor(Math.random() * 21) + 30; // 30-50
      const moraleIncrease = Math.floor(Math.random() * 11) + 10; // 10-20

      const updatedPilot = await storage.updatePilot(pilotId, {
        fatigue: Math.max(0, pilot.fatigue - fatigueReduction),
        morale: Math.min(100, pilot.morale + moraleIncrease)
      });

      res.json(updatedPilot);
    } catch (error) {
      console.error('Error resting pilot:', error);
      res.status(500).json({ error: 'Failed to rest pilot' });
    }
  });

  // Dismiss pilot
  app.post('/api/pilots/:id/dismiss', async (req, res) => {
    try {
      const pilotId = parseInt(req.params.id);
      const pilot = await storage.getPilot(pilotId);
      
      if (!pilot) {
        return res.status(404).json({ error: 'Pilot not found' });
      }

      // Check if this would leave less than 3 active pilots
      const activePilots = await storage.getActivePilots();
      if (activePilots.length <= 3) {
        return res.status(400).json({ error: 'Cannot dismiss pilot - minimum 3 active pilots required' });
      }

      // Deactivate pilot instead of deleting
      const updatedPilot = await storage.updatePilot(pilotId, { isActive: false });

      res.json({ success: true, pilot: updatedPilot });
    } catch (error) {
      console.error('Error dismissing pilot:', error);
      res.status(500).json({ error: 'Failed to dismiss pilot' });
    }
  });

  // Team performance analytics endpoint
  app.get("/api/teams/:id/analytics", async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }

      const pilots = await storage.getActivePilots();
      const battles = await storage.getTeamBattles(teamId);

      // Calculate comprehensive team analytics
      const analytics = {
        team,
        season: {
          current: 3,
          week: 8,
          record: { wins: team.wins, losses: team.losses },
          winRate: team.wins / Math.max(team.wins + team.losses, 1),
          leagueRank: team.leagueRank,
          reputation: team.reputation
        },
        pilots: {
          count: pilots.length,
          averageRating: pilots.reduce((sum, p) => sum + p.rating, 0) / pilots.length,
          averageExperience: pilots.reduce((sum, p) => sum + p.experience, 0) / pilots.length,
          averageFatigue: pilots.reduce((sum, p) => sum + p.fatigue, 0) / pilots.length,
          averageMorale: pilots.reduce((sum, p) => sum + p.morale, 0) / pilots.length,
          specializations: {
            knight: pilots.filter(p => p.traits.includes("KNIGHT")).length,
            arbiter: pilots.filter(p => p.traits.includes("ARBITER")).length,
            river: pilots.filter(p => p.traits.includes("RIVER")).length
          }
        },
        performance: {
          totalBattles: battles.length,
          recentForm: battles.slice(-5).map(b => b.winnerId === teamId ? 'W' : 'L'),
          strengths: determineTeamStrengths(pilots),
          weaknesses: determineTeamWeaknesses(pilots),
          recommendations: generateTeamRecommendations(pilots, team)
        },
        resources: {
          credits: team.credits,
          facilities: {
            trainingCenter: { level: 2, effect: "+10% 훈련 효율" },
            medicalBay: { level: 1, effect: "+5% 회복 속도" },
            techLab: { level: 2, effect: "+8% 메크 성능" },
            dormitory: { level: 3, effect: "+15% 파일럿 사기" }
          }
        },
        projections: {
          seasonOutlook: team.wins >= team.losses * 2 ? "우승 후보" : 
                        team.wins > team.losses ? "플레이오프 진출" : "순위 개선 필요",
          budgetStatus: team.credits > 10000 ? "안정적" : 
                       team.credits > 5000 ? "보통" : "긴축 필요",
          developmentFocus: pilots.some(p => p.traits.includes("ROOKIE")) ? "신예 육성" :
                           pilots.filter(p => p.experience > 1000).length >= 3 ? "베테랑 관리" : "균형 발전"
        }
      };

      res.json(analytics);
    } catch (error) {
      console.error('Error generating team analytics:', error);
      res.status(500).json({ error: 'Failed to generate team analytics' });
    }
  });

  // Comprehensive season progress endpoint
  app.get("/api/season/progress", async (req, res) => {
    try {
      const teams = await storage.getAllTeams();
      const trinitySquad = teams.find(t => t.name === 'Trinity Squad');
      const pilots = await storage.getActivePilots();

      const seasonData = {
        current: {
          season: 3,
          week: 8,
          totalWeeks: 16
        },
        standings: teams.map(team => ({
          name: team.name,
          wins: team.wins,
          losses: team.losses,
          winRate: team.wins / Math.max(team.wins + team.losses, 1),
          rank: team.leagueRank
        })).sort((a, b) => a.rank - b.rank),
        playerTeam: {
          name: trinitySquad?.name || 'Trinity Squad',
          performance: {
            wins: trinitySquad?.wins || 0,
            losses: trinitySquad?.losses || 0,
            rank: trinitySquad?.leagueRank || 8,
            credits: trinitySquad?.credits || 0
          },
          roster: {
            totalPilots: pilots.length,
            readyPilots: pilots.filter(p => p.fatigue < 60).length,
            trainingPilots: pilots.filter(p => p.trainingUntil).length,
            averageRating: Math.round(pilots.reduce((sum, p) => sum + p.rating, 0) / pilots.length)
          }
        },
        milestones: [
          {
            name: "시즌 우승",
            progress: Math.min((trinitySquad?.wins || 0) / 12 * 100, 100),
            requirement: "12승 달성",
            reward: "50,000 크레딧 + 명예"
          },
          {
            name: "플레이오프 진출",
            progress: Math.min((trinitySquad?.wins || 0) / 8 * 100, 100),
            requirement: "8승 달성",
            reward: "20,000 크레딧"
          },
          {
            name: "베테랑 육성",
            progress: Math.min(pilots.filter(p => p.experience > 1000).length / 3 * 100, 100),
            requirement: "베테랑 파일럿 3명",
            reward: "훈련 효율 증가"
          }
        ],
        upcomingEvents: [
          { week: 9, event: "vs Steel Phoenixes", difficulty: "어려움" },
          { week: 10, event: "시설 업그레이드 기회", type: "facility" },
          { week: 11, event: "vs Lightning Bolts", difficulty: "보통" },
          { week: 12, event: "중간 평가", type: "evaluation" }
        ]
      };

      res.json(seasonData);
    } catch (error) {
      console.error('Error generating season progress:', error);
      res.status(500).json({ error: 'Failed to generate season progress' });
    }
  });

  // Helper functions for team analytics
  function determineTeamStrengths(pilots: any[]): string[] {
    const strengths = [];
    const avgAccuracy = pilots.reduce((sum, p) => sum + p.accuracy, 0) / pilots.length;
    const avgReaction = pilots.reduce((sum, p) => sum + p.reaction, 0) / pilots.length;
    const avgTactical = pilots.reduce((sum, p) => sum + p.tactical, 0) / pilots.length;
    const avgTeamwork = pilots.reduce((sum, p) => sum + p.teamwork, 0) / pilots.length;

    if (avgAccuracy > 80) strengths.push("높은 정확도");
    if (avgReaction > 80) strengths.push("빠른 반응속도");
    if (avgTactical > 80) strengths.push("뛰어난 전술 이해");
    if (avgTeamwork > 80) strengths.push("강한 팀워크");
    if (pilots.filter(p => p.traits.includes("ACE")).length >= 2) strengths.push("에이스 파일럿 다수");
    if (pilots.filter(p => p.experience > 1000).length >= 3) strengths.push("풍부한 경험");
    
    return strengths.length > 0 ? strengths : ["균형잡힌 팀"];
  }

  function determineTeamWeaknesses(pilots: any[]): string[] {
    const weaknesses = [];
    const avgFatigue = pilots.reduce((sum, p) => sum + p.fatigue, 0) / pilots.length;
    const avgMorale = pilots.reduce((sum, p) => sum + p.morale, 0) / pilots.length;
    const rookieCount = pilots.filter(p => p.traits.includes("ROOKIE")).length;

    if (avgFatigue > 60) weaknesses.push("높은 피로도");
    if (avgMorale < 70) weaknesses.push("낮은 사기");
    if (rookieCount >= 3) weaknesses.push("경험 부족");
    if (pilots.length < 5) weaknesses.push("부족한 로스터");
    
    const specializationCounts = {
      knight: pilots.filter(p => p.traits.includes("KNIGHT")).length,
      arbiter: pilots.filter(p => p.traits.includes("ARBITER")).length,
      river: pilots.filter(p => p.traits.includes("RIVER")).length
    };
    
    const minSpecialization = Math.min(...Object.values(specializationCounts));
    if (minSpecialization === 0) weaknesses.push("특화 부족");
    
    return weaknesses.length > 0 ? weaknesses : ["특별한 약점 없음"];
  }

  function generateTeamRecommendations(pilots: any[], team: any): string[] {
    const recommendations = [];
    const avgFatigue = pilots.reduce((sum, p) => sum + p.fatigue, 0) / pilots.length;
    const avgMorale = pilots.reduce((sum, p) => sum + p.morale, 0) / pilots.length;
    const rookieCount = pilots.filter(p => p.traits.includes("ROOKIE")).length;

    if (avgFatigue > 60) recommendations.push("팀 휴식 시간 늘리기");
    if (avgMorale < 70) recommendations.push("사기 진작 활동 실시");
    if (rookieCount >= 2) recommendations.push("베테랑 파일럿 영입");
    if (team.credits > 15000) recommendations.push("시설 업그레이드 고려");
    if (pilots.length < 6) recommendations.push("로스터 확장");
    
    return recommendations.length > 0 ? recommendations : ["현재 팀 상태 양호"];
  }

  app.get("/api/pilots/recruitable2", async (req, res) => {
    try {
      const recruitablePilots = [
        {
          id: 101,
          name: "김준호",
          callsign: "스나이퍼",
          rating: 88,
          traits: ["ANALYTICAL", "SNIPER", "CAUTIOUS", "VETERAN"],
          teamId: null,
          status: "available",
          cost: 2500,
          requirements: ["승률 70% 이상", "시즌 3주 이상"],
          specialAbility: "장거리 정밀 사격 시 추가 데미지",
          background: "전직 군 저격수 출신으로 냉정한 판단력을 보유"
        },
        {
          id: 102,
          name: "박민지",
          callsign: "서지",
          rating: 85,
          traits: ["AGGRESSIVE", "ASSAULT", "INDEPENDENT", "ACE"],
          teamId: null,
          status: "available",
          cost: 3000,
          requirements: ["리그 상위 50%", "공격형 기체 보유"],
          specialAbility: "연속 공격 시 화력 증가",
          background: "아카데미 수석 졸업생, 공격적인 전술을 선호"
        },
        {
          id: 103,
          name: "이도현",
          callsign: "가디언",
          rating: 82,
          traits: ["DEFENSIVE", "KNIGHT", "COOPERATIVE", "ROOKIE"],
          teamId: null,
          status: "available",
          cost: 1800,
          requirements: ["기본 요구사항 없음"],
          specialAbility: "아군 보호 시 방어력 증가",
          background: "신인이지만 뛰어난 방어 감각을 가진 유망주"
        },
        {
          id: 104,
          name: "한수진",
          callsign: "템페스트",
          rating: 90,
          traits: ["ANALYTICAL", "ARBITER", "INDEPENDENT", "GENIUS"],
          teamId: null,
          status: "available",
          cost: 4500,
          requirements: ["리그 상위 25%", "전술 지수 80 이상"],
          specialAbility: "전장 분석으로 팀 전체 정확도 증가",
          background: "전술 분석의 천재로 불리는 신진 파일럿"
        },
        {
          id: 105,
          name: "최민혁",
          callsign: "블리츠",
          rating: 87,
          traits: ["AGGRESSIVE", "RIVER", "SCOUT", "VETERAN"],
          teamId: null,
          status: "available",
          cost: 3200,
          requirements: ["기동전 승리 5회 이상"],
          specialAbility: "고속 기동 시 회피율 대폭 증가",
          background: "기동전의 달인으로 유명한 베테랑 파일럿"
        },
        {
          id: 106,
          name: "정아연",
          callsign: "오라클",
          rating: 91,
          traits: ["ANALYTICAL", "SUPPORT", "COOPERATIVE", "ACE"],
          teamId: null,
          status: "available",
          cost: 5000,
          requirements: ["리그 상위 10%", "팀워크 지수 90 이상"],
          specialAbility: "전장 예측으로 팀 전체 반응속도 증가",
          background: "미래를 예측하는 듯한 직감을 가진 에이스 파일럿"
        }
      ];
      res.json(recruitablePilots);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recruitable pilots" });
    }
  });

  app.post("/api/pilots", async (req, res) => {
    try {
      const pilotData = insertPilotSchema.parse(req.body);
      const pilot = await storage.createPilot(pilotData);
      res.json(pilot);
    } catch (error) {
      res.status(400).json({ error: "Invalid pilot data" });
    }
  });

  app.get("/api/pilots/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const pilot = await storage.getPilot(id);
      if (!pilot) {
        return res.status(404).json({ error: "Pilot not found" });
      }
      res.json(pilot);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pilot" });
    }
  });

  // Mech routes
  app.get("/api/mechs", async (req, res) => {
    try {
      const mechs = await storage.getAllMechs();
      res.json(mechs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mechs" });
    }
  });

  app.get("/api/mechs/available", async (req, res) => {
    try {
      const mechs = await storage.getAvailableMechs();
      res.json(mechs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch available mechs" });
    }
  });

  // Team routes
  app.get("/api/teams", async (req, res) => {
    try {
      const teams = await storage.getAllTeams();
      res.json(teams);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });

  app.get("/api/teams/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const team = await storage.getTeam(id);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team" });
    }
  });

  // Formation routes
  app.get("/api/formations/team/:teamId", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const formation = await storage.getActiveFormation(teamId);
      res.json(formation);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch formation" });
    }
  });

  app.post("/api/formations", async (req, res) => {
    try {
      const formationData = insertFormationSchema.parse(req.body);
      const formation = await storage.createFormation(formationData);
      res.json(formation);
    } catch (error) {
      res.status(400).json({ error: "Invalid formation data" });
    }
  });

  // Detailed formation with pilot & mech info (ally / enemy line-up)
  app.get("/api/formations/team/:teamId/full", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const formation = await storage.getActiveFormation(teamId);

      if (!formation) {
        return res.status(404).json({ error: "Formation not found" });
      }

      // Collect pilot & mech IDs
      const pilotIds: number[] = [
        formation.pilot1Id,
        formation.pilot2Id,
        formation.pilot3Id,
      ].filter((id): id is number => typeof id === "number");

      const mechIds: number[] = [
        formation.mech1Id,
        formation.mech2Id,
        formation.mech3Id,
      ].filter((id): id is number => typeof id === "number");

      // Fetch pilots & mechs in parallel
      const pilots = await Promise.all(
        pilotIds.map((pid) => storage.getPilot(pid)),
      );

      const mechs = await Promise.all(
        mechIds.map((mid) => storage.getMech(mid)),
      );

      res.json({
        formation,
        pilots: pilots.filter(Boolean),
        mechs: mechs.filter(Boolean),
      });
    } catch (error) {
      console.error("Error fetching full formation:", error);
      res.status(500).json({ error: "Failed to fetch full formation" });
    }
  });

  // Reconnaissance routes
  app.get("/api/recon/:enemyTeamId", async (req, res) => {
    try {
      const enemyTeamId = parseInt(req.params.enemyTeamId);
      const reconData = await storage.getReconData(enemyTeamId);
      res.json(reconData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reconnaissance data" });
    }
  });

  // Battle routes
  app.get("/api/battles/team/:teamId", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const battles = await storage.getTeamBattles(teamId);
      res.json(battles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team battles" });
    }
  });

  // Training routes
  app.post("/api/pilots/:pilotId/training", async (req, res) => {
    try {
      const pilotId = parseInt(req.params.pilotId);
      const { trainingType } = req.body;
      
      if (!trainingType || !['reaction', 'accuracy', 'tactical', 'teamwork'].includes(trainingType)) {
        return res.status(400).json({ error: "Invalid training type" });
      }

      const pilot = await storage.startPilotTraining(pilotId, trainingType);
      if (!pilot) {
        return res.status(404).json({ error: "Pilot not found" });
      }

      res.json(pilot);
    } catch (error) {
      res.status(500).json({ error: "Failed to start training" });
    }
  });

  app.post("/api/pilots/:pilotId/complete-training", async (req, res) => {
    try {
      const pilotId = parseInt(req.params.pilotId);
      const pilot = await storage.completePilotTraining(pilotId);
      
      if (!pilot) {
        return res.status(404).json({ error: "Pilot not found or not in training" });
      }

      res.json(pilot);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete training" });
    }
  });

  app.post("/api/teams/:teamId/spend-credits", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const team = await storage.spendCredits(teamId, amount);
      if (!team) {
        return res.status(400).json({ error: "Insufficient credits or team not found" });
      }

      res.json(team);
    } catch (error) {
      res.status(500).json({ error: "Failed to spend credits" });
    }
  });

  app.post("/api/pilots/:pilotId/recruit", async (req, res) => {
    try {
      const pilotId = parseInt(req.params.pilotId);
      
      // Get pilot and calculate cost
      const pilot = await storage.getPilot(pilotId);
      if (!pilot || pilot.isActive) {
        return res.status(404).json({ error: "Pilot not found or already recruited" });
      }

      const cost = Math.floor(pilot.rating * 50) + 2000;
      
      // Get Trinity Squad team (assuming team ID 1 for Trinity Squad)
      const teams = await storage.getAllTeams();
      const trinityTeam = teams.find(team => team.name === 'Trinity Squad');
      
      if (!trinityTeam || trinityTeam.credits < cost) {
        return res.status(400).json({ error: "Insufficient credits" });
      }

      // Deduct credits and activate pilot
      await storage.spendCredits(trinityTeam.id, cost);
      const recruitedPilot = await storage.updatePilot(pilotId, { isActive: true });
      
      if (!recruitedPilot) {
        return res.status(500).json({ error: "Failed to recruit pilot" });
      }

      res.json(recruitedPilot);
    } catch (error) {
      res.status(500).json({ error: "Failed to recruit pilot" });
    }
  });

  // Battle API endpoints
  app.post("/api/battle/start", async (req, res) => {
    try {
      const { formation1, formation2 } = req.body;
      
      if (!formation1 || !formation2) {
        return res.status(400).json({ error: "Both formations are required" });
      }

      // Create battle record in storage
      const battleData = {
        season: 3,
        week: 8,
        teamAId: formation1.teamId || 1,
        teamBId: formation2.teamId || 2,
        status: 'active',
        winnerId: null,
        battleData: {
          formation1,
          formation2,
          startTime: new Date().toISOString()
        }
      };

      const battle = await storage.createBattle(battleData);
      
      // Initialize battle state
      const battleState = await battleEngine.initializeBattle(formation1, formation2);
      activeBattles.set(battle.id.toString(), battleState);

      res.json({
        success: true,
        battleId: battle.id,
        message: "Battle started successfully",
        battleState
      });

    } catch (error) {
      console.error('Error starting battle:', error);
      res.status(500).json({ error: "Failed to start battle" });
    }
  });

  app.get("/api/battle/:id", async (req, res) => {
    try {
      const battleId = parseInt(req.params.id);
      const battle = await storage.getBattle(battleId);
      
      if (!battle) {
        return res.status(404).json({ error: "Battle not found" });
      }

      const battleState = activeBattles.get(battleId.toString());
      
      res.json({
        battle,
        state: battleState || null,
        isActive: battleState ? battleState.phase !== 'completed' : false
      });

    } catch (error) {
      console.error('Error fetching battle:', error);
      res.status(500).json({ error: "Failed to fetch battle" });
    }
  });

  app.get("/api/battles/team/:teamId", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const battles = await storage.getTeamBattles(teamId);
      res.json(battles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team battles" });
    }
  });

  return httpServer;
}
