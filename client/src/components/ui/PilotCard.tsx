import { type Pilot } from '@shared/schema';

interface PilotCardProps {
  pilot: Pilot;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
}

export function PilotCard({ pilot, onClick, selected, disabled }: PilotCardProps) {
  const getTraitColor = (trait: string) => {
    switch (trait.toLowerCase()) {
      case 'aggressive': return 'trait-aggressive';
      case 'cautious': return 'trait-cautious';
      case 'analytical': return 'trait-analytical';
      case 'knight': return 'trait-knight';
      case 'river': return 'trait-river';
      case 'arbiter': return 'trait-arbiter';
      case 'assault': return 'trait-assault';
      case 'support': return 'trait-support';
      case 'sniper': return 'trait-sniper';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div 
      className={`cyber-border p-3 md:p-4 transition-colors ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      } ${
        selected ? 'bg-blue-900' : 'bg-slate-800 hover:bg-blue-900'
      }`}
      onClick={disabled ? undefined : onClick}
    >
      <div className="flex items-start justify-between mb-2 md:mb-3">
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-pink-400 text-sm md:text-base truncate">{pilot.callsign}</h4>
          <p className="text-xs text-gray-400 hidden sm:block">{pilot.dormitory} Dormitory</p>
          <p className="text-xs text-gray-400 sm:hidden">{pilot.dormitory}</p>
        </div>
        <div className="text-right ml-2">
          <div className="text-xs text-gray-400">Rating</div>
          <div className="text-green-400 font-bold text-sm md:text-base">{pilot.rating}</div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1 mb-2 md:mb-3">
        {pilot.traits.slice(0, 3).map((trait, index) => (
          <span 
            key={index}
            className={`trait-badge text-xs ${getTraitColor(trait)}`}
          >
            {trait}
          </span>
        ))}
        {pilot.traits.length > 3 && (
          <span className="text-xs text-gray-400">+{pilot.traits.length - 3}</span>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-gray-400 mb-1">Reaction</div>
          <div className="w-full bg-gray-700 rounded h-1">
            <div 
              className="bg-green-400 h-1 rounded" 
              style={{ width: `${pilot.reaction}%` }}
            ></div>
          </div>
        </div>
        <div>
          <div className="text-gray-400 mb-1">Accuracy</div>
          <div className="w-full bg-gray-700 rounded h-1">
            <div 
              className="bg-green-400 h-1 rounded" 
              style={{ width: `${pilot.accuracy}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
