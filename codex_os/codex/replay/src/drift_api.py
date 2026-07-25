from drift_engine import run_drift_engine
from pathlib import Path

def get_drift_state():
    receipts_dir = Path(__file__).parent.parent / "receipts"
    return run_drift_engine(receipts_dir)