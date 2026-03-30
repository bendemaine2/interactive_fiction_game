'use client';

import { useGame } from '@/hooks/useGame';
import NarrativeProse from './NarrativeProse';
import CharacterChips from './CharacterChips';
import ActionCards from './ActionCards';
import StoryInput from './StoryInput';
import ModeSwitch from './ModeSwitch';
import WackinessSlider from './WackinessSlider';
import WorldBuildingPanel from './WorldBuildingPanel';

export default function StoryScreen() {
  const { state } = useGame();

  return (
    <>
      <div className="flex flex-1 flex-col h-full">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
          <ModeSwitch />
          <div className="w-32 hidden sm:block">
            <WackinessSlider />
          </div>
        </div>

        {/* Character chips */}
        <CharacterChips />

        {/* Prose */}
        <NarrativeProse entries={state.proseHistory} />

        {/* Loading indicator */}
        {state.loading && (
          <div className="px-4 py-2 text-center">
            <span className="text-accent/50 text-sm font-serif animate-pulse">
              The dream shifts…
            </span>
          </div>
        )}

        {/* Error */}
        {state.error && (
          <div className="px-4 py-2 text-center">
            <span className="text-red-400/60 text-sm font-serif">{state.error}</span>
          </div>
        )}

        {/* Action cards */}
        <ActionCards />

        {/* Input */}
        <StoryInput />
      </div>

      {/* World-Building overlay */}
      {state.phase === 'WORLD_BUILDING' && <WorldBuildingPanel />}
    </>
  );
}
