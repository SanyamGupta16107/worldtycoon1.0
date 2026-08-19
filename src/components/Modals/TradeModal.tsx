import React, { useState } from 'react';
import { GameState, Player, TradeOffer } from '../../types';
import { calculatePropertyMarketValue } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatting';
import { Repeat, X, Check, DollarSign, Building2, AlertCircle } from 'lucide-react';

interface TradeModalProps {
  gameState: GameState;
  onClose: () => void;
  onProposeTrade: (trade: TradeOffer) => { accepted: boolean; message: string };
}

export const TradeModal: React.FC<TradeModalProps> = ({
  gameState,
  onClose,
  onProposeTrade,
}) => {
  const humanPlayer = gameState.players.find(p => !p.isAI) || gameState.players[0];
  const opponents = gameState.players.filter(p => p.id !== humanPlayer.id && !p.bankrupt);

  const [selectedOpponentId, setSelectedOpponentId] = useState<string>(opponents[0]?.id || '');
  const [offeredProps, setOfferedProps] = useState<number[]>([]);
  const [requestedProps, setRequestedProps] = useState<number[]>([]);
  const [offeredCash, setOfferedCash] = useState<number>(0);
  const [requestedCash, setRequestedCash] = useState<number>(0);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const selectedOpponent = gameState.players.find(p => p.id === selectedOpponentId);

  const toggleOfferedProp = (index: number) => {
    setOfferedProps(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const toggleRequestedProp = (index: number) => {
    setRequestedProps(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handlePropose = () => {
    if (!selectedOpponent) return;

    const offer: TradeOffer = {
      id: `trade-${Date.now()}`,
      fromPlayerId: humanPlayer.id,
      toPlayerId: selectedOpponent.id,
      offeredPropertyIndices: offeredProps,
      requestedPropertyIndices: requestedProps,
      offeredCash,
      requestedCash,
    };

    const result = onProposeTrade(offer);
    if (result.accepted) {
      setFeedback({ type: 'success', message: result.message });
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setFeedback({ type: 'error', message: result.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/90 rounded-2xl p-6 shadow-2xl text-slate-100 font-sans max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-widest block">
                STRATEGIC DIPLOMACY
              </span>
              <h3 className="text-sm font-black text-white uppercase font-display">
                BILATERAL TRADE DESK
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Select Target Opponent */}
        <div className="mb-4">
          <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-2">
            SELECT NEGOTIATING EMPIRE:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {opponents.map(opp => (
              <button
                key={opp.id}
                onClick={() => {
                  setSelectedOpponentId(opp.id);
                  setRequestedProps([]);
                  setFeedback(null);
                }}
                className={`p-2.5 rounded-xl border text-xs font-mono font-bold flex items-center justify-between transition-all cursor-pointer ${
                  selectedOpponentId === opp.id
                    ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-glow-purple'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: opp.color }} />
                  <span className="truncate">{opp.name}</span>
                </div>
                <span className="text-[9px] text-emerald-400">{formatCurrency(opp.money)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column Trade Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 font-mono text-xs">
          {/* Left Column: Your Offer */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-900">
              <span className="font-bold text-cyan-400 uppercase text-[11px]">YOUR OFFER</span>
              <span className="text-slate-500 text-[10px]">Cash: {formatCurrency(humanPlayer.money)}</span>
            </div>

            {/* Your Properties List */}
            <div className="mb-3">
              <span className="text-[9px] text-slate-500 uppercase block mb-1.5 font-bold">
                PROPERTIES OFFERED:
              </span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {humanPlayer.properties.length === 0 ? (
                  <div className="text-[10px] text-slate-600 italic">No properties owned</div>
                ) : (
                  humanPlayer.properties.map(idx => {
                    const space = gameState.spaces[idx];
                    const isSelected = offeredProps.includes(idx);
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleOfferedProp(idx)}
                        className={`w-full p-1.5 rounded-lg border text-left flex items-center justify-between text-[10px] transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>{space.flag} {space.name}</span>
                        <span>{formatCurrency(calculatePropertyMarketValue(space, gameState))}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Cash Sweetener */}
            <div>
              <span className="text-[9px] text-slate-500 uppercase block mb-1 font-bold">
                CASH OFFER: {formatCurrency(offeredCash)}
              </span>
              <input
                type="range"
                min="0"
                max={humanPlayer.money}
                step="50"
                value={offeredCash}
                onChange={e => setOfferedCash(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Right Column: Requested from Opponent */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-900">
              <span className="font-bold text-amber-400 uppercase text-[11px]">
                REQUESTED ({selectedOpponent?.name})
              </span>
              <span className="text-slate-500 text-[10px]">
                Cash: {formatCurrency(selectedOpponent?.money || 0)}
              </span>
            </div>

            {/* Opponent Properties */}
            <div className="mb-3">
              <span className="text-[9px] text-slate-500 uppercase block mb-1.5 font-bold">
                PROPERTIES REQUESTED:
              </span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {!selectedOpponent || selectedOpponent.properties.length === 0 ? (
                  <div className="text-[10px] text-slate-600 italic">Opponent owns no properties</div>
                ) : (
                  selectedOpponent.properties.map(idx => {
                    const space = gameState.spaces[idx];
                    const isSelected = requestedProps.includes(idx);
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleRequestedProp(idx)}
                        className={`w-full p-1.5 rounded-lg border text-left flex items-center justify-between text-[10px] transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>{space.flag} {space.name}</span>
                        <span>{formatCurrency(calculatePropertyMarketValue(space, gameState))}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Cash Request */}
            <div>
              <span className="text-[9px] text-slate-500 uppercase block mb-1 font-bold">
                CASH REQUESTED: {formatCurrency(requestedCash)}
              </span>
              <input
                type="range"
                min="0"
                max={selectedOpponent?.money || 0}
                step="50"
                value={requestedCash}
                onChange={e => setRequestedCash(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div
            className={`p-3 rounded-xl mb-4 text-xs font-mono font-bold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/60 border border-rose-500/50 text-rose-300'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white font-mono font-bold text-xs uppercase transition-all cursor-pointer"
          >
            CANCEL
          </button>

          <button
            onClick={handlePropose}
            disabled={!selectedOpponent || (offeredProps.length === 0 && offeredCash === 0 && requestedProps.length === 0 && requestedCash === 0)}
            className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-mono font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-glow-cyan transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" /> DISPATCH PROPOSAL
          </button>
        </div>
      </div>
    </div>
  );
};
