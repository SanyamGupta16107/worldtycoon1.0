import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage, GameConfig, GameState, PlayerColor, TradeOffer } from './types';
import {
  addChatMessageAction,
  addMultiplayerPeer,
  buyPropertyAction,
  createInitialGameState,
  developPropertyAction,
  endTurnAction,
  finalizeAuctionAction,
  handleSpaceLanding,
  investStockMarketAction,
  passPropertyAction,
  placeAuctionBidAction,
  proposeTradeAction,
  removeMultiplayerPeer,
  rollDiceAction,
  startAuctionAction,
} from './game/gameState';
import {
  executeMortgageProperty,
  executeSellPropertyToBank,
  executeStartSalaryBonus,
  executeUnmortgageProperty,
} from './game/economy';
import { decideAIBid } from './game/botLogic';
import { calculateClockwisePath } from './game/movement';
import { audio } from './game/audioEngine';
import { network } from './services/peerService';
import { TopNavbar } from './components/Header/TopNavbar';
import { LobbyScreen } from './components/Lobby/LobbyScreen';
import { OnlineRoomLobby } from './components/Lobby/OnlineRoomLobby';
import { RulesModal } from './components/Lobby/RulesModal';
import { Board } from './components/Board/Board';
import { MarketDesk } from './components/MarketDesk/MarketDesk';
import { PlayerCommand } from './components/PlayerPanel/PlayerCommand';
import { PropertyPurchaseModal } from './components/Modals/PropertyPurchaseModal';
import { PropertyDetailModal } from './components/Modals/PropertyDetailModal';
import { AuctionModal } from './components/Modals/AuctionModal';
import { StockMarketModal } from './components/Modals/StockMarketModal';
import { TradeModal } from './components/Modals/TradeModal';
import { EventNotificationModal } from './components/Modals/EventNotificationModal';
import { GameOverModal } from './components/Modals/GameOverModal';
import { ChatDrawer } from './components/Multiplayer/ChatDrawer';

