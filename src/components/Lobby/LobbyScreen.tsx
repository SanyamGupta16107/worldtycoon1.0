import React, { useState } from 'react';
import { Globe2, Play, Users, Clock, ShieldAlert, Sparkles, HelpCircle, Wifi, UserCheck, Copy, Check, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';
import { AVATAR_OPTIONS, COLOR_OPTIONS, GameConfig, GameMode, PlayerColor } from '../../types';
import { makeRoomCode } from '../../services/peerService';

interface LobbyScreenProps {
  onStartSoloGame: (config: GameConfig) => void;
  onStartPassAndPlay: (config: GameConfig, playerNames: string[]) => void;
  onHostOnlineGame: (config: GameConfig, hostName: string, hostColor: PlayerColor, hostAvatar: string) => void;
  onJoinOnlineGame: (roomCode: string, playerName: string, playerColor: PlayerColor, playerAvatar: string) => void;
  onOpenRules: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  onStartSoloGame,
  onStartPassAndPlay,
  onHostOnlineGame,
  onJoinOnlineGame,
  onOpenRules,
}) => {
  const [activeTab, setActiveTab] = useState<GameMode>('solo');

  // Solo Config
  const [aiCount, setAiCount] = useState<number>(3);
  const [roundLimit, setRoundLimit] = useState<number>(30);
  const [difficulty, setDifficulty] = useState<GameConfig['difficulty']>('NORMAL');

  // Pass & Play Config
  const [localPlayersCount, setLocalPlayersCount] = useState<number>(2);
  const [localPlayerNames, setLocalPlayerNames] = useState<string[]>([
    'COMMANDER 1',
    'COMMANDER 2',
    'COMMANDER 3',
    'COMMANDER 4',
    'COMMANDER 5',
    'COMMANDER 6',
  ]);

  // Online Multiplayer Config
  const [onlineAction, setOnlineAction] = useState<'choose' | 'host' | 'join'>('choose');
  const [hostRoomCode, setHostRoomCode] = useState<string>(() => makeRoomCode());
  const [joinRoomInput, setJoinRoomInput] = useState<string>('');
  const [onlinePlayerName, setOnlinePlayerName] = useState<string>('TYCOON');
  const [onlineColor, setOnlineColor] = useState<PlayerColor>('#06b6d4');
  const [onlineAvatar, setOnlineAvatar] = useState<string>('👨‍✈️');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const handleCopyRoomCode = () => {
    try {
      navigator.clipboard.writeText(hostRoomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

  const handleLaunchSolo = () => {
    onStartSoloGame({
      mode: 'solo',
      aiCount,
      humanCount: 1,
      roundLimit,
      difficulty,
      startingCash: 1800,
      startSalary: 200,
      soundEnabled: true,
      musicEnabled: false,
      gameSpeed: 'normal',
    });
  };

  const handleLaunchPassAndPlay = () => {
    onStartPassAndPlay(
      {
        mode: 'pass_and_play',
        aiCount: 0,
        humanCount: localPlayersCount,
        roundLimit,
        difficulty: 'NORMAL',
        startingCash: 1800,
        startSalary: 200,
        soundEnabled: true,
        musicEnabled: false,
        gameSpeed: 'normal',
      },
      localPlayerNames.slice(0, localPlayersCount)
    );
  };

  const handleHostOnline = () => {
    onHostOnlineGame(
      {
        mode: 'online_multiplayer',
        roomCode: hostRoomCode,
        aiCount: 0,
        humanCount: 1,
        roundLimit,
        difficulty,
        startingCash: 1800,
        startSalary: 200,
        soundEnabled: true,
        musicEnabled: false,
        gameSpeed: 'normal',
      },
      onlinePlayerName || 'HOST EMPIRE',
      onlineColor,
      onlineAvatar
    );
  };

  const handleJoinOnline = () => {
    if (!joinRoomInput.trim()) return;
    onJoinOnlineGame(
      joinRoomInput.trim().toUpperCase(),
      onlinePlayerName || 'ALLIED EMPIRE',
      onlineColor,
      onlineAvatar
    );
  };

  return (
    <div className="min-h-screen w-full bg-[#030612] text-slate-100 flex items-center justify-center p-3 sm:p-6 relative overflow-hidden font-sans select-none">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-2xl bg-[#080d1e]/90 border border-slate-700/80 rounded-3xl p-5 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.9),0_0_40px_rgba(6,182,212,0.15)] backdrop-blur-2xl flex flex-col items-center z-10">
        {/* Game Title Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold tracking-widest uppercase mb-2 shadow-glow-cyan">
            <Globe2 className="w-3.5 h-3.5" /> WORLD TYCOON 2.0
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase font-display">
            GLOBAL ECONOMIC <span className="text-cyan-400">WARFARE</span>
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1 max-w-md">
            Sovereign Empire Simulation • Multi-Sector Monopolies • Real-Time Macroeconomics
          </p>
        </div>

        {/* Mode Select Tabs */}
        <div className="grid grid-cols-3 gap-2 w-full p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 mb-6">
          <button
            onClick={() => setActiveTab('solo')}
            className={`py-2.5 px-3 rounded-xl font-bold font-mono text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'solo'
                ? 'bg-cyan-600 text-white shadow-glow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4" /> Solo (vs AI)
          </button>

          <button
            onClick={() => setActiveTab('pass_and_play')}
            className={`py-2.5 px-3 rounded-xl font-bold font-mono text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'pass_and_play'
                ? 'bg-purple-600 text-white shadow-glow-purple'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> Pass & Play
          </button>

          <button
            onClick={() => setActiveTab('online_multiplayer')}
            className={`py-2.5 px-3 rounded-xl font-bold font-mono text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'online_multiplayer'
                ? 'bg-emerald-600 text-white shadow-glow-emerald'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wifi className="w-4 h-4" /> Room (Up to 6P)
          </button>
        </div>

        {/* TAB 1: SOLO VS AI */}
        {activeTab === 'solo' && (
          <div className="w-full space-y-4 text-xs font-mono animate-in fade-in duration-200">
            {/* AI Opponents Count (1 to 5 AI bots -> 2 to 6 players) */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2.5 text-slate-300">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                  <Users className="w-3.5 h-3.5 text-cyan-400" /> AI Competitors
                </span>
                <span className="text-cyan-400 font-extrabold">{aiCount} Opponents ({aiCount + 1} Players)</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map(count => (
                  <button
                    key={count}
                    onClick={() => setAiCount(count)}
                    className={`py-2 px-1 sm:px-2 rounded-lg border font-bold text-center transition-all cursor-pointer text-xs ${
                      aiCount === count
                        ? 'bg-cyan-600 border-cyan-400 text-white shadow-glow-cyan'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {count} AI
                  </button>
                ))}
              </div>
            </div>

            {/* Season Duration */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2.5 text-slate-300">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" /> Season Duration
                </span>
                <span className="text-indigo-400 font-extrabold">{roundLimit} Rounds</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 30, 50].map(rounds => (
                  <button
                    key={rounds}
                    onClick={() => setRoundLimit(rounds)}
                    className={`py-1.5 px-3 rounded-lg border font-bold text-center transition-all cursor-pointer ${
                      roundLimit === rounds
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-glow-purple'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {rounds} R
                  </button>
                ))}
              </div>
            </div>

            {/* AI Difficulty */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2.5 text-slate-300">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> AI Strategic Intelligence
                </span>
                <span className="text-amber-400 font-extrabold">{difficulty}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['EASY', 'NORMAL', 'HARD'] as const).map(diff => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`py-2 px-3 rounded-lg border font-bold text-center transition-all cursor-pointer ${
                      difficulty === diff
                        ? 'bg-amber-600 border-amber-400 text-white shadow-glow-amber'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Launch Buttons */}
            <div className="pt-2 flex gap-3">
              <button
                onClick={onOpenRules}
                className="w-1/3 py-3 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-slate-400" /> Briefing
              </button>
              <button
                onClick={handleLaunchSolo}
                className="w-2/3 py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-extrabold text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-glow-cyan transition-all transform active:scale-98 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" /> Launch Campaign
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: PASS & PLAY (LOCAL MULTIPLAYER) */}
        {activeTab === 'pass_and_play' && (
          <div className="w-full space-y-4 text-xs font-mono animate-in fade-in duration-200">
            {/* Player Count (2 to 6 Players) */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2.5 text-slate-300">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                  <Users className="w-3.5 h-3.5 text-purple-400" /> Hotseat Commanders
                </span>
                <span className="text-purple-400 font-extrabold">{localPlayersCount} Players</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[2, 3, 4, 5, 6].map(count => (
                  <button
                    key={count}
                    onClick={() => setLocalPlayersCount(count)}
                    className={`py-2 px-1 sm:px-2 rounded-lg border font-bold text-center transition-all cursor-pointer text-xs ${
                      localPlayersCount === count
                        ? 'bg-purple-600 border-purple-400 text-white shadow-glow-purple'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {count}P
                  </button>
                ))}
              </div>
            </div>

            {/* Customize Player Names */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                CONFIGURE COMMANDER NAMES:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {Array.from({ length: localPlayersCount }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLOR_OPTIONS[i] }}
                    />
                    <input
                      type="text"
                      maxLength={14}
                      value={localPlayerNames[i]}
                      onChange={e => {
                        const next = [...localPlayerNames];
                        next[i] = e.target.value.toUpperCase();
                        setLocalPlayerNames(next);
                      }}
                      className="bg-transparent text-white font-bold text-xs uppercase focus:outline-none w-full"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Rounds */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2 text-slate-300">
                <span className="font-bold uppercase tracking-wider text-[11px]">Season Rounds</span>
                <span className="text-purple-400 font-extrabold">{roundLimit} Rounds</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 30, 50].map(rounds => (
                  <button
                    key={rounds}
                    onClick={() => setRoundLimit(rounds)}
                    className={`py-1.5 px-3 rounded-lg border font-bold text-center transition-all cursor-pointer ${
                      roundLimit === rounds
                        ? 'bg-purple-600 border-purple-400 text-white shadow-glow-purple'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {rounds} R
                  </button>
                ))}
              </div>
            </div>

            {/* Launch Buttons */}
            <div className="pt-2 flex gap-3">
              <button
                onClick={onOpenRules}
                className="w-1/3 py-3 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-slate-400" /> Briefing
              </button>
              <button
                onClick={handleLaunchPassAndPlay}
                className="w-2/3 py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-glow-purple transition-all transform active:scale-98 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" /> Start Pass & Play
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: ONLINE MULTIPLAYER (ROOM CODES) */}
        {activeTab === 'online_multiplayer' && (
          <div className="w-full space-y-4 text-xs font-mono animate-in fade-in duration-200">
            {/* Choose Host or Join */}
            {onlineAction === 'choose' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setOnlineAction('host')}
                    className="p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/40 hover:border-emerald-400 text-center flex flex-col items-center gap-2 group transition-all cursor-pointer shadow-glow-emerald"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <span className="font-extrabold text-white text-sm uppercase font-display">
                      CREATE ROOM
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Host a game & share 6-digit room code
                    </span>
                  </button>

                  <button
                    onClick={() => setOnlineAction('join')}
                    className="p-5 rounded-2xl bg-slate-950/80 border border-cyan-500/40 hover:border-cyan-400 text-center flex flex-col items-center gap-2 group transition-all cursor-pointer shadow-glow-cyan"
                  >
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Wifi className="w-6 h-6" />
                    </div>
                    <span className="font-extrabold text-white text-sm uppercase font-display">
                      JOIN ROOM
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Enter code & join a friend's lobby
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Profile Avatar & Color Selector */}
            {onlineAction !== 'choose' && (
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">YOUR EMPIRE PROFILE:</span>
                  <button
                    onClick={() => setOnlineAction('choose')}
                    className="text-[10px] text-slate-500 hover:text-slate-300 underline"
                  >
                    Change Mode
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {/* Name Input */}
                  <input
                    type="text"
                    maxLength={12}
                    value={onlinePlayerName}
                    onChange={e => setOnlinePlayerName(e.target.value.toUpperCase())}
                    placeholder="EMPIRE NAME"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold uppercase text-xs focus:border-cyan-400 focus:outline-none"
                  />

                  {/* Avatar Picker */}
                  <div className="flex gap-1 overflow-x-auto max-w-full pb-0.5">
                    {AVATAR_OPTIONS.map(av => (
                      <button
                        key={av}
                        onClick={() => setOnlineAvatar(av)}
                        className={`p-1.5 rounded-lg border text-base cursor-pointer shrink-0 ${
                          onlineAvatar === av ? 'bg-cyan-600 border-cyan-400 scale-110' : 'bg-slate-900 border-slate-800'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* HOST VIEW */}
            {onlineAction === 'host' && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 text-center flex flex-col items-center">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest mb-1">
                    YOUR MULTIPLAYER ROOM CODE
                  </span>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-widest bg-slate-950 px-4 py-1.5 rounded-xl border border-emerald-500/50 shadow-glow-emerald">
                      {hostRoomCode}
                    </span>
                    <button
                      onClick={handleCopyRoomCode}
                      className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-300 hover:bg-slate-800 transition-all cursor-pointer"
                      title="Copy Room Code"
                    >
                      {copiedCode ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Share this code with friends so they can join your lobby from any browser!
                  </p>
                </div>

                {/* Launch Host Room */}
                <button
                  onClick={handleHostOnline}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-glow-emerald transition-all transform active:scale-98 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" /> Open Host Lobby
                </button>
              </div>
            )}

            {/* JOIN VIEW */}
            {onlineAction === 'join' && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/40">
                  <label className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1.5">
                    ENTER HOST ROOM CODE:
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="e.g. WT-9X42"
                    value={joinRoomInput}
                    onChange={e => setJoinRoomInput(e.target.value.toUpperCase())}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-cyan-500/50 text-white text-lg font-mono font-black uppercase tracking-widest text-center focus:border-cyan-400 focus:outline-none shadow-inner"
                  />
                </div>

                <button
                  onClick={handleJoinOnline}
                  disabled={!joinRoomInput.trim()}
                  className={`w-full py-3.5 px-6 rounded-xl font-extrabold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer ${
                    joinRoomInput.trim()
                      ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-glow-cyan'
                      : 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <ArrowRight className="w-4 h-4" /> Connect to Room
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
