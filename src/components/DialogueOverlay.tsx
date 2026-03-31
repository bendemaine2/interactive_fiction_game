'use client';

import { useState, useRef, useEffect } from 'react';
import { useGame } from '@/hooks/useGame';

interface DialogueExchange {
  id: string;
  speaker: 'player' | 'character';
  text: string;
}

export default function DialogueOverlay() {
  const { state, setFocusedCharacter } = useGame();
  const [exchanges, setExchanges] = useState<DialogueExchange[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const character = state.worldState?.characters.find(
    (c) => c.id === state.focusedCharacterId
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [exchanges.length]);

  // Reset exchanges when character changes
  useEffect(() => {
    setExchanges([]);
  }, [state.focusedCharacterId]);

  if (!character) return null;

  async function handleSubmit() {
    if (!input.trim() || loading || !state.worldState || !character) return;

    const playerText = input;
    setInput('');
    setExchanges((prev) => [
      ...prev,
      { id: `p-${Date.now()}`, speaker: 'player', text: playerText },
    ]);
    setLoading(true);

    try {
      const last10 = exchanges.slice(-10).map((e) => ({
        speaker: e.speaker,
        text: e.text,
      }));

      const response = await fetch('/api/action/dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character_id: character.id,
          player_dialogue: playerText,
          world_state: state.worldState,
          scene_context: last10,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || `Error: ${response.status}`);
      }

      const data = await response.json();
      setExchanges((prev) => [
        ...prev,
        { id: `c-${Date.now()}`, speaker: 'character', text: data.response },
      ]);
    } catch (err) {
      setExchanges((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          speaker: 'character',
          text: `${character.name} looks at you but says nothing. The moment passes.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleExit() {
    setFocusedCharacter(null);
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 flex flex-col animate-dialogue-up"
      style={{ maxHeight: '70vh' }}
    >
      {/* Top gradient fade */}
      <div className="h-12 bg-gradient-to-b from-transparent to-[#0d0d0d] flex-shrink-0" />

      {/* Dialogue container */}
      <div className="bg-[#0d0d0d] flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-accent font-serif text-lg">{character.name}</span>
            <span className="text-prose/30 text-xs font-sans">{character.emotional_state}</span>
          </div>
          <button
            onClick={handleExit}
            className="text-prose/40 hover:text-accent text-sm font-sans transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            ↑ back to story
          </button>
        </div>

        {/* Exchange area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-[120px]">
          {exchanges.length === 0 && (
            <p className="text-prose/20 text-sm font-serif italic text-center py-4">
              {character.name} is here. What do you say?
            </p>
          )}
          {exchanges.map((exchange) => (
            <div
              key={exchange.id}
              className={`animate-fade-in ${
                exchange.speaker === 'player'
                  ? 'text-right'
                  : 'text-left'
              }`}
            >
              <div
                className={`inline-block max-w-[85%] px-4 py-2 rounded-xl text-sm font-serif leading-relaxed ${
                  exchange.speaker === 'player'
                    ? 'bg-accent/10 text-prose/80 border border-accent/20'
                    : 'bg-white/[0.04] text-prose/90 border border-white/[0.06]'
                }`}
              >
                {exchange.text.split('\n').map((p, i) => (
                  <p key={i} className={i > 0 ? 'mt-2' : ''}>
                    {p}
                  </p>
                ))}
              </div>
            </div>
          ))}
          {loading && (
            <div className="text-left animate-fade-in">
              <span className="text-prose/30 text-sm font-serif italic animate-pulse">
                {character.name} considers…
              </span>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-white/5">
          <div className="flex gap-2 max-w-2xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Speak to ${character.name}…`}
              disabled={loading}
              className="flex-1 bg-transparent border border-accent/20 rounded-lg px-4 py-3 text-prose font-serif text-sm focus:outline-none focus:border-accent/40 placeholder:text-prose/20 disabled:opacity-30 min-h-[44px]"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || loading}
              className="px-4 py-3 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-all disabled:opacity-30 min-w-[44px] min-h-[44px]"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
