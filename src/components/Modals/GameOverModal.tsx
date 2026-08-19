import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameState, Player } from '../../types';
import { calculatePlayerNetWorth } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatting';
import { Trophy, Play, RotateCcw, Award, Crown, TrendingUp, Building2 } from 'lucide-react';

interface GameOverModalProps {
  gameState: GameState;
  onPlayAgain: () => void;
  onNewGame: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  gameState,
  onPlayAgain,
  onNewGame,
}) => {
  const winner = gameState.winner || gameState.players[0];

  useEffect(() => {
    // Launch celebratory confetti
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#a855f7', '#10b981', '#f59e0b', '#ec4899'],
      });
    } catch {}
  }, []);

  // Sort players by final Net Worth
  const rankedPlayers = [...gameState.players].sort(
    (a, b) => calculatePlayerNetWorth(b, gameState) - calculatePlayerNetWorth(a, gameState)
  );

  const winnerNetWorth = winner ? calculatePlayerNetWorth(winner, gameState) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300 select-none">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/90 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 font-sans flex flex-col items-center max-h-[92vh] overflow-y-auto">
        {/* Trophy Icon */}
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 p-0.5 flex items-center justify-center shadow-glow-amber mb-4">
          <Trophy className="w-9 h-9 text-white animate-bounce" />
        </div>

        {/* Title */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-widest mb-1.5">
          SEASON CONCLUDED
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white uppercase font-display tracking-tight text-center">
          WORLD TYCOON CROWNED
        </h1>
        <p className="text-xs font-mono text-slate-400 text-center mb-6">
          Global financial dominance achieved over {gameState.round} simulation rounds.
        </p>

        {/* Winner Highlight Card */}
        <div className="w-full p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-950/80 to-slate-950/80 border border-amber-500/40 shadow-xl mb-6 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-black text-white uppercase font-display">
              {winner?.name}
            </h2>
          </div>

          <div className="text-xs font-mono text-amber-300 font-bold mb-4">
            VICTORIOUS GLOBAL EMPIRE
          </div>

          <div className="w-full grid grid-cols-3 gap-2 font-mono text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[9px] text-slate-500 block">FINAL NET WORTH</span>
              <span className="font-extrabold text-cyan-400 text-sm">
                {formatCurrency(winnerNetWorth)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[9px] text-slate-500 block">TREASURY CASH</span>
              <span className="font-extrabold text-emerald-400 text-sm">
                {formatCurrency(winner?.money || 0)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[9px] text-slate-500 block">ASSETS OWNED</span>
              <span className="font-extrabold text-amber-300 text-sm">
                {winner?.properties.length || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Global Leaderboard Table */}
        <div className="w-full mb-6">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider block mb-2">
            FINAL STANDINGS
          </span>
          <div className="space-y-1.5 font-mono text-xs">
            {rankedPlayers.map((player, idx) => {
              const nw = calculatePlayerNetWorth(player, gameState);
              const isWin = player.id === winner?.id;

              return (
                <div
                  key={player.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                    isWin
                      ? 'bg-amber-950/20 border-amber-500/50 text-white font-bold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-500 w-4">#{idx + 1}</span>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: player.color }} />
                    <span className="truncate">{player.name}</span>
                    {player.bankrupt && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-400 border border-rose-800">
                        BANKRUPT
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="font-extrabold text-white">{formatCurrency(nw)}</span>
                    <span className="text-[9px] text-slate-500 ml-2">
                      ({player.properties.length} props)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full grid grid-cols-2 gap-3">
          <button
            onClick={onNewGame}
            className="py-3 px-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" /> Return to Lobby
          </button>

          <button
            onClick={onPlayAgain}
            className="py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-mono font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow-cyan transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" /> Rematch
          </button>
        </div>
      </div>
    </div>
  );
};
