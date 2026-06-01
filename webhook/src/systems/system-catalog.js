export const SYSTEM_CATALOG = Object.freeze([
  { id: "safety_os", layer: "core" },
  { id: "lifecheck_subsystem", layer: "sentinel" },
  { id: "environmental_sentinel", layer: "sentinel" },
  { id: "child_sentinel", layer: "sentinel" },
  { id: "animal_sentinel", layer: "sentinel" },
  { id: "plant_sentinel", layer: "sentinel" },
  { id: "appliance_sentinel", layer: "sentinel" },
  { id: "lawn_property_sentinel", layer: "sentinel" },
  { id: "freezeguard", layer: "guardian" },
  { id: "homeguardian", layer: "guardian" },
  { id: "emergency_mesh", layer: "mesh" },
  { id: "identity_os_integration", layer: "integration" },
  { id: "sovereign_os_integration", layer: "integration" },
  { id: "health_os_seed_layer", layer: "seed" },
]);

export function listSystemIds() {
  return SYSTEM_CATALOG.map((entry) => entry.id);
}
