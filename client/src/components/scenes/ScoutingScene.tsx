import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CyberButton } from '@/components/ui/CyberButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { Clock, Zap, Target, Brain, Users, Star, Coins, Filter, SortAsc, Eye, UserMinus, Coffee, TrendingUp } from 'lucide-react';

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
  const [selectedPilot, setSelectedPilot] = useState<PilotWithTraining | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'experience' | 'fatigue'>('rating');
  const [filterBy, setFilterBy] = useState<'all' | 'Knight' | 'Arbiter' | 'River'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
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
      apiRequest('POST', `/api/pilots/${pilotId}/training`, { trainingType }),
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

  const handleRest = (pilotId: number) => {
    restMutation.mutate(pilotId);
  };

  const handleDismiss = (pilotId: number) => {
    if (confirm('정말로 이 파일럿을 해고하시겠습니까?')) {
      dismissMutation.mutate(pilotId);
    }
  };

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
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

  // Sorting and filtering logic
  const filteredAndSortedPilots = React.useMemo(() => {
    if (!currentPilots) return [];
    
    let filtered = (currentPilots as PilotWithTraining[]).filter(pilot => {
      if (filterBy === 'all') return true;
      return pilot.traits.includes(filterBy);
    });

    return filtered.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'rating':
          aValue = a.rating;
          bValue = b.rating;
          break;
        case 'experience':
          aValue = a.experience;
          bValue = b.experience;
          break;
        case 'fatigue':
          aValue = a.fatigue;
          bValue = b.fatigue;
          break;
        default:
          aValue = a.rating;
          bValue = b.rating;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
    });
  }, [currentPilots, sortBy, sortOrder, filterBy]);

  // Pagination logic
  const totalPilots = filteredAndSortedPilots.length;
  const totalPages = Math.ceil(totalPilots / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPilotsPage = filteredAndSortedPilots.slice(startIndex, endIndex);

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
          {/* Sorting and Filtering Controls */}
          <div className="flex flex-wrap gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-gray-300">필터:</span>
              <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="Knight">나이트</SelectItem>
                  <SelectItem value="Arbiter">아비터</SelectItem>
                  <SelectItem value="River">리버</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <SortAsc className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-gray-300">정렬:</span>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">평점</SelectItem>
                  <SelectItem value="name">이름</SelectItem>
                  <SelectItem value="experience">경험치</SelectItem>
                  <SelectItem value="fatigue">피로도</SelectItem>
                </SelectContent>
              </Select>
              
              <CyberButton
                variant="secondary"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-2 py-1"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </CyberButton>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>{totalPilots}명의 파일럿</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentPilotsPage.map((pilot) => (
              <Card key={pilot.id} className="bg-gray-800 border-gray-700 hover:border-cyan-500 transition-colors">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-cyan-400">{pilot.name}</CardTitle>
                      <p className="text-gray-400">"{pilot.callsign}"</p>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {pilot.dormitory}
                        </Badge>
                        {pilot.traits.slice(0, 2).map((trait) => (
                          <Badge key={trait} variant="secondary" className="text-xs">
                            {trait}
                          </Badge>
                        ))}
                      </div>
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
                        <span>반응:</span>
                        <span className={getStatColor(pilot.reaction)}>{pilot.reaction}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatIcon('accuracy')}
                        <span>정확:</span>
                        <span className={getStatColor(pilot.accuracy)}>{pilot.accuracy}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatIcon('tactical')}
                        <span>전술:</span>
                        <span className={getStatColor(pilot.tactical)}>{pilot.tactical}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatIcon('teamwork')}
                        <span>협동:</span>
                        <span className={getStatColor(pilot.teamwork)}>{pilot.teamwork}</span>
                      </div>
                    </div>

                    {/* Status Bars */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">피로도</span>
                        <span className={pilot.fatigue > 70 ? 'text-red-400' : 'text-gray-300'}>{pilot.fatigue}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getProgressColor(pilot.fatigue, 'fatigue')}`}
                          style={{ width: `${pilot.fatigue}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">사기</span>
                        <span className={pilot.morale < 40 ? 'text-red-400' : 'text-gray-300'}>{pilot.morale}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getProgressColor(pilot.morale, 'morale')}`}
                          style={{ width: `${pilot.morale}%` }}
                        />
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

                      {pilot.fatigue > 50 && !pilot.trainingUntil && (
                        <CyberButton
                          variant="secondary"
                          onClick={() => handleRest(pilot.id)}
                          disabled={restMutation.isPending}
                          className="text-xs"
                        >
                          <Coffee className="w-3 h-3 mr-1" />
                          휴식
                        </CyberButton>
                      )}

                      <CyberButton
                        variant="danger"
                        onClick={() => handleDismiss(pilot.id)}
                        disabled={dismissMutation.isPending}
                        className="text-xs px-2"
                      >
                        <UserMinus className="w-3 h-3" />
                      </CyberButton>
                    </div>
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