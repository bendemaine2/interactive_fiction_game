from dataclasses import dataclass, field


@dataclass
class CharacterDef:
    """Immutable character definition loaded from scenario JSON."""
    id: str
    name: str
    title: str
    personality: str
    public_knowledge: str
    secret: str
    motivation: str
    initial_disposition: dict[str, int]
    persuadability: float
    relationships: dict[str, str]
    gossip_tendency: float
    system_prompt_suffix: str


@dataclass
class CharacterState:
    """Mutable per-game state for a character."""
    definition: CharacterDef
    disposition: dict[str, int] = field(default_factory=dict)
    conversation_history: list[dict] = field(default_factory=list)
    known_info: list[dict] = field(default_factory=list)
    has_been_visited: bool = False

    def __post_init__(self):
        if not self.disposition:
            self.disposition = dict(self.definition.initial_disposition)


@dataclass
class GameState:
    """Top-level game state."""
    turn: int = 0
    max_turns: int = 10
    player_candidate: str = ""
    characters: dict[str, CharacterState] = field(default_factory=dict)
    global_log: list[str] = field(default_factory=list)


@dataclass
class ConversationResult:
    """Result from a single turn of conversation."""
    response_text: str
    disposition_change: dict[str, int] = field(default_factory=dict)
    info_spread: list[tuple[str, str, str]] = field(default_factory=list)
