export type PlayerType = 'writer' | 'escapist';
export type SceneState = 'SCENE_ACTIVE' | 'SCENE_READY' | 'SCENE_RESOLVING';
export type GamePhase =
  | 'ONBOARDING_INTRO'
  | 'ONBOARDING_SEED'
  | 'ONBOARDING_SUMMARY'
  | 'GENERATING'
  | 'PLAYING'
  | 'WORLD_BUILDING';

export interface SeedAnswers {
  identity: string;
  place: string;
  characters: string;
  desire: string;
}

export interface Character {
  id: string;
  name: string;
  personality: string;
  backstory: string;
  goals: string;
  secrets: string;
  emotional_state: string;
  present_in_scene: boolean;
}

export interface ActionCard {
  id: string;
  label: string;
  description: string;
}

export interface WorldState {
  setting: {
    description: string;
    era: string;
    tone: string;
    reality_rules: string;
  };
  characters: Character[];
  narrative_history: string;
  wackiness: number;
  active_branches: ActionCard[];
  scene_state: SceneState;
  player_type: PlayerType;
}

export interface ProseEntry {
  id: string;
  text: string;
  type: 'narration' | 'dialogue' | 'system';
}

export interface LLMRequest {
  action: 'genesis' | 'story_action' | 'dialogue' | 'do_this_for_me' | 'add_character';
  world_state: WorldState | null;
  player_input: string;
  player_type: PlayerType;
  wackiness: number;
  focused_character_id: string | null;
  seed?: SeedAnswers;
}

export interface LLMResponse {
  prose: string;
  action_cards: ActionCard[];
  updated_world_state: WorldState;
  character_dialogue?: string;
}

export interface GameState {
  phase: GamePhase;
  playerType: PlayerType | null;
  worldState: WorldState | null;
  proseHistory: ProseEntry[];
  focusedCharacterId: string | null;
  loading: boolean;
  error: string | null;
  wackiness: number;
  seedAnswers: SeedAnswers;
  seedDecided: Record<string, boolean>;
}
