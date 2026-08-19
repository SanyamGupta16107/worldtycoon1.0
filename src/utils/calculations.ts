import { BoardSpace, GameState, Player, RegionGroup } from '../types';

export interface RentBreakdown {
  baseRent: number;
  levelMultiplier: number;
  marketMultiplier: number;
  regionalMultiplier: number;
  monopolyMultiplier: number;
  totalMultiplier: number;
  finalRent: number;
  percentChange: number; // e.g. +50 or -20
  status: 'increased' | 'decreased' | 'neutral';
  factors: { name: string; percent: string; positive: boolean }[];
}

/**
 * Detailed calculation of property rent with full multiplier breakdown
 */
export function getDetailedPropertyRent(space: BoardSpace, state: GameState): RentBreakdown {
  if (space.mortgaged) {
    return {
      baseRent: space.baseRent,
      levelMultiplier: 1.0,
      marketMultiplier: 1.0,
      regionalMultiplier: 1.0,
      monopolyMultiplier: 1.0,
      totalMultiplier: 0,
      finalRent: 0,
      percentChange: -100,
      status: 'decreased',
      factors: [{ name: 'Mortgaged Holding', percent: '-100%', positive: false }],
    };
  }

  const factors: { name: string; percent: string; positive: boolean }[] = [];

  // 1. Base Transport or City Rent
  let base = space.baseRent;
  let levelMult = 1.0;

  if (space.type === 'transport') {
    const ownerTransports = state.spaces.filter(s => s.type === 'transport' && s.owner === space.owner && !s.mortgaged).length;
    const transportRents = [40, 90, 160, 250];
    base = transportRents[Math.min(Math.max(0, ownerTransports - 1), 3)] || 40;
    if (ownerTransports > 1) {
      factors.push({ name: `Transport Network (${ownerTransports} routes)`, percent: `x${ownerTransports}`, positive: true });
    }
  } else {
    const levelMultipliers = [1.0, 2.2, 4.0, 6.5];
    levelMult = levelMultipliers[Math.min(space.level, 3)] || 1.0;
    if (space.level > 0) {
      factors.push({ name: `Tier ${space.level} Development`, percent: `+${((levelMult - 1) * 100).toFixed(0)}%`, positive: true });
    }
  }

  // 2. Monopoly Synergy (+50%)
  let monopolyMult = 1.0;
  if (space.region) {
    const regionSpaces = state.spaces.filter(s => s.region === space.region);
    const ownsAll = regionSpaces.length > 0 && regionSpaces.every(s => s.owner === space.owner);
    if (ownsAll) {
      monopolyMult = 1.5;
      factors.push({ name: 'Regional Dominance Synergy', percent: '+50%', positive: true });
    }
  }

  // 3. Global Market Condition Multiplier
  const marketMult = state.market?.multiplier || 1.0;
  if (marketMult !== 1.0) {
    const pct = ((marketMult - 1) * 100).toFixed(0);
    factors.push({
      name: `Global Market (${state.market.condition})`,
      percent: `${marketMult > 1 ? '+' : ''}${pct}%`,
      positive: marketMult >= 1.0,
    });
  }

  // 4. Regional Event Multiplier
  let regionalMult = 1.0;
  if (space.region && state.regionalEvents?.[space.region]) {
    const regEvent = state.regionalEvents[space.region];
    if (regEvent) {
      regionalMult = regEvent.rentMultiplier || 1.0;
      const pct = ((regionalMult - 1) * 100).toFixed(0);
      factors.push({
        name: `Regional Shock (${regEvent.headline})`,
        percent: `${regionalMult > 1 ? '+' : ''}${pct}%`,
        positive: regionalMult >= 1.0,
      });
    }
  }

  const effectiveEconomicMultiplier = marketMult * regionalMult * monopolyMult;
  const calculatedRent = Math.max(10, Math.round(base * levelMult * effectiveEconomicMultiplier));

  const standardBaselineRent = Math.round(base * levelMult);
  const percentChange = standardBaselineRent > 0
    ? Math.round(((calculatedRent - standardBaselineRent) / standardBaselineRent) * 100)
    : 0;

  return {
    baseRent: base,
    levelMultiplier: levelMult,
    marketMultiplier: marketMult,
    regionalMultiplier: regionalMult,
    monopolyMultiplier: monopolyMult,
    totalMultiplier: effectiveEconomicMultiplier,
    finalRent: calculatedRent,
    percentChange,
    status: percentChange > 0 ? 'increased' : percentChange < 0 ? 'decreased' : 'neutral',
    factors,
  };
}

/**
 * Calculates current Rent owed when a player lands on an owned property
 */
export function calculatePropertyRent(space: BoardSpace, state: GameState): number {
  return getDetailedPropertyRent(space, state).finalRent;
}

export function calculatePropertyMarketValue(space: BoardSpace, state: GameState): number {
  const baseValue = space.price + (space.level * space.developmentCost);
  const marketMultiplier = state.market?.multiplier || 1.0;
  
  let regionalMultiplier = 1.0;
  if (space.region && state.regionalEvents?.[space.region]) {
    regionalMultiplier = state.regionalEvents[space.region]?.priceMultiplier || 1.0;
  }

  return Math.round(baseValue * marketMultiplier * regionalMultiplier);
}

export function calculatePlayerNetWorth(player: Player, state: GameState): number {
  if (player.bankrupt) return 0;
  
  let assetValue = 0;
  player.properties.forEach(index => {
    const space = state.spaces[index];
    if (space) {
      if (space.mortgaged) {
        assetValue += Math.round(calculatePropertyMarketValue(space, state) * 0.5);
      } else {
        assetValue += calculatePropertyMarketValue(space, state);
      }
    }
  });

  return Math.max(0, player.money + assetValue);
}

export function canDevelopRegion(playerId: string, region: RegionGroup | undefined, spaces: BoardSpace[]): boolean {
  if (!region) return false;
  const ownedInRegion = spaces.filter(s => s.region === region && s.owner === playerId && !s.mortgaged).length;
  return ownedInRegion >= 3;
}

export function hasRegionMonopoly(playerId: string, region: RegionGroup, spaces: BoardSpace[]): boolean {
  const regionSpaces = spaces.filter(s => s.region === region);
  return regionSpaces.length > 0 && regionSpaces.every(s => s.owner === playerId);
}

export function getRegionHoldingsCount(region: RegionGroup, spaces: BoardSpace[]): { owned: number; total: number } {
  const regionSpaces = spaces.filter(s => s.region === region);
  const owned = regionSpaces.filter(s => s.owner !== null).length;
  return { owned, total: regionSpaces.length };
}

export function getMortgageValue(space: BoardSpace): number {
  return Math.round((space.price + space.level * space.developmentCost) * 0.5);
}

export function getUnmortgageCost(space: BoardSpace): number {
  return Math.round(getMortgageValue(space) * 1.1);
}

export function getBankSellValue(space: BoardSpace, state: GameState): number {
  const mVal = calculatePropertyMarketValue(space, state);
  return Math.round(mVal * 0.7);
}
