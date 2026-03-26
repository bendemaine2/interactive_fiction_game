#!/usr/bin/env python3
"""Interactive Fiction Game — CLI entry point."""

import sys
import os

from game_engine import GameEngine

# ANSI colors
BOLD = "\033[1m"
DIM = "\033[2m"
CYAN = "\033[36m"
YELLOW = "\033[33m"
GREEN = "\033[32m"
RED = "\033[31m"
MAGENTA = "\033[35m"
RESET = "\033[0m"


def print_banner():
    print(f"""
{BOLD}{'='*60}
       THE SUCCESSION CRISIS
       An Interactive Political Drama
{'='*60}{RESET}
""")


def print_scenario_intro(scenario):
    print(f"{DIM}{scenario['description']}{RESET}")
    print()
    print(f"{CYAN}{scenario['player_role']}{RESET}")
    print()


def choose_candidate(candidates):
    print(f"{BOLD}Choose your candidate:{RESET}")
    for i, c in enumerate(candidates, 1):
        print(f"  {i}. {c}")
    while True:
        choice = input(f"\n{YELLOW}Your choice (1-{len(candidates)}): {RESET}").strip()
        try:
            idx = int(choice) - 1
            if 0 <= idx < len(candidates):
                print(f"\n{GREEN}You have chosen to support {candidates[idx]}.{RESET}")
                return candidates[idx]
        except ValueError:
            pass
        print("Invalid choice. Try again.")


def print_court_overview(engine):
    print(f"\n{BOLD}{'─'*60}")
    print(f"  THE ROYAL COUNCIL")
    print(f"{'─'*60}{RESET}")
    for cid, name, title in engine.get_character_list():
        print(f"\n  {BOLD}{name}{RESET} — {title}")
        print(f"  {DIM}{engine.get_public_info(cid)}{RESET}")
    print(f"\n{BOLD}{'─'*60}{RESET}")


def print_status(engine):
    turns_left = engine.state.max_turns - engine.state.turn
    print(f"\n{YELLOW}━━━ Turn {engine.state.turn + 1}/{engine.state.max_turns} ({turns_left} remaining) ━━━{RESET}")
    print(f"\n{BOLD}Your read on the council:{RESET}")
    for cid, name, title in engine.get_character_list():
        impression = engine.get_disposition_impression(cid)
        visited = " (visited)" if engine.state.characters[cid].has_been_visited else ""
        print(f"  {name}{DIM}{visited}{RESET}: {impression}")


def choose_character(engine):
    chars = engine.get_character_list()
    print(f"\n{BOLD}Who would you like to visit?{RESET}")
    for i, (cid, name, title) in enumerate(chars, 1):
        print(f"  {i}. {name} — {title}")
    print(f"  {DIM}Type 'status' to review the court, or 'quit' to end{RESET}")

    while True:
        choice = input(f"\n{YELLOW}Your choice: {RESET}").strip().lower()
        if choice == "quit":
            return None
        if choice == "status":
            print_status(engine)
            continue
        try:
            idx = int(choice) - 1
            if 0 <= idx < len(chars):
                return chars[idx][0]
        except ValueError:
            pass
        print("Invalid choice. Enter a number, 'status', or 'quit'.")


def run_conversation(engine, char_id):
    cs = engine.state.characters[char_id]
    name = cs.definition.name
    title = cs.definition.title

    print(f"\n{BOLD}{'─'*60}")
    print(f"  You approach {name}, {title}.")
    print(f"{'─'*60}{RESET}")
    if cs.has_been_visited:
        print(f"{DIM}  (You have spoken before. They remember your previous conversations.){RESET}")
    print(f"\n{DIM}  Type 'leave' to end the conversation.{RESET}\n")

    while True:
        player_input = input(f"{GREEN}You: {RESET}").strip()
        if not player_input:
            continue
        if player_input.lower() == "leave":
            print(f"\n{DIM}You bow and take your leave of {name}.{RESET}")
            break

        try:
            response, disp_change = engine.converse(char_id, player_input)
        except Exception as e:
            print(f"\n{RED}[Error communicating with the character: {e}]{RESET}")
            print(f"{DIM}Try again or type 'leave' to exit.{RESET}\n")
            # Remove the failed message from history
            if cs.conversation_history and cs.conversation_history[-1]["role"] == "user":
                cs.conversation_history.pop()
            continue

        print(f"\n{MAGENTA}{name}:{RESET} {response}\n")


def show_gossip(gossip_events):
    if not gossip_events:
        return
    print(f"\n{YELLOW}{'─'*60}")
    print(f"  Word travels through the court...")
    print(f"{'─'*60}{RESET}")
    for source, target, summary in gossip_events:
        print(f"  {DIM}• {target} has heard something from {source}.{RESET}")
    print()


def show_results(engine):
    result = engine.get_final_result()

    print(f"\n\n{BOLD}{'='*60}")
    print(f"       THE VOTE IS CALLED")
    print(f"{'='*60}{RESET}\n")

    print(f"{DIM}The council members rise one by one to cast their votes...{RESET}\n")

    for name, candidate in result["votes"].items():
        color = GREEN if candidate == result["player_candidate"] else RED
        print(f"  {BOLD}{name}{RESET} votes for {color}{candidate}{RESET}")

    print(f"\n{BOLD}{'─'*60}{RESET}")
    print(f"\n{BOLD}Final Tally:{RESET}")
    for candidate, count in result["tally"].items():
        print(f"  {candidate}: {count} votes")

    print()
    if result["won"]:
        print(f"{GREEN}{BOLD}  VICTORY! {result['player_candidate']} takes the throne!{RESET}")
        print(f"  {DIM}Your influence shaped the fate of the realm.{RESET}")
    else:
        print(f"{RED}{BOLD}  DEFEAT. {result['player_candidate']} did not receive enough votes.{RESET}")
        print(f"  {DIM}The court proved more stubborn than you hoped.{RESET}")

    print(f"\n{BOLD}{'='*60}{RESET}\n")

    # Show final dispositions for learning
    print(f"{DIM}Final character dispositions:{RESET}")
    for cid, cs in engine.state.characters.items():
        disp_str = ", ".join(f"{c}: {s}" for c, s in cs.disposition.items())
        print(f"  {DIM}{cs.definition.name}: {disp_str}{RESET}")
    print()


def main():
    scenario_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "scenarios",
        "succession_crisis.json",
    )

    if not os.path.exists(scenario_path):
        print(f"{RED}Scenario file not found: {scenario_path}{RESET}")
        sys.exit(1)

    print_banner()

    # Load scenario for intro
    import json
    with open(scenario_path) as f:
        scenario = json.load(f)

    print_scenario_intro(scenario)
    candidate = choose_candidate(scenario["candidates"])

    # Initialize engine
    engine = GameEngine(scenario_path, candidate)

    print_court_overview(engine)

    # Main game loop
    while not engine.is_game_over():
        print_status(engine)

        char_id = choose_character(engine)
        if char_id is None:
            confirm = input(f"{YELLOW}End the game early? (y/n): {RESET}").strip().lower()
            if confirm == "y":
                break
            continue

        run_conversation(engine, char_id)
        gossip_events = engine.end_turn(char_id)
        show_gossip(gossip_events)

    # Final vote
    show_results(engine)


if __name__ == "__main__":
    main()
