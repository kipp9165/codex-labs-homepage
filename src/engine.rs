use std::collections::BTreeMap;
use std::error::Error;
use std::fs;
use std::path::Path;

use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::{Digest, Sha256};

use crate::authority::Authority;
use crate::conditions::{ConditionEvaluation, GovernedConditions};
use crate::receipt::{Receipt, ReceiptHashes};
use crate::replay::{evaluate_replay, ReplayEvaluation, ReplayState};
use crate::routes::{check_route, RouteEvaluation, RoutePolicy};
use crate::signing::{sign_payload, verify_signature};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SigningInput {
    pub enabled: bool,
    pub private_key_hex: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScenarioInput {
    pub scenario_name: String,
    pub action: String,
    pub authority: Authority,
    pub governed_conditions: GovernedConditions,
    pub routes: RoutePolicy,
    pub replay: ReplayState,
    #[serde(default)]
    pub signing: SigningInput,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScenarioTrace {
    pub scenario_name: String,
    pub action: String,
    pub authority_valid: bool,
    pub conditions: ConditionEvaluation,
    pub route: RouteEvaluation,
    pub replay: ReplayEvaluation,
    pub disposition: String,
    pub hashes: ReceiptHashes,
    pub public_key: String,
}

fn canonicalize_value(value: &Value) -> Value {
    match value {
        Value::Object(map) => {
            let mut sorted = BTreeMap::new();
            for (k, v) in map {
                sorted.insert(k.clone(), canonicalize_value(v));
            }

            let mut canonical_map = serde_json::Map::new();
            for (k, v) in sorted {
                canonical_map.insert(k, v);
            }
            Value::Object(canonical_map)
        }
        Value::Array(arr) => Value::Array(arr.iter().map(canonicalize_value).collect()),
        _ => value.clone(),
    }
}

fn sha256_hex(input: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(input);
    hex::encode(hasher.finalize())
}

fn determine_disposition(
    authority_valid: bool,
    conditions_ok: bool,
    route_ok: bool,
    replay_allowed: bool,
    replay_flag: bool,
) -> String {
    if !authority_valid {
        return "REFUSED_AUTHORITY_REVOKED".to_string();
    }

    if !conditions_ok {
        return "REFUSED_CONDITIONS_CHANGED".to_string();
    }

    if !route_ok {
        return "REFUSED_ALT_ROUTE".to_string();
    }

    if !replay_allowed {
        return "REFUSED_REPLAY_PREVENTED".to_string();
    }

    if replay_flag {
        return "ADMISSIBLE_REPLAY_DETECTED".to_string();
    }

    "ADMISSIBLE".to_string()
}

pub fn run_scenario(input_path: &str, output_dir: &str) -> Result<(), Box<dyn Error>> {
    let input_bytes = fs::read(input_path)?;
    let input_value: Value = serde_json::from_slice(&input_bytes)?;
    let scenario: ScenarioInput = serde_json::from_slice(&input_bytes)?;

    let canonical_value = canonicalize_value(&input_value);
    let canonical_json = serde_json::to_string(&canonical_value)?;

    let input_hash = sha256_hex(&input_bytes);
    let canonical_hash = sha256_hex(canonical_json.as_bytes());

    let authority_valid = scenario.authority.is_valid();
    let conditions = scenario.governed_conditions.evaluate();
    let route = check_route(&scenario.routes);
    let replay = evaluate_replay(&scenario.replay);

    let disposition = determine_disposition(
        authority_valid,
        conditions.ok,
        route.ok,
        replay.allowed,
        replay.is_replay,
    );

    let decision_seed = format!(
        "{}|{}|{}|{}|{}",
        canonical_hash, disposition, authority_valid, route.reason, replay.reason
    );
    let decision_hash = sha256_hex(decision_seed.as_bytes());

    let hashes = ReceiptHashes {
        input_hash,
        canonical_hash,
        decision_hash,
    };

    let (signature, public_key) = sign_payload(
        decision_seed.as_bytes(),
        scenario.signing.private_key_hex.as_deref(),
    )
    .map_err(|e| format!("signing failed: {e}"))?;

    let verified = verify_signature(decision_seed.as_bytes(), &signature, &public_key);

    let receipt = Receipt {
        disposition: disposition.clone(),
        hashes: hashes.clone(),
        drift_deltas: conditions.drift_deltas.clone(),
        replay_flag: replay.is_replay,
        signature,
        verified,
    };

    let trace = ScenarioTrace {
        scenario_name: scenario.scenario_name.clone(),
        action: scenario.action.clone(),
        authority_valid,
        conditions,
        route,
        replay,
        disposition: disposition.clone(),
        hashes,
        public_key,
    };

    fs::create_dir_all(output_dir)?;
    let receipt_path = Path::new(output_dir).join("receipt.json");
    let trace_path = Path::new(output_dir).join("trace.json");

    fs::write(&receipt_path, serde_json::to_vec_pretty(&receipt)?)?;
    fs::write(&trace_path, serde_json::to_vec_pretty(&trace)?)?;

    println!("scenario={}", scenario.scenario_name);
    println!("action={}", scenario.action);
    println!("disposition={}", disposition);
    println!("receipt={}", receipt_path.display());
    println!("trace={}", trace_path.display());

    Ok(())
}
