import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useQuery } from '@tanstack/react-query';
import { CyberButton } from '@/components/ui/CyberButton';
import type { ReconData, Team } from '@shared/schema';

export function ReconScene() {
  const { setScene, enemyTeams } = useGameStore();
  const [selectedEnemyTeam, setSelectedEnemyTeam] = useState<number | null>(null);
  const [reconData, setReconData] = useState<ReconData | null>(null);

  const availableTeams = enemyTeams.filter(team => team.name !== 'Trinity Squad');

  const { data: fetchedReconData, isLoading } = useQuery({
    queryKey: ['/api/recon', selectedEnemyTeam],
    enabled: !!selectedEnemyTeam,
  });

  useEffect(() => {
    if (fetchedReconData && typeof fetchedReconData === 'object') {
      setReconData(fetchedReconData as ReconData);
    }
  }, [fetchedReconData]);

  if (isLoading) {
    return (
      <div className="scene-transition">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">적팀 데이터 분석 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="scene-transition">
      <div className="mb-6">
        <h2 className="text-2xl font-orbitron font-bold text-green-400 mb-2">정찰 작전</h2>
        <p className="text-gray-400">적팀 정보 수집 및 전략적 분석</p>
      </div>

      {/* Team Selection */}
      <div className="mb-6">
        <h3 className="text-pink-400 font-semibold mb-3">대상 팀 선택</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {availableTeams.map((team) => (
            <button
              key={team.id}
              onClick={() => setSelectedEnemyTeam(team.id)}
              className={`p-3 cyber-border text-left transition-colors ${
                selectedEnemyTeam === team.id
                  ? 'bg-blue-900 border-blue-400'
                  : 'bg-slate-800 hover:bg-blue-900/30 border-gray-600'
              }`}
            >
              <div className="font-semibold text-white">{team.name}</div>
              <div className="text-xs text-gray-400">{team.wins}승 {team.losses}패</div>
            </button>
          ))}
        </div>
      </div>

      {/* Intelligence Report */}
      {reconData && (
        <div className="content-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Basic Intel */}
            <div className="cyber-border p-4 bg-slate-800">
              <h3 className="text-pink-400 font-semibold mb-3">기본 정보</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">팀명:</span>
                  <span className="text-white">{reconData.teamName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">최근 승수:</span>
                  <span className="text-green-400">{reconData.recentWins}승</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">최근 패수:</span>
                  <span className="text-red-400">{reconData.recentLosses}패</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">승률:</span>
                  <span className="text-yellow-400">
                    {Math.round((reconData.recentWins / (reconData.recentWins + reconData.recentLosses)) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Preferred Composition */}
            <div className="cyber-border p-4 bg-slate-800">
              <h3 className="text-pink-400 font-semibold mb-3">선호 조합</h3>
              <div className="space-y-2">
                {reconData.preferredComposition.map((comp, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">{comp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weaknesses */}
            <div className="cyber-border p-4 bg-slate-800">
              <h3 className="text-pink-400 font-semibold mb-3">취약점 분석</h3>
              <div className="space-y-2">
                {reconData.weaknesses.map((weakness, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">{weakness}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Core Pilots */}
            <div className="cyber-border p-4 bg-slate-800">
              <h3 className="text-pink-400 font-semibold mb-3">핵심 파일럿</h3>
              <div className="space-y-3">
                {reconData.corePilots.map((pilot, index) => (
                  <div key={index} className="border-l-2 border-pink-400/30 pl-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white font-medium">{pilot.name}</span>
                      <span className="text-yellow-400">{Math.round(pilot.winRate * 100)}%</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {pilot.traits.map((trait, traitIndex) => (
                        <span 
                          key={traitIndex}
                          className="px-2 py-1 bg-gray-700 text-xs text-gray-300 rounded"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tactical Recommendations */}
          <div className="cyber-border p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-400/50 mb-6">
            <h3 className="text-blue-400 font-semibold mb-3">전술 권고사항</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="text-green-400 font-medium mb-2">공격 포인트</h4>
                <p className="text-gray-300">장거리 견제로 초반 주도권 확보 후 기동전 전개</p>
              </div>
              <div>
                <h4 className="text-yellow-400 font-medium mb-2">주의사항</h4>
                <p className="text-gray-300">근접전 시 높은 화력에 주의, 분산 배치 필수</p>
              </div>
              <div>
                <h4 className="text-purple-400 font-medium mb-2">권장 조합</h4>
                <p className="text-gray-300">아비터 견제형 + 리버 기동형 + 나이트 방어형</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <CyberButton variant="secondary" onClick={() => setScene('hub')}>
              지휘부로 돌아가기
            </CyberButton>
            
            <CyberButton onClick={() => setScene('banpick')}>
              밴픽 단계로 진행
            </CyberButton>
          </div>
        </div>
      )}
    </div>
  );
}