import React from 'react';
import { motion } from 'motion/react';
import { GameState, Player } from '../../types';

interface PlayerTokensProps {
  gameState: GameState;
}

export const PlayerTokens: React.FC<PlayerTokensProps> = ({ gameState }) => {
  const activePlayers = gameState.players.filter(p => !p.bankrupt);
  const currentActingPlayer = gameState.players[gameState.turnIndex];

  // Group players by position to calculate multi-token offsets
  const positionGroups: Record<number, Player[]> = {};
  activePlayers.forEach(p => {
    if (!positionGroups[p.position]) {
      positionGroups[p.position] = [];
    }
    positionGroups[p.position].push(p);
  });

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {activePlayers.map((player) => {
        const space = gameState.spaces[player.position];
        if (!space) return null;

        const isCurrentTurn = currentActingPlayer?.id === player.id;
        const playersOnTile = positionGroups[player.position] || [player];
        const playerIndexInTile = playersOnTile.indexOf(player);

        // Grid percentage calculations (9 columns, 9 rows)
        const leftPercent = ((space.gridCol - 0.5) / 9) * 100;
        const topPercent = ((space.gridRow - 0.5) / 9) * 100;

        // Offset multi-player pawns cleanly
        let offsetX = 0;
        let offsetY = 0;
        if (playersOnTile.length > 1) {
          const offsets = [
            { x: -11, y: -11 },
            { x: 11, y: -11 },
            { x: -11, y: 11 },
            { x: 11, y: 11 },
          ];
          const chosen = offsets[playerIndexInTile % 4];
          offsetX = chosen.x;
          offsetY = chosen.y;
        }

        return (
          <motion.div
            key={player.id}
            initial={false}
            animate={{
              left: `${leftPercent}%`,
              top: `${topPercent}%`,
              x: offsetX,
              y: offsetY,
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
            }}
            style={{
              position: 'absolute',
              transform: 'translate(-50%, -50%)',
              zIndex: isCurrentTurn ? 45 : 30 + playerIndexInTile,
            }}
            className="flex flex-col items-center select-none"
          >
            {/* Active Turn Pointer Arrow */}
            {isCurrentTurn && (
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
                className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-cyan-400 mb-0.5 shadow-glow-cyan"
              />
            )}

            {/* Token Holographic Radar Ring */}
            {isCurrentTurn && (
              <div
                className="absolute inset-0 rounded-full animate-ping opacity-75"
                style={{
                  backgroundColor: `${player.color}44`,
                  transform: 'scale(1.5)',
                }}
              />
            )}

            {/* Token Badge */}
            <div
              className={`
                w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-xs text-white border-2 border-white/90 shadow-2xl transition-transform duration-200 relative
                ${isCurrentTurn ? 'scale-120 ring-2 ring-cyan-400 shadow-glow-cyan' : 'hover:scale-105'}
              `}
              style={{
                backgroundColor: player.color,
                boxShadow: `0 6px 15px ${player.color}aa, inset 0 2px 4px rgba(255,255,255,0.7)`,
              }}
            >
              <span className="text-sm drop-shadow">{player.avatar}</span>
            </div>

            {/* Ground Shadow */}
            <div className="w-5 h-1.5 rounded-full bg-black/60 blur-[1.5px] -mt-0.5" />
          </motion.div>
        );
      })}
    </div>
  );
};
