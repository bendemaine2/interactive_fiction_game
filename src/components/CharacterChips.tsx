'use client';

import { useGame } from '@/hooks/useGame';

export default function CharacterChips() {
  const { state, setFocusedCharacter } = useGame();
  const presentCharacters =
    state.worldState?.characters.filter((c) => c.present_in_scene) || [];

  if (presentCharacters.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto flex-1 mx-2">
      {presentCharacters.map((character) => {
        const isFocused = state.focusedCharacterId === character.id;
        return (
          <button
            key={character.id}
            onClick={() => setFocusedCharacter(isFocused ? null : character.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-sans transition-all duration-200 min-h-[36px] flex items-center justify-center cursor-pointer ${
              isFocused
                ? 'bg-accent/30 text-accent border border-accent/50 shadow-[0_0_12px_rgba(201,169,110,0.15)]'
                : 'border border-white/15 text-prose/70 hover:border-accent/40 hover:text-accent hover:bg-accent/5'
            }`}
          >
            {character.name}
          </button>
        );
      })}
    </div>
  );
}
