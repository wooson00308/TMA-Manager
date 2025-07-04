import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGameStore } from '@/stores/gameStore';
import { useBattleStore } from '@/stores/battleStore';
import { wsManager } from '@/lib/websocket';
import { GameShell } from '@/components/GameShell';
import type { Pilot, Mech } from '@shared/schema';

export default function Game() {
  const { setPilots, setMechs, initializeGameData } = useGameStore();
  const { setConnected, isConnected } = useBattleStore();

  // Fetch initial game data
  const { data: pilots } = useQuery<Pilot[]>({
    queryKey: ['/api/pilots/active'],
  });

  const { data: mechs } = useQuery<Mech[]>({
    queryKey: ['/api/mechs/available'],
  });

  useEffect(() => {
    initializeGameData();
  }, [initializeGameData]);

  // Initialize WebSocket connection
  useEffect(() => {
    const initializeWebSocket = async () => {
      try {
        await wsManager.connect();
        setConnected(true);

        wsManager.on('BATTLE_STARTED', (data: any) => {
          console.log('Battle started:', data);
        });

        wsManager.on('BATTLE_UPDATE', (data: any) => {
          console.log('Battle update:', data);
        });

        wsManager.on('BATTLE_COMPLETE', (data: any) => {
          console.log('Battle complete:', data);
        });

      } catch (error) {
        console.error('Failed to connect to battle system:', error);
        setConnected(false);
      }
    };

    initializeWebSocket();

    return () => {
      wsManager.disconnect();
    };
  }, [setConnected]);

  // Update stores with fetched data
  useEffect(() => {
    if (pilots) setPilots(pilots);
  }, [pilots, setPilots]);

  useEffect(() => {
    if (mechs) setMechs(mechs);
  }, [mechs, setMechs]);

  // Team initialization moved to GameShell

  return (
    <div className="min-h-screen terminal-bg text-gray-100 font-mono overflow-hidden">
      {/* Scanning line effect */}
      <div className="scan-line"></div>
      
      {/* Matrix background effect */}
      <div className="matrix-bg">
        <div className="absolute text-green-400 text-xs opacity-20 matrix-rain" style={{left: '10%', animationDelay: '0s'}}>
          01001010<br/>11010110<br/>00110101
        </div>
        <div className="absolute text-green-400 text-xs opacity-20 matrix-rain" style={{left: '30%', animationDelay: '2s'}}>
          10110010<br/>01110001<br/>11001100
        </div>
        <div className="absolute text-green-400 text-xs opacity-20 matrix-rain" style={{left: '50%', animationDelay: '4s'}}>
          11101010<br/>00010111<br/>10101001
        </div>
        <div className="absolute text-green-400 text-xs opacity-20 matrix-rain" style={{left: '70%', animationDelay: '6s'}}>
          01010101<br/>11100011<br/>00111010
        </div>
        <div className="absolute text-green-400 text-xs opacity-20 matrix-rain" style={{left: '90%', animationDelay: '8s'}}>
          10010110<br/>01101001<br/>11010100
        </div>
      </div>

      <GameShell />
    </div>
  );
}
