import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertPilotSchema, insertFormationSchema, type BattleState } from "@shared/schema";
import { BattleEngine } from "./services/BattleEngine";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time battle updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const battleEngine = new BattleEngine();
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

  app.get("/api/pilots/recruitable", async (req, res) => {
    try {
      const allPilots = await storage.getAllPilots();
      const recruitablePilots = allPilots.filter(pilot => !pilot.isActive).map(pilot => ({
        ...pilot,
        cost: Math.floor(pilot.rating * 100) + 1000,
        background: `${pilot.dormitory} 기숙사 출신의 실력자`,
        specialAbility: pilot.traits.includes('ACE') ? '에이스 파일럿 특성' : 
                      pilot.traits.includes('VETERAN') ? '베테랑 경험' :
                      pilot.traits.includes('GENIUS') ? '천재적 재능' :
                      '균형잡힌 능력'
      }));
      res.json(recruitablePilots);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recruitable pilots" });
    }
  });

  app.get("/api/pilots/recruitable", async (req, res) => {
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
      
      // For now, just activate the pilot (simplified recruitment)
      const pilot = await storage.updatePilot(pilotId, { isActive: true });
      if (!pilot) {
        return res.status(404).json({ error: "Pilot not found" });
      }

      res.json(pilot);
    } catch (error) {
      res.status(500).json({ error: "Failed to recruit pilot" });
    }
  });

  return httpServer;
}
