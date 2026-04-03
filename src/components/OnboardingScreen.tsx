'use client';

import { useState, useEffect, useRef } from 'react';
import { useGame } from '@/hooks/useGame';
import type { PlayerType, SeedAnswers } from '@/lib/types';

const SEED_QUESTIONS: {
  key: keyof SeedAnswers;
  label: string;
  question: string;
  subLabel: string;
  placeholder: string;
  decidedOptions: string[];
}[] = [
  {
    key: 'identity',
    label: 'Who are you',
    question: 'Who are you in this story?',
    subLabel: 'A name, a role, a feeling — or leave it open.',
    placeholder: 'A cartographer who stopped believing in maps...',
    decidedOptions: [
      'A traveller without a name.',
      'Someone who arrived recently.',
      'An outsider who knows too much.',
    ],
  },
  {
    key: 'place',
    label: 'Where are you',
    question: 'Where does the story begin?',
    subLabel: 'A place, a time, an atmosphere.',
    placeholder: 'A train platform at 3am, somewhere in Eastern Europe...',
    decidedOptions: [
      'A fog-bound coastal town, 1920s.',
      'A research station at the edge of something.',
      'An island that appears on no maps.',
    ],
  },
  {
    key: 'characters',
    label: 'Who is with you',
    question: 'Is anyone with you?',
    subLabel: 'Name them, describe them briefly — or leave yourself alone.',
    placeholder: 'My sister, who I haven\'t spoken to in three years...',
    decidedOptions: [
      'A partner who keeps secrets.',
      'An old friend you no longer trust.',
      'No one. You came here alone.',
    ],
  },
  {
    key: 'desire',
    label: 'What do you want',
    question: 'What do you want — or what do you fear?',
    subLabel: 'A goal, a secret, a dread. Doesn\'t have to be clear.',
    placeholder: 'To find out what happened to the last expedition...',
    decidedOptions: [
      'Find something that was taken.',
      'Understand what\'s happening before it\'s too late.',
      'You\'re not sure yet. That\'s the point.',
    ],
  },
];

function IntroSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const label = value <= 33 ? 'Grounded' : value <= 66 ? 'Balanced' : 'Wacky';
  return (
    <div className="w-full max-w-xs mx-auto">
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-[1px] bg-white/15 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[10px] [&::-webkit-slider-thumb]:h-[10px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:cursor-pointer"
        style={{
          background: `linear-gradient(to right, rgba(196,160,80,0.4) 0%, rgba(196,160,80,0.4) ${value}%, rgba(255,255,255,0.15) ${value}%, rgba(255,255,255,0.15) 100%)`,
          transition: 'background 100ms ease',
        }}
      />
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] tracking-[0.15em] text-white/25">Grounded</span>
        <span className="text-[10px] tracking-[0.15em] text-white/25">{label}</span>
        <span className="text-[10px] tracking-[0.15em] text-white/25">Wacky</span>
      </div>
    </div>
  );
}

interface Props {
  onGenesis: (seedText: string, seed: SeedAnswers, wackiness: number) => void;
  genesisError: string | null;
}

