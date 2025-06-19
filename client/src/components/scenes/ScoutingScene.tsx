import React, { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CyberButton } from '@/components/ui/CyberButton';

interface RecruitablePilot {
  id: number;
  name: string;
  callsign: string;
  rating: number;
  traits: string[];
  teamId: number | null;
  status: string;
  cost: number;
  requirements: string[];
  specialAbility: string;
  background: string;
}

export function ScoutingScene() {
  const { setScene } = useGameStore();
  const [activeTab, setActiveTab] = useState<'current' | 'recruit' | 'training'>('current');
  const [currentPage, setCurrentPage] = useState(1);
  const [recruitPage, setRecruitPage] = useState(1);
  const itemsPerPage = 6;

  const queryClient = useQueryClient();

  // Fetch current pilots
  const { data: currentPilots, isLoading: pilotsLoading } = useQuery({
    queryKey: ['/api/pilots/active'],
  });

  // Fetch recruitable pilots
  const { data: recruitablePilots, isLoading: recruitLoading } = useQuery({
    queryKey: ['/api/pilots/recruitable'],
  });

  const recruitMutation = useMutation({
    mutationFn: async (pilotId: number) => {
      // API call would go here
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pilots'] });
    },
  });

  const getTraitColor = (trait: string) => {
    const traitColors: Record<string, string> = {
      'AGGRESSIVE': 'text-red-400',
      'CAUTIOUS': 'text-blue-400',
      'ANALYTICAL': 'text-purple-400',
      'COOPERATIVE': 'text-green-400',
      'INDEPENDENT': 'text-yellow-400',
      'ASSAULT': 'text-red-300',
      'DEFENSIVE': 'text-blue-300',
      'SUPPORT': 'text-green-300',
      'SNIPER': 'text-purple-300',
      'SCOUT': 'text-yellow-300',
      'KNIGHT': 'text-cyan-400',
      'RIVER': 'text-pink-400',
      'ARBITER': 'text-orange-400',
      'ACE': 'text-gold',
      'VETERAN': 'text-gray-300',
      'ROOKIE': 'text-white',
      'GENIUS': 'text-rainbow'
    };
    return traitColors[trait] || 'text-gray-400';
  };

  const handleRecruit = (pilot: RecruitablePilot) => {
    console.log(`Recruiting pilot: ${pilot.name}`);
    alert(`${pilot.name} (${pilot.callsign})을 영입했습니다!`);
  };

  const handleTraining = (pilotId: number, trainingType: string) => {
    const pilot = (currentPilots as any[])?.find((p: any) => p.id === pilotId);
    if (!pilot) return;

    const trainingEffects: Record<string, any> = {
      '전투훈련': { accuracy: 2, reaction: 1 },
      '전술교육': { tactical: 2, teamwork: 1 },
      '기체조작': { reaction: 2, accuracy: 1 },
      '팀워크': { teamwork: 2, tactical: 1 }
    };

    const effects = trainingEffects[trainingType] || {};
    console.log(`${pilot.name} (${pilot.callsign})이 ${trainingType}을 완료했습니다:`, effects);
    alert(`${pilot.name}의 ${trainingType}이 완료되었습니다!`);
  };

  // Pagination helpers
  const getPaginatedData = (data: any[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    return data?.slice(startIndex, startIndex + itemsPerPage) || [];
  };

  const getTotalPages = (total: number) => Math.ceil(total / itemsPerPage);

  const PaginationControls = ({ currentPage, totalPages, onPageChange }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center items-center space-x-2 mt-4">
        <CyberButton
          variant="secondary"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm"
        >
          이전
        </CyberButton>
        
        <div className="flex space-x-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 text-sm rounded transition-all ${
                page === currentPage
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <CyberButton
          variant="secondary"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-sm"
        >
          다음
        </CyberButton>
      </div>
    );
  };

  const mockRecruitablePilots: RecruitablePilot[] = [
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
      name: "이수민",
      callsign: "실드",
      rating: 82,
      traits: ["DEFENSIVE", "COOPERATIVE", "KNIGHT", "VETERAN"],
      teamId: null,
      status: "available",
      cost: 2200,
      requirements: ["팀워크 능력", "방어형 전술 이해"],
      specialAbility: "아군 보호 시 데미지 감소 효과",
      background: "방어 전술 전문가로 팀을 보호하는 역할을 담당"
    }
  ];

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
        <div className="content-container">
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
            <div className="space-y-4">
              <div className="pilot-grid-container">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getPaginatedData((currentPilots as any[]) || [], currentPage).map((pilot: any) => (
                    <div key={pilot.id} className="cyber-border p-4 bg-slate-800">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <h4 className="font-semibold text-white">{pilot.name}</h4>
                          <p className="text-sm text-gray-400">"{pilot.callsign}"</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-400">{pilot.rating || 75}</div>
                          <div className="text-xs text-gray-400">전투력</div>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-xs text-gray-400 mb-1">능력치:</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>반응: {pilot.reaction || 70}</div>
                          <div>정확: {pilot.accuracy || 75}</div>
                          <div>전술: {pilot.tactical || 68}</div>
                          <div>협력: {pilot.teamwork || 72}</div>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-xs text-gray-400 mb-1">특성:</div>
                        <div className="flex flex-wrap gap-1">
                          {(pilot.traits || ['ROOKIE']).map((trait: string, index: number) => (
                            <span
                              key={index}
                              className={`px-2 py-1 bg-gray-700 text-xs rounded ${getTraitColor(trait)}`}
                            >
                              {trait}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <CyberButton
                          variant="secondary"
                          onClick={() => handleTraining(pilot.id, '전투훈련')}
                          className="text-xs py-1"
                        >
                          전투 훈련
                        </CyberButton>
                        <CyberButton
                          variant="secondary"
                          onClick={() => handleTraining(pilot.id, '전술교육')}
                          className="text-xs py-1"
                        >
                          전술 교육
                        </CyberButton>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <PaginationControls
                currentPage={currentPage}
                totalPages={getTotalPages(Array.isArray(currentPilots) ? currentPilots.length : 0)}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      )}

      {/* Recruitment Tab */}
      {activeTab === 'recruit' && (
        <div className="content-container">
          <div className="mb-4">
            <h3 className="text-pink-400 font-semibold mb-2">영입 가능 파일럿</h3>
            <p className="text-sm text-gray-400">새로운 파일럿을 영입하여 팀을 강화하세요.</p>
          </div>
          
          <div className="pilot-grid-container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mockRecruitablePilots.map((pilot) => (
                <div key={pilot.id} className="cyber-border p-4 bg-slate-800">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h4 className="font-semibold text-white">{pilot.name}</h4>
                      <p className="text-sm text-gray-400">"{pilot.callsign}"</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-400">{pilot.rating}</div>
                      <div className="text-xs text-gray-400">전투력</div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-xs text-gray-400 mb-1">특성:</div>
                    <div className="flex flex-wrap gap-1">
                      {pilot.traits.map((trait, index) => (
                        <span
                          key={index}
                          className={`px-2 py-1 bg-gray-700 text-xs rounded ${getTraitColor(trait)}`}
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-xs text-gray-400 mb-1">특수 능력:</div>
                    <p className="text-xs text-green-300">{pilot.specialAbility}</p>
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-xs text-gray-400 mb-1">배경:</div>
                    <p className="text-xs text-gray-300">{pilot.background}</p>
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-xs text-gray-400 mb-1">영입 조건:</div>
                    {pilot.requirements.map((req, index) => (
                      <div key={index} className="text-xs text-yellow-300">• {req}</div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-yellow-400 font-semibold">{pilot.cost.toLocaleString()} 크레딧</div>
                    <CyberButton onClick={() => handleRecruit(pilot)}>
                      영입
                    </CyberButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Training Tab */}
      {activeTab === 'training' && (
        <div className="content-container">
          <div className="mb-6">
            <h3 className="text-pink-400 font-semibold mb-2">훈련 프로그램</h3>
            <p className="text-sm text-gray-400">파일럿 능력치를 향상시키는 다양한 훈련 프로그램</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="cyber-border p-4 bg-slate-800">
              <h4 className="text-green-400 font-semibold mb-3">전투 훈련</h4>
              <p className="text-sm text-gray-300 mb-3">실전 전투 시뮬레이션을 통한 정확도와 반응속도 향상</p>
              <div className="text-xs text-gray-400">
                <div>• 정확도 +2</div>
                <div>• 반응속도 +1</div>
                <div>• 소요 시간: 1주</div>
                <div>• 비용: 500 크레딧</div>
              </div>
            </div>
            
            <div className="cyber-border p-4 bg-slate-800">
              <h4 className="text-blue-400 font-semibold mb-3">전술 교육</h4>
              <p className="text-sm text-gray-300 mb-3">고급 전술 이론과 팀워크 훈련</p>
              <div className="text-xs text-gray-400">
                <div>• 전술력 +2</div>
                <div>• 팀워크 +1</div>
                <div>• 소요 시간: 1주</div>
                <div>• 비용: 600 크레딧</div>
              </div>
            </div>
            
            <div className="cyber-border p-4 bg-slate-800">
              <h4 className="text-purple-400 font-semibold mb-3">기체 조작</h4>
              <p className="text-sm text-gray-300 mb-3">메카 조작 기술과 기동성 향상</p>
              <div className="text-xs text-gray-400">
                <div>• 반응속도 +2</div>
                <div>• 정확도 +1</div>
                <div>• 소요 시간: 1주</div>
                <div>• 비용: 550 크레딧</div>
              </div>
            </div>
            
            <div className="cyber-border p-4 bg-slate-800">
              <h4 className="text-yellow-400 font-semibold mb-3">팀워크 훈련</h4>
              <p className="text-sm text-gray-300 mb-3">협동 작전과 의사소통 능력 개발</p>
              <div className="text-xs text-gray-400">
                <div>• 팀워크 +2</div>
                <div>• 전술력 +1</div>
                <div>• 소요 시간: 1주</div>
                <div>• 비용: 450 크레딧</div>
              </div>
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
          포메이션 설정 →
        </CyberButton>
      </div>
    </div>
  );
}