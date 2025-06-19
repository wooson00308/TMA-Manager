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

  return httpServer;
}
