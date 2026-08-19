import React from 'react';
import { Volume2, VolumeX, Music, HelpCircle, RotateCcw, Zap, Globe2, MessageSquare, Users, Wifi, Flame, TrendingUp } from 'lucide-react';
import { GameState } from '../../types';

interface TopNavbarProps {
  gameState: GameState;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onToggleSpeed: () => void;
  onOpenRules: () => void;
  onResetGame: () => void;
  onToggleChat: () => void;
  onOpenStockMarket?: () => void;
  unreadChatCount?: number;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  gameState,
  onToggleSound,
  onToggleMusic,
  onToggleSpeed,
  onOpenRules,
  onResetGame,
  onToggleChat,
  onOpenStockMarket,
  unreadChatCount = 0,
}) => {
  const { soundEnabled, musicEnabled, gameSpeed, mode } = gameState.config;
  const isStockMarketOpen = gameState.stockMarket?.isOpen;

  const getModeBadge = () => {
    if (mode === 'pass_and_play') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/40 flex items-center gap-1 shadow-glow-purple">
          <Users className="w-3 h-3" /> PASS & PLAY
        </span>
      );
    }
    if (mode === 'online_multiplayer') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-glow-emerald">
          <Wifi className="w-3 h-3" /> MULTIPLAYER ({gameState.config.roomCode})
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 shadow-glow-cyan">
        SOLO SIM
      </span>
    );
  };

  return (
    <header className="w-full h-14 border-b border-cyan-500/20 bg-[#030612]/90 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between z-30 shrink-0 select-none shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      {/* Brand & Mode */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 p-0.5 flex items-center justify-center shadow-glow-cyan">
          <Globe2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black text-sm tracking-wider text-white uppercase font-display">
              WORLD TYCOON
            </span>
            {getModeBadge()}
          </div>
          <p className="text-[10px] font-mono text-slate-400 hidden sm:block">
            Global Strategy & Sovereign Simulation
          </p>
        </div>
      </div>

      {/* Center Macro Ticker */}
      <div className="hidden md:flex items-center gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/90 border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400 uppercase">ROUND</span>
          <span className="text-white font-extrabold">{gameState.round}</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400">{gameState.config.roundLimit}</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/90 border border-slate-800">
          <span className="text-slate-400 uppercase">MARKET:</span>
          <span
            className="font-black uppercase text-xs"
            style={{
              color:
                gameState.market.condition === 'BOOM'
                  ? '#10b981'
                  : gameState.market.condition === 'CRASH'
                  ? '#ef4444'
                  : '#06b6d4',
            }}
          >
            {gameState.market.condition} ({gameState.market.multiplier}x)
          </span>
        </div>

        {/* High-Risk Stock Market Beacon */}
        {isStockMarketOpen && onOpenStockMarket && (
          <button
            onClick={onOpenStockMarket}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/60 text-amber-300 font-extrabold animate-pulse shadow-glow-amber cursor-pointer hover:scale-105 transition-transform"
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>STOCK EXCHANGE OPEN ({gameState.stockMarket.roundsRemaining}R)</span>
          </button>
        )}
      </div>

      {/* Utility Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Comms Chat button */}
        <button
          onClick={onToggleChat}
          title="Open Comms Channel"
          className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 hover:text-white hover:border-cyan-500/40 transition-all cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
          {unreadChatCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold flex items-center justify-center animate-bounce">
              {unreadChatCount}
            </span>
          )}
        </button>

        {/* Speed toggle */}
        <button
          onClick={onToggleSpeed}
          title={`Game Speed: ${gameSpeed.toUpperCase()}`}
          className={`p-2 rounded-xl border transition-all text-xs font-mono flex items-center gap-1 cursor-pointer ${
            gameSpeed === 'fast'
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-glow-amber'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span className="hidden sm:inline font-bold">{gameSpeed === 'fast' ? '2x' : '1x'}</span>
        </button>

        {/* Sound toggle */}
        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute Sound Effects' : 'Unmute Sound Effects'}
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            soundEnabled
              ? 'bg-slate-900 border-cyan-500/40 text-cyan-400 shadow-glow-cyan'
              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Music toggle */}
        <button
          onClick={onToggleMusic}
          title={musicEnabled ? 'Stop Ambient Music' : 'Start Ambient Music'}
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            musicEnabled
              ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-glow-purple'
              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
        >
          <Music className="w-4 h-4" />
        </button>

        {/* Rules button */}
        <button
          onClick={onOpenRules}
          title="Game Rules & Guide"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Reset / Leave button */}
        <button
          onClick={onResetGame}
          title="Return to Lobby"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-rose-400 hover:text-rose-300 hover:border-rose-500/40 transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
