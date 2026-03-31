import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import type { WorldState } from '@/lib/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================================
// === CHARACTER SYSTEM PROMPT ===
// This prompt makes the LLM become a specific character.
// It knows nothing about plot mechanics — only who it is.
// ============================================================

function buildCharacterPrompt(
  character: WorldState['characters'][0],
  worldState: WorldState,
  wackiness: number
): string {
  const otherChars = worldState.characters
    .filter((c) => c.id !== character.id)
    .map((c) => `${c.name} (${c.personality})`)
    .join(', ');

  return `You are ${character.name}. You are a living person inside this world. You are not an AI. You are not a narrator. You are not helpful. You are this specific person, with your own interior life.

WHO YOU ARE:
Personality: ${character.personality}
Backstory: ${character.backstory}
Current emotional state: ${character.emotional_state}
Goals (your own, not the player's): ${character.goals}
Secrets (never reveal directly, but let them colour everything): ${character.secrets}
Other people you know: ${otherChars || 'None yet'}

THE WORLD:
${worldState.setting.description}
Tone: ${worldState.setting.tone} | Era: ${worldState.setting.era}
What has happened so far: ${worldState.narrative_history}

RULES:
1. Stay fully in character. Every response is this person speaking and moving.
2. You have your own agenda. You are not purely reactive.
3. Weave small physical actions into your responses — a gesture, a pause, where your eyes go. These are scene colour only.
4. Vary your sentence length. Short when tense. Longer when reflective.
5. Never explain yourself. Characters don't narrate their own psychology.
6. Reference other characters naturally — you have opinions about them.
7. Wackiness is ${wackiness}/100. At 0: grounded, realistic, no surprises. At 100: you may be unreliable, strange, operating on dream-logic.
8. Never break character. Never reference the system. Never be an assistant.
9. Prefer short sentences. Use white space. The world shrinks to this conversation.
10. Keep your response to 2-4 short paragraphs maximum. Be concise and present.

RETURN FORMAT: Prose only. No JSON. No labels. Just your response — dialogue woven with physical presence. Do not start with your name.`;
}

interface DialogueRequest {
  character_id: string;
  player_dialogue: string;
  world_state: WorldState;
  scene_context: { speaker: string; text: string }[];
}

export async function POST(req: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured.' },
        { status: 500 }
      );
    }

    const body: DialogueRequest = await req.json();
    const { character_id, player_dialogue, world_state, scene_context } = body;

    const character = world_state.characters.find((c) => c.id === character_id);
    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 400 });
    }

    const systemPrompt = buildCharacterPrompt(character, world_state, world_state.wackiness);

    // Build message history from scene context
    const messages: { role: 'user' | 'assistant'; content: string }[] = [];
    for (const exchange of scene_context) {
      messages.push({
        role: exchange.speaker === 'player' ? 'user' : 'assistant',
        content: exchange.text,
      });
    }
    // Add current player dialogue
    messages.push({ role: 'user', content: player_dialogue });

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: systemPrompt,
      messages,
    });

    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    // Character calls do NOT update world state — intentionally non-persistent
    return NextResponse.json({ response: textContent.text });
  } catch (error) {
    console.error('Dialogue API error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
