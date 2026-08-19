import { BoardSpace, GameLog, GameState, Player, TradeOffer } from '../types';
import {
  calculatePropertyRent,
  calculatePlayerNetWorth,
  calculatePropertyMarketValue,
  canDevelopRegion,
  getMortgageValue,
  getUnmortgageCost,
  getBankSellValue,
} from '../utils/calculations';
import { formatCurrency } from '../utils/formatting';
import { audio } from './audioEngine';

/**
 * Purchases a property for a player atomically
 */
export function executePropertyPurchase(
  state: GameState,
  playerId: string,
  spaceIndex: number
): { newState: GameState; success: boolean; message: string } {
  const player = state.players.find(p => p.id === playerId);
  const space = state.spaces[spaceIndex];

  if (!player || !space) {
    return { newState: state, success: false, message: 'Invalid player or space.' };
  }

  if (space.owner !== null) {
    return { newState: state, success: false, message: 'Property is already owned.' };
  }

  if (player.money < space.price) {
    return { newState: state, success: false, message: 'Insufficient treasury funds.' };
  }

  const updatedPlayers = state.players.map(p => {
    if (p.id === playerId) {
      const newMoney = Math.max(0, p.money - space.price);
      return {
        ...p,
        money: newMoney,
        properties: [...p.properties, spaceIndex],
        stats: {
          ...p.stats,
          propertiesBought: p.stats.propertiesBought + 1,
          peakNetWorth: Math.max(p.stats.peakNetWorth, p.money),
        }
      };
    }
    return p;
  });

  const updatedSpaces = state.spaces.map(s => {
    if (s.index === spaceIndex) {
      return { ...s, owner: playerId, mortgaged: false };
    }
    return s;
  });

  const logEntry: GameLog = {
    id: `log-${Date.now()}-${Math.random()}`,
    timestamp: new Date().toLocaleTimeString(),
    round: state.round,
    type: 'purchase',
    text: `${player.name} acquired ${space.name} for ${formatCurrency(space.price)}.`,
  };

  audio.playCashRegister();

  return {
    newState: {
      ...state,
      players: updatedPlayers,
      spaces: updatedSpaces,
      logs: [logEntry, ...state.logs.slice(0, 99)],
      status: 'TURN_END',
      pendingSpace: null,
    },
    success: true,
    message: `Acquired ${space.name}`,
  };
}

/**
 * Handles rent payment when player lands on an owned space
 */
