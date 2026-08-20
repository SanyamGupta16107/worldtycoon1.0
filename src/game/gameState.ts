import { INITIAL_BOARD_SPACES } from '../data/boardData';
import { INITIAL_MARKET_STATE } from '../data/marketData';
import { STOCK_COMPANIES } from '../data/stockData';
import {
  AuctionState,
  ChatMessage,
  COLOR_OPTIONS,
  CompanyMarketReport,
  GameConfig,
  GameLog,
  GameState,
  Player,
  PlayerOutcomeReport,
  PlayerStockInvestment,
  StockMarketOutcome,
  StockMarketResolution,
  TradeOffer,
} from '../types';
import { calculatePlayerNetWorth, calculatePropertyMarketValue } from '../utils/calculations';
import { formatCurrency } from '../utils/formatting';
import { audio } from './audioEngine';
import { decideAIBid, decideAIPurchase, evaluateAIDevelopment, evaluateAITradeOffer } from './botLogic';
import {
  executeAtomicTrade,
  executeAuctionWin,
  executeMortgageProperty,
  executePropertyDevelopment,
  executePropertyPurchase,
  executeRentPayment,
  executeSellPropertyToBank,
  executeTaxPayment,
  executeUnmortgageProperty,
} from './economy';
import { processRoundEconomyEvolution, triggerMarketShock, triggerWorldEvent } from './events';
import { validateGameStateIntegrity } from './integrity';

const DEFAULT_CONFIG: GameConfig = {
  mode: 'solo',
  aiCount: 3,
  humanCount: 1,
  roundLimit: 30,
  difficulty: 'NORMAL',
  startingCash: 1800,
  startSalary: 200,
  soundEnabled: true,
  musicEnabled: false,
  gameSpeed: 'normal',
};

const BOT_ROSTER: { name: string; color: Player['color']; avatar: string; personality: Player['aiPersonality'] }[] = [
  { name: 'NEXUS-AI', color: '#a855f7', avatar: '🤖', personality: 'aggressive' },
  { name: 'VALKYRIE-AI', color: '#f59e0b', avatar: '🛰️', personality: 'balanced' },
  { name: 'QUANTUM-AI', color: '#10b981', avatar: '⚡', personality: 'conservative' },
  { name: 'TITAN-AI', color: '#ec4899', avatar: '👑', personality: 'aggressive' },
  { name: 'SOLARIS-AI', color: '#ef4444', avatar: '🚀', personality: 'balanced' },
];

/**
 * Initializes a clean new game state based on Mode
 */
