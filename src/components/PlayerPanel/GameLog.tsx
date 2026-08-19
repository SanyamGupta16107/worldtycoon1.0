import React from 'react';
import { GameLog as IGameLog } from '../../types';
import { Terminal, Activity } from 'lucide-react';

interface GameLogProps {
  logs: IGameLog[];
}

export const GameLog: React.FC<GameLogProps> = ({ logs }) => {
  return (
    <div className="space-y-2 select-none">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" /> SIMULATION FEED
        </span>
        <span className="text-[9px] font-mono text-slate-500">{logs.length} EVENTS</span>
      </div>

      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 max-h-48 overflow-y-auto space-y-1.5 font-mono text-[10px]">
        {logs.map((log) => {
          let dotColor = 'bg-cyan-400';
          let textColor = 'text-slate-300';

          if (log.type === 'purchase') {
            dotColor = 'bg-emerald-400';
            textColor = 'text-emerald-300';
          } else if (log.type === 'rent') {
            dotColor = 'bg-amber-400';
            textColor = 'text-amber-300';
          } else if (log.type === 'bankruptcy') {
            dotColor = 'bg-rose-500';
            textColor = 'text-rose-400 font-bold';
          } else if (log.type === 'event' || log.type === 'market') {
            dotColor = 'bg-purple-400';
            textColor = 'text-purple-300';
          } else if (log.type === 'trade' || log.type === 'development') {
            dotColor = 'bg-blue-400';
            textColor = 'text-blue-300';
          }

          return (
            <div key={log.id} className="flex items-start gap-1.5 leading-snug">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${dotColor}`} />
              <div className="flex-1">
                <span className="text-slate-500 text-[8px] mr-1">R{log.round}</span>
                <span className={textColor}>{log.text}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
