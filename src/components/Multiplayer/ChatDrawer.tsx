import React, { useState, useEffect } from 'react';
import { ChatMessage } from '../../types';
import { MessageSquare, X, Send, Smile, Radio, Clock } from 'lucide-react';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chats: ChatMessage[];
  onSendChat: (text: string) => void;
}

const QUICK_EMOJIS = ['🚀', '💎', '🔥', '👑', '🤝', '⚡', '💀', '💸'];

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  chats,
  onSendChat,
}) => {
  const [text, setText] = useState<string>('');
  const [cooldown, setCooldown] = useState<number>(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!isOpen) return null;

  const handleSend = (msgText: string) => {
    if (!msgText.trim() || cooldown > 0) return;
    onSendChat(msgText.trim());
    setText('');
    setCooldown(3); // 3 second anti-spam cooldown
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(text);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 rounded-3xl bg-slate-900/95 border border-cyan-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(6,182,212,0.2)] backdrop-blur-2xl p-4 font-sans select-none animate-in slide-in-from-bottom-5 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <span className="font-extrabold text-xs text-white uppercase font-display">
            COMMS FREQUENCY
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 h-44 overflow-y-auto space-y-1.5 font-mono text-[11px] mb-3">
        {chats.length === 0 ? (
          <div className="text-slate-600 italic text-[10px] text-center pt-12">
            No transmissions yet. Send a message to the lobby.
          </div>
        ) : (
          chats.map((c) => (
            <div key={c.id} className="leading-snug">
              <span className="font-extrabold text-[10px] mr-1" style={{ color: c.senderColor }}>
                {c.senderAvatar} {c.senderName}:
              </span>
              <span className="text-slate-200">{c.text}</span>
            </div>
          ))
        )}
      </div>

      {/* Quick Reaction Emoji Row */}
      <div className="flex items-center justify-between gap-1 mb-3">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            disabled={cooldown > 0}
            onClick={() => handleSend(emoji)}
            className={`p-1.5 rounded-lg border text-sm transition-all ${
              cooldown > 0
                ? 'bg-slate-950/50 border-slate-900 opacity-40 cursor-not-allowed'
                : 'bg-slate-950 border-slate-800 hover:border-cyan-400 hover:scale-120 cursor-pointer'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          maxLength={100}
          placeholder={cooldown > 0 ? `Anti-spam cooldown (${cooldown}s)...` : 'Type transmission...'}
          value={text}
          disabled={cooldown > 0}
          onChange={(e) => setText(e.target.value)}
          className={`flex-1 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none transition-all ${
            cooldown > 0
              ? 'bg-slate-950/60 border border-slate-900 text-slate-500 cursor-not-allowed'
              : 'bg-slate-950 border border-slate-800 focus:border-cyan-400'
          }`}
        />
        <button
          type="submit"
          disabled={cooldown > 0 || !text.trim()}
          className={`py-2 px-3.5 rounded-xl font-bold text-xs uppercase transition-all flex items-center justify-center ${
            cooldown > 0 || !text.trim()
              ? 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-glow-cyan cursor-pointer'
          }`}
        >
          {cooldown > 0 ? (
            <span className="font-mono text-[10px] flex items-center gap-1">
              <Clock className="w-3 h-3 animate-spin" /> {cooldown}s
            </span>
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
        </button>
      </form>
    </div>
  );
};
