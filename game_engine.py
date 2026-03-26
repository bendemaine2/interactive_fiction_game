import json
import random

from models import CharacterDef, CharacterState, ConversationResult, GameState
from llm import build_character_system_prompt, get_character_response, summarize_conversation


class GameEngine:
    def __init__(self, scenario_path, player_candidate):
        with open(scenario_path) as f:
            self.scenario = json.load(f)

        self.state = GameState(
            turn=0,
            max_turns=self.scenario["max_turns"],
            player_candidate=player_candidate,
        )

        # Load characters
        for char_id, char_data in self.scenario["characters"].items():
            char_def = CharacterDef(
                id=char_id,
                name=char_data["name"],
                title=char_data["title"],
                personality=char_data["personality"],
                public_knowledge=char_data["public_knowledge"],
                secret=char_data["secret"],
                motivation=char_data["motivation"],
                initial_disposition=char_data["initial_disposition"],
                persuadability=char_data["persuadability"],
                relationships=char_data["relationships"],
                gossip_tendency=char_data["gossip_tendency"],
                system_prompt_suffix=char_data["system_prompt_suffix"],
            )
            self.state.characters[char_id] = CharacterState(definition=char_def)

    def get_character_list(self):
        """Return list of (id, name, title) tuples."""
        return [
            (cid, cs.definition.name, cs.definition.title)
            for cid, cs in self.state.characters.items()
        ]

    def get_public_info(self, char_id):
        """Return public knowledge about a character."""
        cs = self.state.characters[char_id]
        return cs.definition.public_knowledge

    def get_disposition_impression(self, char_id):
        """Return a qualitative impression of a character's leanings."""
        cs = self.state.characters[char_id]
        impressions = []
        for candidate, score in cs.disposition.items():
            if score >= 4:
                desc = f"strongly favors {candidate}"
            elif score >= 2:
                desc = f"leans toward {candidate}"
            elif score >= 1:
                desc = f"seems slightly open to {candidate}"
            elif score <= -4:
                desc = f"deeply opposes {candidate}"
            elif score <= -2:
                desc = f"seems hostile toward {candidate}"
            elif score <= -1:
                desc = f"appears cool toward {candidate}"
            else:
                desc = f"is neutral on {candidate}"
            impressions.append(desc)
        return ", ".join(impressions)

    def converse(self, char_id, player_message):
        """Send a message to a character and get their response."""
        cs = self.state.characters[char_id]

        # Build system prompt
        system_prompt = build_character_system_prompt(
            character_def=cs.definition,
            disposition=cs.disposition,
            known_info=cs.known_info,
            candidates=self.scenario["candidates"],
            player_role=self.scenario["player_role"],
        )

        # Add player message to history
        cs.conversation_history.append({
            "role": "user",
            "content": player_message,
        })

        # Get response
        visible_text, internal_state = get_character_response(
            system_prompt, cs.conversation_history
        )

        # Add response to history
        cs.conversation_history.append({
            "role": "assistant",
            "content": visible_text,
        })

        # Apply disposition changes
        disp_change = internal_state.get("disposition_change", {})
        for candidate, change in disp_change.items():
            if candidate in cs.disposition:
                old = cs.disposition[candidate]
                cs.disposition[candidate] = max(-5, min(5, old + change))

        cs.has_been_visited = True

        return visible_text, disp_change

    def end_turn(self, char_id):
        """End a turn: consume a turn, propagate information. Returns gossip events."""
        self.state.turn += 1
        cs = self.state.characters[char_id]

        # Only propagate if there was meaningful conversation
        if len(cs.conversation_history) < 2:
            return []

        # Summarize what the player said
        summary = summarize_conversation(
            cs.definition.name, cs.conversation_history
        )

        if "nothing notable" in summary.lower():
            return []

        # Propagate based on gossip tendency
        gossip_events = []
        for target_id, relationship in cs.definition.relationships.items():
            if random.random() < cs.definition.gossip_tendency:
                target = self.state.characters[target_id]
                target.known_info.append({
                    "source": cs.definition.name,
                    "summary": summary,
                })
                gossip_events.append((
                    cs.definition.name,
                    target.definition.name,
                    summary,
                ))
                self.state.global_log.append(
                    f"Turn {self.state.turn}: {cs.definition.name} told "
                    f"{target.definition.name}: {summary}"
                )

        return gossip_events

    def is_game_over(self):
        return self.state.turn >= self.state.max_turns

    def conduct_vote(self):
        """Each character votes for the candidate they favor most."""
        votes = {}
        for char_id, cs in self.state.characters.items():
            # Vote for candidate with higher disposition
            candidates = list(cs.disposition.keys())
            if len(candidates) == 2:
                if cs.disposition[candidates[0]] > cs.disposition[candidates[1]]:
                    votes[cs.definition.name] = candidates[0]
                elif cs.disposition[candidates[1]] > cs.disposition[candidates[0]]:
                    votes[cs.definition.name] = candidates[1]
                else:
                    # Tie — go with initial leaning
                    init = cs.definition.initial_disposition
                    if init.get(candidates[0], 0) >= init.get(candidates[1], 0):
                        votes[cs.definition.name] = candidates[0]
                    else:
                        votes[cs.definition.name] = candidates[1]
        return votes

    def get_final_result(self):
        """Conduct vote and determine winner."""
        votes = self.conduct_vote()
        tally = {}
        for candidate in votes.values():
            tally[candidate] = tally.get(candidate, 0) + 1

        player_votes = tally.get(self.state.player_candidate, 0)
        won = player_votes >= 3

        return {
            "votes": votes,
            "tally": tally,
            "player_candidate": self.state.player_candidate,
            "won": won,
        }
