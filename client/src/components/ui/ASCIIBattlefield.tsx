import { type BattleState } from '@shared/schema';

interface ASCIIBattlefieldProps {
  battleState: BattleState | null;
}

export function ASCIIBattlefield({ battleState }: ASCIIBattlefieldProps) {
  const generateBattlefield = () => {
    if (!battleState) {
      return `╔══════════════════════════════════════╗
║                                      ║
║            NO ACTIVE BATTLE          ║
║                                      ║
║         Awaiting deployment...       ║
║                                      ║
╚══════════════════════════════════════╝`;
    }

    // Generate battlefield based on battle state
    const field = Array(8).fill(null).map(() => Array(15).fill(' '));
    
    // Place participants
    battleState.participants.forEach((participant, index) => {
      const { x, y } = participant.position;
      if (x >= 0 && x < 15 && y >= 0 && y < 8) {
        if (index < 3) {
          // Player team
          field[y][x] = ['N', 'R', 'A'][index]; // Knight, River, Arbiter
        } else {
          // Enemy team
          field[y][x] = ['E', 'E', 'E'][index - 3]; // Enemy
        }
      }
    });

    // Create ASCII representation
    let battlefield = '╔══════════════════════════════════════╗\n';
    for (let row = 0; row < 8; row++) {
      battlefield += '║ ';
      for (let col = 0; col < 15; col++) {
        const cell = field[row][col];
        if (cell !== ' ') {
          battlefield += `[${cell}]`;
        } else if (col === 7 && row === 4) {
          battlefield += 'CORE';
        } else {
          battlefield += ' ◊ ';
        }
      }
      battlefield += ' ║\n';
    }
    battlefield += '╚══════════════════════════════════════╝';

    return battlefield;
  };

  return (
    <div className="cyber-border bg-slate-800 p-4">
      <h3 className="text-pink-400 font-semibold mb-3">TACTICAL DISPLAY</h3>
      <div className="ascii-art text-green-400 text-xs leading-tight font-mono">
        {generateBattlefield()}
      </div>
      
      <div className="mt-2 text-xs text-gray-400">
        N=Knight, R=River, A=Arbiter, E=Enemy<br/>
        ◊ = Terrain, CORE = Objective
      </div>

      {battleState && (
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          {battleState.participants.slice(0, 3).map((participant, index) => (
            <div key={index} className="cyber-border p-2 bg-slate-900">
              <div className="text-green-400">PILOT-{index + 1}</div>
              <div className="text-gray-400">
                HP: {participant.hp}% | Status: {participant.status}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
