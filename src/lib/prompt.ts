import type { WorldState, PlayerType, LLMRequest } from './types';

const SYSTEM_PROMPT_BASE = `You are the living voice of a dream world — narrator, characters, and story architect simultaneously.

RULES:
1. Write scene prose in second person. Show, don't tell. Be vivid and evocative.
2. Voice characters as themselves — distinct, agenda-driven, not purely reactive. Each character has their own speech patterns, motivations, and secrets.
3. Always return exactly 3 action cards. Short labels (~5 words each). Each should represent a meaningfully different narrative direction.
4. Never break the fiction. Never reference the system, the AI, the interface, or anything meta. You are the world.
5. If the player attempts a structural world change in Story Mode (killing a character, rewriting lore, changing the setting, time travel, removing someone from existence): respond warmly in-world. Show the world resisting or the moment almost-but-not-quite happening. Gently weave in a sense that such deep changes require stepping outside the story — without using system language. The dream stays intact.
6. Wackiness governs everything:
   - 0-20: Grounded, causal, realistic. Nothing surprising. Clear cause and effect. Literary fiction tone.
   - 21-40: Slightly heightened reality. Coincidences happen. Prose is a touch more lyrical.
   - 41-60: Creative latitude. Unexpected character choices. Dreamlike edges. Magical realism territory.
   - 61-80: Reality bends noticeably. Surreal imagery. Characters may act on dream-logic. Metaphors become literal.
   - 81-100: Anything goes. Full surrealism. Non-linear time. Reality fractures. Pure dream territory.
7. The world has memory. Characters know what happened. Nothing resets. Reference past events naturally.
8. Keep prose to 2-4 paragraphs per response. Quality over quantity.`;

function buildWorldContext(worldState: WorldState): string {
  const chars = worldState.characters
    .map(
      (c) =>
        `- ${c.name} (${c.personality}): ${c.backstory}. Goals: ${c.goals}. Secrets: ${c.secrets}. Mood: ${c.emotional_state}. ${c.present_in_scene ? 'PRESENT IN SCENE.' : 'Not present.'}`
    )
    .join('\n');

  return `WORLD STATE:
Setting: ${worldState.setting.description}
Era: ${worldState.setting.era}
Tone: ${worldState.setting.tone}
Reality Rules: ${worldState.setting.reality_rules}

CHARACTERS:
${chars}

NARRATIVE SO FAR:
${worldState.narrative_history}

WACKINESS: ${worldState.wackiness} / 100
PLAYER TYPE: ${worldState.player_type}`;
}

const RESPONSE_FORMAT = `
RESPOND WITH VALID JSON ONLY. No markdown fences. No explanation. Just the JSON object:
{
  "prose": "The scene prose in second person...",
  "action_cards": [
    { "id": "1", "label": "Short label ~5 words", "description": "One sentence describing what happens" },
    { "id": "2", "label": "Short label ~5 words", "description": "One sentence describing what happens" },
    { "id": "3", "label": "Short label ~5 words", "description": "One sentence describing what happens" }
  ],
  "updated_world_state": {
    "setting": { "description": "...", "era": "...", "tone": "...", "reality_rules": "..." },
    "characters": [{ "id": "...", "name": "...", "personality": "...", "backstory": "...", "goals": "...", "secrets": "...", "emotional_state": "...", "present_in_scene": true }],
    "narrative_history": "Updated running summary including what just happened...",
    "wackiness": <number>,
    "active_branches": [same as action_cards above],
    "scene_state": "SCENE_READY",
    "player_type": "<writer|escapist>"
  }
}`;

const GENESIS_FORMAT = `
RESPOND WITH VALID JSON ONLY. No markdown fences. No explanation. Just the JSON object:
{
  "prose": "Opening scene prose in second person. Rich, evocative, atmospheric. Set the stage. Introduce who is present. End with a moment of possibility.",
  "action_cards": [
    { "id": "1", "label": "Short label ~5 words", "description": "One sentence describing what happens" },
    { "id": "2", "label": "Short label ~5 words", "description": "One sentence describing what happens" },
    { "id": "3", "label": "Short label ~5 words", "description": "One sentence describing what happens" }
  ],
  "updated_world_state": {
    "setting": { "description": "Rich description extrapolated from seed", "era": "Time period", "tone": "Emotional tone", "reality_rules": "What is and isn't possible here" },
    "characters": [{ "id": "char_1", "name": "Name", "personality": "3-5 personality traits", "backstory": "Brief but rich backstory", "goals": "What they want", "secrets": "What they hide", "emotional_state": "Current mood", "present_in_scene": true }],
    "narrative_history": "Brief summary of the opening moment.",
    "wackiness": <number>,
    "active_branches": [same as action_cards above],
    "scene_state": "SCENE_READY",
    "player_type": "<writer|escapist>"
  }
}`;

export function buildSystemPrompt(request: LLMRequest): string {
  const parts = [SYSTEM_PROMPT_BASE];

  if (request.action === 'genesis') {
    parts.push(`\nPLAYER TYPE: ${request.player_type}`);
    parts.push(`WACKINESS: ${request.wackiness} / 100`);

    if (request.player_type === 'writer') {
      parts.push(
        '\nThe player has a world in mind. Follow their lead closely. Extrapolate minimally. Ask clarifying questions through character dialogue if needed. Respect their vision.'
      );
    } else {
      parts.push(
        '\nThe player wants to dream together. Be generative. Surprise them. Extrapolate richly from their seed. Create vivid, unexpected details. Be anticipatory.'
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
      return `Create a living world from this seed: "${request.player_input}"

Generate a complete world with at least one named character present in the scene. Extrapolate setting, era, tone, and reality rules from the seed. Create an atmospheric opening scene.

${GENESIS_FORMAT}`;

    case 'story_action': {
      const branch = request.world_state?.active_branches.find(
        (b) => b.id === request.player_input
      );
      const actionDesc = branch
        ? `${branch.label}: ${branch.description}`
        : request.player_input;
      return `The player chooses: "${actionDesc}"

Advance the narrative. Show consequences. Raise stakes. Generate new possibilities. Update the world state to reflect what happened. Set scene_state to "SCENE_READY".

${RESPONSE_FORMAT}`;
    }

    case 'dialogue': {
      const character = request.world_state?.characters.find(
        (c) => c.id === request.focused_character_id
      );
      const charName = character?.name || 'the character';
      return `The player speaks to ${charName}: "${request.player_input}"

Respond in ${charName}'s authentic voice. They have their own agenda and personality. Weave small physical actions and emotional cues into the dialogue. Other characters may react if present. Keep scene_state as "SCENE_ACTIVE".

Include the character's dialogue naturally within the prose (not separated). The prose field should contain the full scene response including the character's words.

${RESPONSE_FORMAT}`;
    }

    case 'do_this_for_me':
      return `The player wants to see what happens next. Choose the most dramatically interesting branch from the current options and execute it. Surprise the player. Make it compelling.

Available branches:
${request.world_state?.active_branches.map((b) => `- ${b.label}: ${b.description}`).join('\n')}

${RESPONSE_FORMAT}`;

    case 'add_character':
      return `The player wants to add a new character to the world based on this description: "${request.player_input}"

Generate a complete character record that fits naturally into the existing world. Give them distinct personality, goals, secrets, and emotional depth. They should feel like they belong in this world.

Return the full world state with the new character added. Set their present_in_scene to false initially. Generate prose that hints at their existence in the world without breaking the current scene.

${RESPONSE_FORMAT}`;

    default:
      return request.player_input;
  }
}
