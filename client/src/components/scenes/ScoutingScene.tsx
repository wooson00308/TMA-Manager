import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  UserPlus, 
  Coffee, 
  UserMinus, 
  Clock,
  TrendingUp,
  Zap,
  Target,
  Brain,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CyberButton } from '@/components/ui/CyberButton';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Types for pilot data with training information
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
  const [activeTab, setActiveTab] = useState('roster');
  const [selectedPilot, setSelectedPilot] = useState<PilotWithTraining | null>(null);
  const [sortBy, setSortBy] = useState('rating');
  const [filterBy, setFilterBy] = useState('all');
  const [trainingCountdowns, setTrainingCountdowns] = useState<{ [key: number]: number }>({});

  // Data queries
  const { data: currentPilots = [], isLoading: pilotsLoading } = useQuery({
    queryKey: ['/api/pilots/active'],
  });

  const { data: teams = [], isLoading: teamsLoading } = useQuery<TeamWithCredits[]>({
    queryKey: ['/api/teams'],
  });

  const { data: recruitablePilots = [], isLoading: recruitLoading } = useQuery({
    queryKey: ['/api/pilots/recruitable'],
  });

  // Training mutation
  const startTrainingMutation = useMutation({
    mutationFn: ({ pilotId, trainingType }: { pilotId: number; trainingType: string }) =>
      apiRequest('POST', `/api/pilots/${pilotId}/training`, { trainingType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pilots/active'] });
    },
  });

  // Recruitment mutation
  const recruitMutation = useMutation({
    mutationFn: (pilotId: number) =>
      apiRequest('POST', `/api/pilots/${pilotId}/recruit`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pilots/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pilots/recruitable'] });
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
    },
  });

  // Rest mutation
  const restMutation = useMutation({
    mutationFn: (pilotId: number) =>
      apiRequest('POST', `/api/pilots/${pilotId}/rest`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pilots/active'] });
    },
  });

  // Dismiss mutation
  const dismissMutation = useMutation({
    mutationFn: (pilotId: number) =>
      apiRequest('POST', `/api/pilots/${pilotId}/dismiss`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pilots/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pilots/recruitable'] });
    },
  });

  // Training countdown effect
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const newCountdowns: { [key: number]: number } = {};
      
      (currentPilots as PilotWithTraining[]).forEach(pilot => {
        if (pilot.trainingUntil) {
          const trainingEnd = new Date(pilot.trainingUntil).getTime();
          const remaining = Math.max(0, trainingEnd - now);
          newCountdowns[pilot.id] = remaining;
        }
      });
      
      setTrainingCountdowns(newCountdowns);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPilots]);

  // Helper functions
  const handleStartTraining = (pilotId: number, trainingType: string) => {
    startTrainingMutation.mutate({ pilotId, trainingType });
  };

  const handleRecruit = (pilotId: number) => {
    recruitMutation.mutate(pilotId);
  };

  const handleRest = (pilotId: number) => {
    restMutation.mutate(pilotId);
  };

  const handleDismiss = (pilotId: number) => {
    dismissMutation.mutate(pilotId);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}분 ${remainingSeconds}초`;
  };

  const getStatIcon = (stat: string) => {
    switch (stat) {
      case 'reaction': return <Zap className="w-4 h-4" />;
      case 'accuracy': return <Target className="w-4 h-4" />;
      case 'tactical': return <Brain className="w-4 h-4" />;
      case 'teamwork': return <Shield className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getStatColor = (value: number) => {
    if (value >= 80) return 'text-green-400';
    if (value >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getProgressColor = (value: number, type: 'fatigue' | 'morale') => {
    if (type === 'fatigue') {
      if (value > 80) return 'bg-red-500';
      if (value > 60) return 'bg-yellow-500';
      return 'bg-green-500';
    } else {
      if (value < 40) return 'bg-red-500';
      if (value < 70) return 'bg-yellow-500';
      return 'bg-green-500';
    }
  };

  if (pilotsLoading || teamsLoading) {
    return <div className="text-center p-8 text-gray-400">파일럿 데이터를 불러오는 중...</div>;
  }

  const team = teams[0] as TeamWithCredits;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-cyan-400">파일럿 스카우팅</h2>
            <p className="text-gray-400">팀 관리 및 파일럿 영입</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">팀 크레딧</div>
            <div className="text-2xl font-bold text-yellow-400">{team?.credits || 0}</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'roster', label: '현재 로스터', icon: Users },
          { id: 'training', label: '훈련 시설', icon: TrendingUp },
          { id: 'recruit', label: '신규 영입', icon: UserPlus }
        ].map((tab) => (
          <CyberButton
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'secondary'}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2"
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </CyberButton>
        ))}
      </div>

      {/* Roster Tab */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-sm"
              >
                <option value="rating">평점순</option>
                <option value="name">이름순</option>
                <option value="fatigue">피로도순</option>
                <option value="morale">사기순</option>
              </select>
            </div>
          </div>

          {/* Pilot Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(currentPilots as PilotWithTraining[]).map((pilot) => (
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
                  <div className="space-y-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {[
                        { name: '반응', value: pilot.reaction, icon: 'reaction' },
                        { name: '정확', value: pilot.accuracy, icon: 'accuracy' },
                        { name: '전술', value: pilot.tactical, icon: 'tactical' },
                        { name: '팀워크', value: pilot.teamwork, icon: 'teamwork' }
                      ].map((stat) => (
                        <div key={stat.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {getStatIcon(stat.icon)}
                            <span className="text-gray-300">{stat.name}</span>
                          </div>
                          <span className={`font-bold ${getStatColor(stat.value)}`}>{stat.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Status Bars */}
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>피로도</span>
                          <span>{pilot.fatigue}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getProgressColor(pilot.fatigue, 'fatigue')}`}
                            style={{ width: `${pilot.fatigue}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>사기</span>
                          <span>{pilot.morale}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getProgressColor(pilot.morale, 'morale')}`}
                            style={{ width: `${pilot.morale}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Training Status */}
                    {pilot.trainingUntil && (
                      <div className="bg-blue-900/30 p-2 rounded border border-blue-500/50">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-blue-400" />
                          <span className="text-blue-400">{pilot.trainingType} 훈련 중</span>
                        </div>
                        <div className="text-xs text-blue-300 mt-1">
                          {trainingCountdowns[pilot.id] ? formatTime(trainingCountdowns[pilot.id]) : '계산 중...'}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <CyberButton 
                            variant="secondary" 
                            className="flex-1 text-xs"
                            onClick={() => setSelectedPilot(pilot)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            상세
                          </CyberButton>
                        </DialogTrigger>
                        
                        {/* Pilot Details Modal Content */}
                        {selectedPilot && selectedPilot.id === pilot.id && (
                          <DialogContent className="max-w-4xl bg-gray-900 border-gray-700">
                            <DialogHeader>
                              <DialogTitle className="text-cyan-400 text-2xl flex items-center gap-3">
                                <TrendingUp className="w-6 h-6" />
                                {selectedPilot.name} - 상세 정보
                              </DialogTitle>
                            </DialogHeader>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                              {/* Basic Info */}
                              <div className="space-y-4">
                                <Card className="bg-gray-800 border-gray-700">
                                  <CardHeader>
                                    <CardTitle className="text-cyan-400">기본 정보</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <span className="text-gray-400">콜사인:</span>
                                        <div className="text-white">"{selectedPilot.callsign}"</div>
                                      </div>
                                      <div>
                                        <span className="text-gray-400">기숙사:</span>
                                        <div className="text-white">{selectedPilot.dormitory}</div>
                                      </div>
                                      <div>
                                        <span className="text-gray-400">전체 평점:</span>
                                        <div className="text-yellow-400 text-xl font-bold">{selectedPilot.rating}</div>
                                      </div>
                                      <div>
                                        <span className="text-gray-400">활성 상태:</span>
                                        <div className={selectedPilot.isActive ? 'text-green-400' : 'text-red-400'}>
                                          {selectedPilot.isActive ? '활성' : '비활성'}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2 mt-3">
                                      {selectedPilot.traits.map((trait) => (
                                        <Badge key={trait} variant="secondary" className="bg-gray-700 text-gray-300">
                                          {trait}
                                        </Badge>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>

                              {/* Detailed Stats */}
                              <div className="space-y-4">
                                <Card className="bg-gray-800 border-gray-700">
                                  <CardHeader>
                                    <CardTitle className="text-cyan-400">능력치 상세</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    {[
                                      { name: '반응속도', value: selectedPilot.reaction, icon: 'reaction' },
                                      { name: '정확도', value: selectedPilot.accuracy, icon: 'accuracy' },
                                      { name: '전술이해', value: selectedPilot.tactical, icon: 'tactical' },
                                      { name: '팀워크', value: selectedPilot.teamwork, icon: 'teamwork' }
                                    ].map((stat) => (
                                      <div key={stat.name} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                          <div className="flex items-center gap-2">
                                            {getStatIcon(stat.icon)}
                                            <span className="text-gray-300">{stat.name}</span>
                                          </div>
                                          <span className={`font-bold ${getStatColor(stat.value)}`}>{stat.value}</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                          <div 
                                            className={`h-2 rounded-full ${getStatColor(stat.value).includes('green') ? 'bg-green-500' : 
                                              getStatColor(stat.value).includes('yellow') ? 'bg-yellow-500' : 'bg-red-500'}`}
                                            style={{ width: `${stat.value}%` }}
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </CardContent>
                                </Card>

                                {/* Status & Condition */}
                                <Card className="bg-gray-800 border-gray-700">
                                  <CardHeader>
                                    <CardTitle className="text-cyan-400">현재 상태</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                      <div>
                                        <div className="flex justify-between items-center mb-2">
                                          <span className="text-gray-300">피로도</span>
                                          <span className={selectedPilot.fatigue > 70 ? 'text-red-400' : 'text-gray-300'}>
                                            {selectedPilot.fatigue}%
                                          </span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-3">
                                          <div 
                                            className={`h-3 rounded-full ${getProgressColor(selectedPilot.fatigue, 'fatigue')}`}
                                            style={{ width: `${selectedPilot.fatigue}%` }}
                                          />
                                        </div>
                                      </div>

                                      <div>
                                        <div className="flex justify-between items-center mb-2">
                                          <span className="text-gray-300">사기</span>
                                          <span className={selectedPilot.morale < 40 ? 'text-red-400' : 'text-gray-300'}>
                                            {selectedPilot.morale}%
                                          </span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-3">
                                          <div 
                                            className={`h-3 rounded-full ${getProgressColor(selectedPilot.morale, 'morale')}`}
                                            style={{ width: `${selectedPilot.morale}%` }}
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    {selectedPilot.trainingUntil && (
                                      <div className="bg-blue-900/30 p-3 rounded border border-blue-500/50">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Clock className="w-4 h-4 text-blue-400" />
                                          <span className="text-blue-400 font-semibold">
                                            {selectedPilot.trainingType} 훈련 진행 중
                                          </span>
                                        </div>
                                        <div className="text-xs text-blue-300">
                                          완료까지: {trainingCountdowns[selectedPilot.id] ? 
                                            formatTime(trainingCountdowns[selectedPilot.id]) : '계산 중...'}
                                        </div>
                                      </div>
                                    )}

                                    {/* Action Buttons in Modal */}
                                    <div className="flex gap-2 pt-4 border-t border-gray-700">
                                      {selectedPilot.fatigue > 50 && !selectedPilot.trainingUntil && (
                                        <CyberButton
                                          variant="secondary"
                                          onClick={() => {
                                            handleRest(selectedPilot.id);
                                            setSelectedPilot(null);
                                          }}
                                          disabled={restMutation.isPending}
                                          className="flex-1"
                                        >
                                          <Coffee className="w-4 h-4 mr-2" />
                                          휴식 명령
                                        </CyberButton>
                                      )}
                                      
                                      <CyberButton
                                        variant="danger"
                                        onClick={() => {
                                          handleDismiss(selectedPilot.id);
                                          setSelectedPilot(null);
                                        }}
                                        disabled={dismissMutation.isPending}
                                        className="flex-1"
                                      >
                                        <UserMinus className="w-4 h-4 mr-2" />
                                        파일럿 해고
                                      </CyberButton>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            </div>
                          </DialogContent>
                        )}
                      </Dialog>

                      {!pilot.trainingUntil && pilot.fatigue < 80 && (
                        <CyberButton
                          variant="secondary"
                          onClick={() => handleStartTraining(pilot.id, 'reaction')}
                          disabled={startTrainingMutation.isPending}
                          className="flex-1 text-xs"
                        >
                          <TrendingUp className="w-3 h-3 mr-1" />
                          훈련
                        </CyberButton>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Training Tab */}
      {activeTab === 'training' && (
        <div className="space-y-6">
          {/* Training Overview */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-cyan-400">훈련 센터</h3>
              <div className="flex gap-2">
                <div className="text-sm text-gray-400">
                  훈련 중인 파일럿: {(currentPilots as PilotWithTraining[]).filter(p => p.trainingUntil).length}명
                </div>
                <div className="text-sm text-gray-400">
                  훈련 가능: {(currentPilots as PilotWithTraining[]).filter(p => !p.trainingUntil && p.fatigue < 80).length}명
                </div>
              </div>
            </div>
            
            {/* Currently Training Pilots */}
            {(currentPilots as PilotWithTraining[]).filter(p => p.trainingUntil).length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-blue-400 mb-2">현재 훈련 중인 파일럿</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {(currentPilots as PilotWithTraining[])
                    .filter(p => p.trainingUntil)
                    .map(pilot => (
                      <div key={pilot.id} className="bg-blue-900/30 p-2 rounded border border-blue-500/50">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{pilot.name}</span>
                          <Clock className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="text-xs text-blue-300">
                          {pilot.trainingType} - {trainingCountdowns[pilot.id] ? formatTime(trainingCountdowns[pilot.id]) : '계산 중...'}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Training Facilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {['reaction', 'accuracy', 'tactical', 'teamwork'].map((trainingType) => {
              const availablePilots = (currentPilots as PilotWithTraining[])
                .filter((pilot) => !pilot.trainingUntil && pilot.fatigue < 80);
              const trainingCount = (currentPilots as PilotWithTraining[])
                .filter(p => p.trainingUntil && p.trainingType === trainingType).length;
              
              return (
                <Card key={trainingType} className="bg-gray-800 border-gray-700 hover:border-cyan-500 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-cyan-400">
                      {getStatIcon(trainingType)}
                      <div className="flex-1">
                        <div>
                          {trainingType === 'reaction' && '반응속도 훈련'}
                          {trainingType === 'accuracy' && '정확도 훈련'}
                          {trainingType === 'tactical' && '전술 훈련'}
                          {trainingType === 'teamwork' && '팀워크 훈련'}
                        </div>
                        <div className="text-xs text-gray-400 font-normal">
                          {trainingCount > 0 ? `${trainingCount}명 훈련 중` : '사용 가능'}
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-gray-300">
                        {trainingType === 'reaction' && '빠른 반응속도와 순발력을 기릅니다.'}
                        {trainingType === 'accuracy' && '정밀 사격과 명중률을 향상시킵니다.'}
                        {trainingType === 'tactical' && '전술적 판단력과 상황 분석 능력을 개발합니다.'}
                        {trainingType === 'teamwork' && '팀 협동과 의사소통 능력을 향상시킵니다.'}
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-semibold">훈련 가능한 파일럿 ({availablePilots.length}명):</div>
                          {availablePilots.length > 1 && (
                            <CyberButton
                              onClick={() => {
                                availablePilots.slice(0, 3).forEach(pilot => {
                                  handleStartTraining(pilot.id, trainingType);
                                });
                              }}
                              disabled={startTrainingMutation.isPending}
                              className="text-xs px-2 py-1"
                              variant="secondary"
                            >
                              <Users className="w-3 h-3 mr-1" />
                              일괄 훈련 (최대 3명)
                            </CyberButton>
                          )}
                        </div>
                        
                        <div className="max-h-52 overflow-y-auto space-y-1">
                          {availablePilots.map((pilot) => {
                            const currentStat = pilot[trainingType as keyof typeof pilot] as number;
                            const isOptimal = currentStat < 70;
                            
                            return (
                              <div key={pilot.id} className="flex items-center justify-between bg-gray-700 p-2 rounded hover:bg-gray-600 transition-colors">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm font-medium">{pilot.name}</div>
                                    {isOptimal && <Badge variant="secondary" className="text-xs bg-green-700 text-green-200">효과적</Badge>}
                                  </div>
                                  <div className="text-xs text-gray-400 grid grid-cols-2 gap-2">
                                    <span>피로도: {pilot.fatigue}%</span>
                                    <span>현재 {trainingType === 'reaction' ? '반응속도' : 
                                             trainingType === 'accuracy' ? '정확도' : 
                                             trainingType === 'tactical' ? '전술' : '팀워크'}: {currentStat}</span>
                                  </div>
                                </div>
                                <CyberButton
                                  onClick={() => handleStartTraining(pilot.id, trainingType)}
                                  disabled={startTrainingMutation.isPending}
                                  className="text-xs px-3 py-1"
                                >
                                  훈련 시작
                                </CyberButton>
                              </div>
                            );
                          })}
                          
                          {availablePilots.length === 0 && (
                            <div className="text-sm text-gray-500 italic p-2 text-center">
                              훈련 가능한 파일럿이 없습니다
                              <div className="text-xs text-gray-600 mt-1">
                                피로도 80% 이상이거나 이미 훈련 중인 파일럿은 제외됩니다
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        훈련 시간: 30초 | 비용: 무료 | 효과: +1~3 능력치
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
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
                    <div className="text-sm text-yellow-400 font-semibold">
                      영입 비용: {pilot.cost || 500} 크레딧
                    </div>
                    <CyberButton
                      onClick={() => handleRecruit(pilot.id)}
                      disabled={recruitMutation.isPending || (team?.credits || 0) < (pilot.cost || 500)}
                      className="text-xs"
                    >
                      <UserPlus className="w-3 h-3 mr-1" />
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