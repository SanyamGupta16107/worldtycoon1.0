import React from 'react';
import { GameState } from '../../types';
import { DiceDisplay } from './DiceDisplay';
import { Dices, Globe2, Activity, Play, Volume2, Shield, Radio, Sparkles } from 'lucide-react';

interface CenterArenaProps {
  gameState: GameState;
  onRollDice?: () => void;
  canRoll: boolean;
  isRolling: boolean;
}

export const CenterArena: React.FC<CenterArenaProps> = ({
  gameState,
  onRollDice,
  canRoll,
  isRolling,
}) => {
  const currentPlayer = gameState.players[gameState.turnIndex];
  const isHumanTurn = currentPlayer && !currentPlayer.isAI;
  const isPassAndPlay = gameState.config.mode === 'pass_and_play';
  const latestLog = gameState.logs[0]?.text || 'Roll dice to initiate global asset acquisitions.';

  return (
    <div
      style={{
        gridColumn: '2 / 9',
        gridRow: '2 / 9',
      }}
      className="m-1 rounded-3xl bg-[#080d1e]/95 border border-cyan-500/30 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(6,182,212,0.08)] flex flex-col items-center justify-between p-3 sm:p-5 text-center relative overflow-hidden select-none"
    >
      {/* Dynamic Cyber Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(6,182,212,0.14),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(168,85,247,0.1),transparent_65%)] pointer-events-none" />

      {/* Top: Brand Header & Animated Wireframe Globe Seal */}
      <div className="flex flex-col items-center z-10 w-full">
        <div className="relative w-11 h-11 sm:w-14 sm:h-14 flex items-center justify-center mb-1">
          {/* Orbital Radar Rings */}
          <div className="absolute inset-0 rounded-full border border-dashed border-cyan-500/40 animate-spin-slow" />
          <div className="absolute inset-1 rounded-full border border-purple-500/30 animate-[spin_12s_linear_infinite_reverse]" />
          
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-glow-cyan">
            <Globe2 className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-pulse" />
          </div>
        </div>

        <h2 className="text-base sm:text-lg font-black tracking-wider text-white uppercase font-display flex items-center gap-1">
          WORLD TYCOON<span className="text-cyan-400">.</span>
        </h2>
        <div className="text-[8px] sm:text-[9px] font-mono font-extrabold tracking-widest text-cyan-400/90 uppercase -mt-0.5">
          GLOBAL PROPERTY & MARKET SIMULATION
        </div>
      </div>

      {/* Middle: Active Turn Banner, 3D Dice & Action Deck */}
      <div className="flex flex-col items-center gap-2.5 z-10 my-auto w-full max-w-xs">
        {/* Turn Status Banner */}
        <div className="w-full">
          {gameState.status === 'GAME_OVER' ? (
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-mono font-extrabold uppercase tracking-wider shadow-glow-amber">
              🏆 SEASON COMPLETE
            </div>
          ) : currentPlayer ? (
            <div
              className="px-3.5 py-2 border rounded-xl text-slate-100 text-xs font-mono tracking-wider uppercase flex items-center justify-center gap-2 shadow-inner transition-all"
              style={{
                backgroundColor: '#040714',
                borderColor: `${currentPlayer.color}88`,
                boxShadow: `0 0 15px ${currentPlayer.color}33`,
              }}
            >
              <span
                className="inline-block w-3 h-3 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: currentPlayer.color }}
              />
              <span className="font-black text-white truncate max-w-[140px] text-xs">
                {isPassAndPlay ? `${currentPlayer.name}'S TURN` : `${currentPlayer.name} TO MOVE`}
              </span>
              {isHumanTurn && !isPassAndPlay && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                  YOU
                </span>
              )}
            </div>
          ) : null}
        </div>

        {/* 3D Dice Display */}
        <DiceDisplay dice={gameState.dice} isRolling={isRolling} />

        {/* Interactive Roll Action Button */}
        {onRollDice && (
          <button
            onClick={onRollDice}
            disabled={!canRoll || isRolling}
            className={`
              w-full py-2.5 px-4 rounded-xl font-mono font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all duration-150 shadow-lg cursor-pointer
              ${
                canRoll && !isRolling
                  ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white shadow-glow-cyan active:scale-95'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-500 opacity-60 cursor-not-allowed'
              }
            `}
          >
            <Dices className="w-4 h-4" />
            {isRolling
              ? 'ROLLING DICE...'
              : canRoll
              ? isHumanTurn
                ? isPassAndPlay
                  ? `ROLL DICE (${currentPlayer?.name})`
                  : 'ROLL DICE (YOUR TURN)'
                : 'EXECUTE AI ROLL'
              : 'AWAITING ACTION'}
          </button>
        )}
      </div>

      {/* Bottom: Animated Soundwave Visualizer & Activity Ticker */}
      <div className="w-full z-10 flex flex-col gap-1.5">
        {/* Equalizer Waveform */}
        <div className="flex items-center justify-center gap-1 h-2 opacity-60">
          <span className="w-1 bg-cyan-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-full" />
          <span className="w-1 bg-indigo-400 rounded-full animate-[pulse_0.9s_ease-in-out_infinite] h-1.5" />
          <span className="w-1 bg-purple-400 rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-full" />
          <span className="w-1 bg-emerald-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-1" />
          <span className="w-1 bg-cyan-400 rounded-full animate-[pulse_0.7s_ease-in-out_infinite] h-full" />
        </div>

        {/* Live Activity Ticker */}
        <div className="px-3 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800/90 text-[9px] sm:text-[10px] text-slate-300 font-mono truncate flex items-center justify-center gap-1.5 shadow-inner">
          <Activity className="w-3 h-3 text-cyan-400 shrink-0 animate-pulse" />
          <span className="truncate">{latestLog}</span>
        </div>
      </div>
    </div>
  );
};
