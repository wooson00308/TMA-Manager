import { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useBattleStore } from '@/stores/battleStore';
import { CyberButton } from '@/components/ui/CyberButton';
import { wsManager } from '@/lib/websocket';
import { useToast } from '@/hooks/use-toast';
import type { Mech } from '@shared/schema';

interface BanPickState {
  phase: 'ban1' | 'ban2' | 'pick1' | 'pick2' | 'pick3' | 'complete';
  turn: 'player' | 'enemy';
  bannedMechs: Mech[];
  selectedMechs: {
    player: Mech[];
    enemy: Mech[];
  };
}

export function BanPickScene() {
  const { mechs, setScene, activeFormation } = useGameStore();
  const { isConnected } = useBattleStore();
  const { toast } = useToast();

  const [banPickState, setBanPickState] = useState<BanPickState>({
    phase: 'ban1',
    turn: 'player',
    bannedMechs: [],
    selectedMechs: {
      player: [],
      enemy: []
    }
  });

  const [selectedMech, setSelectedMech] = useState<Mech | null>(null);

  // Enemy team mock data for demonstration
  const enemyMechs = [
    { id: 101, name: 'Steel Titan', type: 'Knight', variant: 'Heavy' },
    { id: 102, name: 'Shadow Runner', type: 'River', variant: 'Stealth' },
    { id: 103, name: 'Void Sniper', type: 'Arbiter', variant: 'Artillery' },
  ];

  const phaseOrder = ['ban1', 'ban2', 'pick1', 'pick2', 'pick3', 'complete'];
  const turnOrder = {
    ban1: 'enemy',
    ban2: 'player', 
    pick1: 'player',
    pick2: 'enemy',
    pick3: 'enemy'
  };

  const getMechTypeColor = (type: string) => {
    switch (type) {
      case 'Knight': return 'text-yellow-400';
      case 'River': return 'text-red-400';
      case 'Arbiter': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getAvailableMechs = () => {
    const bannedIds = banPickState.bannedMechs.map(m => m.id);
    const selectedIds = [
      ...banPickState.selectedMechs.player.map(m => m.id),
      ...banPickState.selectedMechs.enemy.map(m => m.id)
    ];
    
    return mechs.filter(mech => 
      !bannedIds.includes(mech.id) && 
      !selectedIds.includes(mech.id)
    );
  };

  const handleMechAction = (mech: Mech) => {
    if (banPickState.turn !== 'player') return;

    setBanPickState(prev => {
      const newState = { ...prev };

      if (prev.phase === 'ban1' || prev.phase === 'ban2') {
        // Ban phase
        newState.bannedMechs = [...prev.bannedMechs, mech];
      } else {
        // Pick phase
        newState.selectedMechs.player = [...prev.selectedMechs.player, mech];
      }

      // Advance to next phase
      const currentIndex = phaseOrder.indexOf(prev.phase);
      if (currentIndex < phaseOrder.length - 1) {
        const nextPhase = phaseOrder[currentIndex + 1] as typeof prev.phase;
        newState.phase = nextPhase;
        newState.turn = turnOrder[nextPhase] || 'player';
      }

      return newState;
    });

    setSelectedMech(null);
    
    toast({
      title: banPickState.phase.includes('ban') ? 'Mech Banned' : 'Mech Selected',
      description: `${mech.name} has been ${banPickState.phase.includes('ban') ? 'banned' : 'selected'} for battle.`,
    });
  };

  // Simulate enemy actions
  useEffect(() => {
    if (banPickState.turn === 'enemy' && banPickState.phase !== 'complete') {
      const timer = setTimeout(() => {
        const availableMechs = getAvailableMechs();
        if (availableMechs.length > 0) {
          const randomMech = availableMechs[Math.floor(Math.random() * availableMechs.length)];
          
          setBanPickState(prev => {
            const newState = { ...prev };

            if (prev.phase === 'ban1' || prev.phase === 'ban2') {
              newState.bannedMechs = [...prev.bannedMechs, randomMech];
            } else {
              newState.selectedMechs.enemy = [...prev.selectedMechs.enemy, randomMech];
            }

            const currentIndex = phaseOrder.indexOf(prev.phase);
            if (currentIndex < phaseOrder.length - 1) {
              const nextPhase = phaseOrder[currentIndex + 1] as typeof prev.phase;
              newState.phase = nextPhase;
              newState.turn = turnOrder[nextPhase] || 'player';
            }

            return newState;
          });

          toast({
            title: `Enemy ${banPickState.phase.includes('ban') ? 'Ban' : 'Pick'}`,
            description: `Enemy team ${banPickState.phase.includes('ban') ? 'banned' : 'selected'} ${randomMech.name}`,
            variant: 'destructive',
          });
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [banPickState.turn, banPickState.phase]);

  const handleStartBattle = () => {
    if (!activeFormation || !isConnected) {
      toast({
        title: 'Battle Unavailable',
        description: 'Please ensure formation is set and connection is active.',
        variant: 'destructive',
      });
      return;
    }

    // Start the battle via WebSocket
    wsManager.startBattle(activeFormation, {
      pilot1Id: 101,
      pilot2Id: 102, 
      pilot3Id: 103,
      mech1Id: banPickState.selectedMechs.enemy[0]?.id || 101,
      mech2Id: banPickState.selectedMechs.enemy[1]?.id || 102,
      mech3Id: banPickState.selectedMechs.enemy[2]?.id || 103,
    });

    setScene('battle');
  };

  const getCurrentPhaseText = () => {
    const phaseTexts = {
      ban1: 'First Ban Phase',
      ban2: 'Second Ban Phase', 
      pick1: 'First Pick Phase',
      pick2: 'Second Pick Phase',
      pick3: 'Final Pick Phase',
      complete: 'Draft Complete'
    };
    return phaseTexts[banPickState.phase];
  };

  return (
    <div className="scene-transition">
      <div className="mb-6">
        <h2 className="text-2xl font-orbitron font-bold text-green-400 mb-2">BAN/PICK PHASE</h2>
        <p className="text-gray-400">Strategic mech selection against enemy forces</p>
      </div>

      {/* Phase Header */}
      <div className="cyber-border p-4 bg-slate-800 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-pink-400 font-semibold text-lg">{getCurrentPhaseText()}</h3>
            <p className="text-sm text-gray-400">
              {banPickState.turn === 'player' ? 'Your turn to act' : 'Waiting for enemy action...'}
            </p>
          </div>
          <div className="text-right">
            <div className={`text-lg font-bold ${banPickState.turn === 'player' ? 'text-green-400' : 'text-red-400'}`}>
              {banPickState.turn === 'player' ? 'YOUR TURN' : 'ENEMY TURN'}
            </div>
            {banPickState.turn === 'enemy' && (
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-red-400">Processing...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ban/Pick History */}
        <div className="cyber-border p-4 bg-slate-800">
          <h3 className="text-pink-400 font-semibold mb-4">DRAFT HISTORY</h3>
          
          {/* Banned Mechs */}
          <div className="mb-4">
            <h4 className="text-red-400 text-sm font-semibold mb-2">BANNED MECHS</h4>
            <div className="space-y-2">
              {banPickState.bannedMechs.map((mech, index) => (
                <div key={index} className="cyber-border p-2 bg-red-900 bg-opacity-50">
                  <div className="text-sm font-semibold text-red-300">{mech.name}</div>
                  <div className="text-xs text-gray-400">{mech.type} • {mech.variant}</div>
                </div>
              ))}
              {banPickState.bannedMechs.length === 0 && (
                <div className="text-gray-500 text-sm text-center py-2">No mechs banned yet</div>
              )}
            </div>
          </div>

          {/* Selected Mechs */}
          <div>
            <h4 className="text-green-400 text-sm font-semibold mb-2">SELECTED MECHS</h4>
            
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-400 mb-1">Your Team</div>
                <div className="space-y-1">
                  {banPickState.selectedMechs.player.map((mech, index) => (
                    <div key={index} className="cyber-border p-2 bg-green-900 bg-opacity-30">
                      <div className={`text-sm font-semibold ${getMechTypeColor(mech.type)}`}>
                        {mech.name}
                      </div>
                      <div className="text-xs text-gray-400">{mech.type} • {mech.variant}</div>
                    </div>
                  ))}
                  {banPickState.selectedMechs.player.length === 0 && (
                    <div className="text-gray-500 text-sm text-center py-1">No selections yet</div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-400 mb-1">Enemy Team</div>
                <div className="space-y-1">
                  {banPickState.selectedMechs.enemy.map((mech, index) => (
                    <div key={index} className="cyber-border p-2 bg-red-900 bg-opacity-30">
                      <div className={`text-sm font-semibold ${getMechTypeColor(mech.type)}`}>
                        {mech.name}
                      </div>
                      <div className="text-xs text-gray-400">{mech.type} • {mech.variant}</div>
                    </div>
                  ))}
                  {banPickState.selectedMechs.enemy.length === 0 && (
                    <div className="text-gray-500 text-sm text-center py-1">No selections yet</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Mechs */}
        <div className="cyber-border p-4 bg-slate-800">
          <h3 className="text-pink-400 font-semibold mb-4">AVAILABLE MECHS</h3>
          
          <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
            {getAvailableMechs().map((mech) => (
              <button
                key={mech.id}
                onClick={() => handleMechAction(mech)}
                disabled={banPickState.turn !== 'player' || banPickState.phase === 'complete'}
                className={`p-3 cyber-border text-left transition-colors ${
                  banPickState.turn === 'player' && banPickState.phase !== 'complete'
                    ? 'hover:bg-blue-900 cursor-pointer'
                    : 'opacity-50 cursor-not-allowed'
                } ${selectedMech?.id === mech.id ? 'bg-blue-900' : 'bg-slate-900'}`}
              >
                <div className={`text-sm font-semibold ${getMechTypeColor(mech.type)}`}>
                  {mech.name}
                </div>
                <div className="text-xs text-gray-400">{mech.type} • {mech.variant}</div>
                <div className="text-xs text-gray-400 mt-1">
                  HP: {mech.hp} | FP: {mech.firepower} | SPD: {mech.speed}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Team Composition Preview */}
        <div className="cyber-border p-4 bg-slate-800">
          <h3 className="text-pink-400 font-semibold mb-4">BATTLE COMPOSITION</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-green-400 text-sm font-semibold mb-2">YOUR FORMATION</h4>
              <div className="space-y-2">
                {[0, 1, 2].map((index) => {
                  const selectedMech = banPickState.selectedMechs.player[index];
                  return (
                    <div key={index} className="cyber-border p-3 bg-slate-900">
                      <div className="text-xs text-gray-400 mb-1">Slot {index + 1}</div>
                      {selectedMech ? (
                        <div>
                          <div className={`text-sm font-semibold ${getMechTypeColor(selectedMech.type)}`}>
                            {selectedMech.name}
                          </div>
                          <div className="text-xs text-gray-400">{selectedMech.type} • {selectedMech.variant}</div>
                        </div>
                      ) : (
                        <div className="text-gray-500 text-sm">Awaiting selection...</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {banPickState.phase === 'complete' && (
              <div className="space-y-3">
                <div className="cyber-border p-3 bg-green-900 bg-opacity-30">
                  <div className="text-green-400 font-semibold text-center">DRAFT COMPLETE</div>
                  <div className="text-xs text-gray-400 text-center mt-1">
                    Ready to deploy for battle
                  </div>
                </div>

                <CyberButton onClick={handleStartBattle} className="w-full">
                  <div className="text-center">
                    <div className="text-pink-400 font-semibold mb-1">
                      <i className="fas fa-rocket mr-2"></i>DEPLOY TO BATTLE
                    </div>
                    <div className="text-xs text-gray-400">Begin combat simulation</div>
                  </div>
                </CyberButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
