import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useGameStore } from "@/stores/gameStore";
import { useBattleStore } from "@/stores/battleStore";
import { wsManager } from "@/lib/websocket";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface Strategy {
  id: string;
  name: string;
  description: string;
  style: "공격형" | "방어형" | "균형형" | "분석형";
  advantages: string[];
  considerations: string[];
  formation: string;
}

const strategies: Strategy[] = [
  {
    id: "knight_standard",
    name: "나이트 표준 전술",
    description: "근-중거리에서 안정적인 화력과 방어를 바탕으로 전선을 유지하는 전술",
    style: "균형형",
    advantages: ["안정적인 전선 유지", "다양한 상황 대응", "위험 부담 최소화"],
    considerations: ["기습 공격에 취약", "장기전 불리"],
    formation: "삼각형 밀집 대형"
  },
  {
    id: "river_assault",
    name: "리버 돌격 전술", 
    description: "고속 기동력을 활용한 급습과 강력한 일격으로 적진을 와해시키는 전술",
    style: "공격형",
    advantages: ["초기 주도권 확보", "적 대형 붕괴", "단시간 결정력"],
    considerations: ["높은 위험성", "실패 시 큰 손실", "지구전 불리"],
    formation: "쐐기형 돌격 대형"
  },
  {
    id: "arbiter_precision",
    name: "아비터 정밀 전술",
    description: "장거리 정밀 사격과 전장 분석을 통한 전술적 우위 확보",
    style: "분석형", 
    advantages: ["전장 통제력", "안전 거리 확보", "정밀 타격"],
    considerations: ["근접전 취약", "기동성 부족", "엄폐물 의존"],
    formation: "횡진 전개 대형"
  },
  {
    id: "mixed_formation",
    name: "혼성 편대 전술",
    description: "각 기숙사의 장점을 조합한 다층 방어와 복합 공격 전술",
    style: "균형형",
    advantages: ["상성 보완", "유연한 대응", "예측 어려움"],
    considerations: ["조합 난이도 높음", "연계 실패 위험", "특화 부족"],
    formation: "계층형 복합 대형"
  },
  {
    id: "defensive_hold",
    name: "방어 거점 전술",
    description: "핵심 지점을 중심으로 한 방어적 운용과 반격 기회 포착",
    style: "방어형",
    advantages: ["안정적 방어", "반격 기회", "자원 절약"],
    considerations: ["주도권 상실", "소극적 운용", "시간 제약"],
    formation: "방사형 방어 대형"
  }
];

