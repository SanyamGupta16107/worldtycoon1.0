import { GameState } from '../types';

/**
 * Ensures complete data integrity across all game state variables.
 * Catches any NaN, null pointers, out-of-bounds positions, or invalid ownership.
 */
export function validateGameStateIntegrity(state: GameState): GameState {
  // Validate players
  const cleanPlayers = state.players.map((p, idx) => {
    const money = isNaN(p.money) || p.money === null || p.money === undefined ? 0 : Math.round(p.money);
    const position = isNaN(p.position) || p.position < 0 || p.position > 31 ? 0 : Math.floor(p.position) % 32;
    const properties = Array.isArray(p.properties) ? Array.from(new Set(p.properties.filter(id => id >= 0 && id <= 31))) : [];

    return {
      ...p,
      id: p.id || `player-${idx + 1}`,
      name: p.name || `Empire ${idx + 1}`,
      money,
      position,
      properties,
      bankrupt: Boolean(p.bankrupt || (money <= 0 && properties.length === 0)),
      stats: {
        rentCollected: isNaN(p.stats?.rentCollected) ? 0 : p.stats.rentCollected,
        rentPaid: isNaN(p.stats?.rentPaid) ? 0 : p.stats.rentPaid,
        propertiesBought: isNaN(p.stats?.propertiesBought) ? 0 : p.stats.propertiesBought,
        developmentsBuilt: isNaN(p.stats?.developmentsBuilt) ? 0 : p.stats.developmentsBuilt,
        peakNetWorth: isNaN(p.stats?.peakNetWorth) ? Math.max(0, money) : Math.max(p.stats.peakNetWorth, money),
        stockMarketProfit: isNaN(p.stats?.stockMarketProfit) ? 0 : p.stats.stockMarketProfit,
        auctionsWon: isNaN(p.stats?.auctionsWon) ? 0 : p.stats.auctionsWon,
      }
    };
  });

  // Validate spaces
  const cleanSpaces = state.spaces.map((s, idx) => {
    // Ensure ownership reflects in players list
    let validOwner = s.owner;
    if (validOwner) {
      const ownerExists = cleanPlayers.some(p => p.id === validOwner && !p.bankrupt);
      if (!ownerExists) {
        validOwner = null;
      }
    }

    return {
      ...s,
      index: idx,
      price: isNaN(s.price) ? 200 : s.price,
      baseRent: isNaN(s.baseRent) ? 20 : s.baseRent,
      developmentCost: isNaN(s.developmentCost) ? 100 : s.developmentCost,
      level: Math.min(Math.max(0, s.level || 0), 3),
      owner: validOwner,
    };
  });

  // Validate dice
  const d1 = isNaN(state.dice?.[0]) || state.dice[0] < 1 || state.dice[0] > 6 ? 1 : state.dice[0];
  const d2 = isNaN(state.dice?.[1]) || state.dice[1] < 1 || state.dice[1] > 6 ? 1 : state.dice[1];

  // Validate turnIndex
  let validTurn = state.turnIndex;
  if (validTurn < 0 || validTurn >= cleanPlayers.length) {
    validTurn = 0;
  }

  return {
    ...state,
    players: cleanPlayers,
    spaces: cleanSpaces,
    dice: [d1, d2],
    turnIndex: validTurn,
    round: Math.max(1, state.round || 1),
  };
}
