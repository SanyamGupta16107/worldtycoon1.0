import React from 'react';
import { BoardSpace, GameState, Player, REGION_CONFIG } from '../../types';
import { getDetailedPropertyRent } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatting';
import { Plane, Ship, Train, Landmark, Factory, Wheat, Fuel, Diamond, Cpu, TrendingUp, TrendingDown } from 'lucide-react';

interface SpaceCellProps {
  space: BoardSpace;
  gridRow: number;
  gridCol: number;
  isCorner: boolean;
  side: 'top' | 'right' | 'bottom' | 'left' | 'corner';
  ownerPlayer?: Player;
  gameState: GameState;
  onClick: (index: number) => void;
}

export const SpaceCell: React.FC<SpaceCellProps> = ({
  space,
  gridRow,
  gridCol,
  isCorner,
  ownerPlayer,
  gameState,
  onClick,
}) => {
  const isPending = gameState.pendingSpace?.index === space.index;
  const isAuctionTarget = gameState.auction?.spaceIndex === space.index;
  const regionCfg = space.region ? REGION_CONFIG[space.region] : null;
  const rentDetails = getDetailedPropertyRent(space, gameState);

  // Render Corner Space
  if (isCorner) {
    let cornerBg = 'bg-slate-900/90 border-slate-700/80';
    let titleColor = 'text-white';

    if (space.type === 'start') {
      cornerBg = 'bg-gradient-to-br from-cyan-950/90 via-slate-900/95 to-slate-900/90 border-cyan-500/60 shadow-glow-cyan';
      titleColor = 'text-cyan-300';
    } else if (space.type === 'financial_hub') {
      cornerBg = 'bg-gradient-to-br from-amber-950/90 via-slate-900/95 to-slate-900/90 border-amber-500/60 shadow-glow-amber';
      titleColor = 'text-amber-300';
    } else if (space.type === 'auction') {
      cornerBg = 'bg-gradient-to-br from-purple-950/90 via-slate-900/95 to-slate-900/90 border-purple-500/60 shadow-glow-purple';
      titleColor = 'text-purple-300';
    } else if (space.type === 'free_trade') {
      cornerBg = 'bg-gradient-to-br from-emerald-950/90 via-slate-900/95 to-slate-900/90 border-emerald-500/60 shadow-glow-emerald';
      titleColor = 'text-emerald-300';
    }

    return (
      <div
        id={`space-${space.index}`}
        style={{ gridRow, gridColumn: gridCol }}
        onClick={() => onClick(space.index)}
        className={`
          relative flex flex-col items-center justify-between p-1 sm:p-1.5 rounded-2xl border backdrop-blur-xl transition-all duration-200 cursor-pointer select-none overflow-hidden group
          ${cornerBg}
          ${isPending || isAuctionTarget ? 'ring-2 ring-purple-400 animate-pulse scale-[1.03]' : 'hover:scale-[1.02]'}
        `}
      >
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-400/40 rounded-tl" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyan-400/40 rounded-tr" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyan-400/40 rounded-bl" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-400/40 rounded-br" />

        <div className="text-base sm:text-xl xl:text-2xl mt-0.5 group-hover:scale-110 transition-transform leading-none">
          {space.type === 'auction' ? '🏛️' : space.flag}
        </div>

        <div className="text-center w-full px-0.5 z-10 flex flex-col items-center justify-center">
          <div className={`font-black text-[8px] sm:text-[9px] xl:text-[10.5px] leading-[1.1] uppercase font-display break-words max-w-full ${titleColor}`}>
            {space.name}
          </div>
          {space.type === 'start' && (
            <div className="text-[7px] sm:text-[8px] xl:text-[9px] font-mono text-cyan-400 font-extrabold mt-0.5">
              +{formatCurrency(gameState.config.startSalary || 200)}
            </div>
          )}
          {space.type === 'auction' && (
            <div className="text-[6.5px] sm:text-[7.5px] font-mono text-purple-300 font-bold mt-0.5">
              LIVE BIDDING
            </div>
          )}
        </div>

        <div className="text-[6px] sm:text-[7.5px] font-mono text-slate-400 uppercase tracking-widest text-center truncate max-w-full">
          {space.country}
        </div>
      </div>
    );
  }

  const getSpecializationIcon = () => {
    switch (space.specialization) {
      case 'finance': return <Landmark className="w-2.5 h-2.5 text-amber-300" />;
      case 'technology': return <Cpu className="w-2.5 h-2.5 text-cyan-300" />;
      case 'luxury': return <Diamond className="w-2.5 h-2.5 text-pink-300" />;
      case 'energy': return <Fuel className="w-2.5 h-2.5 text-orange-300" />;
      case 'manufacturing': return <Factory className="w-2.5 h-2.5 text-blue-300" />;
      case 'agri': return <Wheat className="w-2.5 h-2.5 text-emerald-300" />;
      case 'shipping': return <Ship className="w-2.5 h-2.5 text-sky-300" />;
      case 'logistics': return <Plane className="w-2.5 h-2.5 text-indigo-300" />;
      default: return null;
    }
  };

  return (
    <div
      id={`space-${space.index}`}
      style={{
        gridRow,
        gridColumn: gridCol,
        borderColor: ownerPlayer ? `${ownerPlayer.color}aa` : undefined,
        boxShadow: ownerPlayer ? `0 0 12px ${ownerPlayer.color}40` : undefined,
      }}
      onClick={() => onClick(space.index)}
      className={`
        relative flex flex-col justify-between rounded-xl border backdrop-blur-xl transition-all duration-150 cursor-pointer select-none overflow-hidden group min-w-0
        ${ownerPlayer ? 'bg-slate-900/95' : 'bg-[#090e1c]/90 border-slate-800/90 hover:border-slate-600'}
        ${space.mortgaged ? 'opacity-70 grayscale-[35%]' : ''}
        ${isPending || isAuctionTarget ? 'ring-2 ring-cyan-400 animate-pulse scale-[1.03]' : 'hover:scale-[1.02]'}
      `}
    >
      {/* Top Region Stripe with 3D Skyscraper Tier Beacons */}
      <div
        className="w-full h-1.5 sm:h-2 xl:h-2.5 shrink-0 relative flex items-center justify-center overflow-hidden"
        style={{
          backgroundColor: regionCfg?.color || (space.type === 'transport' ? '#38bdf8' : '#64748b'),
        }}
      >
        {space.level > 0 && (
          <div className="absolute inset-0 flex items-center justify-center gap-0.5 bg-black/50 backdrop-blur-2xs">
            {Array.from({ length: space.level }).map((_, i) => (
              <span
                key={i}
                className="w-1 sm:w-1.5 bg-amber-300 rounded-t-xs shadow-glow-amber animate-pulse"
                style={{ height: `${5 + i * 2}px` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col items-center justify-between p-0.5 sm:p-1 text-center min-h-0 min-w-0 w-full overflow-hidden">
        {/* Flag & Micro Specialization Icon */}
        <div className="flex items-center justify-center gap-0.5 text-[11px] sm:text-xs xl:text-sm leading-none group-hover:scale-105 transition-transform shrink-0">
          {space.type === 'transport' ? (
            space.name.includes('Airport') ? <Plane className="w-3 h-3 text-sky-400" /> :
            space.name.includes('Rail') ? <Train className="w-3 h-3 text-emerald-400" /> :
            <Ship className="w-3 h-3 text-cyan-400" />
          ) : space.type === 'tax' ? (
            <span className="text-[11px]">🏛️</span>
          ) : space.type === 'world_event' ? (
            <span className="text-[11px]">📡</span>
          ) : space.type === 'market_shock' ? (
            <span className="text-[11px]">⚡</span>
          ) : (
            <>
              <span>{space.flag}</span>
              <span className="hidden sm:inline-block opacity-80">{getSpecializationIcon()}</span>
            </>
          )}
        </div>

        {/* Property Full Name (No clipping, multi-line wrap enabled) */}
        <div className="w-full px-0.5 my-auto flex items-center justify-center">
          <div className="font-extrabold text-[7px] sm:text-[8px] xl:text-[9.5px] text-white leading-[1.05] uppercase font-sans break-words text-center max-w-full">
            {space.name}
          </div>
        </div>

        {/* Dynamic Rent / Price / Dynamic Percent Multiplier */}
        <div className="w-full font-mono shrink-0">
          {space.mortgaged ? (
            <span className="text-[6px] sm:text-[7px] font-bold text-amber-400 uppercase bg-amber-950/60 px-1 rounded block">
              MORTGAGED
            </span>
          ) : ownerPlayer ? (
            <div className="flex flex-col items-center leading-none">
              <div className="flex items-center justify-center gap-0.5">
                <span className="text-[7.5px] sm:text-[8.5px] xl:text-[9.5px] font-black text-amber-300">
                  {formatCurrency(rentDetails.finalRent)}
                </span>
                {rentDetails.percentChange !== 0 && (
                  <span
                    className={`text-[6px] sm:text-[6.5px] font-bold flex items-center ${
                      rentDetails.percentChange > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {rentDetails.percentChange > 0 ? '+' : ''}{rentDetails.percentChange}%
                  </span>
                )}
              </div>
            </div>
          ) : space.price > 0 ? (
            <div className="text-[7.5px] sm:text-[8.5px] xl:text-[9px] font-bold text-cyan-300 leading-none">
              {formatCurrency(space.price)}
            </div>
          ) : (
            <div className="text-[6.5px] sm:text-[7px] font-bold text-slate-400 uppercase tracking-tighter leading-none">
              {space.type.replace('_', ' ')}
            </div>
          )}
        </div>
      </div>

      {ownerPlayer && (
        <div
          className="w-full h-1 sm:h-1.5 shrink-0"
          style={{ backgroundColor: ownerPlayer.color }}
        />
      )}
    </div>
  );
};
