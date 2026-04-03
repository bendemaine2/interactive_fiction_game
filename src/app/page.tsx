'use client';

import { useState, useCallback } from 'react';
import { GameProvider } from '@/context/GameContext';
import { useGame } from '@/hooks/useGame';
import { generateResponse } from '@/lib/api';
import OnboardingScreen from '@/components/OnboardingScreen';
import StoryScreen from '@/components/StoryScreen';
import LoadingState from '@/components/LoadingState';
import type { SeedAnswers } from '@/lib/types';

function GameRouter() {
  const { state, setPhase, setWorldState, appendProse, setLoading, setError } = useGame();
  const [genesisError, setGenesisError] = useState<string | null>(null);

  const handleGenesis = useCallback(async (seedText: string, seed: SeedAnswers, wackiness: number) => {
    setPhase('GENERATING');
    setLoading(true);
    setError(null);
    setGenesisError(null);

    try {
      const response = await generateResponse({
        action: 'genesis',
        world_state: null,
        player_input: seedText,
        player_type: state.playerType || 'escapist',
        wackiness,
        focused_character_id: null,
        seed,
      });

      const playerType = state.playerType || 'escapist';
      setWorldState({
        ...response.updated_world_state,
        player_type: response.updated_world_state.player_type || playerType,
        wackiness: response.updated_world_state.wackiness ?? wackiness,
      });
      appendProse({
        id: 'genesis',
        text: response.prose,
        type: 'narration',
      });
      setPhase('PLAYING');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      setGenesisError(message);
      setPhase('ONBOARDING_SUMMARY');
    } finally {
      setLoading(false);
    }
  }, [state.playerType, setPhase, setWorldState, appendProse, setLoading, setError]);

  switch (state.phase) {
    case 'ONBOARDING_INTRO':
    case 'ONBOARDING_SEED':
    case 'ONBOARDING_SUMMARY':
      return <OnboardingScreen onGenesis={handleGenesis} genesisError={genesisError} />;
    case 'GENERATING':
      return <LoadingState message="Building your world…" />;
    case 'PLAYING':
    case 'WORLD_BUILDING':
      return <StoryScreen />;
    default:
      return <OnboardingScreen onGenesis={handleGenesis} genesisError={genesisError} />;
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
