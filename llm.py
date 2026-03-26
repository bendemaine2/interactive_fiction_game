import json
import re

import anthropic

MODEL = "claude-sonnet-4-20250514"
client = anthropic.Anthropic()

INTERNAL_BLOCK_PATTERN = re.compile(
    r"\[INTERNAL\](.*?)\[/INTERNAL\]", re.DOTALL
)


def build_character_system_prompt(
    character_def,
    disposition,
    known_info,
    candidates,
    player_role,
):
    """Build the full system prompt for a character."""
    info_section = ""
    if known_info:
        rumors = "\n".join(
            f"- You heard from {item['source']}: {item['summary']}"
            for item in known_info
        )
        info_section = f"\n\nThings you have heard through court gossip:\n{rumors}"

    disposition_desc = ", ".join(
        f"{c}: {d}" for c, d in disposition.items()
    )

    return f"""You are playing the role of {character_def.name}, {character_def.title}, in an interactive political drama.

CHARACTER BACKGROUND:
{character_def.personality}

PUBLIC REPUTATION: {character_def.public_knowledge}

YOUR SECRET (never reveal this directly, but let it influence your behavior): {character_def.secret}

YOUR MOTIVATION: {character_def.motivation}

{character_def.system_prompt_suffix}

CURRENT POLITICAL LEANINGS (scale of -5 to +5): {disposition_desc}
These numbers represent your private feelings. Do NOT state numbers. Express your leanings naturally through dialogue.

The person speaking to you is: {player_role}
The two candidates for the throne are: {', '.join(candidates)}.
{info_section}

RULES:
- Stay fully in character at all times.
- Respond naturally as this character would — with their speech patterns, personality, and biases.
- Your responses should be 2-4 paragraphs. Be vivid and characterful, not verbose.
- React realistically to what the player says. If they are persuasive, show it subtly. If they are clumsy, show irritation or amusement.
- At the END of your response, include a hidden block that the player won't see:

[INTERNAL]
{{"disposition_change": {{"Prince Aldric": 0, "Duchess Elara": 0}}, "mood": "your current mood"}}
[/INTERNAL]

The disposition_change values should be -2, -1, 0, +1, or +2 based on how this conversation shifted your feelings. Only change if the player said something genuinely compelling or offensive regarding a candidate. Most interactions should be 0. Be a tough audience — persuadability {character_def.persuadability:.1f}/1.0."""


def get_character_response(system_prompt, messages):
    """Call Claude API and return (visible_text, internal_state)."""
    response = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        system=system_prompt,
        messages=messages,
    )
    full_text = response.content[0].text

    # Extract internal block
    internal_state = {"disposition_change": {}, "mood": "neutral"}
    match = INTERNAL_BLOCK_PATTERN.search(full_text)
    if match:
        try:
            internal_state = json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass

    # Remove internal block from visible text
    visible_text = INTERNAL_BLOCK_PATTERN.sub("", full_text).strip()

    return visible_text, internal_state


def summarize_conversation(character_name, messages):
    """Summarize a conversation for gossip propagation."""
    conversation_text = "\n".join(
        f"{'Player' if m['role'] == 'user' else character_name}: {m['content']}"
        for m in messages[-6:]  # Last 3 exchanges
    )

    response = client.messages.create(
        model=MODEL,
        max_tokens=100,
        system="Summarize the key claim or information the player shared in this conversation in one sentence. Focus on politically relevant content — promises, accusations, secrets revealed, or arguments made. If nothing significant was said, respond with 'nothing notable'.",
        messages=[{"role": "user", "content": conversation_text}],
    )
    return response.content[0].text.strip()