export function createInitialGameState(userConfig: Partial<GameConfig> = {}): GameState {
  const config: GameConfig = { ...DEFAULT_CONFIG, ...userConfig };
  const players: Player[] = [];

  if (config.mode === 'pass_and_play') {
    const humanCount = Math.min(Math.max(2, config.humanCount || 2), 6);
    const defaultAvatars = ['👨‍✈️', '👑', '💎', '🚀', '🤖', '⚡'];
    for (let i = 0; i < humanCount; i++) {
      players.push({
        id: `player-${i + 1}`,
        name: `PLAYER ${i + 1}`,
        color: COLOR_OPTIONS[i] || '#06b6d4',
        money: config.startingCash,
        position: 0,
        properties: [],
        bankrupt: false,
        isAI: false,
        avatar: defaultAvatars[i] || '👨‍✈️',
        stats: {
          rentCollected: 0,
          rentPaid: 0,
          propertiesBought: 0,
          developmentsBuilt: 0,
          peakNetWorth: config.startingCash,
          stockMarketProfit: 0,
          auctionsWon: 0,
        },
      });
    }
  } else if (config.mode === 'online_multiplayer') {
    players.push({
      id: config.myPeerId || 'host-player',
      peerId: config.myPeerId,
      name: 'HOST EMPIRE',
      color: '#06b6d4',
      money: config.startingCash,
      position: 0,
      properties: [],
      bankrupt: false,
      isAI: false,
      avatar: '👨‍✈️',
      isReady: true,
      stats: {
        rentCollected: 0,
        rentPaid: 0,
        propertiesBought: 0,
        developmentsBuilt: 0,
        peakNetWorth: config.startingCash,
        stockMarketProfit: 0,
        auctionsWon: 0,
      },
    });
  } else {
    // Solo vs AI
    players.push({
      id: 'commander',
      name: 'COMMANDER',
      color: '#06b6d4',
      money: config.startingCash,
      position: 0,
      properties: [],
      bankrupt: false,
      isAI: false,
      avatar: '👨‍✈️',
      stats: {
        rentCollected: 0,
        rentPaid: 0,
        propertiesBought: 0,
        developmentsBuilt: 0,
        peakNetWorth: config.startingCash,
        stockMarketProfit: 0,
        auctionsWon: 0,
      },
    });

    const aiToSpawn = Math.min(Math.max(1, config.aiCount), 5);
    for (let i = 0; i < aiToSpawn; i++) {
      const bot = BOT_ROSTER[i];
      players.push({
        id: `bot-${i + 1}`,
        name: bot.name,
        color: bot.color,
        money: config.startingCash,
        position: 0,
        properties: [],
        bankrupt: false,
        isAI: true,
        avatar: bot.avatar,
        aiPersonality: bot.personality,
        stats: {
          rentCollected: 0,
          rentPaid: 0,
          propertiesBought: 0,
          developmentsBuilt: 0,
          peakNetWorth: config.startingCash,
          stockMarketProfit: 0,
          auctionsWon: 0,
        },
      });
    }
  }

  const initialSpaces = INITIAL_BOARD_SPACES.map(s => ({
    ...s,
    owner: null,
    level: 0,
    mortgaged: false,
  }));

  const initialLog: GameLog = {
    id: `log-init-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    round: 1,
    type: 'system',
    text: `Season commenced! Global empires deployed with ${formatCurrency(config.startingCash)} treasury reserves.`,
  };

  const rawState: GameState = {
    config,
    status: config.mode === 'online_multiplayer' ? 'LOBBY' : 'ROLL_REQUIRED',
    round: 1,
    turnIndex: 0,
    players,
    spaces: initialSpaces,
    market: INITIAL_MARKET_STATE,
    regionalEvents: {
      europe: null,
      middle_east: null,
      asia: null,
      americas: null,
    },
    dice: [3, 4],
    diceRolling: false,
    pendingSpace: null,
    activeEvent: null,
    activeTrade: null,
    auction: null,
    stockMarket: {
      isOpen: false,
      roundsRemaining: 0,
      totalDurationRounds: 0,
      investments: {},
      lastOutcome: null,
    },
    selectedPropertyIndex: null,
    logs: [initialLog],
    chats: [],
    winner: null,
    isMovingPawn: false,
  };

  return validateGameStateIntegrity(rawState);
}

/**
 * Handles adding a remote player to multiplayer lobby
 */
export function addMultiplayerPeer(
  state: GameState,
  playerId: string,
  peerId: string,
  name: string,
  color: Player['color'],
  avatar: string
): GameState {
  if (state.players.some(p => p.id === playerId || (peerId && p.peerId === peerId)) || state.players.length >= 6) {
    return state;
  }

  const newPlayer: Player = {
    id: playerId,
    peerId,
    name: name.toUpperCase() || `EMPIRE ${state.players.length + 1}`,
    color,
    money: state.config.startingCash,
    position: 0,
    properties: [],
    bankrupt: false,
    isAI: false,
    avatar: avatar || '🌐',
    isReady: true,
    stats: {
      rentCollected: 0,
      rentPaid: 0,
      propertiesBought: 0,
      developmentsBuilt: 0,
      peakNetWorth: state.config.startingCash,
      stockMarketProfit: 0,
      auctionsWon: 0,
    },
  };

  return {
    ...state,
    players: [...state.players, newPlayer],
    logs: [{
      id: `log-join-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      round: state.round,
      type: 'system',
      text: `📡 ${newPlayer.name} linked to strategic simulation!`,
    }, ...state.logs.slice(0, 99)],
  };
}

