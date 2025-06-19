import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGameStore } from '@/stores/gameStore';
import { PilotCard } from '@/components/ui/PilotCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function ScoutingScene() {
  const { pilots, setPilots } = useGameStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPilot, setSelectedPilot] = useState<number | null>(null);

  const { data: availablePilots, isLoading } = useQuery({
    queryKey: ['/api/pilots'],
  });

  const scoutPilotMutation = useMutation({
    mutationFn: async (pilotData: any) => {
      const response = await apiRequest('POST', '/api/pilots', pilotData);
      return response.json();
    },
    onSuccess: (newPilot) => {
      queryClient.invalidateQueries({ queryKey: ['/api/pilots'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pilots/active'] });
      toast({
        title: 'Pilot Recruited',
        description: `${newPilot.callsign} has joined your roster!`,
      });
    },
    onError: () => {
      toast({
        title: 'Recruitment Failed',
        description: 'Unable to recruit pilot. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const generateRandomPilot = () => {
    const names = ['Alex', 'Jordan', 'Casey', 'Taylor', 'Morgan', 'Avery', 'Riley', 'Quinn'];
    const dormitories = ['Knight', 'River', 'Arbiter'];
    const traitOptions = [
      ['AGGRESSIVE', 'ASSAULT'], ['CAUTIOUS', 'DEFENSIVE'], ['ANALYTICAL', 'SUPPORT'],
      ['COOPERATIVE', 'SUPPORT'], ['INDEPENDENT', 'SCOUT']
    ];

    const name = names[Math.floor(Math.random() * names.length)];
    const dormitory = dormitories[Math.floor(Math.random() * dormitories.length)];
    const traitSet = traitOptions[Math.floor(Math.random() * traitOptions.length)];
    
    return {
      name: `${name} Rodriguez`,
      callsign: `${name.toUpperCase()}-${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`,
      dormitory,
      rating: Math.floor(Math.random() * 40) + 60, // 60-99
      reaction: Math.floor(Math.random() * 50) + 50,
      accuracy: Math.floor(Math.random() * 50) + 50,
      tactical: Math.floor(Math.random() * 50) + 50,
      teamwork: Math.floor(Math.random() * 50) + 50,
      traits: [...traitSet, dormitory.toUpperCase()],
    };
  };

  const handleScoutPilot = () => {
    const newPilot = generateRandomPilot();
    scoutPilotMutation.mutate(newPilot);
  };

  if (isLoading) {
    return (
      <div className="scene-transition flex items-center justify-center h-96">
        <div className="text-green-400 font-orbitron">SCANNING FOR AVAILABLE PILOTS...</div>
      </div>
    );
  }

  return (
    <div className="scene-transition">
      <div className="mb-6">
        <h2 className="text-2xl font-orbitron font-bold text-green-400 mb-2">PILOT SCOUTING</h2>
        <p className="text-gray-400">Recruit and analyze potential pilots for your academy team</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scouting Actions */}
        <div className="cyber-border p-4 bg-slate-800">
          <h3 className="text-pink-400 font-semibold mb-4">RECRUITMENT OPERATIONS</h3>
          
          <div className="space-y-4">
            <CyberButton 
              onClick={handleScoutPilot}
              disabled={scoutPilotMutation.isPending}
              className="w-full"
            >
              <div className="text-center">
                <div className="text-pink-400 font-semibold mb-2">
                  <i className="fas fa-search mr-2"></i>
                  {scoutPilotMutation.isPending ? 'SCOUTING...' : 'SCOUT NEW PILOT'}
                </div>
                <div className="text-xs text-gray-400">
                  Search academy databases for potential recruits
                </div>
              </div>
            </CyberButton>

            <div className="cyber-border p-3 bg-slate-900">
              <h4 className="text-green-400 text-sm font-semibold mb-2">SCOUTING INTEL</h4>
              <div className="text-xs text-gray-400 space-y-1">
                <div>• Each pilot has unique trait combinations</div>
                <div>• Dormitory affects base specialization</div>
                <div>• Higher ratings indicate better performance</div>
                <div>• Traits influence AI behavior patterns</div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Roster */}
        <div className="lg:col-span-2">
          <h3 className="text-xl font-orbitron font-semibold text-green-400 mb-4">CURRENT ROSTER</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {pilots.map((pilot) => (
              <PilotCard 
                key={pilot.id} 
                pilot={pilot}
                selected={selectedPilot === pilot.id}
                onClick={() => setSelectedPilot(pilot.id)}
              />
            ))}
          </div>

          {selectedPilot && (
            <div className="cyber-border p-4 bg-slate-800">
              <h4 className="text-pink-400 font-semibold mb-3">PILOT DETAILS</h4>
              {(() => {
                const pilot = pilots.find(p => p.id === selectedPilot);
                if (!pilot) return null;
                
                return (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Full Name:</span>
                          <span className="text-white">{pilot.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Experience:</span>
                          <span className="text-white">{pilot.experience} XP</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Battle Record:</span>
                          <span className="text-white">{pilot.wins}W - {pilot.losses}L</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="space-y-2">
                        <div>
                          <div className="text-gray-400 text-xs">Tactical Rating</div>
                          <div className="w-full bg-gray-700 rounded h-2">
                            <div 
                              className="bg-green-400 h-2 rounded" 
                              style={{ width: `${pilot.tactical}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-green-400">{pilot.tactical}/100</div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-xs">Teamwork Rating</div>
                          <div className="w-full bg-gray-700 rounded h-2">
                            <div 
                              className="bg-green-400 h-2 rounded" 
                              style={{ width: `${pilot.teamwork}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-green-400">{pilot.teamwork}/100</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
