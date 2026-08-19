import React from 'react';
import { BoardSpace, GameState, Player, REGION_CONFIG } from '../../types';
import { calculatePropertyRent, calculatePropertyMarketValue } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatting';
import { Building2, ArrowUpCircle, Repeat, Sparkles } from 'lucide-react';

interface HoldingsListProps {
  player: Player;
  gameState: GameState;
  onDevelop: (spaceIndex: number) => void;
  onOpenTrade: (targetPlayerId?: string) => void;
}

export const HoldingsList: React.FC<HoldingsListProps> = ({
  player,
  gameState,
  onDevelop,
  onOpenTrade,
}) => {
  const ownedSpaces = player.properties
    .map(idx => gameState.spaces[idx])
    .filter((s): s is BoardSpace => s !== undefined);

  const isHumanTurn = !player.isAI && gameState.turnIndex === 0 && !gameState.isMovingPawn;

  return (
    <div className="space-y-2.5 select-none">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-cyan-400" /> PORTFOLIO HOLDINGS ({ownedSpaces.length})
        </span>
        {ownedSpaces.length > 0 && !player.isAI && (
          <button
            onClick={() => onOpenTrade()}
            className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 flex items-center gap-1 transition-all cursor-pointer"
          >
            <Repeat className="w-3 h-3" /> PROPOSE TRADE
          </button>
        )}
      </div>

      {ownedSpaces.length === 0 ? (
        <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 text-center">
          <p className="text-[10px] font-mono text-slate-500">
            No properties acquired yet. Roll dice and acquire strategic international assets!
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {ownedSpaces.map((space) => {
            const rent = calculatePropertyRent(space, gameState);
            const marketVal = calculatePropertyMarketValue(space, gameState);
            const regCfg = space.region ? REGION_CONFIG[space.region] : null;
            const canDevelop = isHumanTurn && space.level < 3 && player.money >= space.developmentCost;

            return (
              <div
                key={space.index}
                className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all text-xs font-mono"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{space.flag}</span>
                    <span className="font-extrabold text-white uppercase text-[11px] truncate max-w-[110px]">
                      {space.name}
                    </span>
                  </div>
                  {regCfg && (
                    <span
                      className="text-[8px] font-bold uppercase px-1.5 py-0.2 rounded"
                      style={{ backgroundColor: `${regCfg.color}22`, color: regCfg.color }}
                    >
                      {regCfg.name}
                    </span>
                  )}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-1 bg-slate-950/70 p-1.5 rounded-lg text-[9px] mb-2">
                  <div>
                    <span className="text-slate-500 block">LEVEL</span>
                    <span className="text-amber-300 font-bold">
                      {space.level === 3 ? '★ MEGA' : `LVL ${space.level}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">RENT</span>
                    <span className="text-emerald-400 font-bold">{formatCurrency(rent)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">VALUE</span>
                    <span className="text-cyan-400 font-bold">{formatCurrency(marketVal)}</span>
                  </div>
                </div>

                {/* Actions (Only visible for human player) */}
                {!player.isAI && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onDevelop(space.index)}
                      disabled={!canDevelop}
                      className={`
                        flex-1 py-1 px-2 rounded-lg text-[9px] font-bold uppercase flex items-center justify-center gap-1 transition-all cursor-pointer
                        ${
                          canDevelop
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 shadow-glow-amber'
                            : 'bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed opacity-50'
                        }
                      `}
                    >
                      <ArrowUpCircle className="w-3 h-3" />
                      {space.level >= 3
                        ? 'MAX TIER'
                        : `UPGRADE (${formatCurrency(space.developmentCost)})`}
                    </button>

                    <button
                      onClick={() => onOpenTrade()}
                      className="py-1 px-2.5 rounded-lg text-[9px] font-bold uppercase bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
                    >
                      TRADE
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
