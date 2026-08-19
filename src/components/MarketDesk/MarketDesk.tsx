import React from 'react';
import { GameState, REGION_CONFIG, RegionGroup } from '../../types';
import { getRegionHoldingsCount } from '../../utils/calculations';
import { formatPercentage } from '../../utils/formatting';
import { TrendingUp, Radio, Compass, Clock, Activity, BarChart2, ShieldAlert, Sparkles } from 'lucide-react';

interface MarketDeskProps {
  gameState: GameState;
}

export const MarketDesk: React.FC<MarketDeskProps> = ({ gameState }) => {
  const { market, regionalEvents, round, config } = gameState;

  const activeRegionalNews = Object.values(regionalEvents).filter((ev): ev is NonNullable<typeof ev> => ev !== null);
  const regions: RegionGroup[] = ['europe', 'middle_east', 'asia', 'americas'];
  const roundProgress = Math.min(100, Math.round((round / config.roundLimit) * 100));

  // Dynamic SVG Area Chart Coordinates based on market history
  const history = market.history || [1.0, 1.1, 1.0, 1.2, 1.5];
  const minVal = Math.min(...history, 0.5);
  const maxVal = Math.max(...history, 1.6);
  const chartPoints = history.map((val, idx) => {
    const x = (idx / (history.length - 1 || 1)) * 260 + 10;
    const y = 65 - ((val - minVal) / (maxVal - minVal || 1)) * 45;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `10,65 ${chartPoints} 270,65`;

  return (
    <aside className="w-full lg:w-72 xl:w-80 flex flex-col gap-3.5 p-3.5 sm:p-4 rounded-3xl bg-[#080d1e]/85 border border-cyan-500/30 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(6,182,212,0.06)] font-sans select-none overflow-y-auto max-h-full">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-black tracking-widest text-white uppercase font-display">
              GLOBAL INTELLIGENCE
            </h3>
            <p className="text-[9px] font-mono text-cyan-400 font-bold">Market Desk Terminal</p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-glow-emerald">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> LIVE
        </span>
      </div>

      {/* 1. Market Situation & Dynamic Real-Time SVG Graph */}
      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> MARKET SITUATION
          </span>
          <span className="text-[9px] font-mono text-slate-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            INDEX: {(market.multiplier * 100).toFixed(0)} PTS
          </span>
        </div>

        <div className="mb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black tracking-tight text-white uppercase font-display">
              {market.title}
            </span>
            <span
              className="text-xs font-mono font-black px-2 py-0.5 rounded"
              style={{
                backgroundColor:
                  market.condition === 'BOOM'
                    ? 'rgba(16,185,129,0.15)'
                    : market.condition === 'CRASH'
                    ? 'rgba(239,68,68,0.15)'
                    : 'rgba(6,182,212,0.15)',
                color:
                  market.condition === 'BOOM'
                    ? '#10b981'
                    : market.condition === 'CRASH'
                    ? '#ef4444'
                    : '#06b6d4',
              }}
            >
              {formatPercentage(market.multiplier)}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono leading-relaxed mt-1">
            {market.description}
          </p>
        </div>

        {/* Dynamic Real-Time SVG Chart */}
        <div className="w-full h-16 bg-slate-950 rounded-xl border border-slate-800/90 p-1 mb-2 relative overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 280 70" preserveAspectRatio="none">
            <defs>
              <linearGradient id="marketGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Area */}
            <polygon points={areaPoints} fill="url(#marketGrad)" />
            {/* Line */}
            <polyline points={chartPoints} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <div className="absolute top-1 left-2 text-[8px] font-mono text-cyan-400 font-bold opacity-75">
            TREND PULSE
          </div>
        </div>

        {/* Market Multiplier / Stability Meter */}
        <div className="w-full">
          <div className="flex justify-between text-[9px] font-mono text-slate-500 mb-1">
            <span>CYCLE: {market.condition}</span>
            <span>{market.durationRounds} R REMAINING</span>
          </div>
          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full rounded-full transition-all duration-500 shadow-glow-cyan"
              style={{
                width: `${Math.min(100, market.multiplier * 66)}%`,
                backgroundColor:
                  market.condition === 'BOOM'
                    ? '#10b981'
                    : market.condition === 'CRASH'
                    ? '#ef4444'
                    : '#06b6d4',
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. Regional News */}
      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-amber-400" /> REGIONAL NEWS
          </span>
          <span className="text-[9px] font-mono text-amber-400 font-bold">
            {activeRegionalNews.length > 0 ? `${activeRegionalNews.length} ACTIVE` : 'EQUILIBRIUM'}
          </span>
        </div>

        {activeRegionalNews.length > 0 ? (
          <div className="space-y-2">
            {activeRegionalNews.map((news) => {
              const regCfg = REGION_CONFIG[news.region];
              return (
                <div
                  key={news.id}
                  className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[10px] font-mono shadow-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="font-black text-[9px] uppercase px-2 py-0.5 rounded"
                      style={{ backgroundColor: `${regCfg.color}22`, color: regCfg.color }}
                    >
                      {regCfg.name}
                    </span>
                    <span className="text-slate-500 text-[9px] font-bold">{news.roundsRemaining} R left</span>
                  </div>
                  <div className="font-bold text-white leading-tight mb-1">{news.headline}</div>
                  <p className="text-slate-400 text-[9px] leading-snug">{news.description}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 text-center">
            <p className="text-[10px] font-mono text-slate-500 leading-relaxed">
              No regional shock is active. Headlines will appear when the world market moves.
            </p>
          </div>
        )}
      </div>

      {/* 3. World Regions Ownership Meter */}
      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-sm">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-indigo-400" /> WORLD REGIONS
          </span>
        </div>

        <div className="space-y-2 font-mono">
          {regions.map((regKey) => {
            const cfg = REGION_CONFIG[regKey];
            const { owned, total } = getRegionHoldingsCount(regKey, gameState.spaces);
            const percent = total > 0 ? Math.round((owned / total) * 100) : 0;

            return (
              <div key={regKey} className="text-[10px]">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-200 uppercase">{cfg.name}</span>
                  <span className="text-slate-400 font-extrabold">
                    {owned} <span className="text-slate-600 font-normal">/ {total} owned</span>
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: cfg.color,
                      boxShadow: `0 0 8px ${cfg.color}88`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Season Clock */}
      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" /> SEASON CLOCK
          </span>
          <span className="text-cyan-400 font-black text-xs font-mono bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
            {round.toString().padStart(2, '0')} / {config.roundLimit.toString().padStart(2, '0')}
          </span>
        </div>

        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 mb-2">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-300 shadow-glow-cyan"
            style={{ width: `${roundProgress}%` }}
          />
        </div>

        <p className="text-[9px] font-mono text-slate-500 leading-relaxed">
          The season ends when the final round closes or only one solvent empire remains.
        </p>
      </div>
    </aside>
  );
};
