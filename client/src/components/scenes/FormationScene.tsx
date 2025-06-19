import { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { CyberButton } from '@/components/ui/CyberButton';
import type { Pilot, Mech } from '@shared/schema';

interface FormationSlot {
  pilot: Pilot | null;
  mech: Mech | null;
  role: 'Knight' | 'Arbiter' | 'River';
  position: { x: number; y: number };
}

interface TacticalSetting {
  name: string;
  description: string;
  effects: string[];
  icon: string;
}

export function FormationScene() {
  const { setScene, pilots, mechs } = useGameStore();
  
  const [formation, setFormation] = useState<FormationSlot[]>([
    { pilot: null, mech: null, role: 'Knight', position: { x: 1, y: 2 } },
    { pilot: null, mech: null, role: 'Arbiter', position: { x: 3, y: 1 } },
    { pilot: null, mech: null, role: 'River', position: { x: 2, y: 3 } }
  ]);
  
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [selectionMode, setSelectionMode] = useState<'pilot' | 'mech'>('pilot');
  const [tacticalSetting, setTacticalSetting] = useState<string>('balanced');
  const [activeTab, setActiveTab] = useState<'formation' | 'tactics' | 'preview'>('formation');

  const tacticalSettings: TacticalSetting[] = [
    {
      name: 'balanced',
      description: '균형 잡힌 전술',
      effects: ['모든 능력치 균등 보정', '안정적인 운영', '범용성 높음'],
      icon: '⚖️'
    },
    {
      name: 'aggressive',
      description: '공격적 전술',
      effects: ['화력 +15%', '속도 +10%', '방어력 -5%'],
      icon: '⚔️'
    },
    {
      name: 'defensive',
      description: '방어적 전술',
      effects: ['방어력 +20%', '회피율 +10%', '화력 -10%'],
      icon: '🛡️'
    },
    {
      name: 'mobile',
      description: '기동전 전술',
      effects: ['속도 +25%', '회피율 +15%', '방어력 -15%'],
      icon: '💨'
    }
  ];

  const handleSelectPilot = (pilot: Pilot) => {
    if (selectedSlot !== null) {
      setFormation(prev => prev.map((slot, index) => 
        index === selectedSlot ? { ...slot, pilot } : slot
      ));
      setSelectedSlot(null);
    }
  };

  const handleSelectMech = (mech: Mech) => {
    if (selectedSlot !== null) {
      setFormation(prev => prev.map((slot, index) => 
        index === selectedSlot ? { ...slot, mech } : slot
      ));
      setSelectedSlot(null);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Knight': return 'text-blue-400';
      case 'Arbiter': return 'text-red-400';
      case 'River': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'Knight': return '근접 방어형 - 전방에서 적의 공격을 막아내는 역할';
      case 'Arbiter': return '장거리 공격형 - 후방에서 정밀 사격으로 적을 제압';
      case 'River': return '중거리 기동형 - 측면 기동으로 전장을 컨트롤';
      default: return '';
    }
  };

  const getCompatibilityScore = (pilot: Pilot | null, mech: Mech | null, role: string) => {
    if (!pilot || !mech) return 0;
    
    let score = 50; // Base compatibility
    const pilotTraits = (pilot as any).traits || [];
    
    // Role-based compatibility
    if (role === 'Knight') {
      if (pilotTraits.includes('DEFENSIVE') || pilotTraits.includes('KNIGHT')) score += 20;
      if (mech.type === 'Knight') score += 15;
      if (mech.armor >= 80) score += 10;
    } else if (role === 'Arbiter') {
      if (pilotTraits.includes('ANALYTICAL') || pilotTraits.includes('SNIPER')) score += 20;
      if (mech.type === 'Arbiter') score += 15;
      if (mech.firepower >= 85) score += 10;
    } else if (role === 'River') {
      if (pilotTraits.includes('AGGRESSIVE') || pilotTraits.includes('SCOUT')) score += 20;
      if (mech.type === 'River') score += 15;
      if (mech.speed >= 80) score += 10;
    }
    
    // Experience bonus
    if (pilotTraits.includes('VETERAN') || pilotTraits.includes('ACE')) score += 10;
    
    return Math.min(100, Math.max(0, score));
  };

  const isFormationComplete = () => {
    return formation.every(slot => slot.pilot && slot.mech);
  };

  const calculateTeamPower = () => {
    return formation.reduce((total, slot) => {
      if (!slot.pilot || !slot.mech) return total;
      const basePower = (slot.pilot as any).rating + slot.mech.firepower + slot.mech.speed + slot.mech.armor;
      const compatibility = getCompatibilityScore(slot.pilot, slot.mech, slot.role);
      return total + (basePower * compatibility / 100);
    }, 0);
  };

  return (
    <div className="scene-transition">
      <div className="mb-6">
        <h2 className="text-2xl font-orbitron font-bold text-green-400 mb-2">편성 관리</h2>
        <p className="text-gray-400">파일럿-기체 조합 및 전술 설정</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('formation')}
          className={`px-4 py-2 rounded ${
            activeTab === 'formation'
              ? 'bg-green-600 text-white'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          편성 구성
        </button>
        <button
          onClick={() => setActiveTab('tactics')}
          className={`px-4 py-2 rounded ${
            activeTab === 'tactics'
              ? 'bg-green-600 text-white'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          전술 설정
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 rounded ${
            activeTab === 'preview'
              ? 'bg-green-600 text-white'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          미리보기
        </button>
      </div>

      {/* Formation Tab */}
      {activeTab === 'formation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formation Slots */}
          <div>
            <h3 className="text-pink-400 font-semibold mb-4">편성 슬롯</h3>
            <div className="space-y-4">
              {formation.map((slot, index) => (
                <div key={index} className="cyber-border p-4 bg-slate-800">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h4 className={`font-semibold ${getRoleColor(slot.role)}`}>
                        {slot.role} ({index + 1}번 슬롯)
                      </h4>
                      <p className="text-xs text-gray-400">
                        {getRoleDescription(slot.role)}
                      </p>
                    </div>
                    {slot.pilot && slot.mech && (
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-400">
                          {getCompatibilityScore(slot.pilot, slot.mech, slot.role)}%
                        </div>
                        <div className="text-xs text-gray-400">호환성</div>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className={`cyber-border p-3 ${
                      slot.pilot ? 'bg-green-800/30' : 'bg-gray-800/50 border-dashed'
                    }`}>
                      {slot.pilot ? (
                        <div>
                          <div className="font-medium text-white">{slot.pilot.name}</div>
                          <div className="text-xs text-gray-400">"{slot.pilot.callsign}"</div>
                          <div className="text-sm text-green-400">{(slot.pilot as any).rating}</div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500">파일럿 없음</div>
                      )}
                    </div>
                    
                    <div className={`cyber-border p-3 ${
                      slot.mech ? 'bg-blue-800/30' : 'bg-gray-800/50 border-dashed'
                    }`}>
                      {slot.mech ? (
                        <div>
                          <div className="font-medium text-white">{slot.mech.name}</div>
                          <div className="text-xs text-gray-400">{slot.mech.type}</div>
                          <div className="text-xs">
                            F:{slot.mech.firepower} S:{slot.mech.speed} A:{slot.mech.armor}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500">기체 없음</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <CyberButton
                      onClick={() => {
                        setSelectedSlot(index);
                        setSelectionMode('pilot');
                      }}
                      variant="secondary"
                      className="flex-1 text-xs"
                    >
                      파일럿 선택
                    </CyberButton>
                    <CyberButton
                      onClick={() => {
                        setSelectedSlot(index);
                        setSelectionMode('mech');
                      }}
                      variant="secondary"
                      className="flex-1 text-xs"
                    >
                      기체 선택
                    </CyberButton>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selection Panel */}
          <div>
            <h3 className="text-pink-400 font-semibold mb-4">
              {selectedSlot !== null ? 
                `${selectionMode === 'pilot' ? '파일럿' : '기체'} 선택 (${selectedSlot + 1}번 슬롯)` : 
                '선택 대기'
              }
            </h3>
            
            {selectedSlot !== null ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectionMode === 'pilot' ? (
                  pilots?.map((pilot) => (
                    <button
                      key={pilot.id}
                      onClick={() => handleSelectPilot(pilot)}
                      className="w-full cyber-border p-3 bg-slate-700 hover:bg-slate-600 transition-all text-left"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <div className="font-medium text-white">{pilot.name}</div>
                          <div className="text-sm text-gray-400">"{pilot.callsign}"</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-400">{(pilot as any).rating}</div>
                          <div className="text-xs text-gray-400">전투력</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {((pilot as any).traits || []).map((trait: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-600 text-xs text-gray-300 rounded"
                          >
                            {trait}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))
                ) : (
                  mechs?.map((mech) => (
                    <button
                      key={mech.id}
                      onClick={() => handleSelectMech(mech)}
                      className="w-full cyber-border p-3 bg-slate-700 hover:bg-slate-600 transition-all text-left"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <div className="font-medium text-white">{mech.name}</div>
                          <div className="text-sm text-gray-400">{mech.type} - {mech.variant}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>화력: <span className="text-orange-400">{mech.firepower}</span></div>
                        <div>속도: <span className="text-blue-400">{mech.speed}</span></div>
                        <div>장갑: <span className="text-green-400">{mech.armor}</span></div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div className="cyber-border p-8 bg-slate-800 text-center">
                <p className="text-gray-400">편성 슬롯을 선택하여 파일럿이나 기체를 배정하세요.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tactics Tab */}
      {activeTab === 'tactics' && (
        <div>
          <div className="mb-6">
            <h3 className="text-pink-400 font-semibold mb-2">전술 설정</h3>
            <p className="text-sm text-gray-400">전투에서 사용할 전술을 선택하세요.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tacticalSettings.map((setting) => (
              <button
                key={setting.name}
                onClick={() => setTacticalSetting(setting.name)}
                className={`cyber-border p-4 text-left transition-all ${
                  tacticalSetting === setting.name
                    ? 'bg-green-900/30 border-green-400/50'
                    : 'bg-slate-800 border-slate-600 hover:border-green-400/30'
                }`}
              >
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-3">{setting.icon}</span>
                  <div>
                    <h4 className="font-semibold text-white">{setting.description}</h4>
                    <p className="text-sm text-gray-400">{setting.name}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  {setting.effects.map((effect, index) => (
                    <div key={index} className="text-sm text-gray-300">
                      • {effect}
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <div>
          <div className="mb-6">
            <h3 className="text-pink-400 font-semibold mb-2">편성 미리보기</h3>
            <p className="text-sm text-gray-400">현재 편성의 종합 분석 결과입니다.</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="cyber-border p-4 bg-slate-800">
              <h4 className="text-green-400 font-semibold mb-3">종합 능력치</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">총 전투력:</span>
                  <span className="text-green-400 font-bold">{Math.round(calculateTeamPower())}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">편성 완성도:</span>
                  <span className={`font-bold ${isFormationComplete() ? 'text-green-400' : 'text-red-400'}`}>
                    {isFormationComplete() ? '완료' : '미완료'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">선택된 전술:</span>
                  <span className="text-yellow-400">
                    {tacticalSettings.find(s => s.name === tacticalSetting)?.description}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="cyber-border p-4 bg-slate-800">
              <h4 className="text-blue-400 font-semibold mb-3">전술 분석</h4>
              <div className="space-y-2">
                {tacticalSettings
                  .find(s => s.name === tacticalSetting)
                  ?.effects.map((effect, index) => (
                  <div key={index} className="text-sm text-gray-300">
                    • {effect}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {isFormationComplete() && (
            <div className="mt-6 cyber-border p-4 bg-gradient-to-r from-green-900/20 to-blue-900/20 border-green-400/50">
              <h4 className="text-green-400 font-semibold mb-2">편성 준비 완료</h4>
              <p className="text-gray-300 mb-4">모든 슬롯이 배정되었습니다. 전투를 시작할 수 있습니다.</p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between mt-6">
        <CyberButton variant="secondary" onClick={() => setScene('banpick')}>
          밴픽으로 돌아가기
        </CyberButton>
        
        {isFormationComplete() && (
          <CyberButton onClick={() => setScene('battle')}>
            전투 시작
          </CyberButton>
        )}
      </div>
    </div>
  );
}