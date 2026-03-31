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
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => updateWackiness(Number(e.target.value))}
        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:cursor-pointer"
      />
      <span className="text-[10px] text-accent/60 font-sans whitespace-nowrap w-16 text-right">
        {label}
      </span>
    </div>
  );
}
