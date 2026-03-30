'use client';

import { useState } from 'react';
import type { Character } from '@/lib/types';

interface CharacterCardProps {
  character: Character;
  onUpdate: (id: string, updates: Partial<Character>) => void;
  onRemove: (id: string) => void;
}

export default function CharacterCard({ character, onUpdate, onRemove }: CharacterCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const fields: { key: keyof Character; label: string }[] = [
    { key: 'personality', label: 'Personality' },
    { key: 'backstory', label: 'Backstory' },
    { key: 'goals', label: 'Goals' },
    { key: 'emotional_state', label: 'Emotional State' },
  ];

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <input
          type="text"
          value={character.name}
          onChange={(e) => onUpdate(character.id, { name: e.target.value })}
          className="bg-transparent text-accent font-serif text-lg font-medium focus:outline-none border-b border-transparent focus:border-accent/30 w-full"
        />
        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="text-prose/20 hover:text-red-400/60 transition-all text-sm ml-2 flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            Remove
          </button>
        ) : (
          <div className="flex gap-1 ml-2 flex-shrink-0">
            <button
              onClick={() => {
                onRemove(character.id);
                setShowConfirm(false);
              }}
              className="text-red-400/80 text-xs px-2 py-1 rounded border border-red-400/30 hover:bg-red-400/10 min-h-[44px] flex items-center"
            >
              Yes, remove
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="text-prose/40 text-xs px-2 py-1 min-h-[44px] flex items-center"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {showConfirm && (
        <p className="text-xs text-red-400/50 italic font-serif">
          Removing a character is permanent. The world will notice they are gone.
        </p>
      )}

      <div className="flex items-center gap-2">
        <label className="text-xs text-prose/30 font-sans w-16 flex-shrink-0">In scene</label>
        <button
          onClick={() => onUpdate(character.id, { present_in_scene: !character.present_in_scene })}
          className={`px-2 py-1 rounded text-xs transition-all min-h-[44px] flex items-center ${
            character.present_in_scene
              ? 'text-accent/70 border border-accent/30'
              : 'text-prose/30 border border-white/10'
          }`}
        >
          {character.present_in_scene ? 'Present' : 'Absent'}
        </button>
      </div>

      {fields.map(({ key, label }) => (
        <div key={key} className="flex flex-col gap-1">
          <label className="text-xs text-prose/30 font-sans">{label}</label>
          <textarea
            value={String(character[key])}
            onChange={(e) => onUpdate(character.id, { [key]: e.target.value })}
            className="bg-white/5 rounded px-3 py-2 text-sm text-prose/80 font-serif resize-none focus:outline-none focus:ring-1 focus:ring-accent/20 min-h-[60px]"
            rows={2}
          />
        </div>
      ))}
    </div>
  );
}
