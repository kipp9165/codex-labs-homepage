use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReplayState {
    pub nonce: String,
    pub seen_nonces: Vec<String>,
    pub prevent_replay: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReplayEvaluation {
    pub is_replay: bool,
    pub allowed: bool,
    pub reason: String,
}

pub fn evaluate_replay(replay: &ReplayState) -> ReplayEvaluation {
    let is_replay = replay.seen_nonces.iter().any(|n| n == &replay.nonce);

    if !is_replay {
        return ReplayEvaluation {
            is_replay: false,
            allowed: true,
            reason: "nonce_not_seen".to_string(),
        };
    }

    if replay.prevent_replay {
        return ReplayEvaluation {
            is_replay: true,
            allowed: false,
            reason: "replay_prevented".to_string(),
        };
    }

    ReplayEvaluation {
        is_replay: true,
        allowed: true,
        reason: "replay_detected_not_blocked".to_string(),
    }
}
