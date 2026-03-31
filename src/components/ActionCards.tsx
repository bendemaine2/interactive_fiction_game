'use client';

import { useRef } from 'react';
import { useGame } from '@/hooks/useGame';
import { generateResponse } from '@/lib/api';
import type { ActionCard } from '@/lib/types';

function isValidCards(cards: ActionCard[] | undefined): cards is ActionCard[] {
  if (!Array.isArray(cards) || cards.length !== 3) return false;
  return cards.every((c) => c.label?.trim() && c.description?.trim());
}

export default function ActionCards() {
  const { state, setWorldState, appendProse, setSceneState, setLoading, setError, setFocusedCharacter } =
    useGame();
  const lastValidCards = useRef<ActionCard[]>([]);

  const rawBranches = state.worldState?.active_branches;
  const branches = isValidCards(rawBranches) ? rawBranches : lastValidCards.current;

  // Keep track of last valid set
  if (isValidCards(rawBranches)) {
    lastValidCards.current = rawBranches;
  }

  const isResolving = state.worldState?.scene_state === 'SCENE_RESOLVING';
  const inDialogue = !!state.focusedCharacterId;

  async function handleCardSelect(branchId: string) {
    if (!state.worldState || isResolving || inDialogue) return;

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

      // Validate cards before applying — keep previous if invalid
      if (isValidCards(response.updated_world_state?.active_branches)) {
        setWorldState(response.updated_world_state);
      } else {
        // Keep previous cards, update everything else
        setWorldState({
          ...response.updated_world_state,
          active_branches: lastValidCards.current,
        });
      }

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

  if (branches.length === 0 && !isResolving) return null;

  return (
    <div className="px-4 py-3">
      <div className="max-w-2xl mx-auto">
        <p className="text-xs text-prose/40 font-sans uppercase tracking-wider mb-2">What will you do?</p>
        <div className="flex flex-col gap-2">
          {isResolving && branches.length === 0
            ? /* Skeleton loading */
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="px-4 py-3 rounded-xl bg-white/[0.03] border-l-2 border-l-white/10 animate-pulse"
                >
                  <div className="h-4 w-32 bg-white/[0.06] rounded mb-2" />
                  <div className="h-3 w-48 bg-white/[0.04] rounded" />
                </div>
              ))
            : branches.map((branch) => (
                <button
                  key={branch.id}
                  onClick={() => handleCardSelect(branch.id)}
                  disabled={isResolving || inDialogue}
                  className={`text-left px-4 py-3 rounded-xl transition-all duration-200 min-h-[44px] border-l-2 ${
                    isResolving || inDialogue
                      ? 'opacity-30 cursor-not-allowed bg-white/[0.02] border-l-white/10'
                      : 'bg-white/[0.06] border-l-accent hover:bg-white/[0.10] cursor-pointer'
                  }`}
                >
                  <span className="text-sm font-sans text-accent font-semibold block">
                    {branch.label}
                  </span>
                  <p className="text-xs text-prose/60 mt-1 font-sans leading-relaxed">
                    {branch.description}
                  </p>
                </button>
              ))}
        </div>
      </div>
    </div>
  );
}
