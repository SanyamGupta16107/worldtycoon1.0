export type GameMode = 'solo' | 'pass_and_play' | 'online_multiplayer';

export type PlayerColor = 
  | '#06b6d4' // Cyan (P1)
  | '#a855f7' // Purple (P2)
  | '#f59e0b' // Amber (P3)
  | '#10b981' // Emerald (P4)
  | '#ec4899' // Rose
  | '#ef4444'; // Red

export const PLAYER_COLOR_NAMES: Record<string, string> = {
  '#06b6d4': 'CYAN',
  '#a855f7': 'PURPLE',
  '#f59e0b': 'AMBER',
  '#10b981': 'EMERALD',
  '#ec4899': 'ROSE',
  '#ef4444': 'RED',
};

export const COLOR_OPTIONS: PlayerColor[] = [
  '#06b6d4',
  '#a855f7',
  '#f59e0b',
  '#10b981',
  '#ec4899',
  '#ef4444',
];

export const AVATAR_OPTIONS = ['👨‍✈️', '🤖', '🛰️', '⚡', '👑', '💎', '🚀', '🌐'];

export type SpaceType = 
  | 'start' 
  | 'city' 
  | 'transport' 
  | 'world_event' 
  | 'market_shock' 
  | 'tax' 
  | 'financial_hub' 
  | 'auction' 
  | 'free_trade';

export type RegionGroup = 'europe' | 'middle_east' | 'asia' | 'americas';

export const REGION_CONFIG: Record<RegionGroup, { 
  name: string; 
  color: string; 
  bgBadge: string; 
  border: string; 
  glow: string;
  gradient: string;
}> = {
  europe: {
    name: 'Europe',
    color: '#38bdf8', // sky blue
    bgBadge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    border: 'border-sky-500/40',
    glow: 'shadow-[0_0_15px_rgba(56,189,248,0.35)]',
    gradient: 'from-sky-500/20 to-blue-600/10',
  },
  middle_east: {
    name: 'Middle East',
    color: '#f59e0b', // amber
    bgBadge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    border: 'border-amber-500/40',
    glow: 'shadow-[0_0_15px_rgba(245,158,11,0.35)]',
    gradient: 'from-amber-500/20 to-orange-600/10',
  },
  asia: {
    name: 'Asia',
    color: '#10b981', // emerald
    bgBadge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    border: 'border-emerald-500/40',
    glow: 'shadow-[0_0_15px_rgba(16,185,129,0.35)]',
    gradient: 'from-emerald-500/20 to-teal-600/10',
  },
  americas: {
    name: 'Americas',
    color: '#ec4899', // rose / magenta
    bgBadge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    border: 'border-rose-500/40',
    glow: 'shadow-[0_0_15px_rgba(236,72,153,0.35)]',
    gradient: 'from-rose-500/20 to-pink-600/10',
  },
};

export type CitySpecialization = 
  | 'finance' 
  | 'luxury' 
  | 'technology' 
  | 'trade' 
  | 'energy' 
  | 'manufacturing' 
  | 'agri' 
  | 'logistics'
  | 'shipping';

export interface BoardSpace {
  index: number;
  name: string;
  type: SpaceType;
  country: string;
  flag: string;
  region?: RegionGroup;
  specialization?: CitySpecialization;
  specializationLabel?: string;
  price: number;
  baseRent: number;
  developmentCost: number;
  owner: string | null;
  level: number; // 0: Base, 1: Tier 1, 2: Tier 2, 3: Tier 3 (Mega-Complex)
  mortgaged: boolean;
  gridRow: number; // 1 to 9
  gridCol: number; // 1 to 9
  isCorner: boolean;
  side: 'top' | 'right' | 'bottom' | 'left' | 'corner';
}

export interface PlayerStats {
  rentCollected: number;
  rentPaid: number;
  propertiesBought: number;
  developmentsBuilt: number;
  peakNetWorth: number;
  stockMarketProfit: number;
  auctionsWon: number;
}

export interface Player {
  id: string;
  peerId?: string;
  name: string;
  color: PlayerColor;
  money: number;
  position: number;
  properties: number[];
  bankrupt: boolean;
  isAI: boolean;
  avatar: string;
  aiPersonality?: 'aggressive' | 'balanced' | 'conservative';
  stats: PlayerStats;
  isReady?: boolean;
}

export type MarketCondition = 'STABLE' | 'GROWING' | 'BOOM' | 'VOLATILE' | 'RECESSION' | 'CRASH';

