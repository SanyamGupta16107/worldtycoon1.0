import React, { useState } from 'react';
import { ChatMessage } from '../../types';
import { MessageSquare, X, Send, Smile, Radio } from 'lucide-react';

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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendChat(text.trim());
    setText('');
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
            onClick={() => onSendChat(emoji)}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-400 text-sm hover:scale-120 transition-all cursor-pointer"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="Type transmission..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
        />
        <button
          type="submit"
          className="py-2 px-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase shadow-glow-cyan transition-all cursor-pointer flex items-center justify-center"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
