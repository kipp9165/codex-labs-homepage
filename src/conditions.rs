use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GovernedConditions {
    pub expected_fingerprint: String,
    pub current_fingerprint: String,
    pub expected_policy_version: String,
    pub current_policy_version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConditionEvaluation {
    pub ok: bool,
    pub drift_deltas: Vec<String>,
}

impl GovernedConditions {
    pub fn evaluate(&self) -> ConditionEvaluation {
        let mut drift_deltas = Vec::new();

        if self.expected_fingerprint != self.current_fingerprint {
            drift_deltas.push(format!(
                "fingerprint:{}->{}",
                self.expected_fingerprint, self.current_fingerprint
            ));
        }

        if self.expected_policy_version != self.current_policy_version {
            drift_deltas.push(format!(
                "policy_version:{}->{}",
                self.expected_policy_version, self.current_policy_version
            ));
        }

        ConditionEvaluation {
            ok: drift_deltas.is_empty(),
            drift_deltas,
        }
    }
}