export interface MarketState {
  condition: MarketCondition;
  multiplier: number;
  durationRounds: number;
  title: string;
  description: string;
  trend: 'up' | 'down' | 'neutral';
  history: number[];
}

export interface RegionalEvent {
  id: string;
  region: RegionGroup;
  headline: string;
  description: string;
  rentMultiplier: number;
  priceMultiplier: number;
  roundsRemaining: number;
}

export interface GameEvent {
  id: string;
  title: string;
  type: 'world' | 'market';
  description: string;
  effectText: string;
  actionType: 
    | 'cash_bonus' 
    | 'cash_tax' 
    | 'all_players_bonus' 
    | 'property_boost' 
    | 'market_shift' 
    | 'free_development' 
    | 'dividend_payout';
  value?: number;
  targetMarket?: MarketCondition;
}

export interface TradeOffer {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  offeredPropertyIndices: number[];
  requestedPropertyIndices: number[];
  offeredCash: number;
  requestedCash: number;
}

export interface AuctionState {
  spaceIndex: number;
  currentBid: number;
  highestBidderId: string | null;
  highestBidderName: string | null;
  activeBidderIds: string[];
  sellerId: string | null; // null if bank selling unowned property
  timeLeft: number;
  log: string[];
}

export interface StockCompany {
  id: string;
  ticker: string;
  name: string;
  sector: 'tech' | 'energy' | 'finance' | 'luxury' | 'logistics' | 'agri' | 'manufacturing';
  sectorLabel: string;
  icon: string;
  description: string;
  volatility: 'HIGH' | 'EXTREME' | 'SPECULATIVE';
  baseMultiplier: number;
  color: string;
}

export interface PlayerStockInvestment {
  companyId: string;
  amount: number;
}

export interface StockMarketOutcome {
  playerId: string;
  playerName: string;
  companyId: string;
  companyName: string;
  companyTicker: string;
  companyIcon: string;
  invested: number;
  returned: number;
  multiplier: number;
  isWin: boolean;
  headline: string;
}

export interface StockMarketState {
  isOpen: boolean;
  roundsRemaining: number;
  totalDurationRounds: number;
  investments: Record<string, PlayerStockInvestment[]>; // playerId -> list of investments in companies
  lastOutcome: StockMarketOutcome[] | null;
}

export type GameActionState = 
  | 'LOBBY' 
  | 'STARTING' 
  | 'ROLL_REQUIRED' 
  | 'ROLLING' 
  | 'MOVING' 
  | 'PROPERTY_DECISION' 
  | 'PAYING_RENT' 
  | 'TAX_DECISION' 
  | 'EVENT_NOTIFICATION' 
  | 'AUCTION_ACTIVE'
  | 'STOCK_MARKET_WINDOW'
  | 'DEVELOPMENT_VIEW' 
  | 'TRADE_VIEW' 
  | 'TURN_END' 
  | 'GAME_OVER';

export interface GameLog {
  id: string;
  timestamp: string;
  round: number;
  text: string;
  type: 'system' | 'roll' | 'purchase' | 'rent' | 'tax' | 'event' | 'trade' | 'development' | 'bankruptcy' | 'market' | 'chat' | 'auction' | 'stock';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
}

export interface GameConfig {
  mode: GameMode;
  roomCode?: string;
  myPeerId?: string;
  aiCount: number;
  humanCount: number;
  roundLimit: number;
  difficulty: 'EASY' | 'NORMAL' | 'HARD';
  startingCash: number;
  startSalary: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
  gameSpeed: 'normal' | 'fast';
}

export interface GameState {
  config: GameConfig;
  status: GameActionState;
  round: number;
  turnIndex: number;
  players: Player[];
  spaces: BoardSpace[];
  market: MarketState;
  regionalEvents: Record<RegionGroup, RegionalEvent | null>;
  dice: [number, number];
  diceRolling: boolean;
  pendingSpace: BoardSpace | null;
  activeEvent: GameEvent | null;
  activeTrade: TradeOffer | null;
  auction: AuctionState | null;
  stockMarket: StockMarketState;
  selectedPropertyIndex: number | null;
  logs: GameLog[];
  chats: ChatMessage[];
  winner: Player | null;
  isMovingPawn: boolean;
}

export type NetworkMessage = 
  | { type: 'hello'; room: string }
  | { type: 'join'; playerId: string; name: string; color: PlayerColor; avatar: string }
  | { type: 'state'; state: GameState; myId: string }
  | { type: 'update'; state: GameState }
  | { type: 'action'; action: string; payload?: Record<string, unknown> }
  | { type: 'chat'; message: ChatMessage }
  | { type: 'error'; message: string };
