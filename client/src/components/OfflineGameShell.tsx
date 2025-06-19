import React, { useState } from 'react';
import { CyberButton } from './ui/CyberButton';

export function OfflineGameShell() {
  const [currentScene, setCurrentScene] = useState<'hub' | 'scouting' | 'match_prep' | 'battle' | 'analysis'>('hub');
  const [battleInProgress, setBattleInProgress] = useState(false);
  const [battleLog, setBattleLog] = useState<string[]>([]);

  const startBattle = () => {
    setBattleInProgress(true);
    setBattleLog(['전투 시작!']);
    setCurrentScene('battle');
    
    // Simulate battle actions
    const actions = [
      'Sasha: Knight 기체로 전진 개시!',
      'Mei: 적 기체 3시 방향에서 확인!',
      'Alex: River 기체로 화력 지원!',
      'Enemy Alpha: 측면 기동으로 우회 공격!',
      'Sasha: 근접 전투 개시! 타격 성공!',
      'Mei: Arbiter 시스템으로 정밀 사격!',
      'Alex: 포지션 재조정 중...',
      'Enemy Beta: 반격 개시!',
      'Sasha: 대형 유지하며 밀어붙여!',
      'Mei: 적 핵심 기체 타격!',
      'Alex: 승리가 보인다!',
      'Trinity Squad 승리!'
    ];
    
    let actionIndex = 0;
    const executeAction = () => {
      if (actionIndex < actions.length) {
        setBattleLog(prev => [...prev, actions[actionIndex]]);
        actionIndex++;
        setTimeout(executeAction, 1500);
      } else {
        setBattleInProgress(false);
      }
    };
    
    setTimeout(executeAction, 2000);
  };

  const navigationItems = [
    { id: 'hub', label: '사령부', description: '시즌 개요 및 팀 현황' },
    { id: 'scouting', label: '파일럿 스카우팅', description: '파일럿 영입 및 분석' },
    { id: 'match_prep', label: '경기 준비', description: '밴픽 및 전투 준비' },
    { id: 'analysis', label: '전투 분석', description: '전투 데이터 분석' },
  ];

  const renderScene = () => {
    switch (currentScene) {
      case 'hub':
        return (
          <div>
            <h2 className="text-2xl font-orbitron font-bold text-green-400 mb-4">TRINITY MECHA ACADEMY</h2>
            <div className="cyber-border p-6 bg-slate-800 mb-6">
              <h3 className="text-xl font-bold text-green-400 mb-4">사령부</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="cyber-border p-4 bg-slate-700">
                  <h4 className="text-lg font-bold text-blue-400 mb-2">Trinity Squad</h4>
                  <div className="space-y-2">
                    <div>파일럿: 3명</div>
                    <div>승리: 16경기</div>
                    <div>패배: 4경기</div>
                    <div>예산: 250,000 크레딧</div>
                  </div>
                </div>
                <div className="cyber-border p-4 bg-slate-700">
                  <h4 className="text-lg font-bold text-pink-400 mb-2">핵심 파일럿</h4>
                  <div className="space-y-1">
                    <div>Sasha Volkov (Knight)</div>
                    <div>Mei Chen (Arbiter)</div>
                    <div>Alex Rodriguez (River)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'scouting':
        return (
          <div>
            <h2 className="text-2xl font-orbitron font-bold text-green-400 mb-4">파일럿 스카우팅</h2>
            <div className="cyber-border p-6 bg-slate-800">
              <h3 className="text-xl font-bold mb-4">채용 가능한 파일럿</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Luna Park', specialty: 'Knight', rating: 85 },
                  { name: 'Jin Watanabe', specialty: 'River', rating: 78 },
                  { name: 'Viktor Petrov', specialty: 'Arbiter', rating: 82 },
                ].map((pilot, index) => (
                  <div key={index} className="cyber-border p-4 bg-slate-700">
                    <h4 className="font-bold text-blue-400">{pilot.name}</h4>
                    <div className="text-sm text-gray-400">전문: {pilot.specialty}</div>
                    <div className="text-sm">평점: {pilot.rating}</div>
                    <CyberButton className="mt-2" variant="secondary">
                      채용하기
                    </CyberButton>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'match_prep':
        return (
          <div>
            <h2 className="text-2xl font-orbitron font-bold text-green-400 mb-4">경기 준비</h2>
            <div className="cyber-border p-6 bg-slate-800 mb-6">
              <h3 className="text-xl font-bold mb-4">밴픽 시뮬레이션</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-bold text-green-400 mb-2">Trinity Squad</h4>
                  <div className="space-y-2">
                    <div className="cyber-border p-2 bg-slate-700">Sasha (Knight MK-VII)</div>
                    <div className="cyber-border p-2 bg-slate-700">Mei (Arbiter XS-3)</div>
                    <div className="cyber-border p-2 bg-slate-700">Alex (River Type-R)</div>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-red-400 mb-2">Enemy Team</h4>
                  <div className="space-y-2">
                    <div className="cyber-border p-2 bg-slate-700">Alpha (Assault MK-V)</div>
                    <div className="cyber-border p-2 bg-slate-700">Beta (Sniper XL-2)</div>
                    <div className="cyber-border p-2 bg-slate-700">Gamma (Tank HD-8)</div>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <CyberButton onClick={startBattle} disabled={battleInProgress}>
                  {battleInProgress ? '전투 중...' : '전투 시작'}
                </CyberButton>
              </div>
            </div>
          </div>
        );

      case 'battle':
        return (
          <div>
            <h2 className="text-2xl font-orbitron font-bold text-green-400 mb-4">전투 시뮬레이션</h2>
            <div className="cyber-border p-6 bg-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">
                  {battleInProgress ? (
                    <span className="text-green-400">전투 진행 중</span>
                  ) : (
                    <span className="text-yellow-400">전투 완료</span>
                  )}
                </h3>
                <div className="text-sm text-gray-400">Trinity Squad vs Enemy Team</div>
              </div>
              
              <div className="cyber-border p-4 bg-slate-700 h-64 overflow-y-auto">
                <h4 className="text-lg font-bold text-green-400 mb-2">Combat Log</h4>
                <div className="space-y-1">
                  {battleLog.map((log, index) => (
                    <div key={index} className="text-sm p-1 bg-slate-800 rounded">
                      {log}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex space-x-4">
                <CyberButton variant="secondary" onClick={() => setCurrentScene('hub')}>
                  사령부로 돌아가기
                </CyberButton>
                {!battleInProgress && (
                  <CyberButton onClick={() => setCurrentScene('analysis')}>
                    전투 분석 보기
                  </CyberButton>
                )}
              </div>
            </div>
          </div>
        );

      case 'analysis':
        return (
          <div>
            <h2 className="text-2xl font-orbitron font-bold text-green-400 mb-4">전투 분석</h2>
            <div className="cyber-border p-6 bg-slate-800">
              <h3 className="text-xl font-bold mb-4">최근 전투 결과</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="cyber-border p-4 bg-slate-700">
                  <h4 className="text-lg font-bold text-green-400 mb-2">승리 요인</h4>
                  <div className="space-y-1 text-sm">
                    <div>• 우수한 팀워크와 조율</div>
                    <div>• Sasha의 뛰어난 근접 전투</div>
                    <div>• Mei의 정확한 장거리 사격</div>
                    <div>• 효과적인 포지셔닝</div>
                  </div>
                </div>
                <div className="cyber-border p-4 bg-slate-700">
                  <h4 className="text-lg font-bold text-yellow-400 mb-2">개선 사항</h4>
                  <div className="space-y-1 text-sm">
                    <div>• 초기 대응 속도 향상 필요</div>
                    <div>• Alex의 지원 타이밍 조절</div>
                    <div>• 방어적 포메이션 강화</div>
                    <div>• 통신 체계 최적화</div>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <CyberButton onClick={() => setCurrentScene('match_prep')}>
                  다음 경기 준비
                </CyberButton>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Unknown scene</div>;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white">
      {/* Header */}
      <header className="cyber-border border-t-0 border-l-0 border-r-0 p-4 bg-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="cyber-logo">
              <span className="text-2xl font-orbitron font-bold text-green-400">TMA</span>
            </div>
            <div>
              <h1 className="text-xl font-orbitron font-bold">TRINITY MECHA ACADEMY</h1>
              <div className="text-sm text-gray-400">오프라인 모드</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Season 5 • Week 12</div>
            <div className="text-xs text-green-400">System Online</div>
          </div>
        </div>
      </header>

      {/* Main Interface */}
      <div className="flex-1 flex">
        {/* Navigation */}
        <nav className="w-64 cyber-border border-t-0 border-b-0 border-l-0 p-4 bg-slate-800">
          <div className="space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentScene(item.id as any)}
                className={`w-full text-left p-3 cyber-border transition-colors ${
                  currentScene === item.id ? 'bg-slate-700 text-green-400' : 'hover:bg-slate-700'
                }`}
              >
                <div className="font-semibold">{item.label}</div>
                <div className="text-xs text-gray-400">{item.description}</div>
              </button>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {renderScene()}
        </main>
      </div>

      {/* Footer */}
      <footer className="cyber-border border-b-0 border-l-0 border-r-0 p-2 bg-slate-800 text-xs text-gray-400 text-center">
        Trinity Mecha Academy - 오프라인 시뮬레이션 모드
      </footer>
    </div>
  );
}