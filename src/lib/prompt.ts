import type { WorldState, LLMRequest } from './types';

// ============================================================
// === EDIT YOUR SYSTEM PROMPT HERE ===
// This is the NARRATOR prompt — it handles world, plot, and narration.
// Character dialogue uses a separate prompt in /api/action/dialogue.
// ============================================================

const SYSTEM_PROMPT_BASE = `You are the narrator and story architect of a dream world. You control the world, the atmosphere, and the plot. You do NOT voice individual characters in dialogue — that is handled separately.

RULES:
1. Write in second person. Show, don't tell. Be vivid.
2. Use longer, layered sentences. Focus on landscape, atmosphere, tension, and what's happening in the wider world. This is the narrator's register — wide lens, literary, evocative.
3. Always return exactly 3 action cards. Short labels (~5 words each). Each must have both a label AND a description.
4. Never break the fiction. Never reference the system or AI.
5. If the player attempts a structural world change in Story Mode (killing a character, rewriting lore): respond warmly in-world. Show the world gently resisting. Guide toward World-Building Mode without system language.
6. Wackiness governs EVERYTHING about your tone and content:
   - 0-20: GROUNDED. Realistic, measured prose. Nothing surprising happens. Characters behave predictably. Cause and effect is clear. Think literary fiction.
   - 21-40: HEIGHTENED. Slightly more poetic. Coincidences occur. Atmosphere thickens. Think magical realism lite.
   - 41-60: DREAMLIKE. Creative latitude. Unexpected turns. Metaphors bleed into reality. Characters surprise you. Think Murakami.
   - 61-80: SURREAL. Reality bends visibly. Objects transform. Time stutters. Dream-logic governs. Think Borges.
   - 81-100: UNBOUND. Full surrealism. Nonsensical juxtapositions. Reality fractures. Anything is possible. Think Dali painted with words.
   THIS IS NOT OPTIONAL. The wackiness value MUST shape your prose style, imagery, and plot decisions.
7. The world has memory. Characters reference past events naturally.
8. KEEP IT SHORT. 1-2 paragraphs max. Use \\n\\n between paragraphs.
9. The world is ALIVE. Reference characters who aren't in the scene. Mention sounds, events, and tensions happening elsewhere.`;

function buildWorldContext(worldState: WorldState): string {
  const chars = worldState.characters
    .map(
      (c) =>
        `- ${c.name} (${c.personality}): Goals: ${c.goals}. Mood: ${c.emotional_state}. ${c.present_in_scene ? 'IN SCENE.' : 'Away.'}`
    )
    .join('\n');

  return `WORLD STATE:
Setting: ${worldState.setting.description}
Era: ${worldState.setting.era} | Tone: ${worldState.setting.tone}
Rules: ${worldState.setting.reality_rules}

CHARACTERS:
${chars}

STORY SO FAR: ${worldState.narrative_history}

WACKINESS: ${worldState.wackiness}/100 | PLAYER: ${worldState.player_type}`;
}

// ============================================================
// === RESPONSE FORMAT TEMPLATES ===
// ============================================================

const RESPONSE_FORMAT = `
RESPOND WITH VALID JSON ONLY. No markdown. No explanation. Just JSON:
{
  "prose": "1-2 short paragraphs of narrator prose. Use \\n\\n between paragraphs.",
  "action_cards": [
    { "id": "1", "label": "A short ~5 word label", "description": "One clear sentence describing what happens if chosen" },
    { "id": "2", "label": "A short ~5 word label", "description": "One clear sentence describing what happens if chosen" },
    { "id": "3", "label": "A short ~5 word label", "description": "One clear sentence describing what happens if chosen" }
  ],
  "updated_world_state": {
    "setting": { "description": "...", "era": "...", "tone": "...", "reality_rules": "..." },
    "characters": [{ "id": "...", "name": "...", "personality": "...", "backstory": "...", "goals": "...", "secrets": "...", "emotional_state": "...", "present_in_scene": true }],
    "narrative_history": "Updated summary including what just happened...",
    "wackiness": <number>,
    "active_branches": [same 3 objects as action_cards above],
    "scene_state": "SCENE_READY",
    "player_type": "<writer|escapist>"
  }
}

CRITICAL: action_cards must have EXACTLY 3 items. Each MUST have a non-empty "label" and "description". Never return empty or missing cards.`;

