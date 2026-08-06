use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Authority {
    pub actor: String,
    pub authorized: bool,
    pub revoked: bool,
}

impl Authority {
    pub fn is_valid(&self) -> bool {
        self.authorized && !self.revoked
    }
}
