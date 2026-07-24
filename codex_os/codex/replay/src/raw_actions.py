import json
from pathlib import Path

RAW_ACTIONS_PATH = Path(__file__).parent.parent / "raw_actions" / "raw_actions.json"


def load_raw_actions() -> list[dict]:
    """Load the fixed replay battery of raw actions."""
    with open(RAW_ACTIONS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)