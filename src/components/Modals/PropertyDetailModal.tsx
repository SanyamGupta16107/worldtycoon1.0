import React from 'react';
import { BoardSpace, GameState, REGION_CONFIG } from '../../types';
import {
  getDetailedPropertyRent,
  calculatePropertyMarketValue,
  canDevelopRegion,
  getMortgageValue,
  getUnmortgageCost,
  getBankSellValue,
} from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatting';
import {
  X,
  Building2,
  ArrowUpCircle,
  ShieldAlert,
  DollarSign,
  Gavel,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Landmark,
  Layers,
} from 'lucide-react';

interface PropertyDetailModalProps {
  spaceIndex: number | null;
  gameState: GameState;
  onClose: () => void;
  onUpgrade: (spaceIndex: number) => void;
  onMortgage: (spaceIndex: number) => void;
  onUnmortgage: (spaceIndex: number) => void;
  onSellToBank: (spaceIndex: number) => void;
  onStartAuction: (spaceIndex: number) => void;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  spaceIndex,
  gameState,
  onClose,
  onUpgrade,
  onMortgage,
  onUnmortgage,
  onSellToBank,
  onStartAuction,
}) => {
  if (spaceIndex === null) return null;
  const space = gameState.spaces[spaceIndex];
  if (!space) return null;

  const isPassAndPlay = gameState.config.mode === 'pass_and_play';
  const actingPlayer = isPassAndPlay
    ? gameState.players[gameState.turnIndex]
    : gameState.players.find(p => !p.isAI) || gameState.players[0];

  const ownerPlayer = space.owner ? gameState.players.find(p => p.id === space.owner) : null;
  const isOwner = actingPlayer && space.owner === actingPlayer.id;

  const regionCfg = space.region ? REGION_CONFIG[space.region] : null;
  const rentBreakdown = getDetailedPropertyRent(space, gameState);
  const marketVal = calculatePropertyMarketValue(space, gameState);

  const hasThreeInRegion = space.region ? canDevelopRegion(actingPlayer?.id || '', space.region, gameState.spaces) : false;
  const ownedInRegionCount = space.region ? gameState.spaces.filter(s => s.region === space.region && s.owner === actingPlayer?.id).length : 0;
  const canUpgrade = isOwner && !space.mortgaged && space.level < 3 && hasThreeInRegion && (actingPlayer?.money || 0) >= space.developmentCost;

  const mortgageVal = getMortgageValue(space);
  const unmortgageCost = getUnmortgageCost(space);
  const bankSellVal = getBankSellValue(space, gameState);
  const canUnmortgage = isOwner && space.mortgaged && (actingPlayer?.money || 0) >= unmortgageCost;

  const tierNames = ['Level 0 (Base)', 'Level 1 Upgrade', 'Level 2 Expansion', 'Level 3 Mega-Complex'];
  const levelMultipliers = [1.0, 2.2, 4.0, 6.5];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/90 rounded-3xl p-6 shadow-2xl text-slate-100 font-sans max-h-[92vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{space.flag}</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white uppercase font-display">
                  {space.name}
                </h2>
                {space.mortgaged && (
                  <span className="px-2 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono font-bold">
                    MORTGAGED
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono text-slate-400">{space.country}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Region & Industry Pill */}
        <div className="flex items-center gap-2 mb-4">
          {regionCfg && (
            <span
              className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-black uppercase"
              style={{ backgroundColor: `${regionCfg.color}22`, color: regionCfg.color, border: `1px solid ${regionCfg.color}44` }}
            >
              {regionCfg.name} Region
            </span>
          )}
          {space.specializationLabel && (
            <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 text-[10px] font-mono">
              ⚡ {space.specializationLabel}
            </span>
          )}
        </div>

        {/* Financial Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 text-xs font-mono mb-4">
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[9px] text-slate-500 block uppercase font-bold">BASE PRICE</span>
            <span className="text-white font-extrabold">{formatCurrency(space.price)}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[9px] text-slate-500 block uppercase font-bold">DYNAMIC RENT</span>
            <span className="text-amber-300 font-extrabold text-sm block">
              {space.mortgaged ? '$0 (Mortgaged)' : formatCurrency(rentBreakdown.finalRent)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[9px] text-slate-500 block uppercase font-bold">MARKET VALUE</span>
            <span className="text-cyan-400 font-extrabold">{formatCurrency(marketVal)}</span>
          </div>
        </div>

        {/* Dynamic Rent Multiplier & Crisis Shift Indicator */}
        <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 mb-4 font-mono text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> RENT ECONOMIC MODIFIER
            </span>
            {rentBreakdown.percentChange !== 0 ? (
              <span
                className={`px-2.5 py-0.5 rounded-full font-black text-xs flex items-center gap-1 ${
                  rentBreakdown.percentChange > 0
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-glow-emerald'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {rentBreakdown.percentChange > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {rentBreakdown.percentChange > 0 ? `+${rentBreakdown.percentChange}% SURGE` : `${rentBreakdown.percentChange}% CRISIS CUT`}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold text-[10px]">
                BASELINE (1.0x)
              </span>
            )}
          </div>

          {/* Contributing Factors List */}
          <div className="space-y-1.5 text-[11px] pt-1">
            <div className="flex justify-between text-slate-400">
              <span>Standard Base Property Rent:</span>
              <span className="text-white font-bold">{formatCurrency(space.baseRent)}</span>
            </div>

            {rentBreakdown.factors.map((f, i) => (
              <div key={i} className="flex justify-between items-center text-[10px]">
                <span className="text-slate-300">• {f.name}:</span>
                <span className={`font-black ${f.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {f.percent}
                </span>
              </div>
            ))}

            <div className="flex justify-between pt-1 border-t border-slate-800 text-xs font-black">
              <span className="text-slate-200">Current Payable Rent:</span>
              <span className="text-amber-300 text-sm">{formatCurrency(rentBreakdown.finalRent)}</span>
            </div>
          </div>
        </div>

        {/* Tier Rent Yield Matrix */}
        {space.type === 'city' && (
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 mb-4 font-mono text-xs">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-2">
              DEVELOPMENT TIER PROGRESSION:
            </span>
            <div className="space-y-1 text-[11px]">
              {tierNames.map((tier, idx) => {
                const isCurrent = space.level === idx;
                const tierRent = Math.round(space.baseRent * levelMultipliers[idx] * (gameState.market?.multiplier || 1.0));
                return (
                  <div
                    key={idx}
                    className={`p-1.5 rounded-lg flex items-center justify-between ${
                      isCurrent
                        ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    <span>{tier} {isCurrent && '★ CURRENT'}</span>
                    <span>{formatCurrency(tierRent)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ownership Status Banner */}
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 mb-4 flex items-center justify-between font-mono text-xs">
          <span className="text-slate-400 uppercase text-[10px]">OWNERSHIP STATUS:</span>
          {ownerPlayer ? (
            <div className="flex items-center gap-1.5 font-bold">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ownerPlayer.color }} />
              <span className="text-white uppercase">{ownerPlayer.name}</span>
            </div>
          ) : (
            <span className="text-emerald-400 font-bold uppercase">UNOWNED / AVAILABLE</span>
          )}
        </div>

        {/* 3-Set Requirement Notice for Upgrades */}
        {isOwner && space.type === 'city' && space.level < 3 && !hasThreeInRegion && (
          <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/40 mb-4 text-[10px] font-mono text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <span className="font-bold block">3-SET PROTOCOL REQUIRED:</span>
              You must own at least 3 properties in {space.region?.toUpperCase()} to develop (currently own {ownedInRegionCount}/3).
            </div>
          </div>
        )}

        {/* Action Controls for Owner */}
        {isOwner && (
          <div className="space-y-2 pt-2 border-t border-slate-800 font-mono text-xs">
            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
              COMMANDER ACTIONS:
            </span>

            <div className="grid grid-cols-2 gap-2">
              {space.type === 'city' && (
                <button
                  onClick={() => {
                    onUpgrade(space.index);
                    onClose();
                  }}
                  disabled={!canUpgrade}
                  className={`py-2.5 px-3 rounded-xl font-bold uppercase flex items-center justify-center gap-1.5 transition-all ${
                    canUpgrade
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30 shadow-glow-amber cursor-pointer'
                      : 'bg-slate-950 text-slate-600 border border-slate-800 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  {space.level >= 3 ? 'MAX TIER' : `UPGRADE (${formatCurrency(space.developmentCost)})`}
                </button>
              )}

              {space.mortgaged ? (
                <button
                  onClick={() => {
                    onUnmortgage(space.index);
                    onClose();
                  }}
                  disabled={!canUnmortgage}
                  className={`py-2.5 px-3 rounded-xl font-bold uppercase flex items-center justify-center gap-1.5 transition-all ${
                    canUnmortgage
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30 shadow-glow-emerald cursor-pointer'
                      : 'bg-slate-950 text-slate-600 border border-slate-800 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <RotateCcw className="w-4 h-4" /> UNMORTGAGE ({formatCurrency(unmortgageCost)})
                </button>
              ) : (
                <button
                  onClick={() => {
                    onMortgage(space.index);
                    onClose();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 font-bold uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Landmark className="w-4 h-4" /> MORTGAGE (+{formatCurrency(mortgageVal)})
                </button>
              )}

              <button
                onClick={() => {
                  onSellToBank(space.index);
                  onClose();
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-rose-300 hover:border-rose-500/40 font-bold uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <DollarSign className="w-4 h-4" /> SELL ({formatCurrency(bankSellVal)})
              </button>

              <button
                onClick={() => {
                  onStartAuction(space.index);
                  onClose();
                }}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border border-purple-500/50 text-purple-300 hover:bg-purple-600/40 font-bold uppercase flex items-center justify-center gap-1.5 shadow-glow-purple transition-all cursor-pointer"
              >
                <Gavel className="w-4 h-4" /> AUCTION PROPERTY
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
