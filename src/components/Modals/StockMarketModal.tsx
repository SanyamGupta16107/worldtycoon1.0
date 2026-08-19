import React, { useState } from 'react';
import { GameState, Player, StockMarketOutcome } from '../../types';
import { formatCurrency } from '../../utils/formatting';
import { audio } from '../../game/audioEngine';
import { TrendingUp, Flame, AlertTriangle, ArrowRight, DollarSign, Zap, Skull, Trophy, X, ShieldAlert } from 'lucide-react';

interface StockMarketModalProps {
  gameState: GameState;
  onInvest: (playerId: string, amount: number) => void;
  onDismiss: () => void;
}

export const StockMarketModal: React.FC<StockMarketModalProps> = ({
  gameState,
  onInvest,
  onDismiss,
}) => {
  const stockState = gameState.stockMarket;
  const isPassAndPlay = gameState.config.mode === 'pass_and_play';
  const humanPlayer = isPassAndPlay
    ? gameState.players[gameState.turnIndex]
    : gameState.players.find(p => !p.isAI) || gameState.players[0];

  const currentInvested = humanPlayer ? stockState.investments[humanPlayer.id] || 0 : 0;
  const availableCash = humanPlayer ? humanPlayer.money : 0;

  const [investAmount, setInvestAmount] = useState<number>(() => Math.round(availableCash * 0.25));

  const handleConfirmInvestment = () => {
    if (!humanPlayer || investAmount <= 0) return;
    onInvest(humanPlayer.id, investAmount);
    audio.playCashRegister();
    onDismiss();
  };

  const outcomes = stockState.lastOutcome;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_30px_rgba(245,158,11,0.2)] text-slate-100 font-sans max-h-[92vh] overflow-y-auto flex flex-col items-center">
        {/* Top Header */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-black uppercase tracking-widest mb-3 shadow-glow-amber">
          <Flame className="w-3.5 h-3.5 text-orange-400 animate-bounce" /> HIGH-RISK GLOBAL STOCK EXCHANGE
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white uppercase font-display tracking-tight text-center mb-1">
          {outcomes ? 'MARKET RESOLUTION REPORT' : 'SPECULATIVE TRADING WINDOW'}
        </h2>
        <p className="text-xs font-mono text-slate-400 text-center mb-5">
          {outcomes
            ? 'The high-volatility trading window has closed. Inspect empire outcomes below.'
            : 'Extreme risk exchange active for 2 rounds. Rags to riches or complete liquidity wipeout!'}
        </p>

        {/* OUTCOMES VIEW (IF MARKET JUST CLOSED) */}
        {outcomes ? (
          <div className="w-full space-y-3 font-mono text-xs mb-6">
            {outcomes.map((out) => (
              <div
                key={out.playerId}
                className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                  out.isWin
                    ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300 shadow-glow-emerald'
                    : 'bg-rose-950/30 border-rose-500/50 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {out.isWin ? (
                    <Trophy className="w-6 h-6 text-emerald-400 shrink-0" />
                  ) : (
                    <Skull className="w-6 h-6 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <span className="font-black text-white uppercase block text-xs">{out.playerName}</span>
                    <span className="text-[10px] text-slate-400">
                      Invested {formatCurrency(out.invested)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black block">
                    {out.isWin ? `+${(out.multiplier * 100).toFixed(0)}% GAIN` : `${((out.multiplier - 1) * 100).toFixed(0)}% CRASH`}
                  </span>
                  <span className="text-xs font-extrabold text-white">
                    Payout: {formatCurrency(out.returned)}
                  </span>
                </div>
              </div>
            ))}

            <button
              onClick={onDismiss}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-glow-amber transition-all cursor-pointer mt-4"
            >
              Acknowledge & Continue
            </button>
          </div>
        ) : (
          /* ACTIVE INVESTMENT WINDOW */
          <div className="w-full space-y-4 font-mono text-xs">
            {/* Risk Warnings */}
            <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/40 text-amber-300 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-[11px] text-amber-400">
                <ShieldAlert className="w-4 h-4" /> VOLATILITY SPECIFICATIONS:
              </div>
              <p className="text-[10px] text-slate-300 leading-snug">
                • <strong className="text-emerald-400">Moonshot Surge (50% Chance)</strong>: Multiply investment by <strong className="text-emerald-300">2.5x to 5.0x</strong>!
              </p>
              <p className="text-[10px] text-slate-300 leading-snug">
                • <strong className="text-rose-400">Liquidity Meltdown (50% Chance)</strong>: Lose <strong className="text-rose-300">50% to 100%</strong> of invested capital!
              </p>
            </div>

            {/* Current Position */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-slate-500 uppercase block font-bold">YOUR ACTIVE STAKE</span>
                <span className="text-sm font-black text-amber-300">{formatCurrency(currentInvested)}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-500 uppercase block font-bold">TREASURY RESERVES</span>
                <span className="text-sm font-black text-emerald-400">{formatCurrency(availableCash)}</span>
              </div>
            </div>

            {/* Investment Amount Slider & Tiers */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                <span>CHOOSE INVESTMENT:</span>
                <span className="text-amber-300 font-black text-xs">{formatCurrency(investAmount)}</span>
              </div>

              <input
                type="range"
                min="0"
                max={availableCash}
                step="25"
                value={investAmount}
                onChange={(e) => setInvestAmount(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />

              {/* Quick Percent Buttons */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[0.25, 0.5, 0.75, 1.0].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setInvestAmount(Math.round(availableCash * pct))}
                    className="py-1.5 px-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-slate-300 font-bold text-[10px] uppercase transition-all cursor-pointer"
                  >
                    {pct * 100}%
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-3">
              <button
                onClick={onDismiss}
                className="py-3 px-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white font-bold text-xs uppercase transition-all cursor-pointer"
              >
                PASS / SKIP
              </button>

              <button
                onClick={handleConfirmInvestment}
                disabled={investAmount <= 0}
                className={`py-3 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-glow-amber cursor-pointer ${
                  investAmount > 0
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white active:scale-95'
                    : 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed'
                }`}
              >
                <Zap className="w-4 h-4 fill-white" /> COMMIT {formatCurrency(investAmount)}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
