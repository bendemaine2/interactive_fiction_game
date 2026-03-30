'use client';

import { useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { generateResponse } from '@/lib/api';

export default function StoryInput() {
  const {
    state,
    setWorldState,
    appendProse,
    setSceneState,
    setLoading,
    setError,
    setFocusedCharacter,
  } = useGame();
  const [input, setInput] = useState('');

  const isResolving = state.worldState?.scene_state === 'SCENE_RESOLVING';
  const focusedCharacter = state.worldState?.characters.find(
    (c) => c.id === state.focusedCharacterId
  );

  const placeholder = focusedCharacter
    ? `Speak to ${focusedCharacter.name}…`
    : 'What do you do?';

  async function handleSubmit() {
    if (!input.trim() || !state.worldState || isResolving) return;

    const isDialogue = !!state.focusedCharacterId;
    setSceneState(isDialogue ? 'SCENE_ACTIVE' : 'SCENE_RESOLVING');
    setLoading(true);
    setError(null);

    const currentInput = input;
    setInput('');

    try {
      const response = await generateResponse({
        action: isDialogue ? 'dialogue' : 'story_action',
        world_state: state.worldState,
        player_input: currentInput,
        player_type: state.worldState.player_type,
        wackiness: state.worldState.wackiness,
        focused_character_id: state.focusedCharacterId,
      });

      setWorldState(response.updated_world_state);
      appendProse({
        id: `${isDialogue ? 'dialogue' : 'action'}-${Date.now()}`,
        text: response.prose,
        type: isDialogue ? 'dialogue' : 'narration',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The dream flickered…');
      setInput(currentInput);
      setSceneState('SCENE_READY');
    } finally {
      setLoading(false);
    }
  }

  async function handleDoThisForMe() {
    if (!state.worldState || isResolving) return;

    setSceneState('SCENE_RESOLVING');
    setFocusedCharacter(null);
    setLoading(true);
    setError(null);

    try {
      const response = await generateResponse({
        action: 'do_this_for_me',
        world_state: state.worldState,
        player_input: '',
        player_type: state.worldState.player_type,
        wackiness: state.worldState.wackiness,
        focused_character_id: null,
      });

      setWorldState(response.updated_world_state);
      appendProse({
        id: `auto-${Date.now()}`,
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

  return (
    <div className="px-4 py-3 border-t border-white/5">
      <div className="max-w-2xl mx-auto">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={isResolving}
            className="flex-1 bg-transparent border border-white/10 rounded-lg px-4 py-3 text-prose font-serif focus:outline-none focus:border-accent/40 placeholder:text-prose/20 disabled:opacity-30 min-h-[44px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isResolving}
            className="px-4 py-3 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed min-w-[44px] min-h-[44px]"
            title="Send"
          >
            →
          </button>
        </div>
        <button
          onClick={handleDoThisForMe}
          disabled={isResolving}
          className="mt-2 w-full py-2 text-sm text-prose/30 hover:text-accent/60 transition-all disabled:opacity-20 font-sans"
        >
          Do this for me
        </button>
      </div>
    </div>
  );
}
