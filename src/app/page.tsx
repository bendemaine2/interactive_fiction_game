'use client';

import { GameProvider } from '@/context/GameContext';
import { useGame } from '@/hooks/useGame';
import OnboardingScreen from '@/components/OnboardingScreen';
import StoryScreen from '@/components/StoryScreen';
import LoadingState from '@/components/LoadingState';

function GameRouter() {
  const { state } = useGame();

  switch (state.phase) {
    case 'ONBOARDING_ROUTE':
    case 'ONBOARDING_SEED':
      return <OnboardingScreen />;
    case 'GENERATING':
      return <LoadingState message="Building your world…" />;
    case 'PLAYING':
    case 'WORLD_BUILDING':
      return <StoryScreen />;
    default:
      return <OnboardingScreen />;
  }
}

export default function Home() {
  return (
    <GameProvider>
      <main className="flex flex-1 flex-col h-screen bg-background">
        <GameRouter />
      </main>
    </GameProvider>
  );
}