export function executeRentPayment(
  state: GameState,
  payerId: string,
  space: BoardSpace
): { newState: GameState; rentAmount: number; isBankrupt: boolean } {
  if (!space.owner || space.owner === payerId || space.mortgaged) {
    return { newState: state, rentAmount: 0, isBankrupt: false };
  }

  const payer = state.players.find(p => p.id === payerId);
  const owner = state.players.find(p => p.id === space.owner);

  if (!payer || !owner || payer.bankrupt) {
    return { newState: state, rentAmount: 0, isBankrupt: false };
  }

  const rentAmount = calculatePropertyRent(space, state);
  if (rentAmount <= 0) {
    return { newState: state, rentAmount: 0, isBankrupt: false };
  }

  const canAfford = payer.money >= rentAmount;
  const actualPaid = canAfford ? rentAmount : Math.max(0, payer.money);

  let payerBankrupt = false;
  let releasedSpaces = [...state.spaces];

  if (!canAfford) {
    payerBankrupt = true;
    audio.playRentPayment();
  } else {
    audio.playRentPayment();
  }

  const updatedPlayers = state.players.map(p => {
    if (p.id === payerId) {
      return {
        ...p,
        money: Math.max(0, p.money - actualPaid),
        bankrupt: payerBankrupt,
        properties: payerBankrupt ? [] : p.properties,
        stats: {
          ...p.stats,
          rentPaid: p.stats.rentPaid + actualPaid,
        }
      };
    }
    if (p.id === owner.id) {
      return {
        ...p,
        money: p.money + actualPaid,
        stats: {
          ...p.stats,
          rentCollected: p.stats.rentCollected + actualPaid,
          peakNetWorth: Math.max(p.stats.peakNetWorth, p.money + actualPaid),
        }
      };
    }
    return p;
  });

  if (payerBankrupt) {
    releasedSpaces = releasedSpaces.map(s => {
      if (s.owner === payerId) {
        return { ...s, owner: null, level: 0, mortgaged: false };
      }
      return s;
    });
  }

  const logEntries: GameLog[] = [
    {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
      round: state.round,
      type: 'rent',
      text: `${payer.name} paid ${formatCurrency(actualPaid)} rent to ${owner.name} at ${space.name}.`,
    }
  ];

  if (payerBankrupt) {
    logEntries.unshift({
      id: `log-bankrupt-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      round: state.round,
      type: 'bankruptcy',
      text: `🚨 ${payer.name} has gone BANKRUPT due to unpaid rent liabilities!`,
    });
  }

  return {
    newState: {
      ...state,
      players: updatedPlayers,
      spaces: releasedSpaces,
      logs: [...logEntries, ...state.logs.slice(0, 99)],
      status: 'TURN_END',
      pendingSpace: null,
    },
    rentAmount: actualPaid,
    isBankrupt: payerBankrupt,
  };
}

/**
 * Develops an owned property to the next tier (Level 0 -> 1 -> 2 -> 3)
 * ENFORCED: Must own at least 3 properties in the region!
 */
export function executePropertyDevelopment(
  state: GameState,
  playerId: string,
  spaceIndex: number
): { newState: GameState; success: boolean; message: string } {
  const player = state.players.find(p => p.id === playerId);
  const space = state.spaces[spaceIndex];

  if (!player || !space) {
    return { newState: state, success: false, message: 'Invalid player or space.' };
  }

  if (space.owner !== playerId) {
    return { newState: state, success: false, message: 'You do not own this holding.' };
  }

  if (space.mortgaged) {
    return { newState: state, success: false, message: 'Cannot develop a mortgaged property. Unmortgage it first.' };
  }

  // 3-Set Requirement Verification
  if (space.region && !canDevelopRegion(playerId, space.region, state.spaces)) {
    const owned = state.spaces.filter(s => s.region === space.region && s.owner === playerId).length;
    return {
      newState: state,
      success: false,
      message: `Strategic development protocol requires owning at least 3 properties in ${space.region.toUpperCase()} (currently own ${owned}/3).`,
    };
  }

  if (space.level >= 3) {
    return { newState: state, success: false, message: 'Property is already at maximum Tier 3 (Mega-Complex).' };
  }

  if (player.money < space.developmentCost) {
    return { newState: state, success: false, message: 'Insufficient treasury funds for development.' };
  }

  const newLevel = space.level + 1;
  const updatedPlayers = state.players.map(p => {
    if (p.id === playerId) {
      return {
        ...p,
        money: p.money - space.developmentCost,
        stats: {
          ...p.stats,
          developmentsBuilt: p.stats.developmentsBuilt + 1,
        }
      };
    }
    return p;
  });

  const updatedSpaces = state.spaces.map(s => {
    if (s.index === spaceIndex) {
      return { ...s, level: newLevel };
    }
    return s;
  });

  const tierNames = ['Base', 'Tier 1 Upgrade', 'Tier 2 Expansion', 'Mega-Complex'];
  const logEntry: GameLog = {
    id: `log-dev-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    round: state.round,
    type: 'development',
    text: `${player.name} upgraded ${space.name} to ${tierNames[newLevel]} for ${formatCurrency(space.developmentCost)}.`,
  };

  audio.playUpgrade();

  return {
    newState: {
      ...state,
      players: updatedPlayers,
      spaces: updatedSpaces,
      logs: [logEntry, ...state.logs.slice(0, 99)],
    },
    success: true,
    message: `Upgraded ${space.name} to ${tierNames[newLevel]}!`,
  };
}

/**
 * Mortgages an owned property for immediate 50% liquidity
 */
export function executeMortgageProperty(
  state: GameState,
  playerId: string,
  spaceIndex: number
): { newState: GameState; success: boolean; message: string } {
  const player = state.players.find(p => p.id === playerId);
  const space = state.spaces[spaceIndex];

  if (!player || !space || space.owner !== playerId) {
    return { newState: state, success: false, message: 'You do not own this property.' };
  }

  if (space.mortgaged) {
    return { newState: state, success: false, message: 'Property is already mortgaged.' };
  }

  const cashGained = getMortgageValue(space);

  const updatedPlayers = state.players.map(p => {
    if (p.id === playerId) {
      return { ...p, money: p.money + cashGained };
    }
    return p;
  });

  const updatedSpaces = state.spaces.map(s => {
    if (s.index === spaceIndex) {
      return { ...s, mortgaged: true };
    }
    return s;
  });

  const logEntry: GameLog = {
    id: `log-mort-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    round: state.round,
    type: 'system',
    text: `🏛️ ${player.name} mortgaged ${space.name} to unlock ${formatCurrency(cashGained)} liquid reserves.`,
  };

  audio.playCashRegister();

  return {
    newState: {
      ...state,
      players: updatedPlayers,
      spaces: updatedSpaces,
      logs: [logEntry, ...state.logs.slice(0, 99)],
    },
    success: true,
    message: `Mortgaged ${space.name} for ${formatCurrency(cashGained)}. (Rent collection disabled until unmortgaged)`,
  };
}

/**
 * Unmortgages a property by paying mortgage value + 10% fee
 */
export function executeUnmortgageProperty(
  state: GameState,
  playerId: string,
  spaceIndex: number
): { newState: GameState; success: boolean; message: string } {
  const player = state.players.find(p => p.id === playerId);
  const space = state.spaces[spaceIndex];

  if (!player || !space || space.owner !== playerId) {
    return { newState: state, success: false, message: 'You do not own this property.' };
  }

  if (!space.mortgaged) {
    return { newState: state, success: false, message: 'Property is not currently mortgaged.' };
  }

  const unmortgageCost = getUnmortgageCost(space);
  if (player.money < unmortgageCost) {
    return { newState: state, success: false, message: `Insufficient cash to unmortgage (${formatCurrency(unmortgageCost)} required).` };
  }

  const updatedPlayers = state.players.map(p => {
    if (p.id === playerId) {
      return { ...p, money: p.money - unmortgageCost };
    }
    return p;
  });

  const updatedSpaces = state.spaces.map(s => {
    if (s.index === spaceIndex) {
      return { ...s, mortgaged: false };
    }
    return s;
  });

  const logEntry: GameLog = {
    id: `log-unmort-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    round: state.round,
    type: 'system',
    text: `✅ ${player.name} unmortgaged ${space.name} for ${formatCurrency(unmortgageCost)}. Rent collections restored.`,
  };

  audio.playUpgrade();

  return {
    newState: {
      ...state,
      players: updatedPlayers,
      spaces: updatedSpaces,
      logs: [logEntry, ...state.logs.slice(0, 99)],
    },
    success: true,
    message: `Unmortgaged ${space.name}. Full rent collections active!`,
  };
}

/**
 * Liquidates / sells property back to the central bank for 70% of market value
 */
export function executeSellPropertyToBank(
  state: GameState,
  playerId: string,
  spaceIndex: number
): { newState: GameState; success: boolean; message: string } {
  const player = state.players.find(p => p.id === playerId);
  const space = state.spaces[spaceIndex];

  if (!player || !space || space.owner !== playerId) {
    return { newState: state, success: false, message: 'You do not own this property.' };
  }

  const sellValue = getBankSellValue(space, state);

  const updatedPlayers = state.players.map(p => {
    if (p.id === playerId) {
      return {
        ...p,
        money: p.money + sellValue,
        properties: p.properties.filter(id => id !== spaceIndex),
      };
    }
    return p;
  });

  const updatedSpaces = state.spaces.map(s => {
    if (s.index === spaceIndex) {
      return { ...s, owner: null, level: 0, mortgaged: false };
    }
    return s;
  });

  const logEntry: GameLog = {
    id: `log-sell-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    round: state.round,
    type: 'system',
    text: `💸 ${player.name} liquidated ${space.name} to the central bank for ${formatCurrency(sellValue)}.`,
  };

  audio.playCashRegister();

  return {
    newState: {
      ...state,
      players: updatedPlayers,
      spaces: updatedSpaces,
      logs: [logEntry, ...state.logs.slice(0, 99)],
    },
    success: true,
    message: `Sold ${space.name} for ${formatCurrency(sellValue)}.`,
  };
}

/**
 * Finalizes Global Auction victory
 */
export function executeAuctionWin(
  state: GameState,
  spaceIndex: number,
  winnerId: string,
  winningBid: number,
  sellerId: string | null
): GameState {
  const winner = state.players.find(p => p.id === winnerId);
  const space = state.spaces[spaceIndex];

  if (!winner || !space) return state;

  const updatedPlayers = state.players.map(p => {
    if (p.id === winnerId) {
      return {
        ...p,
        money: Math.max(0, p.money - winningBid),
        properties: [...p.properties, spaceIndex],
        stats: {
          ...p.stats,
          auctionsWon: p.stats.auctionsWon + 1,
          propertiesBought: p.stats.propertiesBought + 1,
        }
      };
    }
    if (sellerId && p.id === sellerId) {
      return {
        ...p,
        money: p.money + winningBid,
        properties: p.properties.filter(id => id !== spaceIndex),
      };
    }
    return p;
  });

  const updatedSpaces = state.spaces.map(s => {
    if (s.index === spaceIndex) {
      return { ...s, owner: winnerId, mortgaged: false };
    }
    return s;
  });

  const logEntry: GameLog = {
    id: `log-auction-win-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    round: state.round,
    type: 'auction',
    text: `🏛️ AUCTION HAMMER: ${winner.name} won ${space.name} with winning bid of ${formatCurrency(winningBid)}!`,
  };

  audio.playVictoryFanfare();

  return {
    ...state,
    players: updatedPlayers,
    spaces: updatedSpaces,
    auction: null,
    status: 'TURN_END',
    logs: [logEntry, ...state.logs.slice(0, 99)],
  };
}

/**
 * Executes bilateral trade atomically
 */
export function executeAtomicTrade(
  state: GameState,
  trade: TradeOffer
): { newState: GameState; success: boolean; message: string } {
  const fromPlayer = state.players.find(p => p.id === trade.fromPlayerId);
  const toPlayer = state.players.find(p => p.id === trade.toPlayerId);

  if (!fromPlayer || !toPlayer) {
    return { newState: state, success: false, message: 'Invalid trading parties.' };
  }

  if (fromPlayer.money < trade.offeredCash || toPlayer.money < trade.requestedCash) {
    return { newState: state, success: false, message: 'Insufficient cash balances for trade.' };
  }

  const fromOwnsAll = trade.offeredPropertyIndices.every(idx => state.spaces[idx]?.owner === fromPlayer.id);
  const toOwnsAll = trade.requestedPropertyIndices.every(idx => state.spaces[idx]?.owner === toPlayer.id);

  if (!fromOwnsAll || !toOwnsAll) {
    return { newState: state, success: false, message: 'Properties are no longer owned by negotiating parties.' };
  }

  const updatedPlayers = state.players.map(p => {
    if (p.id === fromPlayer.id) {
      const remainingProps = p.properties.filter(idx => !trade.offeredPropertyIndices.includes(idx));
      const newProps = [...remainingProps, ...trade.requestedPropertyIndices];
      return {
        ...p,
        money: p.money - trade.offeredCash + trade.requestedCash,
        properties: newProps,
      };
    }
    if (p.id === toPlayer.id) {
      const remainingProps = p.properties.filter(idx => !trade.requestedPropertyIndices.includes(idx));
      const newProps = [...remainingProps, ...trade.offeredPropertyIndices];
      return {
        ...p,
        money: p.money - trade.requestedCash + trade.offeredCash,
        properties: newProps,
      };
    }
    return p;
  });

  const updatedSpaces = state.spaces.map(s => {
    if (trade.offeredPropertyIndices.includes(s.index)) {
      return { ...s, owner: toPlayer.id };
    }
    if (trade.requestedPropertyIndices.includes(s.index)) {
      return { ...s, owner: fromPlayer.id };
    }
    return s;
  });

  const logEntry: GameLog = {
    id: `log-trade-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    round: state.round,
    type: 'trade',
    text: `🤝 Strategic trade ratified between ${fromPlayer.name} and ${toPlayer.name}.`,
  };

  audio.playCashRegister();

  return {
    newState: {
      ...state,
      players: updatedPlayers,
      spaces: updatedSpaces,
      activeTrade: null,
      logs: [logEntry, ...state.logs.slice(0, 99)],
    },
    success: true,
    message: 'Trade completed successfully!',
  };
}

/**
 * Deducts corporate/income tax on tax space
 */
export function executeTaxPayment(
  state: GameState,
  playerId: string
): { newState: GameState; taxAmount: number } {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.bankrupt) {
    return { newState: state, taxAmount: 0 };
  }

  const calculatedTax = Math.max(150, Math.round(player.money * 0.1));
  const taxPaid = Math.min(player.money, calculatedTax);

  const updatedPlayers = state.players.map(p => {
    if (p.id === playerId) {
      return {
        ...p,
        money: Math.max(0, p.money - taxPaid),
      };
    }
    return p;
  });

  const logEntry: GameLog = {
    id: `log-tax-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    round: state.round,
    type: 'tax',
    text: `${player.name} paid ${formatCurrency(taxPaid)} in Corporate & Revenue Taxes.`,
  };

  audio.playRentPayment();

  return {
    newState: {
      ...state,
      players: updatedPlayers,
      logs: [logEntry, ...state.logs.slice(0, 99)],
      status: 'TURN_END',
      pendingSpace: null,
    },
    taxAmount: taxPaid,
  };
}

/**
 * Awards START salary when crossing or landing on space 0
 */
export function executeStartSalaryBonus(
  state: GameState,
  playerId: string
): GameState {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.bankrupt) return state;

  const salary = state.config.startSalary || 200;
  const updatedPlayers = state.players.map(p => {
    if (p.id === playerId) {
      return {
        ...p,
        money: p.money + salary,
        stats: {
          ...p.stats,
          peakNetWorth: Math.max(p.stats.peakNetWorth, p.money + salary),
        }
      };
    }
    return p;
  });

  const logEntry: GameLog = {
    id: `log-start-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    round: state.round,
    type: 'system',
    text: `🌐 ${player.name} crossed START and collected ${formatCurrency(salary)} expedition salary.`,
  };

  audio.playCashRegister();

  return {
    ...state,
    players: updatedPlayers,
    logs: [logEntry, ...state.logs.slice(0, 99)],
  };
}
