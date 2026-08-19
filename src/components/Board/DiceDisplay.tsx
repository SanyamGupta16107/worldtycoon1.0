import React from 'react';
import { motion } from 'motion/react';

interface DiceDisplayProps {
  dice: [number, number];
  isRolling: boolean;
}

export const DiceDisplay: React.FC<DiceDisplayProps> = ({ dice, isRolling }) => {
  const renderPips = (val: number) => {
    const pipsConfig: Record<number, number[]> = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };
    const activePips = pipsConfig[val] || [4];

    return (
      <div className="grid grid-cols-3 grid-rows-3 w-6 h-6 sm:w-7 sm:h-7 gap-1 p-0.5 pointer-events-none">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-opacity ${
              activePips.includes(i)
                ? 'bg-cyan-400 shadow-[0_0_8px_#06b6d4] opacity-100'
                : 'opacity-0'
            }`}
          />
        ))}
      </div>
    );
  };

  const total = dice[0] + dice[1];

  return (
    <div className="flex items-center gap-3.5 select-none">
      {/* Die 1 (Neon Cyan Cube) */}
      <motion.div
        animate={
          isRolling
            ? {
                rotateX: [0, 180, 360, 540, 720],
                rotateY: [0, 90, 270, 360, 540],
                scale: [1, 1.2, 0.9, 1.15, 1],
              }
            : {}
        }
        transition={{ duration: 0.55, ease: 'easeInOut' }}
        className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-slate-900 to-black border-2 border-cyan-500/60 shadow-[0_8px_20px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(6,182,212,0.4),0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center relative overflow-hidden"
      >
        {/* Cube Bevel Accents */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(6,182,212,0.2),transparent_70%)] pointer-events-none" />
        {renderPips(dice[0])}
      </motion.div>

      {/* Die 2 (Neon Purple Cube) */}
      <motion.div
        animate={
          isRolling
            ? {
                rotateX: [0, -180, -360, -540, -720],
                rotateY: [0, -90, -270, -360, -540],
                scale: [1, 1.2, 0.9, 1.15, 1],
              }
            : {}
        }
        transition={{ duration: 0.55, ease: 'easeInOut' }}
        className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-slate-900 to-black border-2 border-purple-500/60 shadow-[0_8px_20px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(168,85,247,0.4),0_0_15px_rgba(168,85,247,0.3)] flex items-center justify-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(168,85,247,0.2),transparent_70%)] pointer-events-none" />
        {renderPips(dice[1])}
      </motion.div>

      {/* Total Sum Badge */}
      <div className="flex flex-col items-center font-mono pl-1">
        <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest">
          SUM
        </span>
        <span className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 drop-shadow-sm">
          {total}
        </span>
      </div>
    </div>
  );
};
