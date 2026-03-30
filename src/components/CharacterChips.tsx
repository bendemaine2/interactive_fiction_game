'use client';

import { useGame } from '@/hooks/useGame';

export default function CharacterChips() {
  const { state, setFocusedCharacter } = useGame();
  const presentCharacters =
    state.worldState?.characters.filter((c) => c.present_in_scene) || [];

  if (presentCharacters.length === 0) return null;

  return (
    <div className="px-4 py-2 border-b border-white/5">
      <div className="flex items-center gap-2 overflow-x-auto">
        <span className="text-xs text-prose/30 font-sans flex-shrink-0 uppercase tracking-wider">
          Talk to
        </span>
        {presentCharacters.map((character) => {
          const isFocused = state.focusedCharacterId === character.id;
          return (
            <button
              key={character.id}
              onClick={() => setFocusedCharacter(isFocused ? null : character.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-sans transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer ${
                isFocused
                  ? 'bg-accent/30 text-accent border border-accent/50 shadow-[0_0_12px_rgba(201,169,110,0.15)]'
                  : 'border border-white/15 text-prose/70 hover:border-accent/40 hover:text-accent hover:bg-accent/5'
              }`}
            >
              {character.name}
            </button>
          );
        })}
        {state.focusedCharacterId && (
          <button
            onClick={() => setFocusedCharacter(null)}
            className="flex-shrink-0 px-3 py-2 rounded-full text-xs text-prose/40 hover:text-prose/60 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Stop talking"
          >
            ✕ Clear
          </button>
        )}
      </div>
    </div>
  );
}
