import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useGameStore } from '@/stores/gameStore';
import { CyberButton } from '@/components/ui/CyberButton';
import { PilotCard } from '@/components/ui/PilotCard';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Pilot } from '@shared/schema';

interface RecruitablePilot extends Pilot {
  cost: number;
  requirements: string[];
  specialAbility: string;
  background: string;
}

export function ScoutingScene() {
  const { setScene } = useGameStore();
  const [activeTab, setActiveTab] = useState<'current' | 'recruit' | 'training'>('current');
  const [selectedPilot, setSelectedPilot] = useState<Pilot | null>(null);

  const { data: currentPilots, isLoading: pilotsLoading } = useQuery<Pilot[]>({
    queryKey: ['/api/pilots/active'],
  });

  const { data: recruitablePilots, isLoading: recruitLoading } = useQuery<RecruitablePilot[]>({
    queryKey: ['/api/pilots/recruitable'],
  });

  const recruitMutation = useMutation({
    mutationFn: (pilotId: number) => apiRequest(`/api/pilots/${pilotId}/recruit`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pilots'] });
    },
  });

  const trainingMutation = useMutation({
    mutationFn: ({ pilotId, trainingType }: { pilotId: number; trainingType: string }) => 
      apiRequest(`/api/pilots/${pilotId}/train`, 'POST', { trainingType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pilots'] });
    },
  });

  const mockRecruitablePilots: RecruitablePilot[] = [
    {
      id: 101,
      name: "김준호",
      callsign: "스나이퍼",
      combatRating: 88,
      personalityTraits: ["ANALYTICAL", "SNIPER", "CAUTIOUS", "VETERAN"],
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
      combatRating: 85,
      personalityTraits: ["AGGRESSIVE", "ASSAULT", "INDEPENDENT", "ACE"],
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
      combatRating: 82,
      personalityTraits: ["DEFENSIVE", "KNIGHT", "COOPERATIVE", "ROOKIE"],
      teamId: null,
      status: "available",
      cost: 1800,
      requirements: ["기본 요구사항 없음"],
      specialAbility: "아군 보호 시 방어력 증가",
      background: "신인이지만 뛰어난 방어 감각을 가진 유망주"
    }
  ];

  const getTraitColor = (trait: string) => {
    if (trait.includes('AGGRESSIVE') || trait.includes('ASSAULT')) return 'text-red-400';
    if (trait.includes('DEFENSIVE') || trait.includes('KNIGHT')) return 'text-blue-400';
    if (trait.includes('SUPPORT') || trait.includes('COOPERATIVE')) return 'text-green-400';
    if (trait.includes('SNIPER') || trait.includes('ANALYTICAL')) return 'text-purple-400';
    if (trait.includes('ACE') || trait.includes('VETERAN')) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const handleRecruit = (pilot: RecruitablePilot) => {
    // In a real implementation, this would check requirements and cost
    console.log(`Recruiting pilot: ${pilot.name}`);
    // recruitMutation.mutate(pilot.id);
  };

  const handleTraining = (pilotId: number, trainingType: string) => {
    console.log(`Training pilot ${pilotId} with ${trainingType}`);
    // trainingMutation.mutate({ pilotId, trainingType });
  };

  return (
    <div className="scene-transition">
      <div className="mb-6">
        <h2 className="text-2xl font-orbitron font-bold text-green-400 mb-2">파일럿 관리</h2>
        <p className="text-gray-400">영입, 훈련 및 개발</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('current')}
          className={`px-4 py-2 rounded ${
            activeTab === 'current'
              ? 'bg-green-600 text-white'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          현재 파일럿
        </button>
        <button
          onClick={() => setActiveTab('recruit')}
          className={`px-4 py-2 rounded ${
            activeTab === 'recruit'
              ? 'bg-green-600 text-white'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          영입 가능
        </button>
        <button
          onClick={() => setActiveTab('training')}
          className={`px-4 py-2 rounded ${
            activeTab === 'training'
              ? 'bg-green-600 text-white'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          훈련 프로그램
        </button>
      </div>

      {/* Current Pilots Tab */}
      {activeTab === 'current' && (
        <div>
          <div className="mb-4">
            <h3 className="text-pink-400 font-semibold mb-2">소속 파일럿</h3>
            <p className="text-sm text-gray-400">현재 팀에 소속된 파일럿들입니다.</p>
          </div>
          
          {pilotsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin text-4xl mb-4 text-green-400">⟳</div>
              <p className="text-gray-400">파일럿 정보 로딩 중...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentPilots?.map((pilot) => (
                <div key={pilot.id} className="cyber-border p-4 bg-slate-800">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h4 className="font-semibold text-white">{pilot.name}</h4>
                      <p className="text-sm text-gray-400">"{pilot.callsign}"</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-400">{pilot.combatRating}</div>
                      <div className="text-xs text-gray-400">전투력</div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-xs text-gray-400 mb-1">특성:</div>
                    <div className="flex flex-wrap gap-1">
                      {pilot.personalityTraits.map((trait, index) => (
                        <span
                          key={index}
                          className={`px-2 py-1 bg-gray-700 text-xs rounded ${getTraitColor(trait)}`}
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <CyberButton 
                      onClick={() => handleTraining(pilot.id, 'combat')}
                      className="flex-1 text-xs"
                    >
                      전투 훈련
                    </CyberButton>
                    <CyberButton 
                      onClick={() => handleTraining(pilot.id, 'tactical')}
                      variant="secondary"
                      className="flex-1 text-xs"
                    >
                      전술 교육
                    </CyberButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recruitment Tab */}
      {activeTab === 'recruit' && (
        <div>
          <div className="mb-4">
            <h3 className="text-pink-400 font-semibold mb-2">영입 가능 파일럿</h3>
            <p className="text-sm text-gray-400">새로운 파일럿을 영입하여 팀을 강화하세요.</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockRecruitablePilots.map((pilot) => (
              <div key={pilot.id} className="cyber-border p-4 bg-slate-800">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-white">{pilot.name}</h4>
                    <p className="text-sm text-gray-400">"{pilot.callsign}"</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-400">{pilot.combatRating}</div>
                    <div className="text-xs text-gray-400">전투력</div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="text-xs text-gray-400 mb-1">배경:</div>
                  <p className="text-sm text-gray-300">{pilot.background}</p>
                </div>
                
                <div className="mb-3">
                  <div className="text-xs text-gray-400 mb-1">특수 능력:</div>
                  <p className="text-sm text-blue-400">{pilot.specialAbility}</p>
                </div>
                
                <div className="mb-3">
                  <div className="text-xs text-gray-400 mb-1">특성:</div>
                  <div className="flex flex-wrap gap-1">
                    {pilot.personalityTraits.map((trait, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 bg-gray-700 text-xs rounded ${getTraitColor(trait)}`}
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-xs text-gray-400 mb-1">영입 조건:</div>
                  <div className="space-y-1">
                    {pilot.requirements.map((req, index) => (
                      <div key={index} className="text-xs text-yellow-400">
                        • {req}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-lg font-bold text-pink-400">
                    {pilot.cost.toLocaleString()} 크레딧
                  </div>
                  <CyberButton onClick={() => handleRecruit(pilot)}>
                    영입하기
                  </CyberButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Training Tab */}
      {activeTab === 'training' && (
        <div>
          <div className="mb-4">
            <h3 className="text-pink-400 font-semibold mb-2">훈련 프로그램</h3>
            <p className="text-sm text-gray-400">파일럿들의 능력을 향상시킬 수 있는 훈련 과정입니다.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="cyber-border p-4 bg-gradient-to-r from-red-900/20 to-orange-900/20 border-red-400/50">
              <h4 className="text-red-400 font-semibold mb-2">전투 훈련</h4>
              <p className="text-sm text-gray-300 mb-3">공격력과 반응속도를 향상시킵니다.</p>
              <div className="text-xs text-gray-400 mb-3">
                • 화력 +3<br/>
                • 정확도 +5%<br/>
                • 기간: 1주
              </div>
              <div className="text-lg font-bold text-pink-400 mb-2">1,500 크레딧</div>
            </div>
            
            <div className="cyber-border p-4 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border-blue-400/50">
              <h4 className="text-blue-400 font-semibold mb-2">전술 교육</h4>
              <p className="text-sm text-gray-300 mb-3">전략적 사고와 팀워크를 강화합니다.</p>
              <div className="text-xs text-gray-400 mb-3">
                • 회피율 +8%<br/>
                • 협동 효과 +10%<br/>
                • 기간: 2주
              </div>
              <div className="text-lg font-bold text-pink-400 mb-2">2,000 크레딧</div>
            </div>
            
            <div className="cyber-border p-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-400/50">
              <h4 className="text-purple-400 font-semibold mb-2">특화 훈련</h4>
              <p className="text-sm text-gray-300 mb-3">개인 특성에 맞는 맞춤형 훈련입니다.</p>
              <div className="text-xs text-gray-400 mb-3">
                • 특성 강화<br/>
                • 새로운 특성 획득 가능<br/>
                • 기간: 3주
              </div>
              <div className="text-lg font-bold text-pink-400 mb-2">3,500 크레딧</div>
            </div>
          </div>
          
          <div className="mt-6 cyber-border p-4 bg-yellow-900/20 border-yellow-400/50">
            <h4 className="text-yellow-400 font-semibold mb-2">훈련 효과 안내</h4>
            <div className="text-sm text-gray-300 space-y-2">
              <p>• 훈련 중인 파일럿은 경기에 참여할 수 없습니다.</p>
              <p>• 훈련 효과는 파일럿의 기본 능력과 특성에 따라 달라집니다.</p>
              <p>• 동일한 훈련을 반복하면 효과가 감소할 수 있습니다.</p>
              <p>• 특화 훈련은 파일럿의 현재 특성과 호환되는 새로운 특성을 부여합니다.</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between mt-6">
        <CyberButton variant="secondary" onClick={() => setScene('hub')}>
          지휘부로 돌아가기
        </CyberButton>
        
        <CyberButton onClick={() => setScene('formation')}>
          편성 관리로 이동
        </CyberButton>
      </div>
    </div>
  );
}