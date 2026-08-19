import React from 'react';
import { BoardSpace, GameState, Player, REGION_CONFIG } from '../../types';
import { calculatePropertyRent, calculatePropertyMarketValue } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatting';
import { ArrowUpCircle, X, Check, Sparkles, Building2 } from 'lucide-react';

interface DevelopmentModalProps {
  spaceIndex: number | null;
  gameState: GameState;
  onClose: () => void;
  onConfirmUpgrade: (spaceIndex: number) => void;
}

export const DevelopmentModal: React.FC<DevelopmentModalProps> = ({
  spaceIndex,
  gameState,
  onClose,
  onConfirmUpgrade,
}) => {
  if (spaceIndex === null) return null;
  const space = gameState.spaces[spaceIndex];
  const humanPlayer = gameState.players.find(p => !p.isAI) || gameState.players[0];

  if (!space || !humanPlayer) return null;

  const currentLevel = space.level;
  const nextLevel = currentLevel + 1;
  const canUpgrade = currentLevel < 3 && humanPlayer.money >= space.developmentCost;
  const regionCfg = space.region ? REGION_CONFIG[space.region] : null;

  // Mock next level space to preview rent
  const nextSpace: BoardSpace = { ...space, level: nextLevel };
  const currentRent = calculatePropertyRent(space, gameState);
  const nextRent = calculatePropertyRent(nextSpace, gameState);

  const tierNames = ['Base Asset', 'Tier 1 Upgrade', 'Tier 2 Expansion', 'Tier 3 Mega-Complex'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/90 rounded-2xl p-6 shadow-2xl text-slate-100 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ArrowUpCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest block">
                INFRASTRUCTURE UPGRADE
              </span>
              <h3 className="text-sm font-black text-white uppercase font-display">
                DEVELOP PROPERTY
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Space Preview */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 mb-5 text-center flex flex-col items-center">
          <div className="text-2xl mb-1">{space.flag}</div>
          <h2 className="text-lg font-black text-white uppercase font-display">{space.name}</h2>
          <div className="text-[11px] font-mono text-slate-400 mb-3">{space.country}</div>

          {/* Tier Progression Preview */}
          <div className="w-full grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-left">
              <span className="text-[9px] text-slate-500 block uppercase">CURRENT LEVEL</span>
              <span className="font-bold text-white block mb-1">{tierNames[currentLevel]}</span>
              <span className="text-[10px] text-slate-400">Rent: {formatCurrency(currentRent)}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-left">
              <span className="text-[9px] text-amber-400 block uppercase font-bold">NEXT TIER</span>
              <span className="font-bold text-amber-300 block mb-1">
                {currentLevel < 3 ? tierNames[nextLevel] : 'MAX LEVEL'}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">
                {currentLevel < 3 ? `Rent: ${formatCurrency(nextRent)}` : 'Completed'}
              </span>
            </div>
          </div>
        </div>

        {/* Cost vs Balance */}
        <div className="flex items-center justify-between text-xs font-mono mb-6 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <div>
            <span className="text-slate-500 text-[10px] block">UPGRADE COST</span>
            <span className="font-black text-amber-300">{formatCurrency(space.developmentCost)}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 text-[10px] block">YOUR TREASURY</span>
            <span className={`font-black ${canUpgrade ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(humanPlayer.money)}
            </span>
          </div>
        </div>

        {/* Confirm Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            CANCEL
          </button>

          <button
            onClick={() => onConfirmUpgrade(space.index)}
            disabled={!canUpgrade}
            className={`
              py-3 px-4 rounded-xl font-mono font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer
              ${
                canUpgrade
                  ? 'bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white shadow-glow-amber active:scale-95'
                  : 'bg-slate-800 text-slate-600 border border-slate-700 opacity-50 cursor-not-allowed'
              }
            `}
          >
            <Check className="w-4 h-4" /> CONFIRM UPGRADE
          </button>
        </div>
      </div>
    </div>
  );
};
