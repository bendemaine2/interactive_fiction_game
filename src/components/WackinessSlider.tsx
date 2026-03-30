'use client';

import { useGame } from '@/hooks/useGame';

export default function WackinessSlider() {
  const { state, updateWackiness } = useGame();
  const value = state.worldState?.wackiness ?? 50;

  const label =
    value <= 20
      ? 'Grounded'
      : value <= 40
        ? 'Heightened'
        : value <= 60
          ? 'Dreamlike'
          : value <= 80
            ? 'Surreal'
            : 'Unbound';

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs text-prose/40 font-sans">
        <span>Wackiness</span>
        <span className="text-accent/60">{label}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => updateWackiness(Number(e.target.value))}
        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-amber-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:cursor-pointer"
      />
    </div>
  );
}
