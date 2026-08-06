use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoutePolicy {
    pub primary_route: String,
    pub requested_route: String,
    pub alternate_allowed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RouteEvaluation {
    pub ok: bool,
    pub used_route: String,
    pub reason: String,
}

pub fn check_route(policy: &RoutePolicy) -> RouteEvaluation {
    if policy.requested_route == policy.primary_route {
        return RouteEvaluation {
            ok: true,
            used_route: policy.primary_route.clone(),
            reason: "requested_route_matches_primary".to_string(),
        };
    }

    if policy.alternate_allowed {
        return RouteEvaluation {
            ok: true,
            used_route: policy.requested_route.clone(),
            reason: "alternate_route_allowed".to_string(),
        };
    }

    RouteEvaluation {
        ok: false,
        used_route: policy.primary_route.clone(),
        reason: "alternate_route_denied".to_string(),
    }
}
