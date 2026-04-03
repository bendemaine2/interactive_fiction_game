'use client';

import React, { createContext, useReducer, useCallback } from 'react';
import type {
  GameState,
  GamePhase,
  PlayerType,
  WorldState,
  ProseEntry,
  Character,
  SceneState,
  SeedAnswers,
} from '@/lib/types';

type GameAction =
  | { type: 'SET_PLAYER_TYPE'; payload: PlayerType }
  | { type: 'SET_PHASE'; payload: GamePhase }
  | { type: 'SET_WORLD_STATE'; payload: WorldState }
  | { type: 'UPDATE_WACKINESS'; payload: number }
  | { type: 'UPDATE_CHARACTER'; payload: { id: string; updates: Partial<Character> } }
  | { type: 'ADD_CHARACTER'; payload: Character }
  | { type: 'REMOVE_CHARACTER'; payload: string }
  | { type: 'SET_SCENE_STATE'; payload: SceneState }
  | { type: 'APPEND_PROSE'; payload: ProseEntry }
  | { type: 'SET_FOCUSED_CHARACTER'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SEED_ANSWER'; payload: { key: keyof SeedAnswers; value: string; decided: boolean } }
  | { type: 'SET_SEED_ANSWERS'; payload: { answers: SeedAnswers; decided: Record<string, boolean> } };

const initialState: GameState = {
  phase: 'ONBOARDING_INTRO',
  playerType: null,
  worldState: null,
  proseHistory: [],
  focusedCharacterId: null,
  loading: false,
  error: null,
  wackiness: 50,
  seedAnswers: { identity: '', place: '', characters: '', desire: '' },
  seedDecided: {},
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_PLAYER_TYPE':
      return { ...state, playerType: action.payload };
    case 'SET_PHASE':
      return { ...state, phase: action.payload };
    case 'SET_WORLD_STATE':
      return { ...state, worldState: action.payload };
    case 'UPDATE_WACKINESS':
      return {
        ...state,
        wackiness: action.payload,
        ...(state.worldState
          ? { worldState: { ...state.worldState, wackiness: action.payload } }
          : {}),
      };
    case 'UPDATE_CHARACTER':
      if (!state.worldState) return state;
      return {
        ...state,
        worldState: {
          ...state.worldState,
          characters: state.worldState.characters.map((c) =>
            c.id === action.payload.id ? { ...c, ...action.payload.updates } : c
          ),
        },
      };
    case 'ADD_CHARACTER':
      if (!state.worldState) return state;
      return {
        ...state,
        worldState: {
          ...state.worldState,
          characters: [...state.worldState.characters, action.payload],
        },
      };
    case 'REMOVE_CHARACTER':
      if (!state.worldState) return state;
      return {
        ...state,
        worldState: {
          ...state.worldState,
          characters: state.worldState.characters.filter((c) => c.id !== action.payload),
        },
        focusedCharacterId:
          state.focusedCharacterId === action.payload ? null : state.focusedCharacterId,
      };
    case 'SET_SCENE_STATE':
      if (!state.worldState) return state;
      return {
        ...state,
        worldState: { ...state.worldState, scene_state: action.payload },
      };
    case 'APPEND_PROSE':
      return {
        ...state,
        proseHistory: [...state.proseHistory, action.payload],
      };
    case 'SET_FOCUSED_CHARACTER':
      return { ...state, focusedCharacterId: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_SEED_ANSWER':
      return {
        ...state,
        seedAnswers: { ...state.seedAnswers, [action.payload.key]: action.payload.value },
        seedDecided: { ...state.seedDecided, [action.payload.key]: action.payload.decided },
      };
    case 'SET_SEED_ANSWERS':
      return {
        ...state,
        seedAnswers: action.payload.answers,
        seedDecided: action.payload.decided,
      };
    default:
      return state;
  }
}

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  setPlayerType: (type: PlayerType) => void;
  setPhase: (phase: GamePhase) => void;
  setWorldState: (ws: WorldState) => void;
  updateWackiness: (value: number) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  addCharacter: (character: Character) => void;
  removeCharacter: (id: string) => void;
  setSceneState: (state: SceneState) => void;
  appendProse: (entry: ProseEntry) => void;
  setFocusedCharacter: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSeedAnswer: (key: keyof SeedAnswers, value: string, decided: boolean) => void;
}

export const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const setPlayerType = useCallback((type: PlayerType) => dispatch({ type: 'SET_PLAYER_TYPE', payload: type }), []);
  const setPhase = useCallback((phase: GamePhase) => dispatch({ type: 'SET_PHASE', payload: phase }), []);
  const setWorldState = useCallback((ws: WorldState) => dispatch({ type: 'SET_WORLD_STATE', payload: ws }), []);
  const updateWackiness = useCallback((value: number) => dispatch({ type: 'UPDATE_WACKINESS', payload: value }), []);
  const updateCharacter = useCallback((id: string, updates: Partial<Character>) => dispatch({ type: 'UPDATE_CHARACTER', payload: { id, updates } }), []);
  const addCharacter = useCallback((character: Character) => dispatch({ type: 'ADD_CHARACTER', payload: character }), []);
  const removeCharacter = useCallback((id: string) => dispatch({ type: 'REMOVE_CHARACTER', payload: id }), []);
  const setSceneState = useCallback((s: SceneState) => dispatch({ type: 'SET_SCENE_STATE', payload: s }), []);
  const appendProse = useCallback((entry: ProseEntry) => dispatch({ type: 'APPEND_PROSE', payload: entry }), []);
  const setFocusedCharacter = useCallback((id: string | null) => dispatch({ type: 'SET_FOCUSED_CHARACTER', payload: id }), []);
  const setLoading = useCallback((loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }), []);
  const setError = useCallback((error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }), []);
  const setSeedAnswer = useCallback((key: keyof SeedAnswers, value: string, decided: boolean) => dispatch({ type: 'SET_SEED_ANSWER', payload: { key, value, decided } }), []);

  return (
    <GameContext.Provider
      value={{
        state, dispatch,
        setPlayerType, setPhase, setWorldState, updateWackiness,
        updateCharacter, addCharacter, removeCharacter, setSceneState,
        appendProse, setFocusedCharacter, setLoading, setError, setSeedAnswer,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
