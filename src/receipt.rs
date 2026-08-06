use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReceiptHashes {
    pub input_hash: String,
    pub canonical_hash: String,
    pub decision_hash: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Receipt {
    pub disposition: String,
    pub hashes: ReceiptHashes,
    pub drift_deltas: Vec<String>,
    pub replay_flag: bool,
    pub signature: String,
    pub verified: bool,
}
