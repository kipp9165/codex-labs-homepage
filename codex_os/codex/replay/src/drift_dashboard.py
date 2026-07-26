from codex_os.codex.replay.src.drift_summary import summarize_receipts

def generate_dashboard(receipts_dir):
    summaries = summarize_receipts(receipts_dir)
    dashboard = []

    for s in summaries:
        dashboard.append(
            f"[{s['drift_id']}] {s['path']} — {s['risk_delta']} "
            f"(Disposition: {s['prior_disposition']} -> {s['new_disposition']})"
        )

    return "\n".join(dashboard)