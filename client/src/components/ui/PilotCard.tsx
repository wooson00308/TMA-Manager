import { type Pilot } from '@shared/schema';

interface PilotCardProps {
  pilot: Pilot;
  onClick?: () => void;
  selected?: boolean;
}

export function PilotCard({ pilot, onClick, selected }: PilotCardProps) {
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
      className={`cyber-border p-4 transition-colors cursor-pointer ${
        selected ? 'bg-blue-900' : 'bg-slate-800 hover:bg-blue-900'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-pink-400">{pilot.callsign}</h4>
          <p className="text-xs text-gray-400">{pilot.dormitory} Dormitory</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">Rating</div>
          <div className="text-green-400 font-bold">{pilot.rating}</div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1 mb-3">
        {pilot.traits.map((trait, index) => (
          <span 
            key={index}
            className={`trait-badge ${getTraitColor(trait)}`}
          >
            {trait}
          </span>
        ))}
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-gray-400">Reaction</div>
          <div className="w-full bg-gray-700 rounded h-1">
            <div 
              className="bg-green-400 h-1 rounded" 
              style={{ width: `${pilot.reaction}%` }}
            ></div>
          </div>
        </div>
        <div>
          <div className="text-gray-400">Accuracy</div>
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
