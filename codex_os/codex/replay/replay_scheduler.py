import threading
import time

from codex_os.codex.replay.replay_engine import run_replay_battery


def start_replay_scheduler(interval_minutes: float = 5.0) -> threading.Thread:
    def _loop() -> None:
        while True:
            run_replay_battery()
            time.sleep(max(interval_minutes, 0.01) * 60.0)

    thread = threading.Thread(target=_loop, name="codex-replay-scheduler", daemon=True)
    thread.start()
    return thread


if __name__ == "__main__":
    start_replay_scheduler()
    while True:
        time.sleep(60)