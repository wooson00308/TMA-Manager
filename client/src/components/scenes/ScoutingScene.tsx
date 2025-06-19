import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CyberButton } from '@/components/ui/CyberButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { Clock, Zap, Target, Brain, Users, Star, Coins } from 'lucide-react';

interface PilotWithTraining {
  id: number;
  name: string;
  callsign: string;
  dormitory: string;
  rating: number;
  reaction: number;
  accuracy: number;
  tactical: number;
  teamwork: number;
  traits: string[];
  isActive: boolean;
  experience: number;
  wins: number;
  losses: number;
  trainingUntil: string | null;
  trainingType: string | null;
  fatigue: number;
  morale: number;
}

interface TeamWithCredits {
  id: number;
  name: string;
  wins: number;
  losses: number;
  currentSeason: number;
  leagueRank: number;
  credits: number;
  reputation: number;
}

export function ScoutingScene() {
  const { setScene } = useGameStore();
  const [activeTab, setActiveTab] = useState<'current' | 'training' | 'recruit'>('current');
  const [currentPage, setCurrentPage] = useState(1);
  const [trainingCountdowns, setTrainingCountdowns] = useState<{[key: number]: number}>({});
  const itemsPerPage = 6;
  const queryClient = useQueryClient();

  // Fetch current pilots
  const { data: currentPilots = [], isLoading: pilotsLoading } = useQuery({
    queryKey: ['/api/pilots/active'],
  });

  // Fetch teams for credits display
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['/api/teams'],
  });

  // Fetch recruitable pilots
  const { data: recruitablePilots = [], isLoading: recruitLoading } = useQuery({
    queryKey: ['/api/pilots/recruitable'],
  });

  // Training mutation
  const startTrainingMutation = useMutation({
    mutationFn: ({ pilotId, trainingType }: { pilotId: number; trainingType: string }) =>
      apiRequest(`/api/pilots/${pilotId}/training`, 'POST', { trainingType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pilots/active'] });
    },
  });

  // Complete training mutation
  const completeTrainingMutation = useMutation({
    mutationFn: (pilotId: number) =>
      apiRequest(`/api/pilots/${pilotId}/complete-training`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pilots/active'] });
    },
  });

  // Recruitment mutation
  const recruitMutation = useMutation({
    mutationFn: (pilotId: number) =>
      apiRequest(`/api/pilots/${pilotId}/recruit`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pilots/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pilots/recruitable'] });
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
    },
  });

  // Update training countdowns
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const newCountdowns: {[key: number]: number} = {};
      
      (currentPilots as PilotWithTraining[]).forEach((pilot) => {
        if (pilot.trainingUntil) {
          const remaining = new Date(pilot.trainingUntil).getTime() - now;
          if (remaining > 0) {
            newCountdowns[pilot.id] = remaining;
          } else if (trainingCountdowns[pilot.id] > 0) {
            completeTrainingMutation.mutate(pilot.id);
          }
        }
      });
      
      setTrainingCountdowns(newCountdowns);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPilots, trainingCountdowns, completeTrainingMutation]);

  const playerTeam = (teams as TeamWithCredits[]).find((team) => team.name === 'Trinity Squad');
  const credits = playerTeam?.credits || 0;

  const handleStartTraining = (pilotId: number, trainingType: string) => {
    startTrainingMutation.mutate({ pilotId, trainingType });
  };

  const handleRecruit = (pilotId: number) => {
    recruitMutation.mutate(pilotId);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const getStatIcon = (statName: string) => {
    switch (statName) {
      case 'reaction': return <Zap className="w-4 h-4" />;
      case 'accuracy': return <Target className="w-4 h-4" />;
      case 'tactical': return <Brain className="w-4 h-4" />;
      case 'teamwork': return <Users className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const getStatColor = (value: number) => {
    if (value >= 80) return 'text-green-400';
    if (value >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getProgressColor = (value: number, type: 'fatigue' | 'morale') => {
    if (type === 'fatigue') {
      if (value >= 70) return 'bg-red-500';
      if (value >= 40) return 'bg-yellow-500';
      return 'bg-green-500';
    } else {
      if (value >= 70) return 'bg-green-500';
      if (value >= 40) return 'bg-yellow-500';
      return 'bg-red-500';
    }
  };

  // Pagination logic
  const totalPilots = (currentPilots as PilotWithTraining[]).length;
  const totalPages = Math.ceil(totalPilots / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPilotsPage = (currentPilots as PilotWithTraining[]).slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            파일럿 스카우팅
          </h1>
          <p className="text-gray-400 mt-2">파일럿 관리 및 훈련</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg">
            <Coins className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 font-bold">{credits.toLocaleString()}</span>
            <span className="text-gray-400">크레딧</span>
          </div>
          <CyberButton onClick={() => setScene('hub')} variant="secondary">
            사령부로 돌아가기
          </CyberButton>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-8">
        <CyberButton
          variant={activeTab === 'current' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('current')}
        >
          현재 파일럿 ({totalPilots})
        </CyberButton>
        <CyberButton
          variant={activeTab === 'training' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('training')}
        >
          훈련 시설
        </CyberButton>
        <CyberButton
          variant={activeTab === 'recruit' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('recruit')}
        >
          신규 영입
        </CyberButton>
      </div>

      {/* Current Pilots Tab */}
      {activeTab === 'current' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentPilotsPage.map((pilot) => (
              <Card key={pilot.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-cyan-400">{pilot.name}</CardTitle>
                      <p className="text-gray-400">"{pilot.callsign}"</p>
                      <Badge variant="outline" className="mt-1">
                        {pilot.dormitory}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-yellow-400">{pilot.rating}</div>
                      <div className="text-xs text-gray-400">전체 평점</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        {getStatIcon('reaction')}
                        <span>반응속도:</span>
                        <span className={getStatColor(pilot.reaction)}>{pilot.reaction}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatIcon('accuracy')}
                        <span>정확도:</span>
                        <span className={getStatColor(pilot.accuracy)}>{pilot.accuracy}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatIcon('tactical')}
                        <span>전술이해:</span>
                        <span className={getStatColor(pilot.tactical)}>{pilot.tactical}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatIcon('teamwork')}
                        <span>팀워크:</span>
                        <span className={getStatColor(pilot.teamwork)}>{pilot.teamwork}</span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="text-xs text-gray-400">피로도</div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getProgressColor(pilot.fatigue, 'fatigue')}`}
                            style={{ width: `${pilot.fatigue}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-400">사기</div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getProgressColor(pilot.morale, 'morale')}`}
                            style={{ width: `${pilot.morale}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Training Status */}
                    {trainingCountdowns[pilot.id] ? (
                      <div className="bg-blue-900/30 p-3 rounded border border-blue-500/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-blue-400">
                            {pilot.trainingType} 훈련 중
                          </span>
                        </div>
                        <div className="text-lg font-mono text-blue-300">
                          {formatTime(trainingCountdowns[pilot.id])}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">
                        경험치: {pilot.experience} | 승: {pilot.wins} | 패: {pilot.losses}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <CyberButton
                variant="secondary"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1"
              >
                이전
              </CyberButton>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <CyberButton
                  key={page}
                  variant={currentPage === page ? "primary" : "secondary"}
                  onClick={() => setCurrentPage(page)}
                  className="px-3 py-1"
                >
                  {page}
                </CyberButton>
              ))}
              
              <CyberButton
                variant="secondary"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1"
              >
                다음
              </CyberButton>
            </div>
          )}
          
          <div className="text-center text-sm text-gray-400">
            {totalPilots}명 중 {startIndex + 1}-{Math.min(endIndex, totalPilots)}명 표시
          </div>
        </div>
      )}

      {/* Training Tab */}
      {activeTab === 'training' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {['reaction', 'accuracy', 'tactical', 'teamwork'].map((trainingType) => (
            <Card key={trainingType} className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyan-400">
                  {getStatIcon(trainingType)}
                  {trainingType === 'reaction' && '반응속도 훈련'}
                  {trainingType === 'accuracy' && '정확도 훈련'}
                  {trainingType === 'tactical' && '전술 훈련'}
                  {trainingType === 'teamwork' && '팀워크 훈련'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-gray-400">
                    {trainingType === 'reaction' && '파일럿의 반응속도와 기동성을 향상시킵니다.'}
                    {trainingType === 'accuracy' && '사격 정확도와 표적 인식 능력을 강화합니다.'}
                    {trainingType === 'tactical' && '전술적 판단력과 상황 분석 능력을 개발합니다.'}
                    {trainingType === 'teamwork' && '팀 협동과 의사소통 능력을 향상시킵니다.'}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">훈련 가능한 파일럿:</div>
                    {(currentPilots as PilotWithTraining[])
                      .filter((pilot) => !pilot.trainingUntil && pilot.fatigue < 80)
                      .slice(0, 3)
                      .map((pilot) => (
                        <div key={pilot.id} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                          <span className="text-sm">{pilot.name}</span>
                          <CyberButton
                            onClick={() => handleStartTraining(pilot.id, trainingType)}
                            disabled={startTrainingMutation.isPending}
                            className="text-xs px-2 py-1"
                          >
                            훈련 시작
                          </CyberButton>
                        </div>
                      ))
                    }
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    훈련 시간: 30초 | 비용: 무료 | 효과: +1~3 능력치
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recruitment Tab */}
      {activeTab === 'recruit' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(recruitablePilots as any[]).map((pilot: any) => (
            <Card key={pilot.id} className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-cyan-400">{pilot.name}</CardTitle>
                    <p className="text-gray-400">"{pilot.callsign}"</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-400">{pilot.rating}</div>
                    <div className="text-xs text-gray-400">평점</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-300">{pilot.background}</div>
                  
                  <div className="flex flex-wrap gap-1">
                    {pilot.traits?.map((trait: string) => (
                      <Badge key={trait} variant="secondary" className="text-xs">
                        {trait}
                      </Badge>
                    ))}
                  </div>

                  <div className="bg-blue-900/30 p-2 rounded">
                    <div className="text-sm font-semibold text-blue-400 mb-1">특수 능력</div>
                    <div className="text-xs text-gray-300">{pilot.specialAbility}</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 font-bold">{pilot.cost?.toLocaleString()}</span>
                    </div>
                    <CyberButton
                      onClick={() => handleRecruit(pilot.id)}
                      disabled={credits < pilot.cost || recruitMutation.isPending}
                      className="text-xs px-2 py-1"
                    >
                      영입
                    </CyberButton>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}