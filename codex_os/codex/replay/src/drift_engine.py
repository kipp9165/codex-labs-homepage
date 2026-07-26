from drift_summary import summarize_receipts
from codex_os.codex.replay.src.drift_dashboard import generate_dashboard

def run_drift_engine(receipts_dir):
    summary = summarize_receipts(receipts_dir)
    dashboard = generate_dashboard(receipts_dir)
    return {
        "summary": summary,
        "dashboard": dashboard
    }