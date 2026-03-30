import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, buildUserMessage } from '@/lib/prompt';
import type { LLMRequest, LLMResponse } from '@/lib/types';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function parseJSON(text: string): LLMResponse {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {
    // Try extracting JSON from markdown fences or surrounding text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Could not parse LLM response as JSON');
  }
}

async function callClaude(request: LLMRequest, retryCount = 0): Promise<LLMResponse> {
  const systemPrompt = buildSystemPrompt(request);
  const userMessage = buildUserMessage(request);

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
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
    return NextResponse.json(response);
  } catch (error) {
    console.error('Generate API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
