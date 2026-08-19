import React from 'react';
import { GameState } from '../../types';
import { SpaceCell } from './SpaceCell';
import { CenterArena } from './CenterArena';
import { PlayerTokens } from './PlayerTokens';

interface BoardProps {
  gameState: GameState;
  onSpaceClick: (index: number) => void;
  onRollDice?: () => void;
  canRoll: boolean;
  isRolling: boolean;
  isMyTurn?: boolean;
}

export const Board: React.FC<BoardProps> = ({
  gameState,
  onSpaceClick,
  onRollDice,
  canRoll,
  isRolling,
  isMyTurn = true,
}) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-1 sm:p-2 relative select-none max-w-full">
      {/* 9x9 Outer Perimeter Shell */}
      <div className="relative w-full max-w-[840px] aspect-square p-1.5 sm:p-2 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl flex items-center justify-center">
        {/* 9x9 CSS Grid Board */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(9, minmax(0, 1fr))',
            gridTemplateRows: 'repeat(9, minmax(0, 1fr))',
          }}
          className="relative w-full h-full gap-1 sm:gap-1.5 p-1 sm:p-1.5 bg-[#070c18] rounded-2xl border border-slate-800/90 shadow-inner overflow-hidden"
        >
          {/* Subtle Cyber Grid Lines Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b20_1px,transparent_1px),linear-gradient(to_bottom,#1e293b20_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />

          {/* 32 Perimeter Spaces */}
          {gameState.spaces.map((space) => {
            const ownerPlayer = space.owner
              ? gameState.players.find(p => p.id === space.owner)
              : undefined;

            return (
              <SpaceCell
                key={space.index}
                space={space}
                gridRow={space.gridRow}
                gridCol={space.gridCol}
                isCorner={space.isCorner}
                side={space.side}
                ownerPlayer={ownerPlayer}
                gameState={gameState}
                onClick={onSpaceClick}
              />
            );
          })}

          {/* Center Arena (7x7 Deck) */}
          <CenterArena
            gameState={gameState}
            onRollDice={onRollDice}
            canRoll={canRoll}
            isRolling={isRolling}
            isMyTurn={isMyTurn}
          />

          {/* Animated Player Pawns */}
          <PlayerTokens gameState={gameState} />
        </div>
      </div>
    </div>
  );
};
