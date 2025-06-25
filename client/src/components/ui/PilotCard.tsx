import { Pilot } from '@shared/schema';

interface PilotCardProps {
  pilot: Pilot;
  onSelect?: (pilot: Pilot) => void;
  selected?: boolean;
  showDetails?: boolean;
}

export function PilotCard({ pilot, onSelect, selected = false, showDetails = true }: PilotCardProps) {
  const getTraitColor = (trait: string) => {
    const colors = {
      aggressive: 'from-rose-400 to-rose-500',
      cautious: 'from-blue-400 to-blue-500',
      analytical: 'from-amber-400 to-orange-500',
      knight: 'from-purple-400 to-purple-500',
      river: 'from-emerald-400 to-emerald-500',
      arbiter: 'from-pink-400 to-pink-500',
      assault: 'from-red-400 to-red-500',
      support: 'from-green-400 to-green-500',
      sniper: 'from-cyan-400 to-cyan-500',
    };
    return colors[trait.toLowerCase() as keyof typeof colors] || 'from-slate-400 to-slate-500';
  };

  const getSkillColor = (skill: number) => {
    if (skill >= 90) return 'from-amber-400 to-orange-500 text-white';
    if (skill >= 80) return 'from-emerald-400 to-emerald-500 text-white';
    if (skill >= 70) return 'from-sky-400 to-blue-500 text-white';
    if (skill >= 60) return 'from-slate-400 to-slate-500 text-white';
    return 'from-gray-300 to-gray-400 text-slate-600';
  };

  return (
    <div
      className={`
        bg-white/90 backdrop-blur-lg border-2 rounded-xl p-5 shadow-lg
        transition-all duration-300 ease-out cursor-pointer group
        hover:shadow-xl hover:-translate-y-2 hover:scale-[1.02]
        ${selected 
          ? 'border-sky-400 shadow-sky-400/30 bg-gradient-to-br from-sky-50 to-blue-50' 
          : 'border-sky-200/50 hover:border-sky-300 shadow-sky-100/50'
        }
      `}
      onClick={() => onSelect && onSelect(pilot)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-slate-600 font-bold text-lg">
              {pilot.callsign.charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="font-orbitron font-bold text-slate-800 text-lg">
              {pilot.callsign}
            </h3>
            <p className="text-slate-600 text-sm">{pilot.dormitory} 기숙사</p>
          </div>
        </div>
        
        {pilot.traits.length > 0 && (
          <div className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getTraitColor(pilot.traits[0])} shadow-md`}>
            {pilot.traits[0].toUpperCase()}
          </div>
        )}
      </div>

      {showDetails && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-sky-50 rounded-lg p-3 border border-sky-100">
              <div className="text-xs text-slate-600 mb-1 flex items-center">
                <i className="fas fa-tachometer-alt mr-1 text-red-500"></i>
                반응속도
              </div>
              <div className={`text-lg font-bold bg-gradient-to-r ${getSkillColor(pilot.reaction)} bg-clip-text text-transparent`}>
                {pilot.reaction}
              </div>
            </div>
            <div className="bg-sky-50 rounded-lg p-3 border border-sky-100">
              <div className="text-xs text-slate-600 mb-1 flex items-center">
                <i className="fas fa-crosshairs mr-1 text-orange-500"></i>
                정확도
              </div>
              <div className={`text-lg font-bold bg-gradient-to-r ${getSkillColor(pilot.accuracy)} bg-clip-text text-transparent`}>
                {pilot.accuracy}
              </div>
            </div>
            <div className="bg-sky-50 rounded-lg p-3 border border-sky-100">
              <div className="text-xs text-slate-600 mb-1 flex items-center">
                <i className="fas fa-brain mr-1 text-purple-500"></i>
                전술적사고
              </div>
              <div className={`text-lg font-bold bg-gradient-to-r ${getSkillColor(pilot.tactical)} bg-clip-text text-transparent`}>
                {pilot.tactical}
              </div>
            </div>
            <div className="bg-sky-50 rounded-lg p-3 border border-sky-100">
              <div className="text-xs text-slate-600 mb-1 flex items-center">
                <i className="fas fa-users mr-1 text-green-500"></i>
                팀워크
              </div>
              <div className={`text-lg font-bold bg-gradient-to-r ${getSkillColor(pilot.teamwork)} bg-clip-text text-transparent`}>
                {pilot.teamwork}
              </div>
            </div>
          </div>

          {/* Overall Rating */}
          <div className="bg-gradient-to-r from-sky-100 to-blue-100 rounded-lg p-3 mb-4 border border-sky-200">
            <div className="flex items-center justify-between">
              <span className="text-sky-700 font-semibold text-sm flex items-center">
                <i className="fas fa-star mr-1 text-amber-500"></i>
                종합 평가
              </span>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < Math.floor(pilot.rating / 20) 
                          ? 'bg-gradient-to-r from-amber-400 to-yellow-500' 
                          : 'bg-slate-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sky-600 font-bold">{pilot.rating}</span>
              </div>
            </div>
          </div>

          {/* Status & Traits */}
          <div className="flex items-center justify-between">
            <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center ${
              pilot.isActive 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-slate-100 text-slate-700'
            }`}>
              <i className={`mr-1 ${pilot.isActive ? 'fas fa-check-circle' : 'fas fa-pause-circle'}`}></i>
              {pilot.isActive ? '활성' : '대기'}
            </div>
            
            {pilot.traits.length > 1 && (
              <div className="text-xs text-slate-500">
                +{pilot.traits.length - 1} 특성
              </div>
            )}
            
            {onSelect && (
              <div className="text-xs text-slate-500 group-hover:text-sky-500 transition-colors">
                클릭하여 선택
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
