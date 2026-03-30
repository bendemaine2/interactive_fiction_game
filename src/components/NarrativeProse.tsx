'use client';

import { useEffect, useRef } from 'react';
import type { ProseEntry } from '@/lib/types';

export default function NarrativeProse({ entries }: { entries: ProseEntry[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {entries.map((entry, i) => (
          <div
            key={entry.id}
            className={`font-serif text-lg leading-relaxed tracking-wide animate-fade-in ${
              entry.type === 'narration'
                ? 'text-prose'
                : entry.type === 'dialogue'
                  ? 'text-prose/90'
                  : 'text-accent/50 text-sm italic'
            }`}
            style={{ animationDelay: `${i === entries.length - 1 ? 0.1 : 0}s` }}
          >
            {entry.text.split('\n').map((paragraph, j) => (
              <p key={j} className={j > 0 ? 'mt-4' : ''}>
                {paragraph}
              </p>
            ))}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
