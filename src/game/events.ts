import { WORLD_EVENTS_POOL, MARKET_SHOCK_EVENTS } from '../data/eventData';
import { MARKET_CONDITIONS, REGIONAL_EVENTS_POOL } from '../data/marketData';
import { GameEvent, GameLog, GameState, MarketCondition, RegionGroup } from '../types';
import { audio } from './audioEngine';

/**
 * Draws and applies a random World Event
 */
export function triggerWorldEvent(state: GameState, activePlayerId: string): { newState: GameState; event: GameEvent } {
  const randomIndex = Math.floor(Math.random() * WORLD_EVENTS_POOL.length);
  const event = WORLD_EVENTS_POOL[randomIndex];

  const activePlayer = state.players.find(p => p.id === activePlayerId);
  let updatedPlayers = [...state.players];
  let updatedSpaces = [...state.spaces];

  if (event.actionType === 'all_players_bonus' && event.value) {
    const val = event.value;
    updatedPlayers = updatedPlayers.map(p => (!p.bankrupt ? { ...p, money: p.money + val } : p));
  } else if (event.actionType === 'cash_bonus' && event.value && activePlayer) {
    const val = event.value;
    updatedPlayers = updatedPlayers.map(p => (p.id === activePlayerId ? { ...p, money: p.money + val } : p));
  } else if (event.actionType === 'cash_tax' && event.value && activePlayer) {
    const val = event.value;
    updatedPlayers = updatedPlayers.map(p => (p.id === activePlayerId ? { ...p, money: Math.max(0, p.money - val) } : p));
  } else if (event.actionType === 'dividend_payout' && event.value && activePlayer) {
    const totalBonus = activePlayer.properties.length * event.value;
    updatedPlayers = updatedPlayers.map(p => (p.id === activePlayerId ? { ...p, money: p.money + totalBonus } : p));
  } else if (event.actionType === 'free_development' && activePlayer) {
    // Find lowest level property owned by player
    const ownedSpaces = updatedSpaces.filter(s => s.owner === activePlayerId && s.level < 3);
    if (ownedSpaces.length > 0) {
      const targetSpace = ownedSpaces.reduce((prev, curr) => (prev.level < curr.level ? prev : curr));
      updatedSpaces = updatedSpaces.map(s => (s.index === targetSpace.index ? { ...s, level: s.level + 1 } : s));
    }
  }

  const logEntry: GameLog = {
    id: `log-event-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    round: state.round,
    type: 'event',
    text: `📡 WORLD EVENT: "${event.title}" - ${event.effectText}`,
  };

  audio.playEventNotification();

  return {
    newState: {
      ...state,
      players: updatedPlayers,
      spaces: updatedSpaces,
      activeEvent: event,
      status: 'EVENT_NOTIFICATION',
      logs: [logEntry, ...state.logs.slice(0, 99)],
    },
    event,
  };
}

/**
 * Draws and applies a Market Shock event
 */
export function triggerMarketShock(state: GameState): { newState: GameState; event: GameEvent } {
  const randomIndex = Math.floor(Math.random() * MARKET_SHOCK_EVENTS.length);
  const event = MARKET_SHOCK_EVENTS[randomIndex];

  const newCondition: MarketCondition = event.targetMarket || 'VOLATILE';
  const condConfig = MARKET_CONDITIONS[newCondition] || MARKET_CONDITIONS.STABLE;

  const prevHistory = state.market?.history || [1.0];
  const newHistory = [...prevHistory.slice(-9), condConfig.multiplier];

  const logEntry: GameLog = {
    id: `log-market-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    round: state.round,
    type: 'market',
    text: `⚡ MARKET SHOCK: Global economy transitioned to ${condConfig.title} (${condConfig.multiplier}x yields).`,
  };

  audio.playEventNotification();

  return {
    newState: {
      ...state,
      market: {
        condition: newCondition,
        multiplier: condConfig.multiplier,
        durationRounds: 3,
        title: condConfig.title,
        description: condConfig.description,
        trend: condConfig.trend,
        history: newHistory,
      },
      activeEvent: event,
      status: 'EVENT_NOTIFICATION',
      logs: [logEntry, ...state.logs.slice(0, 99)],
    },
    event,
  };
}

/**
 * Advances market rounds and cycles regional events on new round start
 */
export function processRoundEconomyEvolution(state: GameState): GameState {
  let currentMarket = { ...state.market };
  const prevHistory = currentMarket.history || [1.0];

  // Decrement market duration
  if (currentMarket.durationRounds > 1) {
    currentMarket.durationRounds -= 1;
    // Add small fluctuation to chart history
    const jitter = (Math.random() - 0.5) * 0.05;
    currentMarket.history = [...prevHistory.slice(-9), Math.max(0.5, Number((currentMarket.multiplier + jitter).toFixed(2)))];
  } else {
    // Pick next cyclical market condition
    const conditions: MarketCondition[] = ['STABLE', 'GROWING', 'BOOM', 'VOLATILE', 'RECESSION'];
    const nextCond = conditions[Math.floor(Math.random() * conditions.length)];
    const config = MARKET_CONDITIONS[nextCond];
    currentMarket = {
      condition: nextCond,
      multiplier: config.multiplier,
      durationRounds: Math.floor(Math.random() * 3) + 2,
      title: config.title,
      description: config.description,
      trend: config.trend,
      history: [...prevHistory.slice(-9), config.multiplier],
    };
  }

  // Update or spawn regional news
  const updatedRegional = { ...state.regionalEvents };
  const regions: RegionGroup[] = ['europe', 'middle_east', 'asia', 'americas'];
  
  // Decrement active regional events
  regions.forEach(reg => {
    const active = updatedRegional[reg];
    if (active) {
      if (active.roundsRemaining > 1) {
        updatedRegional[reg] = { ...active, roundsRemaining: active.roundsRemaining - 1 };
      } else {
        updatedRegional[reg] = null;
      }
    }
  });

  // 45% chance to spawn a new regional shock
  if (Math.random() < 0.45) {
    const randomNews = REGIONAL_EVENTS_POOL[Math.floor(Math.random() * REGIONAL_EVENTS_POOL.length)];
    updatedRegional[randomNews.region] = { ...randomNews };
  }

  return {
    ...state,
    market: currentMarket,
    regionalEvents: updatedRegional,
  };
}
