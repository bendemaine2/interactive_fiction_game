'use client';

import { useGame } from '@/hooks/useGame';

export default function CharacterChips() {
  const { state, setFocusedCharacter } = useGame();
  const presentCharacters =
    state.worldState?.characters.filter((c) => c.present_in_scene) || [];

  if (presentCharacters.length === 0) return null;

  return (
    <div className="flex gap-2 px-4 py-2 overflow-x-auto">
      {presentCharacters.map((character) => {
        const isFocused = state.focusedCharacterId === character.id;
        return (
          <button
            key={character.id}
            onClick={() => setFocusedCharacter(isFocused ? null : character.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-sans transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center ${
              isFocused
                ? 'bg-accent/30 text-accent border border-accent/50'
                : 'border border-white/10 text-prose/70 hover:border-accent/30 hover:text-accent/80'
            }`}
            title={character.personality}
          >
            {character.name}
          </button>
        );
      })}
      {state.focusedCharacterId && (
        <button
          onClick={() => setFocusedCharacter(null)}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm text-prose/40 hover:text-prose/60 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          ✕
        </button>
      )}
    </div>
  );
}
