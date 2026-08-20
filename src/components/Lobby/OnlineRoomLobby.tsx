import React, { useState, useEffect } from 'react';
import { GameState, Player } from '../../types';
import { Globe2, Users, Copy, Check, Play, ShieldAlert, Wifi, MessageSquare, ArrowLeft, Clock } from 'lucide-react';

interface OnlineRoomLobbyProps {
  gameState: GameState;
  isHost: boolean;
  roomCode: string;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onSendChat: (text: string) => void;
}

export const OnlineRoomLobby: React.FC<OnlineRoomLobbyProps> = ({
  gameState,
  isHost,
  roomCode,
  onStartGame,
  onLeaveRoom,
  onSendChat,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');
  const [cooldown, setCooldown] = useState<number>(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || cooldown > 0) return;
    onSendChat(chatInput.trim());
    setChatInput('');
    setCooldown(3); // 3 second anti-spam cooldown
  };

  const players = gameState.players;
  const canStart = isHost && players.length >= 2;

  return (
    <div className="min-h-screen w-full bg-[#030611] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans select-none">
      {/* Aurora Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(16,185,129,0.15),transparent_60%)] pointer-events-none" />

      <div className="relative w-full max-w-xl p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-emerald-500/30 shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_30px_rgba(16,185,129,0.15)] backdrop-blur-2xl z-10 flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-3 mb-6 border-b border-slate-800">
          <button
            onClick={onLeaveRoom}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Leave Lobby
          </button>

          <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-glow-emerald">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> LIVE ROOM
          </span>
        </div>

        {/* Room Code Badge */}
        <div className="w-full p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/40 text-center flex flex-col items-center mb-6">
          <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest mb-1">
            MULTIPLAYER ROOM CODE
          </span>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-3xl font-black text-white font-mono tracking-widest bg-slate-900 px-5 py-2 rounded-xl border border-emerald-500/60 shadow-glow-emerald">
              {roomCode}
            </span>
            <button
              onClick={handleCopy}
              className="p-3 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-300 hover:bg-slate-800 transition-all cursor-pointer"
              title="Copy Room Code"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-[11px] font-mono text-slate-400">
            Send this room code to your peers. They can connect instantly from any browser!
          </p>
        </div>

        {/* Connected Empires List */}
        <div className="w-full mb-6">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 uppercase font-bold mb-2">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-cyan-400" /> CONNECTED EMPIRES ({players.length} / 6)
            </span>
            <span>{isHost ? 'YOU ARE HOST' : 'WAITING FOR HOST'}</span>
          </div>

          <div className="space-y-2 font-mono">
            {players.map((p, idx) => (
              <div
                key={p.id}
                className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{p.avatar}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white uppercase">{p.name}</span>
                      {idx === 0 && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                          HOST
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-500">Commander ID: {p.id.slice(0, 10)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    READY
                  </span>
                </div>
              </div>
            ))}

            {Array.from({ length: Math.max(0, 6 - players.length) }).map((_, i) => (
              <div
                key={i}
                className="p-3 rounded-xl border border-dashed border-slate-800/60 text-center text-slate-600 text-xs font-mono"
              >
                Waiting for Commander {players.length + i + 1} to join...
              </div>
            ))}
          </div>
        </div>

        {/* Live Lobby Chat */}
        <div className="w-full mb-6 font-mono">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 max-h-32 overflow-y-auto space-y-1 text-xs mb-2">
            {gameState.chats.length === 0 ? (
              <div className="text-slate-600 italic text-[10px] text-center">
                Lobby communication channel ready. Say hello!
              </div>
            ) : (
              gameState.chats.map((c) => (
                <div key={c.id} className="text-[10px] leading-tight flex items-start gap-1.5">
                  <span className="font-bold uppercase" style={{ color: c.senderColor }}>
                    {c.senderAvatar} {c.senderName}:
                  </span>
                  <span className="text-slate-200">{c.text}</span>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              maxLength={100}
              placeholder={cooldown > 0 ? `Anti-spam cooldown (${cooldown}s)...` : 'Send quick signal to lobby...'}
              value={chatInput}
              disabled={cooldown > 0}
              onChange={(e) => setChatInput(e.target.value)}
              className={`flex-1 rounded-xl px-3 py-2 text-white text-xs focus:outline-none transition-all ${
                cooldown > 0
                  ? 'bg-slate-950/60 border border-slate-900 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-950 border border-slate-800 focus:border-emerald-500'
              }`}
            />
            <button
              type="submit"
              disabled={cooldown > 0 || !chatInput.trim()}
              className={`py-2 px-4 rounded-xl font-bold text-xs uppercase transition-all flex items-center justify-center ${
                cooldown > 0 || !chatInput.trim()
                  ? 'bg-slate-900/60 border border-slate-800 text-slate-500 opacity-50 cursor-not-allowed'
                  : 'bg-slate-900 border border-slate-700 text-emerald-400 hover:bg-slate-800 cursor-pointer shadow-glow-emerald'
              }`}
            >
              {cooldown > 0 ? (
                <span className="font-mono text-[10px] flex items-center gap-1">
                  <Clock className="w-3 h-3 animate-spin" /> {cooldown}s
                </span>
              ) : (
                'Send'
              )}
            </button>
          </form>
        </div>

        {/* Action Button */}
        {isHost ? (
          <button
            onClick={onStartGame}
            disabled={!canStart}
            className={`w-full py-4 px-6 rounded-xl font-mono font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-glow-emerald transition-all transform active:scale-98 cursor-pointer ${
              canStart
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white'
                : 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed'
            }`}
          >
            <Play className="w-5 h-5 fill-white" />
            {canStart ? 'LAUNCH GLOBAL SIMULATION' : 'NEED AT LEAST 2 PLAYERS'}
          </button>
        ) : (
          <div className="text-center font-mono text-xs text-slate-400 animate-pulse">
            Waiting for host to launch the simulation...
          </div>
        )}
      </div>
    </div>
  );
};
