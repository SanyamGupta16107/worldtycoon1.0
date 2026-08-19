import React from 'react';
import { BoardSpace, GameState, Player, REGION_CONFIG } from '../../types';
import { calculatePropertyRent, calculatePropertyMarketValue } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatting';
import { Building2, Check, X, ShieldAlert, TrendingUp } from 'lucide-react';

interface PropertyPurchaseModalProps {
  space: BoardSpace | null;
  player: Player | null;
  gameState: GameState;
  onBuy: (spaceIndex: number) => void;
  onPass: () => void;
}

export const PropertyPurchaseModal: React.FC<PropertyPurchaseModalProps> = ({
  space,
  player,
  gameState,
  onBuy,
  onPass,
}) => {
  if (!space || !player) return null;

  const canAfford = player.money >= space.price;
  const regionCfg = space.region ? REGION_CONFIG[space.region] : null;
  const marketVal = calculatePropertyMarketValue(space, gameState);
  const baseRent = space.baseRent;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/90 rounded-2xl p-6 shadow-2xl text-slate-100 font-sans">
        {/* Header Badge */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block">
                OPPORTUNITY IDENTIFIED
              </span>
              <h3 className="text-sm font-black text-white uppercase font-display">
                PROPERTY ACQUISITION
              </h3>
            </div>
          </div>

          {regionCfg && (
            <span
              className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase"
              style={{ backgroundColor: `${regionCfg.color}22`, color: regionCfg.color }}
            >
              {regionCfg.name}
            </span>
          )}
        </div>

        {/* Space Profile Card */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 mb-5 text-center flex flex-col items-center">
          <div className="text-3xl mb-1">{space.flag}</div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight font-display mb-0.5">
            {space.name}
          </h2>
          <div className="text-xs font-mono text-slate-400 mb-3">{space.country}</div>

          {space.specializationLabel && (
            <div className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-cyan-300 mb-3">
              {space.specializationLabel}
            </div>
          )}

          {/* Financial Breakdown */}
          <div className="w-full grid grid-cols-3 gap-2 text-xs font-mono pt-2 border-t border-slate-900">
            <div className="p-2 rounded-lg bg-slate-900/90">
              <span className="text-[9px] text-slate-500 block">PRICE</span>
              <span className="text-white font-extrabold">{formatCurrency(space.price)}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/90">
              <span className="text-[9px] text-slate-500 block">BASE RENT</span>
              <span className="text-amber-300 font-extrabold">{formatCurrency(baseRent)}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/90">
              <span className="text-[9px] text-slate-500 block">MARKET VALUE</span>
              <span className="text-cyan-400 font-extrabold">{formatCurrency(marketVal)}</span>
            </div>
          </div>
        </div>

        {/* Treasury Status */}
        <div className="flex items-center justify-between text-xs font-mono mb-6 px-1">
          <span className="text-slate-400">Your Treasury:</span>
          <span className={`font-black ${canAfford ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(player.money)}
          </span>
        </div>

        {/* Decision Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onPass}
            className="py-3 px-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" /> PASS
          </button>

          <button
            onClick={() => onBuy(space.index)}
            disabled={!canAfford}
            className={`
              py-3 px-4 rounded-xl font-mono font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer
              ${
                canAfford
                  ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-glow-emerald active:scale-95'
                  : 'bg-slate-800 text-slate-600 border border-slate-700 opacity-50 cursor-not-allowed'
              }
            `}
          >
            <Check className="w-4 h-4" /> BUY ({formatCurrency(space.price)})
          </button>
        </div>
      </div>
    </div>
  );
};
