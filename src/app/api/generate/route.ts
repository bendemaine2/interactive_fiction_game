import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, buildUserMessage } from '@/lib/prompt';
import type { LLMRequest, LLMResponse } from '@/lib/types';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function repairTruncatedJSON(text: string): string {
  // Try to close any unclosed brackets/braces from a truncated response
  let cleaned = text.trim();
  // Remove trailing comma
  cleaned = cleaned.replace(/,\s*$/, '');

  const opens: string[] = [];
  let inString = false;
  let escape = false;
  for (const ch of cleaned) {
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{' || ch === '[') opens.push(ch);
    if (ch === '}' || ch === ']') opens.pop();
  }

  // Close any remaining open brackets
  while (opens.length > 0) {
    const open = opens.pop();
    cleaned += open === '{' ? '}' : ']';
  }
  return cleaned;
}

function parseJSON(text: string): LLMResponse {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {
    // Try extracting JSON from markdown fences or surrounding text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // Try repairing truncated JSON
        return JSON.parse(repairTruncatedJSON(jsonMatch[0]));
      }
    }
    // Last resort: try repairing the whole text
    try {
      return JSON.parse(repairTruncatedJSON(text));
    } catch {
      throw new Error('Could not parse LLM response as JSON');
    }
  }
}

async function callClaude(request: LLMRequest, retryCount = 0): Promise<LLMResponse> {
  const systemPrompt = buildSystemPrompt(request);
  const userMessage = buildUserMessage(request);

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: request.action === 'genesis' ? 2500 : 1500,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in LLM response');
    }

    return parseJSON(textContent.text);
  } catch (error) {
    if (retryCount < 1) {
      return callClaude(request, retryCount + 1);
    }
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured. Add it to your .env.local file.' },
        { status: 500 }
      );
    }

    const body: LLMRequest = await req.json();

    if (!body.action || !body.player_type) {
      return NextResponse.json(
        { error: 'Missing required fields: action, player_type' },
        { status: 400 }
      );
    }

    const response = await callClaude(body);

    // Always sync active_branches from action_cards so cards never go stale
    if (response.action_cards && response.updated_world_state) {
      response.updated_world_state.active_branches = response.action_cards;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Generate API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
