import React, { useState } from 'react';
import { GameState, Player, StockCompany, StockMarketOutcome } from '../../types';
import { STOCK_COMPANIES } from '../../data/stockData';
import { formatCurrency } from '../../utils/formatting';
import { audio } from '../../game/audioEngine';
import {
  Flame,
  Zap,
  Skull,
  Trophy,
  ShieldAlert,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  Building2,
  PieChart,
} from 'lucide-react';

interface StockMarketModalProps {
  gameState: GameState;
  myPlayer?: Player;
  onInvest: (playerId: string, companyId: string, amount: number) => void;
  onDismiss: () => void;
}

export const StockMarketModal: React.FC<StockMarketModalProps> = ({
  gameState,
  myPlayer,
  onInvest,
  onDismiss,
}) => {
  const stockState = gameState.stockMarket;
  const isPassAndPlay = gameState.config.mode === 'pass_and_play';

  const activePlayer = isPassAndPlay
    ? gameState.players[gameState.turnIndex]
    : myPlayer || gameState.players[0];

  const availableCash = activePlayer ? activePlayer.money : 0;
  const playerInvestments = activePlayer ? stockState.investments[activePlayer.id] || [] : [];
  const totalInvestedByPlayer = playerInvestments.reduce((sum, inv) => sum + inv.amount, 0);

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(STOCK_COMPANIES[0].id);
  const [investAmount, setInvestAmount] = useState<number>(0);

  const selectedCompany = STOCK_COMPANIES.find((c) => c.id === selectedCompanyId) || STOCK_COMPANIES[0];
  const existingStakeInSelected = playerInvestments.find((i) => i.companyId === selectedCompany.id)?.amount || 0;

  const handleConfirmInvestment = () => {
    if (!activePlayer || investAmount <= 0 || investAmount > availableCash) return;
    onInvest(activePlayer.id, selectedCompany.id, investAmount);
    setInvestAmount(0);
  };

  const outcomes = stockState.lastOutcome;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-3xl bg-[#080d1e] border border-amber-500/50 rounded-3xl p-4 sm:p-6 shadow-[0_25px_80px_rgba(0,0,0,0.9),0_0_40px_rgba(245,158,11,0.25)] text-slate-100 font-sans max-h-[94vh] overflow-y-auto flex flex-col items-center">
        {/* Top Header Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] sm:text-xs font-mono font-black uppercase tracking-widest mb-2 shadow-glow-amber">
          <Flame className="w-4 h-4 text-orange-400 animate-bounce" /> HIGH-RISK MULTI-SECTOR STOCK EXCHANGE
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white uppercase font-display tracking-tight text-center">
          {outcomes ? 'MARKET RESOLUTION REPORT' : 'SOVEREIGN ENTERPRISE EXCHANGE'}
        </h2>
        <p className="text-[11px] sm:text-xs font-mono text-slate-400 text-center mb-4 max-w-xl">
          {outcomes
            ? 'The high-volatility trading window has closed. Inspect individual enterprise returns and outcomes below.'
            : `Exchange open for ${stockState.roundsRemaining} remaining round${stockState.roundsRemaining > 1 ? 's' : ''}! Pick companies, allocate capital, and brace for extreme market swings.`}
        </p>

        {/* ----------------------------------------------------
            VIEW 1: RESOLUTION REPORT (IF MARKET JUST CLOSED)
        ---------------------------------------------------- */}
        {outcomes ? (
          <div className="w-full space-y-3 font-mono text-xs mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {outcomes.map((out, idx) => (
                <div
                  key={`${out.playerId}-${out.companyId}-${idx}`}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-2.5 ${
                    out.isWin
                      ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300 shadow-glow-emerald'
                      : 'bg-rose-950/30 border-rose-500/50 text-rose-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{out.companyIcon}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-white text-xs">{out.companyTicker}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                            {out.playerName}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">{out.companyName}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black block">
                        {out.multiplier >= 1.0
                          ? `+${((out.multiplier - 1) * 100).toFixed(0)}% GAIN`
                          : `-${((1 - out.multiplier) * 100).toFixed(0)}% CRASH`}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Invested: {formatCurrency(out.invested)}
                      </span>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-black/40 text-[10px] text-slate-300 leading-snug">
                    {out.headline}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px] font-bold">
                    <span className="text-slate-400">Total Payout:</span>
                    <span className="font-mono font-black text-white text-xs">
                      {formatCurrency(out.returned)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onDismiss}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-glow-amber transition-all cursor-pointer mt-4"
            >
              Acknowledge Market Report & Return to Board
            </button>
          </div>
        ) : (
          /* ----------------------------------------------------
              VIEW 2: ACTIVE TRADING & COMPANY SELECTOR
          ---------------------------------------------------- */
          <div className="w-full flex flex-col gap-4 font-mono text-xs">
            {/* Player Treasury & Active Stake Summary Banner */}
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-950/90 border border-slate-800 text-center">
              <div>
                <span className="text-[9px] text-slate-500 uppercase block font-bold">ACTIVE COMMANDER</span>
                <span className="text-xs font-black text-white truncate block">{activePlayer?.name}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase block font-bold">AVAILABLE CASH</span>
                <span className="text-xs font-black text-emerald-400">{formatCurrency(availableCash)}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase block font-bold">TOTAL STAKE COMMITTED</span>
                <span className="text-xs font-black text-amber-300">{formatCurrency(totalInvestedByPlayer)}</span>
              </div>
            </div>

            {/* Company Selection Cards */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" /> SELECT TARGET ENTERPRISE:
                </span>
                <span className="text-[9px] text-slate-500 font-mono">7 Listed Global Sectors</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {STOCK_COMPANIES.map((company) => {
                  const isSelected = company.id === selectedCompany.id;
                  const stakeInCompany = playerInvestments.find((i) => i.companyId === company.id)?.amount || 0;

                  return (
                    <button
                      key={company.id}
                      onClick={() => setSelectedCompanyId(company.id)}
                      className={`
                        p-2.5 rounded-2xl border text-left flex flex-col justify-between gap-1.5 transition-all cursor-pointer relative overflow-hidden
                        ${
                          isSelected
                            ? 'bg-slate-900 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] ring-1 ring-amber-400'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl">{company.icon}</span>
                        <span
                          className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                            company.volatility === 'EXTREME'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {company.volatility}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-black text-white text-xs">{company.ticker}</span>
                          <span className="text-[9px] text-slate-400 truncate">{company.name}</span>
                        </div>
                        <div className="text-[8px] text-cyan-400 font-bold truncate">{company.sectorLabel}</div>
                      </div>

                      {stakeInCompany > 0 && (
                        <div className="mt-1 pt-1 border-t border-slate-800 flex items-center justify-between text-[9px]">
                          <span className="text-slate-500">Your Stake:</span>
                          <span className="font-bold text-amber-300">{formatCurrency(stakeInCompany)}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Company Deep-Dive & Investment Terminal */}
            <div className="p-4 rounded-3xl bg-slate-950/95 border border-cyan-500/30 space-y-3 shadow-inner">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{selectedCompany.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-white text-sm uppercase">{selectedCompany.name}</h4>
                      <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[9px] font-black">
                        ${selectedCompany.ticker}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">{selectedCompany.description}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[9px] text-slate-500 block uppercase">STAKE IN {selectedCompany.ticker}</span>
                  <span className="text-sm font-black text-amber-300">{formatCurrency(existingStakeInSelected)}</span>
                </div>
              </div>

              {/* Investment Amount Slider & Controls (Default initialized at $0) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                  <span>AMOUNT TO ALLOCATE:</span>
                  <span className="text-amber-300 font-black text-base font-mono">
                    {formatCurrency(investAmount)}
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max={availableCash}
                  step="25"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-900 rounded-lg"
                />

                {/* Quick Preset Buttons */}
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  <button
                    onClick={() => setInvestAmount(0)}
                    className="py-1.5 px-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 font-bold text-[10px] uppercase transition-all cursor-pointer"
                  >
                    CLEAR $0
                  </button>
                  {[100, 250, 500].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setInvestAmount(Math.min(availableCash, amt))}
                      className="py-1.5 px-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-slate-300 font-bold text-[10px] uppercase transition-all cursor-pointer"
                    >
                      +${amt}
                    </button>
                  ))}
                  <button
                    onClick={() => setInvestAmount(availableCash)}
                    className="py-1.5 px-2 rounded-xl bg-slate-900 border border-amber-500/40 hover:border-amber-400 text-amber-300 font-bold text-[10px] uppercase transition-all cursor-pointer"
                  >
                    MAX CASH
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={onDismiss}
                  className="py-3 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white font-bold text-xs uppercase transition-all cursor-pointer"
                >
                  CLOSE EXCHANGE WINDOW
                </button>

                <button
                  onClick={handleConfirmInvestment}
                  disabled={investAmount <= 0 || investAmount > availableCash}
                  className={`py-3 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-glow-amber cursor-pointer ${
                    investAmount > 0 && investAmount <= availableCash
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white active:scale-95'
                      : 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <Zap className="w-4 h-4 fill-white" /> ALLOCATE {formatCurrency(investAmount)} TO {selectedCompany.ticker}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
