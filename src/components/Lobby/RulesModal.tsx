import React from 'react';
import { X, Globe2, Building2, TrendingUp, RefreshCw, Award, ArrowRight } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl text-slate-200 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Globe2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white uppercase font-display">
                WORLD TYCOON BRIEFING
              </h2>
              <p className="text-xs font-mono text-cyan-400">Tactical Strategy & Rules Manual</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content sections */}
        <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-slate-300">
          {/* Section 1 */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3.5">
            <Building2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-white uppercase tracking-wider text-xs mb-1 font-mono">
                1. Core Objective & Capital Reserves
              </h3>
              <p className="text-slate-400">
                You begin with <span className="text-emerald-400 font-bold">$1,800</span> in cash reserves. Roll 2 dice to travel clockwise across 32 world spaces. Acquire international cities, collect escalating rent from competitors, and drive rival empires into bankruptcy.
              </p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3.5">
            <TrendingUp className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-white uppercase tracking-wider text-xs mb-1 font-mono">
                2. Regional Monopolies & Developments
              </h3>
              <p className="text-slate-400">
                Owning all cities within a region (Europe, Middle East, Asia, Americas) grants a <span className="text-indigo-300 font-bold">+50% monopoly rent bonus</span>. Upgrade properties through Tier 1, Tier 2, and Tier 3 (Mega-Complex) to dramatically multiply your cash yield.
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3.5">
            <Globe2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-white uppercase tracking-wider text-xs mb-1 font-mono">
                3. Macro Market Cycles & Regional News
              </h3>
              <p className="text-slate-400">
                The global economy shifts across 6 dynamic cycles: <span className="text-cyan-400 font-semibold">STABLE</span>, <span className="text-blue-400 font-semibold">GROWING</span>, <span className="text-emerald-400 font-semibold">BOOM (+50%)</span>, <span className="text-amber-400 font-semibold">VOLATILE</span>, <span className="text-orange-400 font-semibold">RECESSION (-20%)</span>, and <span className="text-rose-400 font-semibold">CRASH (-40%)</span>. Regional news further modifies local yields in real time.
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3.5">
            <RefreshCw className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-white uppercase tracking-wider text-xs mb-1 font-mono">
                4. Bilateral Trading & Strategy
              </h3>
              <p className="text-slate-400">
                Negotiate property swaps and cash sweeteners with AI rivals using the Command Panel. AI players calculate valuations based on portfolio synergy, cash cushions, and monopoly prevention.
              </p>
            </div>
          </div>

          {/* Section 5 */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3.5">
            <Award className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-white uppercase tracking-wider text-xs mb-1 font-mono">
                5. Season Finale & Victory Conditions
              </h3>
              <p className="text-slate-400">
                The season concludes when the configured round limit is reached, or when all rivals are eliminated by bankruptcy. The solvent empire with the highest Net Worth is crowned the World Tycoon!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-glow-cyan transition-all"
          >
            Acknowledge Briefing <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
