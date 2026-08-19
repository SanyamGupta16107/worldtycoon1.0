import { AuctionState, BoardSpace, GameState, Player, TradeOffer } from '../types';
import { calculatePropertyMarketValue, hasRegionMonopoly } from '../utils/calculations';

/**
 * AI Strategic decision on whether to purchase an unowned property
 */
export function decideAIPurchase(player: Player, space: BoardSpace, state: GameState): boolean {
  if (player.money < space.price) return false;

  const difficulty = state.config.difficulty || 'NORMAL';
  
  let safetyBuffer = 150;
  if (difficulty === 'EASY') safetyBuffer = 250;
  if (difficulty === 'HARD') safetyBuffer = 80;

  if (player.aiPersonality === 'aggressive') safetyBuffer = Math.max(50, safetyBuffer - 50);
  if (player.aiPersonality === 'conservative') safetyBuffer += 100;

  if (player.money - space.price < safetyBuffer) {
    if (space.region && hasRegionMonopoly(player.id, space.region, state.spaces)) {
      return player.money >= space.price;
    }
    return false;
  }

  if (space.type === 'transport') return true;

  if (space.region) {
    const ownedInRegion = state.spaces.filter(s => s.region === space.region && s.owner === player.id).length;
    if (ownedInRegion > 0) return true;
  }

  if (state.market.condition === 'BOOM' || state.market.condition === 'GROWING') {
    return true;
  }

  if (state.market.condition === 'CRASH') {
    return player.money > space.price * 2;
  }

  return true;
}

/**
 * AI Strategic decision on whether to develop an owned property during turn end
 * ENFORCED: Must own at least 3 properties in region!
 */
export function evaluateAIDevelopment(player: Player, state: GameState): number | null {
  if (player.bankrupt || player.money < 250) return null;

  const difficulty = state.config.difficulty || 'NORMAL';
  const minCashReserve = difficulty === 'HARD' ? 180 : 300;

  const upgradeableProperties = state.spaces.filter(
    s => s.owner === player.id && !s.mortgaged && s.level < 3 && player.money - s.developmentCost >= minCashReserve
  );

  // Filter only properties where AI owns at least 3 in the region
  const legalToUpgrade = upgradeableProperties.filter(s => {
    if (!s.region) return false;
    const count = state.spaces.filter(sp => sp.region === s.region && sp.owner === player.id && !sp.mortgaged).length;
    return count >= 3;
  });

  if (legalToUpgrade.length === 0) return null;

  const monopolyProps = legalToUpgrade.filter(
    s => s.region && hasRegionMonopoly(player.id, s.region, state.spaces)
  );

  if (monopolyProps.length > 0) {
    return monopolyProps.sort((a, b) => a.level - b.level || b.baseRent - a.baseRent)[0].index;
  }

  return legalToUpgrade.sort((a, b) => b.baseRent - a.baseRent)[0].index;
}

/**
 * AI Decision on bidding in Global Auction
 */
export function decideAIBid(
  aiPlayer: Player,
  auction: AuctionState,
  state: GameState
): number | null {
  if (aiPlayer.bankrupt) return null;
  const space = state.spaces[auction.spaceIndex];
  if (!space) return null;

  // Don't bid against self if already highest bidder
  if (auction.highestBidderId === aiPlayer.id) return null;

  const marketVal = calculatePropertyMarketValue(space, state);
  let maxWillingToPay = marketVal * 1.1;

  if (space.region) {
    const ownedInRegion = state.spaces.filter(s => s.region === space.region && s.owner === aiPlayer.id).length;
    if (ownedInRegion >= 2) {
      maxWillingToPay = marketVal * 1.4; // High willingness to secure 3-set or monopoly!
    }
  }

  // Cash cushion
  const maxAffordable = aiPlayer.money - 80;
  const ceiling = Math.min(maxWillingToPay, maxAffordable);

  const nextBid = auction.currentBid + 25;
  if (nextBid <= ceiling) {
    return nextBid;
  }

  return null;
}

/**
 * AI Valuation of a bilateral trade offer from human player
 */
export function evaluateAITradeOffer(
  aiPlayer: Player,
  trade: TradeOffer,
  state: GameState
): { accept: boolean; reason: string } {
  let valueReceivedByAI = trade.offeredCash;
  trade.offeredPropertyIndices.forEach(idx => {
    const space = state.spaces[idx];
    if (space) {
      valueReceivedByAI += calculatePropertyMarketValue(space, state);
      if (space.region) {
        const remainingInRegion = state.spaces.filter(s => s.region === space.region && s.owner !== aiPlayer.id).length;
        if (remainingInRegion <= 2) {
          valueReceivedByAI += 250;
        }
      }
    }
  });

  let valueGivenByAI = trade.requestedCash;
  trade.requestedPropertyIndices.forEach(idx => {
    const space = state.spaces[idx];
    if (space) {
      valueGivenByAI += calculatePropertyMarketValue(space, state);
      if (space.region && hasRegionMonopoly(aiPlayer.id, space.region, state.spaces)) {
        valueGivenByAI += 350;
      }
    }
  });

  if (aiPlayer.money < trade.requestedCash) {
    return { accept: false, reason: `${aiPlayer.name} has insufficient treasury liquidity for this proposal.` };
  }

  const requiredRatio = state.config.difficulty === 'HARD' ? 1.15 : 1.0;
  if (valueReceivedByAI >= valueGivenByAI * requiredRatio) {
    return { accept: true, reason: `${aiPlayer.name} accepts the terms of the strategic exchange.` };
  }

  return { accept: false, reason: `${aiPlayer.name} declined the terms (valuation gap).` };
}
