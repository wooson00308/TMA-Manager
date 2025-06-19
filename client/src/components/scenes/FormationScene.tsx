import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGameStore } from '@/stores/gameStore';
import { PilotCard } from '@/components/ui/PilotCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Pilot, Mech } from '@shared/schema';

interface FormationSlot {
  pilot: Pilot | null;
  mech: Mech | null;
  role: 'Tank' | 'DPS' | 'Support';
}

export function FormationScene() {
  const { pilots, mechs, activeFormation, setActiveFormation } = useGameStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formation, setFormation] = useState<FormationSlot[]>([
    { pilot: null, mech: null, role: 'Tank' },
    { pilot: null, mech: null, role: 'DPS' },
    { pilot: null, mech: null, role: 'Support' },
  ]);

  const [selectedSlot, setSelectedSlot] = useState<number>(0);
  const [selectionMode, setSelectionMode] = useState<'pilot' | 'mech'>('pilot');

  const saveFormationMutation = useMutation({
    mutationFn: async (formationData: any) => {
      const response = await apiRequest('POST', '/api/formations', formationData);
      return response.json();
    },
    onSuccess: (savedFormation) => {
      setActiveFormation(savedFormation);
      queryClient.invalidateQueries({ queryKey: ['/api/formations'] });
      toast({
        title: 'Formation Saved',
        description: 'Your battle formation has been updated!',
      });
    },
    onError: () => {
      toast({
        title: 'Save Failed',
        description: 'Unable to save formation. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSelectPilot = (pilot: Pilot) => {
    const newFormation = [...formation];
    newFormation[selectedSlot].pilot = pilot;
    setFormation(newFormation);
    setSelectionMode('mech');
  };

  const handleSelectMech = (mech: Mech) => {
    const newFormation = [...formation];
    newFormation[selectedSlot].mech = mech;
    setFormation(newFormation);
    setSelectionMode('pilot');
  };

  const handleSaveFormation = () => {
    if (formation.every(slot => slot.pilot && slot.mech)) {
      const formationData = {
        teamId: 1, // Assuming player team ID is 1
        pilot1Id: formation[0].pilot!.id,
        pilot2Id: formation[1].pilot!.id,
        pilot3Id: formation[2].pilot!.id,
        mech1Id: formation[0].mech!.id,
        mech2Id: formation[1].mech!.id,
        mech3Id: formation[2].mech!.id,
        formation: 'standard',
        isActive: true,
      };
      
      saveFormationMutation.mutate(formationData);
    } else {
      toast({
        title: 'Incomplete Formation',
        description: 'Please assign both pilot and mech to all slots.',
        variant: 'destructive',
      });
    }
  };

  const getMechTypeColor = (type: string) => {
    switch (type) {
      case 'Knight': return 'text-yellow-400';
      case 'River': return 'text-red-400';
      case 'Arbiter': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const isFormationComplete = formation.every(slot => slot.pilot && slot.mech);
  const calculateSynergy = () => {
    if (!isFormationComplete) return 0;
    
    // Simple synergy calculation based on complementary traits
    let synergy = 50; // Base synergy
    
    formation.forEach((slot, index) => {
      if (slot.pilot && slot.mech) {
        // Type matching bonus
        if (slot.pilot.dormitory.toLowerCase() === slot.mech.type.toLowerCase()) {
          synergy += 15;
        }
        
        // Role-based bonuses
        if (slot.role === 'Tank' && slot.pilot.traits.includes('DEFENSIVE')) synergy += 10;
        if (slot.role === 'DPS' && slot.pilot.traits.includes('AGGRESSIVE')) synergy += 10;
        if (slot.role === 'Support' && slot.pilot.traits.includes('ANALYTICAL')) synergy += 10;
      }
    });
    
    return Math.min(synergy, 100);
  };

  return (
    <div className="scene-transition">
      <div className="mb-6">
        <h2 className="text-2xl font-orbitron font-bold text-green-400 mb-2">FORMATION MANAGEMENT</h2>
        <p className="text-gray-400">Configure optimal pilot-mech combinations for battle</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formation Slots */}
        <div className="lg:col-span-2">
          <h3 className="text-xl font-orbitron font-semibold text-green-400 mb-4">BATTLE FORMATION</h3>
          
          <div className="space-y-4 mb-6">
            {formation.map((slot, index) => (
              <div 
                key={index}
                className={`cyber-border p-4 cursor-pointer transition-colors ${
                  selectedSlot === index ? 'bg-blue-900' : 'bg-slate-800 hover:bg-slate-700'
                }`}
                onClick={() => setSelectedSlot(index)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-pink-400 font-semibold">SLOT {index + 1}</div>
                    <div className="text-xs text-gray-400">({slot.role})</div>
                  </div>
                  {selectedSlot === index && (
                    <div className="text-green-400 text-xs">SELECTED</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="cyber-border p-3 bg-slate-900">
                    <div className="text-xs text-gray-400 mb-1">PILOT</div>
                    {slot.pilot ? (
                      <div>
                        <div className="text-green-400 font-semibold">{slot.pilot.callsign}</div>
                        <div className="text-xs text-gray-400">{slot.pilot.dormitory} • Rating: {slot.pilot.rating}</div>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm">No pilot assigned</div>
                    )}
                  </div>

                  <div className="cyber-border p-3 bg-slate-900">
                    <div className="text-xs text-gray-400 mb-1">MECH</div>
                    {slot.mech ? (
                      <div>
                        <div className={`font-semibold ${getMechTypeColor(slot.mech.type)}`}>
                          {slot.mech.name}
                        </div>
                        <div className="text-xs text-gray-400">{slot.mech.type} • {slot.mech.variant}</div>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm">No mech assigned</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Formation Stats */}
          <div className="cyber-border p-4 bg-slate-800">
            <h4 className="text-pink-400 font-semibold mb-3">FORMATION ANALYSIS</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Synergy Rating</div>
                <div className="text-green-400 font-bold text-lg">{calculateSynergy()}%</div>
              </div>
              <div>
                <div className="text-gray-400">Combat Ready</div>
                <div className={`font-bold text-lg ${isFormationComplete ? 'text-green-400' : 'text-red-400'}`}>
                  {isFormationComplete ? 'YES' : 'NO'}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Estimated Power</div>
                <div className="text-yellow-400 font-bold text-lg">
                  {isFormationComplete ? Math.floor(calculateSynergy() * 8.5) : 0}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <CyberButton 
                onClick={handleSaveFormation}
                disabled={!isFormationComplete || saveFormationMutation.isPending}
                className="w-full"
              >
                <div className="text-center">
                  <div className="text-pink-400 font-semibold mb-1">
                    <i className="fas fa-save mr-2"></i>
                    {saveFormationMutation.isPending ? 'SAVING...' : 'SAVE FORMATION'}
                  </div>
                  <div className="text-xs text-gray-400">Lock in this configuration for battle</div>
                </div>
              </CyberButton>
            </div>
          </div>
        </div>

        {/* Selection Panel */}
        <div className="space-y-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectionMode('pilot')}
              className={`flex-1 p-2 text-sm font-semibold transition-colors ${
                selectionMode === 'pilot' 
                  ? 'bg-green-400 text-black' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              PILOTS
            </button>
            <button
              onClick={() => setSelectionMode('mech')}
              className={`flex-1 p-2 text-sm font-semibold transition-colors ${
                selectionMode === 'mech' 
                  ? 'bg-green-400 text-black' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              MECHS
            </button>
          </div>

          <div className="cyber-border p-4 bg-slate-800 max-h-96 overflow-y-auto">
            <h4 className="text-pink-400 font-semibold mb-3">
              SELECT {selectionMode.toUpperCase()} FOR SLOT {selectedSlot + 1}
            </h4>
            
            {selectionMode === 'pilot' ? (
              <div className="space-y-2">
                {pilots.map((pilot) => (
                  <div
                    key={pilot.id}
                    onClick={() => handleSelectPilot(pilot)}
                    className="cyber-border p-3 bg-slate-900 hover:bg-blue-900 cursor-pointer transition-colors"
                  >
                    <div className="text-green-400 font-semibold">{pilot.callsign}</div>
                    <div className="text-xs text-gray-400">
                      {pilot.dormitory} • Rating: {pilot.rating}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {pilot.traits.slice(0, 2).map((trait, index) => (
                        <span key={index} className="text-xs bg-gray-700 px-1 rounded">
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {mechs.map((mech) => (
                  <div
                    key={mech.id}
                    onClick={() => handleSelectMech(mech)}
                    className="cyber-border p-3 bg-slate-900 hover:bg-blue-900 cursor-pointer transition-colors"
                  >
                    <div className={`font-semibold ${getMechTypeColor(mech.type)}`}>
                      {mech.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {mech.type} • {mech.variant}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      HP: {mech.hp} | FP: {mech.firepower} | SPD: {mech.speed}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