export const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState());
  const [inLobby, setInLobby] = useState<boolean>(true);
  const [inOnlineStaging, setInOnlineStaging] = useState<boolean>(false);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isTradeOpen, setIsTradeOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState<boolean>(false);
  const [inspectedSpaceIndex, setInspectedSpaceIndex] = useState<number | null>(null);
  const [isRollingAnimation, setIsRollingAnimation] = useState<boolean>(false);

  const gameStateRef = useRef<GameState>(gameState);
  gameStateRef.current = gameState;

  // Broadcast state to all connected peers whenever host updates state
  const broadcastUpdatedState = useCallback((newState: GameState) => {
    if (network.isHost && gameStateRef.current.config.mode === 'online_multiplayer') {
      network.broadcastState(newState);
    }
  }, []);

  const updateAndBroadcast = useCallback((updater: (prev: GameState) => GameState) => {
    setGameState((prev) => {
      const next = updater(prev);
      if (network.isHost && next.config.mode === 'online_multiplayer') {
        network.broadcastState(next);
      }
      return next;
    });
  }, []);

  // ----------------------------------------------------
  // LOBBY LAUNCH HANDLERS
  // ----------------------------------------------------
  const handleStartSoloGame = (config: GameConfig) => {
    audio.setSoundMuted(!config.soundEnabled);
    audio.setMusicMuted(!config.musicEnabled);
    if (config.musicEnabled) audio.startAmbientTrack();
    const initial = createInitialGameState(config);
    setGameState(initial);
    setInLobby(false);
    setInOnlineStaging(false);
  };

  const handleStartPassAndPlay = (config: GameConfig, playerNames: string[]) => {
    audio.setSoundMuted(!config.soundEnabled);
    audio.setMusicMuted(!config.musicEnabled);
    if (config.musicEnabled) audio.startAmbientTrack();
    const initial = createInitialGameState(config);
    const customizedPlayers = initial.players.map((p, idx) => ({
      ...p,
      name: playerNames[idx] || p.name,
    }));
    const nextState = { ...initial, players: customizedPlayers };
    setGameState(nextState);
    setInLobby(false);
    setInOnlineStaging(false);
  };

  const handleHostOnlineGame = (
    config: GameConfig,
    hostName: string,
    hostColor: PlayerColor,
    hostAvatar: string
  ) => {
    const roomCode = config.roomCode || 'WT-7X9K';
    const initial = createInitialGameState({ ...config, myPeerId: 'host-player' });
    initial.players[0].name = hostName;
    initial.players[0].color = hostColor;
    initial.players[0].avatar = hostAvatar;

    setGameState(initial);

    network.initHost(
      roomCode,
      (peerId) => {
        setGameState((prev) => ({
          ...prev,
          config: { ...prev.config, myPeerId: peerId },
        }));
      },
      (peerId, name, color, avatar) => {
        audio.playClick();
        updateAndBroadcast((prev) => addMultiplayerPeer(prev, peerId, name, color, avatar));
      },
      (fromPeer, action, payload) => {
        handleRemoteActionFromPeer(action, payload);
      },
      (chat) => {
        audio.playClick();
        updateAndBroadcast((prev) => addChatMessageAction(prev, chat));
      },
      (peerId) => {
        updateAndBroadcast((prev) => removeMultiplayerPeer(prev, peerId));
      },
      (err) => {
        console.warn('Network Host Notice:', err);
      }
    );

    setInLobby(false);
    setInOnlineStaging(true);
  };

  const handleJoinOnlineGame = (
    roomCode: string,
    playerName: string,
    playerColor: PlayerColor,
    playerAvatar: string
  ) => {
    network.joinRoom(
      roomCode,
      playerName,
      playerColor,
      playerAvatar,
      (receivedState, myId) => {
        setGameState({
          ...receivedState,
          config: {
            ...receivedState.config,
            myPeerId: myId,
          },
        });
        setInLobby(false);
        if (receivedState.status !== 'LOBBY') {
          setInOnlineStaging(false);
        }
      },
      (chat) => {
        audio.playClick();
        setGameState((prev) => addChatMessageAction(prev, chat));
      },
      (err) => {
        alert(err || 'Failed to connect to room.');
      }
    );
  };

  const handleStartOnlineStaging = () => {
    updateAndBroadcast((prev) => ({
      ...prev,
      status: 'ROLL_REQUIRED',
    }));
    setInOnlineStaging(false);
  };

  // ----------------------------------------------------
  // REMOTE ACTIONS (HOST SIDE)
  // ----------------------------------------------------
  const handleRemoteActionFromPeer = (action: string, payload: Record<string, unknown> = {}) => {
    if (action === 'ROLL_DICE') {
      handleRollDice();
    } else if (action === 'BUY_PROPERTY') {
      const spaceIdx = payload.spaceIndex as number;
      const acting = gameStateRef.current.players[gameStateRef.current.turnIndex];
      if (acting) updateAndBroadcast((prev) => buyPropertyAction(prev, acting.id, spaceIdx));
    } else if (action === 'PASS_PROPERTY') {
      updateAndBroadcast((prev) => passPropertyAction(prev));
    } else if (action === 'DEVELOP_PROPERTY') {
      const spaceIdx = payload.spaceIndex as number;
      const acting = gameStateRef.current.players[gameStateRef.current.turnIndex];
      if (acting) updateAndBroadcast((prev) => developPropertyAction(prev, acting.id, spaceIdx));
    } else if (action === 'MORTGAGE_PROPERTY') {
      const spaceIdx = payload.spaceIndex as number;
      const acting = gameStateRef.current.players[gameStateRef.current.turnIndex];
      if (acting) {
        updateAndBroadcast((prev) => {
          const { newState } = executeMortgageProperty(prev, acting.id, spaceIdx);
          return newState;
        });
      }
    } else if (action === 'UNMORTGAGE_PROPERTY') {
      const spaceIdx = payload.spaceIndex as number;
      const acting = gameStateRef.current.players[gameStateRef.current.turnIndex];
      if (acting) {
        updateAndBroadcast((prev) => {
          const { newState } = executeUnmortgageProperty(prev, acting.id, spaceIdx);
          return newState;
        });
      }
    } else if (action === 'SELL_PROPERTY') {
      const spaceIdx = payload.spaceIndex as number;
      const acting = gameStateRef.current.players[gameStateRef.current.turnIndex];
      if (acting) {
        updateAndBroadcast((prev) => {
          const { newState } = executeSellPropertyToBank(prev, acting.id, spaceIdx);
          return newState;
        });
      }
    } else if (action === 'START_AUCTION') {
      const spaceIdx = payload.spaceIndex as number;
      const sellerId = payload.sellerId as string;
      updateAndBroadcast((prev) => startAuctionAction(prev, spaceIdx, sellerId));
    } else if (action === 'PLACE_BID') {
      const bidderId = payload.bidderId as string;
      const amount = payload.amount as number;
      updateAndBroadcast((prev) => placeAuctionBidAction(prev, bidderId, amount));
    } else if (action === 'INVEST_STOCK') {
      const playerId = payload.playerId as string;
      const amount = payload.amount as number;
      updateAndBroadcast((prev) => investStockMarketAction(prev, playerId, amount));
    } else if (action === 'PROPOSE_TRADE') {
      const trade = payload.trade as TradeOffer;
      updateAndBroadcast((prev) => {
        const { nextState } = proposeTradeAction(prev, trade);
        return nextState;
      });
    } else if (action === 'END_TURN') {
      updateAndBroadcast((prev) => endTurnAction(prev));
    }
  };

  // ----------------------------------------------------
  // STEP MOVEMENT
  // ----------------------------------------------------
  const executePawnMovement = useCallback((rollTotal: number, startPos: number, playerIdx: number) => {
    const { path } = calculateClockwisePath(startPos, rollTotal);
    const speed = gameStateRef.current.config.gameSpeed === 'fast' ? 120 : 200;
    let stepIndex = 0;

    const interval = setInterval(() => {
      if (stepIndex < path.length) {
        const nextTile = path[stepIndex];
        audio.playMoveStep();

        updateAndBroadcast((prev) => {
          let updatedState = { ...prev };
          const updatedPlayers = prev.players.map((p, idx) => {
            if (idx === playerIdx) {
              return { ...p, position: nextTile };
            }
            return p;
          });

          if (nextTile === 0) {
            const player = prev.players[playerIdx];
            if (player) {
              updatedState = executeStartSalaryBonus(updatedState, player.id);
            }
          }

          return {
            ...updatedState,
            players: updatedPlayers,
          };
        });

        stepIndex++;
      } else {
        clearInterval(interval);
        updateAndBroadcast((prev) => handleSpaceLanding(prev, playerIdx));
      }
    }, speed);
  }, [updateAndBroadcast]);

  // Main Dice Roll
  const handleRollDice = useCallback(() => {
    const state = gameStateRef.current;
    const currentActing = state.players[state.turnIndex];

    if (!currentActing || currentActing.bankrupt || state.status === 'GAME_OVER' || isRollingAnimation) {
      return;
    }

    if (state.config.mode === 'online_multiplayer' && !network.isHost) {
      network.sendAction('ROLL_DICE');
      return;
    }

    setIsRollingAnimation(true);
    const startPos = currentActing.position;
    const rollDelay = state.config.gameSpeed === 'fast' ? 350 : 600;

    setTimeout(() => {
      const { nextState, rollTotal } = rollDiceAction(gameStateRef.current);
      setGameState(nextState);
      broadcastUpdatedState(nextState);
      setIsRollingAnimation(false);

      executePawnMovement(rollTotal, startPos, state.turnIndex);
    }, rollDelay);
  }, [isRollingAnimation, executePawnMovement, broadcastUpdatedState]);

  // ----------------------------------------------------
  // AUCTION COUNTDOWN & AI BIDDING TIMER LOOP
  // ----------------------------------------------------
  useEffect(() => {
    if (gameState.status !== 'AUCTION_ACTIVE' || !gameState.auction) return;

    const timer = setInterval(() => {
      setGameState((prev) => {
        if (!prev.auction || prev.status !== 'AUCTION_ACTIVE') return prev;

        // Check if AI bidders want to bid
        const aiPlayers = prev.players.filter((p) => p.isAI && !p.bankrupt);
        for (const ai of aiPlayers) {
          const aiBid = decideAIBid(ai, prev.auction, prev);
          if (aiBid !== null) {
            return placeAuctionBidAction(prev, ai.id, aiBid);
          }
        }

        // Decrement timer
        if (prev.auction.timeLeft > 1) {
          return {
            ...prev,
            auction: {
              ...prev.auction,
              timeLeft: prev.auction.timeLeft - 1,
            },
          };
        } else {
          // Timer reached 0 -> Finalize Auction
          return finalizeAuctionAction(prev);
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.status, gameState.auction?.currentBid]);

  // AI Turn Automation Loop
  useEffect(() => {
    if (inLobby || inOnlineStaging || gameState.status === 'GAME_OVER' || gameState.status === 'AUCTION_ACTIVE') return;

    const isHostOrSolo = gameState.config.mode !== 'online_multiplayer' || network.isHost;
    if (!isHostOrSolo) return;

    const currentPlayer = gameState.players[gameState.turnIndex];
    if (!currentPlayer || !currentPlayer.isAI || currentPlayer.bankrupt) return;

    const isFast = gameState.config.gameSpeed === 'fast';

    if (gameState.status === 'ROLL_REQUIRED' && !gameState.isMovingPawn && !isRollingAnimation) {
      const timer = setTimeout(() => {
        handleRollDice();
      }, isFast ? 500 : 900);
      return () => clearTimeout(timer);
    }

    if (gameState.status === 'TURN_END' && !gameState.isMovingPawn) {
      const timer = setTimeout(() => {
        updateAndBroadcast((prev) => endTurnAction(prev));
      }, isFast ? 450 : 800);
      return () => clearTimeout(timer);
    }

    if (gameState.status === 'EVENT_NOTIFICATION') {
      const timer = setTimeout(() => {
        updateAndBroadcast((prev) => ({
          ...prev,
          activeEvent: null,
          status: 'TURN_END',
        }));
      }, isFast ? 1000 : 1800);
      return () => clearTimeout(timer);
    }
  }, [
    inLobby,
    inOnlineStaging,
    gameState.status,
    gameState.turnIndex,
    gameState.isMovingPawn,
    gameState.config.gameSpeed,
    gameState.config.mode,
    isRollingAnimation,
    handleRollDice,
    updateAndBroadcast,
  ]);

  // ----------------------------------------------------
  // MODAL ACTIONS
  // ----------------------------------------------------
  const handleBuyProperty = (spaceIndex: number) => {
    if (gameState.config.mode === 'online_multiplayer' && !network.isHost) {
      network.sendAction('BUY_PROPERTY', { spaceIndex });
      return;
    }
    const currentActing = gameState.players[gameState.turnIndex];
    if (!currentActing) return;
    updateAndBroadcast((prev) => buyPropertyAction(prev, currentActing.id, spaceIndex));
  };

  const handlePassProperty = () => {
    if (gameState.config.mode === 'online_multiplayer' && !network.isHost) {
      network.sendAction('PASS_PROPERTY');
      return;
    }
    updateAndBroadcast((prev) => passPropertyAction(prev));
  };

  const handleUpgradeProperty = (spaceIndex: number) => {
    if (gameState.config.mode === 'online_multiplayer' && !network.isHost) {
      network.sendAction('DEVELOP_PROPERTY', { spaceIndex });
      return;
    }
    const currentActing = gameState.players[gameState.turnIndex];
    if (!currentActing) return;
    updateAndBroadcast((prev) => developPropertyAction(prev, currentActing.id, spaceIndex));
  };

  const handleMortgageProperty = (spaceIndex: number) => {
    if (gameState.config.mode === 'online_multiplayer' && !network.isHost) {
      network.sendAction('MORTGAGE_PROPERTY', { spaceIndex });
      return;
    }
    const currentActing = gameState.players[gameState.turnIndex];
    if (!currentActing) return;
    updateAndBroadcast((prev) => {
      const { newState } = executeMortgageProperty(prev, currentActing.id, spaceIndex);
      return newState;
    });
  };

  const handleUnmortgageProperty = (spaceIndex: number) => {
    if (gameState.config.mode === 'online_multiplayer' && !network.isHost) {
      network.sendAction('UNMORTGAGE_PROPERTY', { spaceIndex });
      return;
    }
    const currentActing = gameState.players[gameState.turnIndex];
    if (!currentActing) return;
    updateAndBroadcast((prev) => {
      const { newState } = executeUnmortgageProperty(prev, currentActing.id, spaceIndex);
      return newState;
    });
  };

  const handleSellToBank = (spaceIndex: number) => {
    if (gameState.config.mode === 'online_multiplayer' && !network.isHost) {
      network.sendAction('SELL_PROPERTY', { spaceIndex });
      return;
    }
    const currentActing = gameState.players[gameState.turnIndex];
    if (!currentActing) return;
    updateAndBroadcast((prev) => {
      const { newState } = executeSellPropertyToBank(prev, currentActing.id, spaceIndex);
      return newState;
    });
  };

  const handleStartAuction = (spaceIndex: number) => {
    const currentActing = gameState.players[gameState.turnIndex];
    if (gameState.config.mode === 'online_multiplayer' && !network.isHost) {
      network.sendAction('START_AUCTION', { spaceIndex, sellerId: currentActing?.id || null });
      return;
    }
    updateAndBroadcast((prev) => startAuctionAction(prev, spaceIndex, currentActing?.id || null));
  };

  const handlePlaceAuctionBid = (bidderId: string, amount: number) => {
    if (gameState.config.mode === 'online_multiplayer' && !network.isHost) {
      network.sendAction('PLACE_BID', { bidderId, amount });
      return;
    }
    updateAndBroadcast((prev) => placeAuctionBidAction(prev, bidderId, amount));
  };

  const handlePassAuction = (bidderId: string) => {
    // If player passes, no-op or mark inactive
  };

  const handleInvestStockMarket = (playerId: string, amount: number) => {
    if (gameState.config.mode === 'online_multiplayer' && !network.isHost) {
      network.sendAction('INVEST_STOCK', { playerId, amount });
      return;
    }
    updateAndBroadcast((prev) => investStockMarketAction(prev, playerId, amount));
  };

  const handleProposeTrade = (trade: TradeOffer) => {
    if (gameState.config.mode === 'online_multiplayer' && !network.isHost) {
      network.sendAction('PROPOSE_TRADE', { trade });
      return { accepted: true, message: 'Proposal transmitted across network.' };
    }
    const { nextState, accepted, message } = proposeTradeAction(gameState, trade);
    setGameState(nextState);
    broadcastUpdatedState(nextState);
    return { accepted, message };
  };

  const handleSendChat = (text: string) => {
    const sender = gameState.players[gameState.turnIndex] || gameState.players[0];
    const newChat: ChatMessage = {
      id: `chat-${Date.now()}`,
      senderId: sender?.id || 'player',
      senderName: sender?.name || 'COMMANDER',
      senderColor: sender?.color || '#06b6d4',
      senderAvatar: sender?.avatar || '🌐',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    network.sendChat(newChat);
    updateAndBroadcast((prev) => addChatMessageAction(prev, newChat));
  };

  const handleManualEndTurn = () => {
    if (gameState.config.mode === 'online_multiplayer' && !network.isHost) {
      network.sendAction('END_TURN');
      return;
    }
    updateAndBroadcast((prev) => endTurnAction(prev));
  };

  const handleToggleSound = () => {
    const next = !gameState.config.soundEnabled;
    audio.setSoundMuted(!next);
    setGameState((prev) => ({
      ...prev,
      config: { ...prev.config, soundEnabled: next },
    }));
  };

  const handleToggleMusic = () => {
    const next = !gameState.config.musicEnabled;
    audio.setMusicMuted(!next);
    if (next) audio.startAmbientTrack();
    else audio.stopAmbientTrack();
    setGameState((prev) => ({
      ...prev,
      config: { ...prev.config, musicEnabled: next },
    }));
  };

  const handleToggleSpeed = () => {
    const next = gameState.config.gameSpeed === 'normal' ? 'fast' : 'normal';
    setGameState((prev) => ({
      ...prev,
      config: { ...prev.config, gameSpeed: next },
    }));
  };

  const handleResetGame = () => {
    audio.stopAmbientTrack();
    network.destroy();
    setInLobby(true);
    setInOnlineStaging(false);
  };

  // ----------------------------------------------------
  // RENDER VIEWS
  // ----------------------------------------------------
  if (inLobby) {
    return (
      <>
        <LobbyScreen
          onStartSoloGame={handleStartSoloGame}
          onStartPassAndPlay={handleStartPassAndPlay}
          onHostOnlineGame={handleHostOnlineGame}
          onJoinOnlineGame={handleJoinOnlineGame}
          onOpenRules={() => setIsRulesOpen(true)}
        />
        <RulesModal
          isOpen={isRulesOpen}
          onClose={() => setIsRulesOpen(false)}
        />
      </>
    );
  }

  if (inOnlineStaging) {
    return (
      <OnlineRoomLobby
        gameState={gameState}
        isHost={network.isHost}
        roomCode={gameState.config.roomCode || 'WT-ROOM'}
        onStartGame={handleStartOnlineStaging}
        onLeaveRoom={handleResetGame}
        onSendChat={handleSendChat}
      />
    );
  }

  const currentPlayer = gameState.players[gameState.turnIndex];
  const isHumanTurn = currentPlayer && !currentPlayer.isAI;
  const canRoll = isHumanTurn && gameState.status === 'ROLL_REQUIRED' && !gameState.isMovingPawn;

  return (
    <div className="min-h-screen w-full bg-[#030612] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* Top Navbar */}
      <TopNavbar
        gameState={gameState}
        onToggleSound={handleToggleSound}
        onToggleMusic={handleToggleMusic}
        onToggleSpeed={handleToggleSpeed}
        onOpenRules={() => setIsRulesOpen(true)}
        onResetGame={handleResetGame}
        onToggleChat={() => setIsChatOpen((prev) => !prev)}
        onOpenStockMarket={() => setIsStockModalOpen(true)}
        unreadChatCount={gameState.chats.length}
      />

      {/* Main 3-Column Tactical Command Arena */}
      <main className="flex-1 w-full max-w-[1740px] mx-auto p-2 sm:p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-4 lg:gap-6 items-start justify-center">
        {/* Left Column: Global Intelligence / Market Desk */}
        <div className="w-full flex justify-center order-2 lg:order-1">
          <MarketDesk gameState={gameState} />
        </div>

        {/* Center Column: The 9x9 World Tycoon Board */}
        <div className="w-full flex flex-col items-center justify-center order-1 lg:order-2">
          <Board
            gameState={gameState}
            onSpaceClick={(spaceIdx) => {
              setInspectedSpaceIndex(spaceIdx);
            }}
            onRollDice={handleRollDice}
            canRoll={canRoll}
            isRolling={isRollingAnimation}
          />

          {isHumanTurn && gameState.status === 'TURN_END' && (
            <div className="mt-3 flex items-center gap-3 animate-in fade-in">
              <button
                onClick={handleManualEndTurn}
                className="py-2.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-mono font-black text-xs uppercase tracking-wider shadow-glow-cyan transition-all cursor-pointer"
              >
                PASS TURN TO NEXT EMPIRE →
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Your Empire / Player Command Panel */}
        <div className="w-full flex justify-center order-3">
          <PlayerCommand
            gameState={gameState}
            onDevelop={(idx) => setInspectedSpaceIndex(idx)}
            onOpenTrade={() => setIsTradeOpen(true)}
          />
        </div>
      </main>

      {/* 1. Property Purchase Modal (When landing on unowned space) */}
      {gameState.status === 'PROPERTY_DECISION' && gameState.pendingSpace && (
        <PropertyPurchaseModal
          space={gameState.pendingSpace}
          player={gameState.players[gameState.turnIndex]}
          gameState={gameState}
          onBuy={handleBuyProperty}
          onPass={handlePassProperty}
        />
      )}

      {/* 2. Interactive Property Hologram Detail Card (When clicking any space) */}
      <PropertyDetailModal
        spaceIndex={inspectedSpaceIndex}
        gameState={gameState}
        onClose={() => setInspectedSpaceIndex(null)}
        onUpgrade={handleUpgradeProperty}
        onMortgage={handleMortgageProperty}
        onUnmortgage={handleUnmortgageProperty}
        onSellToBank={handleSellToBank}
        onStartAuction={handleStartAuction}
      />

      {/* 3. Live Global Auction Modal */}
      {gameState.status === 'AUCTION_ACTIVE' && gameState.auction && (
        <AuctionModal
          gameState={gameState}
          onBid={handlePlaceAuctionBid}
          onPass={handlePassAuction}
          onFinalizeAuction={() => {
            updateAndBroadcast((prev) => finalizeAuctionAction(prev));
          }}
        />
      )}

      {/* 4. High-Risk Stock Market Modal */}
      {(gameState.status === 'STOCK_MARKET_WINDOW' || isStockModalOpen) && (
        <StockMarketModal
          gameState={gameState}
          onInvest={handleInvestStockMarket}
          onDismiss={() => {
            setIsStockModalOpen(false);
            if (gameState.status === 'STOCK_MARKET_WINDOW') {
              updateAndBroadcast((prev) => ({
                ...prev,
                status: 'ROLL_REQUIRED',
                stockMarket: {
                  ...prev.stockMarket,
                  lastOutcome: null,
                },
              }));
            }
          }}
        />
      )}

      {/* 5. Trade Negotiation Modal */}
      {isTradeOpen && (
        <TradeModal
          gameState={gameState}
          onClose={() => setIsTradeOpen(false)}
          onProposeTrade={handleProposeTrade}
        />
      )}

      {/* 6. Event Notification Modal */}
      {gameState.status === 'EVENT_NOTIFICATION' && gameState.activeEvent && (
        <EventNotificationModal
          event={gameState.activeEvent}
          onDismiss={() => {
            updateAndBroadcast((prev) => ({
              ...prev,
              activeEvent: null,
              status: 'TURN_END',
            }));
          }}
        />
      )}

      {/* 7. Game Over / Victory Modal */}
      {gameState.status === 'GAME_OVER' && (
        <GameOverModal
          gameState={gameState}
          onPlayAgain={() => {
            const fresh = createInitialGameState(gameState.config);
            setGameState(fresh);
            broadcastUpdatedState(fresh);
          }}
          onNewGame={() => setInLobby(true)}
        />
      )}

      {/* 8. Rules Handbook Modal */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      {/* 9. Live Comms Chat Drawer */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        chats={gameState.chats}
        onSendChat={handleSendChat}
      />
    </div>
  );
};
