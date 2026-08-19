import { MarketCondition, MarketState, RegionalEvent, RegionGroup } from '../types';

export const MARKET_CONDITIONS: Record<MarketCondition, {
  title: string;
  multiplier: number;
  description: string;
  color: string;
  badgeClass: string;
  trend: 'up' | 'down' | 'neutral';
}> = {
  STABLE: {
    title: 'STABLE EQUILIBRIUM',
    multiplier: 1.0,
    description: 'Global markets operate at baseline valuation and predictable yield.',
    color: '#06b6d4',
    badgeClass: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
    trend: 'neutral',
  },
  GROWING: {
    title: 'EXPANSION PHASE',
    multiplier: 1.2,
    description: 'Rising international capital flows increase property valuations by +20%.',
    color: '#3b82f6',
    badgeClass: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
    trend: 'up',
  },
  BOOM: {
    title: 'GLOBAL MEGA-BOOM',
    multiplier: 1.5,
    description: 'Peak liquidity surge! All rent yields and asset values boosted by +50%.',
    color: '#10b981',
    badgeClass: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    trend: 'up',
  },
  VOLATILE: {
    title: 'HIGH VOLATILITY',
    multiplier: 1.1,
    description: 'Currency fluctuations and erratic trade flows create market uncertainty.',
    color: '#f59e0b',
    badgeClass: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
    trend: 'neutral',
  },
  RECESSION: {
    title: 'CREDIT CRUNCH',
    multiplier: 0.8,
    description: 'Monetary tightening dampens activity. Rent collections reduced by -20%.',
    color: '#f97316',
    badgeClass: 'bg-orange-500/15 border-orange-500/30 text-orange-300',
    trend: 'down',
  },
  CRASH: {
    title: 'MARKET MELTDOWN',
    multiplier: 0.6,
    description: 'Global liquidity collapse! Asset valuations and rents slashed by -40%.',
    color: '#ef4444',
    badgeClass: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
    trend: 'down',
  },
};

export const INITIAL_MARKET_STATE: MarketState = {
  condition: 'STABLE',
  multiplier: 1.0,
  durationRounds: 3,
  title: MARKET_CONDITIONS.STABLE.title,
  description: MARKET_CONDITIONS.STABLE.description,
  trend: 'neutral',
  history: [1.0, 1.05, 1.0, 1.1, 1.0],
};

export const REGIONAL_EVENTS_POOL: RegionalEvent[] = [
  {
    id: 'eu-tech-boom',
    region: 'europe',
    headline: 'EUROPEAN GREEN TECH INITIATIVE',
    description: 'EU green transition stimulus increases European rents by +30%.',
    rentMultiplier: 1.3,
    priceMultiplier: 1.2,
    roundsRemaining: 2,
  },
  {
    id: 'eu-regulation',
    region: 'europe',
    headline: 'EUROPEAN FISCAL AUDIT',
    description: 'Strict antitrust guidelines reduce European yields by -15%.',
    rentMultiplier: 0.85,
    priceMultiplier: 0.9,
    roundsRemaining: 2,
  },
  {
    id: 'me-infra-boom',
    region: 'middle_east',
    headline: 'MIDDLE EAST INFRASTRUCTURE SURGE',
    description: 'Sovereign wealth funds ignite mega-projects! Rents boosted +35%.',
    rentMultiplier: 1.35,
    priceMultiplier: 1.25,
    roundsRemaining: 2,
  },
  {
    id: 'me-energy-shock',
    region: 'middle_east',
    headline: 'MIDDLE EAST ENERGY REALIGNMENT',
    description: 'Oil & LNG price shifts yield +25% rent boost across Gulf properties.',
    rentMultiplier: 1.25,
    priceMultiplier: 1.15,
    roundsRemaining: 2,
  },
  {
    id: 'asia-semiconductor',
    region: 'asia',
    headline: 'ASIAN SEMICONDUCTOR DOMINANCE',
    description: 'Record electronics demand drives Asian rents up by +40%.',
    rentMultiplier: 1.4,
    priceMultiplier: 1.3,
    roundsRemaining: 2,
  },
  {
    id: 'asia-supply-strain',
    region: 'asia',
    headline: 'ASIAN LOGISTICS BOTTLENECK',
    description: 'Temporary port congestion lowers regional revenues by -20%.',
    rentMultiplier: 0.8,
    priceMultiplier: 0.85,
    roundsRemaining: 2,
  },
  {
    id: 'americas-venture-surge',
    region: 'americas',
    headline: 'SILICON & WALL STREET RALLY',
    description: 'Venture capital explosion boosts Americas property yields by +35%.',
    rentMultiplier: 1.35,
    priceMultiplier: 1.25,
    roundsRemaining: 2,
  },
  {
    id: 'americas-rate-hike',
    region: 'americas',
    headline: 'AMERICAS RATE REVISIONS',
    description: 'Central bank interest hikes cool Americas property rents by -15%.',
    rentMultiplier: 0.85,
    priceMultiplier: 0.9,
    roundsRemaining: 2,
  },
];
