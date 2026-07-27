import sys
from pathlib import Path

import uvicorn

if __package__ is None or __package__ == "":
    sys.path.append(str(Path(__file__).resolve().parents[1]))

from codex_os.codex.replay import replay_scheduler

def launch_service():
    replay_scheduler.start_replay_scheduler(interval_minutes=0.05)
    uvicorn.run(
        "service.codex_os_service:app",
        host="0.0.0.0",
        port=8080,
        reload=False
    )

if __name__ == "__main__":
    launch_service()