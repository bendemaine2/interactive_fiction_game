'use client';

import { useGame } from '@/hooks/useGame';
import { generateResponse } from '@/lib/api';

export default function ActionCards() {
  const { state, setWorldState, appendProse, setSceneState, setLoading, setError, setFocusedCharacter } =
    useGame();
  const branches = state.worldState?.active_branches || [];
  const isResolving = state.worldState?.scene_state === 'SCENE_RESOLVING';
  const isActive = state.worldState?.scene_state === 'SCENE_ACTIVE';

  async function handleCardSelect(branchId: string) {
    if (!state.worldState || isResolving) return;

    setSceneState('SCENE_RESOLVING');
    setFocusedCharacter(null);
    setLoading(true);
    setError(null);

    try {
      const response = await generateResponse({
        action: 'story_action',
        world_state: state.worldState,
        player_input: branchId,
        player_type: state.worldState.player_type,
        wackiness: state.worldState.wackiness,
        focused_character_id: null,
      });

      setWorldState(response.updated_world_state);
      appendProse({
        id: `action-${Date.now()}`,
        text: response.prose,
        type: 'narration',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The dream flickered…');
      setSceneState('SCENE_READY');
    } finally {
      setLoading(false);
    }
  }

  if (branches.length === 0) return null;

  return (
    <div className="px-4 py-3">
      <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-2">
        {branches.map((branch) => (
          <button
            key={branch.id}
            onClick={() => handleCardSelect(branch.id)}
            disabled={isResolving}
            className={`glass-card px-4 py-3 text-left transition-all duration-200 min-h-[44px] ${
              isResolving
                ? 'opacity-30 cursor-not-allowed'
                : isActive
                  ? 'opacity-50 hover:opacity-80'
                  : 'hover:border-accent/50 hover:bg-accent/5'
            }`}
            title={branch.description}
          >
            <span className="text-sm font-sans text-accent">{branch.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
