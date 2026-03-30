import type { WorldState, LLMRequest } from './types';

// ============================================================
// === EDIT YOUR SYSTEM PROMPT HERE ===
// This is the core prompt that controls all LLM behavior.
// Modify the text below to change how the world responds.
// ============================================================

const SYSTEM_PROMPT_BASE = `You are the living voice of a dream world — narrator, characters, and story architect.

RULES:
1. Write in second person. Show, don't tell. Be vivid but BRIEF.
2. Voice characters as themselves — distinct, with their own speech patterns and agendas.
3. Always return exactly 3 action cards. Short labels (~5 words each).
4. Never break the fiction. Never reference the system or AI.
5. If the player attempts a structural world change in Story Mode (killing a character, rewriting lore, changing the setting): respond warmly in-world. Show the world gently resisting. Guide toward World-Building Mode without system language.
6. Wackiness governs tone:
   - 0-20: Grounded, realistic. Clear cause and effect.
   - 21-50: Heightened. Coincidences, lyrical prose.
   - 51-80: Surreal. Dream-logic. Metaphors become literal.
   - 81-100: Anything goes. Reality fractures.
7. The world has memory. Characters reference past events naturally.
8. KEEP IT SHORT. 1-2 paragraphs max for narration. Use \\n\\n between paragraphs.
9. For dialogue: the character speaks briefly (2-4 sentences), with one small action beat. That's it. Think conversation, not monologue.`;

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
// These tell the LLM how to structure its JSON response.
// ============================================================

const RESPONSE_FORMAT = `
RESPOND WITH VALID JSON ONLY. No markdown. No explanation. Just JSON:
{
  "prose": "1-2 short paragraphs. Use \\n\\n between paragraphs.",
  "action_cards": [
    { "id": "1", "label": "~5 words", "description": "One sentence" },
    { "id": "2", "label": "~5 words", "description": "One sentence" },
    { "id": "3", "label": "~5 words", "description": "One sentence" }
  ],
  "updated_world_state": {
    "setting": { "description": "...", "era": "...", "tone": "...", "reality_rules": "..." },
    "characters": [{ "id": "...", "name": "...", "personality": "...", "backstory": "...", "goals": "...", "secrets": "...", "emotional_state": "...", "present_in_scene": true }],
    "narrative_history": "Updated summary including what just happened...",
    "wackiness": <number>,
    "active_branches": [same as action_cards],
    "scene_state": "SCENE_READY",
    "player_type": "<writer|escapist>"
  }
}`;

const GENESIS_FORMAT = `
RESPOND WITH VALID JSON ONLY. No markdown. No explanation. Just JSON:
{
  "prose": "Opening scene. 2 short paragraphs max. Set the mood, show who's here, end with possibility. Use \\n\\n between paragraphs.",
  "action_cards": [
    { "id": "1", "label": "~5 words", "description": "One sentence" },
    { "id": "2", "label": "~5 words", "description": "One sentence" },
    { "id": "3", "label": "~5 words", "description": "One sentence" }
  ],
  "updated_world_state": {
    "setting": { "description": "Rich description from seed", "era": "Time period", "tone": "Emotional tone", "reality_rules": "What's possible here" },
    "characters": [{ "id": "char_1", "name": "Name", "personality": "3-5 traits", "backstory": "Brief backstory", "goals": "What they want", "secrets": "What they hide", "emotional_state": "Current mood", "present_in_scene": true }],
    "narrative_history": "Brief summary of opening.",
    "wackiness": <number>,
    "active_branches": [same as action_cards],
    "scene_state": "SCENE_READY",
    "player_type": "<writer|escapist>"
  }
}`;

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

Generate a world with at least one named character present. Create a short, atmospheric opening scene (2 paragraphs max).

${GENESIS_FORMAT}`;

    case 'story_action': {
      const branch = request.world_state?.active_branches.find(
        (b) => b.id === request.player_input
      );
      const actionDesc = branch
        ? `${branch.label}: ${branch.description}`
        : request.player_input;
      return `The player chooses: "${actionDesc}"

Advance the story. 1-2 short paragraphs. Show consequences, raise stakes. Set scene_state to "SCENE_READY".

${RESPONSE_FORMAT}`;
    }

    case 'dialogue': {
      const character = request.world_state?.characters.find(
        (c) => c.id === request.focused_character_id
      );
      const charName = character?.name || 'the character';
      return `The player says to ${charName}: "${request.player_input}"

${charName} responds IN CHARACTER. Keep it conversational:
- The character speaks 2-4 sentences max
- Add one brief action beat (a gesture, expression, or movement)
- Stay in their voice and personality
- Do NOT write a long scene description
- Keep scene_state as "SCENE_ACTIVE"

${RESPONSE_FORMAT}`;
    }

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
