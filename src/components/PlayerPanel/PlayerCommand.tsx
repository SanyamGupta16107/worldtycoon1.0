import React from 'react';
import { GameState, Player } from '../../types';
import { calculatePlayerNetWorth } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatting';
import { HoldingsList } from './HoldingsList';
import { GameLog } from './GameLog';
import { DollarSign, Shield, Users, Crown, Skull, UserCheck, Flame } from 'lucide-react';

interface PlayerCommandProps {
  gameState: GameState;
  onDevelop: (spaceIndex: number) => void;
  onOpenTrade: (targetPlayerId?: string) => void;
}

export const PlayerCommand: React.FC<PlayerCommandProps> = ({
  gameState,
  onDevelop,
  onOpenTrade,
}) => {
  const activeTurnPlayer = gameState.players[gameState.turnIndex];
  const isPassAndPlay = gameState.config.mode === 'pass_and_play';

  // In Pass & Play, active player is whoever's turn it is; otherwise human player (P1 or peerId)
  const currentActingHuman = isPassAndPlay
    ? activeTurnPlayer
    : gameState.players.find(p => !p.isAI) || gameState.players[0];

  const cash = currentActingHuman?.money || 0;
  const netWorth = currentActingHuman ? calculatePlayerNetWorth(currentActingHuman, gameState) : 0;

  return (
    <aside className="w-full lg:w-80 xl:w-96 flex flex-col gap-3.5 p-3.5 sm:p-4 rounded-3xl bg-[#080d1e]/85 border border-cyan-500/30 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(6,182,212,0.06)] font-sans select-none overflow-y-auto max-h-full">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-indigo-500/15 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-glow-purple">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black tracking-widest text-white uppercase font-display">
              {isPassAndPlay ? 'CURRENT COMMAND' : 'YOUR EMPIRE'}
            </h3>
            <p className="text-[9px] font-mono text-indigo-400 font-bold">Player Command Center</p>
          </div>
        </div>

        <span
          className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black uppercase shadow-sm"
          style={{
            backgroundColor: `${currentActingHuman?.color}25`,
            color: currentActingHuman?.color,
            border: `1px solid ${currentActingHuman?.color}55`,
          }}
        >
          {currentActingHuman?.avatar} {currentActingHuman?.name}
        </span>
      </div>

      {/* Main Treasury Metrics (Cash & Net Worth) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Available Cash */}
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 uppercase font-bold mb-1">
            <span>AVAILABLE CASH</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono tracking-tight">
            {formatCurrency(cash)}
          </div>
          <div className="text-[8px] font-mono text-slate-500 mt-0.5">Liquid Capital</div>
        </div>

        {/* Net Worth */}
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 uppercase font-bold mb-1">
            <span>NET WORTH</span>
            <Crown className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-cyan-400 font-mono tracking-tight">
            {formatCurrency(netWorth)}
          </div>
          <div className="text-[8px] font-mono text-slate-500 mt-0.5">Cash + Assets</div>
        </div>
      </div>

      {/* Competitors Leaderboard */}
      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-400" /> GLOBAL EMPIRES
          </span>
        </div>

        <div className="space-y-1.5 font-mono">
          {gameState.players.map((player) => {
            const isTurn = activeTurnPlayer?.id === player.id;
            const pNetWorth = calculatePlayerNetWorth(player, gameState);

            return (
              <div
                key={player.id}
                className={`
                  p-2 rounded-xl border transition-all text-[10px] flex items-center justify-between
                  ${
                    player.bankrupt
                      ? 'bg-rose-950/20 border-rose-900/40 opacity-50'
                      : isTurn
                      ? 'bg-slate-900/95 border-cyan-400 shadow-glow-cyan'
                      : 'bg-slate-950/60 border-slate-800/80'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{player.avatar}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-white uppercase text-[11px]">{player.name}</span>
                      {player.isAI && (
                        <span className="text-[8px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-normal">
                          AI
                        </span>
                      )}
                      {isTurn && !player.bankrupt && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      )}
                    </div>
                    <div className="text-slate-400 text-[9px]">
                      {player.bankrupt ? (
                        <span className="text-rose-400 font-bold flex items-center gap-1">
                          <Skull className="w-2.5 h-2.5" /> BANKRUPT
                        </span>
                      ) : (
                        `${player.properties.length} assets`
                      )}
                    </div>
                  </div>
                </div>

                {!player.bankrupt && (
                  <div className="text-right">
                    <div className="font-black text-white">{formatCurrency(pNetWorth)}</div>
                    <div className="text-[9px] text-emerald-400 font-bold">{formatCurrency(player.money)}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Holdings Section */}
      {currentActingHuman && (
        <HoldingsList
          player={currentActingHuman}
          gameState={gameState}
          onDevelop={onDevelop}
          onOpenTrade={onOpenTrade}
        />
      )}

      {/* Game Activity Log */}
      <GameLog logs={gameState.logs} />
    </aside>
  );
};
