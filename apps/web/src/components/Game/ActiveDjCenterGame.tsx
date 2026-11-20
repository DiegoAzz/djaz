import React, { memo } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { LiveDjGame } from './LiveDjGame';
import { BeatDropGame } from './BeatDropGame';
import { VinylSpinnerGame } from './VinylSpinnerGame';
import { NeonPongGame } from './NeonPongGame';
import { FlappyDjGame } from './FlappyDjGame';

export const ActiveDjCenterGame: React.FC = memo(() => {
  const activeGameId = useGameStore((s) => s.activeGameId);

  switch (activeGameId) {
    case 'beat-drop':
      return <BeatDropGame />;
    case 'turntable-spinner':
      return <VinylSpinnerGame />;
    case 'neon-pong':
      return <NeonPongGame />;
    case 'flappy-dj':
      return <FlappyDjGame />;
    case 'runner':
    default:
      return <LiveDjGame />;
  }
});