export default function OnboardingScreen({ onGenesis, genesisError }: Props) {
  const { state, setPlayerType, setPhase, updateWackiness, setSeedAnswer } = useGame();
  const [selectedFork, setSelectedFork] = useState<PlayerType | null>(null);
  const [seedStep, setSeedStep] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [isDecided, setIsDecided] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on seed step change
  useEffect(() => {
    if (state.phase === 'ONBOARDING_SEED') {
      const timer = setTimeout(() => inputRef.current?.focus(), 420);
      return () => clearTimeout(timer);
    }
  }, [seedStep, state.phase]);

  // Sync currentInput from seed answers when step changes
  useEffect(() => {
    if (state.phase === 'ONBOARDING_SEED') {
      const key = SEED_QUESTIONS[seedStep]?.key;
      if (key) {
        setCurrentInput(state.seedAnswers[key]);
        setIsDecided(!!state.seedDecided[key]);
      }
    }
  }, [seedStep, state.phase, state.seedAnswers, state.seedDecided]);

  function handleForkSelect(type: PlayerType) {
    setSelectedFork(type);
    setPlayerType(type);
    const nudge = type === 'writer' ? 20 : 55;
    updateWackiness(nudge);
  }

  function handleForkContinue() {
    if (!selectedFork) return;
    setPhase('ONBOARDING_SEED');
    setSeedStep(0);
    setAnimKey((k) => k + 1);
  }

  function handleSeedContinue() {
    const q = SEED_QUESTIONS[seedStep];
    if (!currentInput.trim()) return;
    setSeedAnswer(q.key, currentInput.trim(), isDecided);

    if (seedStep < 3) {
      setSeedStep(seedStep + 1);
      setCurrentInput('');
      setIsDecided(false);
      setAnimKey((k) => k + 1);
    } else {
      setPhase('ONBOARDING_SUMMARY');
    }
  }

  function handleDecideForMe() {
    const q = SEED_QUESTIONS[seedStep];
    const options = q.decidedOptions;
    const picked = options[Math.floor(Math.random() * options.length)];
    setCurrentInput(picked);
    setIsDecided(true);
  }

  function handleGenesis() {
    const s = state.seedAnswers;
    const seedText = `Who I am: ${s.identity}\nWhere I am: ${s.place}\nWho is with me: ${s.characters}\nWhat I want: ${s.desire}`;
    onGenesis(seedText, state.seedAnswers, state.wackiness);
  }

  // ── INTRO SCREEN ──
  if (state.phase === 'ONBOARDING_INTRO') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 animate-fade-in">
        {/* Wordmark */}
        <h1 className="text-accent font-serif text-3xl md:text-4xl tracking-wide mb-8">
          DREAM FICTION
        </h1>

        {/* Wackiness slider */}
        <div className="mb-10 w-full max-w-xs">
          <IntroSlider value={state.wackiness} onChange={updateWackiness} />
        </div>

        {/* Orientation line */}
        <p className="text-center mb-2" style={{ color: 'rgba(255,255,255,0.82)' }}>
          <span className="font-serif text-lg">Dream Fiction is a living world you shape as you play.</span>
        </p>
        <p className="text-center mb-10" style={{ color: 'rgba(255,255,255,0.55)' }}>
          <span className="font-serif text-base italic">How would you like to begin?</span>
        </p>

        {/* Fork cards */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <button
            onClick={() => handleForkSelect('writer')}
            className={`flex-1 glass-card px-5 py-5 text-left transition-all duration-300 ${
              selectedFork === 'writer'
                ? 'border-accent/60 bg-accent/[0.08]'
                : 'hover:border-accent/30'
            }`}
          >
            <span className="font-serif text-lg text-prose block mb-1">I have a world in mind</span>
            <span className="text-xs text-prose/40 font-sans">I'll lead. You follow my vision.</span>
          </button>
          <button
            onClick={() => handleForkSelect('escapist')}
            className={`flex-1 glass-card px-5 py-5 text-left transition-all duration-300 ${
              selectedFork === 'escapist'
                ? 'border-accent/60 bg-accent/[0.08]'
                : 'hover:border-accent/30'
            }`}
          >
            <span className="font-serif text-lg text-prose block mb-1">Take me somewhere new</span>
            <span className="text-xs text-prose/40 font-sans">Surprise me. I want to get lost.</span>
          </button>
        </div>

        {/* Continue */}
        <div
          className="mt-8 transition-all duration-400"
          style={{ opacity: selectedFork ? 1 : 0, pointerEvents: selectedFork ? 'auto' : 'none' }}
        >
          <button
            onClick={handleForkContinue}
            className="px-8 py-3 rounded-lg bg-accent/20 text-accent font-serif text-lg hover:bg-accent/30 transition-all"
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  // ── SEED QUESTIONS ──
  if (state.phase === 'ONBOARDING_SEED') {
    const q = SEED_QUESTIONS[seedStep];
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6" key={animKey}>
        {/* Wordmark */}
        <h1 className="text-accent/40 font-serif text-xl tracking-wide mb-6">
          DREAM FICTION
        </h1>

        {/* Progress dots */}
        <div className="flex gap-2 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i < seedStep
                  ? 'bg-accent/40'
                  : i === seedStep
                    ? 'bg-accent'
                    : 'bg-white/15'
              }`}
            />
          ))}
        </div>

        {/* Question */}
        <div className="text-center animate-fade-in">
          <p className="text-[11px] tracking-[0.2em] uppercase text-prose/30 font-sans mb-4">
            {q.label}
          </p>
          <p className="font-serif text-xl text-prose/90 mb-2">{q.question}</p>
          <p className="font-serif text-sm italic text-prose/40 mb-8">{q.subLabel}</p>
        </div>

        {/* Input — underline only, centred */}
        <div className="w-full max-w-md mb-6 animate-fade-in">
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => {
              setCurrentInput(e.target.value);
              if (isDecided) setIsDecided(false);
            }}
            placeholder={q.placeholder}
            className={`w-full bg-transparent border-b text-center font-serif text-lg py-2 focus:outline-none placeholder:italic min-h-[44px] ${
              isDecided
                ? 'border-accent/30 text-accent/70 italic'
                : 'border-white/15 text-prose focus:border-accent/40 placeholder:text-prose/20'
            }`}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSeedContinue();
              }
            }}
          />
        </div>

        {/* Continue */}
        <button
          onClick={handleSeedContinue}
          disabled={!currentInput.trim()}
          className="px-8 py-3 rounded-lg bg-accent/20 text-accent font-serif text-lg hover:bg-accent/30 transition-all disabled:opacity-[0.25] disabled:pointer-events-none mb-4"
        >
          Continue →
        </button>

        {/* Decide for me */}
        <button
          onClick={handleDecideForMe}
          className="text-sm font-sans transition-all hover:text-accent/80"
          style={{ color: 'rgba(196,160,80,0.6)' }}
        >
          ✦ decide for me
        </button>
      </div>
    );
  }

  // ── SUMMARY SCREEN ──
  if (state.phase === 'ONBOARDING_SUMMARY') {
    const labels: { key: keyof SeedAnswers; label: string }[] = [
      { key: 'identity', label: 'WHO ARE YOU' },
      { key: 'place', label: 'WHERE ARE YOU' },
      { key: 'characters', label: 'WHO IS WITH YOU' },
      { key: 'desire', label: 'WHAT DO YOU WANT' },
    ];

    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 animate-fade-in">
        <p className="font-serif text-xl text-prose/60 mb-8">Here's your world seed.</p>

        {genesisError && (
          <div className="mb-4 px-4 py-3 rounded-lg border border-red-400/20 bg-red-400/5 max-w-lg w-full">
            <p className="text-red-400/80 text-sm font-sans">{genesisError}</p>
          </div>
        )}

        {/* Summary cards */}
        <div className="w-full max-w-md mb-8">
          <div className="glass-card divide-y divide-white/5">
            {labels.map(({ key, label }, i) => {
              const decided = state.seedDecided[key];
              const isEditing = editingRow === i;
              return (
                <div
                  key={key}
                  className="px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-all"
                  onClick={() => !isEditing && setEditingRow(i)}
                >
                  <p className="text-[10px] tracking-[0.15em] text-prose/30 font-sans mb-1">{label}</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={state.seedAnswers[key]}
                      onChange={(e) => setSeedAnswer(key, e.target.value, false)}
                      onBlur={() => setEditingRow(null)}
                      onKeyDown={(e) => { if (e.key === 'Enter') setEditingRow(null); }}
                      className="w-full bg-transparent font-serif text-sm text-prose focus:outline-none border-b border-accent/30 py-1"
                      autoFocus
                    />
                  ) : (
                    <p className={`font-serif text-sm ${decided ? 'text-accent/70 italic' : 'text-prose/90'}`}>
                      {state.seedAnswers[key]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CTAs */}
        <button
          onClick={handleGenesis}
          disabled={state.loading}
          className="px-8 py-3 rounded-lg bg-accent/20 text-accent font-serif text-lg hover:bg-accent/30 transition-all disabled:opacity-50 mb-3"
        >
          {state.loading ? 'Building your world…' : 'Dream it →'}
        </button>
        <button
          onClick={handleGenesis}
          disabled={state.loading}
          className="text-sm text-prose/30 font-sans hover:text-prose/50 transition-all disabled:opacity-30"
        >
          or start with this as-is
        </button>
      </div>
    );
  }

  return null;
}
