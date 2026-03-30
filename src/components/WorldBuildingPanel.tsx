'use client';

import { useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { generateResponse } from '@/lib/api';
import CharacterCard from './CharacterCard';
import WackinessSlider from './WackinessSlider';

export default function WorldBuildingPanel() {
  const {
    state,
    updateCharacter,
    removeCharacter,
    addCharacter,
    setWorldState,
    setPhase,
    setLoading,
    setError,
  } = useGame();
  const [newCharDesc, setNewCharDesc] = useState('');
  const [addingChar, setAddingChar] = useState(false);

  const worldState = state.worldState;
  if (!worldState) return null;

  async function handleAddCharacter() {
    if (!newCharDesc.trim() || !worldState) return;

    setAddingChar(true);
    setError(null);

    try {
      const response = await generateResponse({
        action: 'add_character',
        world_state: worldState,
        player_input: newCharDesc,
        player_type: worldState.player_type,
        wackiness: worldState.wackiness,
        focused_character_id: null,
      });

      const newChars = response.updated_world_state.characters.filter(
        (nc) => !worldState.characters.find((ec) => ec.id === nc.id)
      );

      if (newChars.length > 0) {
        newChars.forEach((c) => addCharacter(c));
      } else {
        setWorldState(response.updated_world_state);
      }

      setNewCharDesc('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create character');
    } finally {
      setAddingChar(false);
    }
  }

  function handleUpdateSetting(key: string, value: string) {
    if (!worldState) return;
    setWorldState({
      ...worldState,
      setting: { ...worldState.setting, [key]: value },
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 overflow-y-auto animate-slide-in">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-accent font-serif text-2xl">Shape Your World</h2>
          <button
            onClick={() => setPhase('PLAYING')}
            className="px-4 py-2 rounded-full text-sm font-sans border border-accent/30 text-accent hover:bg-accent/10 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            Return to Story
          </button>
        </div>

        {/* World Settings */}
        <section className="mb-8 space-y-3">
          <h3 className="text-prose/50 font-sans text-sm uppercase tracking-wider">World</h3>
          {(['tone', 'era', 'reality_rules'] as const).map((key) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs text-prose/30 font-sans capitalize">
                {key.replace('_', ' ')}
              </label>
              <input
                type="text"
                value={worldState.setting[key]}
                onChange={(e) => handleUpdateSetting(key, e.target.value)}
                className="bg-white/5 rounded px-3 py-2 text-sm text-prose/80 font-serif focus:outline-none focus:ring-1 focus:ring-accent/20"
              />
            </div>
          ))}

          <div className="mt-4">
            <WackinessSlider />
          </div>
        </section>

        {/* Characters */}
        <section className="mb-8 space-y-4">
          <h3 className="text-prose/50 font-sans text-sm uppercase tracking-wider">Characters</h3>
          {worldState.characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              onUpdate={updateCharacter}
              onRemove={removeCharacter}
            />
          ))}

          {/* Add Character */}
          <div className="glass-card p-4 space-y-3">
            <h4 className="text-accent/60 font-serif">Add a Character</h4>
            <textarea
              value={newCharDesc}
              onChange={(e) => setNewCharDesc(e.target.value)}
              placeholder="Describe who they are in a sentence or two…"
              className="w-full bg-white/5 rounded px-3 py-2 text-sm text-prose/80 font-serif resize-none focus:outline-none focus:ring-1 focus:ring-accent/20 placeholder:text-prose/20 min-h-[60px]"
              rows={2}
            />
            <button
              onClick={handleAddCharacter}
              disabled={!newCharDesc.trim() || addingChar}
              className="px-4 py-2 rounded-lg bg-accent/20 text-accent text-sm hover:bg-accent/30 transition-all disabled:opacity-30 min-h-[44px]"
            >
              {addingChar ? 'Creating…' : 'Add to World'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
