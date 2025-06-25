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
  RotateCcw,
  Zap,
  Target,
  Brain,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DialogDescription } from '@radix-ui/react-dialog';
import { Badge } from '@/components/ui/badge';
import { CyberButton } from '@/components/ui/CyberButton';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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

  // Bulk training modal state
  const [bulkTraining, setBulkTraining] = useState<{ open: boolean; type: string | null; selected: number[] }>({
    open: false,
    type: null,
    selected: []
  });

  // Training selection modal state
  const [trainingSelection, setTrainingSelection] = useState<{ open: boolean; pilot: PilotWithTraining | null }>({
    open: false,
    pilot: null
  });

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

  const { toast } = useToast();

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

  // Pagination & page size
  const pageSize = 6;
  const [rosterPage, setRosterPage] = useState(1);
  const [recruitPage, setRecruitPage] = useState(1);

  // Auto refresh timer for recruitable list
  const AUTO_REFRESH_INTERVAL = 60; // seconds

  // Helper to compute seconds remaining until next automatic refresh
  const getRemainingSeconds = () => {
    const state = queryClient.getQueryState(['/api/pilots/recruitable']);
    const lastUpdated = state?.dataUpdatedAt ?? Date.now();
    const elapsed = Math.floor((Date.now() - lastUpdated) / 1000);
    const remaining = AUTO_REFRESH_INTERVAL - elapsed;
    return remaining > 0 ? remaining : 0;
  };

  // Countdown state persists across scene mounts
  const [refreshCountdown, setRefreshCountdown] = useState<number>(getRemainingSeconds());

  // Effect: countdown ticking every second while on recruit tab
  useEffect(() => {
    if (activeTab !== 'recruit') return;

    const interval = setInterval(() => {
      setRefreshCountdown((prev: number) => {
        if (prev <= 1) {
          queryClient.invalidateQueries({ queryKey: ['/api/pilots/recruitable'] });
          return AUTO_REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTab]);

  // Recalculate countdown whenever list refetched or manual reroll
  useEffect(() => {
    setRefreshCountdown(getRemainingSeconds());
  }, [recruitablePilots]);

  // Manual reroll mutation (cost credits)
  const REROLL_COST = 1000;
  const rerollMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/pilots/recruitable/reroll'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pilots/recruitable'] });
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      setRefreshCountdown(AUTO_REFRESH_INTERVAL);
      toast({ title: '리롤 완료', description: '새로운 영입 후보가 등록되었습니다!' });
    },
    onError: () => {
      toast({ title: '리롤 실패', description: '크레딧 부족 또는 서버 오류', variant: 'destructive' });
    },
  });

  // Reset roster page when filters change
  useEffect(() => {
    setRosterPage(1);
  }, [sortBy, filterBy]);

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

  const getTrainingInfo = (type: string) => {
    switch (type) {
      case 'reaction':
        return {
          name: '반응속도 훈련',
          description: '빠른 반응속도와 순발력을 기릅니다.',
          icon: 'reaction',
          color: 'from-yellow-400 to-orange-500',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      case 'accuracy':
        return {
          name: '정확도 훈련',
          description: '정밀 사격과 명중률을 향상시킵니다.',
          icon: 'accuracy',
          color: 'from-red-400 to-pink-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'tactical':
        return {
          name: '전술 훈련',
          description: '전술적 판단력과 상황 분석 능력을 개발합니다.',
          icon: 'tactical',
          color: 'from-purple-400 to-indigo-500',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200'
        };
      case 'teamwork':
        return {
          name: '팀워크 훈련',
          description: '팀 협동과 의사소통 능력을 향상시킵니다.',
          icon: 'teamwork',
          color: 'from-green-400 to-emerald-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      default:
        return null;
    }
  };

  const getStatRecommendation = (pilot: PilotWithTraining, statType: string) => {
    const currentValue = pilot[statType as keyof PilotWithTraining] as number;
    if (currentValue < 60) return { level: 'high', text: '매우 효과적', color: 'text-emerald-600' };
    if (currentValue < 75) return { level: 'medium', text: '효과적', color: 'text-amber-600' };
    return { level: 'low', text: '소폭 향상', color: 'text-slate-600' };
  };

  // Derived roster & recruit lists (sorting, filtering, pagination)
  const rosterPilots = (currentPilots as PilotWithTraining[]);

  const sortedRoster = [...rosterPilots].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'fatigue':
        return b.fatigue - a.fatigue;
      case 'morale':
        return b.morale - a.morale;
      default: // rating
        return b.rating - a.rating;
    }
  });

  const filteredRoster = sortedRoster.filter((pilot) => {
    if (filterBy === 'training') return !!pilot.trainingUntil;
    if (filterBy === 'available') return !pilot.trainingUntil && pilot.fatigue < 80;
    return true;
  });

  const totalRosterPages = Math.max(1, Math.ceil(filteredRoster.length / pageSize));
  const paginatedRoster = filteredRoster.slice((rosterPage - 1) * pageSize, rosterPage * pageSize);

  const recruitList = Array.isArray(recruitablePilots) ? [...(recruitablePilots as any[])] : [];
  const totalRecruitPages = Math.max(1, Math.ceil(recruitList.length / pageSize));
  const paginatedRecruit = recruitList.slice((recruitPage - 1) * pageSize, recruitPage * pageSize);

  if (pilotsLoading || teamsLoading) {
    return <div className="text-center p-8 text-slate-600">파일럿 데이터를 불러오는 중...</div>;
  }

  const team = teams[0] as TeamWithCredits;

  return (
    <div className="scene-transition p-8">
      <div className="space-y-8">
      {/* Scene Header */}
      <div className="relative bg-gradient-to-r from-teal-500/10 via-cyan-500/5 to-blue-500/10 backdrop-blur-lg border border-teal-200/30 rounded-2xl p-6 shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-100/20 to-cyan-100/10 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                <i className="fas fa-search text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-3xl font-orbitron font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  스쿼드
                </h1>
                <div className="flex items-center space-x-2 text-teal-600/80 text-sm font-medium">
                  <i className="fas fa-users-cog text-xs"></i>
                  <span>팀 관리 및 파일럿 영입</span>
                </div>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm border border-teal-200 rounded-xl p-3 shadow-md">
              <div className="text-sm text-slate-600">팀 크레딧</div>
              <div className="text-2xl font-bold text-emerald-600">{team?.credits || 0}</div>
            </div>
          </div>
          <div className="flex space-x-2">
            <div className="px-3 py-1 bg-teal-100/50 text-teal-700 rounded-full text-xs font-medium border border-teal-200/50">
              <i className="fas fa-search mr-1"></i>
              스카우팅 시스템
            </div>
            <div className="px-3 py-1 bg-emerald-100/50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200/50">
              <i className="fas fa-check-circle mr-1"></i>
              TRINITAS 연결됨
            </div>
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
          <div className="space-y-6">
          {/* Sticky controls bar */}
          <div className="flex flex-wrap gap-4 items-center sticky top-0 z-10 bg-white/90 backdrop-blur-md border border-sky-200/40 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-600" />
              {/* Sort */}
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-sky-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
              >
                <option value="rating">평점순</option>
                <option value="name">이름순</option>
                <option value="fatigue">피로도순</option>
                <option value="morale">사기순</option>
              </select>
            </div>
            {/* Filter */}
            <div className="flex items-center gap-2">
              <span className="text-slate-600 text-sm">필터:</span>
              <select 
                value={filterBy} 
                onChange={(e) => setFilterBy(e.target.value)}
                className="bg-white border border-sky-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
              >
                <option value="all">전체</option>
                <option value="training">훈련 중</option>
                <option value="available">훈련 가능</option>
              </select>
            </div>
          </div>

          {/* Pilot Grid */}
          {filteredRoster.length === 0 ? (
            <div className="text-center text-slate-600 py-12 w-full">현재 로스터가 비어 있습니다</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedRoster.map((pilot) => (
                  <Card key={pilot.id} className="bg-white/80 backdrop-blur-lg border border-sky-200/50 shadow-md hover:shadow-lg transition-all">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-sky-600">{pilot.name}</CardTitle>
                          <p className="text-slate-600">"{pilot.callsign}"</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-amber-600">{pilot.rating}</div>
                          <div className="text-xs text-slate-600">평점</div>
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
                                <span className="text-slate-700">{stat.name}</span>
                              </div>
                              <span className={`font-bold ${
                                stat.value >= 80 ? 'text-emerald-600' :
                                stat.value >= 60 ? 'text-amber-600' : 'text-rose-600'
                              }`}>{stat.value}</span>
                            </div>
                          ))}
                        </div>

                        {/* Status Bars */}
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-600">피로도</span>
                              <span className="text-slate-700">{pilot.fatigue}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${getProgressColor(pilot.fatigue, 'fatigue')}`}
                                style={{ width: `${pilot.fatigue}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-600">사기</span>
                              <span className="text-slate-700">{pilot.morale}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${getProgressColor(pilot.morale, 'morale')}`}
                                style={{ width: `${pilot.morale}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Training Status */}
                        {pilot.trainingUntil && (
                          <div className="bg-sky-50 border border-sky-200 p-3 rounded-lg">
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-sky-600" />
                              <span className="text-sky-700 font-medium">{pilot.trainingType} 훈련 중</span>
                            </div>
                            <div className="text-xs text-sky-600 mt-1">
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
                              <DialogContent className="max-w-4xl bg-white border border-sky-200 shadow-xl">
                                <DialogHeader>
                                  <DialogTitle className="text-sky-600 text-2xl flex items-center gap-3">
                                    <TrendingUp className="w-6 h-6" />
                                    {selectedPilot.name} - 상세 정보
                                  </DialogTitle>
                                </DialogHeader>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                                  {/* Basic Info */}
                                  <div className="space-y-4">
                                    <Card className="bg-sky-50 border border-sky-200">
                                      <CardHeader>
                                        <CardTitle className="text-sky-600">기본 정보</CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-3">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                          <div>
                                            <span className="text-slate-600">콜사인:</span>
                                            <div className="text-slate-800 font-medium">"{selectedPilot.callsign}"</div>
                                          </div>
                                          <div>
                                            <span className="text-slate-600">기숙사:</span>
                                            <div className="text-slate-800 font-medium">{selectedPilot.dormitory}</div>
                                          </div>
                                          <div>
                                            <span className="text-slate-600">전체 평점:</span>
                                            <div className="text-amber-600 text-xl font-bold">{selectedPilot.rating}</div>
                                          </div>
                                          <div>
                                            <span className="text-slate-600">활성 상태:</span>
                                            <div className={selectedPilot.isActive ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>
                                              {selectedPilot.isActive ? '활성' : '비활성'}
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-2 mt-3">
                                          {selectedPilot.traits.map((trait) => (
                                            <Badge key={trait} variant="secondary" className="bg-slate-100 text-slate-700 border border-slate-300">
                                              {trait}
                                            </Badge>
                                          ))}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>

                                  {/* Detailed Stats */}
                                  <div className="space-y-4">
                                    <Card className="bg-sky-50 border border-sky-200">
                                      <CardHeader>
                                        <CardTitle className="text-sky-600">능력치 상세</CardTitle>
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
                                                <span className="text-slate-700 font-medium">{stat.name}</span>
                                              </div>
                                              <span className={`font-bold ${
                                                stat.value >= 80 ? 'text-emerald-600' :
                                                stat.value >= 60 ? 'text-amber-600' : 'text-rose-600'
                                              }`}>{stat.value}</span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-2">
                                              <div 
                                                className={`h-2 rounded-full ${
                                                  stat.value >= 80 ? 'bg-emerald-500' :
                                                  stat.value >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                                                }`}
                                                style={{ width: `${stat.value}%` }}
                                              />
                                            </div>
                                          </div>
                                        ))}
                                      </CardContent>
                                    </Card>

                                    {/* Status & Condition */}
                                    <Card className="bg-sky-50 border border-sky-200">
                                      <CardHeader>
                                        <CardTitle className="text-sky-600">현재 상태</CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-4">
                                        <div className="space-y-3">
                                          <div>
                                            <div className="flex justify-between items-center mb-2">
                                              <span className="text-slate-700 font-medium">피로도</span>
                                              <span className={selectedPilot.fatigue > 70 ? 'text-rose-600 font-semibold' : 'text-slate-700'}>
                                                {selectedPilot.fatigue}%
                                              </span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-3">
                                              <div 
                                                className={`h-3 rounded-full ${getProgressColor(selectedPilot.fatigue, 'fatigue')}`}
                                                style={{ width: `${selectedPilot.fatigue}%` }}
                                              />
                                            </div>
                                          </div>

                                          <div>
                                            <div className="flex justify-between items-center mb-2">
                                              <span className="text-slate-700 font-medium">사기</span>
                                              <span className={selectedPilot.morale < 40 ? 'text-rose-600 font-semibold' : 'text-slate-700'}>
                                                {selectedPilot.morale}%
                                              </span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-3">
                                              <div 
                                                className={`h-3 rounded-full ${getProgressColor(selectedPilot.morale, 'morale')}`}
                                                style={{ width: `${selectedPilot.morale}%` }}
                                              />
                                            </div>
                                          </div>
                                        </div>

                                        {selectedPilot.trainingUntil && (
                                          <div className="bg-sky-100 border border-sky-300 p-3 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                              <Clock className="w-4 h-4 text-sky-600" />
                                              <span className="text-sky-700 font-semibold">
                                                {selectedPilot.trainingType} 훈련 진행 중
                                              </span>
                                            </div>
                                            <div className="text-xs text-sky-600">
                                              완료까지: {trainingCountdowns[selectedPilot.id] ? 
                                                formatTime(trainingCountdowns[selectedPilot.id]) : '계산 중...'}
                                            </div>
                                          </div>
                                        )}

                                        {/* Action Buttons in Modal */}
                                        <div className="flex gap-2 pt-4 border-t border-sky-200">
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
                              onClick={() => setTrainingSelection({ open: true, pilot })}
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
              {/* Pagination */}
              {totalRosterPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <CyberButton variant="secondary" disabled={rosterPage === 1} onClick={() => setRosterPage(rosterPage - 1)}>
                    이전
                  </CyberButton>
                  <div className="text-sm text-slate-600 flex items-center">{rosterPage} / {totalRosterPages}</div>
                  <CyberButton variant="secondary" disabled={rosterPage === totalRosterPages} onClick={() => setRosterPage(rosterPage + 1)}>
                    다음
                  </CyberButton>
                </div>
              )}
            </>
          )}
        </div>
      )}

        {/* Training Tab */}
        {activeTab === 'training' && (
          <div className="space-y-6">
          {/* Training Overview */}
          <div className="bg-white/80 backdrop-blur-lg border border-sky-200/50 rounded-xl p-4 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-sky-600">훈련 센터</h3>
              <div className="flex gap-4">
                <div className="text-sm text-slate-600">
                  훈련 중인 파일럿: <span className="font-semibold text-sky-600">{(currentPilots as PilotWithTraining[]).filter(p => p.trainingUntil).length}명</span>
                </div>
                <div className="text-sm text-slate-600">
                  훈련 가능: <span className="font-semibold text-emerald-600">{(currentPilots as PilotWithTraining[]).filter(p => !p.trainingUntil && p.fatigue < 80).length}명</span>
                </div>
              </div>
            </div>
            
            {/* Currently Training Pilots */}
            {(currentPilots as PilotWithTraining[]).filter(p => p.trainingUntil).length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-sky-600 mb-2">현재 훈련 중인 파일럿</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {(currentPilots as PilotWithTraining[])
                    .filter(p => p.trainingUntil)
                    .map(pilot => (
                      <div key={pilot.id} className="bg-sky-50 border border-sky-200 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-800">{pilot.name}</span>
                          <Clock className="w-4 h-4 text-sky-600" />
                        </div>
                        <div className="text-xs text-sky-600">
                          {pilot.trainingType} - {trainingCountdowns[pilot.id] ? formatTime(trainingCountdowns[pilot.id]) : '계산 중...'}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Training Facilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {['reaction', 'accuracy', 'tactical', 'teamwork'].map((trainingType) => {
              const availablePilots = (currentPilots as PilotWithTraining[])
                .filter((pilot) => !pilot.trainingUntil && pilot.fatigue < 80);
              const trainingCount = (currentPilots as PilotWithTraining[])
                .filter(p => p.trainingUntil && p.trainingType === trainingType).length;
              const collapsible = availablePilots.length > 3;
              
              return (
                <Card key={trainingType} className="bg-white/80 backdrop-blur-lg border border-sky-200/50 shadow-md hover:shadow-lg hover:border-sky-300 transition-all">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sky-600">
                      {getStatIcon(trainingType)}
                      <div className="flex-1">
                        <div>
                          {trainingType === 'reaction' && '반응속도 훈련'}
                          {trainingType === 'accuracy' && '정확도 훈련'}
                          {trainingType === 'tactical' && '전술 훈련'}
                          {trainingType === 'teamwork' && '팀워크 훈련'}
                        </div>
                        <div className="text-xs text-slate-600 font-normal">
                          {trainingCount > 0 ? `${trainingCount}명 훈련 중` : '사용 가능'}
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-slate-700">
                        {trainingType === 'reaction' && '빠른 반응속도와 순발력을 기릅니다.'}
                        {trainingType === 'accuracy' && '정밀 사격과 명중률을 향상시킵니다.'}
                        {trainingType === 'tactical' && '전술적 판단력과 상황 분석 능력을 개발합니다.'}
                        {trainingType === 'teamwork' && '팀 협동과 의사소통 능력을 향상시킵니다.'}
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-semibold text-slate-800">훈련 가능한 파일럿 ({availablePilots.length}명):</div>
                          {availablePilots.length >= 1 && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <CyberButton
                                  variant="secondary"
                                  className="text-xs px-2 py-1"
                                  onClick={() => setBulkTraining({ open: true, type: trainingType, selected: [] })}
                                >
                                  <Users className="w-3 h-3 mr-1" />
                                  일괄 훈련 (최대 3명)
                                </CyberButton>
                              </DialogTrigger>
                            </Dialog>
                          )}
                        </div>
                        
                        <details className="max-h-52 overflow-y-auto space-y-1" open={!collapsible}>
                          {collapsible && (
                            <summary className="cursor-pointer text-sky-600 text-xs mb-2 select-none">
                              훈련 가능한 파일럿 목록 ({availablePilots.length}명)
                            </summary>
                          )}
                          {availablePilots.map((pilot) => {
                            const currentStat = pilot[trainingType as keyof typeof pilot] as number;
                            const isOptimal = currentStat < 70;
                            
                            return (
                              <div key={pilot.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 p-2 rounded-lg hover:bg-sky-50 hover:border-sky-300 transition-colors">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm font-medium text-slate-800">{pilot.name}</div>
                                    {isOptimal && <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-300">효과적</Badge>}
                                  </div>
                                  <div className="text-xs text-slate-600 grid grid-cols-2 gap-2">
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
                            <div className="text-sm text-slate-600 italic p-3 text-center bg-slate-50 border border-slate-200 rounded-lg">
                              훈련 가능한 파일럿이 없습니다
                              <div className="text-xs text-slate-500 mt-1">
                                피로도 80% 이상이거나 이미 훈련 중인 파일럿은 제외됩니다
                              </div>
                            </div>
                          )}
                        </details>
                      </div>
                      
                      <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
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
          <>
          {/* Controls bar above recruit list */}
          <div className="flex justify-between items-center mb-3">
            <div className="text-sm text-slate-600">
              자동 갱신: <span className="font-semibold text-sky-600">{refreshCountdown}s</span>
            </div>
            <CyberButton
              variant="secondary"
              disabled={rerollMutation.isPending || (team?.credits || 0) < REROLL_COST}
              onClick={() => rerollMutation.mutate()}
              className="flex items-center gap-2 text-xs"
            >
              {rerollMutation.isPending ? (
                <RotateCcw className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              리롤 (-{REROLL_COST} 크레딧)
            </CyberButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedRecruit.length === 0 ? (
            <div className="text-center text-slate-600 py-12 w-full">영입 가능한 파일럿이 없습니다</div>
          ) : (
            <>
              {paginatedRecruit.map((pilot: any) => (
                <Card key={pilot.id} className="bg-white/80 backdrop-blur-lg border border-sky-200/50 shadow-md hover:shadow-lg transition-all">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-sky-600">{pilot.name}</CardTitle>
                        <p className="text-slate-600">"{pilot.callsign}"</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-amber-600">{pilot.rating}</div>
                        <div className="text-xs text-slate-600">평점</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm text-slate-700">{pilot.background}</div>
                      
                      <div className="flex flex-wrap gap-1">
                        {pilot.traits?.map((trait: string) => (
                          <Badge key={trait} variant="secondary" className="text-xs bg-slate-100 text-slate-700 border border-slate-300">
                            {trait}
                          </Badge>
                        ))}
                      </div>

                      <div className="bg-sky-50 border border-sky-200 p-3 rounded-lg">
                        <div className="text-sm font-semibold text-sky-600 mb-1">특수 능력</div>
                        <div className="text-xs text-slate-700">{pilot.specialAbility}</div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-emerald-600 font-semibold">
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
              {/* Pagination */}
              {totalRecruitPages > 1 && (
                <div className="flex justify-center gap-2 mt-6 col-span-full">
                  <CyberButton variant="secondary" disabled={recruitPage === 1} onClick={() => setRecruitPage(recruitPage - 1)}>
                    이전
                  </CyberButton>
                  <div className="text-sm text-slate-600 flex items-center">{recruitPage} / {totalRecruitPages}</div>
                  <CyberButton variant="secondary" disabled={recruitPage === totalRecruitPages} onClick={() => setRecruitPage(recruitPage + 1)}>
                    다음
                  </CyberButton>
                </div>
              )}
            </>
          )}
        </div>
        </>
      )}

      {/* Training Selection Modal */}
      {trainingSelection.open && trainingSelection.pilot && (
        <Dialog open={trainingSelection.open} onOpenChange={(open) => !open && setTrainingSelection({ open: false, pilot: null })}>
          <DialogContent className="max-w-2xl bg-white border border-sky-200 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-sky-600 text-xl flex items-center gap-3">
                <TrendingUp className="w-6 h-6" />
                {trainingSelection.pilot.name} - 훈련 선택
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                향상시킬 능력치를 선택하세요. 훈련 시간: 30초 | 비용: 무료
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4">
              {/* Current Pilot Stats Overview */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">현재 능력치</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { name: '반응속도', value: trainingSelection.pilot.reaction, type: 'reaction' },
                    { name: '정확도', value: trainingSelection.pilot.accuracy, type: 'accuracy' },
                    { name: '전술이해', value: trainingSelection.pilot.tactical, type: 'tactical' },
                    { name: '팀워크', value: trainingSelection.pilot.teamwork, type: 'teamwork' }
                  ].map((stat) => (
                    <div key={stat.type} className="text-center">
                      <div className="flex justify-center mb-1">
                        {getStatIcon(stat.type)}
                      </div>
                      <div className="text-xs text-slate-600 mb-1">{stat.name}</div>
                      <div className={`text-lg font-bold ${getStatColor(stat.value)}`}>
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Training Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['reaction', 'accuracy', 'tactical', 'teamwork'].map((trainingType) => {
                  const trainingInfo = getTrainingInfo(trainingType);
                  if (!trainingInfo) return null;
                  
                  const currentStat = trainingSelection.pilot![trainingType as keyof PilotWithTraining] as number;
                  const recommendation = getStatRecommendation(trainingSelection.pilot!, trainingType);
                  
                  return (
                    <div 
                      key={trainingType}
                      className={`${trainingInfo.bgColor} ${trainingInfo.borderColor} border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group hover:scale-[1.02]`}
                      onClick={() => {
                        handleStartTraining(trainingSelection.pilot!.id, trainingType);
                        setTrainingSelection({ open: false, pilot: null });
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getStatIcon(trainingType)}
                          <span className="font-semibold text-slate-800">
                            {trainingInfo.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-slate-700">
                            {currentStat}
                          </div>
                          <div className={`text-xs font-medium ${recommendation.color}`}>
                            {recommendation.text}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-slate-600 mb-3">
                        {trainingInfo.description}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          <span className="text-xs text-slate-600">
                            예상 향상: +{recommendation.level === 'high' ? '2~3' : recommendation.level === 'medium' ? '1~2' : '1'}
                          </span>
                        </div>
                        <div className="group-hover:translate-x-1 transition-transform">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${trainingInfo.color} flex items-center justify-center`}>
                            <TrendingUp className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-200">
                <CyberButton
                  variant="secondary"
                  onClick={() => setTrainingSelection({ open: false, pilot: null })}
                >
                  취소
                </CyberButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Bulk Training Modal */}
      {bulkTraining.open && (
        <Dialog open={bulkTraining.open} onOpenChange={(open) => !open && setBulkTraining({ open: false, type: null, selected: [] })}>
          <DialogContent className="max-w-lg bg-white border border-sky-200 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-sky-600 text-xl flex items-center gap-2">
                <Users className="w-5 h-5" />
                일괄 훈련 선택 (최대 3명)
              </DialogTitle>
              <DialogDescription className="text-slate-600 text-sm">
                훈련 유형: {bulkTraining.type === 'reaction' ? '반응속도' : bulkTraining.type === 'accuracy' ? '정확도' : bulkTraining.type === 'tactical' ? '전술' : '팀워크'}
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-80 overflow-y-auto space-y-2 mt-3">
              {(currentPilots as PilotWithTraining[])
                .filter(p => !p.trainingUntil && p.fatigue < 80)
                .map(pilot => {
                  const checked = bulkTraining.selected.includes(pilot.id);
                  return (
                    <label key={pilot.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 p-2 rounded-lg cursor-pointer hover:bg-sky-50">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const arr = bulkTraining.selected;
                            const newArr = checked ? arr.filter(id => id !== pilot.id) : [...arr, pilot.id].slice(0,3);
                            setBulkTraining({ ...bulkTraining, selected: newArr });
                          }}
                          className="h-4 w-4 text-sky-600 border-slate-300 rounded"
                        />
                        <span className="text-sm text-slate-800">{pilot.name}</span>
                      </div>
                      <span className="text-xs text-slate-600">피로도 {pilot.fatigue}%</span>
                    </label>
                  );
                })}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <CyberButton
                variant="secondary"
                onClick={() => setBulkTraining({ open: false, type: null, selected: [] })}
              >
                취소
              </CyberButton>
              <CyberButton
                onClick={() => {
                  bulkTraining.selected.forEach(id => handleStartTraining(id, bulkTraining.type!));
                  setBulkTraining({ open: false, type: null, selected: [] });
                }}
                disabled={bulkTraining.selected.length === 0 || startTrainingMutation.isPending}
              >
                훈련 시작 ({bulkTraining.selected.length})
              </CyberButton>
            </div>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </div>
  );
}