import React, { useState, useEffect } from 'react';
import { AuctionState, GameState, Player, REGION_CONFIG } from '../../types';
import { calculatePropertyMarketValue } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatting';
import { audio } from '../../game/audioEngine';
import { Gavel, Clock, Trophy, Check, ArrowUpRight, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';

interface AuctionModalProps {
  gameState: GameState;
  onBid: (bidderId: string, amount: number) => void;
  onPass: (bidderId: string) => void;
  onFinalizeAuction: () => void;
}

export const AuctionModal: React.FC<AuctionModalProps> = ({
  gameState,
  onBid,
  onPass,
  onFinalizeAuction,
}) => {
  const auction = gameState.auction;
  if (!auction) return null;

  const space = gameState.spaces[auction.spaceIndex];
  if (!space) return null;

  const isPassAndPlay = gameState.config.mode === 'pass_and_play';
  const humanPlayer = isPassAndPlay
    ? gameState.players[gameState.turnIndex]
    : gameState.players.find(p => !p.isAI) || gameState.players[0];

  const highestBidder = auction.highestBidderId
    ? gameState.players.find(p => p.id === auction.highestBidderId)
    : null;

  const regionCfg = space.region ? REGION_CONFIG[space.region] : null;
  const marketVal = calculatePropertyMarketValue(space, gameState);

  const canAfford = (increment: number) => {
    return (humanPlayer?.money || 0) >= auction.currentBid + increment;
  };

  const handlePlaceBid = (increment: number) => {
    if (!humanPlayer) return;
    const newBid = auction.currentBid + increment;
    onBid(humanPlayer.id, newBid);
    audio.playUpgrade();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border border-purple-500/40 rounded-3xl p-6 shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_30px_rgba(168,85,247,0.2)] text-slate-100 font-sans flex flex-col items-center">
        {/* Top Auction Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/40 text-purple-300 text-[10px] font-mono font-black uppercase tracking-widest mb-3 shadow-glow-purple">
          <Gavel className="w-3.5 h-3.5" /> GLOBAL PROPERTY AUCTION
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white uppercase font-display tracking-tight text-center mb-1">
          LIVE BIDDING ARENA
        </h2>
        <p className="text-xs font-mono text-slate-400 text-center mb-4">
          All solvent empires compete to acquire strategic global assets.
        </p>

        {/* Auctioned Property Card */}
        <div className="w-full p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-center flex flex-col items-center mb-4 relative overflow-hidden">
          <div className="text-3xl mb-1">{space.flag}</div>
          <h3 className="text-lg font-black text-white uppercase font-display">{space.name}</h3>
          <span className="text-[10px] font-mono text-slate-400 mb-2">{space.country}</span>

          <div className="flex items-center gap-2 mb-3">
            {regionCfg && (
              <span
                className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase"
                style={{ backgroundColor: `${regionCfg.color}22`, color: regionCfg.color }}
              >
                {regionCfg.name}
              </span>
            )}
            <span className="text-[10px] font-mono text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              Valuation: {formatCurrency(marketVal)}
            </span>
          </div>

          {/* Current Highest Bid Banner */}
          <div className="w-full p-3 rounded-xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-purple-950/40 border border-purple-500/50 flex items-center justify-between font-mono">
            <div>
              <span className="text-[9px] text-slate-400 uppercase block font-bold">LEADING BIDDER</span>
              <span className="text-xs font-black text-white uppercase flex items-center gap-1.5 mt-0.5">
                {highestBidder ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: highestBidder.color }} />
                    {highestBidder.name}
                  </>
                ) : (
                  'NO BIDS YET'
                )}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[9px] text-purple-400 uppercase block font-bold">CURRENT BID</span>
              <span className="text-xl font-black text-amber-300 tracking-tight">
                {formatCurrency(auction.currentBid)}
              </span>
            </div>
          </div>
        </div>

        {/* Countdown Timer Progress */}
        <div className="w-full mb-4 font-mono">
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-purple-400 animate-spin" /> AUCTION COUNTDOWN
            </span>
            <span className="text-purple-300 font-bold">{auction.timeLeft}s</span>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300 shadow-glow-purple"
              style={{ width: `${Math.max(0, (auction.timeLeft / 10) * 100)}%` }}
            />
          </div>
        </div>

        {/* Bid Increments Actions */}
        <div className="w-full space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-400 text-[10px] px-1">
            <span>Your Treasury: <strong className="text-emerald-400">{formatCurrency(humanPlayer?.money || 0)}</strong></span>
            <span>Select Increment:</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[20, 50, 100, 250].map((inc) => (
              <button
                key={inc}
                onClick={() => handlePlaceBid(inc)}
                disabled={!canAfford(inc)}
                className={`py-2.5 px-2 rounded-xl font-extrabold text-xs uppercase flex items-center justify-center gap-1 transition-all ${
                  canAfford(inc)
                    ? 'bg-purple-600/30 border border-purple-500/60 text-purple-200 hover:bg-purple-600 hover:text-white shadow-glow-purple active:scale-95 cursor-pointer'
                    : 'bg-slate-950 border border-slate-800 text-slate-600 opacity-50 cursor-not-allowed'
                }`}
              >
                +{formatCurrency(inc)}
              </button>
            ))}
          </div>

          {/* Pass Action */}
          <div className="pt-2">
            <button
              onClick={() => {
                if (humanPlayer) onPass(humanPlayer.id);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white font-bold text-xs uppercase transition-all cursor-pointer"
            >
              PASS / WITHDRAW FROM BIDDING
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
