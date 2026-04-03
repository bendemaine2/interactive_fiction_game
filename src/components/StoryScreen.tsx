'use client';

import { useState } from 'react';
import { useGame } from '@/hooks/useGame';
import NarrativeProse from './NarrativeProse';
import CharacterChips from './CharacterChips';
import ActionCards from './ActionCards';
import StoryInput from './StoryInput';
import ModeSwitch from './ModeSwitch';
import WackinessSlider from './WackinessSlider';
import WorldBuildingPanel from './WorldBuildingPanel';
import DialogueOverlay from './DialogueOverlay';

export default function StoryScreen() {
  const { state } = useGame();
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const inDialogue = !!state.focusedCharacterId;

  return (
    <>
      <div className="flex flex-col h-screen relative">
        {/* ── TOP BAR ── */}
        <div
          className="flex-shrink-0 z-30 bg-background/95 backdrop-blur-sm border-b border-white/5 transition-opacity duration-500"
          style={{ opacity: inDialogue ? 0.2 : 1 }}
        >
          <div className="flex items-center justify-between px-4 py-2 max-w-3xl mx-auto">
            <ModeSwitch />
            <CharacterChips />
            {/* Desktop: inline slider */}
            <div className="w-28 hidden sm:block flex-shrink-0">
              <WackinessSlider />
            </div>
            {/* Mobile: settings icon */}
            <button
              onClick={() => setShowMobileSettings(!showMobileSettings)}
              className="sm:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-prose/40 hover:text-accent transition-all"
              title="Settings"
            >
              ≋
            </button>
          </div>
          {/* Mobile settings dropdown */}
          {showMobileSettings && (
            <div className="sm:hidden px-4 pb-3 border-t border-white/5 animate-fade-in">
              <div className="max-w-xs">
                <WackinessSlider />
              </div>
            </div>
          )}
        </div>

        {/* ── SCROLLABLE NARRATIVE ── */}
        <div
          className="flex-1 min-h-0 overflow-y-auto transition-all duration-600"
          style={{
            opacity: inDialogue ? 0.18 : 1,
            filter: inDialogue ? 'blur(0.5px)' : 'none',
          }}
        >
          <NarrativeProse entries={state.proseHistory} />
        </div>

        {/* ── BOTTOM BAR ── */}
        <div
          className="flex-shrink-0 z-20 bg-background/95 backdrop-blur-sm border-t border-white/5 transition-opacity duration-500 max-h-[45vh] overflow-y-auto"
          style={{ opacity: inDialogue ? 0.1 : 1 }}
        >
          {/* Loading indicator */}
          {state.loading && !inDialogue && (
            <div className="px-4 py-2 text-center">
              <span className="text-accent/50 text-sm font-serif animate-pulse">
                The dream shifts…
              </span>
            </div>
          )}

          {/* Error */}
          {state.error && !inDialogue && (
            <div className="px-4 py-2 text-center">
              <span className="text-red-400/60 text-sm font-serif">{state.error}</span>
            </div>
          )}

          {/* Action cards */}
          <ActionCards />

          {/* Input */}
          <StoryInput />
        </div>

        {/* ── DIALOGUE OVERLAY ── */}
        {inDialogue && <DialogueOverlay />}
      </div>

      {/* ── WORLD-BUILDING OVERLAY ── */}
      {state.phase === 'WORLD_BUILDING' && <WorldBuildingPanel />}
    </>
  );
}
