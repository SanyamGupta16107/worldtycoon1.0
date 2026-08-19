import React from 'react';
import { GameEvent } from '../../types';
import { Radio, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';

interface EventNotificationModalProps {
  event: GameEvent | null;
  onDismiss: () => void;
}

export const EventNotificationModal: React.FC<EventNotificationModalProps> = ({
  event,
  onDismiss,
}) => {
  if (!event) return null;

  const isMarket = event.type === 'market';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/90 rounded-2xl p-6 shadow-2xl text-slate-100 font-sans text-center flex flex-col items-center">
        {/* Glowing Icon */}
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border ${
            isMarket
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-glow-amber'
              : 'bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-glow-purple'
          }`}
        >
          {isMarket ? <Zap className="w-7 h-7 animate-pulse" /> : <Radio className="w-7 h-7 animate-pulse" />}
        </div>

        {/* Badge */}
        <span
          className={`px-3 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest mb-2 border ${
            isMarket
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              : 'bg-purple-500/15 border-purple-500/40 text-purple-300'
          }`}
        >
          {isMarket ? 'MACRO MARKET SHOCK' : 'GLOBAL INTELLIGENCE BULLETIN'}
        </span>

        {/* Event Title */}
        <h2 className="text-lg font-black text-white uppercase tracking-tight font-display mb-2">
          {event.title}
        </h2>

        {/* Description */}
        <p className="text-xs font-mono text-slate-300 leading-relaxed mb-4">
          {event.description}
        </p>

        {/* Impact Box */}
        <div className="w-full p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-left font-mono mb-6">
          <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider block mb-1">
            STRATEGIC IMPACT:
          </span>
          <p className="text-xs text-emerald-300 font-semibold">{event.effectText}</p>
        </div>

        {/* Acknowledge Button */}
        <button
          onClick={onDismiss}
          className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-mono font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow-cyan transition-all cursor-pointer"
        >
          Acknowledge Directive <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