export default function MatchPrepScene() {
  const { setScene, pilots, mechs } = useGameStore();
  const { setBattle, setConnected } = useBattleStore();
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const { data: teams } = useQuery({
    queryKey: ['/api/teams'],
  });

  const activePilots = pilots.filter(p => p.isActive).slice(0, 3);
  const availableMechs = mechs.slice(0, 6);

  const handleStrategySelect = (strategy: Strategy) => {
    setSelectedStrategy(strategy);
  };

  const handleStartBattle = async () => {
    if (!selectedStrategy) {
      alert('전술을 선택해주세요.');
      return;
    }

    if (activePilots.length < 3) {
      alert('전투를 시작하려면 최소 3명의 활성 파일럿이 필요합니다.');
      return;
    }

    try {
      setIsStarting(true);

      // Create formation data based on selected strategy
      const playerFormation = {
        pilot1Id: activePilots[0].id,
        pilot2Id: activePilots[1].id,
        pilot3Id: activePilots[2].id,
        mech1Id: availableMechs[0]?.id || 1,
        mech2Id: availableMechs[1]?.id || 2,
        mech3Id: availableMechs[2]?.id || 3,
        strategy: selectedStrategy.id,
        formation: selectedStrategy.formation
      };

      const enemyFormation = {
        pilot1Id: 101,
        pilot2Id: 102, 
        pilot3Id: 103,
        mech1Id: availableMechs[3]?.id || 4,
        mech2Id: availableMechs[4]?.id || 5,
        mech3Id: availableMechs[5]?.id || 6,
        strategy: "enemy_adaptive",
        formation: "적응형 대형"
      };

      console.log('전술 설정 완료. 전투 시작:', { selectedStrategy: selectedStrategy.name, playerFormation, enemyFormation });

      // Set up battle start listener
      const handleBattleStarted = (data: any) => {
        console.log('전투 개시 확인. 배틀 씬으로 전환');
        setBattle(data.state);
        setConnected(true);
        setScene('battle');
        wsManager.off('BATTLE_STARTED', handleBattleStarted);
      };

      wsManager.on('BATTLE_STARTED', handleBattleStarted);

      // Start battle with strategy
      wsManager.startBattle(playerFormation, enemyFormation);

    } catch (error) {
      console.error('전술 설정 중 오류:', error);
      alert('전술 설정 중 오류가 발생했습니다.');
    } finally {
      setIsStarting(false);
    }
  };

  const getStyleColor = (style: Strategy['style']) => {
    switch (style) {
      case "공격형": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "방어형": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "균형형": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "분석형": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">경기 준비</h1>
            <p className="text-slate-400 mt-1">전술을 선택하고 편대를 준비하세요</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setScene('banpick')}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            이전 단계
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        {/* Strategy Selection */}
        <div className="flex-1 flex flex-col">
          <h2 className="text-xl font-semibold text-white mb-4">전술 선택</h2>
          <div className="flex-1 space-y-4 overflow-y-auto">
            {strategies.map((strategy) => (
              <Card 
                key={strategy.id}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedStrategy?.id === strategy.id 
                    ? 'ring-2 ring-cyan-500 bg-slate-800/80' 
                    : 'bg-slate-800/40 hover:bg-slate-800/60'
                }`}
                onClick={() => handleStrategySelect(strategy)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-lg">{strategy.name}</CardTitle>
                    <Badge className={getStyleColor(strategy.style)}>
                      {strategy.style}
                    </Badge>
                  </div>
                  <CardDescription className="text-slate-300">
                    {strategy.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-slate-300 mb-2">대형: {strategy.formation}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-400 mb-1">장점</p>
                      <ul className="text-sm text-slate-400 space-y-1">
                        {strategy.advantages.map((advantage, idx) => (
                          <li key={idx}>• {advantage}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-orange-400 mb-1">고려사항</p>
                      <ul className="text-sm text-slate-400 space-y-1">
                        {strategy.considerations.map((consideration, idx) => (
                          <li key={idx}>• {consideration}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Mission Brief & Team Status */}
        <div className="w-80 flex flex-col space-y-6">
          {/* Selected Strategy */}
          {selectedStrategy && (
            <Card className="bg-slate-800/60">
              <CardHeader>
                <CardTitle className="text-white text-lg">선택된 전술</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">{selectedStrategy.name}</span>
                    <Badge className={getStyleColor(selectedStrategy.style)}>
                      {selectedStrategy.style}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400">{selectedStrategy.formation}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Team Roster */}
          <Card className="bg-slate-800/60">
            <CardHeader>
              <CardTitle className="text-white text-lg">출격 편대</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activePilots.map((pilot, idx) => (
                  <div key={pilot.id} className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
                    <div>
                      <p className="text-white font-medium">{pilot.name}</p>
                      <p className="text-slate-400 text-sm">{pilot.callsign}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-300 text-sm">레이팅 {pilot.rating}</p>
                      <div className="flex gap-1 mt-1">
                        {pilot.traits.slice(0, 2).map(trait => (
                          <Badge key={trait} variant="secondary" className="text-xs">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {activePilots.length < 3 && (
                  <p className="text-orange-400 text-sm">
                    ※ 출격 가능한 파일럿이 부족합니다
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Mission Info */}
          <Card className="bg-slate-800/60">
            <CardHeader>
              <CardTitle className="text-white text-lg">미션 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">전투 유형</span>
                  <span className="text-white">3대3 시뮬레이션</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">예상 시간</span>
                  <span className="text-white">2-4분</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">승리 조건</span>
                  <span className="text-white">적 전멸 또는 점수 우위</span>
                </div>
                <Separator className="my-3 bg-slate-600" />
                <div className="space-y-1">
                  <p className="text-slate-400">오퍼레이터 임무</p>
                  <p className="text-white text-xs">
                    전투 관찰 및 통신 로그 분석을 통해 전술 효과성을 평가하고 
                    향후 개선점을 도출하세요.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Start Button */}
          <Button 
            onClick={handleStartBattle}
            disabled={!selectedStrategy || activePilots.length < 3 || isStarting}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3"
          >
            {isStarting ? "전투 준비 중..." : "전투 시작"}
          </Button>
        </div>
      </div>
    </div>
  );
}