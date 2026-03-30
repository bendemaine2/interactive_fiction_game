'use client';

import { useGame } from '@/hooks/useGame';

export default function ModeSwitch() {
  const { state, setPhase } = useGame();
  const sceneState = state.worldState?.scene_state;
  const isLocked = sceneState === 'SCENE_ACTIVE' || sceneState === 'SCENE_RESOLVING';

  function handleToggle() {
    if (isLocked) return;
    setPhase(state.phase === 'WORLD_BUILDING' ? 'PLAYING' : 'WORLD_BUILDING');
  }

  if (state.phase === 'WORLD_BUILDING') {
    return (
      <button
        onClick={handleToggle}
        className="px-3 py-1.5 rounded-full text-sm font-sans border border-accent/30 text-accent hover:bg-accent/10 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
      >
        Return to Story
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLocked}
      className={`px-3 py-1.5 rounded-full text-sm font-sans transition-all min-w-[44px] min-h-[44px] flex items-center justify-center ${
        isLocked
          ? 'border border-white/5 text-prose/20 cursor-not-allowed'
          : 'border border-white/10 text-prose/50 hover:border-accent/30 hover:text-accent/70'
      }`}
      title={isLocked ? 'Available between scenes' : 'Edit your world'}
    >
      World
    </button>
  );
}
