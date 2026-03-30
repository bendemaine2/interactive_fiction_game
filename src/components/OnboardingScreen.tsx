'use client';

import { useState } from 'react';
import { useGame } from '@/hooks/useGame';
import type { PlayerType } from '@/lib/types';

interface OnboardingScreenProps {
  onGenesis: (seed: string) => void;
  genesisError: string | null;
}

export default function OnboardingScreen({ onGenesis, genesisError }: OnboardingScreenProps) {
  const { state, setPlayerType, setPhase } = useGame();
  const [seed, setSeed] = useState('');
  const [showSubPrompts, setShowSubPrompts] = useState(false);

  const subPrompts = [
    'What does it look like?',
    'Who is with you?',
    "What's your aim?",
    "What's happening?",
  ];

  function handleRouteChoice(type: PlayerType) {
    setPlayerType(type);
    setPhase('ONBOARDING_SEED');
  }

  function handleSeedSubmit() {
    if (!seed.trim()) {
      setShowSubPrompts(true);
      return;
    }
    onGenesis(seed);
  }

  if (state.phase === 'ONBOARDING_ROUTE') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <p className="text-accent mb-12 font-serif text-2xl leading-relaxed tracking-wide md:text-3xl text-center">
          Do you have a world in mind,
          <br />
          or shall we dream one together?
        </p>
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <button
            onClick={() => handleRouteChoice('writer')}
            className="glass-card px-6 py-4 text-lg font-serif text-prose hover:border-accent/50 transition-all duration-300"
          >
            I have a world in mind
          </button>
          <button
            onClick={() => handleRouteChoice('escapist')}
            className="glass-card px-6 py-4 text-lg font-serif text-prose hover:border-accent/50 transition-all duration-300"
          >
            Dream one together
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <p className="text-accent mb-8 font-serif text-2xl leading-relaxed tracking-wide md:text-3xl text-center">
        What can you see?
        <br />
        <span className="text-prose/50 text-lg">Describe your world.</span>
      </p>

      {showSubPrompts && (
        <div className="flex flex-wrap gap-2 mb-6 justify-center max-w-md animate-fade-in">
          {subPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => {
                setSeed((prev) => (prev ? `${prev} ` : '') + prompt + ' ');
                setShowSubPrompts(false);
              }}
              className="text-sm px-3 py-1.5 rounded-full border border-accent/20 text-accent/70 hover:border-accent/50 hover:text-accent transition-all"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {genesisError && (
        <div className="mb-4 px-4 py-3 rounded-lg border border-red-400/20 bg-red-400/5 max-w-lg w-full animate-fade-in">
          <p className="text-red-400/80 text-sm font-sans">{genesisError}</p>
        </div>
      )}

      <div className="w-full max-w-lg">
        <textarea
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          placeholder="I'm standing at the edge of a forest. The trees are whispering..."
          className="w-full bg-transparent border border-white/10 rounded-lg px-4 py-3 text-prose font-serif text-lg resize-none focus:outline-none focus:border-accent/40 placeholder:text-prose/20 min-h-[120px]"
          rows={4}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSeedSubmit();
            }
          }}
        />
        <button
          onClick={handleSeedSubmit}
          disabled={state.loading}
          className="mt-4 w-full py-3 rounded-lg bg-accent/20 text-accent font-serif text-lg hover:bg-accent/30 transition-all duration-300 disabled:opacity-50"
        >
          {state.loading ? 'The dream is forming…' : 'Enter the dream'}
        </button>
      </div>
    </div>
  );
}
