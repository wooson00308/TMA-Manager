import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { CyberButton } from '@/components/ui/CyberButton';

const MatchNotification: React.FC = () => {
  const { matchNotification, hideMatchNotification, setScene } = useGameStore();
  const [timeLeft, setTimeLeft] = useState(30);

  // Reset and start countdown every time a new match notification appears
  useEffect(() => {
    if (!matchNotification) return;

    // Reset timer to full duration
    setTimeLeft(30);

    // Countdown
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [matchNotification]);

  // Auto-decline when timer hits 0
  useEffect(() => {
    if (timeLeft <= 0) {
      hideMatchNotification();
    }
  }, [timeLeft, hideMatchNotification]);

  if (!matchNotification) return null;

  const handleAccept = () => {
    setScene('match_prep');
    hideMatchNotification();
  };

  const handleDecline = () => {
    hideMatchNotification();
  };

  // Difficulty badge color
  const diffClass =
    matchNotification.difficulty === '상급'
      ? 'bg-red-500/20 text-red-300'
      : matchNotification.difficulty === '중급'
      ? 'bg-yellow-500/20 text-yellow-300'
      : 'bg-emerald-500/20 text-emerald-300';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={handleDecline}
      ></div>

      {/* Popup */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Ring */}
        <div className="relative w-80 h-80 sm:w-96 sm:h-96">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full border-4 border-sky-400/40 animate-[spin_12s_linear_infinite] drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]"></div>
          {/* Middle dashed ring */}
          <div className="absolute inset-4 rounded-full border-2 border-dashed border-emerald-400/40 animate-[spin_6s_linear_reverse_infinite]"></div>
          {/* Inner solid ring */}
          <div className="absolute inset-8 rounded-full border-2 border-sky-300/60"></div>
          {/* Center circle background */}
          <div className="absolute inset-10 rounded-full bg-gradient-to-br from-slate-800/95 to-gray-900/95 backdrop-blur-sm flex items-center justify-center shadow-inner shadow-sky-500/10"></div>

          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
            <div className="w-20 h-20 bg-sky-500/20 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-sky-500/30">
              <i className="fas fa-rocket text-sky-300 text-4xl"></i>
            </div>
            <h2 className="text-2xl sm:text-3xl font-orbitron font-bold text-white mb-2">
              매치를 찾았습니다!
            </h2>
            <p className="text-sm text-slate-300 mb-1">상대팀: {matchNotification.opponent}</p>
            <span className={`text-xs font-semibold px-2 py-1 rounded ${diffClass} mb-3`}>
              난이도: {matchNotification.difficulty}
            </span>
            <p className="text-sm text-amber-400 mb-4 font-medium">보상: {matchNotification.reward}</p>

            {/* Buttons */}
            <div className="flex space-x-4">
              <CyberButton onClick={handleAccept} className="px-6 py-3">
                <i className="fas fa-check mr-2"></i>
                수락!
              </CyberButton>
              <CyberButton variant="secondary" onClick={handleDecline} className="px-6 py-3">
                거절
              </CyberButton>
            </div>

            {/* Countdown */}
            <div className="mt-4 text-cyan-300 text-xs flex items-center space-x-1">
              <i className="fas fa-clock"></i>
              <span>{timeLeft}초 후 자동 거절</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchNotification; 