export function removeMultiplayerPeer(state: GameState, peerId: string): GameState {
  const player = state.players.find(p => p.peerId === peerId || p.id === peerId);
  if (!player) return state;

  const cleanedSpaces = state.spaces.map(s => {
    if (s.owner === player.id) {
      return { ...s, owner: null, level: 0, mortgaged: false };
    }
    return s;
  });

  const updatedPlayers = state.players.filter(p => p.id !== player.id);

  return {
    ...state,
    players: updatedPlayers.length > 0 ? updatedPlayers : state.players,
    spaces: cleanedSpaces,
    turnIndex: state.turnIndex >= updatedPlayers.length ? 0 : state.turnIndex,
    logs: [{
      id: `log-disc-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      round: state.round,
      type: 'system',
      text: `⚠️ ${player.name} disconnected. Assets liquidated.`,
    }, ...state.logs.slice(0, 99)],
  };
}

export function addChatMessageAction(state: GameState, chat: ChatMessage): GameState {
  return {
    ...state,
    chats: [...state.chats.slice(-40), chat],
    logs: [{
      id: `log-chat-${Date.now()}`,
      timestamp: chat.timestamp,
      round: state.round,
      type: 'chat',
      text: `💬 [${chat.senderName}]: ${chat.text}`,
    }, ...state.logs.slice(0, 99)],
  };
}

/**
 * Executes a deterministic dice roll
 */
export function rollDiceAction(state: GameState): {
  nextState: GameState;
  dice: [number, number];
  rollTotal: number;
} {
  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  const rollTotal = d1 + d2;

  const currentPlayer = state.players[state.turnIndex];
  const logEntry: GameLog = {
    id: `log-roll-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    round: state.round,
    type: 'roll',
    text: `${currentPlayer?.name || 'Player'} rolled ${d1} & ${d2} (Total: ${rollTotal}).`,
  };

  audio.playDiceRoll();

  return {
    nextState: {
      ...state,
      dice: [d1, d2],
      diceRolling: false,
      status: 'MOVING',
      isMovingPawn: true,
      logs: [logEntry, ...state.logs.slice(0, 99)],
    },
    dice: [d1, d2],
    rollTotal,
  };
}

/**
 * Triggers a Global Auction for a specific property
 */
export function startAuctionAction(state: GameState, spaceIndex: number, sellerId: string | null = null): GameState {
  const space = state.spaces[spaceIndex];
  if (!space) return state;

  const startingBid = Math.round(space.price * 0.5) || 100;
  const solventPlayers = state.players.filter(p => !p.bankrupt);

  const auctionState: AuctionState = {
    spaceIndex,
    currentBid: startingBid,
    highestBidderId: null,
    highestBidderName: null,
    activeBidderIds: solventPlayers.map(p => p.id),
    sellerId,
    timeLeft: 10,
    log: [`Auction started for ${space.name} with opening bid of ${formatCurrency(startingBid)}.`],
  };

  const logEntry: GameLog = {
    id: `log-auc-start-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    round: state.round,
    type: 'auction',
    text: `🏛️ GLOBAL AUCTION: ${space.name} put up for international bidding! (Opening: ${formatCurrency(startingBid)})`,
  };

  audio.playEventNotification();

  return {
    ...state,
    auction: auctionState,
    status: 'AUCTION_ACTIVE',
    logs: [logEntry, ...state.logs.slice(0, 99)],
  };
}

/**
 * Places a bid in the Global Auction
 */
export function placeAuctionBidAction(state: GameState, bidderId: string, bidAmount: number): GameState {
  if (!state.auction || bidAmount <= state.auction.currentBid) return state;

  const bidder = state.players.find(p => p.id === bidderId);
  if (!bidder || bidder.money < bidAmount) return state;

  const space = state.spaces[state.auction.spaceIndex];

  const updatedAuction: AuctionState = {
    ...state.auction,
    currentBid: bidAmount,
    highestBidderId: bidderId,
    highestBidderName: bidder.name,
    timeLeft: 8, // Reset timer to 8s on each new bid
    log: [`${bidder.name} bid ${formatCurrency(bidAmount)}!`, ...state.auction.log.slice(0, 5)],
  };

  const logEntry: GameLog = {
    id: `log-bid-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    round: state.round,
    type: 'auction',
    text: `⚡ AUCTION: ${bidder.name} bid ${formatCurrency(bidAmount)} for ${space?.name || 'property'}.`,
  };

  audio.playUpgrade();

  return {
    ...state,
    auction: updatedAuction,
    logs: [logEntry, ...state.logs.slice(0, 99)],
  };
}

/**
 * Finalizes Global Auction when timer reaches 0 or all others pass
 */
export function finalizeAuctionAction(state: GameState): GameState {
  if (!state.auction) return state;

  const { spaceIndex, highestBidderId, currentBid, sellerId } = state.auction;
  if (!highestBidderId) {
    // No one placed a bid
    const logEntry: GameLog = {
      id: `log-auc-none-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      round: state.round,
      type: 'auction',
      text: `🏛️ AUCTION CONCLUDED: No bids placed. Property remains in current state.`,
    };
    return {
      ...state,
      auction: null,
      status: 'TURN_END',
      logs: [logEntry, ...state.logs.slice(0, 99)],
    };
  }

  return executeAuctionWin(state, spaceIndex, highestBidderId, currentBid, sellerId);
}

/**
 * Player commits investment into a specific Company in the High-Risk Stock Market
 */
export function investStockMarketAction(
  state: GameState,
  playerId: string,
  companyId: string,
  amount: number
): GameState {
  const player = state.players.find(p => p.id === playerId);
  if (!player || amount <= 0 || player.money < amount) return state;

  const targetCompany = STOCK_COMPANIES.find(c => c.id === companyId) || STOCK_COMPANIES[0];

  const updatedPlayers = state.players.map(p => {
    if (p.id === playerId) {
      return { ...p, money: p.money - amount };
    }
    return p;
  });

  const playerInvestments = state.stockMarket.investments[playerId] || [];
  const existingIndex = playerInvestments.findIndex(i => i.companyId === targetCompany.id);

  let newInvestments: PlayerStockInvestment[];
  if (existingIndex >= 0) {
    newInvestments = playerInvestments.map((inv, idx) =>
      idx === existingIndex ? { ...inv, amount: inv.amount + amount } : inv
    );
  } else {
    newInvestments = [...playerInvestments, { companyId: targetCompany.id, amount }];
  }

  const updatedInvestmentsMap = {
    ...state.stockMarket.investments,
    [playerId]: newInvestments,
  };

  const logEntry: GameLog = {
    id: `log-stock-inv-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    round: state.round,
    type: 'stock',
    text: `📈 ${player.name} allocated ${formatCurrency(amount)} into ${targetCompany.ticker} (${targetCompany.name})!`,
  };

  audio.playCashRegister();

  return {
    ...state,
    players: updatedPlayers,
    stockMarket: {
      ...state.stockMarket,
      investments: updatedInvestmentsMap,
    },
    logs: [logEntry, ...state.logs.slice(0, 99)],
  };
}

/**
 * Handles landing on a space once pawn finishes step-by-step movement
 */
export function handleSpaceLanding(state: GameState, playerIndex: number): GameState {
  const player = state.players[playerIndex];
  if (!player || player.bankrupt) {
    return endTurnAction(state);
  }

  const space = state.spaces[player.position];
  if (!space) {
    return endTurnAction(state);
  }

  const isHuman = !player.isAI;

  // 1. GLOBAL AUCTION CORNER (Space 16)
  if (space.type === 'auction') {
    const unownedSpaces = state.spaces.filter(s => (s.type === 'city' || s.type === 'transport') && s.owner === null);
    if (unownedSpaces.length > 0) {
      const targetSpace = unownedSpaces[Math.floor(Math.random() * unownedSpaces.length)];
      return startAuctionAction(state, targetSpace.index, null);
    } else {
      const logEntry: GameLog = {
        id: `log-auc-all-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        round: state.round,
        type: 'system',
        text: `🏛️ Global Auction: All properties are owned. ${player.name} received $200 liquidity bonus.`,
      };
      const updatedPlayers = state.players.map(p => (p.id === player.id ? { ...p, money: p.money + 200 } : p));
      return {
        ...state,
        players: updatedPlayers,
        status: 'TURN_END',
        pendingSpace: null,
        isMovingPawn: false,
        logs: [logEntry, ...state.logs.slice(0, 99)],
      };
    }
  }

  // 2. UNOWNED CITY OR TRANSPORT PROPERTY
  if ((space.type === 'city' || space.type === 'transport') && space.owner === null) {
    if (isHuman) {
      return {
        ...state,
        status: 'PROPERTY_DECISION',
        pendingSpace: space,
        isMovingPawn: false,
      };
    } else {
      const shouldBuy = decideAIPurchase(player, space, state);
      if (shouldBuy) {
        const { newState } = executePropertyPurchase(state, player.id, space.index);
        return { ...newState, isMovingPawn: false };
      } else {
        return { ...state, status: 'TURN_END', pendingSpace: null, isMovingPawn: false };
      }
    }
  }

  // 3. ENEMY OWNED PROPERTY -> PAY RENT
  if ((space.type === 'city' || space.type === 'transport') && space.owner && space.owner !== player.id) {
    const { newState } = executeRentPayment(state, player.id, space);
    return { ...newState, isMovingPawn: false };
  }

  // 4. TAX SPACE
  if (space.type === 'tax') {
    const { newState } = executeTaxPayment(state, player.id);
    return { ...newState, isMovingPawn: false };
  }

  // 5. WORLD EVENT SPACE
  if (space.type === 'world_event') {
    const { newState } = triggerWorldEvent(state, player.id);
    return { ...newState, isMovingPawn: false };
  }

  // 6. MARKET SHOCK SPACE
  if (space.type === 'market_shock') {
    const { newState } = triggerMarketShock(state, space.index);
    return { ...newState, isMovingPawn: false };
  }

  // 7. SPECIAL HUBS & START
  let hubText = '';
  if (space.type === 'start') {
    hubText = `${player.name} is stationed at Global Expedition Command.`;
  } else if (space.type === 'financial_hub') {
    hubText = `${player.name} conducted sovereign reserves auditing at World Financial Hub.`;
  } else if (space.type === 'free_trade') {
    hubText = `${player.name} anchored at Free Trade Strategic Zone (Tariff-free).`;
  } else {
    hubText = `${player.name} landed on ${space.name}.`;
  }

  const logEntry: GameLog = {
    id: `log-hub-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    round: state.round,
    type: 'system',
    text: hubText,
  };

  return {
    ...state,
    status: 'TURN_END',
    pendingSpace: null,
    isMovingPawn: false,
    logs: [logEntry, ...state.logs.slice(0, 99)],
  };
}

export function buyPropertyAction(state: GameState, playerId: string, spaceIndex: number): GameState {
  const { newState } = executePropertyPurchase(state, playerId, spaceIndex);
  return newState;
}

export function passPropertyAction(state: GameState): GameState {
  return {
    ...state,
    status: 'TURN_END',
    pendingSpace: null,
  };
}

export function developPropertyAction(state: GameState, playerId: string, spaceIndex: number): GameState {
  const { newState } = executePropertyDevelopment(state, playerId, spaceIndex);
  return newState;
}

export function proposeTradeAction(
  state: GameState,
  trade: TradeOffer
): { nextState: GameState; accepted: boolean; message: string } {
  const targetPlayer = state.players.find(p => p.id === trade.toPlayerId);
  if (!targetPlayer) {
    return { nextState: state, accepted: false, message: 'Recipient not found.' };
  }

  if (targetPlayer.isAI) {
    const evalResult = evaluateAITradeOffer(targetPlayer, trade, state);
    if (evalResult.accept) {
      const { newState, message } = executeAtomicTrade(state, trade);
      return { nextState: newState, accepted: true, message };
    } else {
      const logEntry: GameLog = {
        id: `log-trade-rej-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        round: state.round,
        type: 'trade',
        text: `Proposal rejected: ${evalResult.reason}`,
      };
      return {
        nextState: {
          ...state,
          logs: [logEntry, ...state.logs.slice(0, 99)],
        },
        accepted: false,
        message: evalResult.reason,
      };
    }
  }

  const { newState, message } = executeAtomicTrade(state, trade);
  return { nextState: newState, accepted: true, message };
}

/**
 * Advances the turn, manages round evolution, and resolves Stock Market cycles
 */
export function endTurnAction(state: GameState): GameState {
  let stateAfterAIDev = { ...state };
  const currentActing = state.players[state.turnIndex];
  if (currentActing && currentActing.isAI && !currentActing.bankrupt) {
    const devTargetIndex = evaluateAIDevelopment(currentActing, stateAfterAIDev);
    if (devTargetIndex !== null) {
      const { newState } = executePropertyDevelopment(stateAfterAIDev, currentActing.id, devTargetIndex);
      stateAfterAIDev = newState;
    }
  }

  const solventPlayers = stateAfterAIDev.players.filter(p => !p.bankrupt);
  if (solventPlayers.length <= 1) {
    const winner = solventPlayers[0] || stateAfterAIDev.players[0];
    audio.playVictoryFanfare();
    return {
      ...stateAfterAIDev,
      status: 'GAME_OVER',
      winner,
      pendingSpace: null,
      activeEvent: null,
      auction: null,
    };
  }

  let nextTurn = (stateAfterAIDev.turnIndex + 1) % stateAfterAIDev.players.length;
  while (stateAfterAIDev.players[nextTurn]?.bankrupt) {
    nextTurn = (nextTurn + 1) % stateAfterAIDev.players.length;
  }

  let nextRound = stateAfterAIDev.round;
  let roundEvolutionState = stateAfterAIDev;

  // When round wraps around to first player, trigger macro economy & stock market cycle
  if (nextTurn === 0) {
    nextRound += 1;
    roundEvolutionState = processRoundEconomyEvolution(stateAfterAIDev);

    // Stock Market Cycle Processing
    const stockState = { ...roundEvolutionState.stockMarket };
    if (stockState.isOpen) {
      if (stockState.roundsRemaining > 1) {
        stockState.roundsRemaining -= 1;
        roundEvolutionState = { ...roundEvolutionState, stockMarket: stockState };
      } else {
        // Stock Market Closes & Resolves with Sector Dynamics & High Volatility!
        // 1. Compute market effect for ALL 7 companies
        const companyReports: CompanyMarketReport[] = STOCK_COMPANIES.map(company => {
          let baseFactor = 1.0;
          const condition = roundEvolutionState.market.condition;

          if (condition === 'GROWING') baseFactor += 0.25;
          else if (condition === 'STABLE') baseFactor += 0.10;
          else if (condition === 'VOLATILE') baseFactor += (Math.random() > 0.5 ? 0.35 : -0.35);
          else if (condition === 'RECESSION') baseFactor -= 0.20;
          else if (condition === 'CRASH') {
            if (company.sector === 'agri') baseFactor += 0.15; // Defensive food hedge
            else baseFactor -= 0.35;
          }

          const roll = Math.random();
          let multiplier = 1.0;
          let isWin = true;
          let headline = '';

          if (roll < 0.28) {
            // MOONSHOT (+200% to +500%)
            multiplier = Number((baseFactor * (Math.random() * 3.0 + 3.0)).toFixed(2));
            isWin = true;
            headline = `🚀 Record contracts & breakthrough delivers a massive moonshot rally for ${company.name}!`;
          } else if (roll < 0.62) {
            // STRONG BULL RALLY (+40% to +130%)
            multiplier = Number((baseFactor * (Math.random() * 0.9 + 1.4)).toFixed(2));
            isWin = true;
            headline = `📈 Bullish institutional capital accumulation pushes ${company.ticker} higher!`;
          } else if (roll < 0.76) {
            // SIDEWAYS (-20% to +20%)
            multiplier = Number((baseFactor * (Math.random() * 0.4 + 0.8)).toFixed(2));
            isWin = multiplier >= 1.0;
            headline = `⚖️ High-frequency algorithmic consolidation across ${company.sectorLabel}.`;
          } else {
            // LIQUIDITY MELTDOWN (-60% to -100%)
            multiplier = Number((Math.random() * 0.4).toFixed(2)); // 0.0x to 0.4x
            isWin = false;
            headline = `💀 Severe liquidity crunch / short attack triggers heavy crash for ${company.ticker}!`;
          }

          return {
            companyId: company.id,
            companyName: company.name,
            companyTicker: company.ticker,
            companyIcon: company.icon,
            sectorLabel: company.sectorLabel,
            multiplier,
            isWin,
            headline,
            color: company.color,
          };
        });

        // 2. Compute matching payouts for each player who participated
        const playerOutcomes: PlayerOutcomeReport[] = [];
        let updatedPlayers = [...roundEvolutionState.players];

        Object.entries(stockState.investments).forEach(([playerId, investmentsList]) => {
          const player = updatedPlayers.find(p => p.id === playerId);
          if (player && Array.isArray(investmentsList) && investmentsList.length > 0) {
            investmentsList.forEach(inv => {
              if (inv.amount <= 0) return;
              const report = companyReports.find(r => r.companyId === inv.companyId) || companyReports[0];
              const returned = Math.round(inv.amount * report.multiplier);
              const profit = returned - inv.amount;

              updatedPlayers = updatedPlayers.map(p => {
                if (p.id === playerId) {
                  return {
                    ...p,
                    money: p.money + returned,
                    stats: {
                      ...p.stats,
                      stockMarketProfit: p.stats.stockMarketProfit + profit,
                    },
                  };
                }
                return p;
              });

              playerOutcomes.push({
                playerId,
                playerName: player.name,
                companyId: report.companyId,
                companyName: report.companyName,
                companyTicker: report.companyTicker,
                companyIcon: report.companyIcon,
                invested: inv.amount,
                returned,
                profit,
                multiplier: report.multiplier,
                isWin: report.isWin,
              });
            });
          }
        });

        stockState.isOpen = false;
        stockState.roundsRemaining = 0;
        stockState.totalDurationRounds = 0;
        stockState.investments = {};
        stockState.lastOutcome = {
          companies: companyReports,
          playerOutcomes,
          timestamp: Date.now(),
        };

        const logEntry: GameLog = {
          id: `log-stock-close-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          round: nextRound,
          type: 'stock',
          text: `⚡ STOCK EXCHANGE CLOSED: Market resolutions computed across all listed enterprise sectors!`,
        };

        roundEvolutionState = {
          ...roundEvolutionState,
          players: updatedPlayers,
          stockMarket: stockState,
          status: 'ROLL_REQUIRED',
          logs: [logEntry, ...roundEvolutionState.logs.slice(0, 99)],
        };
      }
    } else {
      // 35% chance to randomly open High-Risk Stock Market window with RANDOM DURATION (1, 2, or 3 rounds)
      if (Math.random() < 0.35 && nextRound < roundEvolutionState.config.roundLimit) {
        const randomDuration = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3 rounds randomly
        stockState.isOpen = true;
        stockState.roundsRemaining = randomDuration;
        stockState.totalDurationRounds = randomDuration;
        stockState.investments = {};
        stockState.lastOutcome = null;

        const logEntry: GameLog = {
          id: `log-stock-open-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          round: nextRound,
          type: 'stock',
          text: `🚨 SIREN ALERT: High-Risk Stock Exchange Opened! Active for ${randomDuration} round${randomDuration > 1 ? 's' : ''}!`,
        };

        audio.playStockMarketSiren();

        roundEvolutionState = {
          ...roundEvolutionState,
          stockMarket: stockState,
          status: 'ROLL_REQUIRED',
          logs: [logEntry, ...roundEvolutionState.logs.slice(0, 99)],
        };
      }
    }

    if (nextRound > roundEvolutionState.config.roundLimit) {
      const rankedPlayers = [...roundEvolutionState.players]
        .filter(p => !p.bankrupt)
        .sort((a, b) => calculatePlayerNetWorth(b, roundEvolutionState) - calculatePlayerNetWorth(a, roundEvolutionState));

      const winner = rankedPlayers[0] || roundEvolutionState.players[0];
      audio.playVictoryFanfare();
      return {
        ...roundEvolutionState,
        round: roundEvolutionState.config.roundLimit,
        status: 'GAME_OVER',
        winner,
        pendingSpace: null,
        activeEvent: null,
        auction: null,
      };
    }
  }

  while (roundEvolutionState.players[nextTurn]?.bankrupt) {
    nextTurn = (nextTurn + 1) % roundEvolutionState.players.length;
  }

  return {
    ...roundEvolutionState,
    round: nextRound,
    turnIndex: nextTurn,
    status: 'ROLL_REQUIRED',
    pendingSpace: null,
    activeEvent: null,
    diceRolling: false,
    isMovingPawn: false,
  };
}