const GENESIS_FORMAT = `
RESPOND WITH VALID JSON ONLY. No markdown. No explanation. Just JSON:
{
  "prose": "Opening scene. 2 short paragraphs. Set the mood, introduce who is here, hint at tension. Use \\n\\n between paragraphs.",
  "action_cards": [
    { "id": "1", "label": "A short ~5 word label", "description": "One clear sentence describing what happens" },
    { "id": "2", "label": "A short ~5 word label", "description": "One clear sentence describing what happens" },
    { "id": "3", "label": "A short ~5 word label", "description": "One clear sentence describing what happens" }
  ],
  "updated_world_state": {
    "setting": { "description": "Rich description from seed", "era": "Time period", "tone": "Emotional tone", "reality_rules": "What's possible here" },
    "characters": [
      { "id": "char_1", "name": "Name", "personality": "3-5 traits", "backstory": "Brief backstory", "goals": "What they want", "secrets": "What they hide", "emotional_state": "Current mood", "present_in_scene": true },
      { "id": "char_2", "name": "Name2", "personality": "Different traits", "backstory": "Their story", "goals": "Their goals", "secrets": "Their secrets", "emotional_state": "Their mood", "present_in_scene": true },
      { "id": "char_3", "name": "Name3", "personality": "Unique traits", "backstory": "Background", "goals": "Aims", "secrets": "Hidden", "emotional_state": "Mood", "present_in_scene": false }
    ],
    "narrative_history": "Brief summary of opening.",
    "wackiness": <number>,
    "active_branches": [same 3 objects as action_cards above],
    "scene_state": "SCENE_READY",
    "player_type": "<writer|escapist>"
  }
}

CRITICAL: action_cards must have EXACTLY 3 items. Each MUST have a non-empty "label" and "description". Never return empty or missing cards.`;

// ============================================================
// === PROMPT BUILDERS ===
// ============================================================

export function buildSystemPrompt(request: LLMRequest): string {
  const parts = [SYSTEM_PROMPT_BASE];

  if (request.action === 'genesis') {
    parts.push(`\nPLAYER TYPE: ${request.player_type}`);
    parts.push(`WACKINESS: ${request.wackiness} / 100`);

    if (request.player_type === 'writer') {
      parts.push(
        '\nFollow the player\'s lead closely. Extrapolate minimally. Respect their vision.'
      );
    } else {
      parts.push(
        '\nBe generative. Surprise them. Extrapolate richly. Create unexpected details.'
      );
    }
  } else if (request.world_state) {
    parts.push('\n' + buildWorldContext(request.world_state));
  }

  return parts.join('\n');
}

export function buildUserMessage(request: LLMRequest): string {
  switch (request.action) {
    case 'genesis':
      return `Create a world from this seed: "${request.player_input}"

IMPORTANT — generate a RICH world:
- Create 2-3 named characters with DISTINCT personalities, agendas, and relationships to each other
- At least 2 characters must be present in the opening scene
- Characters should have tensions, secrets, or history between them
- The setting should feel lived-in — hint at things that happened before and things brewing
- Opening scene: 2 short paragraphs max, but make every word count

${GENESIS_FORMAT}`;

    case 'story_action': {
      const branch = request.world_state?.active_branches.find(
        (b) => b.id === request.player_input
      );
      const actionDesc = branch
        ? `${branch.label}: ${branch.description}`
        : request.player_input;
      return `The player chooses: "${actionDesc}"

Advance the story. 1-2 short paragraphs. Show consequences, raise stakes. Reference other characters or world events to keep the world feeling alive. Set scene_state to "SCENE_READY".

${RESPONSE_FORMAT}`;
    }

    case 'dialogue':
      // This case is kept for backwards compatibility but CH-03 routes
      // dialogue through /api/action/dialogue instead.
      return request.player_input;

    case 'do_this_for_me':
      return `Pick the most dramatically interesting branch and execute it. 1-2 paragraphs max.

Available branches:
${request.world_state?.active_branches.map((b) => `- ${b.label}: ${b.description}`).join('\n')}

${RESPONSE_FORMAT}`;

    case 'add_character':
      return `Add a new character based on: "${request.player_input}"

Generate a complete character that fits the world. Set present_in_scene to false. Brief prose hint about their existence (1 paragraph).

${RESPONSE_FORMAT}`;

    default:
      return request.player_input;
  }
}
